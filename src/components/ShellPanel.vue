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
        <span v-if="title" class="nb-shell-panel__title" :title="title">{{
          title
        }}</span>
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
        :aria-label="
          title ? nbStrings.shellPanelSizeFor(title) : nbStrings.shellPanelSize
        "
      >
        <slot name="controls">
          <!-- Icon-only ghost NbButtons at xs, the one size that fits the
               28px header. `pressed` marks the size the panel is at, and
               `label` names each one and is its tooltip. -->
          <NbButton
            v-for="control in sizeControls"
            :key="control.size"
            class="nb-shell-panel__size-btn"
            variant="ghost"
            size="xs"
            :icon="control.icon"
            :label="control.label"
            :pressed="currentSize === control.size"
            @click="setSize(control.size)"
          />
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
import * as iconMinus from '@nubisco/ui/icons/minus'
import * as iconCornersIn from '@nubisco/ui/icons/corners-in'
import * as iconCornersOut from '@nubisco/ui/icons/corners-out'
import { computed, ref, watch } from 'vue'
import type { TIconSource } from '@/types/Glyph.d'
import type { TShellPanelSize, IShellPanelProps } from './ShellPanel.d'
import { useSurfaceLayer } from '@/composables/useSurfaceLayer.composable'
import { useNbStrings } from '@/composables/useNbStrings.composable'
import NbButton from './Button.vue'

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

// Works controlled or uncontrolled: internal state carries the size so the
// header buttons act even when the consumer never binds v-model:size, and a
// prop change (the controlled case) still overrides on the next tick.
const internalSize = ref<TShellPanelSize>(props.size)
watch(
  () => props.size,
  (size) => (internalSize.value = size),
)

const currentSize = computed({
  get: () => internalSize.value,
  set: (v) => {
    internalSize.value = v
    emit('update:size', v)
  },
})

const nbStrings = useNbStrings()

/*
 * The three sizes as data, so the buttons are one NbButton in a loop rather
 * than three copies of a hand-drawn 12px SVG. The glyphs are imported as
 * modules because the names live in script, where the compile-time plugin
 * cannot see them.
 */
const sizeControls = computed<
  { size: TShellPanelSize; icon: TIconSource; label: string }[]
>(() => [
  {
    size: 'collapsed',
    icon: iconMinus,
    label: nbStrings.value.shellPanelMinimize,
  },
  {
    size: 'default',
    icon: iconCornersIn,
    label: nbStrings.value.shellPanelRestore,
  },
  {
    size: 'full',
    icon: iconCornersOut,
    label: nbStrings.value.shellPanelMaximize,
  },
])

function setSize(size: TShellPanelSize) {
  currentSize.value = size
}

defineExpose({ setSize })
</script>

<style scoped lang="scss">
@use '../styles/logic/motion' as motion;
@use '../styles/logic/radius' as radius;

.nb-shell-panel {
  // Most --nb-shell-panel-* defaults live at :root in styles/_theme.scss so
  // consumer apps can override them there without fighting scoped-style
  // specificity. The colours are the exception: their defaults are written
  // here, because they read this panel's own layer (the `nb-layer-N` class
  // bound on this element) and a :root default froze them to layer 1. A
  // product that sets them on :root still wins.
  display: flex;
  flex-direction: column;
  background: var(--nb-shell-panel-bg, var(--nb-c-surface));
  border: var(--nb-shell-panel-border, 1px solid var(--nb-c-border));
  @include radius.surface(panel);
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
      transition: opacity var(--nb-motion-quick) ease;
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

    // A maximized panel owns its column, so its content scrolls internally
    // the way `fill` does; otherwise anything taller than the space the
    // siblings left is silently clipped by the panel's own overflow.
    > .nb-shell-panel__content {
      overflow-y: auto;
    }
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
  border-bottom: var(
    --nb-shell-panel-header-border,
    1px solid var(--nb-c-border)
  );
  gap: 8px;
}

// The title gives way, the size buttons do not. A long title (a field
// group named after a long label, say) ran under the buttons, because nothing
// in the row was allowed to shrink except the buttons themselves. The left
// side now shrinks from its natural width and cuts the title with an
// ellipsis, the full text stays in the title attribute, and the controls keep
// their size.
.nb-shell-panel__header-left {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
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
  flex-shrink: 0;
  gap: 2px;
}

.nb-shell-panel__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--nb-type-overline-size);
  font-weight: var(--nb-type-overline-weight);
  line-height: var(--nb-type-overline-line-height);
  letter-spacing: var(--nb-type-overline-letter-spacing);
  text-transform: var(--nb-type-overline-text-transform);
  color: var(--nb-c-text-muted);
  white-space: nowrap;
}

.nb-shell-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

// NbButton draws the size controls. The row only has to keep them whole.
.nb-shell-panel__size-btn {
  flex-shrink: 0;
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

// The dimmed-header fade is a decorative transition on a state the panel
// reaches either way, so the preference can remove it outright. The library
// asks consumers to gate their animations. It does not get to exempt its own.
@include motion.reduced {
  .nb-shell-panel.collapsed .nb-shell-panel__header {
    transition: none;
  }
}
</style>

<!-- ── Unscoped: sibling coordination ─────────────────────────────────────
     When any panel in a container is maximized (.full), all sibling panels
     that are NOT .full collapse to header-only. This works regardless of
     what the parent container is: any flex parent will do. -->
<style lang="scss">
@use '../styles/logic/motion' as motion;
// First in the inspector sheet, the panel's size buttons sat under the sheet's
// own dismiss button, top right. The frame publishes how much room that button
// takes (`--nb-shell-inspector-dismiss-inset`, only while the inspector is an
// overlay), and a panel that follows the button directly keeps its header
// clear of it. The other panels, and the desktop column, read the variable as
// nothing. Unscoped, because the button belongs to the frame.
.nb-shell__inspector-dismiss + .nb-shell-panel > .nb-shell-panel__header {
  padding-inline-end: calc(8px + var(--nb-shell-inspector-dismiss-inset, 0px));
}

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
    transition: opacity var(--nb-motion-quick) ease;
  }
  > .nb-shell-panel__header:hover {
    opacity: 1;
  }
}

@include motion.reduced {
  :has(> .nb-shell-panel.full) > .nb-shell-panel:not(.full) {
    > .nb-shell-panel__header {
      transition: none;
    }
  }
}
</style>
