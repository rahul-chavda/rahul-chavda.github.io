# Embedding Labs in Pages and MDX Articles

The `<LabEmbed />` component enables embedding any lab into `.astro` templates or `.mdx` blog posts.

---

## 1. Basic Embed

```astro
---
import LabEmbed from '@components/lab/LabEmbed.astro';
---

<!-- Embed a lab with default height (600px) -->
<LabEmbed slug="<lab>" />
```

---

## 2. Custom Dimensions & Props

Pass initial configuration through `props`:

```astro
<LabEmbed 
  slug="<lab>" 
  height="700px" 
  props={{ 
    theme: "dark", 
    autoplay: true 
  }} 
/>
```

### Available Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `slug` | `string` | _(required)_ | Lab identifier matching the `labs/<slug>` workspace and `data-lab-root` attribute. |
| `props` | `Record<string, any>` | `{}` | Arbitrary key-value pairs serialized as JSON and passed to the lab's root component. |
| `height` | `string` | `"600px"` | CSS height for the embed wrapper. |
| `class` | `string` | `""` | Additional CSS classes appended to the embed wrapper. |

---

## 3. Embedding in MDX Blog Posts

In `src/content/blog/<slug>.mdx`:

```mdx
---
title: Building an Interactive Demo
pubDate: 2026-03-15
---

import LabEmbed from '@components/lab/LabEmbed.astro';

Here is a live demo running inline within this article:

<LabEmbed slug="<lab>" height="500px" class="my-8" />

Notice how it runs inside the article without an iframe.
```

> [!NOTE]
> The `import` statement must be placed **after** the frontmatter (`---`) block and **before** the first usage of the component. MDX does not support imports inside frontmatter.

---

## 4. Multi-Instance Support

You can render multiple instances of the same lab on the same page. Each instance receives its own isolated DOM container and its own prop payload:

```astro
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <LabEmbed slug="<lab>" height="400px" props={{ mode: "day" }} />
  <LabEmbed slug="<lab>" height="400px" props={{ mode: "night" }} />
</div>
```

### How Multi-Instance Works

1. Each `<LabEmbed>` renders a unique `<div data-lab-root="<lab>">` element in the DOM.
2. The lab's `main.ts` uses `querySelectorAll('[data-lab-root="<lab>"]')` to find **all** containers.
3. The `mountedInstances` Map tracks which containers have already been mounted, preventing duplicate initialization.
4. Each container gets its own app instance with its own props.

---

## 5. Full-Page Lab Embed (No Border/Shadow)

For dedicated lab pages where the lab should fill the viewport:

```astro
---
import LabPage from '@layouts/LabPage.astro';
import LabEmbed from '@components/lab/LabEmbed.astro';
---

<LabPage title="My Lab">
  <div class="w-full h-[calc(100vh-140px)] min-h-[600px]">
    <LabEmbed slug="<lab>" height="100%" class="rounded-none shadow-none" />
  </div>
</LabPage>
```

The `rounded-none shadow-none` classes override the default embed styling for a seamless full-bleed appearance.

---

## 6. Styling Considerations

- **Blog CSS resets** (`preflight`) are applied globally by `global.css`. Labs do not need to include their own reset.
- **Lab styles** are scoped to the lab's bundle via Tailwind v4's `@source "./"` directive, which scans only the lab's own source files.
- **Custom CSS classes** passed through the `class` prop apply to the outer wrapper only. They do not penetrate into the lab's component tree.
