import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * Vite plugin that auto-generates src/global.d.ts by scanning src/components/*.vue.
 * Runs at build start and in watch mode so the file is always up to date.
 */
export function globalTypes(basePath: string): Plugin {
  function generate() {
    const componentsDir = path.resolve(basePath, 'src/components')
    const outFile = path.resolve(basePath, 'src/global.d.ts')

    const files = fs
      .readdirSync(componentsDir)
      .filter((f) => f.endsWith('.vue'))
      .sort()

    const imports = files
      .map((f) => {
        const name = f.replace('.vue', '')
        return `import ${name} from './components/${f}'`
      })
      .join('\n')

    const entries = files
      .map((f) => {
        const name = f.replace('.vue', '')
        return `    Nb${name}: typeof ${name}`
      })
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

  return {
    name: 'global-types',
    buildStart() {
      generate()
    },
    configureServer(server) {
      // Regenerate on component add/remove in dev mode
      server.watcher.on('add', (f) => {
        if (f.includes('/components/') && f.endsWith('.vue')) generate()
      })
      server.watcher.on('unlink', (f) => {
        if (f.includes('/components/') && f.endsWith('.vue')) generate()
      })
    },
  }
}
