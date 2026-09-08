import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { fonts } from './src/plugins/fonts'
import { globalTypes } from './src/plugins/globalTypes'
import { nubiscoGlyphs } from './src/plugins/vite/glyphs'
import { COMPONENT_MANIFEST } from './src/components/manifest'
import { resolve } from 'path'
import { readdirSync } from 'fs'
import type { Plugin } from 'vite'

/**
 * One entry per public component, plus the barrel and the escape hatch.
 *
 * The barrel alone is what made the package all-or-nothing: with a single
 * `dist/index.mjs`, importing one component linked the module that contains
 * every component. Rollup hoists whatever those entries share into common
 * chunks, so a consumer that imports two components still downloads the shared
 * internals once.
 */
const entries: Record<string, string> = {
  index: resolve(__dirname, 'src/main.ts'),
  all: resolve(__dirname, 'src/all.ts'),
}
for (const file of Object.values(COMPONENT_MANIFEST)) {
  entries[`components/${file}`] = resolve(
    __dirname,
    `generated/entries/${file}.ts`,
  )
}

// Composables and utilities are entry points too. `exports` used to map both
// subpaths at `./src/`, which `files` does not publish for composables at all,
// so `@nubisco/ui/composables/useTheme.composable` resolved its types and then
// failed on its runtime. These need no wrapper: the source module already has
// the right shape, so it is the entry.
for (const directory of ['composables', 'utils']) {
  for (const file of readdirSync(resolve(__dirname, `src/${directory}`))) {
    if (!file.endsWith('.ts') || file.endsWith('.d.ts')) continue
    const name = file.replace(/\.ts$/, '')
    entries[`${directory}/${name}`] = resolve(
      __dirname,
      `src/${directory}/${file}`,
    )
  }
}

/**
 * Records which stylesheets each component entry actually needs.
 *
 * The library ships one CSS file per chunk rather than a single 214KB
 * stylesheet, so a page can load the styles for the components it renders and
 * nothing else. Which files those are is not knowable from the source: a
 * component's rules may land in its own chunk or in a shared one, depending on
 * what Rollup hoisted. This reads the answer off the finished bundle and writes
 * it next to it, so `@nubisco/ui/vite` can inject exactly those imports
 * alongside the component import.
 *
 * The imports are injected into the consuming app's module graph rather than
 * emitted into the library's own JS. A library module that imports its own CSS
 * breaks any SSR build that externalises the package, because Node then tries
 * to evaluate a `.css` file.
 */
const emitStyleManifest = (): Plugin => ({
  name: 'nubisco-ui:style-manifest',
  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter(
      (output) => output.type === 'chunk',
    )
    const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))

    /** Every stylesheet reachable from a chunk, following shared chunks. */
    const stylesFor = (
      fileName: string,
      seen = new Set<string>(),
    ): string[] => {
      if (seen.has(fileName)) return []
      seen.add(fileName)
      const chunk = byFile.get(fileName)
      if (!chunk) return []
      const own = [
        ...((chunk as { viteMetadata?: { importedCss?: Set<string> } })
          .viteMetadata?.importedCss ?? []),
      ]
      const imported = chunk.imports.flatMap((next) => stylesFor(next, seen))
      return [...imported, ...own]
    }

    const manifest: Record<string, string[]> = {}
    for (const chunk of chunks) {
      if (!chunk.isEntry || !chunk.name.startsWith('components/')) continue
      const styles = [...new Set(stylesFor(chunk.fileName))]
      if (styles.length)
        manifest[chunk.name.replace('components/', '')] = styles
    }

    // Only the ES pass writes it: both formats produce the same stylesheets.
    if (Object.keys(manifest).length && _options.format === 'es') {
      this.emitFile({
        type: 'asset',
        fileName: 'component-styles.json',
        source: JSON.stringify(manifest, null, 2),
      })
    }
  },
})

export default defineConfig(({ command }) => ({
  plugins: [
    // The library dogfoods its own compile-time glyph resolution: a literal
    // `<NbIcon name="check" />` inside a library component links that one icon
    // module, exactly as it does in a consuming app. The imports stay external
    // so they resolve to the published `@nubisco/ui/icons/*` files and dedupe
    // with whatever the app imported.
    nubiscoGlyphs({
      glyphRoot: resolve(__dirname, 'generated'),
      catalog: 'off',
      // Our own `<NbButton :icon="props.icon">` forwards are pass-through by
      // design: the consumer passes a name or a module, and their build is
      // where that resolves.
      warnUnresolved: false,
    }),
    emitStyleManifest(),
    vue(),
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
      entry: entries,
      name: 'NubiscoUI',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    cssCodeSplit: true,
    rollupOptions: {
      // Externalize deps that shouldn't be bundled. `pixi.js` is an
      // optional peer dependency, dynamically imported only by the Blueprint
      // PixiJS renderer, so it must stay external (never bundled): consumers
      // who use that renderer install it themselves.
      //
      // The glyph subpaths are external for a different reason: they are
      // published files with stable paths, and inlining them here would both
      // duplicate artwork the app may already import and destroy the addresses
      // the compile-time plugin emits.
      external: (id: string) =>
        ['vue', 'fs', 'path', 'vite', 'pixi.js'].includes(id) ||
        id.startsWith('@nubisco/ui/icons/') ||
        id.startsWith('@nubisco/ui/flags/'),
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
          const name = assetInfo.name || ''
          // Stylesheets get a directory of their own so that a component's CSS
          // has an addressable, stable path the bundler plugin can import.
          if (name.endsWith('.css')) return `styles/${name}`
          return name
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
