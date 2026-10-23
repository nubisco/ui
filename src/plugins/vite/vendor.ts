/**
 * The third-party code `@nubisco/ui/vite` runs on, in one module.
 *
 * Both packages are build-time tooling. As dependencies of the library they
 * put Vite, PostCSS, Sass and the rest of a bundler into the production
 * dependency tree of every app that installs `@nubisco/ui`, and declaring them
 * as optional peers does not help, because pnpm resolves an optional peer the
 * consumer has installed under the library and reports it there.
 *
 * So the library build inlines this module, with everything it imports, into
 * `dist/plugins/vite/vendor.js` (see `scripts/bundle-plugin-vendor.mjs`). The
 * packages stay devDependencies of the library and never reach a consumer's
 * dependency tree. In the source tree, and in tests, this is a plain re-export.
 */
export { default as Components } from 'unplugin-vue-components/vite'
export { default as MagicString } from 'magic-string'
