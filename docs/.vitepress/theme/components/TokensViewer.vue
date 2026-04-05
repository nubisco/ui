<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { withBase } from 'vitepress'

interface Token {
  $value: string
  $type: string
  $rawRef?: string
}

interface TypeSet {
  [prop: string]: string
}

interface TokensJson {
  $metadata: { generated: string; source: string }
  color: {
    palette: Record<string, Record<string, Token>>
    semantic: Record<string, Token>
  }
  typography: {
    fontSize: Record<string, Token>
    fontWeight: Record<string, Token>
    fontFamily: Record<string, Token>
    lineHeight: Record<string, Token>
    letterSpacing: Record<string, Token>
    typeSet: Record<string, TypeSet>
  }
  spacing: Record<string, Token>
  animation: Record<string, Token>
  zIndex: Record<string, Token | Record<string, Token>>
}

const props = defineProps<{ section?: string }>()

const tokens = ref<TokensJson | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await fetch(withBase('/tokens.json'))
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    tokens.value = await res.json()
  } catch (e) {
    error.value = String(e)
  }
})

const paletteEntries = computed(() =>
  tokens.value ? Object.entries(tokens.value.color.palette) : [],
)

const semanticEntries = computed(() =>
  tokens.value ? Object.entries(tokens.value.color.semantic) : [],
)

const typeSetEntries = computed(() =>
  tokens.value ? Object.entries(tokens.value.typography.typeSet) : [],
)

const spacingEntries = computed(() =>
  tokens.value
    ? Object.entries(tokens.value.spacing).filter(([k]) => k !== 'base-unit')
    : [],
)

const animationEntries = computed(() =>
  tokens.value ? Object.entries(tokens.value.animation) : [],
)

function isLight(color: string): boolean {
  const hex = color.replace('#', '')
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return r * 0.299 + g * 0.587 + b * 0.114 > 150
  }
  // rgb() format fallback
  const m = color.match(/rgb\(([^)]+)\)/)
  if (m) {
    const [r, g, b] = m[1].split(',').map(Number)
    return r * 0.299 + g * 0.587 + b * 0.114 > 150
  }
  return true
}
</script>

<template>
  <div v-if="error" class="tv-error">Could not load tokens: {{ error }}</div>
  <div v-else-if="!tokens" class="tv-loading">Loading tokens...</div>

  <template v-else>
    <!-- ── Color Palette ───────────────────────────────────────────── -->
    <template v-if="!section || section === 'colors'">
      <h2>Color Palette</h2>
      <div
        v-for="[name, shades] in paletteEntries"
        :key="name"
        class="tv-palette-group"
      >
        <h3 class="tv-palette-name">{{ name }}</h3>
        <div class="tv-swatches">
          <div
            v-for="[shade, token] in Object.entries(shades)"
            :key="shade"
            class="tv-swatch"
            :style="{ background: token.$value }"
          >
            <span
              class="tv-swatch-label"
              :class="{ 'tv-swatch-label--dark': !isLight(token.$value) }"
            >
              {{ shade }}
            </span>
          </div>
        </div>
      </div>

      <h2>Semantic Colors</h2>
      <div class="tv-semantic-grid">
        <div
          v-for="[name, token] in semanticEntries"
          :key="name"
          class="tv-semantic-item"
        >
          <div
            class="tv-semantic-swatch"
            :style="{ background: token.$value }"
          />
          <div class="tv-semantic-meta">
            <code>--nb-{{ name }}</code>
            <span class="tv-semantic-value">{{
              token.$rawRef ?? token.$value
            }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Typography ─────────────────────────────────────────────── -->
    <template v-if="!section || section === 'typography'">
      <h2>Type Scale</h2>
      <div class="tv-typeset-list">
        <div
          v-for="[name, set] in typeSetEntries"
          :key="name"
          class="tv-typeset-item"
        >
          <p
            class="tv-typeset-specimen"
            :style="{
              fontSize: set.size,
              fontWeight: set.weight,
              lineHeight: set.height,
              letterSpacing: set.spacing,
              fontFamily: set.family,
            }"
          >
            The quick brown fox
          </p>
          <div class="tv-typeset-meta">
            <code>{{ name }}</code>
            <span
              >{{ set.size }} / lh {{ set.height }} / fw {{ set.weight }}</span
            >
          </div>
        </div>
      </div>

      <h2>Font Sizes</h2>
      <div class="tv-scale-list">
        <div
          v-for="[name, token] in Object.entries(tokens.typography.fontSize)"
          :key="name"
          class="tv-scale-item"
        >
          <span :style="{ fontSize: token.$value }" class="tv-scale-specimen"
            >Aa</span
          >
          <code>--nb-font-size-{{ name }}</code>
          <span class="tv-scale-value">{{ token.$value }}</span>
        </div>
      </div>
    </template>

    <!-- ── Spacing ────────────────────────────────────────────────── -->
    <template v-if="!section || section === 'spacing'">
      <h2>Spacing Scale</h2>
      <div class="tv-spacing-list">
        <div
          v-for="[name, token] in spacingEntries"
          :key="name"
          class="tv-spacing-item"
        >
          <div class="tv-spacing-bar-wrap">
            <div class="tv-spacing-bar" :style="{ width: token.$value }" />
          </div>
          <code>--nb-spacing-{{ name }}</code>
          <span class="tv-spacing-value">{{ token.$value }}</span>
        </div>
      </div>
    </template>

    <!-- ── Animation ─────────────────────────────────────────────── -->
    <template v-if="!section || section === 'animation'">
      <h2>Animation Durations</h2>
      <div class="tv-anim-list">
        <div
          v-for="[name, token] in animationEntries"
          :key="name"
          class="tv-anim-item"
        >
          <code>--nb-animation-{{ name }}</code>
          <span class="tv-anim-value">{{ token.$value }}</span>
        </div>
      </div>
    </template>
  </template>
</template>

<style scoped>
.tv-error {
  color: var(--vp-c-danger-1);
  padding: 1rem;
}
.tv-loading {
  color: var(--vp-c-text-2);
  padding: 1rem;
}

/* Palette */
.tv-palette-group {
  margin-bottom: 2rem;
}
.tv-palette-name {
  text-transform: capitalize;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}
.tv-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tv-swatch {
  width: 72px;
  height: 56px;
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.tv-swatch-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.6);
}
.tv-swatch-label--dark {
  color: rgba(255, 255, 255, 0.8);
}

/* Semantic */
.tv-semantic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
  margin-bottom: 2rem;
}
.tv-semantic-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tv-semantic-swatch {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.tv-semantic-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tv-semantic-meta code {
  font-size: 11px;
}
.tv-semantic-value {
  font-size: 11px;
  color: var(--vp-c-text-2);
}

/* Type scale */
.tv-typeset-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}
.tv-typeset-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1rem 1.25rem;
}
.tv-typeset-specimen {
  margin: 0 0 0.5rem;
}
.tv-typeset-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

/* Font sizes */
.tv-scale-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.tv-scale-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.tv-scale-specimen {
  width: 60px;
}
.tv-scale-value {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

/* Spacing */
.tv-spacing-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.tv-spacing-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.tv-spacing-bar-wrap {
  width: 280px;
  display: flex;
  align-items: center;
}
.tv-spacing-bar {
  height: 20px;
  background: var(--vp-c-brand-1);
  border-radius: 3px;
  min-width: 2px;
  max-width: 280px;
}
.tv-spacing-value {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

/* Animation */
.tv-anim-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}
.tv-anim-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.tv-anim-value {
  font-size: 12px;
  color: var(--vp-c-text-2);
}
</style>
