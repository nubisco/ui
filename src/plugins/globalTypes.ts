import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * Vite plugin that auto-generates src/global.d.ts by scanning src/components/*.vue.
 * Runs at build start and in watch mode so the file is always up to date.
 */
// Directories under src/components/ that hold internal-only sub-components
// (chart axes, tooltips, etc) and should not be exposed as global components.
const INTERNAL_DIRS = new Set(['shared', 'labs'])

export function globalTypes(basePath: string): Plugin {
  function generate() {
    const componentsDir = path.resolve(basePath, 'src/components')
    const outFile = path.resolve(basePath, 'src/global.d.ts')

    function walk(dir: string, rel = ''): { rel: string; name: string }[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      const out: { rel: string; name: string }[] = []
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (INTERNAL_DIRS.has(entry.name)) continue
          out.push(
            ...walk(path.join(dir, entry.name), path.join(rel, entry.name)),
          )
        } else if (entry.isFile() && entry.name.endsWith('.vue')) {
          out.push({
            rel: path.join(rel, entry.name),
            name: entry.name.replace('.vue', ''),
          })
        }
      }
      return out
    }

    const files = walk(componentsDir).sort((a, b) =>
      a.name.localeCompare(b.name),
    )

    const imports = files
      .map(
        (f) =>
          `import ${f.name} from './components/${f.rel.replace(/\\/g, '/')}'`,
      )
      .join('\n')

    const entries = files
      .map((f) => `    Nb${f.name}: typeof ${f.name}`)
      .join('\n')

    const content = `// AUTO-GENERATED: do not edit by hand
// Re-run the build to update this file when components change
${imports}

declare module 'vue' {
  interface IGlobalComponents {
${entries}
  }
}

export {}
`

    fs.writeFileSync(outFile, content, 'utf8')
    console.log(
      `[globalTypes] wrote src/global.d.ts (${files.length} components)`,
    )
  }

  function isPublicComponent(file: string): boolean {
    if (!file.includes('/components/') || !file.endsWith('.vue')) return false
    return ![...INTERNAL_DIRS].some(
      (d) => file.includes(`/components/${d}/`) || file.includes(`/${d}/`),
    )
  }

  return {
    name: 'global-types',
    buildStart() {
      generate()
    },
    configureServer(server) {
      // Regenerate on component add/remove in dev mode
      server.watcher.on('add', (f) => {
        if (isPublicComponent(f)) generate()
      })
      server.watcher.on('unlink', (f) => {
        if (isPublicComponent(f)) generate()
      })
    },
  }
}
