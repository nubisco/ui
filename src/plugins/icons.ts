import type { Plugin } from 'vite'
import iconRegistry from '../generated/icon-registry.json'

// Inline type helper to avoid esbuild resolution issues during config loading
const VitePlugin = <T extends Plugin>(p: T): Plugin & T => p

const virtualModuleId = 'virtual:icons'
const resolvedVirtualModuleId = '\0' + virtualModuleId

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
        // Generate dynamic imports from prebuilt registry
        const imports: string[] = ['import { defineAsyncComponent } from "vue"']
        const iconVariables: Record<string, Record<string, string>> = {}

        Object.entries(iconRegistry).forEach(([iconName, weights]) => {
          iconVariables[iconName] = {}
          Object.entries(weights).forEach(([weight, filename]) => {
            const varName = `${iconName}_${weight}`
            imports.push(
              `const ${varName} = defineAsyncComponent(() => import("@/assets/icons/${filename}"))`,
            )
            iconVariables[iconName][weight] = varName
          })
        })

        // Build export object
        const exportLines = Object.entries(iconVariables).map(
          ([iconName, weights]) => {
            const weightLines = Object.entries(weights)
              .map(([weight, varName]) => `    "${weight}": ${varName}`)
              .join(',\n')
            return `  "${iconName}": {\n${weightLines}\n  }`
          },
        )

        imports.push(`\nexport default {`)
        imports.push(exportLines.join(',\n'))
        imports.push(`}`)

        return imports.join('\n')
      }
    },
  })
