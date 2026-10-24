---
name: configuration
description: Nuxt configuration files including nuxt.config.ts, app.config.ts, and runtime configuration
---

# Nuxt Configuration

Nuxt uses configuration files to customize application behavior. The main configuration options are `nuxt.config.ts` for build-time settings and `app.config.ts` for runtime settings.

## nuxt.config.ts

The main configuration file at the root of your project:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // Configuration options
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
})
```

### Path Aliases

The default `srcDir` is `app/`, so path aliases resolve as:

| Alias | Resolves to |
|-------|-------------|
| `~` / `@` | `<rootDir>/app` |
| `~~` / `@@` | `<rootDir>` (project root) |
| `#shared` | `<rootDir>/shared` |
| `#server` | `<rootDir>/server` |

Reference root-level paths (modules, server handlers) with `~~` or `#server`:

```ts
export default defineNuxtConfig({
  modules: ['~~/custom-modules/awesome.js'], // relative to rootDir
  serverHandlers: [
    { route: '/foo/**', handler: '#server/foohandler.ts' },
  ],
})
```

### Compatibility Version

Nuxt 4 is the default behavior. From Nuxt 4.2+, `future.compatibilityVersion: 5` opts into most Nuxt 5 breaking changes ahead of time (see [Opting into Nuxt 5](#opting-into-nuxt-5)). Nitro v3 itself is **not** enabled by any flag on Nuxt 4.

### Environment Overrides

Configure environment-specific settings:

```ts
export default defineNuxtConfig({
  $production: {
    routeRules: {
      '/**': { isr: true },
    },
  },
  $development: {
    // Development-specific config
  },
  $env: {
    staging: {
      // Staging environment config
    },
  },
})
```

Use `--envName` flag to select environment: `nuxt build --envName staging`

## Runtime Config

For values that need to be overridden via environment variables:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Server-only keys
    apiSecret: '123',
    // Keys within public are exposed to client
    public: {
      apiBase: '/api',
    },
  },
})
```

Override with environment variables:

```ini
# .env
NUXT_API_SECRET=api_secret_token
NUXT_PUBLIC_API_BASE=https://api.example.com
```

Access in components/composables:

```vue
<script setup lang="ts">
const config = useRuntimeConfig()
// Server: config.apiSecret, config.public.apiBase
// Client: config.public.apiBase only
</script>
```

## App Config

For public tokens determined at build time (not overridable via env vars):

```ts
// app/app.config.ts
export default defineAppConfig({
  title: 'Hello Nuxt',
  theme: {
    dark: true,
    colors: {
      primary: '#ff0000',
    },
  },
})
```

Access in components:

```vue
<script setup lang="ts">
const appConfig = useAppConfig()
</script>
```

## runtimeConfig vs app.config

| Feature | runtimeConfig | app.config |
|---------|--------------|------------|
| Client-side | Hydrated | Bundled |
| Environment variables | Yes | No |
| Reactive | Yes | Yes |
| Hot module replacement | No | Yes |
| Non-primitive JS types | No | Yes |

**Use runtimeConfig** for secrets and values that change per environment.
**Use app.config** for public tokens, theme settings, and non-sensitive config.

## External Tool Configuration

Nuxt uses `nuxt.config.ts` as single source of truth. Configure external tools within it:

```ts
export default defineNuxtConfig({
  // Nitro configuration
  nitro: {
    // nitro options
  },
  // Vite configuration
  vite: {
    // vite options
    vue: {
      // @vitejs/plugin-vue options
    },
  },
  // PostCSS configuration
  postcss: {
    // postcss options
  },
})
```

### Environment-specific Vite Config

Top-level `vite` options are shared. Use `$client` and `$server` to target a single Vite build:

```ts
export default defineNuxtConfig({
  vite: {
    $client: {
      build: { rollupOptions: { output: { manualChunks: { analytics: ['analytics-package'] } } } },
    },
    $server: {
      build: { sourcemap: 'inline' },
    },
  },
})
```

## Vue Configuration

Enable Vue experimental features:

```ts
export default defineNuxtConfig({
  vue: {
    propsDestructure: true,
  },
})
```

## Opting into Nuxt 5

Setting `future: { compatibilityVersion: 5 }` changes these defaults on Nuxt 4. Each can also be toggled individually:

| Behavior under `compatibilityVersion: 5` | Individual option |
|------------------------------------------|-------------------|
| Vite Environment API | `experimental.viteEnvironmentApi: true` |
| Case-sensitive page routing (`/About` no longer matches `pages/about.vue`) | — |
| Typed pages (`useRoute`/`navigateTo`/`<NuxtLink>` type-checked) | `experimental.typedPages: true` |
| Page component name = route name | `experimental.normalizePageNames: true` |
| All serializable `definePageMeta` written to route record | `experimental.extractSerializablePageMeta: true` |
| Payload inlined in prerendered HTML | `experimental.payloadExtraction: 'client'` (default `true`) |
| `clearNuxtState` resets to `useState` init value | `experimental.defaults.useState.resetOnClear: true` |
| `await navigateTo()` early-returns from middleware | `experimental.navigateToEarlyReturn: true` |
| `callHook` may return `void` (not always a Promise) | — |
| Client-only SSR placeholder is a comment node, not `<div>` | `experimental.clientNodePlaceholder: true` |
| Reuse builder's file watcher | `experimental.watcher` (default `chokidar-granular`) |
| `$fetch`/`useFetch` typed from generated route types | `experimental.routeTypedFetch: true` |
| Nitro helpers no longer auto-imported in `server/` | `experimental.nitroAutoImports: true` keeps them |
| `useServerHead`/`useServerSeoMeta` no longer auto-imported; `unhead.legacy` ignored | — |
| PostCSS `autoprefixer`/`cssnano` not configured by default | `postcss.plugins` |
| Vue Options API compiled out of client bundle | `vue: { optionsApi: true }` keeps it |
| `noUncheckedSideEffectImports` in generated tsconfig | `typescript.tsConfig.compilerOptions` |

Without the flag, Nuxt 4 keeps its own defaults: case-insensitive routing, untyped pages, Nitro/h3 helpers auto-imported in `server/`, Options API included.

## Other Experimental Flags

Notable opt-in flags under `experimental` (see source for the full list):

```ts
export default defineNuxtConfig({
  experimental: {
    // Stream the HTML shell first, then render body progressively (better TTFB)
    ssrStreaming: true,
    // Type $fetch/useFetch from generated route types (Nuxt 5 behavior)
    routeTypedFetch: true,
    // With routeTypedFetch: reject fetches to paths no server route answers
    strictRouteTypes: true,
    // Respond 404 for unmatched paths without loading the Vue app/plugins/middleware
    early404: true,
    // Default options for core composables/components
    defaults: {
      nuxtLink: { prefetch: true, prefetchOn: { visibility: true } },
      useAsyncData: { deep: true },
    },
  },
})
```

<!-- 
Source references:
- https://nuxt.com/docs/4.x/getting-started/configuration
- https://nuxt.com/docs/4.x/getting-started/upgrade
- https://nuxt.com/docs/4.x/guide/going-further/runtime-config
- https://nuxt.com/docs/4.x/api/nuxt-config
- https://nuxt.com/docs/4.x/guide/going-further/experimental-features
-->
