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
| `npm run dev` | Run only the Astro blog → `http://localhost:4321` |
| `npm run dev:<lab>` | Run one lab standalone → `http://localhost:5173` |
| `npm run dev:watch --workspace=labs/<lab>` | Build/watch one selected lab for embedding in the blog |
| `npm run build` | Topological production build |
| `npm run clean` | Clear all build artifacts and caches |

To see one lab inside the blog during development, start its watch build in one terminal and the blog in another. Standalone `dev:<lab>` serves the lab separately and does not populate the blog embed.

## Documentation

- [Architecture Blueprint](docs/ARCHITECTURE.md) — Design principles, build pipeline, CSS isolation, memory management
- [Adding a New Lab](docs/ADDING_A_NEW_LAB.md) — Step-by-step guide to scaffold and integrate a new lab
- [Embedding Labs](docs/EMBEDDING_LABS.md) — Using `<LabEmbed />` in Astro pages and MDX posts
- [Maintenance](docs/MAINTENANCE.md) — Daily commands, Turbo caching, troubleshooting
