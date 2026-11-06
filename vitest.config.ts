import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { nubiscoGlyphs } from './src/plugins/vite/glyphs'

export default defineConfig({
  // The tests exercise the same compile-time glyph resolution the build uses,
  // so a component that renders `<NbIcon name="check" />` is tested with the
  // module the plugin links rather than with a stub the build never sees.
  plugins: [
    nubiscoGlyphs({
      glyphRoot: resolve(__dirname, 'generated'),
      catalog: 'off',
    }),
    vue(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@nubisco/ui/icons': resolve(__dirname, 'generated/icons'),
      '@nubisco/ui/flags': resolve(__dirname, 'generated/flags'),
      // Tests compile the theme through the pure-JS compiler. With the whole
      // suite in parallel, several embedded-Sass child processes at once
      // corrupted their message channel ("size is out of range") in a
      // different contrast file on each run. Same version, same API, no child
      // process. The build and the docs keep the embedded compiler.
      'sass-embedded': 'sass',
    },
  },
  test: {
    root: '.',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    globals: true,
    passWithNoTests: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.d.ts'],
    },
  },
})
