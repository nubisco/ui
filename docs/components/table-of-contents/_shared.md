<script setup lang="ts">
import { ref } from 'vue'

const article = ref<HTMLElement | null>(null)
const floatingArticle = ref<HTMLElement | null>(null)

const sections = [
  { id: 'toc-demo-overview', label: 'Overview', level: 2 },
  { id: 'toc-demo-install', label: 'Install', level: 3 },
  { id: 'toc-demo-configure', label: 'Configure', level: 3 },
  { id: 'toc-demo-usage', label: 'Usage', level: 2 },
  { id: 'toc-demo-limits', label: 'Limits', level: 2 },
]

const floatingSections = sections.map((section) => ({
  ...section,
  id: section.id.replace('toc-demo-', 'toc-floating-'),
}))

const filler =
  'A table of contents earns its place on a page long enough to lose your way in. This paragraph is here to give the section some length, so there is something to scroll past.'
</script>

<style scoped>
.toc-demo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14rem;
  gap: 24px;
  width: 100%;
}

.toc-demo--floating {
  position: relative;
  grid-template-columns: minmax(0, 1fr);
}

.toc-demo__article {
  height: 320px;
  overflow-y: auto;
  padding-inline-end: 8px;
}

.toc-demo__heading {
  margin-block: 16px 8px;
  scroll-margin-top: 8px;
}

.toc-demo__heading:first-child {
  margin-block-start: 0;
}

.toc-demo__floating {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 16px;
}
</style>
