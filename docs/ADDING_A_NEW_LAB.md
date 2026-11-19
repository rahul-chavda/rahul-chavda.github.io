# Adding a New Lab: Step-by-Step Guide

Follow this guide to create and integrate a new lab (e.g., `labs/synth` or `labs/charts`). Labs can use **any web framework** — Vue, React, Svelte, vanilla TypeScript, Three.js, D3, or anything else that runs in the browser. The only requirement is that the lab builds to a `bundle.js` + `style.css` via Vite and handles mount/unmount lifecycle events.

---

## Step 1: Scaffold Directory Structure

Create the lab directory under `labs/<name>`:

```bash
mkdir -p labs/<name>/src/assets
```

---

## Step 2: Create `labs/<name>/package.json`

Name your lab package `@labs/<name>` and add whatever framework dependencies your lab needs:

```json
{
  "name": "@labs/<name>",
  "private": true,
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "dev:watch": "vite build --watch",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    // Add your framework and lab-specific deps here, e.g.:
    // "vue": "^3.5.45",        — for a Vue lab
    // "react": "^19.0.0",      — for a React lab
    // "three": "^0.170.0",     — for a Three.js lab
    // "d3": "^7.9.0",          — for a D3 lab
    // ... or nothing at all for vanilla TS/JS
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.5",
    "tailwindcss": "^4.3.5",
    "typescript": "^5.8.0",
    "vite": "^6.2.0"
    // Add framework-specific Vite plugins here, e.g.:
    // "@vitejs/plugin-vue": "^5.2.1",
    // "@vitejs/plugin-react": "^4.4.1",
    // "@sveltejs/vite-plugin-svelte": "^5.0.0",
  }
}
```

> [!NOTE]
> Only add dependencies your lab actually uses. The blog's `package.json` should never include lab-specific libraries — that's the whole point of isolation.

---

## Step 3: Create `labs/<name>/vite.config.ts`

The critical part: output must target `apps/blog/public/labs/<name>` with stable filenames `bundle.js` and `style.css`. Add whatever framework plugin your lab needs (or none for vanilla JS/TS):

```ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
// import vue from '@vitejs/plugin-vue';        // if Vue
// import react from '@vitejs/plugin-react';    // if React
// import { svelte } from '@sveltejs/vite-plugin-svelte'; // if Svelte

export default defineConfig({
  plugins: [
    tailwindcss(),
    // vue(),     // add your framework plugin here
    // react(),
    // svelte(),
  ],
  build: {
    outDir: resolve(__dirname, '../../apps/blog/public/labs/<name>'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/main.ts'),
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'style.css';
          return 'assets/[name]-[hash][extname]';
        },
        format: 'es'
      }
    }
  }
});
```

**Key points:**
- `outDir` writes built assets directly into the blog's `public/labs/<name>/` directory.
- `entryFileNames: 'bundle.js'` ensures a stable filename for the `<LabEmbed>` component to reference.
- CSS is output as `style.css` (not hashed) for the same reason.
- Other assets (images, fonts) are hashed under `assets/`.

---

## Step 4: Create `labs/<name>/src/style.css` (Lean Tailwind v4)

```css
@import "tailwindcss/theme";
@import "tailwindcss/utilities";

@source "./";
```

> [!IMPORTANT]
> Do **not** import `tailwindcss/preflight` here. The host blog's `global.css` already provides the CSS reset. Importing it again would duplicate preflight rules and risk specificity conflicts.

If your lab doesn't use Tailwind, you can use a plain CSS file or skip this entirely — just make sure Vite outputs a `style.css` if you have any styles.

---

## Step 5: Create `labs/<name>/src/main.ts`

This is the **contract** between the blog and your lab. Regardless of framework, `main.ts` must:

1. Find all `[data-lab-root="<name>"]` containers in the DOM
2. Mount your app/component into each container
3. Clean up on `astro:before-swap` to prevent memory leaks

```ts
import './style.css';

// Track mounted instances for cleanup during Astro page transitions
const mountedInstances = new Map<HTMLElement, { destroy: () => void }>();

function mountLabs() {
  const containers = document.querySelectorAll<HTMLElement>('[data-lab-root="<name>"]');

  containers.forEach((container) => {
    if (mountedInstances.has(container)) return;

    // Parse props passed from <LabEmbed> component
    let props: Record<string, any> = {};
    if (container.dataset.props) {
      try {
        props = JSON.parse(container.dataset.props);
      } catch (e) {
        console.error('Failed to parse <name> lab props:', e);
      }
    }

    // --- Mount your lab here ---
    // Replace this section with your framework's mount logic.
    //
    // Vanilla JS/TS example:
    //   container.innerHTML = '<h1>Hello from lab</h1>';
    //   const destroy = () => { container.innerHTML = ''; };
    //
    // Vue example:
    //   const app = createApp(AppRoot, props);
    //   app.mount(container);
    //   const destroy = () => app.unmount();
    //
    // React example:
    //   const root = createRoot(container);
    //   root.render(<App {...props} />);
    //   const destroy = () => root.unmount();
    //
    // Svelte example:
    //   const component = new App({ target: container, props });
    //   const destroy = () => component.$destroy();
    //
    // Three.js (no framework) example:
    //   const { renderer, scene, camera, animationId } = initScene(container, props);
    //   const destroy = () => {
    //     cancelAnimationFrame(animationId);
    //     renderer.dispose();
    //     container.innerHTML = '';
    //   };

    const destroy = () => {
      // Your cleanup logic here
    };

    mountedInstances.set(container, { destroy });
  });
}

function unmountLabs() {
  mountedInstances.forEach(({ destroy }) => destroy());
  mountedInstances.clear();
}

// Astro ClientRouter (View Transitions) Lifecycle Hooks
document.addEventListener('astro:page-load', mountLabs);
document.addEventListener('astro:before-swap', unmountLabs);

// Initial execution fallback for non-Astro standalone dev
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLabs);
} else {
  mountLabs();
}
```

> [!WARNING]
> The `unmountLabs()` function is critical for memory management. If your lab uses WebGL renderers, `requestAnimationFrame` loops, audio/video streams, or WebSocket connections, make sure your `destroy` function cleans all of them up.

---

## Step 6: Create `labs/<name>/index.html` (Standalone Dev Entry)

This file enables running the lab standalone with `vite dev` for rapid iteration:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lab (Standalone)</title>
    <style>
      @import "tailwindcss/preflight";
      body { margin: 0; background: #000; color: #fff; height: 100vh; }
    </style>
  </head>
  <body>
    <div data-lab-root="<name>" class="w-full h-full" style="height: 100vh;"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

> [!NOTE]
> `@import "tailwindcss/preflight"` is included here because the standalone dev server does not load the blog's `global.css`. This ensures the lab looks correct during development.

---

## Step 7: Create Astro Shell Page

Create `apps/blog/src/pages/lab/<name>.astro`:

```astro
---
import LabPage from '@layouts/LabPage.astro';
import LabEmbed from '@components/lab/LabEmbed.astro';
---

<LabPage title="My New Lab">
  <div class="w-full h-[calc(100vh-140px)] min-h-[600px]">
    <LabEmbed slug="<name>" height="100%" class="rounded-none shadow-none" />
  </div>
</LabPage>
```

---

## Step 8: Register Dev Script in Root `package.json`

Add a convenience script to the root `package.json`:

```json
"dev:<name>": "npm run dev --workspace=labs/<name>"
```

---

## Step 9: Install Dependencies & Verify

```bash
# Install all workspace dependencies
npm install

# Build the new lab standalone
npm run build --workspace=labs/<name>

# Verify bundle output exists
ls apps/blog/public/labs/<name>/bundle.js
ls apps/blog/public/labs/<name>/style.css

# Run full monorepo build
npm run build
```

---

## Checklist

- [ ] `labs/<name>/package.json` created with `@labs/<name>` package name.
- [ ] `labs/<name>/vite.config.ts` outputs to `apps/blog/public/labs/<name>`.
- [ ] `labs/<name>/src/style.css` uses lean Tailwind (no preflight).
- [ ] `labs/<name>/src/main.ts` handles mount/unmount with Astro lifecycle hooks.
- [ ] `labs/<name>/index.html` standalone dev entry with preflight.
- [ ] `apps/blog/src/pages/lab/<name>.astro` shell page created.
- [ ] Root `package.json` has `dev:<name>` script.
- [ ] `npm run build` succeeds with the new lab.
