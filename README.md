# UI Component Registry & Documentation

This project is a UI component library and documentation site built with [Astro](https://astro.build), [Starlight](https://starlight.astro.build/), React, Tailwind CSS, and Shadcn UI. It is configured to be deployed on Cloudflare Workers.

## 📦 Prerequisites

- **Node.js**: Ensure you have Node.js installed.
- **Package Manager**: This project strictly uses `pnpm`.

## 🛠️ Setup & Installation

Install the project dependencies using `pnpm`:

```bash
pnpm install
```

## ⚙️ Environment Variables

Create a `.env` file in the root of your project to override default configurations if necessary:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PUBLIC_REGISTRY_URL` | The base URL for the Shadcn UI registry (used by the CLI to fetch components). | `http://localhost:4321` |

## 💻 Local Development

To start the local development server:

```bash
pnpm dev
```

This will start the Astro dev server.
- **Host**: Bound to `0.0.0.0`
- **Allowed Hosts**: `localhost` and `ui.orb.local`
- **Access**: Open [http://localhost:4321](http://localhost:4321) (or `http://ui.orb.local:4321` if you have configured your local DNS/hosts file).

## 🏗️ Build Process

The build process is a two-step sequence that first builds the Shadcn UI registry, then generates the static Astro site.

To build the project for production:

```bash
pnpm build
```

Behind the scenes, this runs:
1. **`pnpm registry:build`**: Uses `npx shadcn@latest build` to generate the registry files.
2. **`astro build`**: Builds the static documentation site and outputs assets to the `./dist/` directory.

## 🚀 Deployment

This project is configured for deployment to Cloudflare using the Cloudflare Pages GitHub integration. **Deployment is only available by merging to the `main` branch** - automated deployments are triggered upon merge.

- **Deployment Method**: Cloudflare GitHub integration
- **Trigger**: Push/merge to `main` branch
- **Compatibility Date**: `2025-10-08`
- **Main Entrypoint**: `src/api.ts` (handles dynamic worker logic)
- **Static Assets**: Served directly from the `./dist/` directory (`ASSETS` binding)
- **Node.js Compatibility**: Enabled via `nodejs_compat` flag
