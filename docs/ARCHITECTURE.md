# Architecture

## 1. Overview

This is a monorepo for a personal portfolio and blog. The blog is built with [Astro](https://astro.build) and lives in `apps/blog/`. Interactive experiments ("labs") are fully self-contained apps that live in `labs/*/` — each with its own framework, dependencies, and build. [Turborepo](https://turbo.build) orchestrates builds across all workspaces.

Labs are embedded into blog pages using the **Client Mount Pattern**: each lab builds into a static bundle (`bundle.js` + `style.css`) that the blog loads at runtime via the `<LabEmbed />` component. No iframes, no shared dependencies, complete isolation.

---

## 2. Project Structure

```text
├── apps/
│   └── blog/                       # Astro blog application
│       ├── package.json            # Only Astro + blog deps (no lab frameworks)
│       ├── astro.config.mjs
│       ├── src/
│       │   ├── components/
│       │   │   └── lab/
│       │   │       └── LabEmbed.astro  # Universal lab embedding component
│       │   ├── content/            # Blog posts (MDX / Markdown)
│       │   ├── layouts/
│       │   ├── pages/
│       │   │   └── lab/            # Shell pages for each lab
│       │   └── styles/
│       │       └── global.css      # Blog-wide Tailwind preflight + utilities
│       └── public/
│           └── labs/               # ⚠️ Git-ignored — populated by lab builds
│               └── <lab>/
│                   ├── bundle.js
│                   └── style.css
├── labs/
│   └── <lab>/                      # Each lab is an isolated workspace
│       ├── package.json            # Lab-specific deps (any framework)
│       ├── vite.config.ts          # Builds to apps/blog/public/labs/<lab>/
│       ├── index.html              # Standalone dev entry
│       └── src/
│           ├── main.ts             # Entry point with Astro lifecycle hooks
│           ├── style.css           # Lean Tailwind v4 (theme + utilities only)
│           └── assets/             # Colocated images, textures, etc.
├── docs/                           # Developer documentation
├── package.json                    # npm workspaces: apps/*, labs/*
└── turbo.json                      # Turborepo pipeline config
```

---

## 3. Build Pipeline

```text
[ Turborepo ]
      │
      ├──> labs/*    ──(vite build)──> apps/blog/public/labs/<lab>/{bundle.js, style.css}
      │    (parallel)
      │
      └──> apps/blog ──(astro build)─> apps/blog/dist/
```

1. **Turborepo** reads `turbo.json` and resolves the topological dependency graph.
2. The `build` task uses `"dependsOn": ["^build"]` — each workspace builds its upstream dependencies first.
3. All lab workspaces build **in parallel** (they have no inter-dependencies), outputting bundles into `apps/blog/public/labs/`.
4. `apps/blog` builds last, copying all `public/` assets (including lab bundles) into `dist/`.

### Development Workflow

- `npm run dev` starts only the Astro blog through Turbo.
- `npm run dev:<lab>` starts one lab as a standalone Vite app; it does not feed the embedded blog route.
- To show one selected lab inside Astro, run `npm run watch:<lab>` in another terminal. This writes that lab's bundle and stylesheet into `apps/blog/public/labs/<lab>/`.
- `npm run build` builds all labs and the blog. `npm run clean` removes generated lab bundles, so after cleaning, start a selected lab's watch build before opening its embedded route.

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalPassThroughEnv": ["ASTRO_TELEMETRY_DISABLED", "CI"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "../../apps/blog/public/labs/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

## 4. Client Mount Pattern

### How It Works

1. Each lab builds into two files: `bundle.js` (ES module) and `style.css`.
2. The `<LabEmbed slug="<lab>" />` Astro component loads both at runtime.
3. The lab's `main.ts` finds its mount target (`[data-lab-root="<lab>"]`) and renders into it.
4. On Astro page transitions, `main.ts` tears everything down before the DOM swap.

### Why This Pattern?

- **No Iframes**: Labs render directly in the DOM — seamless scrolling, shared theme tokens, responsive viewport.
- **Dependency Isolation**: Each lab owns its `package.json`. The blog knows nothing about Vue, React, Three.js, etc.
- **Framework Agnostic**: Labs can use any web technology. The only contract is `bundle.js` + `style.css` + mount/unmount lifecycle.
- **Multi-Instance**: Multiple `<LabEmbed>` components on the same page each get their own isolated instance.

---

## 5. CSS Isolation

### Tailwind v4 Layer Separation

| Layer | Where Applied | Purpose |
| :--- | :--- | :--- |
| `@import "tailwindcss"` (full) | `apps/blog/src/styles/global.css` | Provides **preflight** (CSS reset) and utilities for the host blog. |
| `@import "tailwindcss/theme"` | `labs/*/src/style.css` | Provides design tokens (colors, spacing, etc.) without duplicating preflight. |
| `@import "tailwindcss/utilities"` | `labs/*/src/style.css` | Provides utility classes scoped to the lab's source files via `@source "./";`. |

This prevents the CSS reset from being applied twice, avoiding specificity conflicts and unnecessary bundle bloat.

---

## 6. Lifecycle & Memory Management

Astro uses `<ClientRouter />` (View Transitions) for SPA-like client-side navigation. Without proper cleanup, page transitions cause memory leaks, duplicate instances, and orphaned resources.

Every lab's `main.ts` binds to two Astro lifecycle events:

```ts
// Mount on initial load and after each view transition
document.addEventListener('astro:page-load', mountLabs);

// Tear down before the DOM swap
document.addEventListener('astro:before-swap', unmountLabs);
```

Each lab maintains a `Map<HTMLElement, { destroy }>` that tracks mounted instances by container element. This enables:

- **Skipping already-mounted containers** — prevents duplicates on re-navigation
- **Full cleanup on navigation** — iterates and destroys every tracked instance
- **Multiple instances per page** — each `<LabEmbed>` creates a unique container

---

## 7. LabEmbed Component

The `<LabEmbed />` Astro component is the bridge between the blog and any lab:

```astro
---
interface Props {
  slug: string;
  props?: Record<string, any>;
  height?: string;
  class?: string;
}

const { slug, props = {}, height = "600px", class: className = "" } = Astro.props;
const serializedProps = JSON.stringify(props);
---

<div class={`lab-embed-wrapper relative w-full rounded-xl overflow-hidden shadow-lg ${className}`} style={`height: ${height};`}>
  <link rel="stylesheet" href={`/labs/${slug}/style.css`} />
  <div data-lab-root={slug} data-props={serializedProps} class="w-full h-full relative"></div>
  <script type="module" src={`/labs/${slug}/bundle.js`}></script>
</div>
```

**What it does:**
1. Loads the lab's compiled `style.css` via a `<link>` tag.
2. Creates a mount target `<div>` with `data-lab-root="<slug>"` and serialized `data-props`.
3. Loads the lab's compiled `bundle.js` as an ES module, which finds the container and mounts.
