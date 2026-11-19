# Maintenance & Operations Guide

## 1. Daily Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Run only the Astro blog via Turborepo → `http://localhost:4321`. |
| `npm run dev:<lab>` | Run one lab standalone → `http://localhost:5173` with Vite HMR. |
| `npm run dev:watch --workspace=labs/<lab>` | Build/watch one selected lab for embedding in the blog. |
| `npm run build` | Topological production build (all labs, then blog). |
| `npm run clean` | Clear all build artifacts and caches. |

---

## 2. Turborepo Caching

Turborepo caches build tasks based on file hashes. If you run `npm run build` without modifying a lab, Turborepo serves the build from cache (`>>> FULL TURBO`).

To bypass the cache and force a rebuild:

```bash
npx turbo run build --force
```

### Cache Output Locations

| Workspace | Build Output | Cached By Turbo |
| :--- | :--- | :--- |
| `labs/<lab>` | `apps/blog/public/labs/<lab>/` | ✅ via `"../../apps/blog/public/labs/**"` |
| `apps/blog` | `apps/blog/dist/` | ✅ via `"dist/**"` |

---

## 3. Asset Bundling Rules

- **Colocate Assets**: Never place lab-specific images, gifs, or textures in `apps/blog/public/`. Always put them in `labs/<lab>/src/assets/`.
- **Import via Vite**: In your components or TypeScript files, import assets directly:
  ```ts
  import textureUrl from './assets/texture.png';
  ```
  Vite automatically optimizes, hashes, and outputs the asset into `apps/blog/public/labs/<lab>/assets/`.
- **Blog-Level Assets**: Only assets shared across the blog (favicons, global images) belong in `apps/blog/public/`.

---

## 4. Development Workflows

### Standalone Lab Development

The fastest feedback loop for lab development is standalone mode:

```bash
npm run dev:<lab>
```

This serves `labs/<lab>/index.html` on `http://localhost:5173` with instant hot module replacement.
It is a standalone page and does not supply the compiled bundle used by the Astro embed.

### Integrated Blog Development

The root `dev` command starts only Astro. To work on one lab inside its blog page, build/watch that lab separately:

```bash
# Terminal 1: Watch-build the lab (continuous output to public/labs/)
npm run dev:watch --workspace=labs/<lab>

# Terminal 2: Start only the Astro blog
npm run dev
```

The watch build continuously rebuilds `bundle.js` and `style.css` into `apps/blog/public/labs/<lab>/`. Astro's dev server picks up the new files on each page load.

After `npm run clean`, the generated lab files are removed. Start the selected lab's watch build to regenerate them before opening its embedded page. Other labs stay unbuilt until selected.

`npm run build` remains the command that builds every lab and the blog for production.

---

## 5. Adding Dependencies

### Lab-Specific Dependencies

Always add dependencies to the specific lab workspace:

```bash
npm install <package> --workspace=labs/<lab>
```

### Blog-Specific Dependencies

```bash
npm install <package> --workspace=apps/blog
```

### Root DevDependencies

Only for tools shared across the entire monorepo (Turbo, TypeScript):

```bash
npm install -D <package>
```

---

## 6. Troubleshooting & FAQ

### Issue: Lab styles look unstyled in standalone dev
**Cause**: The lab bundle uses lean Tailwind v4 without Preflight.
**Fix**: Ensure `labs/<lab>/index.html` contains `@import "tailwindcss/preflight";` inside its `<style>` tag.

### Issue: Lab changes are not appearing in the blog
**Cause**: Astro loads `/labs/<lab>/bundle.js` from `apps/blog/public/labs/`.
**Fix**: In a second terminal, run `npm run dev:watch --workspace=labs/<lab>` to continuously write updated bundles into `public/labs/`.

### Issue: An embedded lab shows "This lab is unavailable"
**Cause**: Its generated bundle is missing, for example after `npm run clean`.
**Fix**: Start `npm run dev:watch --workspace=labs/<lab>` in another terminal, then reload the blog page.

### Issue: `npm run build` fails with missing lab bundles
**Cause**: Turborepo may be serving a stale cache.
**Fix**: Force a clean rebuild:
```bash
npm run clean && npm install && npm run build
```

### Issue: Duplicate instances after page navigation
**Cause**: The lab's `main.ts` is not cleaning up on `astro:before-swap`.
**Fix**: Verify that `unmountLabs()` is registered as a listener for `astro:before-swap` and that it destroys every tracked instance.

### Issue: WebGL context lost warnings
**Cause**: WebGL renderers are not being disposed during page transitions.
**Fix**: In your cleanup/destroy function, call `renderer.dispose()`, `geometry.dispose()`, and `material.dispose()`.
