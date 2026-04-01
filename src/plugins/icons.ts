import type { Plugin } from 'vite'
import path from 'path'
import { createRequire } from 'module'

// Inline type helper to avoid esbuild resolution issues during config loading
const VitePlugin = <T extends Plugin>(p: T): Plugin & T => p

const virtualModuleId = 'virtual:icons'
const resolvedVirtualModuleId = '\0' + virtualModuleId

const WEIGHTS = ['bold', 'duotone', 'fill', 'light', 'regular', 'thin'] as const

export const icons = () =>
  VitePlugin({
    name: 'icons',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const _require = createRequire(import.meta.url)
        const { icons: phosphorIcons } = _require('@phosphor-icons/core')

        const phosphorAssetsPath = path.resolve(
          process.cwd(),
          'node_modules/@phosphor-icons/core/assets',
        )

        const lines: string[] = ['import { defineAsyncComponent } from "vue"']
        const iconVariables: Record<string, Record<string, string>> = {}
        const catalogEntries: string[] = []

        phosphorIcons.forEach(
          (icon: {
            name: string
            pascal_name: string
            tags: string[]
            categories: string[]
          }) => {
            const iconKey = `i${icon.pascal_name}`
            iconVariables[iconKey] = {}

            WEIGHTS.forEach((weight) => {
              const varName = `${iconKey}_${weight}`
              const filename =
                weight === 'regular'
                  ? `${icon.name}.svg`
                  : `${icon.name}-${weight}.svg`
              const filePath = path.resolve(
                phosphorAssetsPath,
                weight,
                filename,
              )
              lines.push(
                `const ${varName} = defineAsyncComponent(() => import("${filePath}"))`,
              )
              iconVariables[iconKey][weight] = varName
            })

            // Strip meta-tags (wrapped in asterisks like *new*, *updated*)
            const tags = icon.tags.filter((t: string) => !t.startsWith('*'))
            catalogEntries.push(
              `  "${iconKey}": { name: ${JSON.stringify(icon.name)}, tags: ${JSON.stringify(tags)}, categories: ${JSON.stringify([...icon.categories])} }`,
            )
          },
        )

        // Named export: static metadata for each icon (name, tags, categories)
        lines.push(`\nexport const catalog = {`)
        lines.push(catalogEntries.join(',\n'))
        lines.push(`}`)

        // Default export: component map
        const componentEntries = Object.entries(iconVariables).map(
          ([iconKey, weights]) => {
            const weightLines = Object.entries(weights)
              .map(([weight, varName]) => `    "${weight}": ${varName}`)
              .join(',\n')
            return `  "${iconKey}": {\n${weightLines}\n  }`
          },
        )

        lines.push(`\nexport default {`)
        lines.push(componentEntries.join(',\n'))
        lines.push(`}`)

        return lines.join('\n')
      }
    },
  })
