---
name: server-routes
description: API routes, server middleware, and Nitro server engine in Nuxt
---

# Server Routes

Nuxt includes the Nitro server engine for building full-stack applications with API routes and server middleware. Nuxt 4 runs on **Nitro v2** (`nitropack`, built on h3 v1).

## Two Import Styles

Server code in Nuxt 4 can be written two ways. Pick one per handler and don't mix them.

| Style | How | When |
|---|---|---|
| **h3 auto-imports** (default) | `defineEventHandler`, `getQuery`, `readBody`, … are auto-imported in `server/` | Existing code, or when you need h3-only helpers |
| **`nuxt/server`** (Nuxt 4.6+) | `import { defineEventHandler, getQuery } from 'nuxt/server'` | New code that should survive the move to Nuxt 5 / Nitro v3 unchanged |

```ts
// server/api/hello.ts — h3 auto-imports (no import line)
export default defineEventHandler((event) => {
  const { name } = getQuery(event)
  return { message: `Hello, ${name ?? 'world'}!` }
})
```

```ts
// server/api/hello.ts — nuxt/server (4.6+, portable to Nuxt 5)
import { defineEventHandler, getQuery } from 'nuxt/server'

export default defineEventHandler((event) => {
  const { name } = getQuery<{ name?: string }>(event)
  return { message: `Hello, ${name ?? 'world'}!` }
})
```

Rules when using `nuxt/server`:

- Its names are **not** auto-imported. The auto-imported names of the same spelling are h3's own helpers, which take the h3 event and behave differently (`defineEventHandler`, `handleCors`, `getRouterParams`, `readValidatedBody` among them). Import **every** helper explicitly, `defineEventHandler` included — the `nuxt/server` helpers read the event that its `defineEventHandler` hands them.
- For h3-only helpers (`readRawBody`, `readMultipartFormData`, `assertMethod`, `proxyRequest`, `sendStream`, `event.node`, `event.waitUntil()`), import `defineEventHandler` from `h3` for that handler instead.
- Nitro APIs (`useStorage`, `defineCachedEventHandler`, `defineCachedFunction`, `defineNitroPlugin`, tasks) come from `nitropack/runtime` (or stay auto-imported).
- Never import `nuxt/server` from Vue components, app plugins, `shared/`, `nuxt.config.ts` or a module's `setup` — the build fails or the helpers return empty values.
- Your own exports from `server/utils/` and `shared/utils/` are auto-imported in both styles.

### Behavior Differences: h3 v1 vs `nuxt/server`

Same names, different behavior. Check this table when converting a handler:

| h3 v1 (auto-import) | `nuxt/server` |
|---|---|
| `sendRedirect(event, to)` sends the response | Returns the response: `return sendRedirect(event, '/login')` |
| `getRouterParam(s)` returns decoded values | Returns raw values; pass `{ decode: true }` |
| `handleCors` returns `true` on preflight | Returns the preflight `Response` (or `false`) — return it from the handler |
| `readValidatedBody` / `getValidatedQuery` take a function | Take a Standard Schema or a function |
| `createError({ statusCode, statusMessage })` | `createError({ status, statusText })` |
| `isError(error)` | `isNuxtError(error)` |
| `useRuntimeConfig(event)` | `useRuntimeConfig()` (no per-request form) |
| Global `$fetch` to own routes | `serverFetch(event, path)` (returns a `Response`) |
| `event.path`, `event.node` | `event.url.pathname`, `event.req` / `event.res` |
| `setResponseHeader` & co. | `event.res.headers.set()` / `.append()` / `.delete()` |
| `readMultipartFormData`, `readRawBody` | `event.req.formData()`, `event.req.arrayBuffer()` / `.text()` |

Handlers that import from `h3` or `nitropack/runtime` are tied to Nitro v2 and need revisiting on Nuxt 5; `nuxt/server` handlers do not.

The rest of this file uses h3 auto-imports (the Nuxt 4 default) unless noted.

## API Routes

Create files in `server/api/` directory:

```ts
// server/api/hello.ts
export default defineEventHandler((event) => {
  return { message: 'Hello World' }
})
```

Access at `/api/hello`. The handler can return JSON data, a `Promise`, or use `event.node.res.end()` to send a response. The return type flows to `$fetch('/api/hello')` — annotate the returned value, not the handler.

### HTTP Methods

```ts
// server/api/users.get.ts - GET /api/users
export default defineEventHandler(() => {
  return getUsers()
})

// server/api/users.post.ts - POST /api/users
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return createUser(body)
})

// server/api/users/[id].put.ts - PUT /api/users/:id
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  return updateUser(id, body)
})

// server/api/users/[id].delete.ts - DELETE /api/users/:id
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  return deleteUser(id)
})
```

### Route Parameters

```ts
// server/api/posts/[id].ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  return getPost(id)
})

// Catch-all: server/api/[...path].ts
export default defineEventHandler((event) => {
  const path = getRouterParam(event, 'path')
  return { path }
})
```

### Query Parameters

```ts
// server/api/search.ts
// GET /api/search?q=nuxt&page=1
export default defineEventHandler((event) => {
  const query = getQuery(event)
  // { q: 'nuxt', page: '1' }
  return search(query.q, Number(query.page))
})
```

### Request Body

```ts
// server/api/submit.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  // Validate and process body
  return { success: true, data: body }
})
```

### Headers and Cookies

```ts
// server/api/auth.ts
export default defineEventHandler((event) => {
  // Read a request header
  const auth = getRequestHeader(event, 'authorization')

  // Read a cookie
  const token = getCookie(event, 'token')

  // Set a response header
  setResponseHeader(event, 'X-Custom-Header', 'value')

  // Set a cookie
  setCookie(event, 'token', 'new-token', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24, // 1 day
  })

  return { authenticated: !!token }
})
```

With `nuxt/server`, set headers through the Web `Headers` object instead: `event.res.headers.set('X-Custom-Header', 'value')`.

## Server Middleware

Runs on every request before routes. Middleware should not return anything; only inspect or extend the context, or throw:

```ts
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const token = getCookie(event, 'token')

  // Attach data to event context
  event.context.user = token ? verifyToken(token) : null
})

// server/middleware/log.ts
export default defineEventHandler((event) => {
  console.log(`New request: ${getRequestURL(event)}`)
})
```

Access context in routes:

```ts
// server/api/profile.ts
export default defineEventHandler((event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }
  return user
})
```

## Error Handling

Uncaught errors return `500`. Throw `createError` for other codes. Use `status`/`statusText` (the older `statusCode`/`statusMessage` still work but are the legacy names):

```ts
// server/api/users/[id].ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const user = findUser(id)

  if (!user) {
    throw createError({
      status: 404,
      statusText: 'User not found',
    })
  }

  return user
})
```

- Prefer a short `statusText` for API errors: it reaches the client, while `message` from an API route does not. Put extra payload in `data` (available as `error.value.data.data` in `useFetch`). Never put raw user input in the message.
- Non-error status codes: `setResponseStatus(event, 202)`.

## Runtime Config

Pass the event so environment-variable overrides apply at runtime:

```ts
// server/api/foo.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  return $fetch('https://api.github.com/repos/nuxt/nuxt', {
    headers: { Authorization: `token ${config.githubToken}` },
  })
})
```

## Request Validation

`readValidatedBody` / `getValidatedQuery` validate input. h3's versions take a validator function (works with Zod's `.parse`/`.safeParse`); the `nuxt/server` versions accept any [Standard Schema](https://standardschema.dev) directly:

```ts
// server/api/users.post.ts — h3 auto-import
import { z } from 'zod'

const schema = z.object({ name: z.string() })

export default defineEventHandler(async (event) => {
  const user = await readValidatedBody(event, schema.parse)
  return { created: user.name }
})
```

```ts
// server/api/users.post.ts — nuxt/server (4.6+)
import { defineEventHandler, readValidatedBody } from 'nuxt/server'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const user = await readValidatedBody(event, z.object({ name: z.string() }))
  return { created: user.name }
})
```

With `nuxt/server`, invalid input is rejected with a `400` whose `data.issues` lists the failures.

## Sessions

Two **non-interchangeable** implementations exist:

- **h3** (the auto-imported `useSession`/`getSession`/`updateSession`/`clearSession`): requires a `password` (≥32 chars), cookie name `h3`.
- **`nuxt/server`** (4.6+): no `password` needed — sealed with a secret derived from `appSecret` (`NUXT_APP_SECRET`); cookie name `nuxt-session`. Runs under any server builder.

A session issued by one will not unseal with the other.

```ts
// server/api/visits.ts
import { defineEventHandler, useSession } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const session = await useSession<{ visits: number }>(event)
  await session.update(data => ({ visits: (data.visits ?? 0) + 1 }))
  return { visits: session.data.visits }
})
```

The session lives in the cookie: writing more than 4096 bytes throws. Keep large data server-side and store an id.

## Server Utils

Auto-imported in `server/utils/`:

```ts
// server/utils/db.ts
export function useDb() {
  return createDbConnection()
}
```

```ts
// server/api/users.ts
export default defineEventHandler(() => {
  const db = useDb() // Auto-imported
  return db.query('SELECT * FROM users')
})
```

## Server Plugins

Run once when the server starts. `defineNitroPlugin` is auto-imported (or import from `nitropack/runtime`):

```ts
// server/plugins/db.ts
export default defineNitroPlugin((nitroApp) => {
  // Initialize database connection
  const db = createDbConnection()

  // Add to context
  nitroApp.hooks.hook('request', (event) => {
    event.context.db = db
  })
})
```

Nitro v2 runtime hooks include `request`, `beforeResponse`, `afterResponse`, `error`, and `close`.

## Streaming Responses

Return a stream directly, or use `sendStream`:

```ts
// server/api/file.get.ts
import fs from 'node:fs'

export default defineEventHandler(() => {
  return fs.createReadStream('/path/to/file')
})
```

Server-sent events with a Web `ReadableStream`:

```ts
// server/api/stream.ts
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(`data: ${JSON.stringify({ count: i })}\n\n`)
        await new Promise(r => setTimeout(r, 1000))
      }
      controller.close()
    },
  })

  return stream
})
```

## Server Storage

Key-value storage with multiple drivers. `useStorage` is auto-imported (or import from `nitropack/runtime`):

```ts
// server/api/cache.ts
export default defineEventHandler(async () => {
  const storage = useStorage()

  // Set value
  await storage.setItem('key', { data: 'value' })

  // Get value
  return await storage.getItem('key')
})
```

Configure storage drivers in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      redis: {
        driver: 'redis',
        url: 'redis://localhost:6379',
      },
    },
  },
})
```

<!-- 
Source references:
- https://nuxt.com/docs/4.x/getting-started/server
- https://nuxt.com/docs/4.x/directory-structure/server
- https://nuxt.com/docs/4.x/guide/going-further/server-imports
- https://nuxt.com/docs/4.x/api/utils/create-error
-->
