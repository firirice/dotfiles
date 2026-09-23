// Fetch documentation pages listed in an llms.txt index and track changes by content hash.
//
// Usage: node skills-generator/scripts/fetch-docs.ts <source> [--diff] [--record]
//   --diff    compare fetched pages with the manifest recorded in <output>/GENERATION.md
//   --record  write the fetched manifest to <output>/GENERATION.md

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface SourceMeta {
  index: string
  output: string
  include: string[]
}

interface Page {
  section: string
  title: string
  url: string
}

type Manifest = Record<string, string>

const GENERATOR_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_DIR = resolve(GENERATOR_DIR, '..')
const CONCURRENCY = 8

function parseIndex(text: string): Page[] {
  const pages: Page[] = []
  let h2 = ''
  let h3 = ''
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      h2 = line.slice(3).trim()
      h3 = ''
    }
    else if (line.startsWith('### ')) {
      h3 = line.slice(4).trim()
    }
    else {
      // `####` sub-headings are grouped under their `###` parent.
      const m = line.match(/^- \[(.+?)\]\((\S+?)\)/)
      if (m)
        pages.push({ section: `${h2}/${h3}`, title: m[1], url: m[2] })
    }
  }
  return pages
}

function slugOf(url: string): string {
  return new URL(url).pathname.replace(/^\/docs\/[a-z-]+\//, '').replace(/\.md$/, '').replaceAll('/', '__')
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}: ${url}`)
  return res.text()
}

async function readRecordedManifest(generationPath: string): Promise<Manifest | undefined> {
  if (!existsSync(generationPath))
    return undefined
  const m = (await readFile(generationPath, 'utf8')).match(/```json\n([\s\S]*?)\n```/)
  return m ? JSON.parse(m[1]) : undefined
}

function renderGeneration(source: string, meta: SourceMeta, manifest: Manifest): string {
  return `# Generation Info

- Source: ${meta.index}
- Sections: ${meta.include.join(', ')}
- Fetched: ${new Date().toISOString()}
- Pages: ${Object.keys(manifest).length}

Update with \`node skills-generator/scripts/fetch-docs.ts ${source} --diff\` and follow \`skills-generator/CLAUDE.md\`.

## Manifest (url -> sha256)

\`\`\`json
${JSON.stringify(manifest, null, 2)}
\`\`\`
`
}

async function main(): Promise<void> {
  const [source, ...flags] = process.argv.slice(2)
  const metas: Record<string, SourceMeta> = JSON.parse(await readFile(join(GENERATOR_DIR, 'meta.json'), 'utf8'))
  const meta = source ? metas[source] : undefined
  if (!source || !meta) {
    console.error(`Usage: fetch-docs.ts <${Object.keys(metas).join('|')}> [--diff] [--record]`)
    process.exit(1)
  }

  const allPages = parseIndex(await fetchText(meta.index))
  const pages = allPages.filter(p => meta.include.includes(p.section))
  const unknown = meta.include.filter(s => !allPages.some(p => p.section === s))
  if (unknown.length)
    console.warn(`warn: sections not found in index: ${unknown.join(', ')}`)

  const outDir = join(GENERATOR_DIR, 'sources', source)
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const manifest: Manifest = {}
  const queue = [...pages]
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    for (let page = queue.shift(); page; page = queue.shift()) {
      const body = await fetchText(page.url)
      manifest[page.url] = sha256(body)
      await writeFile(join(outDir, `${slugOf(page.url)}.md`), `<!-- ${page.section} | ${page.url} -->\n\n${body}`)
    }
  }))

  const sorted: Manifest = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
  await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(sorted, null, 2)}\n`)
  console.log(`fetched ${pages.length} pages into ${outDir}`)

  const generationPath = join(REPO_DIR, meta.output, 'GENERATION.md')

  if (flags.includes('--diff')) {
    const recorded = await readRecordedManifest(generationPath)
    if (!recorded) {
      console.log('no recorded manifest; every page is new')
    }
    else {
      const added = Object.keys(sorted).filter(u => !(u in recorded))
      const removed = Object.keys(recorded).filter(u => !(u in sorted))
      const changed = Object.keys(sorted).filter(u => u in recorded && recorded[u] !== sorted[u])
      if (!added.length && !removed.length && !changed.length)
        console.log('no changes')
      for (const [label, urls] of [['added', added], ['changed', changed], ['removed', removed]] as const) {
        for (const u of urls)
          console.log(`${label}: ${u} -> sources/${source}/${slugOf(u)}.md`)
      }
    }
  }

  if (flags.includes('--record')) {
    await mkdir(dirname(generationPath), { recursive: true })
    await writeFile(generationPath, renderGeneration(source, meta, sorted))
    console.log(`recorded manifest to ${generationPath}`)
  }
}

await main()
