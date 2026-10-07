/* 演示页：全屏播放，键盘/鼠标翻页（网站版：去掉 chrome.* API，用浏览器全屏 API） */
(function () {
  'use strict';

  var slides = [], cur = 0, ready = false, awakeTimer = null, wheelLock = 0;
  var $ = function (id) { return document.getElementById(id); };
  var slide = $('slide');
  var frame = $('web');
  var loadTimer = null;
  var imgGen = 0;
  function clearLoading() { document.body.classList.remove('loading'); }

  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ''); }
    catch (e) { return u; }
  }

  DeckStore.all().then(function (rows) {
    if (!rows.length) { $('none').classList.add('on'); return; }
    return DeckStore.getOrder().then(function (order) {
      var map = {};
      rows.forEach(function (r) {
        if (r.kind === 'web') map[r.id] = { kind: 'web', url: r.url, name: r.url, blocked: !!r.blocked };
        else if (r.kind === 'doc') {
          var durl = r.blob
            ? URL.createObjectURL(r.blob)
            : (r.html ? URL.createObjectURL(new Blob([r.html], { type: 'text/html' })) : '');
          map[r.id] = {
            kind: 'doc', name: r.name || '文档', ext: r.ext || '',
            html: r.html || '', url: durl
          };
        }
        else map[r.id] = { kind: 'img', url: URL.createObjectURL(r.blob) };
      });
      slides = order.filter(function (id) { return map[id]; }).map(function (id) { return map[id]; });
      Object.keys(map).forEach(function (id) {
        if (slides.indexOf(map[id]) < 0) slides.push(map[id]);
      });
      ready = true;
      buildStrip();
      var start = parseInt((location.hash || '').replace('#', ''), 10);
      show(isNaN(start) ? 0 : Math.max(0, Math.min(start, slides.length - 1)));
      flashTips();
      checkCover();
    });
  });

  /* 网站里没有"全屏窗口"概念：没进全屏就给一层封面，点一下用浏览器全屏 API 进入 */
  function checkCover() {
    if (!document.fullscreenElement) $('cover').classList.add('on');
  }

  function enterFs() {
    var el = document.documentElement;
    $('cover').classList.remove('on');
    if (document.fullscreenElement) return;
    try {
      var p = el.requestFullscreen && el.requestFullscreen();
      if (p && p.catch) {
        p.catch(function () { $('cover').classList.add('on'); });
      }
    } catch (e) {
      $('cover').classList.add('on');
    }
  }

  function openCurrent() {
    var s = slides[cur];
    if (!s) return;
    var url = s.url || '';
    if (!url) { toast2('这一页没有可打开的原文件'); return; }
    /* 网页 / 文档：直接用新标签页打开 */
    window.open(url, '_blank', 'noopener');
  }
  function toast2(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:76px;transform:translateX(-50%);z-index:20;' +
      'background:rgba(20,20,21,.92);color:#fff;font-size:13px;padding:8px 16px;border-radius:999px';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  }

  function showBlockedCard(s) {
    document.body.classList.add('show-blocked');
    $('bkTitle').textContent = '这个网页打不开';
    $('bkDomain').textContent = hostOf(s.url);
  }

  function resetStage() {
    frame.removeAttribute('src');
    frame.removeAttribute('srcdoc');
    document.body.classList.remove('show-web', 'show-blocked', 'loading', 'kind-web', 'kind-doc');
    slide.classList.remove('in');
  }

  function show(i) {
    if (!ready || !slides.length) return;
    cur = Math.max(0, Math.min(i, slides.length - 1));
    var s = slides[cur];
    resetStage();

    if (s.kind === 'web' || (s.kind === 'doc' && s.ext === 'pdf')) {
      var knownBlocked = s.kind === 'web' && s.blocked;
      if (knownBlocked) {
        showBlockedCard(s);
      } else {
        if (frame.getAttribute('src') !== s.url) {
          document.body.classList.add('loading');
          clearTimeout(loadTimer);
          loadTimer = setTimeout(clearLoading, 12000);
          frame.setAttribute('src', s.url);
        }
        document.body.classList.add('show-web', 'kind-' + (s.kind === 'web' ? 'web' : 'doc'));
      }
    } else if (s.kind === 'doc') {
      if (frame.getAttribute('srcdoc') !== s.html) {
        document.body.classList.add('loading');
        clearTimeout(loadTimer);
        loadTimer = setTimeout(clearLoading, 12000);
        frame.srcdoc = s.html;
      }
      document.body.classList.add('show-web', 'kind-doc');
    } else {
      if (slide.getAttribute('src') !== s.url) {
        var myGen = ++imgGen;
        slide.classList.remove('in');
        var pre = new Image();
        pre.onload = function () {
          if (myGen !== imgGen) return;
          slide.src = s.url; slide.classList.add('in');
        };
        pre.onerror = function () {
          if (myGen !== imgGen) return;
          slide.classList.add('in');
        };
        pre.src = s.url;
      } else {
        slide.classList.add('in');
      }
    }

    $('pager').textContent = (cur + 1) + ' / ' + slides.length;
    $('fill').style.width = ((cur + 1) / slides.length * 100) + '%';
    $('navPrev').disabled = $('hPrev').disabled = $('hFirst').disabled = (cur === 0);
    $('navNext').disabled = $('hNext').disabled = $('hLast').disabled = (cur === slides.length - 1);
    markStrip();
    reclaimFocus();   /* 翻页后把焦点抢回父页面，← → 立刻恢复可用 */
  }
  function next() { show(cur + 1); }
  function prev() { show(cur - 1); }

  function wake() {
    document.body.classList.add('awake');
    clearTimeout(awakeTimer);
    awakeTimer = setTimeout(function () {
      if (!$('strip').classList.contains('on')) document.body.classList.remove('awake');
    }, 2600);
  }
  function flashTips() {
    $('tips').classList.add('on');
    setTimeout(function () { $('tips').classList.remove('on'); }, 3600);
  }

  function buildStrip() {
    var st = $('strip');
    st.textContent = '';
    slides.forEach(function (s, i) {
      var d = document.createElement('div');
      d.className = 'it';
      if (s.kind === 'web') {
        d.classList.add('web');
        d.textContent = hostOf(s.url);
      } else if (s.kind === 'doc') {
        d.classList.add('web');
        d.textContent = s.name || '文档';
      } else {
        d.style.backgroundImage = 'url("' + s.url + '")';
      }
      d.addEventListener('click', function () { show(i); });
      st.appendChild(d);
    });
  }
  function markStrip() {
    var its = $('strip').children;
    for (var i = 0; i < its.length; i++) its[i].classList.toggle('cur', i === cur);
    if (its[cur] && its[cur].scrollIntoView) {
      its[cur].scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }
  function toggleStrip() {
    var st = $('strip');
    st.classList.toggle('on');
    document.body.classList.toggle('strip-on', st.classList.contains('on'));
    markStrip();
  }

  function quit() {
    try { window.close(); } catch (e) {}
    location.href = 'home.html';
  }

  /* ---------- 焦点管理 ----------
     点进 PDF / 网页后，焦点会被 iframe 内的文档接管，父页面就收不到 ← →，
     于是「翻页失效」。这里做三件事：
       1) reclaimFocus：翻页后把焦点抢回父页面；
       2) bridgeKeys：同源 iframe 注入按键桥，← → 直接翻页、↑ ↓ 留给内容滚动；
       3) 左右整列点击区（见 .nav），鼠标永远能翻页。 */
  function reclaimFocus() {
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
    try { if (window.focus) window.focus(); } catch (e) {}
  }

  /* 同源才注入；跨域（多数网站）静默跳过，交给左右点击区兜底 */
  function bridgeKeys() {
    if (!frame.contentWindow || frame.contentWindow.__deckBridged) return;
    var doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    if (!doc) return;
    try {
      frame.contentWindow.__deckBridged = true;
      doc.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter' || k === 'n') {
          e.preventDefault(); next();
        } else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'p') {
          e.preventDefault(); prev();
        } else if (k === 'Escape') {
          e.preventDefault();
          if (document.fullscreenElement) document.exitFullscreen(); else quit();
        }
        /* ↑ ↓ 不拦截：让 PDF / 网页自己滚动内容 */
      }, true);
    } catch (e) {}
  }

  function isInner() {
    var s = slides[cur];
    return !!s && (s.kind === 'web' || s.kind === 'doc');
  }

  /* ↑ ↓：交给内嵌内容滚动；内容滚不动了才翻页 */
  function scrollInner(dir) {
    var moved = false;
    try {
      var w = frame.contentWindow;
      if (w && typeof w.scrollBy === 'function') {
        var before = w.scrollY;
        w.scrollBy(0, dir * Math.round((w.innerHeight || 600) * 0.8));
        moved = w.scrollY !== before;
      }
    } catch (e) {}
    if (!moved) { if (dir > 0) next(); else prev(); }
  }

  /* ---------- 事件 ---------- */
  $('navPrev').addEventListener('click', function () { reclaimFocus(); prev(); });
  $('navNext').addEventListener('click', function () { reclaimFocus(); next(); });
  $('hPrev').addEventListener('click', function () { reclaimFocus(); prev(); });
  $('hNext').addEventListener('click', function () { reclaimFocus(); next(); });
  $('hFirst').addEventListener('click', function () { show(0); });
  $('hLast').addEventListener('click', function () { show(slides.length - 1); });
  $('hExit').addEventListener('click', quit);
  $('hGrid').addEventListener('click', toggleStrip);
  $('hOpen').addEventListener('click', openCurrent);
  $('hintOpen').addEventListener('click', openCurrent);
  $('bkOpen').addEventListener('click', openCurrent);
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen(); else enterFs();
  }
  $('fsBig').addEventListener('click', toggleFs);
  document.addEventListener('fullscreenchange', function () {
    document.body.classList.toggle('fs-on', !!document.fullscreenElement);
  });
  $('hFit').addEventListener('click', function () {
    document.body.classList.toggle('fit-cover');
  });
  $('btnHome').addEventListener('click', function () {
    location.href = 'home.html';
  });
  $('cover').addEventListener('click', enterFs);
  $('coverBack').addEventListener('click', function (e) {
    e.stopPropagation();
    location.href = 'home.html';
  });

  document.addEventListener('mousemove', wake);

  $('web').addEventListener('load', function () { clearLoading(); bridgeKeys(); });
  $('web').addEventListener('error', clearLoading);
  $('web').addEventListener('mouseenter', wake);

  /* 滚轮：在图片页翻页；鼠标悬在内嵌 PDF / 网页上时，交给内容自己滚动 */
  window.addEventListener('wheel', function (e) {
    if (!ready) return;
    var now = Date.now();
    if (now - wheelLock < 420) return;
    if (Math.abs(e.deltaY) < 12) return;
    var overInner = false;
    try { overInner = isInner() && (e.target === frame || frame.contains(e.target)); } catch (err) {}
    if (overInner) {
      /* 内容还能往下滚就让它滚，滚到底了才翻页 */
      var atEnd = false;
      try {
        var d = frame.contentDocument;
        atEnd = d ? (d.documentElement.scrollTop + d.documentElement.clientHeight >= d.documentElement.scrollHeight - 4) : false;
      } catch (err) {}
      if (!atEnd) return;
    }
    wheelLock = now;
    if (e.deltaY > 0) next(); else prev();
  }, { passive: true });

  document.addEventListener('keydown', function (e) {
    if (!ready) {
      if (e.key === 'Escape') quit();
      return;
    }
    var k = e.key;
    /* ↑ ↓：内嵌 PDF / 网页时滚动内容，滚不动了才翻页 */
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      e.preventDefault();
      if (isInner()) scrollInner(k === 'ArrowDown' ? 1 : -1);
      else if (k === 'ArrowDown') next(); else prev();
      return;
    }
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'n' || k === 'Enter') {
      if (k === 'ArrowRight' && slides[cur] && slides[cur].kind === 'web' && slides[cur].blocked && document.body.classList.contains('show-blocked')) {
        e.preventDefault();
        openCurrent();
        return;
      }
      e.preventDefault(); next();
    } else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'p') {
      e.preventDefault(); prev();
    } else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (k === 'Escape') {
      e.preventDefault();
      if (document.fullscreenElement) document.exitFullscreen(); else quit();
    }
    else if (k === 'g' || k === 'G') { toggleStrip(); }
    else if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) document.exitFullscreen(); else enterFs();
    }
  });
})();
