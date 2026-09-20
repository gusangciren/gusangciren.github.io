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

function parseColumns() {
  // 解析 src/data/columns.ts，把每期专栏抽成搜索条目
  // 专栏正文在微信公众号（站内无全文），故只索引「第 N 期 · 标题」便于检索跳转
  const colPath = path.join(process.cwd(), 'src/data/columns.ts');
  const columns = [];
  if (!fs.existsSync(colPath)) return columns;

  const src = fs.readFileSync(colPath, 'utf-8');
  // 按 `id: 'xxx'` 切块，每块是一个专栏
  const blocks = src.split(/id:\s*'/).slice(1);
  blocks.forEach(block => {
    const idM = block.match(/^([^']+)'/);
    const id = idM ? idM[1] : '';
    const nameM = block.match(/name:\s*'([^']+)'/);
    const name = nameM ? nameM[1] : id;
    const issueBlocks = [...block.matchAll(/issues:\s*\[([\s\S]*?)\]/g)];
    // 取「含 title: 的那个 issues 块」（groups 里的 issues:[1,2,..] 是期号数组，会被误匹配）
    const target = issueBlocks.find(b => b[1].includes('title:'));
    if (!target) return;
    const issuesBody = target[1];
    const issueRe = /issue:\s*(\d+),\s*title:\s*"([^"]*)",\s*url:\s*"([^"]*)"/g;
    let m;
    while ((m = issueRe.exec(issuesBody))) {
      const issue = parseInt(m[1], 10);
      const rawTitle = m[2];
      columns.push({
        type: 'column',
        columnId: id,
        columnName: name,
        issue,
        title: `第 ${issue} 期 · ${rawTitle}`,
        rawTitle,
        url: m[3],
        desc: `《${name}》第 ${issue} 期`,
        content: rawTitle,
      });
    }
  });
  return columns;
}

function main() {
  const posts = [];
  const seriesContent = {}; // seriesName -> aggregated content
  const validSeries = new Set(); // 有对应书籍的 seriesName

  // ── 第一步：先读 books，拿到所有合法的 seriesName ──
  const booksDir = path.join(CONTENT_DIR, 'books');
  const booksRaw = [];
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
        if (seriesName) validSeries.add(seriesName);
        const fileName = path.basename(f);
        const slug = fileName.replace(/\.(md|mdx)$/i, '');
        booksRaw.push({ fm, slug, parts });
      }
    });
  }

  // ── 第二步：读取 blog 文章，只保留属于书籍的章节 ──
  const blogDir = path.join(CONTENT_DIR, 'blog');
  if (fs.existsSync(blogDir)) {
    fs.readdirSync(blogDir).forEach(f => {
      if (/\.(md|mdx)$/i.test(f)) {
        const post = parseMdFile(path.join(blogDir, f));
        if (!post) return;

        // 只索引「属于当前 books 的章节」；独立文章/已下线文章不再进入搜索结果
        if (post.series && validSeries.has(post.series)) {
          if (!seriesContent[post.series]) {
            seriesContent[post.series] = [];
          }
          // 用标题作为章节标记，方便搜索时识别来源
          seriesContent[post.series].push(
            `[${post.title}]\n${post.content}`
          );
          posts.push(post);
        }
      }
    });
  }

  // ── 第三步：生成 books 索引，合并章节正文 ──
  const books = [];
  booksRaw.forEach(({ fm, slug, parts }) => {
    const seriesName = fm.seriesName || '';
    const chapters = seriesContent[seriesName] || [];
    const bookBody = stripMarkdown(parts.slice(2).join('---')).substring(0, 2000);
    const aggregated = [
      bookBody,
      chapters.join('\n\n'),
    ].filter(Boolean).join('\n\n');

    books.push({
      title: fm.title || slug,
      slug: fm.slug || slug,
      series: seriesName,
      desc: fm.description || '',
      content: aggregated.substring(0, 50000), // 限制总长度
    });
  });

  const columns = parseColumns();
  const result = { posts, books, columns };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), 'utf-8');

  // 打印诊断信息
  console.log(`✅ search.json 已生成：${posts.length} 篇文章，${books.length} 本书，${columns.length} 期专栏`);
  console.log(`   已收录书籍系列：${Array.from(validSeries).join(' / ') || '无'}`);
  books.forEach(b => {
    console.log(`   📖 ${b.title} — content 长度: ${b.content.length} 字符`);
  });
  console.log(`输出路径：${OUT_FILE}`);
}

main();
