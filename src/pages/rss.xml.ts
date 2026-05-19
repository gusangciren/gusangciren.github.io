import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  const sorted = posts
    .filter(p => !p.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: '像企业家一样写作',
    description: 'Gus 的公众号「种一个梦」，关于写作、创业与思维模型',
    site: context.site,
    items: sorted.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description || '',
      link: `/blog/${post.data.slug}/`,
    })),
    customData: '<language>zh-cn</language>',
  });
}
