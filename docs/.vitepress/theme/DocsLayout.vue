<template>
  <DefaultLayout>
    <!--
      The site-wide colour-mode and appearance switches.

      `nav-bar-content-after` is used rather than a bespoke bar so the controls
      sit in the header VitePress already renders, on every page, including
      pages that declare their own `layout:` in frontmatter — a custom layout
      replaces the page content, not the chrome around it.
    -->
    <template #nav-bar-content-after>
      <DocsControls />
    </template>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import DocsControls from './components/DocsControls.vue'

const DefaultLayout = DefaultTheme.Layout
</script>
