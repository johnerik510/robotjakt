import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://robotjakt.se',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/affiliate-disclaimer') &&
        !page.includes('/sok'),
    }),
  ],
});
