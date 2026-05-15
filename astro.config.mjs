import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gusangciren.github.io',
  base: '/',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
