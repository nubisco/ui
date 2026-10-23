/**
 * Inlines the third-party code `@nubisco/ui/vite` and
 * `@nubisco/ui/plugins/fonts` run on into `dist/plugins/vite/vendor.js`,
 * replacing the plain re-export `tsc` emitted.
 *
 * `unplugin-vue-components`, `magic-string` and `unplugin-fonts` are
 * build-time tooling. Listed as dependencies, they put Vite, PostCSS, Sass and
 * the rest of a bundler into the production dependency tree of every app that
 * installs the library, and `pnpm audit --prod` reports all of it. Listed as
 * optional peers they still do: pnpm resolves the peer the app installed under
 * the library, and reports it there. Inlined, they are devDependencies of the
 * library and nothing else.
 *
 * Code a package loads with a dynamic import stays in its own file next to
 * `vendor.js` (`vendor-<name>.js`), so it is read only when that path runs.
 * fontaine's 3.9 MB font metrics table is one: unplugin-fonts loads it only
 * for families that configure `fallback`.
 *
 * Only Node built-ins stay external, plus the optional CommonJS lookups listed
 * below. The script fails if anything else is left outside the bundle, so a new
 * dependency of any of them cannot quietly escape it.
 */
import { build } from 'vite'
import { builtinModules } from 'node:module'
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'dist/plugins/vite')
const bundled = ['unplugin-vue-components', 'magic-string', 'unplugin-fonts']

const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
])

// Chunks from an earlier build would otherwise ship next to the new ones.
for (const file of readdirSync(outDir)) {
  if (/^vendor-.*\.js$/.test(file)) rmSync(path.join(outDir, file))
}

const output = await build({
  configFile: false,
  logLevel: 'warn',
  build: {
    ssr: path.join(root, 'src/plugins/vite/vendor.ts'),
    outDir,
    emptyOutDir: false,
    target: 'node20',
    minify: false,
    sourcemap: false,
    copyPublicDir: false,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'vendor.js',
        chunkFileNames: 'vendor-[name].js',
      },
    },
  },
  ssr: { noExternal: true, target: 'node' },
  resolve: {
    alias: [
      // css-tree (under unplugin-fonts and fontaine) loads its CSS data
      // through createRequire, from JSON files next to it and in mdn-data,
      // which the bundler cannot follow. Its own prebuilt ESM file has that
      // data inlined and the same API. The alias is resolved from each
      // importer, so every importer keeps the css-tree version it declared.
      { find: /^css-tree$/, replacement: 'css-tree/dist/csstree.esm' },
    ],
  },
})

// Every import left in the bundle must be a Node built-in or another of its
// own chunks.
const chunks = (Array.isArray(output) ? output[0] : output).output
const chunkNames = new Set(chunks.map((chunk) => chunk.fileName))
for (const chunk of chunks) {
  const escaped = [...chunk.imports, ...chunk.dynamicImports].filter(
    (name) => !builtins.has(name) && !chunkNames.has(name),
  )
  if (escaped.length) {
    throw new Error(
      `bundle-plugin-vendor: dist/plugins/vite/${chunk.fileName} still imports ${escaped.join(', ')}`,
    )
  }
}

// A CommonJS require made through createRequire is invisible to the bundler,
// so it stays a runtime lookup. Each one must be known to be optional, guarded,
// or on a path Vite never takes.
const optionalRequires = new Set([
  // fdir (under tinyglobby) loads picomatch only for its own glob API, inside
  // a try/catch. tinyglobby brings its own copy, which is bundled.
  'picomatch',
  // unplugin's webpack adapter. Vite never loads it.
  'webpack',
  'webpack-virtual-modules',
])
// Both shapes count: a named require (`require$1('x')`) and one called inline
// (`createRequire(import.meta.url)('x')`). Matches on comment lines are
// examples in a package's documentation, not calls.
const requireCall =
  /\b(?:(?:__)?require(?:\$\d+)?(?:\.resolve)?|createRequire(?:\$\d+)?\(\s*import\.meta\.url\s*\))\(\s*["']([^"']+)["']\s*\)/g
const required = new Set()
let size = 0
for (const { fileName } of chunks) {
  const code = readFileSync(path.join(outDir, fileName), 'utf8')
  size += code.length
  const names = code
    .split('\n')
    .filter((line) => !/^\s*(?:\*|\/\/)/.test(line))
    .flatMap((line) => [...line.matchAll(requireCall)].map((match) => match[1]))
  const unknown = names.filter(
    (name) => !builtins.has(name) && !optionalRequires.has(name),
  )
  if (unknown.length) {
    throw new Error(
      `bundle-plugin-vendor: dist/plugins/vite/${fileName} requires ${[...new Set(unknown)].join(', ')} at runtime`,
    )
  }
  for (const name of names) required.add(name)
}

// The plugins' own modules reach that code only through vendor.js. A direct
// import of a bundled package would bring the dependency back for every
// consumer, so every emitted plugin module and declaration is checked.
const directImport = new RegExp(
  `(?:from|import)\\s*\\(?\\s*['"](?:${bundled.join('|')})(?:/[^'"]*)?['"]`,
)
const pluginsDir = path.join(root, 'dist/plugins')
const pluginFiles = readdirSync(pluginsDir, { recursive: true })
  .map(String)
  .filter((file) => /\.(?:js|d\.ts)$/.test(file))
  .filter((file) => !/^vite[/\\]vendor(?:-[^/\\]+)?\.(?:js|d\.ts)$/.test(file))
for (const file of pluginFiles) {
  const source = readFileSync(path.join(pluginsDir, file), 'utf8')
  if (directImport.test(source)) {
    throw new Error(
      `bundle-plugin-vendor: dist/plugins/${file} imports a bundled package directly. Import it from vite/vendor.js`,
    )
  }
}

// The declaration tsc emitted re-exports the packages by name, which a
// consumer cannot resolve. This module is internal to the plugins, so it only
// needs to stay resolvable, with one exception: `TFontsOptions` in
// `@nubisco/ui/plugins/fonts` is derived from `Unfonts`, so its option types
// ship with the library as `vendor-fonts.d.ts`, copied from the pinned
// `unplugin-fonts`. That file may import only from `vite`, which every
// consumer of these plugins already has.
const fontsTypes = readFileSync(
  path.join(root, 'node_modules/unplugin-fonts/dist/types.d.ts'),
  'utf8',
)
const typeImports = [...fontsTypes.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)].map(
  (match) => match[1],
)
const strayTypeImports = typeImports.filter((name) => name !== 'vite')
if (strayTypeImports.length) {
  throw new Error(
    `bundle-plugin-vendor: unplugin-fonts types import ${strayTypeImports.join(', ')}, which a consumer may not have`,
  )
}
writeFileSync(
  path.join(outDir, 'vendor-fonts.d.ts'),
  `/** Copied from unplugin-fonts at build time. Internal to @nubisco/ui/plugins/fonts. */
${fontsTypes}`,
)
rmSync(path.join(outDir, 'vendor.d.ts.map'), { force: true })
writeFileSync(
  path.join(outDir, 'vendor.d.ts'),
  `/** Internal to @nubisco/ui/vite and @nubisco/ui/plugins/fonts, bundled at build time. Not a public API. */
export declare const Components: (options?: object) => import('vite').Plugin;
export declare const MagicString: new (code: string) => object;
export declare const Unfonts: (
  options?: import('./vendor-fonts').Options,
) => import('vite').Plugin | import('vite').Plugin[];
`,
)

console.log(
  `bundle-plugin-vendor: OK, ${chunks.length} file(s), ${Math.round(size / 1024)}KB, imports only Node built-ins, runtime requires: ${[...required].sort().join(', ') || 'none'}`,
)
