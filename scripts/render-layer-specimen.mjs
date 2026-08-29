/**
 * Deterministic layer specimen renderer.
 *
 * Draws the canonical nested-layer scene (page → panel → section → popover,
 * each with border, text, muted text, a hover row and a field) straight to a
 * PNG with no browser. Feed it a flat token map; two specimens rendered the
 * same way can be judged side by side with the labels stripped.
 *
 *   node scripts/render-layer-specimen.mjs <tokens.json> <out.png> [--title X]
 *
 * The token map needs: layer-0..3, layer-border-0..3, layer-hover-0..3,
 * text, text-muted, field-bg, field-border.
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, readFileSync } from 'node:fs'

const W = 760
const H = 560

function parseColor(v) {
  v = String(v).trim()
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (m) {
    let h = m[1]
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }
  m = v.match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i,
  )
  if (m) return [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])]
  throw new Error('cannot parse colour: ' + v)
}

const buf = Buffer.alloc(W * H * 3)

function fill(x0, y0, w, h, color) {
  const [r, g, b] = parseColor(color)
  const x1 = Math.min(W, x0 + w),
    y1 = Math.min(H, y0 + h)
  for (let y = Math.max(0, y0); y < y1; y++) {
    for (let x = Math.max(0, x0); x < x1; x++) {
      const i = (y * W + x) * 3
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
    }
  }
}

function stroke(x0, y0, w, h, color, t = 1) {
  fill(x0, y0, w, t, color)
  fill(x0, y0 + h - t, w, t, color)
  fill(x0, y0, t, h, color)
  fill(x0 + w - t, y0, t, h, color)
}

// text is drawn as weighted bars: enough to judge legibility of a colour pair
// against a surface without dragging in a font rasteriser.
function textBar(x, y, w, color, weight = 3) {
  fill(x, y, w, weight, color)
}

function png(out) {
  const raw = Buffer.alloc((W * 3 + 1) * H)
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0
    buf.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3)
  }
  const chunks = []
  const crcTable = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crcTable[n] = c >>> 0
  }
  const crc = (b) => {
    let c = 0xffffffff
    for (const byte of b) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  chunks.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  chunks.push(chunk('IHDR', ihdr))
  chunks.push(chunk('IDAT', deflateSync(raw, { level: 9 })))
  chunks.push(chunk('IEND', Buffer.alloc(0)))
  writeFileSync(out, Buffer.concat(chunks))
}

const [, , tokensPath, outPath] = process.argv
const t = JSON.parse(readFileSync(tokensPath, 'utf8'))
const g = (k) => {
  if (t[k] == null) throw new Error('missing token: ' + k)
  return t[k]
}

// ── scene ───────────────────────────────────────────────────────────────────
// Layer 0: page
fill(0, 0, W, H, g('layer-0'))
textBar(32, 28, 180, g('text'), 5)
textBar(32, 44, 260, g('text-muted'), 3)
// a hover row on layer 0
fill(24, 62, W - 48, 26, g('layer-hover-0'))
textBar(32, 72, 200, g('text-muted'), 3)

// Layer 1: panel
stroke(24, 100, W - 48, H - 130, g('layer-border-1'))
fill(25, 101, W - 50, H - 132, g('layer-1'))
textBar(44, 122, 160, g('text'), 5)
textBar(44, 138, 240, g('text-muted'), 3)
// hover row on layer 1
fill(40, 156, W - 80, 26, g('layer-hover-1'))
textBar(48, 166, 180, g('text-muted'), 3)
// a field on layer 1
stroke(40, 192, 300, 32, g('field-border'))
fill(41, 193, 298, 30, g('field-bg'))
textBar(52, 206, 120, g('text-muted'), 3)

// Layer 2: nested section
stroke(40, 240, W - 80, 220, g('layer-border-2'))
fill(41, 241, W - 82, 218, g('layer-2'))
textBar(60, 262, 140, g('text'), 5)
textBar(60, 278, 220, g('text-muted'), 3)
fill(56, 296, W - 112, 26, g('layer-hover-2'))
textBar(64, 306, 170, g('text-muted'), 3)

// Layer 3: popover on top of layer 2
stroke(56, 332, 360, 112, g('layer-border-3'))
fill(57, 333, 358, 110, g('layer-3'))
textBar(76, 352, 130, g('text'), 5)
textBar(76, 368, 200, g('text-muted'), 3)
fill(72, 386, 328, 26, g('layer-hover-3'))
textBar(80, 396, 150, g('text-muted'), 3)

// A layer-1 sibling sitting directly on layer-1 (the nesting stress case:
// two same-level surfaces stacked must still read as separate objects).
stroke(440, 332, 280, 112, g('layer-border-1'))
fill(441, 333, 278, 110, g('layer-1'))
textBar(460, 352, 120, g('text'), 5)
textBar(460, 368, 180, g('text-muted'), 3)

png(outPath)
console.log('wrote', outPath)
