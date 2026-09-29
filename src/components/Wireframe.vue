<template>
  <div
    class="nb-wireframe"
    :class="{ 'nb-wireframe--dark': spec.tone === 'dark' }"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <div v-for="(row, r) in rows" :key="r" class="nb-wireframe__row">
      <div
        v-for="(col, c) in row"
        :key="c"
        class="nb-wireframe__col"
        :class="`nb-wireframe__col--${col.align}`"
        :style="{ gridColumn: `span ${col.span}` }"
      >
        <template v-for="(part, p) in col.parts" :key="p">
          <span
            v-if="part.name === 'eyebrow'"
            class="nb-wireframe__bar nb-wireframe__bar--eyebrow"
          />
          <span
            v-else-if="part.name === 'title'"
            class="nb-wireframe__bar nb-wireframe__bar--title"
          />
          <span
            v-else-if="part.name === 'heading'"
            class="nb-wireframe__bar nb-wireframe__bar--heading"
          />
          <span v-else-if="part.name === 'text'" class="nb-wireframe__lines">
            <span
              v-for="n in part.count"
              :key="n"
              class="nb-wireframe__bar nb-wireframe__bar--line"
            />
          </span>
          <span
            v-else-if="part.name === 'buttons'"
            class="nb-wireframe__inline"
          >
            <span class="nb-wireframe__pill nb-wireframe__pill--primary" />
            <span class="nb-wireframe__pill nb-wireframe__pill--outline" />
          </span>
          <span v-else-if="part.name === 'button'" class="nb-wireframe__inline">
            <span class="nb-wireframe__pill nb-wireframe__pill--primary" />
          </span>
          <span
            v-else-if="part.name === 'image'"
            class="nb-wireframe__box nb-wireframe__box--image"
          />
          <span
            v-else-if="part.name === 'device'"
            class="nb-wireframe__box nb-wireframe__box--device"
          >
            <span class="nb-wireframe__screen" />
          </span>
          <span
            v-else-if="part.name === 'chips' || part.name === 'tabs'"
            class="nb-wireframe__inline"
          >
            <span
              v-for="n in part.count"
              :key="n"
              class="nb-wireframe__pill nb-wireframe__pill--chip"
              :class="{
                'nb-wireframe__pill--active': part.name === 'tabs' && n === 1,
              }"
            />
          </span>
          <span v-else-if="part.name === 'badge'" class="nb-wireframe__inline">
            <span class="nb-wireframe__pill nb-wireframe__pill--chip" />
          </span>
          <span
            v-else-if="part.name === 'cards' || part.name === 'tiles'"
            class="nb-wireframe__cards"
            :style="{
              gridTemplateColumns: `repeat(${Math.min(part.count, 4)}, 1fr)`,
            }"
          >
            <span
              v-for="n in part.count"
              :key="n"
              class="nb-wireframe__card"
              :class="{ 'nb-wireframe__card--tile': part.name === 'tiles' }"
            >
              <template v-if="part.name === 'cards'">
                <span class="nb-wireframe__bar nb-wireframe__bar--heading" />
                <span class="nb-wireframe__bar nb-wireframe__bar--line" />
                <span
                  class="nb-wireframe__bar nb-wireframe__bar--line nb-wireframe__bar--short"
                />
              </template>
            </span>
          </span>
          <span
            v-else-if="part.name === 'list' || part.name === 'links'"
            class="nb-wireframe__lines"
          >
            <span v-for="n in part.count" :key="n" class="nb-wireframe__item">
              <span v-if="part.name === 'list'" class="nb-wireframe__dot" />
              <span class="nb-wireframe__bar nb-wireframe__bar--line" />
            </span>
          </span>
          <span v-else-if="part.name === 'input'" class="nb-wireframe__inline">
            <span class="nb-wireframe__field" />
            <span class="nb-wireframe__pill nb-wireframe__pill--primary" />
          </span>
          <span v-else-if="part.name === 'quote'" class="nb-wireframe__quote">
            <span class="nb-wireframe__bar nb-wireframe__bar--heading" />
            <span
              class="nb-wireframe__bar nb-wireframe__bar--heading nb-wireframe__bar--short"
            />
          </span>
          <span v-else-if="part.name === 'logo'" class="nb-wireframe__inline">
            <span class="nb-wireframe__box nb-wireframe__box--icon" />
            <span class="nb-wireframe__bar nb-wireframe__bar--eyebrow" />
          </span>
          <span
            v-else-if="part.name === 'icon'"
            class="nb-wireframe__box nb-wireframe__box--icon"
          />
          <span
            v-else-if="part.name === 'divider'"
            class="nb-wireframe__divider"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IWireframeColumn, IWireframeProps } from './Wireframe.d'

/**
 * A schematic thumbnail of a layout: bars for copy, pills for buttons, boxes
 * for media, laid out on a 12-column grid. It shows the SHAPE of something (a
 * block type in a picker, a template in a gallery) before anyone builds it,
 * which is the question a label and a description cannot answer at a glance.
 *
 * The spec is data, not markup, so it can come from anywhere (a site's
 * registry, a server) without the host rendering anything it did not write.
 */
const props = withDefaults(defineProps<IWireframeProps>(), { label: undefined })

const KNOWN = new Set([
  'eyebrow',
  'title',
  'heading',
  'text',
  'buttons',
  'button',
  'image',
  'device',
  'chips',
  'tabs',
  'badge',
  'cards',
  'tiles',
  'list',
  'links',
  'input',
  'quote',
  'logo',
  'icon',
  'divider',
])
const DEFAULT_COUNT: Record<string, number> = {
  text: 2,
  chips: 3,
  tabs: 3,
  cards: 3,
  tiles: 4,
  list: 3,
  links: 3,
}

function parsePart(raw: unknown): { name: string; count: number } | null {
  if (typeof raw !== 'string') return null
  const [name, n] = raw.trim().split(':')
  if (!KNOWN.has(name)) return null
  const count = Number.parseInt(n ?? '', 10)
  return {
    name,
    count:
      Number.isFinite(count) && count > 0
        ? Math.min(count, 12)
        : (DEFAULT_COUNT[name] ?? 1),
  }
}

// Normalised leniently: a malformed row or part is dropped, never thrown on,
// because a spec may arrive from a source this library has never seen.
const rows = computed(() =>
  (Array.isArray(props.spec?.rows) ? props.spec.rows : [])
    .filter((row): row is IWireframeColumn[] => Array.isArray(row))
    .map((row) =>
      row
        .filter((col) => col && Array.isArray(col.parts))
        .map((col) => ({
          span: Math.min(
            12,
            Math.max(
              1,
              Math.round(Number(col.span) || 12 / Math.max(1, row.length)),
            ),
          ),
          align:
            col.align === 'center' || col.align === 'end' ? col.align : 'start',
          parts: col.parts
            .map(parsePart)
            .filter((p): p is { name: string; count: number } => !!p),
        })),
    )
    .filter((row) => row.length),
)
</script>

<style scoped lang="scss">
.nb-wireframe {
  --nb-wireframe-ink: var(--nb-c-text-subtle, #8a8a96);
  --nb-wireframe-accent: var(--nb-c-primary, #5856a9);
  --nb-wireframe-bg: var(--nb-c-surface, #fff);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  aspect-ratio: 16 / 10;
  // A size container, so a picture can be capped at a share of the frame's
  // HEIGHT: a full-width 4:3 box is taller than a 16:10 frame and would push
  // everything under it out of view.
  container-type: size;
  padding: 10px 12px;
  overflow: hidden;
  background: var(--nb-wireframe-bg);
  border: 1px solid var(--nb-c-border, #e4e4ea);
  border-radius: var(--nb-radius-sm, 6px);
  color: var(--nb-wireframe-ink);

  &--dark {
    --nb-wireframe-bg: #16161c;
    --nb-wireframe-ink: #9a9aac;
  }
}

.nb-wireframe__row {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 8px;
  align-items: center;
}

.nb-wireframe__col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  &--center {
    align-items: center;
    text-align: center;
  }

  &--end {
    align-items: flex-end;
  }
}

.nb-wireframe__bar {
  display: block;
  height: 3px;
  width: 100%;
  border-radius: 2px;
  background: currentColor;
  opacity: 0.35;

  &--eyebrow {
    width: 28%;
    height: 3px;
    background: var(--nb-wireframe-accent);
    opacity: 0.7;
  }

  &--title {
    width: 76%;
    height: 7px;
    opacity: 0.75;
  }

  &--heading {
    width: 58%;
    height: 5px;
    opacity: 0.6;
  }

  &--short {
    width: 62%;
  }
}

.nb-wireframe__lines {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;

  .nb-wireframe__bar--line:last-child:not(:first-child) {
    width: 70%;
  }
}

.nb-wireframe__col--center .nb-wireframe__lines {
  align-items: center;
}

.nb-wireframe__inline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.nb-wireframe__pill {
  display: block;
  height: 7px;
  width: 22px;
  border-radius: 4px;

  &--primary {
    background: var(--nb-wireframe-accent);
  }

  &--outline {
    border: 1px solid currentColor;
    opacity: 0.6;
  }

  &--chip {
    width: 14px;
    height: 5px;
    background: currentColor;
    opacity: 0.3;
  }

  &--active {
    background: var(--nb-wireframe-accent);
    opacity: 1;
  }
}

.nb-wireframe__box {
  display: block;
  width: 100%;
  border-radius: 3px;
  background: currentColor;
  opacity: 0.22;

  &--image {
    aspect-ratio: 4 / 3;
    width: auto;
    max-width: 100%;
    max-height: 62cqh;
  }

  &--device {
    aspect-ratio: 16 / 11;
    width: auto;
    max-width: 100%;
    max-height: 72cqh;
    opacity: 1;
    background: transparent;
    border: 2px solid currentColor;
    padding: 2px;
  }

  &--icon {
    width: 10px;
    height: 10px;
    aspect-ratio: auto;
  }
}

.nb-wireframe__screen {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 1px;
  background: currentColor;
  opacity: 0.22;
}

.nb-wireframe__cards {
  display: grid;
  gap: 4px;
  width: 100%;
}

.nb-wireframe__card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px;
  border: 1px solid currentColor;
  border-radius: 3px;
  opacity: 0.8;

  &--tile {
    aspect-ratio: 1;
    border: 0;
    background: currentColor;
    opacity: 0.22;
  }
}

.nb-wireframe__item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.nb-wireframe__dot {
  flex: none;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--nb-wireframe-accent);
}

.nb-wireframe__field {
  display: block;
  flex: 1;
  min-width: 30px;
  height: 7px;
  border: 1px solid currentColor;
  border-radius: 2px;
  opacity: 0.5;
}

.nb-wireframe__quote {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  padding-left: 5px;
  border-left: 2px solid var(--nb-wireframe-accent);
}

.nb-wireframe__divider {
  display: block;
  width: 100%;
  height: 1px;
  background: currentColor;
  opacity: 0.25;
}
</style>
