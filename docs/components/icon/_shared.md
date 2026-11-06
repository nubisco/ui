<script setup lang="ts">
import { ref } from 'vue'
import { catalog } from '@nubisco/ui/icons/catalog'

const copiedIcon = ref<string | null>(null)

function copyName(name: string) {
  navigator.clipboard.writeText(name)
  copiedIcon.value = name
  setTimeout(() => {
    copiedIcon.value = null
  }, 1500)
}
/**
 * Saves the tile's drawing as a file. The tile already renders the icon in
 * the chosen weight, so its own <svg> is the artwork: no second lookup, and
 * what downloads is exactly what is on screen (minus any colour picked in the
 * gallery, since the file keeps currentColor).
 */
function downloadSvg(event: MouseEvent, name: string, weight = 'regular') {
  event.stopPropagation()
  const svg = (event.target as Element | null)
    ?.closest('li')
    ?.querySelector('svg')
  if (!svg) return
  const copy = svg.cloneNode(true) as SVGElement
  copy.removeAttribute('aria-hidden')
  copy.removeAttribute('focusable')
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const blob = new Blob([copy.outerHTML], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = weight === 'regular' ? `${name}.svg` : `${name}-${weight}.svg`
  link.click()
  URL.revokeObjectURL(url)
}
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'

const isDialogOpen = ref(false)

const iconList = Object.values(catalog)

const categoryOptions = [...new Set(iconList.flatMap((icon) => icon.categories))]
  .sort()
  .map((cat) => ({
    label: cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: cat,
  }))

const availableProps: PreviewPropDef[] = [
  {
    label: 'Search',
    name: 'search',
    type: 'string',
    default: '',
    placeholder: 'Search by name',
  },
  {
    label: 'Category',
    name: 'category',
    type: 'single',
    options: categoryOptions,
    default: null,
    placeholder: 'Filter by category',
  },
  {
    label: 'Weight',
    name: 'weight',
    type: 'single',
    options: [
      { label: 'Thin', value: 'thin' },
      { label: 'Light', value: 'light' },
      { label: 'Regular', value: 'regular' },
      { label: 'Bold', value: 'bold' },
      { label: 'Fill', value: 'fill' },
      { label: 'Duotone', value: 'duotone' }
    ],
    default: 'regular',
    placeholder: 'Select one',
  },
  {
    label: 'Color',
    name: 'color',
    type: 'color',
    default: null,
    // Tokens only, the same rule the docs state for `color`.
    options: [
      'var(--nb-c-text-muted)',
      'var(--nb-c-primary)',
      'var(--nb-c-danger)',
      'var(--nb-c-success)',
      'var(--nb-c-info)',
      'var(--nb-c-warning)',
    ],
  },
  {
    label: 'Size',
    name: 'size',
    type: 'slider',
    default: 32,
    placeholder: 'Icon size',
    min: 16,
    max: 128,
  },
]

/**
 * The animation tab: each gesture on the glyph it was drawn for, so the
 * motion reads as the meaning it carries.
 */
const animations = [
  { name: 'refresh', icon: 'arrows-clockwise', loading: true },
  { name: 'cog', icon: 'gear', loading: true },
  { name: 'hourglass', icon: 'hourglass', loading: true },
  { name: 'swing-right', icon: 'hand-waving' },
  { name: 'wobble', icon: 'bell' },
  { name: 'expand', icon: 'arrows-out' },
  { name: 'heart', icon: 'heart' },
  { name: 'undo', icon: 'arrow-counter-clockwise' },
  { name: 'italic', icon: 'text-italic' },
  { name: 'wrench', icon: 'wrench' },
  { name: 'mouse-pointer', icon: 'cursor' },
  { name: 'magic', icon: 'magic-wand' },
  { name: 'lock', icon: 'lock' },
  { name: 'unlock', icon: 'lock-open' },
  { name: 'eraser', icon: 'eraser' },
  { name: 'rocket', icon: 'rocket' },
  { name: 'times', icon: 'x' },
]

const animationsPlaying = ref(true)
</script>

<style lang="scss" scoped>
.animation-demo {
  display: grid;
  list-style-type: none;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1px;
  padding: 0;
  margin: calc(var(--nb-base-unit) * 2) 0 0 0;
  background-color: var(--vp-c-divider);

  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: calc(var(--nb-base-unit) * 1.5);
    height: 120px;
    margin: 0;
    padding: calc(var(--nb-base-unit) * 1.5);
    box-sizing: border-box;
    background: var(--vp-code-block-bg);
  }

  &.paused :deep(.nb-icon) {
    animation-play-state: paused;
  }

  .animation-name {
    font-family: var(--vp-font-family-mono);
    font-size: 12px;
    color: var(--vp-c-text-2);
  }

  .animation-loading {
    color: var(--vp-c-text-3);
  }
}

.icon-demo {
  display: grid;
  list-style-type: none;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1px;
  padding: 0;
  margin: calc(var(--nb-base-unit) * 2) 0 0 0;
  background-color: var(--vp-c-divider);

  li {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100px;
    background: var(--vp-code-block-bg);
    padding: calc(var(--nb-base-unit) * 1.5);
    margin: 0;
    box-sizing: border-box;
    cursor: pointer;
    transition: background 0.1s ease;

    &:hover,
    &.copied {
      background: var(--vp-c-bg-soft);

      .icon-overlay {
        transform: translateY(0);
        opacity: 1;
      }
    }

    &.copied .icon-overlay {
      background: var(--vp-c-bg-soft);

      &::after {
        content: 'Copied!';
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 10px;
        color: var(--vp-c-brand-1);
        font-weight: 600;
      }
    }
  }

  .icon-name {
    font-size: 11px;
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--vp-c-text-2);
    margin: 0;
    padding: 0;
  }

  .icon-overlay {
    position: absolute;
    inset: 0;
    background: var(--vp-c-bg-soft);
    padding: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    font-size: 10px;
    transform: translateY(100%);
    opacity: 0;
    transition: transform 0.15s ease, opacity 0.15s ease;
    line-height: 1.2;

    &-tags {
      color: var(--vp-c-text-3);
      margin: 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
    }
  }
}
</style>
