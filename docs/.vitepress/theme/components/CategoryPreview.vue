<script setup lang="ts">
/**
 * The App theming playground.
 *
 * Switching category here does the same thing an app does once at its shell:
 * it sets `data-nb-theme` on a scope. Everything inside follows, which is the
 * claim the page makes and the thing a reader should be able to check rather
 * than take on trust.
 *
 * There is one stage, not a light one beside a dark one. The dark half of the
 * library is selected by a `.dark` class on an ancestor, and CSS cannot undo
 * an ancestor's class from inside: a panel claiming to be the light half on a
 * dark page would render dark and label itself light, which is worse than not
 * showing it. So the stage follows the page, and the reader uses the docs'
 * own colour-mode switch to see the other half.
 */
import { computed, ref } from 'vue'

type Option = { id: string; label: string; note?: string }

const options: Option[] = [
  { id: 'demo-creatives', label: 'creatives' },
  { id: 'demo-engineers', label: 'engineers' },
  { id: 'demo-home', label: 'home' },
  { id: 'demo-fun', label: 'fun' },
  {
    id: 'demo-override',
    label: 'creatives, accent overridden',
    note: 'An app keeping an identity it already had. The category still says creatives.',
  },
]

const selected = ref<string>('demo-engineers')
const current = computed(
  () => options.find((o) => o.id === selected.value) as Option,
)
const snippet = computed(() => {
  const o = current.value
  if (o.id === 'demo-override') {
    return `@include nb.app-theme('your-app',\n  $category: 'creatives',\n  $accent: (#0b7285, #41d6e0)\n);`
  }
  return `@include nb.app-theme('your-app', $category: '${o.label}');`
})
</script>

<template>
  <div class="category-preview">
    <div class="category-preview__controls" role="group" aria-label="Category">
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        class="category-preview__choice"
        :aria-pressed="selected === option.id"
        @click="selected = option.id"
      >
        {{ option.label }}
      </button>
    </div>

    <p v-if="current.note" class="category-preview__note">{{ current.note }}</p>

    <div class="category-preview__modes">
      <div class="category-preview__mode">
        <span class="category-preview__mode-label">
          Follows this page. Use the colour-mode switch in the header to see the
          other half.
        </span>
        <div class="category-preview__stage" :data-nb-theme="selected">
          <button type="button" class="category-preview__primary">
            Primary
          </button>
          <a href="#app-theming" class="category-preview__link">A link</a>
          <span class="category-preview__swatches">
            <i
              class="category-preview__swatch category-preview__swatch--accent"
              title="--nb-c-primary"
            />
            <i
              class="category-preview__swatch category-preview__swatch--subtle"
              title="--nb-c-primary-subtle"
            />
            <i
              class="category-preview__swatch category-preview__swatch--category"
              title="--nb-c-category"
            />
            <i
              class="category-preview__swatch category-preview__swatch--rail"
              title="--nb-shell-sidebar-bg"
            />
          </span>
        </div>
      </div>
    </div>

    <pre class="category-preview__snippet"><code>{{ snippet }}</code></pre>
  </div>
</template>

<style scoped lang="scss">
.category-preview {
  display: grid;
  gap: calc(var(--nb-base-unit) * 2);
  margin: calc(var(--nb-base-unit) * 3) 0;
}

.category-preview__controls {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--nb-base-unit) * 1);
}

.category-preview__choice {
  border: 1px solid var(--nb-c-layer-border-1);
  background: var(--nb-c-layer-1);
  color: var(--nb-c-text);
  border-radius: var(--nb-radius-s, 4px);
  padding: calc(var(--nb-base-unit) * 0.75) calc(var(--nb-base-unit) * 1.5);
  cursor: pointer;
  font: inherit;

  &[aria-pressed='true'] {
    border-color: var(--nb-c-primary);
    background: var(--nb-c-primary-subtle);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }
}

.category-preview__note {
  margin: 0;
  color: var(--nb-c-text-muted);
  font-size: var(--nb-font-size-s, 0.875rem);
}

.category-preview__modes {
  display: grid;
  gap: calc(var(--nb-base-unit) * 2);
}

.category-preview__mode {
  border: 1px solid var(--nb-c-layer-border-1);
  border-radius: var(--nb-radius-m, 6px);
  overflow: hidden;
  background: var(--nb-c-layer-0);
}

.category-preview__mode-label {
  display: block;
  padding: calc(var(--nb-base-unit) * 0.75) calc(var(--nb-base-unit) * 1.5);
  background: var(--nb-c-layer-2);
  color: var(--nb-c-text-muted);
  font-size: var(--nb-font-size-xs, 0.75rem);
  letter-spacing: 0.01em;
}

.category-preview__stage {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--nb-base-unit) * 2);
  padding: calc(var(--nb-base-unit) * 2);
  background: var(--nb-c-layer-0);
}

.category-preview__primary {
  border: 0;
  border-radius: var(--nb-radius-s, 4px);
  padding: calc(var(--nb-base-unit) * 1) calc(var(--nb-base-unit) * 2);
  background: var(--nb-c-primary);
  color: var(--nb-c-primary-a11y);
  cursor: pointer;
  font: inherit;

  &:hover {
    background: var(--nb-c-primary-hover);
  }

  &:active {
    background: var(--nb-c-primary-active);
  }

  &:focus-visible {
    outline: 2px solid var(--nb-c-focus-ring);
    outline-offset: 2px;
  }
}

.category-preview__link {
  color: var(--nb-c-primary);
  text-decoration: underline;
}

.category-preview__swatches {
  display: inline-flex;
  gap: calc(var(--nb-base-unit) * 0.5);
  margin-inline-start: auto;
}

.category-preview__swatch {
  inline-size: calc(var(--nb-base-unit) * 2.5);
  block-size: calc(var(--nb-base-unit) * 2.5);
  border-radius: var(--nb-radius-s, 4px);
  border: 1px solid var(--nb-c-layer-border-2);

  &--accent {
    background: var(--nb-c-primary);
  }

  &--subtle {
    background: var(--nb-c-primary-subtle);
  }

  &--category {
    background: var(--nb-c-category);
  }

  &--rail {
    background: var(--nb-shell-sidebar-bg);
  }
}

.category-preview__snippet {
  margin: 0;
}
</style>
