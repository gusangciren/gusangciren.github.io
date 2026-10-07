/* 管理页：上传 / 排序 / 删除 / 开始演示（网站版：去掉 chrome.* API） */
(function () {
  'use strict';

  var slides = [];      // { id, kind:'img'|'web', name, w, h, url }
  var selected = null;
  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), empty = $('empty');

  /* ---------- 加入图片 ---------- */
  var DOC_EXT = { pdf: 1, docx: 1, doc: 1, xlsx: 1, xls: 1, csv: 1, txt: 1, md: 1 };

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

  /* ---------- 开始演示（网站版：直接跳到演示页，由浏览器全屏 API 接管） ---------- */
  function play(from) {
    if (!slides.length) return;
    location.href = 'deck.html#' + (from || 0);
  }

  /* ---------- 事件 ---------- */
  $('btnPick').addEventListener('click', function () { $('file').click(); });
  $('btnPlay').addEventListener('click', function () { play(0); });

  /* 添加网页：点「添加网页」弹出小弹窗，回车或点「加入」加入 */
  var urlModal = $('urlModal'), urlInput = $('urlInput');
  function openUrlModal() { urlModal.hidden = false; urlModal.classList.add('on'); setTimeout(function () { urlInput.focus(); }, 0); }
  function closeUrlModal() { urlModal.classList.remove('on'); urlModal.hidden = true; urlInput.value = ''; }
  function submitUrl() {
    var v = urlInput.value.trim();
    if (!v) { urlInput.focus(); return; }
    if (addUrl(v)) { urlInput.value = ''; closeUrlModal(); }
    else { toast('不是有效网址'); urlInput.focus(); }
  }
  $('btnWeb').addEventListener('click', function () { openUrlModal(); });
  $('urlClose').addEventListener('click', closeUrlModal);
  $('urlGo').addEventListener('click', submitUrl);
  urlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitUrl(); }
    else if (e.key === 'Escape') { closeUrlModal(); }
  });
  urlModal.addEventListener('click', function (e) { if (e.target === urlModal) closeUrlModal(); });

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
