import { writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

/**
 * Redirect stubs for the URLs this site used to serve.
 *
 * The component, composable, directive and labs docs used to live in
 * `docs/ui/`, under a site whose `base` is already `/ui/`, so every one of them
 * was published twice-prefixed: `/ui/ui/components/badge.html`. They have moved
 * up a level and are now served where the sidebar always said they were,
 * `/ui/components/badge.html`.
 *
 * GitHub Pages cannot issue a 301, so the old paths keep a small HTML file that
 * points at the new one. It carries `rel=canonical` for crawlers, a meta
 * refresh and a location assignment for browsers, and a visible link for
 * anything that runs neither. `replace` rather than `assign` so the dead URL
 * does not end up in the back button.
 *
 * These exist because the old URLs are linked from nubisco.io and were being
 * crawled. They are not permanent: once Search Console reports the doubled URLs
 * gone and the referring links are updated, this whole step can be deleted.
 */

/** The directories that moved up one level, relative to `docs/`. */
const MOVED = ['components', 'composables', 'directives', 'labs']

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
    else if (entry.endsWith('.md'))
      out.push(relative(root, path).replace(/\.md$/, '.html'))
  }
  return out
}

function stub(target: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Moved</title>
    <link rel="canonical" href="${target}" />
    <meta name="robots" content="noindex, follow" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <script>location.replace(${JSON.stringify(target)})</script>
  </head>
  <body>
    <p>This page has moved to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`
}

/**
 * Writes one stub per moved page into the built site, at the old doubled path.
 * Call from VitePress's `buildEnd` with the resolved config.
 */
export function writeLegacyRedirects(
  outDir: string,
  base: string,
  srcDir: string,
): number {
  let written = 0
  for (const dir of MOVED) {
    for (const page of pagesUnder(srcDir, dir)) {
      // The old path repeated the base's own segment: /ui/ + ui/components/x.html
      const oldPath = join(outDir, 'ui', page)
      const target = `${base}${page}`
      mkdirSync(dirname(oldPath), { recursive: true })
      writeFileSync(oldPath, stub(target))
      written++
    }
  }
  return written
}

export const LEGACY_REDIRECT_ROOT = (outDir: string): string =>
  resolve(outDir, 'ui')
