/* 管理页：上传 / 排序 / 删除 / 开始演示（网站版：去掉 chrome.* API） */
(function () {
  'use strict';

  var slides = [];      // { id, kind:'img'|'web', name, w, h, url }
  var selected = null;
  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), empty = $('empty');

  /* ---------- 加入图片 ---------- */
  var DOC_EXT = { pdf: 1, docx: 1, doc: 1, xlsx: 1, xls: 1, csv: 1, txt: 1, md: 1, html: 1, htm: 1 };

  function extOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(name || '');
    return m ? m[1].toLowerCase() : '';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function addFiles(fileList) {
    var all = Array.prototype.slice.call(fileList || []);
    var imgs = [], docs = [];
    all.forEach(function (f) {
      var ext = extOf(f.name);
      if (DOC_EXT[ext]) docs.push(f);
      else if (!f.type || f.type.indexOf('image/') === 0) imgs.push(f);
    });

    if (imgs.length) {
      imgs.forEach(function (f) {
        var url = URL.createObjectURL(f);
        var item = { id: null, kind: 'img', name: f.name || '剪贴板图片', w: 0, h: 0, url: url };
        slides.push(item);
        probe(url, item);
        DeckStore.put(f).then(function (id) { item.id = id; save(); });
      });
      render();
      toast('已加入 ' + imgs.length + ' 张');
    }
    docs.forEach(parseDoc);
    if (!imgs.length && !docs.length) toast('不支持的文件类型');
  }

  /* ---------- 加入文档：PDF 原样存，Word/Excel 转成 HTML ---------- */
  var DOC_CSS =
    'body{margin:0;padding:34px 40px;background:#FFFDF8;color:#2A2724;' +
    'font:16px/1.75 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}' +
    'h1,h2,h3{font-weight:600;line-height:1.35;margin:1.3em 0 .5em}' +
    'p{margin:.6em 0}table{border-collapse:collapse;width:100%;font-size:14px;margin:1em 0}' +
    'td,th{border:1px solid #E3DACD;padding:6px 10px;text-align:left;vertical-align:top}' +
    'th{background:#F5EFE6;font-weight:600}tr:nth-child(even) td{background:#FBF8F3}' +
    'img{max-width:100%}pre{white-space:pre-wrap;word-break:break-word;font:15px/1.7 inherit}';

  function docShell(inner) {
    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><style>'
      + DOC_CSS + '</style></head><body>' + inner + '</body></html>';
  }

  function sheetHtml(wb) {
    var name = wb.SheetNames[0];
    var ws = wb.Sheets[name];
    var raw = ws ? XLSX.utils.sheet_to_html(ws) : '';
    var m = /<table[\s\S]*<\/table>/i.exec(raw);
    return docShell('<h3>' + escapeHtml(name) + '</h3>' + (m ? m[0] : '<p>（空表格）</p>'));
  }

  function mammothHtml(buf) {
    return new Promise(function (res, rej) {
      function done(err, out) {
        if (err) rej(err);
        else if (out && out.value != null) res(out.value);
      }
      var maybe = mammoth.convertToHtml({ arrayBuffer: buf }, { includeDefaultStyleMap: true }, done);
      if (maybe && maybe.then) maybe.then(function (out) { done(null, out); }, rej);
    });
  }

  function readDoc(file, ext) {
    if (ext === 'txt' || ext === 'md') {
      return file.text().then(function (t) { return docShell('<pre>' + escapeHtml(t) + '</pre>'); });
    }
    if (ext === 'csv') {
      return file.text().then(function (t) { return sheetHtml(XLSX.read(t, { type: 'string' })); });
    }
    if (ext === 'xlsx' || ext === 'xls') {
      return file.arrayBuffer().then(function (buf) {
        return sheetHtml(XLSX.read(new Uint8Array(buf), { type: 'array' }));
      });
    }
    if (ext === 'docx') {
      return file.arrayBuffer().then(mammothHtml).then(docShell);
    }
    /* HTML：完整文档（带 doctype / <html>）原样渲染，保留它自己的样式与脚本；
       片段则套一层统一排版外壳，避免裸片段贴边、字体突兀。 */
    if (ext === 'html' || ext === 'htm') {
      return file.text().then(function (t) {
        if (/<!doctype|<html[\s>]/i.test(t)) return t;
        return docShell(t);
      });
    }
    return Promise.reject(new Error('unsupported'));
  }

  function parseDoc(file) {
    var name = file.name || '文档';
    var ext = extOf(name);
    var item = { id: null, kind: 'doc', name: name, ext: ext, html: '', url: '' };
    slides.push(item);
    render();

    function fail(msg) {
      var i = slides.indexOf(item);
      if (i >= 0) slides.splice(i, 1);
      render();
      toast(msg);
    }
    function ok(val) {
      return DeckStore.putDoc(val).then(function (id) {
        item.id = id;
        if (val.blob) item.url = URL.createObjectURL(val.blob);
        save(); render();
        toast('已加入 ' + name);
      });
    }

    if (ext === 'pdf') { ok({ name: name, ext: ext, blob: file }); return; }
    if (ext === 'doc') { fail('旧版 .doc 打不开，请用 Word 另存为 .docx'); return; }

    readDoc(file, ext).then(function (html) {
      return ok({ name: name, ext: ext, html: html });
    })['catch'](function () {
      fail('解析失败：' + name);
    });
  }

  /* ---------- 加入网页 ---------- */
  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ''); }
    catch (e) { return u; }
  }

  /* 把粘贴的文本变成可演示的 URL；YouTube 自动转成可嵌入播放器地址 */
  function normalizeUrl(raw) {
    var s = String(raw || '').trim();
    if (!s || /\s/.test(s.slice(0, 20))) return null;   /* 带空格的多半不是链接 */
    if (!/^(https?:\/\/|\/\/)/i.test(s)) s = 'http://' + s.replace(/^\/+/, '');
    var u;
    try { u = new URL(s); } catch (e) { return null; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

    var h = u.hostname.replace(/^www\./, '');
    var yt = (h === 'youtube.com' || h === 'm.youtube.com' ||
              h === 'youtu.be' || h === 'youtube-nocookie.com');
    if (yt) {
      var id = '';
      if (h === 'youtu.be') id = u.pathname.slice(1);
      else if (u.pathname.indexOf('/embed/') === 0) id = u.pathname.slice(6).split('/')[0];
      else if (u.pathname.indexOf('/shorts/') === 0) id = u.pathname.slice(8).split('/')[0];
      else id = u.searchParams.get('v') || '';
      if (id) return 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
    }
    return u.href;
  }

  /* 已知禁止被嵌入的网站：Substack / Medium / X / 微博 / B站 等 */
  var NO_EMBED = [
    'substack.com', 'medium.com', 'x.com', 'twitter.com', 'weibo.com',
    'bilibili.com', 'facebook.com', 'instagram.com', 'linkedin.com',
    'tiktok.com', 'zhihu.com', 'douban.com'
  ];
  function blocksEmbed(host) {
    var h = String(host || '').toLowerCase();
    return NO_EMBED.some(function (d) {
      return h === d || h.slice(-(d.length + 1)) === '.' + d;
    });
  }

  function addUrl(raw) {
    var url = normalizeUrl(raw);
    if (!url) return false;
    var host = hostOf(url);
    var blocked = blocksEmbed(host);
    var item = { id: null, kind: 'web', url: url, name: host, blocked: blocked };
    slides.push(item);
    render();
    DeckStore.putWeb(url, blocked).then(function (id) { item.id = id; save(); });
    toast(blocked ? ('已加入 · ' + host + '（该站禁止嵌入，演示时给提示）') : ('已加入网页 · ' + host));
    return true;
  }

  function probe(url, item) {
    var im = new Image();
    im.onload = function () { item.w = im.naturalWidth; item.h = im.naturalHeight; render(); };
    im.src = url;
  }

  function fromClipboard(e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return false;
    var got = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind === 'file') {
        var f = it.getAsFile();
        if (f) got.push(f);
      }
    }
    if (!got.length) return false;
    addFiles(got);
    return true;
  }

  function save() {
    DeckStore.setOrder(slides.map(function (s) { return s.id; }).filter(Boolean));
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var has = slides.length > 0;
    empty.style.display = has ? 'none' : 'block';
    grid.style.display = has ? 'grid' : 'none';
    $('count').textContent = has ? slides.length + ' 项' : '';
    $('btnPlay').disabled = !has;
    $('btnClear').disabled = !has;
    if (!has) return;

    grid.textContent = '';
    slides.forEach(function (s, i) {
      var el = document.createElement('div');
      el.className = 'slide' + (s.id && s.id === selected ? ' sel' : '');

      var th = document.createElement('div');
      th.className = 'thumb';
      if (s.kind === 'web' || s.kind === 'doc') {
        th.classList.add('web');
        var card = document.createElement('div');
        card.className = 'webcard';
        card.innerHTML = s.kind === 'doc'
          ? '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>'
          : '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2-2a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2 2a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>';
        var dn = document.createElement('span');
        dn.className = 'wdom';
        dn.textContent = s.kind === 'doc' ? (s.ext ? s.ext.toUpperCase() + ' · ' : '') + s.name : s.name;
        card.appendChild(dn);
        th.appendChild(card);
        if (s.kind === 'web' && s.blocked) {
          var badge = document.createElement('span');
          badge.className = 'nobadge';
          badge.textContent = '禁嵌';
          th.appendChild(badge);
        }
      } else {
        var im = document.createElement('img');
        im.src = s.url; im.alt = '';
        im.draggable = false;
        th.appendChild(im);
      }

      var me = document.createElement('div');
      me.className = 'meta';
      var no = document.createElement('span');
      no.className = 'no'; no.textContent = String(i + 1);
      var dim = document.createElement('span');
      dim.className = 'dim';
      dim.textContent = s.kind === 'web' ? s.name
        : (s.kind === 'doc' ? s.name
        : ((s.w && s.h) ? s.w + '×' + s.h : s.name));
      var del = document.createElement('button');
      del.className = 'del'; del.title = '删除'; del.textContent = '×';
      del.addEventListener('click', function (ev) { ev.stopPropagation(); remove(s.id, i); });
      if (s.kind === 'web' || (s.kind === 'doc' && s.ext === 'pdf')) {
        var op = document.createElement('button');
        op.className = 'del'; op.title = '在新标签页打开'; op.textContent = '↗';
        op.addEventListener('click', function (ev) {
          ev.stopPropagation();
          window.open(s.url, '_blank');
        });
        me.appendChild(op);
      }
      if (s.kind === 'img') {
        var cp = document.createElement('button');
        cp.className = 'del'; cp.title = '裁剪比例'; cp.textContent = '✂';
        cp.addEventListener('click', function (ev) { ev.stopPropagation(); openCropper(i); });
        me.appendChild(cp);
      }
      me.appendChild(no); me.appendChild(dim); me.appendChild(del);

      el.appendChild(th); el.appendChild(me);
      el.addEventListener('click', function () { selected = s.id; render(); });
      el.addEventListener('dblclick', function () { play(i); });

      grid.appendChild(el);
    });

    var add = document.createElement('div');
    add.className = 'adder';
    add.textContent = '+ 添加图片';
    add.addEventListener('click', function () { $('file').click(); });
    grid.appendChild(add);
  }

  function clearOver() {
    Array.prototype.forEach.call(grid.querySelectorAll('.slide'), function (n) {
      n.classList.remove('over');
    });
  }

  /* ---------- 拖拽排序 ---------- */
  var drag = null;

  function dragTargetIndex(x, y) {
    var els = grid.querySelectorAll('.slide');
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  }

  function dragEnd(cancel) {
    if (!drag) return;
    var d = drag;
    drag = null;
    document.body.classList.remove('drag-on');
    d.ghost.remove();
    d.el.classList.remove('dragging');
    clearOver();
    if (!cancel && d.started && d.to >= 0 && d.to !== d.from) move(d.from, d.to);
  }

  grid.addEventListener('mousedown', function (ev) {
    if (ev.button !== 0) return;
    var el = ev.target.closest ? ev.target.closest('.slide') : null;
    if (!el || !grid.contains(el)) return;
    if (ev.target.closest('button')) return;
    var i = Array.prototype.indexOf.call(grid.querySelectorAll('.slide'), el);
    if (i < 0) return;
    var r = el.getBoundingClientRect();
    var ghost = el.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.classList.remove('dragging', 'over');
    ghost.style.width = r.width + 'px';
    ghost.style.height = r.height + 'px';
    document.body.appendChild(ghost);
    drag = { from: i, to: -1, el: el, ghost: ghost, offX: ev.clientX - r.left, offY: ev.clientY - r.top, sx: ev.clientX, sy: ev.clientY, started: false };
  });

  document.addEventListener('mousemove', function (ev) {
    if (!drag) return;
    if (!drag.started) {
      if (Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) < 6) return;
      drag.started = true;
      document.body.classList.add('drag-on');
    }
    drag.ghost.style.left = (ev.clientX - drag.offX) + 'px';
    drag.ghost.style.top = (ev.clientY - drag.offY) + 'px';
    var to = dragTargetIndex(ev.clientX, ev.clientY);
    drag.to = to;
    Array.prototype.forEach.call(grid.querySelectorAll('.slide'), function (n, i) {
      n.classList.toggle('over', i === to && to !== drag.from);
    });
  });

  document.addEventListener('mouseup', function () { dragEnd(false); });
  window.addEventListener('blur', function () { dragEnd(true); });

  function move(from, to) {
    if (from === to || from < 0 || to < 0) return;
    var it = slides.splice(from, 1)[0];
    slides.splice(to, 0, it);
    save(); render();
  }

  function remove(id, i) {
    if (i == null || slides[i] == null || (id && slides[i].id !== id)) {
      i = slides.findIndex(function (s) { return s.id === id; });
    }
    if (i < 0 || !slides[i]) return;
    if (slides[i].kind !== 'web') URL.revokeObjectURL(slides[i].url);
    var rid = slides[i].id;
    slides.splice(i, 1);
    if (selected === rid) selected = null;
    if (rid) DeckStore.del(rid);
    save(); render();
  }

  /* ---------- 提示 ---------- */
  var tipEl = null, tipTimer = null;
  function toast(msg) {
    if (tipEl) tipEl.remove();
    tipEl = document.createElement('div');
    tipEl.className = 'toast';
    tipEl.textContent = msg;
    document.body.appendChild(tipEl);
    requestAnimationFrame(function () { tipEl.classList.add('on'); });
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () {
      tipEl.classList.remove('on');
      setTimeout(function () { if (tipEl) tipEl.remove(); }, 240);
    }, 1600);
  }

  /* ---------- 开始演示 ----------
     全屏手势不能跨页面导航传递（跳到 deck.html 后再请求必被浏览器拒绝），
     所以趁点击手势还在，先把**宿主 iframe 元素**（属于父页面，导航后不销毁）
     撑成全屏，等全屏就绪后再跳 deck.html —— 落地即真全屏，没有中间页。
     独立标签页打开时没有宿主 iframe，先把自己撑成全屏再跳
     （导航会退出全屏，deck 页里按 F 或点 ⛶ 可再进）。 */
  function play(from) {
    if (!slides.length) return;
    var go = function () { location.href = 'deck.html#' + (from || 0); };
    try {
      if (window.parent && window.parent !== window) {
        var fe = window.parent.document.querySelector('iframe.deck-frame, iframe[title="图卡演示"]');
        if (fe && fe.requestFullscreen) {
          var p = fe.requestFullscreen();
          if (p && p.then) { p.then(go, go); return; }
        }
      } else {
        var p2 = document.documentElement.requestFullscreen &&
                 document.documentElement.requestFullscreen();
        if (p2 && p2.then) { p2.then(go, go); return; }
      }
    } catch (e) {}
    go();
  }

  /* ---------- 录屏设置（存本机，演示页录屏时沿用） ----------
     这里开摄像头预览同时也是「提前授权」：权限框必须在**非全屏**的管理页里弹完。
     否则进全屏后再弹权限框，浏览器会把演示踢出全屏，录屏就没法满屏录了。 */
  var RS_KEY = 'deck.rec.settings';
  var rs = loadRs();
  var rsStream = null;

  function loadRs() {
    var d = { cam: true, mic: true, size: 260, shape: 'circle', pos: 'br', layout: 'corner',
              tele: '', camDeviceId: '', micDeviceId: '', camLabel: '', micLabel: '',
              freeX: null, freeY: null };
    try {
      var o = JSON.parse(localStorage.getItem(RS_KEY) || '{}');
      d.cam = o.cam !== false;
      d.mic = o.mic !== false;
      d.size = Math.max(80, Math.min(420, parseInt(o.size, 10) || 260));
      d.shape = (o.shape === 'square') ? 'square' : 'circle';
      d.pos = (['br', 'bl', 'tr', 'tl'].indexOf(o.pos) >= 0) ? o.pos : 'br';
      d.layout = (['corner', 'side', 'full'].indexOf(o.layout) >= 0) ? o.layout : 'corner';
      d.tele = (typeof o.tele === 'string') ? o.tele : '';
      d.camDeviceId = (typeof o.camDeviceId === 'string') ? o.camDeviceId : '';
      d.micDeviceId = (typeof o.micDeviceId === 'string') ? o.micDeviceId : '';
      d.camLabel = (typeof o.camLabel === 'string') ? o.camLabel : '';
      d.micLabel = (typeof o.micLabel === 'string') ? o.micLabel : '';
      d.freeX = (typeof o.freeX === 'number' && o.freeX >= 0 && o.freeX <= 1) ? o.freeX : null;
      d.freeY = (typeof o.freeY === 'number' && o.freeY >= 0 && o.freeY <= 1) ? o.freeY : null;
    } catch (e) {}
    return d;
  }
  function saveRs() { try { localStorage.setItem(RS_KEY, JSON.stringify(rs)); } catch (e) {} }
  function markSeg(wrap, attr, val) {
    Array.prototype.forEach.call(wrap.children, function (b) {
      b.classList.toggle('on', b.dataset[attr] === val);
    });
  }
  function syncRsToDom() {
    $('rsCam').checked = rs.cam;
    $('rsMic').checked = rs.mic;
    $('rsSize').value = rs.size;
    $('rsSizeVal').textContent = rs.size + 'px';
    markSeg($('rsShape'), 's', rs.shape);
    markSeg($('rsPos'), 'p', rs.pos);
    markSeg($('rsLayout'), 'l', rs.layout);
    $('rsTele').value = rs.tele || '';
    $('rsCamDevice').value = rs.camDeviceId || '';
    $('rsMicDevice').value = rs.micDeviceId || '';
    applyRsLayout();
  }

  /* ---------- 摄像头 / 麦克风设备列表 ----------
     默认设备常常不是你真正想用的那一个（笔记本自带 vs 外接 vs 虚拟摄像头），
     所以必须让用户自己挑，选完存本机，演示页录屏时按同一个 deviceId 打开。
     注意：没授权之前浏览器不给 label，列表只能显示「摄像头 1 / 2」；
     拿到授权后（rsPreview 成功）会再枚举一次，名字就补齐了。 */
  function cleanDeviceLabel(label, kind, idx) {
    var s = (label || '')
      .replace(/^(默认|通讯|多声道|立体声|高质量)\s*[-–—]\s*/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!s) s = (kind === 'videoinput' ? '摄像头 ' : '麦克风 ') + (idx + 1);
    return s;
  }
  function fillDeviceSelect(sel, kind, devices) {
    var cur = sel.value;
    sel.innerHTML = '';
    var def = document.createElement('option');
    def.value = '';
    def.textContent = '系统默认';
    sel.appendChild(def);
    var seen = {}, n = 0;
    devices.forEach(function (d) {
      if (d.kind !== kind || !d.deviceId) return;
      var text = cleanDeviceLabel(d.label, kind, n);
      var base = text, k = 2;
      while (seen[text]) { text = base + '（' + k + '）'; k++; }
      seen[text] = true;
      n++;
      var opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = text;
      /* 原名留在 data-raw 上：deviceId 会被浏览器换掉（换盐 / 重装驱动），
         设备名才是跨页面认设备的可靠凭据，演示页靠它兜底。 */
      opt.dataset.raw = d.label || '';
      sel.appendChild(opt);
    });
    sel.value = cur;
    /* 之前存的 deviceId 已经不存在了（摄像头拔了 / 换驱动）：退回系统默认，
       否则录屏时 deviceId 精确匹配失败，会直接开不了摄像头。 */
    if (cur && sel.value !== cur) sel.value = '';
  }
  /* 下拉当前选中的「id + 原名」—— 两者一起存，缺一个都会认不出设备 */
  function rsSelMeta(sel) {
    var o = sel.options[sel.selectedIndex];
    return { id: sel.value || '', label: (o && o.dataset && o.dataset.raw) || '' };
  }
  function rsSyncCam() {
    var m = rsSelMeta($('rsCamDevice'));
    rs.camDeviceId = m.id; rs.camLabel = m.label;
  }
  function rsSyncMic() {
    var m = rsSelMeta($('rsMicDevice'));
    rs.micDeviceId = m.id; rs.micLabel = m.label;
  }
  /* 把下拉拨到某个 id（'' = 系统默认），连带更新 rs 里的 id / 原名 */
  function rsPickCam(id) {
    var sel = $('rsCamDevice');
    sel.value = id || '';
    if (sel.value !== (id || '')) sel.value = '';
    rsSyncCam();
  }
  function rsPickMic(id) {
    var sel = $('rsMicDevice');
    sel.value = id || '';
    if (sel.value !== (id || '')) sel.value = '';
    rsSyncMic();
  }
  function rsFillDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return Promise.resolve();
    }
    return navigator.mediaDevices.enumerateDevices().then(function (devices) {
      var keepCam = rs.camDeviceId, keepMic = rs.micDeviceId;
      fillDeviceSelect($('rsCamDevice'), 'videoinput', devices);
      fillDeviceSelect($('rsMicDevice'), 'audioinput', devices);
      rsPickCam(keepCam);
      rsPickMic(keepMic);
    })['catch'](function () {});
  }
  /* 迷你舞台：几何公式和 rec.js 完全同源 ——
     角落：直径 = 设置px ÷ 1600(成片参考宽) × 舞台宽，边距 = 3% × 舞台高；
     自由位置：拖出来的 0~1 比例坐标直接映射（舞台与成片同为 16:9，一一对应）；
     侧边：右侧 30% 宽带；全屏：铺满。所见即所得。 */
  function applyRsLayout() {
    var v = $('rsPrev'), stage = $('rsStage');
    if (!v || !stage) return;
    var dim = rs.layout !== 'corner';
    $('rowSize').classList.toggle('off', dim);
    $('rowShape').classList.toggle('off', dim);
    $('rowPos').classList.toggle('off', dim);
    if (!rs.cam) { v.className = ''; return; }
    var sw = stage.clientWidth || 300;
    var sh = stage.clientHeight || Math.round(sw * 9 / 16);
    var REF = 1600;
    if (rs.layout === 'side') { v.className = 'side'; v.style.top = v.style.left = v.style.right = v.style.bottom = ''; v.style.setProperty('--d', ''); v.style.setProperty('--br', ''); return; }
    if (rs.layout === 'full') { v.className = 'full'; v.style.top = v.style.left = v.style.right = v.style.bottom = ''; v.style.setProperty('--d', ''); v.style.setProperty('--br', ''); return; }
    var d = Math.round(rs.size / REF * sw);
    var pad = Math.round(sw * (9 / 16) * 0.03);
    var r = d / 2;
    v.className = 'corner';
    v.style.setProperty('--d', d + 'px');
    v.style.setProperty('--br', rs.shape === 'circle' ? '50%' : '12%');
    v.style.top = v.style.left = v.style.right = v.style.bottom = '';
    if (rs.freeX != null && rs.freeY != null) {
      var fx = Math.max(r, Math.min(sw - r, rs.freeX * sw));
      var fy = Math.max(r, Math.min(sh - r, rs.freeY * sh));
      v.style.left = Math.round(fx - r) + 'px';
      v.style.top = Math.round(fy - r) + 'px';
      return;
    }
    if (rs.pos === 'br') { v.style.right = pad + 'px'; v.style.bottom = pad + 'px'; }
    else if (rs.pos === 'bl') { v.style.left = pad + 'px'; v.style.bottom = pad + 'px'; }
    else if (rs.pos === 'tr') { v.style.right = pad + 'px'; v.style.top = pad + 'px'; }
    else { v.style.left = pad + 'px'; v.style.top = pad + 'px'; }
  }
  var rsToken = 0;
  function rsStopPreview() {
    if (rsStream) { rsStream.getTracks().forEach(function (t) { t.stop(); }); rsStream = null; }
  }
  function rsPreview() {
    var v = $('rsPrev'), off = $('rsOff'), my = ++rsToken;
    rsStopPreview();
    off.textContent = '摄像头未开启';
    off.hidden = rs.cam;
    if (!rs.cam) { v.className = ''; v.srcObject = null; applyRsLayout(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      off.hidden = false; off.textContent = '这个浏览器不支持摄像头';
      return;
    }
    applyRsLayout();
    var id = rs.camDeviceId || '';
    var cons = { video: id ? { deviceId: { exact: id }, width: 1280, height: 720 }
                          : { width: 1280, height: 720 }, audio: false };
    var open = function (c) { return navigator.mediaDevices.getUserMedia(c); };
    open(cons)['catch'](function () {
      /* 选中的设备开不了（拔了 / 被别的软件占了）→ 退回系统默认再试一次，
         总比直接黑屏强；同时把下拉也改回默认，免得下次还撞同一个。 */
      if (!id) throw new Error('no-device');
      rsPickCam('');
      saveRs();
      return open({ video: { width: 1280, height: 720 }, audio: false });
    }).then(function (s) {
      if (my !== rsToken) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      rsStream = s;
      v.srcObject = s;
      /* srcObject 是脚本赋的，部分浏览器不会自动起播 —— 不显式 play()
         就会出现「摄像头连着但预览是黑的」。 */
      var pr = v.play && v.play();
      if (pr && pr['catch']) pr['catch'](function () {});
      off.hidden = true;
      /* 拿到授权后设备名才可读，再枚举一次把「摄像头 1」换成真名
         （同名设备会按枚举顺序补序号，所以要在拿到 label 之后重来一遍） */
      rsFillDevices().then(saveRs);
    })['catch'](function (e) {
      if (my !== rsToken) return;
      off.hidden = false;
      off.textContent = '摄像头打不开（被拒绝、被占用或没插好）';
    });
  }
  function openRecSet() {
    syncRsToDom();
    $('rsMask').hidden = false;
    rsFillDevices().then(rsPreview);
  }

  /* ---------- 迷你舞台里直接拖气泡：想放哪就放哪 ----------
     拖出来的中心点记成 0~1 的比例坐标，录制时的气泡用同一套坐标，
     所以这里摆在哪，成片里就在哪。点四角按钮 = 回到吸附。 */
  function stageCenter() {
    var stage = $('rsStage');
    if (!stage) return { cx: 0, cy: 0 };
    var sw = stage.clientWidth || 300, sh = stage.clientHeight || Math.round(sw * 9 / 16);
    var d = Math.round(rs.size / 1600 * sw);
    var r = d / 2;
    var pad = Math.round(sw * (9 / 16) * 0.03);
    if (rs.freeX != null && rs.freeY != null) return { cx: rs.freeX * sw, cy: rs.freeY * sh };
    return {
      cx: (rs.pos === 'bl' || rs.pos === 'tl') ? r + pad : sw - r - pad,
      cy: (rs.pos === 'tr' || rs.pos === 'tl') ? r + pad : sh - r - pad
    };
  }
  (function () {
    var stage = $('rsStage');
    if (!stage) return;
    var sx = 0, sy = 0, ox = 0, oy = 0, moving = false;
    var start = function (e) {
      if (rs.layout !== 'corner' || !rs.cam) return;
      var t = e.target && e.target.closest ? e.target.closest('#rsPrev') : null;
      if (!t) return;                     /* 只能抓气泡，不抓舞台背景 */
      moving = true; sx = e.clientX; sy = e.clientY;
      var c = stageCenter(); ox = c.cx; oy = c.cy;
      try { t.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    };
    var move = function (e) {
      if (!moving) return;
      var sw = stage.clientWidth || 300, sh = stage.clientHeight || Math.round(sw * 9 / 16);
      rs.freeX = Math.max(0, Math.min(1, (ox + e.clientX - sx) / sw));
      rs.freeY = Math.max(0, Math.min(1, (oy + e.clientY - sy) / sh));
      applyRsLayout();
    };
    var up = function () { if (!moving) return; moving = false; saveRs(); };
    stage.addEventListener('pointerdown', start);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
  })();
  function closeRecSet() {
    $('rsMask').hidden = true;
    rsStopPreview();
  }

  /* ---------- 录屏：先在这拿到授权，再进全屏直接开录 ---------- */
  function goRec() {
    var go = function () { location.href = 'deck.html?rec=1#0'; };
    try {
      if (window.parent && window.parent !== window) {
        var fe = window.parent.document.querySelector('iframe.deck-frame, iframe[title="图卡演示"]');
        if (fe && fe.requestFullscreen) {
          var p = fe.requestFullscreen();
          if (p && p.then) { p.then(go, go); return; }
        }
      } else {
        var p2 = document.documentElement.requestFullscreen &&
                 document.documentElement.requestFullscreen();
        if (p2 && p2.then) { p2.then(go, go); return; }
      }
    } catch (e) {}
    go();
  }
  function startRec() {
    if (!slides.length) { toast('先加入图卡，再录屏'); return; }
    var btn = $('btnRec');
    btn.disabled = true;
    /* 提前授权时就用**选中的那台**设备：一来确认这台真能用
       （开不了会在这里就报错，而不是进了全屏录一半才黑），
       二来权限是按站点给的，拿到之后演示页开同一台不会再弹框。 */
    var vCons = rs.cam ? (rs.camDeviceId ? { deviceId: { exact: rs.camDeviceId } } : true) : false;
    var aCons = rs.mic ? (rs.micDeviceId ? { deviceId: { exact: rs.micDeviceId } } : true) : false;
    var want = { audio: aCons, video: vCons };
    /* 两个都关掉：没有设备要授权，直接进全屏录纯画面 */
    if (!want.audio && !want.video) { btn.disabled = false; goRec(); return; }
    var gdm = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    (gdm ? navigator.mediaDevices.getUserMedia(want)
         : Promise.reject(new Error('这个浏览器不支持录制')))
      .then(function (s) {
        /* 只为拿授权：权限此刻弹完，进全屏后就不会再弹。
           用完立刻停掉，真正的采集交给演示页按设置重新打开。 */
        s.getTracks().forEach(function (t) { t.stop(); });
        btn.disabled = false;
        goRec();
      })['catch'](function (e) {
        btn.disabled = false;
        toast('授权未完成：' + ((e && e.message) || '无法访问摄像头 / 麦克风'));
        openRecSet();
      });
  }

  /* ---------- 事件 ---------- */
  $('btnPick').addEventListener('click', function () { $('file').click(); });
  $('btnPlay').addEventListener('click', function () { play(0); });
  $('btnRecSet').addEventListener('click', openRecSet);
  $('btnRec').addEventListener('click', startRec);

  /* 录屏设置弹层 */
  $('rsCam').addEventListener('change', function () { rs.cam = this.checked; saveRs(); rsPreview(); });
  $('rsMic').addEventListener('change', function () { rs.mic = this.checked; saveRs(); });
  /* 换设备立刻重开预览：选了哪台，迷你舞台上就显示哪台 */
  $('rsCamDevice').addEventListener('change', function () {
    rsSyncCam(); saveRs(); rsPreview();
  });
  $('rsMicDevice').addEventListener('change', function () {
    rsSyncMic(); saveRs();
  });
  /* 中途插拔摄像头 / 耳机，列表跟着更新（面板开着才需要） */
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', function () {
      if (!$('rsMask').hidden) rsFillDevices();
    });
  }
  $('rsSize').addEventListener('input', function () {
    rs.size = parseInt(this.value, 10) || 260;
    $('rsSizeVal').textContent = rs.size + 'px';
    applyRsLayout();
  });
  $('rsSize').addEventListener('change', function () { saveRs(); });
  $('rsShape').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
    rs.shape = b.dataset.s; markSeg(this, 's', rs.shape); saveRs(); applyRsLayout();
  });
  $('rsPos').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
    rs.pos = b.dataset.p;
    rs.freeX = rs.freeY = null;    /* 点四角 = 回到吸附，清掉自由位置 */
    markSeg(this, 'p', rs.pos); saveRs(); applyRsLayout();
  });
  $('rsLayout').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
    rs.layout = b.dataset.l; markSeg(this, 'l', rs.layout); saveRs(); applyRsLayout();
  });
  $('rsTele').addEventListener('input', function () { rs.tele = this.value; saveRs(); });
  window.addEventListener('resize', function () {
    if (!$('rsMask').hidden) applyRsLayout();
  });
  $('rsClose').addEventListener('click', closeRecSet);
  $('rsMask').addEventListener('click', function (e) { if (e.target === this) closeRecSet(); });
  /* 「添加网页」按钮已换成「录屏」：加网址改走 Ctrl+V 粘贴（见下面的 paste 处理），
     原弹窗整块移除，免得留下指向已删按钮的死代码。 */

  $('file').addEventListener('change', function () {
    addFiles(this.files);
    this.value = '';
  });

  $('btnClear').addEventListener('click', function () {
    if (!slides.length) return;
    if (!window.confirm('清空全部 ' + slides.length + ' 张图片？')) return;
    slides.forEach(function (s) { URL.revokeObjectURL(s.url); });
    slides = []; selected = null;
    DeckStore.clear(); save(); render();
  });

  document.addEventListener('paste', function (e) {
    if (fromClipboard(e)) { e.preventDefault(); return; }
    var txt = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
    if (addUrl(txt)) e.preventDefault();
  });

  var veil = $('veil'), depth = 0;
  window.addEventListener('dragenter', function (e) {
    e.preventDefault(); depth++; veil.classList.add('on');
  });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('dragleave', function () {
    depth--; if (depth <= 0) { depth = 0; veil.classList.remove('on'); }
  });
  window.addEventListener('drop', function (e) {
    e.preventDefault(); depth = 0; veil.classList.remove('on');
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });

  document.addEventListener('keydown', function (e) {
    var t = document.activeElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if ($('crop').classList.contains('on')) {
      if (e.key === 'Escape') { e.preventDefault(); closeCrop(); }
      return;
    }
    if (e.key === 'Enter' && slides.length) { e.preventDefault(); play(0); }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (selected) remove(selected, null);
    }
  });

  /* ---------- 演示示例：一份真实会用起来的教程（图片 / PDF / 网页 混排） ----------
     复用站内真实素材：超宽横幅图、竖版书封、大脑示意图、一份 PDF、一个网页，
     中间穿插「怎么用 / 开始创作」两张教学卡——演示本身就是一份使用说明。 */
  var DEMO = [
    { t: 'img', src: '/deck/demo/title.png', name: '封面' },
    { t: 'img', src: '/images/100/11-hormozi-100M.png', name: '横图 · 超宽' },
    { t: 'img', src: '/images/book1-cover.png', name: '竖图 · 书封' },
    { t: 'img', src: '/images/fate/01-大脑皮质与杏仁核.jpg', name: '大脑 · 机器怎么转' },
    { t: 'pdf', src: '/resources/snow_leopard_-_nicolas_cole.pdf', name: '雪豹.pdf' },
    { t: 'web', url: 'https://gusangciren.github.io/', name: '我的主页' },
    { t: 'img', src: '/deck/demo/howto.png', name: '怎么用' },
    { t: 'img', src: '/deck/demo/start.png', name: '开始创作' }
  ];

  function loadDemoOne(spec) {
    if (spec.t === 'web') {
      var host = hostOf(spec.url), blocked = blocksEmbed(host);
      return DeckStore.putWeb(spec.url, blocked).then(function (id) {
        return { id: id, kind: 'web', url: spec.url, name: host, blocked: blocked };
      });
    }
    return fetch(spec.src).then(function (r) {
      if (!r.ok) throw new Error(spec.src);
      return r.blob();
    }).then(function (blob) {
      if (spec.t === 'pdf') {
        return DeckStore.putDoc({ name: spec.name, ext: 'pdf', blob: blob }).then(function (id) {
          return { id: id, kind: 'doc', name: spec.name, ext: 'pdf', html: '', blob: blob, url: URL.createObjectURL(blob) };
        });
      }
      return DeckStore.put(blob).then(function (id) {
        var it = { id: id, kind: 'img', name: spec.name, w: 0, h: 0, url: URL.createObjectURL(blob) };
        probe(it.url, it);
        return it;
      });
    });
  }

  $('btnDemo').addEventListener('click', function () {
    var btn = $('btnDemo');
    btn.disabled = true;
    btn.textContent = '正在准备…';
    Promise.all(DEMO.map(loadDemoOne)).then(function (items) {
      slides = slides.concat(items);
      save(); render();
      play(0);   /* 直接进入演示，看效果 */
    })['catch'](function (e) {
      toast('示例加载失败：' + ((e && e.message) || e));
      btn.disabled = false;
      btn.textContent = '我看看演示效果';
    });
  });

  /* ---------- 裁剪器 ---------- */
  var RATIOS = { '1:1': 1, '3:4': 3 / 4, '4:3': 4 / 3, '16:9': 16 / 9 };
  var crop = { item: null, r: 3 / 4, dx: 0, dy: 0, dw: 0, dh: 0, x: 0, y: 0, w: 0, h: 0, mode: null };

  function openCropper(i) {
    var s = slides[i];
    if (!s) return;
    crop.item = s;
    $('crop').classList.add('on');
    var im = $('cropImg');
    im.src = s.url;
    setTimeout(function () { layoutCrop(); }, 80);
  }
  function closeCrop() {
    $('crop').classList.remove('on');
    crop.item = null; crop.mode = null;
  }

  function layoutCrop() {
    var st = $('cropStage').getBoundingClientRect();
    var im = $('cropImg').getBoundingClientRect();
    crop.dx = im.left - st.left; crop.dy = im.top - st.top;
    crop.dw = im.width; crop.dh = im.height;
    centerSel();
  }

  function centerSel() {
    var sw = crop.dw, sh = sw / crop.r;
    if (sh > crop.dh) { sh = crop.dh; sw = sh * crop.r; }
    sw = Math.max(40, sw); sh = Math.max(40, sh);
    crop.w = sw; crop.h = sh;
    crop.x = crop.dx + (crop.dw - sw) / 2;
    crop.y = crop.dy + (crop.dh - sh) / 2;
    drawSel();
  }

  function drawSel() {
    var el = $('cropSel');
    el.style.left = crop.x + 'px';
    el.style.top = crop.y + 'px';
    el.style.width = crop.w + 'px';
    el.style.height = crop.h + 'px';
  }

  function applyCrop() {
    var s = crop.item;
    if (!s) return;
    var im = $('cropImg');
    var scale = (im.naturalWidth || crop.dw) / crop.dw;
    var cx = Math.max(0, Math.round((crop.x - crop.dx) * scale));
    var cy = Math.max(0, Math.round((crop.y - crop.dy) * scale));
    var cw = Math.max(1, Math.round(crop.w * scale));
    var ch = Math.max(1, Math.round(crop.h * scale));
    cw = Math.min(cw, im.naturalWidth - cx);
    ch = Math.min(ch, im.naturalHeight - cy);

    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d').drawImage(im, cx, cy, cw, ch, 0, 0, cw, ch);
    canvas.toBlob(function (blob) {
      if (!blob) { toast('裁剪失败，请重试'); return; }
      DeckStore.put(blob, s.id).then(function () {
        URL.revokeObjectURL(s.url);
        s.url = URL.createObjectURL(blob);
        s.w = cw; s.h = ch;
        selected = s.id;
        closeCrop(); render();
        toast('已裁剪为 ' + cw + '×' + ch);
      });
    }, 'image/png');
  }

  function cropMouseDown(e) {
    if (!crop.item) return;
    crop.mode = (e.target.id === 'cropGrip') ? 'size' : 'move';
    crop.mx = e.clientX; crop.my = e.clientY;
    crop.ox = crop.x; crop.oy = crop.y; crop.ow = crop.w;
    e.preventDefault();
    e.stopPropagation();
  }
  function cropMouseMove(e) {
    if (!crop.mode) return;
    var mx = e.clientX - crop.mx, my = e.clientY - crop.my;
    if (crop.mode === 'move') {
      crop.x = Math.max(crop.dx, Math.min(crop.dx + crop.dw - crop.w, crop.ox + mx));
      crop.y = Math.max(crop.dy, Math.min(crop.dy + crop.dh - crop.h, crop.oy + my));
    } else {
      var nw = Math.min(
        Math.max(48, crop.ow + mx),
        crop.dx + crop.dw - crop.x,
        (crop.dy + crop.dh - crop.y) * crop.r
      );
      crop.w = nw; crop.h = nw / crop.r;
    }
    drawSel();
  }
  function cropMouseUp() { crop.mode = null; }

  $('cropSel').addEventListener('mousedown', cropMouseDown);
  $('cropGrip').addEventListener('mousedown', cropMouseDown);
  document.addEventListener('mousemove', cropMouseMove);
  document.addEventListener('mouseup', cropMouseUp);
  $('cropApply').addEventListener('click', applyCrop);
  $('cropCancel').addEventListener('click', closeCrop);
  $('crop').addEventListener('mousedown', function (e) {
    if (e.target === this) closeCrop();
  });
  $('cropRatios').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    Array.prototype.forEach.call(this.children, function (n) { n.classList.remove('on'); });
    b.classList.add('on');
    crop.r = RATIOS[b.dataset.r] || 1;
    centerSel();
  });
  window.addEventListener('resize', function () {
    if (crop.item) layoutCrop();
  });

  /* ---------- 启动：恢复上次的图 ---------- */
  DeckStore.all().then(function (rows) {
    if (!rows.length) return DeckStore.getOrder().then(function () { render(); });
    return DeckStore.getOrder().then(function (order) {
      var map = {};
      rows.forEach(function (r) {
        if (r.kind === 'web') {
          map[r.id] = { id: r.id, kind: 'web', url: r.url, name: hostOf(r.url), blocked: !!r.blocked };
        } else if (r.kind === 'doc') {
          map[r.id] = {
            id: r.id, kind: 'doc', name: r.name, ext: r.ext, html: r.html || '',
            url: r.blob ? URL.createObjectURL(r.blob) : ''
          };
        } else {
          map[r.id] = { id: r.id, kind: 'img', name: '图片', w: 0, h: 0, url: URL.createObjectURL(r.blob) };
        }
      });
      slides = order.filter(function (id) { return map[id]; }).map(function (id) { return map[id]; });
      Object.keys(map).forEach(function (id) {
        if (slides.indexOf(map[id]) < 0) slides.push(map[id]);
      });
      slides.forEach(function (s) { if (s.kind !== 'web') probe(s.url, s); });
      render();
    });
  });

  render();
})();
