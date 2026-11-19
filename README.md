# rahul-chavda.github.io

Personal portfolio and blog built as a monorepo — an [Astro](https://astro.build) blog with isolated interactive labs powered by [Turborepo](https://turbo.build).

## Getting Started

```bash
# Install all dependencies
npm install

# Build everything (labs first, then blog)
npm run build
```

## Development

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launch all dev servers in parallel (Turborepo) |
| `npm run dev:blog` | Astro blog only → `http://localhost:4321` |
| `npm run dev:<lab>` | lab standalone → `http://localhost:5173` |
| `npm run build` | Topological production build |
| `npm run clean` | Clear all build artifacts and caches |

## Documentation

- [Architecture Blueprint](docs/ARCHITECTURE.md) — Design principles, build pipeline, CSS isolation, memory management
- [Adding a New Lab](docs/ADDING_A_NEW_LAB.md) — Step-by-step guide to scaffold and integrate a new lab
- [Embedding Labs](docs/EMBEDDING_LABS.md) — Using `<LabEmbed />` in Astro pages and MDX posts
- [Maintenance](docs/MAINTENANCE.md) — Daily commands, Turbo caching, troubleshooting
