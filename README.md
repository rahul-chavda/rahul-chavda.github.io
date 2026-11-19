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
| `npm run dev:<lab>` | Run one lab as a standalone page → `http://localhost:5173` |
| `npm run watch:<lab>` | Build/watch one lab for embedding in the blog |
| `npm run build` | Topological production build |
| `npm run clean` | Clear workspace build outputs and the `.turbo` cache |

For example, use `npm run watch:iptv` and `npm run dev` in separate terminals to work on the IPTV lab inside the blog. `npm run dev:iptv` opens the lab standalone and does not populate the blog embed.

## Documentation

- [Architecture Blueprint](docs/ARCHITECTURE.md) — Design principles, build pipeline, CSS isolation, memory management
- [Adding a New Lab](docs/ADDING_A_NEW_LAB.md) — Step-by-step guide to scaffold and integrate a new lab
- [Embedding Labs](docs/EMBEDDING_LABS.md) — Using `<LabEmbed />` in Astro pages and MDX posts
- [Maintenance](docs/MAINTENANCE.md) — Daily commands, Turbo caching, troubleshooting
