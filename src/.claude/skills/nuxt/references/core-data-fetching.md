---
name: data-fetching
description: useFetch, useAsyncData, and $fetch for SSR-friendly data fetching
---

# Data Fetching

Nuxt provides composables for SSR-friendly data fetching that prevent double-fetching and handle hydration.

## Overview

- `$fetch` - Basic fetch utility (use for client-side events)
- `useFetch` - SSR-safe wrapper around $fetch (use for component data)
- `useAsyncData` - SSR-safe wrapper for any async function
- `createUseFetch` / `createUseAsyncData` - factories to build typed custom composables with baked-in defaults

### On `await`

`await` does **not** change the server-rendered HTML — SSR always waits for the request and serializes the populated result. What it changes is client behavior:

- **With `await`** (default): setup pauses until data is ready; client-side navigation is blocked until it resolves (user stays put, optionally with `<NuxtLoadingIndicator>`).
- **Without `await`**: setup continues immediately, `data` starts at its default and fills in later; client navigation happens instantly and you handle `status`/`error` yourself.

Prefer the explicit `lazy` option (or `useLazyFetch`/`useLazyAsyncData`) for non-blocking intent. Note: `await`-ing a `lazy` call does **not** block client navigation — drop `lazy` if you want the wait.

## useFetch

Primary composable for fetching data in components:

```vue
<script setup lang="ts">
const { data, status, error, refresh, clear } = await useFetch('/api/posts')
</script>

<template>
  <div v-if="status === 'pending'">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <article v-for="post in data" :key="post.id">
      {{ post.title }}
    </article>
  </div>
</template>
```

### With Options

```ts
const { data } = await useFetch('/api/posts', {
  // Query parameters
  query: { page: 1, limit: 10 },
  // Request body (for POST/PUT)
  body: { title: 'New Post' },
  // HTTP method
  method: 'POST',
  // Only pick specific fields
  pick: ['id', 'title'],
  // Transform response
  transform: (posts) => posts.map(p => ({ ...p, slug: slugify(p.title) })),
  // Custom key for caching
  key: 'posts-list',
  // Don't fetch on server
  server: false,
  // Don't block navigation
  lazy: true,
  // Don't fetch immediately
  immediate: false,
  // Default value
  default: () => [],
})
```

### Reactive Parameters

```vue
<script setup lang="ts">
const page = ref(1)
const { data } = await useFetch('/api/posts', {
  query: { page }, // Automatically refetches when page changes
})
</script>
```

### Computed URL

```vue
<script setup lang="ts">
const id = ref(1)
const { data } = await useFetch(() => `/api/posts/${id.value}`)
// Refetches when id changes
</script>
```

## useAsyncData

For wrapping any async function:

```vue
<script setup lang="ts">
const { data, error } = await useAsyncData('user', () => {
  return myCustomFetch('/user/profile')
})
</script>
```

### Multiple Requests

```vue
<script setup lang="ts">
const { data } = await useAsyncData('cart', async () => {
  const [coupons, offers] = await Promise.all([
    $fetch('/api/coupons'),
    $fetch('/api/offers'),
  ])
  return { coupons, offers }
})
</script>
```

## Custom Fetchers: createUseFetch / createUseAsyncData

Factory macros (Nuxt 4.4+) that produce a fully typed custom composable with pre-defined options. Must be an **exported** declaration inside `app/composables/` (Nuxt injects dedup keys at build time).

```ts
// app/composables/useAPI.ts
export const useAPI = createUseFetch({
  baseURL: 'https://api.nuxt.com',
  // shared interceptors, headers, etc.
  onResponseError({ response }) {
    if (response.status === 401) navigateTo('/login')
  },
})
```

```vue
<script setup lang="ts">
// Same signature/return as useFetch, with defaults applied
const { data } = await useAPI('/modules')
// Caller can still override any option
const { data: other } = await useAPI('/modules', { baseURL: 'https://other.com' })
</script>
```

**Default vs Override mode:**

```ts
// Plain object → options act as DEFAULTS (caller can override)
export const useAPI = createUseFetch({ baseURL: '/api', lazy: true })

// Function → options OVERRIDE caller's (enforce auth/baseURL)
export const useAPI = createUseFetch(callerOptions => ({
  baseURL: 'https://api.nuxt.com', // always enforced
}))
```

Use the **function form** when you need `useNuxtApp()` (called in setup context, not module scope):

```ts
// app/composables/useAPI.ts
export const useAPI = createUseFetch(callerOptions => ({
  $fetch: useNuxtApp().$api as typeof $fetch,
  ...callerOptions,
}))
```

`createUseAsyncData` works identically for wrapping arbitrary async functions:

```ts
// app/composables/useCachedData.ts
export const useCachedData = createUseAsyncData({
  getCachedData(key, nuxtApp) {
    return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
  },
})
```

> Replaces the old "don't await your custom `useFetch` wrapper" caveat — use these factories instead of hand-rolled wrappers.

### Typing a Third-Party API (4.6+)

Pass `routes` (type only, `{} as Routes`) to type responses, query and body of an external API. Paths are matched as written — don't prefix them with `baseURL`:

```ts
// app/composables/usePetStore.ts
import type { DynamicParam, Endpoint } from 'nuxt/app'

interface Pet { id: number, name: string }

interface PetStoreRoutes {
  '/pets': {
    [Endpoint]: {
      GET: { response: Pet[], query: { limit?: number } }
      POST: { response: Pet, body: { name: string } }
    }
    [DynamicParam]: { [Endpoint]: { GET: { response: Pet } } }
  }
}

export const usePetStore = createUseFetch({
  baseURL: 'https://api.example.com',
  routes: {} as PetStoreRoutes,
})
```

### Addons (4.6+)

`defineUseFetchAddon` adds typed custom call-site options, request middleware, and return-value extensions to a `createUseFetch` composable:

```ts
// app/composables/useCustomFetch.ts
const auth = defineUseFetchAddon({
  setup: (options: UseFetchAddonOptions<{ auth?: MaybeRefOrGetter<boolean> }>) => {
    const { token } = useTokenStore()
    options.auth ??= true
    options.onRequest.push(({ options: fetchOptions }) => {
      if (!toValue(options.auth)) return
      fetchOptions.headers.set('Authorization', `Bearer ${token.value}`)
    })
  },
})

export const useCustomFetch = createUseFetch({ addons: [auth] })
// useCustomFetch('/public', { auth: false }) — `auth` is typed
```

- `setup` runs on every call with merged options; returning a function `(asyncData) => ({ ... })` extends the return value.
- `options.middleware.push(async next => ...)` wraps the request (first addon = outermost).
- Custom options are **not** part of the auto key — add `key: options => toValue(options.scope)` (declare `setup` before `key` for inference).
- `useAsyncData`/`useFetch` also accept a `middleware: [(next, { signal }) => ...]` option directly (4.6+). It must be consistent across calls sharing a key.

## Typed Responses

By default, `$fetch` and `useFetch` infer the response type from the matching handler's return type (via Nitro's `InternalApi`):

```ts
// server/api/todos.get.ts
export default defineEventHandler(() => [{ id: '1', title: 'Buy milk' }])
```

```ts
const todos = await $fetch('/api/todos')
//    ^? { id: string, title: string }[]
```

A runtime path or absolute URL is untyped; provide an explicit type: `` $fetch<{ id: string }>(`/api/${x}`) ``.

`query` has a legacy alias `params`; prefer `query` (the alias is removed in Nuxt 5).

### Opt-in: Generated Route Types

`experimental.routeTypedFetch: true` (on with `compatibilityVersion: 5`) switches to Nuxt 5's typing from generated route types:

- A `body`/`query`/`headers` the handler validates is enforced on the call; a method the route doesn't answer is rejected.
- Responses are typed as they arrive over the wire (a returned `Date` is a `string`).
- `params` is no longer accepted.
- A `baseURL` is resolved into the path before matching.
- `experimental.strictRouteTypes: true` makes paths no route answers a type error.
- Hand-written `ServerRoutes` augmentations must use the new `Endpoint` shape (works with the flag on or off):

```ts
// shared/server-routes.d.ts
import type { Endpoint } from 'nuxt/app'

declare module '@nuxt/schema' {
  interface ServerRoutes {
    '/api/hello': {
      [Endpoint]: { GET: { response: { message: string } } }
    }
  }
}
```

## $fetch

For client-side events (form submissions, button clicks):

```vue
<script setup lang="ts">
async function submitForm() {
  const result = await $fetch('/api/submit', {
    method: 'POST',
    body: { name: 'John' },
  })
}
</script>
```

**Important**: Don't use `$fetch` alone in setup for initial data - it will fetch twice (server + client). Use `useFetch` or `useAsyncData` instead.

## Return Values

All composables return:

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Ref<T>` | Fetched data (`undefined` until resolved) |
| `error` | `Ref<Error>` | Error if request failed |
| `status` | `Ref<'idle' \| 'pending' \| 'success' \| 'error'>` | Request status |
| `pending` | `Ref<boolean>` | Whether a request is in progress |
| `refresh` | `() => Promise` | Refetch data |
| `execute` | `() => Promise` | Alias for refresh |
| `clear` | `() => void` | Reset to default/idle and cancel pending requests |

> Prefer `status` over `pending` for fine-grained state. `useFetch` no longer accepts a top-level `timeout` option (still available on `useAsyncData`); use a `cache` option (`'default'`, `'no-store'`, `false`, etc.) for Fetch cache control.

## Lazy Fetching

Don't block navigation:

```vue
<script setup lang="ts">
// Using lazy option
const { data, status } = await useFetch('/api/posts', { lazy: true })

// Or use lazy variants
const { data, status } = await useLazyFetch('/api/posts')
const { data, status } = await useLazyAsyncData('key', fetchFn)
</script>
```

## Refresh & Watch

```vue
<script setup lang="ts">
const category = ref('tech')

const { data, refresh } = await useFetch('/api/posts', {
  query: { category },
  // Auto-refresh when category changes
  watch: [category],
})

// Manual refresh
const refreshData = () => refresh()
</script>
```

## Caching

`useFetch` generates its key from the URL **plus** the fetch options and the call's source location — so two `useFetch('/api/user')` calls in different components have **different** keys and each run their own request. To share data, pass the **same explicit `key`**:

```vue
<script setup lang="ts">
// In component A
const { data } = await useFetch('/api/user', { key: 'current-user' })

// In component B - uses cached data
const { data } = useNuxtData('current-user')
</script>
```

Refresh cached data globally:

```ts
// Refresh specific key
await refreshNuxtData('current-user')

// Refresh all data
await refreshNuxtData()

// Clear cached data
clearNuxtData('current-user')
```

## Interceptors

```ts
const { data } = await useFetch('/api/auth', {
  onRequest({ options }) {
    options.headers.set('Authorization', `Bearer ${token}`)
  },
  onRequestError({ error }) {
    console.error('Request failed:', error)
  },
  onResponse({ response }) {
    // Process response
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      navigateTo('/login')
    }
  },
})
```

## Passing Headers (SSR)

`useFetch` automatically proxies cookies/headers from client to server. For `$fetch`:

```vue
<script setup lang="ts">
const headers = useRequestHeaders(['cookie'])
const data = await $fetch('/api/user', { headers })
</script>
```

<!-- 
Source references:
- https://nuxt.com/docs/4.x/getting-started/data-fetching
- https://nuxt.com/docs/4.x/api/composables/use-fetch
- https://nuxt.com/docs/4.x/api/composables/use-async-data
- https://nuxt.com/docs/4.x/api/composables/create-use-fetch
- https://nuxt.com/docs/4.x/api/composables/create-use-async-data
- https://nuxt.com/docs/4.x/guide/recipes/custom-usefetch
-->
