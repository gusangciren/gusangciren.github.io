// 构建期优化 markdown 渲染出的图片：
//   1) 加 loading="lazy" + decoding="async"（首屏外的图不参与初始下载）
//   2) 读取图片真实像素，写入 width/height（防止懒加载到场时把正文顶下去，消除 CLS）
// 只作用于 markdown 生成的 <img>，手写 .astro 组件里的 <img>（封面、首图等）不受影响，
// 关键封面保持高清原图 + 组件自定的加载策略。
// 不引入外部依赖：自己遍历 hast 树、自己解析常见格式的图片头。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(PLUGIN_DIR, '../../public');

// 解析图片真实尺寸（PNG / JPEG / GIF / WebP / SVG），读不到返回 null
function imageSize(absPath) {
  let buf;
  try {
    const fd = fs.openSync(absPath, 'r');
    buf = Buffer.alloc(4096);
    fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);
  } catch {
    return null;
  }
  try {
    if (buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf.readUInt16BE(0) === 0xffd8) {
      let off = 2;
      while (off < buf.length - 9) {
        if (buf[off] !== 0xff) { off++; continue; }
        const marker = buf[off + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
        }
        off += 2 + buf.readUInt16BE(off + 2);
      }
      return null;
    }
    if (buf.toString('ascii', 0, 3) === 'GIF') {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
      const fmt = buf.toString('ascii', 12, 16);
      if (fmt === 'VP8 ') {
        return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      }
      if (fmt === 'VP8L') {
        const b = buf.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      if (fmt === 'VP8X') {
        return {
          width: (buf.readUIntLE(24, 3) & 0xffffff) + 1,
          height: (buf.readUIntLE(27, 3) & 0xffffff) + 1,
        };
      }
      return null;
    }
    const head = buf.toString('utf8', 0, 1024);
    const vb = head.match(/viewBox=["']\s*[-\d.]+[,\s]+[-\d.]+[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    if (vb) return { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])) };
    const wAttr = head.match(/\swidth=["'](\d+)/);
    const hAttr = head.match(/\sheight=["'](\d+)/);
    if (wAttr && hAttr) return { width: Number(wAttr[1]), height: Number(hAttr[1]) };
    return null;
  } catch {
    return null;
  }
}

const sizeCache = new Map();
function resolveSize(src) {
  if (!src || typeof src !== 'string') return null;
  const clean = src.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return null;
  if (sizeCache.has(clean)) return sizeCache.get(clean);
  const size = imageSize(path.join(PUBLIC_DIR, clean));
  sizeCache.set(clean, size);
  return size;
}

function walk(node, fn) {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, fn);
  }
}

export default function rehypeImgLazy() {
  return (tree) => {
    walk(tree, (node) => {
      if (!node || node.type !== 'element' || node.tagName !== 'img') return;
      const props = node.properties || {};

      if (props['data-eager'] !== undefined) return;
      if (!props.loading) props.loading = 'lazy';
      if (!props.decoding) props.decoding = 'async';

      // 显式宽高：只在缺 width/height 时补，已有的不动
      const hasW = props.width !== undefined;
      const hasH = props.height !== undefined;
      if (!hasW && !hasH) {
        const size = resolveSize(props.src);
        if (size && size.width > 0 && size.height > 0) {
          props.width = size.width;
          props.height = size.height;
        }
      }
    });
  };
}
