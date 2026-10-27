<template>
  <DefaultLayout>
    <!--
      The site-wide colour-mode and appearance switches.

      `nav-bar-content-after` is used rather than a bespoke bar so the controls
      sit in the header VitePress already renders, on every page, including
      pages that declare their own `layout:` in frontmatter. A custom layout
      replaces the page content, not the chrome around it.
    -->
    <template #nav-bar-content-after>
      <DocsControls />
    </template>

    <!--
      The left navigation. VitePress's own group list is hidden in
      custom.css and this one renders from the same sidebar config, with a
      filter box and collapsible groups.
    -->
    <template #sidebar-nav-before>
      <DocsSidebarNav />
    </template>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import DocsControls from './components/DocsControls.vue'
import DocsSidebarNav from './components/DocsSidebarNav.vue'

const DefaultLayout = DefaultTheme.Layout
</script>
