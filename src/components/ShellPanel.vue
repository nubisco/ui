<template>
  <div
    class="nb-shell-panel"
    v-bind="layerProps"
    :class="[
      currentSize,
      { 'nb-shell-panel--fluid': fluid, 'nb-shell-panel--fill': fill },
    ]"
  >
    <!-- ═══ HEADER ═══ -->
    <div class="nb-shell-panel__header">
      <div class="nb-shell-panel__header-left">
        <span v-if="title" class="nb-shell-panel__title">{{ title }}</span>
        <slot name="title" />
      </div>

      <div class="nb-shell-panel__header-center">
        <div class="nb-shell-panel__toolbar">
          <slot name="toolbar" />
        </div>
      </div>

      <div
        class="nb-shell-panel__header-right"
        role="group"
        :aria-label="title ? `${title} panel size` : 'Panel size'"
      >
        <slot name="controls">
          <!-- Minimize -->
          <button
            type="button"
            class="nb-shell-panel__size-btn"
            :class="{ active: currentSize === 'collapsed' }"
            :aria-pressed="currentSize === 'collapsed'"
            :title="'Minimize'"
            :aria-label="'Minimize'"
            @click="setSize('collapsed')"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <line
                x1="2"
                y1="10"
                x2="10"
                y2="10"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </button>
          <!-- Default (share space) -->
          <button
            type="button"
            class="nb-shell-panel__size-btn"
            :class="{ active: currentSize === 'default' }"
            :aria-pressed="currentSize === 'default'"
            :title="'Default'"
            :aria-label="'Default'"
            @click="setSize('default')"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <rect
                x="1"
                y="5"
                width="10"
                height="6"
                rx="1"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
              />
            </svg>
          </button>
          <!-- Maximize -->
          <button
            type="button"
            class="nb-shell-panel__size-btn"
            :class="{ active: currentSize === 'full' }"
            :aria-pressed="currentSize === 'full'"
            :title="'Maximize'"
            :aria-label="'Maximize'"
            @click="setSize('full')"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                rx="1"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
              />
              <line
                x1="1"
                y1="3.5"
                x2="11"
                y2="3.5"
                stroke="currentColor"
                stroke-width="1.2"
              />
            </svg>
          </button>
        </slot>
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div v-if="currentSize !== 'collapsed'" class="nb-shell-panel__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TShellPanelSize, IShellPanelProps } from './ShellPanel.d'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'

const props = withDefaults(defineProps<IShellPanelProps>(), {
  size: 'default',
  title: '',
  fluid: false,
  fill: false,
})

// A shell panel is a surface holding application content, so it deepens against
// the shell body it sits on and against any panel it is nested in.
const { layerProps } = useSurfaceLayer()

const emit = defineEmits<{
  'update:size': [size: TShellPanelSize]
}>()

const currentSize = computed({
  get: () => props.size,
  set: (v) => emit('update:size', v),
})

function setSize(size: TShellPanelSize) {
  currentSize.value = size
}

defineExpose({ setSize })
</script>

<style scoped lang="scss">
.nb-shell-panel {
  // --nb-shell-panel-* defaults live at :root in styles/_theme.scss so consumer
  // apps can override them on :root without fighting scoped-style specificity.
  display: flex;
  flex-direction: column;
  background: var(--nb-shell-panel-bg);
  border: var(--nb-shell-panel-border);
  border-radius: 2px;
  margin: var(--nb-shell-panel-gap);
  min-height: 0;
  overflow: hidden;

  // ── Size states ──────────────────────────────────────────────────────────
  //
  // collapsed: header only, does not grow
  // default:   flex: 1, shares space equally with siblings
  // full:      flex: 1, sibling panels collapse (see unscoped rule below)

  &.collapsed {
    flex: 0 0 auto;

    // Dim the header so a put-away panel reads as "collapsed" at a glance
    // instead of looking identical to an expanded one. Hovering restores
    // full contrast so its size controls stay easy to find and click.
    .nb-shell-panel__header {
      opacity: 0.6;
      transition: opacity 0.12s ease;
    }
    .nb-shell-panel__header:hover {
      opacity: 1;
    }
  }

  &.default {
    flex: 1 1 0%;
  }

  &.full {
    flex: 1 1 0%;
  }

  // Fluid mode: a default-sized panel takes only the height its
  // content needs. Right for multi-panel inspectors where each
  // section has its own length and forcing them to share the column
  // makes short panels too tall and long panels too short. The
  // sibling-coordination rule (further down, unscoped) still wins:
  // a `.full` panel will collapse `.fluid` siblings to header-only,
  // which is the same behaviour non-fluid panels get.
  &--fluid.default {
    flex: 0 0 auto;
  }

  // ── Fill ─────────────────────────────────────────────────────────────────
  // Opt-in via the `fill` prop, with the same name and the same meaning it has
  // on NbDataTable: claim the parent's height and scroll internally. Two
  // applications were re-declaring exactly this pair of declarations on
  // .nb-shell-panel across six stylesheets, because `default` only shares a
  // column with its siblings and `fluid` only shrinks to content: neither of
  // them says "take what is left and put the scrollbar inside me".
  //
  // Ordered after `--fluid` deliberately. The two have equal specificity, so
  // source order decides, and `fill` is the more specific intent: a panel
  // asked to fill should fill even if it was also marked fluid.
  //
  // Like the table, this claims a height, it cannot create one. The parent has
  // to be a bounded flex column (NbShell's `bottom` region and inspector
  // column both are).
  &--fill:not(.collapsed) {
    flex: 1 1 auto;
    min-height: 0;
  }
}

.nb-shell-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nb-shell-panel-header-height);
  padding: 0 8px;
  flex-shrink: 0;
  background: var(--nb-shell-panel-header-bg);
  border-bottom: var(--nb-shell-panel-header-border);
  gap: 8px;
}

.nb-shell-panel__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.nb-shell-panel__header-center {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
}

.nb-shell-panel__header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nb-shell-panel__title {
  font-size: 11px;
  font-weight: 500;
  color: var(--nb-c-text-muted);
  white-space: nowrap;
}

.nb-shell-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nb-shell-panel__size-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--nb-c-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.1s,
    color 0.1s;

  &:hover {
    background: var(--nb-c-surface-hover, rgba(255, 255, 255, 0.08));
    color: var(--nb-c-text);
  }

  &.active {
    background: var(--nb-c-surface-hover, rgba(255, 255, 255, 0.12));
    color: var(--nb-c-text);
  }
}

.nb-shell-panel__content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

// Under `fill`, the content region is the scroller. `min-height: 0` is what
// lets it shrink below its content so the scrollbar lands here instead of on
// the page, and `flex-direction: column` makes a single child (a table, a log,
// a form) stack and stretch rather than sit in a row. A child that scrolls
// itself (NbDataTable with `fill`) still wins: it never overflows this box, so
// only one scrollbar is ever visible.
.nb-shell-panel--fill > .nb-shell-panel__content {
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
}

// The dimmed-header fade and the size-button hover tint are decorative
// transitions on states the panel reaches either way, so the preference can
// remove them outright. The library asks consumers to gate their animations;
// it does not get to exempt its own.
@media (prefers-reduced-motion: reduce) {
  .nb-shell-panel.collapsed .nb-shell-panel__header,
  .nb-shell-panel__size-btn {
    transition: none;
  }
}
</style>

<!-- ── Unscoped: sibling coordination ─────────────────────────────────────
     When any panel in a container is maximized (.full), all sibling panels
     that are NOT .full collapse to header-only. This works regardless of
     what the parent container is: any flex parent will do. -->
<style lang="scss">
:has(> .nb-shell-panel.full) > .nb-shell-panel:not(.full) {
  flex: 0 0 auto !important;

  > .nb-shell-panel__content {
    display: none !important;
  }

  // A panel squeezed to header-only by a maximized sibling is, visually,
  // collapsed too, so dim its header the same way an explicitly collapsed
  // panel is. "Showing only a header" always reads the same, regardless of
  // whether the user collapsed it or a sibling was maximized.
  > .nb-shell-panel__header {
    opacity: 0.6;
    transition: opacity 0.12s ease;
  }
  > .nb-shell-panel__header:hover {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  :has(> .nb-shell-panel.full) > .nb-shell-panel:not(.full) {
    > .nb-shell-panel__header {
      transition: none;
    }
  }
}
</style>
