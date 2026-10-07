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
    camDevice: $('rpCamDevice'), micDevice: $('rpMicDevice'),
    size: $('rpSize'), sizeVal: $('rpSizeVal'), shape: $('rpShape')
  };

  var st = {
    screen: null, cam: null, mic: null,
    rec: null, chunks: [], blobUrl: null,
    raf: 0, timer: 0, t0: 0, busy: false, recording: false,
    composite: false, actx: null,
    camSize: 180, camShape: 'circle',
    camDeviceId: '', micDeviceId: ''
  };

  var NOTE_DEF = R.note.innerHTML;

  /* ---------- 纯净录制模式 ----------
     光靠 CSS class 不够稳：录制中用户鼠标一动，deck.js 的 mousemove 会重新
     加 awake，浏览器/扩展也可能重算样式。这里在录制期间直接给这些元素写内联
     display:none（内联优先级高于任何 class 规则），录完再原样恢复。 */
  var CLEAN_SEL = '.hud,.nav,#fsBig,#recBar,.tips,#webHint,.strip,#blocked';
  var savedDisplay = null;

  function setCleanMode(on) {
    document.body.classList.toggle('recording-clean', !!on);
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
        /* 预览与合成用两个 video 元素：面板里的会被 display:none 隐藏，
           而隐藏的 video 可能停止送帧，导致气泡画不出来。
           camSrc 始终渲染在屏幕外（1px、半透明），保证送帧稳定。 */
        R.prev.srcObject = s;
        R.camSrc.srcObject = s;
        R.camOff.hidden = true;
        return s;
      });
  }
  function closeCam() {
    if (st.cam) { st.cam.getTracks().forEach(function (t) { t.stop(); }); st.cam = null; }
    R.prev.srcObject = null;
    R.camSrc.srcObject = null;
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
    R.note.innerHTML = NOTE_DEF;
    st.camSize = parseInt(R.size.value, 10) || 180;
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

  /* 探测能否把屏幕流画进画布。捕获受保护内容（DRM/部分扩展）会抛 SecurityError，
     这时退化为「只录屏幕、不叠气泡」，宁可少功能也不要整个录不出来。 */
  function testComposite() {
    try {
      ctx.drawImage(st.screen, 0, 0, canvas.width, canvas.height);
      ctx.getImageData(0, 0, 1, 1);
      return true;
    } catch (e) { return false; }
  }

  function start() {
    if (st.busy || st.recording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('这个浏览器不支持屏幕录制，请用 Chrome / Edge。');
      return;
    }
    st.busy = true;
    R.panel.hidden = true;

    navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 60 } },
      audio: true,
      preferCurrentTab: true          /* Chrome 会把「当前标签页」排在最前 */
    }).then(function (screen) {
      st.screen = screen;
      return R.cam.checked ? openCam(R.camDevice.value).catch(function () { return null; }) : null;
    }).then(function () {
      var vt = st.screen.getVideoTracks()[0];
      var cfg = (vt && vt.getSettings) ? vt.getSettings() : {};
      canvas.width = cfg.width || 1920;
      canvas.height = cfg.height || 1080;

      st.composite = testComposite();

      var tracks;
      if (st.composite) {
        draw();                                   /* 先画首帧，再 captureStream */
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

      return countdown(3).then(function () {
        st.recording = true;
        st.t0 = Date.now();
        mr.start(1000);
        tickTime();
      });
    })['catch'](function (e) {
      setCleanMode(false);
      R.bar.hidden = true;
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

  /* ---------- 合成循环 ---------- */
  function draw() {
    st.raf = requestAnimationFrame(draw);
    var w = canvas.width, h = canvas.height;
    try { ctx.drawImage(st.screen, 0, 0, w, h); } catch (e) { return; }

    var camOn = R.cam.checked && st.cam && R.camSrc &&
                R.camSrc.videoWidth > 0 && R.camSrc.readyState >= 2;
    if (camOn) {
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
      ctx.drawImage(R.camSrc, cx - r, cy - r, r * 2, r * 2);
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

  function tickTime() {
    clearInterval(st.timer);
    st.timer = setInterval(function () {
      var s = Math.floor((Date.now() - st.t0) / 1000);
      R.time.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' +
                           String(s % 60).padStart(2, '0');
    }, 500);
  }

  function stop() {
    if (!st.rec || !st.recording) return;
    st.recording = false;
    try { st.rec.stop(); } catch (e) {}
  }

  function finish() {
    clearInterval(st.timer); cancelAnimationFrame(st.raf);
    setCleanMode(false);
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
      openCam(R.camDevice.value).catch(function (e) {
        deviceFail(R.cam, '摄像头打不开：' + ((e && e.message) || e) + '。可换个设备或关掉这项。');
      });
    } else closeCam();
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
    st.camSize = parseInt(R.size.value, 10) || 180;
    R.sizeVal.textContent = R.size.value + 'px';
  });
  R.shape.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    st.camShape = b.dataset.s;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
  });
  $('rpPos').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    R.pos = b.dataset.p;
    Array.prototype.forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); });
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