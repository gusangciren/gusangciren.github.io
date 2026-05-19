---
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
const books = await getCollection('books');

const searchIndex = {
  posts: posts
    .filter(p => !p.data.series)
    .map(p => ({
      title: p.data.title,
      slug: p.data.slug,
      desc: p.data.description || '',
      date: p.data.date,
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date)),
  books: books.map(b => {
    const slug = b.id.replace(/\.(md|mdx)$/i, '');
    return {
      title: b.data.title,
      slug,
      desc: b.data.description || '',
    };
  }),
};

// Write to public/search.json
import fs from 'fs';
import path from 'path';
const outPath = path.join(process.cwd(), 'public', 'search.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(searchIndex, null, 2));
console.log(`✓ search.json generated: ${searchIndex.posts.length} posts, ${searchIndex.books.length} books`);
