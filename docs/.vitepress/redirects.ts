import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

/**
 * Redirect stubs for the URLs this site used to serve.
 *
 * GitHub Pages cannot issue a 301, so an old path keeps a small HTML file that
 * points at the new one. It carries `rel=canonical` for crawlers, a location
 * assignment for browsers, a meta refresh for anything without script, and a
 * visible link for anything that follows none of them. `replace` rather than
 * `assign` so the dead URL does not end up in the back button.
 *
 * Two moves are covered.
 *
 * 1. The component, composable, directive and labs docs used to live in
 *    `docs/ui/`, under a site whose `base` is already `/ui/`, so they were
 *    published twice-prefixed: `/ui/ui/components/badge.html`. Those links are
 *    on nubisco.io and were being crawled. Temporary: once Search Console
 *    reports the doubled URLs gone, that half can be deleted.
 *
 * 2. Each component page is now split into one route per tab:
 *    `/components/data-table.html` became `/components/data-table/usage.html`,
 *    `/code.html` and `/accessibility.html`. The old page's stub reads the
 *    `#anchor` it was opened with and sends the reader to the tab that now
 *    holds that section, so a deep link to `#props` lands on Code.
 */

/** The directories that moved up one level, relative to `docs/`. */
const MOVED = ['components', 'composables', 'directives', 'labs']

/** The tab routes a split page can have. */
const TABS = ['usage', 'style', 'code', 'accessibility']

/**
 * Split pages whose old file was not simply `<folder>.md`.
 * The rest were `components/x.md` and are now `components/x/`.
 */
const OLD_NAME: Record<string, string> = {
  'components/button': 'components/button/button',
  'components/blueprint': 'components/blueprint/overview',
}

function pagesUnder(root: string, dir: string): string[] {
  const full = join(root, dir)
  const out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(full)
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(full, entry)
    if (statSync(path).isDirectory())
      out.push(...pagesUnder(root, join(dir, entry)))
    else if (entry.endsWith('.md') && !entry.startsWith('_'))
      out.push(relative(root, path))
  }
  return out
}

// VitePress's own heading slug, so the anchors match the rendered ids.
const rCombining = /[̀-ͯ]/g
// eslint-disable-next-line no-control-regex
const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
function slugify(str: string): string {
  return str
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

function headingIds(markdown: string): string[] {
  const ids: string[] = []
  let fence = 0
  for (const line of markdown.split('\n')) {
    const tick = line.match(/^\s*(`{3,})/)
    if (tick) {
      if (!fence) fence = tick[1].length
      else if (tick[1].length >= fence && /^\s*`+\s*$/.test(line)) fence = 0
      continue
    }
    if (fence) continue
    const h = line.match(/^#{2,6}\s+(.*)$/)
    if (!h) continue
    const custom = h[1].match(/\{#([^}]+)\}\s*$/)
    ids.push(
      custom
        ? custom[1]
        : slugify(
            h[1]
              .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
              .replace(/<[^>]+>/g, '')
              .replace(/[`*]/g, ''),
          ),
    )
  }
  return ids
}

interface ISplitPage {
  /** The old page, without extension: `components/data-table`. */
  old: string
  /** The folder that holds its tabs: `components/data-table`. */
  dir: string
  /** Heading id to the tab that now holds it. */
  anchors: Record<string, string>
}

function splitPages(srcDir: string): ISplitPage[] {
  const out: ISplitPage[] = []
  for (const page of pagesUnder(srcDir, 'components')) {
    if (!page.endsWith('/usage.md')) continue
    const dir = dirname(page)
    const anchors: Record<string, string> = {}
    for (const tab of TABS) {
      const file = join(srcDir, dir, `${tab}.md`)
      if (!existsSync(file)) continue
      for (const id of headingIds(readFileSync(file, 'utf8')))
        anchors[id] ??= tab
    }
    out.push({ old: OLD_NAME[dir] ?? dir, dir, anchors })
  }
  return out
}

function stub(target: string, script?: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Moved</title>
    <link rel="canonical" href="${target}" />
    <meta name="robots" content="noindex, follow" />
    <script>${script ?? `location.replace(${JSON.stringify(target)})`}</script>
    <noscript><meta http-equiv="refresh" content="0; url=${target}" /></noscript>
  </head>
  <body>
    <p>This page has moved to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`
}

/** A stub that picks the tab from the anchor it was opened with. */
function tabStub(base: string, page: ISplitPage): string {
  const dirUrl = `${base}${page.dir}/`
  const script =
    `var m=${JSON.stringify(page.anchors)};` +
    `var h=decodeURIComponent(location.hash.slice(1));` +
    `location.replace(${JSON.stringify(dirUrl)}+(m[h]||'usage')+'.html'+location.hash)`
  return stub(`${dirUrl}usage.html`, script)
}

function write(path: string, html: string) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, html)
}

/**
 * Writes the stubs into the built site. Call from VitePress's `buildEnd` with
 * the resolved config. Returns how many it wrote.
 */
export function writeLegacyRedirects(
  outDir: string,
  base: string,
  srcDir: string,
): number {
  let written = 0
  const split = splitPages(srcDir)
  const tabFiles = new Set(
    split.flatMap((p) => TABS.map((t) => join(p.dir, `${t}.md`))),
  )

  // The tab-split pages: the old page, the same path as a folder (an
  // extensionless request can resolve either way), and the doubled path.
  for (const page of split) {
    const html = tabStub(base, page)
    write(join(outDir, `${page.old}.html`), html)
    if (page.old === page.dir) write(join(outDir, page.dir, 'index.html'), html)
    write(join(outDir, 'ui', `${page.old}.html`), html)
    written += page.old === page.dir ? 3 : 2
  }

  // Everything else that moved up a level keeps its single doubled stub.
  for (const dir of MOVED) {
    for (const page of pagesUnder(srcDir, dir)) {
      if (tabFiles.has(page)) continue
      const html = page.replace(/\.md$/, '.html')
      write(join(outDir, 'ui', html), stub(`${base}${html}`))
      written++
    }
  }
  return written
}

export const LEGACY_REDIRECT_ROOT = (outDir: string): string =>
  resolve(outDir, 'ui')
