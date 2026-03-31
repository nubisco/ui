#!/usr/bin/env node
/**
 * Prebuild script: Generate a static icon registry
 * Run this once when icons change, cuts build time from 50s to ~10s
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const baseDir = path.resolve(__dirname, '..')
const iconsDir = path.resolve(baseDir, 'src/assets/icons')
const outputFile = path.resolve(baseDir, 'src/generated/icon-registry.json')

const WEIGHT_SUFFIXES = {
  '-thin': 'thin',
  '-light': 'light',
  '-bold': 'bold',
  '-fill': 'fill',
  '-duotone': 'duotone',
}

function parseIconMeta(filename) {
  let baseName = filename.replace('.svg', '')
  let weight = 'regular'

  for (const [suffix, w] of Object.entries(WEIGHT_SUFFIXES)) {
    if (baseName.endsWith(suffix)) {
      weight = w
      baseName = baseName.replace(suffix, '')
      break
    }
  }

  return { baseName, weight, filename }
}

function kebab2camel(str) {
  return str.replace(/-./g, (x) => x[1].toUpperCase())
}

// Ensure output directory exists
const outputDir = path.dirname(outputFile)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Read all SVG files
const files = fs
  .readdirSync(iconsDir)
  .filter((file) => file !== 'index.js' && file.toLowerCase().endsWith('.svg'))

console.log(`Found ${files.length} icon files`)

// Group by base name and weight
const iconRegistry = {}

files.forEach((filename) => {
  const { baseName, weight } = parseIconMeta(filename)
  const sanitizedBaseName = baseName.replace(/\s+/g, '-')
  const varName = kebab2camel(`i-${sanitizedBaseName}`)

  if (!iconRegistry[varName]) {
    iconRegistry[varName] = {}
  }

  iconRegistry[varName][weight] = filename
})

// Write registry
fs.writeFileSync(outputFile, JSON.stringify(iconRegistry, null, 2))
console.log(`✓ Generated icon registry: ${outputFile}`)
console.log(`  ${Object.keys(iconRegistry).length} unique icons`)
