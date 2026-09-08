import MagicString from 'magic-string'
import { parse, babelParse } from 'vue/compiler-sfc'

/**
 * Makes a hand-written component import behave like an auto-imported one.
 *
 * The library ships one stylesheet per chunk, and the auto-import resolver
 * declares each component's sheets as side effects so the bundler links them
 * next to the component. That only happens for tags the resolver saw. An app
 * that writes its imports by hand:
 *
 * ```ts
 * import { NbButton, NbPanel } from '@nubisco/ui'
 * ```
 *
 * never went through the resolver, so it got no stylesheets at all. With
 * `styles: true` (the default) and the `@nubisco/ui/css` import dropped, as
 * the upgrade guide said to, that shipped an app with no component CSS: every
 * page rendered unstyled, and nothing failed. The CSS bundle still looked
 * plausible, because the app's own styles and the design tokens were still in
 * it.
 *
 * So this plugin gives the same treatment to imports the app wrote itself:
 *
 * 1. A named component imported from the barrel is rewritten to its own entry
 *    point, which is what the resolver would have emitted, and which also
 *    stops the barrel from pulling in every other component.
 * 2. Either way, that component's stylesheets are imported alongside it.
 *
 * Names the manifest does not know (composables, types, `registerIcons`) stay
 * on the barrel import untouched, and a namespace or default import is left
 * alone entirely, since there is no way to tell from it which components the
 * file actually uses.
 */

interface INubiscoImportOptions {
  /** `Nb*` name to entry file, from the component manifest. */
  manifest: Map<string, string>
  /** Which stylesheets each component entry needs. */
  styleManifest: Record<string, string[]>
  /** Inject stylesheets. When false this plugin only rewrites imports. */
  styles: boolean
  packageName: string
  /** Called with the number of components resolved in a file. */
  onResolve: (count: number) => void
}

interface IScriptBlock {
  content: string
  offset: number
}

/** The script of a `.vue` file, or the whole module for a plain script. */
function scriptBlocks(code: string, file: string): IScriptBlock[] {
  if (!file.endsWith('.vue')) return [{ content: code, offset: 0 }]
  const { descriptor, errors } = parse(code, { filename: file })
  if (errors.length) return []
  return [descriptor.script, descriptor.scriptSetup]
    .filter((block): block is NonNullable<typeof block> => Boolean(block))
    .map((block) => ({
      content: block.content,
      offset: block.loc.start.offset,
    }))
}

interface ISpecifier {
  imported: string
  local: string
}

export function nubiscoImports(options: INubiscoImportOptions) {
  const { manifest, styleManifest, styles, packageName, onResolve } = options
  const componentPrefix = `${packageName}/components/`

  return {
    name: 'nubisco-ui:imports',
    enforce: 'pre' as const,

    transform(code: string, id: string) {
      const file = id.split('?')[0]
      if (file.includes('/node_modules/')) return
      if (!/\.(vue|[cm]?[jt]sx?)$/.test(file)) return
      if (!code.includes(packageName)) return

      const magic = new MagicString(code)
      const sheetsSeen = new Set<string>()
      let resolved = 0
      let changed = false

      // Stylesheets are appended after the import they belong to, so they
      // land in the consumer's module graph in the order the resolver would
      // have produced.
      const sheetsFor = (entry: string) => {
        if (!styles) return ''
        const sheets = (styleManifest[entry] ?? []).filter(
          (sheet) => !sheetsSeen.has(sheet),
        )
        sheets.forEach((sheet) => sheetsSeen.add(sheet))
        return sheets
          .map((sheet) => `\nimport '${packageName}/dist/${sheet}'`)
          .join('')
      }

      for (const block of scriptBlocks(code, file)) {
        let program
        try {
          program = babelParse(block.content, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
          }).program
        } catch {
          // Not parseable on its own: the Vue plugin will report it.
          continue
        }

        for (const node of program.body as any[]) {
          if (node.type !== 'ImportDeclaration') continue
          // `import type { … }` links nothing at runtime, so it needs no
          // stylesheet and must not be rewritten into a value import.
          if (node.importKind === 'type') continue
          const source: string = node.source.value
          const start = block.offset + node.start
          const end = block.offset + node.end

          /* An entry point the app already named: it only needs its styles. */
          if (source.startsWith(componentPrefix)) {
            const entry = source.slice(componentPrefix.length)
            const sheets = sheetsFor(entry)
            resolved += 1
            if (sheets) {
              magic.appendRight(end, sheets)
              changed = true
            }
            continue
          }

          if (source !== packageName) continue

          const components: ISpecifier[] = []
          const rest: string[] = []
          let splittable = true

          for (const specifier of node.specifiers as any[]) {
            if (specifier.type !== 'ImportSpecifier') {
              // A default or namespace import says nothing about which
              // components the file uses, so it stays as it is.
              splittable = false
              break
            }
            const imported: string =
              specifier.imported.name ?? specifier.imported.value
            const local: string = specifier.local.name
            if (specifier.importKind === 'type' || !manifest.has(imported)) {
              rest.push(
                block.content.slice(specifier.start, specifier.end).trim(),
              )
              continue
            }
            components.push({ imported, local })
          }

          if (!splittable || !components.length) continue

          const lines = components.map(({ imported, local }) => {
            const entry = manifest.get(imported) as string
            const binding =
              imported === local ? imported : `${imported} as ${local}`
            return (
              `import { ${binding} } from '${componentPrefix}${entry}'` +
              sheetsFor(entry)
            )
          })
          if (rest.length) {
            lines.push(`import { ${rest.join(', ')} } from '${source}'`)
          }

          resolved += components.length
          magic.overwrite(start, end, lines.join('\n'))
          changed = true
        }
      }

      onResolve(resolved)
      if (!changed) return

      return {
        code: magic.toString(),
        map: magic.generateMap({ hires: true, source: file }),
      }
    },
  }
}
