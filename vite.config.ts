import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { icons } from './src/plugins/icons'
import { flags } from './src/plugins/flags'
import { fonts } from './src/plugins/fonts'
import { globalTypes } from './src/plugins/globalTypes'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    icons(),
    flags(process.cwd()),
    command === 'serve' ? fonts() : null,
    globalTypes(process.cwd()),
    svgLoader({
      svgoConfig:
        command === 'serve'
          ? {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      convertPathData: false,
                      mergePaths: false,
                    },
                  },
                },
              ],
            }
          : { plugins: [] },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'NubiscoUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['vue', 'fs', 'path', 'vite'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
        // Preserve directory structure for better tree-shaking
        preserveModules: false,
        exports: 'named',
        // Configure CSS filename
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css'
          return assetInfo.name || ''
        },
      },
    },
    // Generate sourcemaps for debugging
    sourcemap: true,
    // Output directory
    outDir: 'dist',
    // Clear output directory before build
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}))
