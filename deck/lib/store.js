/* 仓库：扩展内所有页面（管理页 / 演示页）共享同一 origin，直接共用这份数据
   三类条目：img（原图 blob）、web（网页 URL）、doc（文档解析出的 HTML / PDF 原文件） */
(function (global) {
  'use strict';

  var NAME = 'imgdeck', VER = 3;
  var IMG = 'img', WEB = 'web', DOC = 'doc', META = 'meta', ORDER = 'order';
  var dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      var req;
      try { req = indexedDB.open(NAME, VER); }
      catch (e) { return res(null); }
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains(IMG)) d.createObjectStore(IMG);
        if (!d.objectStoreNames.contains(WEB)) d.createObjectStore(WEB);
        if (!d.objectStoreNames.contains(DOC)) d.createObjectStore(DOC);
        if (!d.objectStoreNames.contains(META)) d.createObjectStore(META);
      };
      req.onsuccess = function () { res(req.result); };
      req.onerror = function () { res(null); };
      req.onblocked = function () { res(null); };
    });
    return dbp;
  }

  function run(store, mode, fn) {
    return open().then(function (db) {
      if (!db) return null;
      return new Promise(function (res) {
        var t;
        try { t = db.transaction(store, mode); }
        catch (e) { return res(null); }
        var out;
        t.oncomplete = function () { res(out); };
        t.onerror = function () { res(out); };
        t.onabort = function () { res(out); };
        out = fn(t.objectStore(store));
      });
    });
  }

  function dump(store) {
    return run(store, 'readonly', function (os) {
      var out = [];
      os.openCursor().onsuccess = function (e) {
        var c = e.target.result;
        if (c) { out.push({ id: c.key, val: c.value }); c['continue'](); }
      };
      return out;
    }).then(function (r) { return r || []; });
  }

  var Store = {
    /* 存一张图；传入 id 则原地覆盖（裁剪后替换，不打乱顺序） */
    put: function (blob, id) {
      if (!id) id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      return run(IMG, 'readwrite', function (os) { os.put(blob, id); }).then(function () {
        return id;
      });
    },
    /* 存一个网页；blocked=true 表示该站禁止被嵌入，演示时直接给提示 */
    putWeb: function (url, blocked) {
      var id = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      var val = { url: url, blocked: !!blocked };
      return run(WEB, 'readwrite', function (os) { os.put(val, id); }).then(function () {
        return id;
      });
    },
    /* 存一个文档：PDF 存原文件 blob，其余存解析好的 HTML 字符串 */
    putDoc: function (val) {
      var id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      return run(DOC, 'readwrite', function (os) { os.put(val, id); }).then(function () {
        return id;
      });
    },
    del: function (id) {
      return Promise.all([
        run(IMG, 'readwrite', function (os) { os['delete'](id); }),
        run(WEB, 'readwrite', function (os) { os['delete'](id); }),
        run(DOC, 'readwrite', function (os) { os['delete'](id); })
      ]);
    },
    clear: function () {
      return Promise.all([
        run(IMG, 'readwrite', function (os) { os.clear(); }),
        run(WEB, 'readwrite', function (os) { os.clear(); }),
        run(DOC, 'readwrite', function (os) { os.clear(); })
      ]);
    },
    /* 全部条目：[{id,kind:'img',blob} | {id,kind:'web',url} | {id,kind:'doc',name,html|blob,ext}] */
    all: function () {
      return Promise.all([dump(IMG), dump(WEB), dump(DOC)]).then(function (rs) {
        return rs[0].map(function (r) { return { id: r.id, kind: 'img', blob: r.val }; })
          .concat(rs[1].map(function (r) {
            var v = r.val;
            if (typeof v === 'string') return { id: r.id, kind: 'web', url: v, blocked: false };
            return { id: r.id, kind: 'web', url: v.url, blocked: !!v.blocked };
          }))
          .concat(rs[2].map(function (r) {
            var v = r.val || {};
            return {
              id: r.id, kind: 'doc', name: v.name || '文档',
              ext: v.ext || '', html: v.html || '', blob: v.blob || null
            };
          }));
      });
    },
    getOrder: function () {
      return run(META, 'readonly', function (os) {
        /* run() 拿的是 fn 的同步返回值，get 的结果是异步的 → 用容器把结果带出去 */
        var box = {};
        var req = os.get(ORDER);
        req.onsuccess = function () { box.v = req.result || null; };
        req.onerror = function () { box.v = null; };
        return box;
      }).then(function (box) { return box && Array.isArray(box.v) ? box.v : []; });
    },
    setOrder: function (ids) {
      return run(META, 'readwrite', function (os) { os.put(ids, ORDER); });
    }
  };

  global.DeckStore = Store;
})(window);
