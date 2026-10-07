/* 录制：getDisplayMedia 抓屏幕 → canvas 叠加摄像头气泡 → canvas.captureStream() → MediaRecorder
   存本地 WebM，零上传。

   与 Excalicord 的差异：它的底衬是 Excalidraw 画布，可以直接 drawImage；
   我们的幻灯片里含网页与 PDF（跨域 iframe 无法栅格化），所以**画面层用屏幕捕获流**，
   canvas 只负责把摄像头气泡与 REC 指示叠上去，再由 captureStream 录成视频。

   关键点：录的是 canvas.captureStream()，不是原始屏幕轨 —— 否则气泡不会被录进去。 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('recCanvas'), ctx = canvas.getContext('2d');

  var R = {
    panel: $('recPanel'), prev: $('rpPrev'), camSrc: $('camSrc'), camOff: $('rpCamOff'),
    cam: $('rpCam'), mic: $('rpMic'), level: $('rpLevel'), pos: 'br',
    bar: $('recBar'), time: $('recTime'),
    done: $('recDone'), info: $('recInfo'), prevOut: $('rdPrev'), note: $('rpNote'),
    count: $('recCount'),
    pip: $('recPip'), pipVideo: $('pipVideo'), pipTime: $('pipTime'),
    screenSrc: $('screenSrc'),
    slide: $('slide'), stage: $('stage'), frame: $('frame'),
    camDevice: $('rpCamDevice'), micDevice: $('rpMicDevice'),
    size: $('rpSize'), sizeVal: $('rpSizeVal'), shape: $('rpShape'),
    fs: $('rpFs')
  };

  var st = {
    screen: null, cam: null, mic: null,
    rec: null, chunks: [], blobUrl: null,
    raf: 0, timer: 0, t0: 0, busy: false, recording: false,
    composite: false, actx: null,
    /* mode='canvas'：图卡页直接把 <img> 画进画布（excalicord 的做法），
       不共享屏幕 —— 没有浏览器提示条、没有白边、头像想要多大画多大。
       mode='screen'：网页 / PDF 卡（iframe 跨域画不进画布）退回屏幕共享。 */
    mode: 'screen',
    slideReady: false,
    camSize: 260, camShape: 'circle',
    camDeviceId: '', micDeviceId: ''
  };

  var NOTE_DEF = R.note.innerHTML;

  /* 图片卡片走画布合成时的面板说明（区别于退回屏幕共享的网页 / 文档卡）。 */
  var NOTE_CANVAS = '<b>图片卡片走「画布合成」</b>：成片 = 图卡满屏 + 你的头像，'
    + '<b>不共享屏幕</b>，所以没有浏览器提示条、没有白边。'
    + '头像大小和位置由下面几项直接控制（默认 260px，可拉到 420px）。'
    + '录制中右下角小窗是<b>实时预览</b>，不会进成片。'
    + '开始前有 <b>3 秒倒计时</b>，要停按 <b>R</b> 或 <b>Esc</b>。';

  /* ---------- 纯净录制模式 ----------
     光靠 CSS class 不够稳：录制中用户鼠标一动，deck.js 的 mousemove 会重新
     加 awake，浏览器/扩展也可能重算样式。这里在录制期间直接给这些元素写内联
     display:none（内联优先级高于任何 class 规则），录完再原样恢复。 */
  var CLEAN_SEL = '.hud,.nav,#fsBig,#recBar,.tips,#webHint,.strip,#blocked';
  var savedDisplay = null;

  function setCleanMode(on) {
    document.body.classList.toggle('recording-clean', !!on);
    /* PIP 小窗**不能**隐藏：它是用户录制时唯一能看到自己的地方，而且
       camSource() 正是靠这个可见的 video 取帧 —— 藏了就不再送帧，头像会消失。
       bare（去边框/去 REC/去时长）只在**屏幕模式**下需要：PIP 在屏幕上会被
       屏幕流一起录进成片，装饰会出现在片子里。画布模式下 PIP 只是预览，
       成片头像由画布画，PIP 带着边框也没关系，反而更醒目。 */
    if (R.pip) R.pip.classList.toggle('pip-bare', !!on && st.mode === 'screen');
    var els = document.querySelectorAll(CLEAN_SEL);
    if (on) {
      savedDisplay = [];
      for (var i = 0; i < els.length; i++) {
        savedDisplay.push([els[i], els[i].style.display]);
        els[i].style.setProperty('display', 'none', 'important');
      }
      document.body.classList.remove('awake');
    } else if (savedDisplay) {
      for (var j = 0; j < savedDisplay.length; j++) {
        savedDisplay[j][0].style.display = savedDisplay[j][1];
      }
      savedDisplay = null;
    }
  }
  function countdown(n) {
    return new Promise(function (resolve) {
      if (!R.count) { resolve(); return; }
      var i = n;
      function step() {
        if (i <= 0) { R.count.hidden = true; resolve(); return; }
        R.count.querySelector('span').textContent = i;
        R.count.hidden = false;
        i--;
        setTimeout(step, 1000);
      }
      step();
    });
  }

  /* ---------- 录制中的摄像头小窗 ---------- */
  function pipSync() {
    if (!R.pip) return;
    var on = R.cam.checked && st.cam;
    R.pip.hidden = !on;
    if (!on) return;
    R.pipVideo.srcObject = st.cam;
    R.pip.classList.toggle('square', st.camShape === 'square');
    /* 位置与大小必须和 draw() 里画的气泡用**同一套公式**，否则会出现重影：
       PIP 显示在屏幕上 → 被屏幕流一起录进画布 → 画布又在气泡位置画一遍摄像头，
       两个头像错开一点点就是明显的双影。
       draw() 用的是「半径 r + 边距 min(w,h)*3%」，这里换算成屏幕像素后必须一致，
       所以 PIP 的 left/top 也要按「直径 + 边距」算，而不是用 right/bottom 贴边。 */
    /* 上限跟滑块一致（420），否则拉到最大时预览比成片小一圈 */
    var d = Math.round(Math.max(64, Math.min(420, st.camSize)));
    /* 用「屏幕流的高」而不是视口高来算纵向位置：PIP 是靠被屏幕流录进成片
       才成为成片头像的，所以必须落在流的范围内。视口（浏览器窗口）通常比
       屏幕流（整个屏幕）矮，按视口贴底算出来的 PIP 可能整个掉到录制区域外，
       成片里就直接没有头像了。st.screenH 在拿到屏幕流后由 start() 写入。 */
    var vw = window.innerWidth;
    var vh = st.screenH || window.innerHeight;
    var pad = Math.round(Math.min(vw, vh) * 0.03);
    var r = Math.round(d / 2);
    /* 再夹一次，保证整块 PIP 都在流的可见范围内 */
    var cx = (R.pos === 'bl' || R.pos === 'tl') ? r + pad : vw - r - pad;
    var cy = (R.pos === 'tr' || R.pos === 'tl') ? r + pad : vh - r - pad;
    cx = Math.max(r, Math.min(vw - r, cx));
    cy = Math.max(r, Math.min(vh - r, cy));
    R.pip.style.width = d + 'px';
    R.pip.style.height = d + 'px';
    R.pip.style.left = (cx - r) + 'px';
    R.pip.style.top = (cy - r) + 'px';
    R.pip.style.right = '';
    R.pip.style.bottom = '';
    if (!R.pip.querySelector('.pip-rec')) {
      var dot = document.createElement('i');
      dot.className = 'pip-rec';
      R.pip.appendChild(dot);
    }
  }

  /* ---------- 摄像头 ---------- */
  function openCam(deviceId) {
    if (!deviceId && st.cam) return Promise.resolve(st.cam);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('浏览器不支持摄像头'));
    }
    if (deviceId && st.cam) closeCam();
    var constraints = { video: { width: 640, height: 480 } };
    if (deviceId) constraints.video.deviceId = { exact: deviceId };
    return navigator.mediaDevices.getUserMedia(constraints)
      .then(function (s) {
        st.cam = s;
        st.camDeviceId = deviceId || '';
        /* 取帧源必须是**可见**的 video：浏览器会把移出视口的 video 挂起
           （paused=true），readyState 仍是 4 但不再送新帧，于是气泡画不出来。
           面板里的 #rpPrev 会被面板的 hidden 遮住，所以优先用录制中的
           #pipVideo（始终可见且在录）；还没开始录时退回 #rpPrev。 */
        st.camFeed = R.pipVideo || R.camSrc || R.prev;
        R.prev.srcObject = s;
        R.camSrc.srcObject = s;
        if (R.pipVideo) R.pipVideo.srcObject = s;
        R.camOff.hidden = true;
        return s;
      });
  }
  function closeCam() {
    if (st.cam) { st.cam.getTracks().forEach(function (t) { t.stop(); }); st.cam = null; }
    st.camFeed = null;
    R.prev.srcObject = null;
    R.camSrc.srcObject = null;
    if (R.pipVideo) R.pipVideo.srcObject = null;
    if (R.pip) R.pip.hidden = true;
    R.camOff.hidden = false;
  }

  /* ---------- 麦克风 + 电平 ---------- */
  var actx = null, analyser = null, levelRaf = 0, micBuf = null;
  function openMic(deviceId) {
    if (!deviceId && st.mic) return Promise.resolve(st.mic);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('浏览器不支持麦克风'));
    }
    if (deviceId && st.mic) closeMic();
    var constraints = { audio: { echoCancellation: true } };
    if (deviceId) constraints.audio.deviceId = { exact: deviceId };
    return navigator.mediaDevices.getUserMedia(constraints)
      .then(function (s) {
        st.mic = s;
        st.micDeviceId = deviceId || '';
        try {
          actx = new (window.AudioContext || window.webkitAudioContext)();
          var src = actx.createMediaStreamSource(s);
          analyser = actx.createAnalyser();
          analyser.fftSize = 512;
          src.connect(analyser);
          micBuf = new Uint8Array(analyser.frequencyBinCount);
          (function tick() {
            if (!analyser) return;
            analyser.getByteFrequencyData(micBuf);
            var sum = 0;
            for (var i = 0; i < micBuf.length; i++) sum += micBuf[i];
            R.level.style.width = Math.min(100, Math.round(sum / micBuf.length / 128 * 100)) + '%';
            levelRaf = requestAnimationFrame(tick);
          })();
        } catch (e) {}
        return s;
      });
  }
  function closeMic() {
    if (st.mic) { st.mic.getTracks().forEach(function (t) { t.stop(); }); st.mic = null; }
    cancelAnimationFrame(levelRaf); levelRaf = 0;
    if (actx) { try { actx.close(); } catch (e) {} actx = null; analyser = null; }
    R.level.style.width = '0%';
  }

  /* ---------- 面板 ---------- */
  function openPanel() {
    R.panel.hidden = false;
    /* 按当前页类型切换提示：图片卡 → 画布合成（不共享屏幕、天然满屏）；
       网页 / 文档卡 → 屏幕共享（此时「全屏录制」跳独立页才有意义）。 */
    var canvasOk = canvasModeAvailable();
    R.note.innerHTML = canvasOk ? NOTE_CANVAS : NOTE_DEF;
    /* 「全屏录制」只影响屏幕共享模式；画布模式成片天然满屏，开关没有意义 */
    var fsRow = R.fs ? R.fs.closest('.rp-row') : null;
    if (fsRow) fsRow.hidden = canvasOk;
    st.camSize = parseInt(R.size.value, 10) || 260;
    R.sizeVal.textContent = R.size.value + 'px';
    var p1 = openCam(R.camDevice.value).catch(function () { R.camOff.hidden = false; });
    var p2 = openMic(R.micDevice.value).catch(function () { R.mic.checked = false; });
    Promise.all([p1, p2]).then(populateDevices);
  }

  /* Windows 会把设备分组前缀塞进 label（"默认 - 麦克风 (…)"、"通讯 - 麦克风 (…)"），
     列表里看着又长又重复。这里把前缀去掉、同名再加序号区分。 */
  function cleanDeviceLabel(label, kind, idx) {
    var s = (label || '')
      .replace(/^(默认|通讯|多声道|立体声|高质量)\s*[-–—]\s*/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!s) s = (kind === 'videoinput' ? '摄像头 ' : '麦克风 ') + (idx + 1);
    return s;
  }

  function fillDeviceSelect(sel, kind, devices) {
    sel.innerHTML = '';
    var def = document.createElement('option');
    def.value = '';
    def.textContent = kind === 'videoinput' ? '系统默认' : '系统默认';
    sel.appendChild(def);

    var seen = {}, n = 0;
    devices.forEach(function (d) {
      if (d.kind !== kind) return;
      var text = cleanDeviceLabel(d.label, kind, n);
      var base = text, k = 2;
      while (seen[text]) { text = base + '（' + k + '）'; k++; }
      seen[text] = true;
      n++;
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = text;
      sel.appendChild(opt);
    });
  }

  /* 把可用的摄像头/麦克风列出来，让用户自己选 */
  function populateDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      var camSel = R.camDevice, micSel = R.micDevice;
      var curCam = camSel.value, curMic = micSel.value;
      fillDeviceSelect(camSel, 'videoinput', devices);
      fillDeviceSelect(micSel, 'audioinput', devices);
      camSel.value = curCam;
      micSel.value = curMic;
    })['catch'](function (e) { console.error(e); });
  }

  function closePanel() {
    R.panel.hidden = true;
    if (!st.recording) { closeCam(); closeMic(); }
  }

  /* ---------- 录制 ---------- */
  function pickMime() {
    var cands = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (var i = 0; i < cands.length; i++) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(cands[i])) return cands[i];
    }
    return '';
  }

  /* 探测能否把屏幕流画进画布。

     为什么不能只看 getImageData：站点把演示放在**同源 iframe** 里，而iframe
     里的 getDisplayMedia 拿到的流在部分 Chrome 版本下会把画布标记为污染，
     getImageData 直接抛 TypeError → 误判为「不能合成」→ 头像整个消失。

     真正决定能不能合成的只有一件事：drawImage 不抛。所以先 drawImage，
     只有 drawImage 真的失败才判定不可用；getImageData 的结果只用来给
     captureStream 打一个更保守的标记，不作为降级依据。 */
  function testComposite() {
    if (!st.screen) { st.compErr = 'no-screen'; return false; }
    try {
      ctx.drawImage(R.screenSrc, 0, 0, canvas.width, canvas.height);
      st.compErr = '';
    } catch (e) {
      st.compErr = 'drawImage: ' + (e && e.name) + ' ' + (e && e.message);
      return false;
    }
    /* 画得进去就合成。captureStream 对污染画布是宽容的（照样出帧），
       实测在 iframe 里带头像合成是有效的。 */
    return true;
  }

  /* 独立标签页模式：站点把演示放在 iframe 里，而录屏共享的是**整个标签页**。
     在 /tools 面板里录，iframe 只占中间一小块 —— 即使 iframe 自己进了全屏，
     抓到的仍然是顶层那一小块，成片就是「小屏套在大屏里」。

     唯一干净的做法是跳到顶层：window.top 是同源的，直接把它导航到本页，
     这样录制发生在真正的顶层标签页里，演示铺满，成片满屏。
     因为同源，iframe 里的 IndexedDB / 图卡数据都在，演示内容不丢。 */
  function escapeToTop() {
    var here = location.href;
    try {
      if (window.top && window.top.location && window.top.location.href !== here) {
        window.top.location.href = here;
        return true;
      }
      if (window.top && window.top.location && window.top.location.href === here) {
        return false;                       /* 已经是顶层了 */
      }
    } catch (e) {
      /* 跨域时拿不到 top.location，直接开新标签页 */
      window.open(here, '_blank');
      return true;
    }
    return false;
  }

  /* 全屏：录制成片要满屏，就得先把演示铺满整个屏幕。
     requestFullscreen 需要用户手势，正好由「开始录制」这一次点击触发；
     被浏览器拒绝不算失败，降级为在当前窗口里录，只是成片会带站点框架。 */
  function ensureFullscreen() {
    if (!R.fs || !R.fs.checked) return Promise.resolve(false);
    if (document.fullscreenElement) return Promise.resolve(true);
    if (!document.documentElement.requestFullscreen) return Promise.resolve(false);
    return new Promise(function (resolve) {
      var settled = false;
      function done(v) { if (!settled) { settled = true; resolve(v); } }
      document.addEventListener('fullscreenchange', function h() {
        document.removeEventListener('fullscreenchange', h);
        setTimeout(function () { done(!!document.fullscreenElement); }, 60);
      });
      var p;
      try { p = document.documentElement.requestFullscreen(); } catch (e) { done(false); return; }
      if (p && p['catch']) p['catch'](function () { done(false); });
      /* 有些环境既不抛错也不触发 change，给个兜底超时，别卡住整个录制 */
      setTimeout(function () { done(!!document.fullscreenElement); }, 1500);
    });
  }

  /* 当前这页能不能走画布合成：图片卡（同源 blob 的 <img>）可以，
     网页 / PDF 卡是跨域 iframe，画进 canvas 会污染（getImageData 抛错），
     只能退回屏幕共享。 */
  function canvasModeAvailable() {
    if (document.body.classList.contains('show-web')) return false;
    var img = R.slide;
    return !!(img && img.naturalWidth > 0 && img.naturalHeight > 0);
  }

  /* ---------- 画布合成模式（图卡页）----------
     复刻 excalicord 的思路：不共享屏幕，直接把内容画进自己的画布再 captureStream。
     - 内容层：#slide 是同源 blob 的 <img>，drawImage 直接画，成片 = 图卡满屏零白边
     - 头像层：getUserMedia 的 video 画成圆形/方形气泡，大小位置全按面板设置
     - 音频：只收麦克风（图卡是静态的，没有「网页声音」可收）
     浏览器的「正在共享」提示条根本不存在 —— 因为我们从没请求过屏幕共享；
     屏幕上的工具栏 / PIP 预览也随便显示，反正成片只从画布里来。 */
  function startCanvas() {
    st.busy = true;
    R.panel.hidden = true;

    var img = R.slide;
    /* 成片尺寸 = 图卡原始尺寸，最长边压到 1920（再大只是浪费码率） */
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var k = Math.min(1, 1920 / Math.max(iw, ih));
    canvas.width = Math.round(iw * k);
    canvas.height = Math.round(ih * k);
    st.slideReady = true;

    var tracks = [];
    var useCam = R.cam.checked;
    var useMic = R.mic.checked;

    var ready = Promise.all([
      useCam ? openCam(R.camDevice.value)['catch'](function (e) {
        R.note.innerHTML = '摄像头打不开：' + ((e && e.message) || e) + '。已开始录制无头像版本。';
        return null;
      }) : Promise.resolve(null),
      useMic ? openMic(R.micDevice.value)['catch'](function (e) {
        R.note.innerHTML = '麦克风打不开：' + ((e && e.message) || e) + '。已开始录制无声版本。';
        return null;
      }) : Promise.resolve(null)
    ]).then(function () {
      /* 先画一帧再 captureStream，避免第一帧是空白 */
      draw();
      st.dtimer = setInterval(draw, 33);
      var cs = canvas.captureStream(30);
      tracks.push(cs.getVideoTracks()[0]);
      if (st.mic) tracks = tracks.concat(st.mic.getAudioTracks());

      var mr;
      try { mr = new MediaRecorder(new MediaStream(tracks), { mimeType: pickMime() }); }
      catch (e) { mr = new MediaRecorder(new MediaStream(tracks)); }
      st.chunks = [];
      mr.ondataavailable = function (e) { if (e.data && e.data.size) st.chunks.push(e.data); };
      mr.onstop = finish;
      st.rec = mr;

      st.recording = true;
      setCleanMode(true);
      R.bar.hidden = true;
      $('hRec').classList.add('recording');
      pipSync();

      return countdown(3).then(function () {
        st.recording = true;
        st.t0 = Date.now();
        mr.start(1000);
        tickTime();
      });
    })['catch'](function (e) {
      setCleanMode(false);
      R.bar.hidden = true;
      if (R.pip) R.pip.hidden = true;
      $('hRec').classList.remove('recording');
      R.note.innerHTML = '没能开始录制：' + ((e && e.message) || e);
      st.busy = false;
    });
    return ready;
  }

  function start() {
    if (st.busy || st.recording) return;

    /* 画布合成模式：不共享屏幕。图卡是同源 blob，直接 drawImage 进画布，
       成片 = 图卡满屏 + 摄像头气泡。没有浏览器「正在共享」提示条，
       没有白边，头像大小完全可控 —— excalicord 就是这么做的。 */
    if (canvasModeAvailable()) {
      st.mode = 'canvas';
      startCanvas();
      return;
    }
    st.mode = 'screen';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('这一页是网页 / 文档卡片，录它需要共享屏幕；但这个浏览器不支持屏幕录制，请用 Chrome / Edge。');
      return;
    }

    /* 在 /tools 的 iframe 里录，成片必然是「小屏套在大屏里」。
       想录满屏就得先跳到顶层标签页去录 —— 这是唯一干净的路。 */
    if (R.fs && R.fs.checked && window.top !== window.self) {
      var msg = '录满屏需要在独立标签页里进行（当前演示嵌在 /tools 面板中，'
              + '录到的是整个标签页，演示只占中间一小块）。\n\n'
              + '已经为你打开独立页面，现在点「录屏」即可。';
      if (escapeToTop()) { alert(msg); }
      return;
    }

    st.busy = true;
    R.panel.hidden = true;

    /* 先全屏再共享：共享源是「当前标签页」，全屏后抓到的就是满屏画面 */
    ensureFullscreen().then(function () {
      return navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 60 } },
        audio: true,
        preferCurrentTab: true          /* Chrome 会把「当前标签页」排在最前 */
      });
    }).then(function (screen) {
      st.screen = screen;
      /* getDisplayMedia 给的是 MediaStream，canvas.drawImage 不认它，
         必须挂到 <video> 上由 video 出帧才能画进画布。这一步是 draw() 能工作的前提。 */
      if (R.screenSrc) R.screenSrc.srcObject = screen;
      return R.cam.checked ? openCam(R.camDevice.value).catch(function () { return null; }) : null;
    }).then(function () {
      var vt = st.screen.getVideoTracks()[0];
      var cfg = (vt && vt.getSettings) ? vt.getSettings() : {};
      canvas.width = cfg.width || 1920;
      canvas.height = cfg.height || 1080;
      /* 记下屏幕流的尺寸：PIP 是靠被这条流录进成片才成为成片头像的，
         所以它的位置必须按流的尺寸算，而不是按视口 —— 否则贴底的 PIP
         可能整个落在录制区域之外，成片里就没有头像了。 */
      st.screenW = canvas.width;
      st.screenH = canvas.height;

      st.composite = testComposite();

      var tracks;
      if (st.composite) {
        /* 先画一帧再开captureStream，否则录到的第一帧是空白 */
        draw();
        st.dtimer = setInterval(draw, 33);          /* 约 30fps */
        var cs = canvas.captureStream(30);
        tracks = [cs.getVideoTracks()[0]];
      } else {
        tracks = [vt];                            /* 退化路径：直接录屏幕 */
      }

      var at = st.screen.getAudioTracks()[0];
      if (at) tracks.push(at);
      if (R.mic.checked && st.mic) tracks = tracks.concat(mixAudio(at));

      var mr;
      try {
        mr = new MediaRecorder(new MediaStream(tracks), { mimeType: pickMime() });
      } catch (e) {
        mr = new MediaRecorder(new MediaStream(tracks));
      }
      st.chunks = [];
      mr.ondataavailable = function (e) { if (e.data && e.data.size) st.chunks.push(e.data); };
      mr.onstop = finish;
      st.rec = mr;

      /* 用户在浏览器原生 UI 里点「停止共享」时同步收尾 */
      st.screen.getTracks().forEach(function (t) {
        t.addEventListener('ended', function () { if (st.recording) stop(); });
      });

      /* 3 秒倒计时后才真正开始写入；倒计时期间画面不被记录 */
      setCleanMode(true);
      R.bar.hidden = true;
      $('hRec').classList.add('recording');
      pipSync();

      return countdown(3).then(function () {
        st.recording = true;
        st.t0 = Date.now();
        mr.start(1000);
        tickTime();
      });
    })['catch'](function (e) {
      setCleanMode(false);
      R.bar.hidden = true;
      if (R.pip) R.pip.hidden = true;
      $('hRec').classList.remove('recording');
      st.busy = false;
      st.recording = false;
      R.panel.hidden = false;
      if (e && e.name === 'NotAllowedError') {
        R.note.innerHTML = '你取消了共享 —— 录制需要先授权屏幕。';
      } else if (e && e.name === 'NotFoundError') {
        R.note.innerHTML = '没找到可用的屏幕/标签页。';
      } else {
        R.note.innerHTML = '启动失败：' + ((e && e.message) || e);
      }
    });
  }

  /* 麦克风混进音频轨（保留屏幕自带音轨），录出来人声 + 系统声都有 */
  function mixAudio(screenAudioTrack) {
    try {
      var ac = new (window.AudioContext || window.webkitAudioContext)();
      var dest = ac.createMediaStreamDestination();
      if (screenAudioTrack) {
        ac.createMediaStreamSource(new MediaStream([screenAudioTrack])).connect(dest);
      }
      ac.createMediaStreamSource(st.mic).connect(dest);
      st.actx = ac;
      return dest.stream.getAudioTracks();
    } catch (e) { return []; }
  }

  /* 取帧源：优先 PIP 小窗的 video（可见、稳定送帧），否则退回面板预览。 */
  function camSource() {
    if (R.pipVideo && !R.pipVideo.hidden && !R.pip.hidden &&
        R.pipVideo.videoWidth > 0 && R.pipVideo.readyState >= 2) return R.pipVideo;
    if (R.prev && R.prev.videoWidth > 0 && R.prev.readyState >= 2) return R.prev;
    if (R.camSrc && R.camSrc.videoWidth > 0 && R.camSrc.readyState >= 2) return R.camSrc;
    return null;
  }

  /* ---------- 合成循环 ----------
     用 setInterval 而不是 requestAnimationFrame：录屏会让浏览器把标签页判为
     非活跃，rAF 会被挂起 —— 表现就是「屏幕在录但头像一直不出现」。
     setInterval 不受可见性影响，30fps 足够，也更省。 */
  function draw() {
    var w = canvas.width, h = canvas.height;

    /* 画布模式：成片 = 图卡铺满 + 摄像头气泡。
       img 是同源 blob，直接画；翻页时 img.src 换了，下一帧自动就是新图卡。 */
    if (st.mode === 'canvas') {
      var img = R.slide;
      var onSlide = !document.body.classList.contains('show-web') &&
                    img && img.naturalWidth > 0;
      if (onSlide) {
        ctx.fillStyle = '#151210';           /* 图卡若带透明区域，垫深底 */
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);      /* 画布尺寸=图卡比例，天然满屏 */
      } else {
        /* 录制中翻到了网页 / 文档卡：跨域画不进画布，给个明确占位而不是花屏 */
        ctx.fillStyle = '#151210';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(242,230,210,.55)';
        ctx.font = Math.round(h * 0.045) + 'px "LXGW WenKai", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('这一页是网页 / 文档卡片，不参与录制', w / 2, h / 2);
        ctx.textAlign = 'left';
      }
      drawCamBubble(w, h, false);
      return;
    }

    /* 屏幕层：某一帧 drawImage 失败（流临时不可用）不能连头像一起不画，
       失败就跳过这一帧的屏幕，摄像头气泡和 REC 指示照常。 */
    try {
      ctx.drawImage(R.screenSrc, 0, 0, w, h);
      st.screenOk = true;
    } catch (e) {
      st.screenOk = false;
    }

    var feed = camSource();
    /* 屏幕模式下，PIP 显示在屏幕上 → 会被屏幕流一起录进这一层，成片里本来
       就有头像了。画布若再画一遍就是双影（流尺寸≠视口尺寸，位置对不齐）。
       所以屏幕模式只在 PIP 不在屏幕上时才补画气泡；画布模式永远自己画
       （画布里的气泡是成片头像，PIP 只是给用户看的预览，不入镜）。 */
    var pipOnScreen = st.mode === 'screen' &&
                      !!(R.pip && st.cam && R.cam.checked && !R.pip.hidden);
    drawCamBubble(w, h, pipOnScreen);

    /* 右上角闪烁 REC 指示 */
    var d = Math.round(Math.min(w, h) * 0.022);
    var rx = w - d * 2.6, ry = d * 2.4;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(Date.now() / 400));
    ctx.fillStyle = '#FF5B4A';
    ctx.beginPath(); ctx.arc(rx, ry, d, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = '600 ' + Math.round(d * 1.1) + 'px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('REC', rx + d * 1.4, ry + 1);
    ctx.restore();
  }

  /* 摄像头气泡：圆形 / 方形，位置和大小按面板设置。
     画布模式这是成片头像的唯一来源，屏幕模式是 PIP 不在时的兜底。 */
  function drawCamBubble(w, h, skip) {
    if (skip) return;
    var feed = camSource();
    if (!R.cam.checked || !st.cam || !feed) return;
    var r = Math.round(st.camSize / 2);
    var maxR = Math.round(Math.min(w, h) / 2);
    if (r > maxR) r = maxR;
    var pad = Math.round(Math.min(w, h) * 0.03);
    var cx = (R.pos === 'bl' || R.pos === 'tl') ? r + pad : w - r - pad;
    var cy = (R.pos === 'tr' || R.pos === 'tl') ? r + pad : h - r - pad;

    ctx.save();
    ctx.beginPath();
    if (st.camShape === 'square') {
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(feed, cx - r, cy - r, r * 2, r * 2);
    st.camDrawn = true;
    ctx.restore();

    ctx.beginPath();
    if (st.camShape === 'square') {
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
    } else {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.strokeStyle = 'rgba(245,80,0,.95)';
    ctx.lineWidth = Math.max(2, Math.round(r * 0.05));
    if (st.camShape === 'square') ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function tickTime() {
    clearInterval(st.timer);
    st.timer = setInterval(function () {
      var s = Math.floor((Date.now() - st.t0) / 1000);
      var txt = String(Math.floor(s / 60)).padStart(2, '0') + ':' +
                String(s % 60).padStart(2, '0');
      R.time.textContent = txt;
      if (R.pipTime) R.pipTime.textContent = txt;
    }, 500);
  }

  function stop() {
    if (!st.rec || !st.recording) return;
    st.recording = false;
    try { st.rec.stop(); } catch (e) {}
  }

  function finish() {
    clearInterval(st.timer);
    clearInterval(st.dtimer); st.dtimer = 0;
    cancelAnimationFrame(st.raf);
    setCleanMode(false);
    if (R.pip) R.pip.hidden = true;
    R.bar.hidden = true;
    $('hRec').classList.remove('recording');

    var type = (st.rec && st.rec.mimeType) || 'video/webm';
    var blob = new Blob(st.chunks, { type: type });

    if (!blob.size) {
      cleanup(); st.busy = false;
      alert('没有录到内容，可能是共享时选了不带画面的窗口。');
      return;
    }
    if (st.blobUrl) URL.revokeObjectURL(st.blobUrl);
    st.blobUrl = URL.createObjectURL(blob);

    var secs = Math.max(1, Math.round((Date.now() - st.t0) / 1000));
    R.info.textContent = '时长约 ' + Math.floor(secs / 60) + ' 分 ' + (secs % 60) + ' 秒 · ' +
      (blob.size / 1048576).toFixed(1) + ' MB · WebM · 只存在你本机，不上传';
    R.prevOut.src = st.blobUrl;
    R.done.hidden = false;

    cleanup();
    st.busy = false;
  }

  function cleanup() {
    if (st.screen) { st.screen.getTracks().forEach(function (t) { t.stop(); }); st.screen = null; }
    if (st.actx) { try { st.actx.close(); } catch (e) {} st.actx = null; }
    closeCam(); closeMic();
  }

  /* ---------- 事件 ---------- */
  $('hRec').addEventListener('click', function () {
    if (st.recording) stop(); else openPanel();
  });
  $('rpCancel').addEventListener('click', closePanel);
  $('rpStart').addEventListener('click', start);
  $('recStop').addEventListener('click', stop);

  /* 开关自己弹回去时给句说明，否则用户只看到开关「没反应」 */
  function deviceFail(checkbox, msg) {
    checkbox.checked = false;
    R.note.innerHTML = msg;
  }

  R.cam.addEventListener('change', function () {
    if (R.cam.checked) {
      openCam(R.camDevice.value).then(function () { pipSync(); }).catch(function (e) {
        deviceFail(R.cam, '摄像头打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。');
        pipSync();
      });
    } else { closeCam(); pipSync(); }
  });
  R.mic.addEventListener('change', function () {
    if (R.mic.checked) {
      openMic(R.micDevice.value).catch(function (e) {
        deviceFail(R.mic, '麦克风打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。');
      });
    } else closeMic();
  });
  R.camDevice.addEventListener('change', function () {
    if (!R.cam.checked) return;
    var want = R.camDevice.value;
    closeCam();
    openCam(want).then(function (stream) {
      st.camDeviceId = want;
    }).catch(function (e) {
      /* 切不过去就把下拉拨回当前真正在用的那个，别让它留在一个假的选项上 */
      R.camDevice.value = st.camDeviceId || '';
      openCam(R.camDevice.value).catch(function () { deviceFail(R.cam, '摄像头打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。'); });
      R.note.innerHTML = '这个摄像头打不开，已退回上一个。';
    });
  });
  R.micDevice.addEventListener('change', function () {
    if (!R.mic.checked) return;
    var want = R.micDevice.value;
    closeMic();
    openMic(want).then(function (stream) {
      st.micDeviceId = want;
    }).catch(function (e) {
      R.micDevice.value = st.micDeviceId || '';
      openMic(R.micDevice.value).catch(function () { deviceFail(R.mic, '麦克风打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。'); });
      R.note.innerHTML = '这个麦克风打不开，已退回上一个。';
    });
  });
  R.size.addEventListener('input', function () {
    st.camSize = parseInt(R.size.value, 10) || 260;
    R.sizeVal.textContent = R.size.value + 'px';
    pipSync();
  });
  R.shape.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    st.camShape = b.dataset.s;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    pipSync();
  });
  $('rpPos').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    R.pos = b.dataset.p;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    pipSync();
  });

  $('rdSave').addEventListener('click', function () {
    if (!st.blobUrl) return;
    var a = document.createElement('a');
    a.href = st.blobUrl;
    a.download = '演示录制-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.webm';
    document.body.appendChild(a); a.click(); a.remove();
  });
  $('rdAgain').addEventListener('click', function () {
    R.done.hidden = true;
    openPanel();
  });

  /* 调试钩子：录屏合成这块出过好几次「画面在录但气泡不出现」的问题，
     把它挂到 window 上，以后在控制台一行就能看清内部状态，不用猜。 */
  /* 调试钩子：录屏这条链路涉及 getDisplayMedia → video 取帧 → canvas 合成 →
     captureStream → MediaRecorder 五环，每一环坏掉的表现都是「画面全黑」，
     光看结果分不出是哪一环。留这个开关，浏览器控制台敲 __recDebug() 就能定位。
     只读状态，不改任何东西。 */
  window.__recDebug = function () {
    var feed = camSource();
    return {
      recording: st.recording,
      mode: st.mode,
      composite: st.composite,
      compErr: st.compErr,
      screenOk: st.screenOk,
      camDrawn: st.camDrawn,
      drawTimerAlive: !!st.dtimer,
      camSize: st.camSize,
      camShape: st.camShape,
      pos: R.pos,
      camChecked: R.cam.checked,
      hasCamStream: !!st.cam,
      feedFound: !!feed,
      feedId: feed ? (feed.id || '(anon)') : null,
      feedW: feed ? feed.videoWidth : 0,
      feedReady: feed ? feed.readyState : -1,
      canvas: canvas.width + 'x' + canvas.height
    };
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (st.recording) { e.preventDefault(); stop(); return; }
      if (!R.done.hidden) { R.done.hidden = true; return; }
      if (!R.panel.hidden) { closePanel(); return; }
      return;
    }
    var t = document.activeElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'r' || e.key === 'R') {
      if (st.recording) { e.preventDefault(); stop(); }
      else if (R.done.hidden && R.panel.hidden) { e.preventDefault(); openPanel(); }
    }
  });

  window.addEventListener('beforeunload', cleanup);
})();