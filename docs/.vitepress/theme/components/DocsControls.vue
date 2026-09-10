<template>
  <div class="docs-controls">
    <div
      class="docs-controls__group"
      role="group"
      aria-label="Colour mode"
      :title="`Colour mode: ${resolved}`"
    >
      <button
        v-for="option in modes"
        :key="option.value"
        type="button"
        class="docs-controls__btn"
        :class="{ 'docs-controls__btn--on': theme === option.value }"
        :aria-pressed="theme === option.value"
        @click="setTheme(option.value)"
      >
        <span class="docs-controls__icon" aria-hidden="true">{{
          option.glyph
        }}</span>
        <span class="docs-controls__label">{{ option.label }}</span>
      </button>
    </div>

    <div
      class="docs-controls__group"
      role="group"
      aria-label="Corner appearance"
    >
      <button
        v-for="option in shapes"
        :key="option.value"
        type="button"
        class="docs-controls__btn"
        :class="{ 'docs-controls__btn--on': appearance === option.value }"
        :aria-pressed="appearance === option.value"
        @click="setAppearance(option.value)"
      >
        <span
          class="docs-controls__swatch"
          :class="`docs-controls__swatch--${option.value}`"
          aria-hidden="true"
        />
        <span class="docs-controls__label">{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The two switches the whole documentation site is driven by.
 *
 * They are the library's own composables, not documentation-only state:
 * `useTheme()` owns the `.dark` class and `useAppearance()` owns
 * `data-nb-appearance`, both on `<html>`. So the site is exercising the same
 * public API a consumer would call, and every example on every page follows
 * along, teleported overlays included.
 *
 * The two are deliberately separate controls rather than one combined menu,
 * because the settings are independent: changing one must not disturb the
 * other, and a single control implying four modes would suggest otherwise.
 */
import { useTheme } from '../../../../src/composables/useTheme.composable'
import { useAppearance } from '../../../../src/composables/useAppearance.composable'

const { theme, resolved, setTheme } = useTheme()
const { appearance, setAppearance } = useAppearance()

const modes = [
  { value: 'light' as const, label: 'Light', glyph: '☀' },
  { value: 'dark' as const, label: 'Dark', glyph: '☾' },
  { value: 'system' as const, label: 'Auto', glyph: '◐' },
]

const shapes = [
  { value: 'square' as const, label: 'Square' },
  { value: 'rounded' as const, label: 'Round' },
]
</script>

<style scoped>
.docs-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.docs-controls__group {
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
}

.docs-controls__btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  /* The header is chrome, not page content: its own light-on-dark palette
     holds in both colour modes, so these do not follow the theme. */
  color: rgba(255, 255, 255, 0.72);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.docs-controls__btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.docs-controls__btn--on {
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
}

.docs-controls__btn:focus-visible {
  outline: 2px solid var(--nb-c-grape-hyacinth-350);
  outline-offset: 1px;
}

.docs-controls__icon {
  font-size: 13px;
}

/* The shape control shows the thing it does rather than naming it twice. */
.docs-controls__swatch {
  width: 11px;
  height: 11px;
  border: 1.5px solid currentColor;
}

.docs-controls__swatch--rounded {
  border-radius: 4px;
}

/* The nav bar is tight on a laptop and very tight on a tablet; the words go
   first, the controls stay. */
@media (max-width: 1100px) {
  .docs-controls__label {
    display: none;
  }

  .docs-controls__btn {
    padding: 0 6px;
  }
}

@media (max-width: 768px) {
  .docs-controls {
    display: none;
  }
}
</style>
