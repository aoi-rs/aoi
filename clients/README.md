# Clients

Client applications and shared libraries. This workspace is managed with [Bun workspaces](https://bun.com/docs/pm/workspaces) and [Turborepo](https://turborepo.dev).

## Contents

The workspace is split into deployable applications under `apps/**` and reusable packages under `packages/**`. Everything is written in TypeScript.

- `apps/www`: [`account.aoi.rs`](https://account.aoi.rs) — built with [NextJS](https://nextjs.org)
- `packages/local`: local-first state management and reconciliation with the remote API

## Get Started

First install the workspace dependencies:

```sh
bun install
```

Then use the root scripts to run tasks across the monorepo:

```sh
bun run dev
```

Starts each workspace's development task through Turborepo. For `apps/www`, this runs the NextJS development server with Turbopack. For `packages/local`, it starts the package build in watch mode.

```sh
bun run build
```

Builds all workspaces through Turborepo, including dependency packages before the applications that use them.

```sh
bun run typecheck
```

Runs TypeScript checks.

```sh
bun run lint
```

Uses Biome to check formatting and lint all workspaces.

```sh
bun run lint:fix
```

Uses Biome to format and automatically fix lint issues in all workspaces.
