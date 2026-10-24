---
name: rendering-modes
description: Universal rendering, client-side rendering, and hybrid rendering in Nuxt
---

# Rendering Modes

Nuxt supports multiple rendering modes: universal (SSR), client-side (CSR), and hybrid rendering.

## Universal Rendering (Default)

Server renders HTML, then hydrates on client:

```ts
// nuxt.config.ts - this is the default
export default defineNuxtConfig({
  ssr: true,
})
```

**Benefits:**
- Fast initial page load (HTML is ready)
- SEO-friendly (content is in HTML)
- Works without JavaScript initially

**How it works:**
1. Server executes Vue code, generates HTML
2. Browser displays HTML immediately
3. JavaScript loads and hydrates the page
4. Page becomes fully interactive

## Client-Side Rendering

Render entirely in the browser:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
})
```

**Benefits:**
- Simpler development (no SSR constraints)
- Cheaper hosting (static files only)
- Works offline

**Use cases:**
- Admin dashboards
- SaaS applications
- Apps behind authentication

### SPA Loading Template

Provide loading UI while app hydrates:

```html
<!-- app/spa-loading-template.html -->
<div class="loading">
  <div class="spinner"></div>
  <p>Loading...</p>
</div>

<style>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00dc82;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

## Hybrid Rendering

Mix rendering modes per route using route rules:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // Static pages - prerendered at build
    '/': { prerender: true },
    '/about': { prerender: true },

    // ISR - regenerate in background
    '/blog/**': { isr: 3600 }, // Cache for 1 hour
    '/products/**': { swr: true }, // Stale-while-revalidate

    // Client-only rendering
    '/admin/**': { ssr: false },
    '/dashboard/**': { ssr: false },

    // Server-rendered (default)
    '/api/**': { cors: true },
  },
})
```

### Route Rules Reference

| Rule | Description |
|------|-------------|
| `prerender: true` | Pre-render at build time |
| `ssr: false` | Client-side only |
| `swr: number \| true` | Stale-while-revalidate caching |
| `isr: number \| true` | Incremental static regeneration |
| `cache: { maxAge: number }` | Cache with TTL |
| `redirect: string` | Redirect to another path |
| `cors: true` | Add CORS headers |
| `headers: object` | Custom response headers |
| `proxy: string \| object` | Proxy requests to another URL (`'/proxy/**': { proxy: 'https://api.example.com/**' }`) |
| `noScripts: true` | Disable Nuxt scripts and JS resource hints |
| `appMiddleware` | Enable/disable app (Vue) middleware for matching paths |

Redirect with a custom code: `redirect: { to: '/new-page', statusCode: 302 }` (Nitro v2 field name; Nitro v3 in Nuxt 5 renames it to `status`).

### Inline Route Rules

Define per-page:

```vue
<script setup lang="ts">
defineRouteRules({
  prerender: true,
})
</script>
```

## Prerendering

Generate static HTML at build time:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // Prerender specific routes
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/posts/*': { prerender: true },
  },
})
```

Or use `nuxt generate`:

```bash
nuxt generate
```

### Payload Extraction & SPA Fallbacks

- `experimental.payloadExtraction` defaults to `true`: prerendered pages write a `_payload.json` fetched on client navigation. `'client'` (default with `compatibilityVersion: 5`) inlines the payload in the HTML for the initial render and only fetches `_payload.json` during client-side navigation. Forced to `false` when `ssr: false`.
- `nuxt generate` / `nuxt build --prerender` emit SPA fallbacks into `.output/public/`: **`200.html`** (client router handles unmatched paths) and **`404.html`** (keep 404 status + load app). A plain `nuxt build` does not. Skip any of them with Nitro's `prerender:generate` hook.
- **Prerender the error page** with `experimental.prerenderErrorPages: true` (or `[404, 500]`) — Nuxt renders `error.vue` at build time into `404.html`. Because one file serves every missing path, guard request-specific data with `import.meta.prerender` and wrap request-specific markup in `<ClientOnly>`.
- With `ssr: false`, put a loading screen in `app/spa-loading-template.html` (shown until the app is ready).

### Programmatic Prerendering

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  hooks: {
    'prerender:routes'({ routes }) {
      // Add dynamic routes
      const posts = await fetchPostSlugs()
      for (const slug of posts) {
        routes.add(`/posts/${slug}`)
      }
    },
  },
})
```

Or in pages:

```ts
// server/api/posts.ts or a plugin
prerenderRoutes(['/posts/1', '/posts/2', '/posts/3'])
```

## Edge-Side Rendering

Render at CDN edge servers:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages', // or 'vercel-edge', 'netlify-edge'
  },
})
```

Supported platforms:
- Cloudflare Pages/Workers
- Vercel Edge Functions
- Netlify Edge Functions

## Conditional Rendering

Use `import.meta.server` and `import.meta.client`:

```vue
<script setup>
if (import.meta.server) {
  // Server-only code
  console.log('Running on server')
}

if (import.meta.client) {
  // Client-only code
  console.log('Running in browser')
}
</script>
```

For components:

```vue
<template>
  <ClientOnly>
    <BrowserOnlyComponent />
    <template #fallback>
      <p>Loading...</p>
    </template>
  </ClientOnly>
</template>
```

<!-- 
Source references:
- https://nuxt.com/docs/4.x/guide/concepts/rendering
- https://nuxt.com/docs/4.x/getting-started/prerendering
- https://nuxt.com/docs/4.x/api/nuxt-config#routerules
-->
