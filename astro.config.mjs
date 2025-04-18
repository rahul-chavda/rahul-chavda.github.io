// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  site: 'https://rahul-chavda.github.io/',
  integrations: [mdx(), sitemap(), icon(), vue()],
  vite: {
    plugins: [tailwindcss()],
  },
});
