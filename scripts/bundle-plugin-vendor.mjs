/**
 * Inlines the third-party code `@nubisco/ui/vite` runs on into one file,
 * `dist/plugins/vite/vendor.js`, replacing the plain re-export `tsc` emitted.
 *
 * `unplugin-vue-components` and `magic-string` are build-time tooling. Listed
 * as dependencies, they put Vite, PostCSS, Sass and the rest of a bundler into
 * the production dependency tree of every app that installs the library, and
 * `pnpm audit --prod` reports all of it. Listed as optional peers they still
 * do: pnpm resolves the peer the app installed under the library, and reports
 * it there. Inlined, they are devDependencies of the library and nothing else.
 *
 * Only Node built-ins stay external, plus two optional CommonJS lookups listed
 * below. The script fails if anything else is left outside the bundle, so a new
 * dependency of either package cannot quietly escape it.
 */
import { build } from 'vite'
import { builtinModules } from 'node:module'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'dist/plugins/vite')
const outFile = path.join(outDir, 'vendor.js')

const builtins = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
])

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
        codeSplitting: false,
      },
    },
  },
  ssr: { noExternal: true, target: 'node' },
})

// Every static import left in the bundle must be a Node built-in.
const [chunk] = (Array.isArray(output) ? output[0] : output).output
const escaped = [...chunk.imports, ...chunk.dynamicImports].filter(
  (name) => !builtins.has(name),
)
if (escaped.length) {
  throw new Error(
    `bundle-plugin-vendor: dist/plugins/vite/vendor.js still imports ${escaped.join(', ')}`,
  )
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
const code = readFileSync(outFile, 'utf8')
const required = new Set(
  [
    ...code.matchAll(
      /\b(?:__)?require(?:\$\d+)?(?:\.resolve)?\(\s*["']([^"']+)["']\s*\)/g,
    ),
  ].map((match) => match[1]),
)
const unknown = [...required].filter(
  (name) => !builtins.has(name) && !optionalRequires.has(name),
)
if (unknown.length) {
  throw new Error(
    `bundle-plugin-vendor: dist/plugins/vite/vendor.js requires ${unknown.join(', ')} at runtime`,
  )
}

// The plugin's own modules reach that code only through vendor.js. A direct
// import of either package would bring the dependency back for every consumer.
for (const file of ['index.js', 'glyphs.js', 'imports.js']) {
  const source = readFileSync(path.join(outDir, file), 'utf8')
  if (
    /from ['"](?:unplugin-vue-components|magic-string)(?:\/[^'"]*)?['"]/.test(
      source,
    )
  ) {
    throw new Error(
      `bundle-plugin-vendor: dist/plugins/vite/${file} imports a bundled package directly. Import it from ./vendor.js`,
    )
  }
}

// The declaration tsc emitted re-exports the packages by name, which a
// consumer cannot resolve. This module is internal to `@nubisco/ui/vite`, and
// no public declaration refers to it, so it only needs to stay resolvable.
rmSync(path.join(outDir, 'vendor.d.ts.map'), { force: true })
writeFileSync(
  path.join(outDir, 'vendor.d.ts'),
  `/** Internal to @nubisco/ui/vite, bundled at build time. Not a public API. */
export declare const Components: (options?: object) => import('vite').Plugin;
export declare const MagicString: new (code: string) => object;
`,
)

console.log(
  `bundle-plugin-vendor: OK, ${Math.round(code.length / 1024)}KB, imports only Node built-ins, optional requires: ${[...required].sort().join(', ') || 'none'}`,
)
