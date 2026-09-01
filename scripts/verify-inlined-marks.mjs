/**
 * Fail if an inlined brand mark has drifted from its source asset.
 *
 * Each mark ships twice: as a Vue component whose template carries the SVG
 * inline (no network request at runtime, which matters most when the platform
 * is degraded), and as the raw file, for favicons and static HTML. Two copies
 * of one drawing is exactly the arrangement that rots, so this compares the
 * artwork of one against the other and fails the build when they diverge.
 *
 * What is compared is the drawing itself: every path, every gradient stop and
 * offset, and every gradient transform, in document order. What is not
 * compared is presentation the component legitimately changes: gradient ids
 * (scoped per instance so several marks can coexist on a page), width and
 * height (bound to the `size` prop), and the source asset's inner <title>
 * elements (a browser renders those as hover tooltips).
 *
 *   node scripts/verify-inlined-marks.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const MARKS = [
  {
    name: 'Nubisco corporate mark',
    asset: 'src/assets/nubisco-mark.svg',
    component: 'src/components/NubiscoMark.vue',
  },
  {
    name: 'Nubisco Platform mark',
    asset: 'src/assets/nubisco-platform-mark.svg',
    component: 'src/components/NubiscoPlatformMark.vue',
  },
]

const all = (source, re) => [...source.matchAll(re)].map((m) => m[1])

function artwork(source) {
  return {
    paths: all(source, /\sd="([^"]+)"/g),
    stops: all(source, /stop-color="([^"]+)"/g),
    offsets: all(source, /offset="([^"]+)"/g),
    opacities: all(source, /stop-opacity="([^"]+)"/g),
    transforms: all(source, /gradientTransform="([^"]+)"/g),
  }
}

let failed = false

for (const mark of MARKS) {
  const asset = artwork(readFileSync(resolve(ROOT, mark.asset), 'utf8'))
  const component = artwork(readFileSync(resolve(ROOT, mark.component), 'utf8'))

  if (!asset.paths.length) {
    console.error(`verify-inlined-marks: ${mark.asset} has no paths at all`)
    failed = true
    continue
  }

  for (const part of Object.keys(asset)) {
    const a = JSON.stringify(asset[part])
    const b = JSON.stringify(component[part])
    if (a === b) continue
    failed = true
    console.error(
      `verify-inlined-marks: ${mark.name} has drifted.\n` +
        `  ${part} differ between ${mark.asset} and ${mark.component}.\n` +
        `  asset     (${asset[part].length}): ${a.slice(0, 200)}\n` +
        `  component (${component[part].length}): ${b.slice(0, 200)}\n` +
        `  Regenerate the component's template from the asset, or update both.`,
    )
  }
}

if (failed) process.exit(1)

console.log(
  `verify-inlined-marks: OK, ${MARKS.length} inlined mark(s) match their source asset`,
)
