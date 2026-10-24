---
name: routing
description: File-based routing, dynamic routes, navigation, and middleware in Nuxt
---

# Routing

Nuxt uses file-system routing based on vue-router. Files in `app/pages/` automatically create routes.

## Opt-in Routing Features (Nuxt 5 Behavior)

On Nuxt 4 these are **off** by default; `future.compatibilityVersion: 5` turns them all on:

- **Typed pages** (`experimental.typedPages: true`) — `useRoute('route-name')`, `navigateTo`, `<NuxtLink :to>`, and `router.push` are type-checked against your real routes.
- **Case-sensitive matching** — `/About` no longer matches `pages/about.vue` (Nuxt 4 default is case-insensitive).
- **Normalized page component names** (`experimental.normalizePageNames: true`) — a page is named after its route, not its filename (`pages/foo/index.vue` → `foo`, not `index`), so `<KeepAlive :include>` filtering by name is reliable.
- **Serializable page meta extracted at build time** (`experimental.extractSerializablePageMeta: true`) — every JSON-serializable `definePageMeta()` property is written into the generated route record.

## Basic Routing

```
pages/
├── index.vue      → /
├── about.vue      → /about
└── posts/
    ├── index.vue  → /posts
    └── [id].vue   → /posts/:id
```

## Dynamic Routes

Use brackets for dynamic segments:

```
pages/
├── users/
│   └── [id].vue       → /users/:id
├── posts/
│   └── [...slug].vue  → /posts/* (catch-all)
└── [[optional]].vue   → /:optional? (optional param)
```

Access route parameters:

```vue
<script setup lang="ts">
const route = useRoute()
// /posts/123 → route.params.id = '123'
console.log(route.params.id)
</script>
```

## Navigation

### NuxtLink Component

```vue
<template>
  <nav>
    <NuxtLink to="/">Home</NuxtLink>
    <NuxtLink to="/about">About</NuxtLink>
    <NuxtLink :to="{ name: 'posts-id', params: { id: 1 } }">Post 1</NuxtLink>
  </nav>
</template>
```

NuxtLink automatically prefetches linked pages when they enter the viewport.

### Programmatic Navigation

```vue
<script setup lang="ts">
const router = useRouter()

function goToPost(id: number) {
  navigateTo(`/posts/${id}`)
  // or
  router.push({ name: 'posts-id', params: { id } })
}
</script>
```

## Route Middleware

### Named Middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const isAuthenticated = false // Your auth logic

  if (!isAuthenticated) {
    return navigateTo('/login')
  }
})
```

Apply to pages:

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  // or multiple: middleware: ['auth', 'admin']
})
</script>
```

### Global Middleware

Name files with `.global` suffix:

```ts
// middleware/logging.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  console.log('Navigating to:', to.path)
})
```

### Inline Middleware

```vue
<script setup lang="ts">
definePageMeta({
  middleware: [
    function (to, from) {
      // Inline middleware logic
    },
  ],
})
</script>
```

## Page Meta

Configure page-level options:

```vue
<script setup lang="ts">
definePageMeta({
  title: 'My Page',
  layout: 'custom',
  middleware: 'auth',
  validate: (route) => {
    // Return false for 404, or object with status/statusText
    return /^\d+$/.test(route.params.id as string)
  },
})
</script>
```

## Route Validation

```vue
<script setup lang="ts">
definePageMeta({
  validate: (route) => {
    // Must return boolean or object with status
    return typeof route.params.id === 'string' && /^\d+$/.test(route.params.id)
  },
})
</script>
```

## Layouts

Define layouts in `app/layouts/`:

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <header>Header</header>
    <slot />
    <footer>Footer</footer>
  </div>
</template>
```

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="admin">
    <AdminSidebar />
    <main>
      <slot />
    </main>
  </div>
</template>
```

Use in pages:

```vue
<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})
</script>
```

Dynamic layout:

```vue
<script setup lang="ts">
const layout = ref('default')

function enableAdmin() {
  setPageLayout('admin')
}
</script>
```

### Passing Props to Layouts (Nuxt 4.4+)

Use the object syntax for `layout` to pass typed props to the layout component:

```vue
<!-- app/pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  layout: { name: 'panel', props: { sidebar: true, title: 'Dashboard' } },
})
</script>
```

```vue
<!-- app/layouts/panel.vue -->
<script setup lang="ts">
const props = defineProps<{ sidebar?: boolean, title?: string }>()
</script>
```

Props are fully typed from the layout's `defineProps`. Also works dynamically: `setPageLayout('panel', { sidebar: true })`.

## Named Views

A route can render into multiple `<NuxtPage>` outlets. Add named view files with the `name@view.vue` convention next to the default route file:

```
pages/
├── parent.vue
└── parent/
    ├── child.vue           → default <NuxtPage />
    └── child@sidebar.vue   → <NuxtPage name="sidebar" />
```

```vue
<!-- pages/parent.vue -->
<template>
  <NuxtPage />
  <aside><NuxtPage name="sidebar" /></aside>
</template>
```

`definePageMeta` is read from the default route file only.

## Navigation Hooks

```vue
<script setup lang="ts">
onBeforeRouteLeave((to, from) => {
  // Confirm before leaving
  const answer = window.confirm('Leave?')
  if (!answer) return false
})

onBeforeRouteUpdate((to, from) => {
  // Called when route changes but component is reused
})
</script>
```

<!-- 
Source references:
- https://nuxt.com/docs/4.x/getting-started/routing
- https://nuxt.com/docs/4.x/directory-structure/app/pages
- https://nuxt.com/docs/4.x/directory-structure/app/middleware
- https://nuxt.com/docs/4.x/api/utils/define-page-meta
- https://nuxt.com/docs/4.x/getting-started/upgrade
-->
