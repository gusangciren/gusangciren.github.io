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
    fs: $('rpFs'),
    layout: $('rpLayout'), inkChk: $('rpInk'), quietChk: $('rpQuiet'),
    teleIn: $('rpTele'), tele: $('recTele'),
    ink: $('inkLayer'), inkCtx: $('inkLayer') ? $('inkLayer').getContext('2d') : null,
    chapters: $('rdChapters')
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
    camDeviceId: '', micDeviceId: '',
    /* 自由位置：气泡被拖走后记下中心点的**比例**坐标（0~1），
       跟着画面尺寸走 —— 预览小窗、成片画布、管理页迷你舞台三处通用。
       为 null 时走四角吸附（R.pos）。 */
    freeX: null, freeY: null,
    /* 这次摄像头 / 麦克风是靠什么打开的：exact=存的 id 直接命中、
       label=id 失效后按设备名认回来的、default=都没命中退回系统默认。
       排查「明明选了那台怎么没用」时，先看这两个。 */
    camFrom: '', micFrom: '',

    /* 头像布局（Screen Studio 同款）：角落浮窗 / 侧边分屏 / 全屏头像。
       只有画布模式能改（屏幕模式录的是屏幕本身，改不了画面构成）。 */
    layout: 'corner',
    /* 暂停：MediaRecorder.pause()，计时同步停，draw 也停（省电且不写帧） */
    paused: false,
    /* 章节：翻页时记一个时间点，录完在成片面板可点击跳转 */
    chapters: [], lastPage: '',
    /* 提词器：面板里用 --- 分页，翻页自动切段；只在画布模式显示（不入成片） */
    telePages: [], teleIdx: 0, teleOn: true,
    /* 画笔：笔迹带时间戳，FADE 之后淡出；常驻模式不淡出 */
    inkOn: false, inkKeep: false, inkStrokes: [],
    INK_FADE: 4000,
    /* 沉默让位：麦克风安静超过 QUIET_MS，气泡缩到 62% 并半透明 */
    quiet: false, quietSince: 0, voiceTimer: 0,
    QUIET_MS: 1200,
    mime: '', ext: 'webm'
  };

  var NOTE_DEF = R.note.innerHTML;

  /* 图片卡片走画布合成时的面板说明（区别于退回屏幕共享的网页 / 文档卡）。 */
  var NOTE_CANVAS = '<b>图片卡片走「画布合成」</b>：成片 = 图卡满屏 + 你的头像，'
    + '<b>不共享屏幕</b>，所以没有浏览器提示条、没有白边。'
    + '头像布局（角落 / 侧边 / 全屏）和大小位置都能调，下面这块预览就是实时效果。'
    + '录制中：<b>空格</b>暂停 · <b>D</b>画笔 · <b>1/2/3</b>换布局 · <b>T</b>提词 · '
    + '<b>R</b>结束 · <b>X</b>丢弃重来。开始前有 <b>3 秒倒计时</b>。';

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
  /* 气泡中心点：拖动过 → 用记录的比例坐标；没拖过 → 吸附到四角。
     pipSync（屏幕像素）和 drawCamBubble（成片画布）共用这一套，
     两边才会重合，不出重影。 */
  function camCenter(w, h, r, pad) {
    if (st.freeX != null && st.freeY != null) {
      return {
        cx: Math.max(r, Math.min(w - r, st.freeX * w)),
        cy: Math.max(r, Math.min(h - r, st.freeY * h))
      };
    }
    return {
      cx: (R.pos === 'bl' || R.pos === 'tl') ? r + pad : w - r - pad,
      cy: (R.pos === 'tr' || R.pos === 'tl') ? r + pad : h - r - pad
    };
  }
  function pipSync() {
    if (!R.pip) return;
    var on = R.cam.checked && st.cam;
    R.pip.hidden = !on;
    if (!on) return;
    R.pipVideo.srcObject = st.cam;
    R.pip.classList.toggle('square', st.camShape === 'square');
    /* 侧边 / 全屏布局下，屏幕上不需要那个角落小窗了 —— 但**不能真的隐藏**：
       camSource() 正是靠这个可见的 video 取帧，display:none / visibility:hidden
       会让浏览器停止送帧，头像直接消失。所以用 opacity:0（仍在渲染、照常出帧）。 */
    R.pip.classList.toggle('pip-off', st.mode === 'canvas' && st.layout !== 'corner');
    /* 位置与大小必须和 draw() 里画的气泡用**同一套公式**，否则会出现重影：
       PIP 显示在屏幕上 → 被屏幕流一起录进画布 → 画布又在气泡位置画一遍摄像头，
       两个头像错开一点点就是明显的双影。
       draw() 用的是「半径 r + 边距 min(w,h)*3%」，这里换算成屏幕像素后必须一致，
       所以 PIP 的 left/top 也要按「直径 + 边距」算，而不是用 right/bottom 贴边。 */
    /* 上限跟滑块一致（420），否则拉到最大时预览比成片小一圈 */
    var d = Math.round(Math.max(64, Math.min(420, st.camSize)) * (st.quiet ? 0.62 : 1));
    /* 用「屏幕流的高」而不是视口高来算纵向位置：PIP 是靠被屏幕流录进成片
       才成为成片头像的，所以必须落在流的范围内。视口（浏览器窗口）通常比
       屏幕流（整个屏幕）矮，按视口贴底算出来的 PIP 可能整个掉到录制区域外，
       成片里就直接没有头像了。st.screenH 在拿到屏幕流后由 start() 写入。 */
    var vw = window.innerWidth;
    var vh = st.screenH || window.innerHeight;
    var pad = Math.round(Math.min(vw, vh) * 0.03);
    var r = Math.round(d / 2);
    /* 再夹一次，保证整块 PIP 都在流的可见范围内 */
    var c = camCenter(vw, vh, r, pad);
    var cx = c.cx, cy = c.cy;
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

  /* ---------- 气泡自由拖动：想放哪就放哪 ----------
     按住气泡拖，中心点记成 0~1 的比例坐标（跟着画面尺寸走）；
     预览小窗、成片画布、管理页迷你舞台三处共用 camCenter 一套公式，
     所以拖的时候成片里的气泡实时跟着走，松手即存本机。
     点四角按钮 = 回到吸附。 */
  function pipBindDrag() {
    if (!R.pip) return;
    var sx = 0, sy = 0, ox = 0, oy = 0, moving = false;
    R.pip.classList.add('draggable');
    R.pip.addEventListener('pointerdown', function (e) {
      if (st.layout !== 'corner') return;   /* 侧边 / 全屏布局没有可拖的气泡 */
      var vw = window.innerWidth, vh = st.screenH || window.innerHeight;
      var c = camCenter(vw, vh, 0, 0);
      moving = true; sx = e.clientX; sy = e.clientY; ox = c.cx; oy = c.cy;
      try { R.pip.setPointerCapture(e.pointerId); } catch (err) {}
      R.pip.classList.add('dragging');
      e.preventDefault();
    });
    R.pip.addEventListener('pointermove', function (e) {
      if (!moving) return;
      var vw = window.innerWidth, vh = st.screenH || window.innerHeight;
      st.freeX = Math.max(0, Math.min(1, (ox + e.clientX - sx) / vw));
      st.freeY = Math.max(0, Math.min(1, (oy + e.clientY - sy) / vh));
      pipSync();
    });
    var up = function () {
      if (!moving) return;
      moving = false;
      R.pip.classList.remove('dragging');
      saveSettings();
    };
    R.pip.addEventListener('pointerup', up);
    R.pip.addEventListener('pointercancel', up);
  }
  pipBindDrag();

  /* ---------- 摄像头 ---------- */
  /* 实际在用哪台，从轨道的 settings 里读最准 —— 请求「系统默认」时也知道是谁 */
  function trackDeviceId(stream, kind) {
    var tracks = kind === 'video' ? stream.getVideoTracks() : stream.getAudioTracks();
    var t = tracks && tracks[0];
    if (t && t.getSettings) { try { return t.getSettings().deviceId || ''; } catch (e) {} }
    return '';
  }
  /* deviceId 并不总是可靠：浏览器会给它加盐（换页面、清缓存、重装驱动都可能变），
     管理页记下的 id 到演示页可能就失效了 —— 一失效就 OverconstrainedError，
     画面直接黑。所以存设备时连原名一起存，这里按名字再认一次。 */
  function pickByLabel(kind, label) {
    if (!label || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return Promise.resolve('');
    }
    return navigator.mediaDevices.enumerateDevices().then(function (ds) {
      for (var i = 0; i < ds.length; i++) {
        if (ds[i].kind === kind && ds[i].label && ds[i].label === label) return ds[i].deviceId;
      }
      return '';
    })['catch'](function () { return ''; });
  }
  function openCam(deviceId) {
    if (!deviceId && st.cam) return Promise.resolve(st.cam);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('浏览器不支持摄像头'));
    }
    if (deviceId && st.cam) closeCam();
    st.camFrom = '';
    var V = { width: 640, height: 480 };
    var attempt = function (c) { return navigator.mediaDevices.getUserMedia(c); };
    var tryId = function (id) {
      return id ? attempt({ video: { deviceId: { exact: id }, width: 640, height: 480 } })
                : attempt({ video: V });
    };
    return tryId(deviceId)['catch'](function (e) {
      if (!deviceId) throw e;
      /* 记下的 deviceId 在这页失效了 → 按**设备名**再找一次；
         名字也找不到（设备真拔了）才退回系统默认，总比一路黑屏强。 */
      return pickByLabel('videoinput', readRs().camLabel).then(function (id2) {
        if (!id2 || id2 === deviceId) throw e;
        return tryId(id2).then(function (s) { st.camFrom = 'label'; return s; });
      })['catch'](function () {
        st.camDeviceId = '';
        return attempt({ video: V }).then(function (s) { st.camFrom = 'default'; return s; });
      });
    }).then(function (s) {
      st.cam = s;
      st.camDeviceId = trackDeviceId(s, 'video') || '';
      if (!st.camFrom) st.camFrom = deviceId ? 'exact' : 'default';
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
  var actx = null, analyser = null, levelTimer = 0, micBuf = null;
  function openMic(deviceId) {
    if (!deviceId && st.mic) return Promise.resolve(st.mic);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return Promise.reject(new Error('浏览器不支持麦克风'));
    }
    if (deviceId && st.mic) closeMic();
    st.micFrom = '';
    var A = { echoCancellation: true };
    var attempt = function (c) { return navigator.mediaDevices.getUserMedia(c); };
    var tryId = function (id) {
      return id ? attempt({ audio: { deviceId: { exact: id }, echoCancellation: true } })
                : attempt({ audio: A });
    };
    return tryId(deviceId)['catch'](function (e) {
      if (!deviceId) throw e;
      return pickByLabel('audioinput', readRs().micLabel).then(function (id2) {
        if (!id2 || id2 === deviceId) throw e;
        return tryId(id2).then(function (s) { st.micFrom = 'label'; return s; });
      })['catch'](function () {
        st.micDeviceId = '';
        return attempt({ audio: A }).then(function (s) { st.micFrom = 'default'; return s; });
      });
    }).then(function (s) {
      st.mic = s;
      st.micDeviceId = trackDeviceId(s, 'audio') || '';
      if (!st.micFrom) st.micFrom = deviceId ? 'exact' : 'default';
        try {
          actx = new (window.AudioContext || window.webkitAudioContext)();
          var src = actx.createMediaStreamSource(s);
          analyser = actx.createAnalyser();
          analyser.fftSize = 512;
          src.connect(analyser);
          micBuf = new Uint8Array(analyser.frequencyBinCount);
          /* 电平条用 setInterval 而不是 rAF：录屏一开始，浏览器就把这个标签页
             判为非活跃，rAF 会被挂起 —— 表现就是录着录着电平条不动了。 */
          clearInterval(levelTimer);
          levelTimer = setInterval(function () {
            if (!analyser) return;
            analyser.getByteFrequencyData(micBuf);
            var sum = 0;
            for (var i = 0; i < micBuf.length; i++) sum += micBuf[i];
            R.level.style.width = Math.min(100, Math.round(sum / micBuf.length / 128 * 100)) + '%';
          }, 120);
        } catch (e) {}
        return s;
      });
  }
  function closeMic() {
    if (st.mic) { st.mic.getTracks().forEach(function (t) { t.stop(); }); st.mic = null; }
    clearInterval(levelTimer); levelTimer = 0;
    if (actx) { try { actx.close(); } catch (e) {} actx = null; analyser = null; }
    R.level.style.width = '0%';
  }

  /* ---------- 设置 ----------
     头像（摄像头气泡）的大小 / 形状 / 位置 / 布局在**管理页**里设好存本机，
     演示页加载时直接沿用 —— 录屏入口已挪到管理页，全屏里不再开面板调这些。 */
  var RS_KEY = 'deck.rec.settings';
  function readRs() {
    try { return JSON.parse(localStorage.getItem(RS_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function writeRs(o) { try { localStorage.setItem(RS_KEY, JSON.stringify(o)); } catch (e) {} }
  function saveSettings() {
    var o = readRs();
    o.cam = !!(R.cam && R.cam.checked);
    o.mic = !!(R.mic && R.mic.checked);
    o.size = parseInt(R.size.value, 10) || 260;
    var sh = R.shape && R.shape.querySelector('button.on');
    o.shape = sh ? sh.dataset.s : 'circle';
    var pb = $('rpPos') && $('rpPos').querySelector('button.on');
    o.pos = pb ? pb.dataset.p : 'br';
    var lb = R.layout && R.layout.querySelector('button.on');
    o.layout = lb ? lb.dataset.l : 'corner';
    o.freeX = st.freeX; o.freeY = st.freeY;
    writeRs(o);
  }
  function markOn(wrap, attr, val) {
    if (!wrap) return;
    Array.prototype.forEach.call(wrap.children, function (b) {
      b.classList.toggle('on', b.dataset[attr] === val);
    });
  }
  /* 设备选在管理页做（全屏里不该再弹面板挑设备），演示页只负责读回来照着开。
     st.camDeviceId 记录**当前实际在用**的那台，为空就回落到设置里的选择。 */
  function camId() { return st.camDeviceId || (readRs().camDeviceId || ''); }
  function micId() { return st.micDeviceId || (readRs().micDeviceId || ''); }
  function applySettings() {
    var o = readRs();
    if (R.cam) R.cam.checked = o.cam !== false;
    if (R.mic) R.mic.checked = o.mic !== false;
    if (R.teleIn && typeof o.tele === 'string') R.teleIn.value = o.tele;
    var size = Math.max(80, Math.min(420, parseInt(o.size, 10) || 260));
    if (R.size) R.size.value = size;
    if (R.sizeVal) R.sizeVal.textContent = size + 'px';
    st.camSize = size;
    var shape = (o.shape === 'square') ? 'square' : 'circle';
    markOn(R.shape, 's', shape); st.camShape = shape;
    var pos = (['br', 'bl', 'tr', 'tl'].indexOf(o.pos) >= 0) ? o.pos : 'br';
    markOn($('rpPos'), 'p', pos); R.pos = pos;
    var layout = (['corner', 'side', 'full'].indexOf(o.layout) >= 0) ? o.layout : 'corner';
    markOn(R.layout, 'l', layout); st.layout = layout;
    /* 自由位置（拖出来的）：存的是 0~1 的比例坐标，跟着画面尺寸走 */
    st.freeX = (typeof o.freeX === 'number' && o.freeX >= 0 && o.freeX <= 1) ? o.freeX : null;
    st.freeY = (typeof o.freeY === 'number' && o.freeY >= 0 && o.freeY <= 1) ? o.freeY : null;
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
    /* 画笔只在画布模式可用：屏幕模式下笔迹长在屏幕上，会被屏幕流录进去，
       合成时再画一遍就成了重影 —— 直接禁掉，不给用户埋雷。 */
    if (R.inkChk) {
      R.inkChk.disabled = !canvasOk;
      var inkRow = R.inkChk.closest('.rp-row');
      if (inkRow) inkRow.classList.toggle('off', !canvasOk);
      if (!canvasOk) R.inkChk.checked = false;
    }
    st.camSize = parseInt(R.size.value, 10) || 260;
    R.sizeVal.textContent = R.size.value + 'px';
    st.layout = (R.layout && R.layout.querySelector('button.on')) ?
                R.layout.querySelector('button.on').dataset.l : 'corner';
    teleParse();
    var p1 = openCam(camId()).catch(function () { R.camOff.hidden = false; });
    var p2 = openMic(micId()).catch(function () { R.mic.checked = false; });
    Promise.all([p1, p2]).then(function () {
      populateDevices();
      /* 面板一开就把气泡预览摆出来：不用等真的开始录，
         拖大小 / 换方位 / 改形状能立刻看到效果。 */
      pipSync();
    });
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
    if (!st.recording) { closeCam(); closeMic(); pipSync(); }
  }

  /* ---------- 录制 ---------- */
  /* 优先 MP4(H.264)：WebM 在微信、剪映、Premiere 里都要先转一手，
     MP4 是真正能直接发出去的格式。Chrome 130+ / Safari 都支持
     MediaRecorder 直出 MP4；不支持的浏览器自动退回 WebM。 */
  function pickMime() {
    var cands = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (var i = 0; i < cands.length; i++) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(cands[i])) return cands[i];
    }
    return '';
  }

  /* 统一建 recorder：记下真正用到的格式，成片面板和下载文件名都靠它 */
  function makeRecorder(tracks) {
    var mime = pickMime();
    var mr;
    try { mr = new MediaRecorder(new MediaStream(tracks), { mimeType: mime }); }
    catch (e) { mr = new MediaRecorder(new MediaStream(tracks)); }
    st.mime = mr.mimeType || mime || 'video/webm';
    st.ext = /mp4/i.test(st.mime) ? 'mp4' : 'webm';
    st.chunks = [];
    mr.ondataavailable = function (e) { if (e.data && e.data.size) st.chunks.push(e.data); };
    mr.onstop = finish;
    return mr;
  }

  /* ---------- 沉默让位 ----------
     麦克风安静一会儿就把头像缩小、压暗，开口立刻恢复 —— 画面重心让给内容。
     电平循环用 setInterval 而不是 rAF：录屏时浏览器会把标签页判为非活跃，
     rAF 会被挂起（面板里那个电平条之前一直不动就是这个原因）。 */
  function startVoiceWatch() {
    stopVoiceWatch();
    st.quiet = false; st.quietSince = 0;
    if (!R.quietChk || !R.quietChk.checked || !analyser) return;
    st.voiceTimer = setInterval(function () {
      if (!analyser || st.paused) return;
      analyser.getByteFrequencyData(micBuf);
      var sum = 0;
      for (var i = 0; i < micBuf.length; i++) sum += micBuf[i];
      var loud = sum / micBuf.length > 8;          /* 经验阈值：说话时远高于此 */
      var now = Date.now();
      if (loud) { st.quiet = false; st.quietSince = 0; }
      else {
        if (!st.quietSince) st.quietSince = now;
        if (now - st.quietSince > st.QUIET_MS) st.quiet = true;
      }
      /* 屏幕模式下 PIP 本身就是成片头像，尺寸必须跟着变，否则和画布对不上 */
      if (st.quiet !== st.lastQuiet) { st.lastQuiet = st.quiet; pipSync(); }
    }, 120);
  }
  function stopVoiceWatch() {
    clearInterval(st.voiceTimer); st.voiceTimer = 0;
    st.quiet = false; st.quietSince = 0;
  }

  /* ---------- 章节标记 ----------
     翻页时记一个时间点。deck.js 会把页码写进 #pager，读它的文本最稳，
     不用去碰 deck.js 内部状态。只在画布 / 屏幕模式都适用。 */
  function watchChapter(w, h) {
    if (!st.recording || st.paused) return;
    var p = $('pager');
    var txt = p ? (p.textContent || '').trim() : '';
    if (!txt || txt === st.lastPage) return;
    st.lastPage = txt;
    var t = Math.round((Date.now() - st.t0) / 1000);
    if (t < 1) return;                            /* 第 0 秒那次是初始页，不算章节 */
    st.chapters.push({ t: t, page: txt });
  }

  /* ---------- 画笔 ----------
     三层结构里我们只缺「绘制层」：录制画布是合成层，舞台是预览层。
     用户在 inkLayer 上画（屏幕坐标），draw() 按比例缩放画进合成画布。
     笔迹默认 4 秒淡出（Loom 同款），想留着就勾「常驻」。 */
  function inkResize() {
    if (!R.ink) return;
    R.ink.width = window.innerWidth;
    R.ink.height = window.innerHeight;
  }
  function inkShow(on) {
    if (!R.ink) return;
    R.ink.hidden = !on;
    R.ink.classList.toggle('on', !!on);
    if (on) inkResize();
  }
  function inkClear() { st.inkStrokes = []; if (R.inkCtx && R.ink) R.inkCtx.clearRect(0, 0, R.ink.width, R.ink.height); }
  function inkFade(now) {
    if (!R.inkCtx || !R.ink) return;
    var c = R.inkCtx, W = R.ink.width, H = R.ink.height;
    c.clearRect(0, 0, W, H);
    var alive = [];
    for (var i = 0; i < st.inkStrokes.length; i++) {
      var s = st.inkStrokes[i];
      var age = now - s.t;
      var alpha = st.inkKeep ? 1 : Math.max(0, 1 - age / st.INK_FADE);
      if (alpha <= 0) continue;                   /* 淡完了就丢掉，别越积越多 */
      alive.push(s);
      c.save();
      c.globalAlpha = alpha;
      c.strokeStyle = s.color;
      c.lineWidth = s.w; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      for (var j = 0; j < s.pts.length; j++) {
        if (j === 0) c.moveTo(s.pts[j][0], s.pts[j][1]);
        else c.lineTo(s.pts[j][0], s.pts[j][1]);
      }
      c.stroke();
      c.restore();
    }
    st.inkStrokes = alive;
  }
  function inkBind() {
    if (!R.ink) return;
    var drawing = false, cur = null;
    R.ink.addEventListener('pointerdown', function (e) {
      if (!st.inkOn) return;
      drawing = true;
      cur = { t: Date.now(), color: '#FF5B4A', w: Math.max(3, Math.round(window.innerHeight * 0.006)), pts: [[e.clientX, e.clientY]] };
      st.inkStrokes.push(cur);
      R.ink.setPointerCapture(e.pointerId);
    });
    R.ink.addEventListener('pointermove', function (e) {
      if (!drawing || !cur) return;
      cur.pts.push([e.clientX, e.clientY]);
    });
    function end() { drawing = false; cur = null; }
    R.ink.addEventListener('pointerup', end);
    R.ink.addEventListener('pointercancel', end);
  }
  /* 把笔迹画进合成画布：屏幕像素 → 画布像素的比例换算 */
  function inkComposite(w, h) {
    if (!R.ink || R.ink.hidden || !st.inkStrokes.length) return;
    var sx = w / R.ink.width, sy = h / R.ink.height;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var now = Date.now();
    for (var i = 0; i < st.inkStrokes.length; i++) {
      var s = st.inkStrokes[i];
      var alpha = st.inkKeep ? 1 : Math.max(0, 1 - (now - s.t) / st.INK_FADE);
      if (alpha <= 0) continue;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.w * sx;
      ctx.beginPath();
      for (var j = 0; j < s.pts.length; j++) {
        var x = s.pts[j][0] * sx, y = s.pts[j][1] * sy;
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- 提词器 ----------
     面板里用单独一行 --- 分页，翻页自动切到下一段。
     只在画布模式显示：屏幕模式下它长在屏幕上，会被屏幕流录进成片，
     那就不是「提词器」而是穿帮了。 */
  function teleParse() {
    var raw = R.teleIn ? (R.teleIn.value || '').trim() : '';
    st.telePages = raw ? raw.split(/^\s*-{3,}\s*$/m).map(function (s) { return s.trim(); }).filter(Boolean) : [];
    st.teleIdx = 0;
  }
  function teleSync() {
    if (!R.tele) return;
    /* 只在画布模式显示：屏幕模式下它长在屏幕上，会被屏幕流录进成片，
       那就不是提词器而是穿帮了。 */
    var show = st.mode === 'canvas' && st.teleOn && st.telePages.length &&
               st.recording && !st.paused;
    R.tele.hidden = !show;
    if (!show) return;
    var p = $('pager');
    var n = p ? parseInt((p.textContent || '').split('/')[0], 10) : 1;
    if (!isNaN(n)) st.teleIdx = Math.min(st.telePages.length - 1, Math.max(0, n - 1));
    var txt = st.telePages[st.teleIdx] || '';
    if (txt !== st.teleTxt) { st.teleTxt = txt; R.tele.textContent = txt; }
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

    teleParse();
    st.teleOn = true;
    st.inkOn = !!(R.inkChk && R.inkChk.checked && !R.inkChk.disabled);
    inkClear();
    inkShow(st.inkOn);

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
      useCam ? openCam(camId())['catch'](function (e) {
        R.note.innerHTML = '摄像头打不开：' + ((e && e.message) || e) + '。已开始录制无头像版本。';
        return null;
      }) : Promise.resolve(null),
      useMic ? openMic(micId())['catch'](function (e) {
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

      st.rec = makeRecorder(tracks);
      st.chapters = []; st.lastPage = '';
      st.paused = false;
      startVoiceWatch();

      st.recording = true;
      setCleanMode(true);
      R.bar.hidden = true;
      $('hRec').classList.add('recording');
      pipSync();

      return countdown(3).then(function () {
        st.recording = true;
        st.t0 = Date.now();
        st.rec.start(1000);
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
      return R.cam.checked ? openCam(camId()).catch(function () { return null; }) : null;
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

      var mr = makeRecorder(tracks);
      st.rec = mr;
      st.chapters = []; st.lastPage = '';
      st.paused = false;
      startVoiceWatch();

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
    if (st.paused) return;

    /* 每帧顺手做的三件小事：记章节、同步提词、让笔迹淡出 */
    watchChapter(w, h);
    teleSync();
    inkFade(Date.now());

    /* 画布模式：成片 = 图卡铺满 + 摄像头气泡。
       img 是同源 blob，直接画；翻页时 img.src 换了，下一帧自动就是新图卡。 */
    if (st.mode === 'canvas') {
      var img = R.slide;
      var onSlide = !document.body.classList.contains('show-web') &&
                    img && img.naturalWidth > 0;
      ctx.fillStyle = '#151210';           /* 图卡若带透明区域，垫深底 */
      ctx.fillRect(0, 0, w, h);
      if (onSlide) drawSlide(img, w, h);
      else {
        /* 录制中翻到了网页 / 文档卡：跨域画不进画布，给个明确占位而不是花屏 */
        ctx.fillStyle = 'rgba(242,230,210,.55)';
        ctx.font = Math.round(h * 0.045) + 'px "LXGW WenKai", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('这一页是网页 / 文档卡片，不参与录制', w / 2, h / 2);
        ctx.textAlign = 'left';
      }
      inkComposite(w, h);
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

  /* 图卡 + 头像按「布局」合成（Screen Studio 同款三种）：
     corner 角落浮窗（图卡铺满）/ side 侧边分屏 / full 全屏头像。
     头像不可用时任何一种都自动退化成「只画图卡」，不会黑屏。 */
  function drawSlide(img, w, h) {
    var feed = camSource();
    var camOn = !!(R.cam.checked && st.cam && feed);

    if (camOn && st.layout === 'full') { drawCover(feed, 0, 0, w, h); return; }

    if (camOn && st.layout === 'side') {
      var camW = Math.round(w * 0.3);
      drawContain(img, 0, 0, w - camW, h);
      ctx.fillStyle = 'rgba(232,160,76,.16)';
      ctx.fillRect(w - camW - 1, 0, 2, h);          /* 一条细金线分界 */
      drawCover(feed, w - camW, 0, camW, h);
      return;
    }

    ctx.drawImage(img, 0, 0, w, h);                  /* 画布尺寸=图卡比例，天然满屏 */
    drawCamBubble(w, h, false);
  }
  /* contain：整张都放进去，居中，两侧留深底（不拉伸变形） */
  function drawContain(img, x, y, bw, bh) {
    var iw = img.naturalWidth || img.videoWidth || 1;
    var ih = img.naturalHeight || img.videoHeight || 1;
    var k = Math.min(bw / iw, bh / ih);
    var dw = iw * k, dh = ih * k;
    ctx.drawImage(img, x + (bw - dw) / 2, y + (bh - dh) / 2, dw, dh);
  }
  /* cover：铺满目标框，多出来的裁掉（摄像头常用，避免压扁） */
  function drawCover(feed, x, y, bw, bh) {
    var fw = feed.videoWidth || 4, fh = feed.videoHeight || 3;
    var k = Math.max(bw / fw, bh / fh);
    var dw = fw * k, dh = fh * k;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, bw, bh); ctx.clip();
    ctx.translate(x + bw / 2, y + bh / 2);
    ctx.scale(-1, 1);                                /* 镜像，和预览一致 */
    ctx.drawImage(feed, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    /* 头像区域描一圈品牌橙，和角落气泡统一 */
    ctx.strokeStyle = 'rgba(245,80,0,.9)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(bw, bh) * 0.012));
    ctx.strokeRect(x, y, bw, bh);
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
    /* 沉默让位：安静一会儿就缩小压暗，把画面重心还给内容 */
    var k = st.quiet ? 0.62 : 1;
    r = Math.round(r * k);
    var pad = Math.round(Math.min(w, h) * 0.03);
    var c = camCenter(w, h, r, pad);
    var cx = c.cx, cy = c.cy;

    ctx.save();
    if (st.quiet) ctx.globalAlpha = 0.62;
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

    ctx.save();
    if (st.quiet) ctx.globalAlpha = 0.62;
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
    ctx.restore();
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

  /* ---------- Esc 的真实语义：结束录屏，直接回管理页 ----------
     关键事实：真机全屏时按 Esc，浏览器**自己**拿去退全屏，页面常常根本
     收不到 keydown ——「Esc 停录」此前只在测试里成立（测试是程序派发的事件），
     真机表现就是「全屏退了、录制还在继续」，正好是用户看到的现象。
     所以退出信号要从 fullscreenchange 接：全屏丢了 + 录制中 = 用户要结束。
     结束 = 停录 + 成片自动存到「下载」（不丢这一条）+ 回管理页，无中间步骤。 */
  function backHome() {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    var fe = null;
    try { fe = window.frameElement; } catch (e) {}
    if (fe && fe.ownerDocument && fe.ownerDocument.fullscreenElement === fe) {
      try { fe.ownerDocument.exitFullscreen(); } catch (e) {}
      return;   /* syncFsState 看到「退出全屏 + 无录制在身」会接手 quit() */
    }
    /* 本来就不在全屏（全屏早丢了）：直接回管理页 */
    if (window.__deckQuit) window.__deckQuit(); else location.href = 'home.html';
  }
  function fsActive() {
    if (document.fullscreenElement) return true;
    try {
      var fe = window.frameElement;
      return !!(fe && fe.ownerDocument.fullscreenElement === fe);
    } catch (e) { return false; }
  }
  function stopAndSave() {
    /* paused 也算在录（MediaRecorder 暂停时 state 是 'paused'）：
       不能把暂停中的录制误判成「还没开始」整条丢掉 */
    var recActive = st.rec && (st.rec.state === 'recording' || st.rec.state === 'paused');
    if (recActive && st.recording) { st.autoSave = true; stop(); return; }
    if (!st.recording && !st.busy) return;
    /* 倒计时里就退出了（还没真正开始写帧）：不出片，直接收尾回管理页 */
    st.recording = false; st.busy = false;
    recUiOff();
    cleanup();
    backHome();
  }
  function onFsChange() {
    if (fsActive()) return;
    if (st.recording) stopAndSave();   /* 全屏丢了 = 用户要结束 */
  }
  document.addEventListener('fullscreenchange', onFsChange);
  /* 全屏元素是宿主 iframe 时 fullscreenchange 只在父文档发——同源补挂一份 */
  try {
    if (window.parent && window.parent !== window) {
      window.parent.document.addEventListener('fullscreenchange', onFsChange);
    }
  } catch (e) {}

  /* ---------- 暂停 / 继续 ----------
     Loom 的暂停是刚需：讲错一段不用整条重来。
     暂停时把合成循环和计时一起停掉，但**不**停 captureStream ——
     MediaRecorder.pause() 负责不写帧，恢复后画面无缝接上。 */
  function pause() {
    if (!st.recording || st.paused || !st.rec) return;
    try { st.rec.pause(); } catch (e) {}
    st.paused = true;
    st.pausedAt = Date.now();
    clearInterval(st.dtimer); st.dtimer = 0;
    clearInterval(st.timer);
    if (R.pip) R.pip.classList.add('paused');
    if (R.pipTime) R.pipTime.textContent = '⏸ ' + (R.pipTime.textContent || '00:00');
    teleSync();
  }
  function resume() {
    if (!st.recording || !st.paused || !st.rec) return;
    try { st.rec.resume(); } catch (e) {}
    st.paused = false;
    /* 把暂停的时长补回起点，计时不把暂停算进去 */
    if (st.pausedAt) { st.t0 += Date.now() - st.pausedAt; st.pausedAt = 0; }
    if (R.pip) R.pip.classList.remove('paused');
    st.dtimer = setInterval(draw, 33);
    tickTime();
    teleSync();
  }

  /* 丢弃这次录制（不生成文件）；restart=true 时收尾后自动重开面板 */
  function discard(restart) {
    if (!st.recording) return;
    st.discard = true;
    st.restart = !!restart;
    stop();
  }

  /* 收掉录制期的一切 UI（干净模式 / 气泡 / 提词 / 计时）。finish 和
     「倒计时里就退出」的提前收尾共用，保证两条路清理得一样干净。 */
  function recUiOff() {
    clearInterval(st.timer);
    clearInterval(st.dtimer); st.dtimer = 0;
    cancelAnimationFrame(st.raf);
    stopVoiceWatch();
    setCleanMode(false);
    inkShow(false);
    if (R.tele) R.tele.hidden = true;
    if (R.pip) { R.pip.hidden = true; R.pip.classList.remove('paused', 'pip-off'); }
    R.bar.hidden = true;
    $('hRec').classList.remove('recording');
    st.paused = false;
  }

  function finish() {
    recUiOff();

    /* 丢弃：不落文件。重来则顺手把面板再打开一次，省一次点按。 */
    if (st.discard) {
      st.discard = false;
      cleanup(); st.busy = false;
      if (st.restart) { st.restart = false; autoStart(); }
      return;
    }

    var type = st.mime || (st.rec && st.rec.mimeType) || 'video/webm';
    var blob = new Blob(st.chunks, { type: type });

    if (!blob.size) {
      cleanup(); st.busy = false;
      alert('没有录到内容，可能是共享时选了不带画面的窗口。');
      return;
    }
    if (st.blobUrl) URL.revokeObjectURL(st.blobUrl);
    st.blobUrl = URL.createObjectURL(blob);

    var secs = Math.max(1, Math.round((Date.now() - st.t0) / 1000));
    var fmt = /mp4/i.test(type) ? 'MP4' : 'WebM';

    /* Esc 结束：不弹成片面板（用户明确不要中间步骤）——
       成片直接存进「下载」文件夹，然后回管理页。 */
    if (st.autoSave) {
      st.autoSave = false;
      var a = document.createElement('a');
      a.href = st.blobUrl;
      a.download = '演示录制-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.' + (st.ext || 'webm');
      document.body.appendChild(a); a.click(); a.remove();
      cleanup(); st.busy = false;
      backHome();
      return;
    }

    R.info.textContent = '时长约 ' + Math.floor(secs / 60) + ' 分 ' + (secs % 60) + ' 秒 · ' +
      (blob.size / 1048576).toFixed(1) + ' MB · ' + fmt + ' · 只存在你本机，不上传';
    R.prevOut.src = st.blobUrl;
    renderChapters();
    R.done.hidden = false;

    cleanup();
    st.busy = false;
  }

  /* 章节列表：翻页时间点，点一下跳到那一刻（方便回看某张卡讲得怎么样） */
  function renderChapters() {
    if (!R.chapters) return;
    if (!st.chapters.length) { R.chapters.hidden = true; R.chapters.innerHTML = ''; return; }
    var html = '<div class="rc-t">章节 · 点一下跳转</div><div class="rc-list">';
    st.chapters.forEach(function (c) {
      var mm = String(Math.floor(c.t / 60)).padStart(2, '0');
      var ss = String(c.t % 60).padStart(2, '0');
      html += '<button class="rc-item" data-t="' + c.t + '"><b>' + mm + ':' + ss +
              '</b><span>第 ' + c.page + ' 页</span></button>';
    });
    html += '</div>';
    R.chapters.innerHTML = html;
    R.chapters.hidden = false;
    Array.prototype.forEach.call(R.chapters.querySelectorAll('.rc-item'), function (b) {
      b.addEventListener('click', function () {
        try { R.prevOut.currentTime = parseInt(b.dataset.t, 10); R.prevOut.play(); } catch (e) {}
      });
    });
  }

  function cleanup() {
    if (st.screen) { st.screen.getTracks().forEach(function (t) { t.stop(); }); st.screen = null; }
    if (st.actx) { try { st.actx.close(); } catch (e) {} st.actx = null; }
    closeCam(); closeMic();
  }

  /* ---------- 事件 ---------- */
  $('hRec').addEventListener('click', function () {
    /* 设置都在管理页了，这里不再开面板：直接按设置开录（X / Esc 可停） */
    if (st.recording) stop(); else autoStart();
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
      openCam(camId()).then(function () { pipSync(); }).catch(function (e) {
        deviceFail(R.cam, '摄像头打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。');
        pipSync();
      });
    } else { closeCam(); pipSync(); }
  });
  R.mic.addEventListener('change', function () {
    if (R.mic.checked) {
      openMic(micId()).catch(function (e) {
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
      openCam(camId()).catch(function () { deviceFail(R.cam, '摄像头打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。'); });
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
      /* 切不过去就把下拉拨回当前真正在用的那个，别让它留在一个假的选项上 */
      R.micDevice.value = st.micDeviceId || '';
      openMic(micId()).catch(function () { deviceFail(R.mic, '麦克风打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。'); });
      R.note.innerHTML = '这个麦克风打不开，已退回上一个。';
    });
  });
  R.size.addEventListener('input', function () {
    st.camSize = parseInt(R.size.value, 10) || 260;
    R.sizeVal.textContent = R.size.value + 'px';
    pipSync();
    saveSettings();
  });
  R.shape.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    st.camShape = b.dataset.s;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    pipSync();
    saveSettings();
  });
  $('rpPos').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    R.pos = b.dataset.p;
    st.freeX = st.freeY = null;      /* 点四角 = 回到吸附，清掉自由位置 */
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
    pipSync();
    saveSettings();
  });
  if (R.layout) {
    R.layout.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      st.layout = b.dataset.l;
      Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
      pipSync();
      saveSettings();
    });
  }
  if (R.inkChk) {
    R.inkChk.addEventListener('change', function () {
      st.inkKeep = false;                 /* 每次重新打开画笔都回到「会淡出」 */
      if (!R.inkChk.checked) inkShow(false);
    });
  }
  if (R.quietChk) {
    R.quietChk.addEventListener('change', function () {
      if (!R.quietChk.checked) { st.quiet = false; pipSync(); }
    });
  }
  if (R.teleIn) R.teleIn.addEventListener('input', teleParse);

  /* 录制中打开画笔：录制已经开始，面板早就收起了，靠 D 键切换 */
  function toggleInk() {
    if (!R.inkChk || R.inkChk.disabled || !st.recording) return;
    R.inkChk.checked = !R.inkChk.checked;
    st.inkOn = R.inkChk.checked;
    inkShow(st.inkOn);
  }
  function nextLayout(n) {
    if (!R.layout || !st.recording || st.mode !== 'canvas') return;
    var btns = R.layout.querySelectorAll('button');
    if (!btns[n]) return;
    st.layout = btns[n].dataset.l;
    Array.prototype.forEach.call(btns, function (x) { x.classList.toggle('on', x === btns[n]); });
    pipSync();
  }

  $('rdSave').addEventListener('click', function () {
    if (!st.blobUrl) return;
    var a = document.createElement('a');
    a.href = st.blobUrl;
    a.download = '演示录制-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.' + (st.ext || 'webm');
    document.body.appendChild(a); a.click(); a.remove();
  });
  $('rdAgain').addEventListener('click', function () {
    R.done.hidden = true;
    autoStart();          /* 再录一次 = 直接重新开录，不再弹设置面板 */
  });
  /* 取消：不要这条成片了 → 丢弃并退回管理页。
     在全屏里就先退全屏——syncFsState 看到「退出全屏 + 无录制在身」会自动接手回管理页；
     本来就没在全屏就直接回。Esc 关掉成片面板走同一条路。 */
  function cancelDone() {
    R.done.hidden = true;
    if (st.blobUrl) { try { URL.revokeObjectURL(st.blobUrl); } catch (e) {} st.blobUrl = ''; }
    backHome();
  }
  $('rdCancel').addEventListener('click', cancelDone);

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
      paused: st.paused,
      layout: st.layout,
      chapters: st.chapters.length,
      inkOn: st.inkOn, inkStrokes: st.inkStrokes.length,
      quiet: st.quiet, telePages: st.telePages.length,
      mime: st.mime, ext: st.ext,
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
      /* 实际在用哪台设备（空 = 系统默认）—— 管理页选的和这里开的不一致时先看这两个 */
      camDeviceId: st.camDeviceId || '',
      micDeviceId: st.micDeviceId || '',
      camFrom: st.camFrom, micFrom: st.micFrom,
      freeX: st.freeX, freeY: st.freeY,
      feedFound: !!feed,
      feedId: feed ? (feed.id || '(anon)') : null,
      feedW: feed ? feed.videoWidth : 0,
      feedReady: feed ? feed.readyState : -1,
      canvas: canvas.width + 'x' + canvas.height
    };
  };

  /* 录制中的快捷键走**捕获阶段**，并且处理完就 stopImmediatePropagation：
     deck.js 自己也监听了空格（翻页）、Esc（退出演示）、P（上一页），
     不拦住的话「按空格暂停」会顺带翻到下一页、「按 Esc 停止」会直接退出演示。 */
  document.addEventListener('keydown', function (e) {
    if (!st.recording) return;
    var t = document.activeElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    var k = e.key;
    function take() { e.preventDefault(); e.stopImmediatePropagation(); }
    if (k === ' ' || k === 'Spacebar') { take(); if (st.paused) resume(); else pause(); return; }
    /* Esc = 结束录屏（自动存片）+ 回管理页；R = 停下来看成片面板（章节 / 另存） */
    if (k === 'Escape') { take(); stopAndSave(); return; }
    if (k === 'r' || k === 'R') { take(); stop(); return; }
    if (k === 'x' || k === 'X') { take(); discard(true); return; }
    if (k === 'd' || k === 'D') { take(); toggleInk(); return; }
    if (k === 't' || k === 'T') { take(); st.teleOn = !st.teleOn; teleSync(); return; }
    if (k === '1' || k === '2' || k === '3') { take(); nextLayout(parseInt(k, 10) - 1); return; }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (st.recording) { e.preventDefault(); stopAndSave(); return; }
      if (!R.done.hidden) { e.preventDefault(); cancelDone(); return; }
      if (!R.panel.hidden) { closePanel(); return; }
      return;
    }
    var t = document.activeElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'r' || e.key === 'R') {
      if (st.recording) { e.preventDefault(); stop(); }
      else if (R.done.hidden && R.panel.hidden) { e.preventDefault(); autoStart(); }
    }
  });

  /* 管理页点「录屏」进来（URL 带 rec=1）：授权已在管理页拿过，
     这里不再开面板，等图卡就位后直接开录（含 3 秒倒计时）。 */
  function waitSlide(cb) {
    var img = R.slide, n = 0;
    (function chk() {
      if (img && img.naturalWidth > 0) return cb();
      if (n++ > 40) return cb();      /* 最多等 2 秒，超时也开录，不卡死 */
      setTimeout(chk, 50);
    })();
  }
  function autoStart() {
    if (st.busy || st.recording) return;
    applySettings();
    teleParse();
    waitSlide(function () { start(); });
  }
  window.__recAutoStart = autoStart;

  inkBind();
  applySettings();
  window.addEventListener('beforeunload', cleanup);
})();