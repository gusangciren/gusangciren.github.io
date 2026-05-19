/**
 * generate-search.js
 * 读取 src/content/blog/*.md 和 src/content/books/*.md，
 * 提取 frontmatter + 正文纯文本，写入 public/search.json
 *
 * 关键逻辑：blog/ 目录下有 series 字段的文章（如 fate-*.md）是书籍的章节，
 * 需要把同 series 的所有文章内容聚合到对应书籍的 content 中，否则书籍索引正文为空。
 *
 * 用法：node generate-search.js
 */

import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/content');
const OUT_FILE = path.join(process.cwd(), 'public/search.json');

function stripMarkdown(md) {
  let s = md;
  // 去掉代码块
  s = s.replace(/```[\s\S]*?```/g, '');
  // 去掉行内代码
  s = s.replace(/`[^`]*`/g, '');
  // 去掉图片
  s = s.replace(/!\[.*?\]\(.*?\)/g, '');
  // 去掉链接，保留文字
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // 去掉标题标记
  s = s.replace(/^#{1,6}\s+/gm, '');
  // 去掉粗体/斜体标记
  s = s.replace(/(\*\*|__)(.*?)\1/g, '$2');
  s = s.replace(/(\*|_)(.*?)\1/g, '$2');
  // 去掉列表标记
  s = s.replace(/^[\s]*[-*+]\s+/gm, '');
  s = s.replace(/^[\s]*\d+\.\s+/gm, '');
  // 去掉引用标记
  s = s.replace(/^>\s?/gm, '');
  // 去掉分隔线
  s = s.replace(/^[-*_]{3,}\s*$/gm, '');
  // 去掉 HTML 标签
  s = s.replace(/<[^>]*>/g, '');
  // 合并多余空行
  s = s.replace(/\n{2,}/g, '\n');
  return s.trim();
}

function parseMdFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parts = raw.split(/^---$/m);
  if (parts.length < 3) return null;

  const fm = {};
  parts[1].split('\n').forEach(line => {
    // 支持带引号的值：key: "value" 或 key: value
    const m = line.match(/^(\w+):\s*["']?(.+?)["']?\s*$/);
    if (m) {
      fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  });

  const body = parts.slice(2).join('---');
  const content = stripMarkdown(body).substring(0, 8000);

  const fileName = path.basename(filePath);
  const slug = fileName.replace(/\.(md|mdx)$/i, '');

  return {
    title: fm.title || slug,
    slug: fm.slug || slug,
    desc: fm.description || '',
    content: content,
    series: fm.series || null,
  };
}

function main() {
  const posts = [];
  const seriesContent = {}; // seriesName -> aggregated content

  // ── 第一步：读取 blog 文章 ──
  const blogDir = path.join(CONTENT_DIR, 'blog');
  if (fs.existsSync(blogDir)) {
    fs.readdirSync(blogDir).forEach(f => {
      if (/\.(md|mdx)$/i.test(f)) {
        const post = parseMdFile(path.join(blogDir, f));
        if (!post) return;

        // 属于某本书的章节 → 聚合到该 series 的内容中
        if (post.series) {
          if (!seriesContent[post.series]) {
            seriesContent[post.series] = [];
          }
          // 用标题作为章节标记，方便搜索时识别来源
          seriesContent[post.series].push(
            `[${post.title}]\n${post.content}`
          );
        }

        // 所有 blog 文章都进入 posts 数组（独立文章 + 章节都可搜）
        posts.push(post);
      }
    });
  }

  // ── 第二步：读取 books 元数据，并合并章节正文 ──
  const books = [];
  const booksDir = path.join(CONTENT_DIR, 'books');
  if (fs.existsSync(booksDir)) {
    fs.readdirSync(booksDir).forEach(f => {
      if (/\.(md|mdx)$/i.test(f)) {
        const raw = fs.readFileSync(path.join(booksDir, f), 'utf-8');
        const parts = raw.split(/^---$/m);
        if (parts.length < 3) return;

        const fm = {};
        parts[1].split('\n').forEach(line => {
          const m = line.match(/^(\w+):\s*["']?(.+?)["']?\s*$/);
          if (m) {
            fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
          }
        });

        const seriesName = fm.seriesName || '';
        const fileName = path.basename(f);
        const slug = fileName.replace(/\.(md|mdx)$/i, '');

        // 合并该 series 的所有章节正文
        const chapters = seriesContent[seriesName] || [];
        const bookBody = stripMarkdown(parts.slice(2).join('---')).substring(0, 2000);
        const aggregated = [
          bookBody,
          chapters.join('\n\n'),
        ].filter(Boolean).join('\n\n');

        books.push({
          title: fm.title || slug,
          slug: fm.slug || slug,
          desc: fm.description || '',
          content: aggregated.substring(0, 50000), // 限制总长度
        });
      }
    });
  }

  const result = { posts, books };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), 'utf-8');

  // 打印诊断信息
  console.log(`✅ search.json 已生成：${posts.length} 篇文章，${books.length} 本书`);
  books.forEach(b => {
    console.log(`   📖 ${b.title} — content 长度: ${b.content.length} 字符`);
  });
  console.log(`输出路径：${OUT_FILE}`);
}

main();
