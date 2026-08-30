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
      // Externalize deps that shouldn't be bundled. `pixi.js` is an
      // optional peer dependency, dynamically imported only by the Blueprint
      // PixiJS renderer, so it must stay external (never bundled): consumers
      // who use that renderer install it themselves.
      external: ['vue', 'fs', 'path', 'vite', 'pixi.js'],
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
    // No sourcemaps in the published build. They were 18,662 files and 46.7 MB
    // of an 80.4 MB tarball, 58% of everything shipped, and npm's ingestion of
    // this package stalled twice at that size (1.60.1 and 2.0.0), each time
    // needing a manual republish. Consumers do not debug through library
    // internals often enough to justify that, and anyone who needs maps can
    // build the library locally, where this flag is the only thing to flip.
    // Vite omits the sourceMappingURL comments too, so nothing dangles.
    sourcemap: false,
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
