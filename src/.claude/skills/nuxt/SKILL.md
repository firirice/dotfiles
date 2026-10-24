---
name: nuxt
description: Nuxt 4 full-stack Vue framework with SSR, auto-imports, and file-based routing. Use when working with Nuxt 4 apps, server routes, useFetch, middleware, or hybrid rendering.
metadata:
  author: Anthony Fu
  version: "2026.10.25"
  source: Adapted from https://github.com/antfu/skills (skills/nuxt), regenerated against the nuxt/nuxt 4.x branch docs
---

Nuxt is a full-stack Vue framework that provides server-side rendering, file-based routing, auto-imports, and a powerful module system. It uses Nitro as its server engine for universal deployment across Node.js, serverless, and edge platforms.

> The skill is based on Nuxt 4.6 (`4.6.2`, `4.x` branch), generated at 2026-10-25. Version badges like "4.4+" mark features added in a 4.x minor — check the project's `nuxt` version before using them.

> **Directory layout:** the default `srcDir` is `app/` — Vue app code (`app.vue`, `components/`, `composables/`, `pages/`, etc.) lives under `app/`, while `server/`, `shared/`, `public/`, `modules/`, `layers/` and `nuxt.config.ts` stay at the project root. The `~`/`@` aliases point at `app/`; use `~~`/`@@` for the root.

> **Nuxt 4 server note:** Nuxt 4 runs on **Nitro v2** (`nitropack`, h3 v1). Server helpers (`defineEventHandler`, `getQuery`, `readBody`, `createError`…) are **auto-imported** in `server/`. From 4.6, `nuxt/server` offers the same names as explicit imports that also run on Nuxt 5 — when using it, import every helper (including `defineEventHandler`) from `nuxt/server` and never mix it with the auto-imported h3 versions in one handler. Nitro v3 APIs (`import ... from 'nitro'`, `nitro/h3`, `definePlugin`, `event.res.headers` on h3 events) do **not** exist on Nuxt 4.

> **Nuxt 5 opt-ins:** typed pages, case-sensitive routing, route-typed `$fetch` and other Nuxt 5 defaults are **off** unless the project sets `future.compatibilityVersion: 5` or the individual `experimental` flag. Check `nuxt.config.ts` before assuming them. See [core-config](references/core-config.md#opting-into-nuxt-5).

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Directory Structure | `app/` srcDir, `shared/`, aliases, conventions | [core-directory-structure](references/core-directory-structure.md) |
| Configuration | nuxt.config.ts, app.config.ts, aliases, Nuxt 5 opt-in flags, experimental | [core-config](references/core-config.md) |
| CLI Commands | Dev server, build, generate, preview, and utility commands | [core-cli](references/core-cli.md) |
| Routing | File-based routing, opt-in typed routes, named views, layout props, middleware | [core-routing](references/core-routing.md) |
| Data Fetching | useFetch, useAsyncData, $fetch, createUseFetch factories & addons, response typing, caching | [core-data-fetching](references/core-data-fetching.md) |
| Modules | Creating and using Nuxt modules, Nuxt Kit utilities | [core-modules](references/core-modules.md) |
| Deployment | Platform-agnostic deployment with Nitro, Vercel, Netlify, Cloudflare | [core-deployment](references/core-deployment.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Composables Auto-imports | Vue/Nuxt composables, custom composables, `shared/`, useAnnouncer | [features-composables](references/features-composables.md) |
| Components Auto-imports | Component naming, lazy loading, hydration strategies | [features-components-autoimport](references/features-components-autoimport.md) |
| Built-in Components | NuxtLink, NuxtPage, NuxtLayout, NuxtAnnouncer, ClientOnly, and more | [features-components](references/features-components.md) |
| State Management | useState composable, SSR-friendly state, Pinia integration | [features-state](references/features-state.md) |
| Server Routes | API routes, Nitro v2 (h3 v1) auto-imports vs `nuxt/server`, sessions, middleware | [features-server](references/features-server.md) |

## Rendering

| Topic | Description | Reference |
|-------|-------------|-----------|
| Rendering Modes | Universal (SSR), client-side (SPA), hybrid rendering, route rules | [rendering-modes](references/rendering-modes.md) |

## Best Practices

| Topic | Description | Reference |
|-------|-------------|-----------|
| Data Fetching Patterns | Efficient fetching, caching, parallel requests, error handling | [best-practices-data-fetching](references/best-practices-data-fetching.md) |
| SSR & Hydration | Avoiding context leaks, hydration mismatches, composable patterns | [best-practices-ssr](references/best-practices-ssr.md) |

## Advanced

| Topic | Description | Reference |
|-------|-------------|-----------|
| Layers | Extending applications with reusable layers | [advanced-layers](references/advanced-layers.md) |
| Lifecycle Hooks | Build-time, runtime, and server hooks | [advanced-hooks](references/advanced-hooks.md) |
| Module Authoring | Publishable modules with Nuxt Kit, keyed composables, portable server handlers | [advanced-module-authoring](references/advanced-module-authoring.md) |
