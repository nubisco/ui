import fs from 'fs'
import { resolve as resolver } from 'path'
import type { Plugin } from 'vite'
import str2kebab from '../utils/str2kebab.helper.ts'
import kebab2camel from '../utils/kebab2camel.helper.ts'

// Inline type helper to avoid esbuild resolution issues during config loading
const VitePlugin = <T extends Plugin>(p: T): Plugin & T => p

const virtualModuleId = 'virtual:flags'
const resolvedVirtualModuleId = '\0' + virtualModuleId

export const flags = (basePath: string) =>
  VitePlugin({
    name: 'flags',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id !== resolvedVirtualModuleId) return
      const result = [`import { defineAsyncComponent } from 'vue'\n`]
      const names: string[] = []
      const flagsDir = resolver(basePath, 'src/assets/flags')
      if (!fs.existsSync(flagsDir)) {
        return `export default {}`
      }
      fs.readdirSync(flagsDir)
        .filter((file) => file !== 'index.js')
        .filter((file) => file.toLowerCase().endsWith('.svg'))
        .map((file) => {
          const [fileName] = file.split('.')
          return fileName
        })
        .forEach((file) => {
          const varName = kebab2camel(str2kebab(`f-${file}`))
          result.push(
            `const ${varName} = defineAsyncComponent(() => import('@/assets/flags/${file}.svg'))`,
          )
          names.push(varName)
        })

      result.push(`\nexport default {\n${names.join(',\n')}\n}`)
      return result.join('\n')
    },
  })
