import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeImgLazy from './src/plugins/rehype-img-lazy.mjs';

export default defineConfig({
  site: 'https://gusangciren.github.io',
  base: '/',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
    rehypePlugins: [rehypeImgLazy],
  },
});
