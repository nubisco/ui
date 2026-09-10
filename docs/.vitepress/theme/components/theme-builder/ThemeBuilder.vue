<template>
  <div class="tb vp-raw">
    <!-- Identity -->
    <NbPanel class="tb__bar">
      <NbGrid dir="row" gap="md" align="end" wrap>
        <NbTextInput
          v-model="name"
          label="Theme name"
          size="sm"
          class="tb__name"
          @update:model-value="onNameInput"
        />
        <NbTextInput
          v-model="id"
          label="Identifier"
          size="sm"
          class="tb__id"
          :error="idError ?? undefined"
          helper="Used in the SCSS and selected at runtime."
        />
        <NbSelect
          v-model="sampleId"
          label="Start from"
          size="sm"
          class="tb__sample"
          :options="sampleOptions"
          @update:model-value="loadSample"
        />
        <NbButton variant="ghost" size="sm" @click="reset">Reset</NbButton>
        <NbButton
          variant="primary"
          size="sm"
          icon="download-simple"
          :disabled="!!idError"
          @click="download"
        >
          Export SCSS
        </NbButton>
      </NbGrid>
    </NbPanel>

    <div class="tb__body">
      <!-- Controls -->
      <div class="tb__controls">
        <!-- Which half am I editing? Stated, never inferred. -->
        <div class="tb__mode" role="group" aria-label="Editing which mode">
          <span class="tb__mode-label">Editing</span>
          <NbButton
            v-for="m in ['light', 'dark']"
            :key="m"
            size="sm"
            :variant="editing === m ? 'secondary' : 'ghost'"
            :aria-pressed="editing === m"
            @click="editing = m as 'light' | 'dark'"
          >
            {{ m === 'light' ? 'Light' : 'Dark' }}
          </NbButton>
          <span class="tb__mode-note">
            Edits apply to the {{ editing }} palette only.
          </span>
        </div>

        <!--
          Stage one: the palette.

          This is what a theme in this library actually is. Each named colour
          is expanded into the same seventeen-step ramp the library builds for
          its own colours, with a readable foreground for every step. Change
          one base here and every role pointing at that colour moves with it.
        -->
        <section class="tb__group">
          <h3 class="tb__group-title">Palette</h3>
          <p class="tb__note">
            Define the colours first. Every role below picks a step of one of
            them, which is how the built-in theme is put together.
          </p>
          <div v-for="color in palette" :key="color.id" class="tb__palette">
            <div class="tb__palette-head">
              <span class="tb__token-label">{{ color.name }}</span>
              <code class="tb__palette-id">{{ color.id }}</code>
              <NbTextInput
                :id="`tb-palette-${color.id}`"
                :model-value="color.base"
                :aria-label="`${color.name} base colour`"
                size="xs"
                class="tb__hex"
                @update:model-value="
                  (value: string) => setBase(color.id, value)
                "
              />
            </div>
            <!-- The generated ramp, shown rather than described. -->
            <NbColorStrip
              only-view
              :options="rampOptions(color.id)"
              :aria-label="`${color.name} ramp`"
              class="tb__strip"
            />
          </div>
        </section>

        <!--
          Stage two: the roles, each pointing at a step of a palette colour.
        -->
        <section
          v-for="group in visibleGroups"
          :key="group.title"
          class="tb__group"
        >
          <h3 class="tb__group-title">{{ group.title }}</h3>
          <div v-for="token in group.tokens" :key="token.key" class="tb__token">
            <span class="tb__token-text">
              <span class="tb__token-label">{{ token.label }}</span>
              <span class="tb__token-hint">{{ token.hint }}</span>
            </span>
            <div class="tb__token-controls">
              <NbSelect
                :id="`tb-color-${token.key}`"
                :model-value="colorOf(token.key)"
                :options="colorOptions"
                :aria-label="`${token.label} palette colour`"
                size="xs"
                class="tb__color-select"
                @update:model-value="
                  (value: string) => setRoleColor(token.key, value)
                "
              />
              <!--
                Every step of that colour. This is the part that makes it a
                theme rather than a list of hexes: the same colour, read at a
                different depth.
              -->
              <NbColorStrip
                v-if="colorOf(token.key) !== CUSTOM"
                :model-value="resolvedOf(token.key)"
                :options="rampOptions(colorOf(token.key))"
                :aria-label="`${token.label} step`"
                class="tb__strip"
                @update:model-value="
                  (value: string) => setRoleStep(token.key, value)
                "
              />
              <NbTextInput
                v-else
                :id="`tb-${token.key}`"
                :model-value="valueOf(token.key)"
                :aria-label="`${token.label} colour`"
                size="xs"
                class="tb__hex"
                @update:model-value="
                  (value: string) => setToken(token.key, value)
                "
              />
              <!--
                What the role resolves to, and the foreground the library will
                pair with it. The second swatch is the whole point of the -a11y
                counterpart, so it is shown rather than left implicit.
              -->
              <span class="tb__resolved">
                <!-- The colour it resolves to; which step it is, is the select. -->
                <code class="tb__resolved-value">{{
                  resolvedOf(token.key)
                }}</code>
                <span
                  v-if="A11Y_ROLES.includes(token.key)"
                  class="tb__a11y"
                  :style="{
                    background: resolvedOf(token.key),
                    color: a11yOf(resolvedOf(token.key)),
                  }"
                  :title="`Readable foreground: ${a11yOf(resolvedOf(token.key))}`"
                >
                  Aa
                </span>
              </span>
            </div>
          </div>
        </section>

        <NbButton
          variant="ghost"
          size="sm"
          @click="showAdvanced = !showAdvanced"
        >
          {{ showAdvanced ? 'Hide' : 'Show' }} advanced tokens
        </NbButton>
      </div>

      <!--
        Preview and export, in the documentation's own tab control.
        Same component the `:::tabs` markdown container renders, so the
        builder reads as part of the site rather than as a bolted-on tool.
      -->
      <div class="tb__right">
        <ContentTabs class="tb__tabs">
          <ContentTab label="Preview">
            <!-- Preview -->
            <div
              ref="previewRef"
              class="tb__preview"
              :class="{ dark: editing === 'dark' }"
              :style="previewVars"
            >
              <div class="tb__preview-head">
                <span>Preview</span>
                <span class="tb__preview-mode">{{ editing }}</span>
              </div>
              <div class="tb__preview-body">
                <NbGrid dir="col" gap="md">
                  <NbGrid dir="row" gap="sm" wrap>
                    <NbButton variant="primary">Primary</NbButton>
                    <NbButton variant="secondary">Secondary</NbButton>
                    <NbButton variant="ghost">Quiet</NbButton>
                    <NbButton variant="danger">Delete</NbButton>
                  </NbGrid>

                  <NbGrid dir="row" gap="md" wrap>
                    <NbTextInput
                      model-value="Ada Lovelace"
                      label="Name"
                      helper="Helper text"
                      size="sm"
                      class="tb__field"
                    />
                    <NbTextInput
                      model-value="not-an-email"
                      label="Email"
                      error="That does not look like an email address."
                      size="sm"
                      class="tb__field"
                    />
                    <NbSelect
                      label="Role"
                      size="sm"
                      placeholder="Any role"
                      :options="roleOptions"
                      class="tb__field"
                    />
                  </NbGrid>

                  <NbGrid dir="row" gap="md" align="center" wrap>
                    <NbCheckbox model-value label="Send invitations" />
                    <NbSwitch model-value label="Email notifications" />
                  </NbGrid>

                  <NbPanel>
                    <NbGrid dir="col" gap="sm">
                      <strong>Nested panel</strong>
                      <NbCard>A card inside it, one layer deeper.</NbCard>
                    </NbGrid>
                  </NbPanel>

                  <NbDataTable
                    :columns="previewColumns"
                    :rows="previewRows"
                    row-key="id"
                    size="sm"
                    aria-label="Preview table"
                  >
                    <template #cell-status="{ row }">
                      <NbBadge
                        :variant="row.status === 'Active' ? 'green' : 'blue'"
                      >
                        {{ row.status }}
                      </NbBadge>
                    </template>
                  </NbDataTable>

                  <NbGrid dir="row" gap="sm" wrap>
                    <NbMessage variant="success">Saved.</NbMessage>
                    <NbMessage variant="error">Could not save.</NbMessage>
                  </NbGrid>
                </NbGrid>
              </div>
            </div>
          </ContentTab>
          <ContentTab label="Code">
            <p class="tb__note">
              The file the export button downloads. It calls the same public
              mixin a consuming application calls, so nothing here is reachable
              only from the documentation.
            </p>
            <div class="language-scss tb__code-block">
              <span class="lang">scss</span>
              <pre class="tb__code"><code>{{ scss }}</code></pre>
            </div>
          </ContentTab>
        </ContentTabs>

        <!--
          Contrast sits under the preview, not beside the controls: it reports
          on what the preview is showing, so it belongs next to the evidence.
        -->

        <!-- Contrast feedback -->
        <section class="tb__group">
          <h3 class="tb__group-title">Contrast</h3>
          <p class="tb__note">
            Calculated for the <strong>{{ editing }}</strong> palette using the
            WCAG 2 relative-luminance formula. Passing these is not an
            accessibility audit; it checks these pairs and nothing else.
          </p>
          <table class="tb__contrast">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Ratio</th>
                <th>Needs</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in contrastChecks" :key="c.label">
                <td>{{ c.label }}</td>
                <td>
                  <code>{{ c.ratio }}:1</code>
                </td>
                <td>{{ c.threshold }}:1</td>
                <td>
                  <NbBadge :variant="c.pass ? 'green' : 'red'">
                    {{ c.pass ? 'Pass' : 'Fail' }}
                  </NbBadge>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="anyFailing" class="tb__warn">
            Some pairs fall short. You can still export: the file is yours, and
            nothing here rewrites a colour you chose.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The theme builder.
 *
 * Three things it deliberately does NOT do.
 *
 * It does not invent a second theming model. Every control writes a semantic
 * token the library already emits, the preview applies them the same way a
 * named theme does, and the export goes through the same public mixin a
 * consumer calls. What you see here is reachable from an application.
 *
 * It does not touch the documentation's own theme. The preview scopes its
 * tokens to one element, so editing a dark palette cannot make the controls
 * beside it unreadable, and the site's own mode and appearance stay where the
 * reader put them.
 *
 * It does not correct your colours. Failing contrast is reported before export
 * and the export still works: silently altering a chosen colour would make the
 * file disagree with the preview.
 */
import { computed, ref } from 'vue'
import ContentTabs from '../../../plugins/tabs/components/ContentTabs.vue'
import ContentTab from '../../../plugins/tabs/components/ContentTab.vue'
import {
  GROUPS,
  SAMPLE_THEMES,
  ALL_KEYS,
  A11Y_ROLES,
  TINTS,
  a11yOf,
  asRampRef,
  isValidId,
  isValidColor,
  resolveRole,
  shadesOf,
  slugify,
  toScss,
  type IPaletteColor,
  type ITheme,
  type TThemeTokens,
} from './themeModel'

/** The sentinel for "not a palette colour, a literal value". */
const CUSTOM = '__custom__'

const sampleOptions = SAMPLE_THEMES.map((t) => ({ label: t.name, value: t.id }))

const sampleId = ref(SAMPLE_THEMES[0].id)
const name = ref(SAMPLE_THEMES[0].name)
const id = ref(SAMPLE_THEMES[0].id)
const editing = ref<'light' | 'dark'>('light')
const showAdvanced = ref(false)

// The identifier follows the name until someone edits it by hand, after which
// it is theirs: retyping over a deliberate id on every keystroke is worse than
// leaving it stale.
let idTouched = false

const light = ref<TThemeTokens>({ ...SAMPLE_THEMES[0].light })
const dark = ref<TThemeTokens>({ ...SAMPLE_THEMES[0].dark })
const palette = ref<IPaletteColor[]>(
  SAMPLE_THEMES[0].palette.map((c) => ({ ...c })),
)

const colorOptions = computed(() => [
  ...palette.value.map((c) => ({ label: c.name, value: c.id })),
  { label: 'Custom colour', value: CUSTOM },
])

/** One palette colour's ramp, as swatch options. */
function rampOptions(colorId: string): string[] {
  const color = palette.value.find((c) => c.id === colorId)
  if (!color) return []
  const shades = shadesOf(color.base)
  return TINTS.map((tint) => shades[tint]).filter(Boolean)
}

function setBase(colorId: string, value: string) {
  if (!isValidColor(value)) return
  palette.value = palette.value.map((c) =>
    c.id === colorId ? { ...c, base: value } : c,
  )
}

/** Which palette colour a role points at, or the custom sentinel. */
function colorOf(key: string): string {
  return asRampRef(valueOf(key), palette.value)?.color ?? CUSTOM
}

/** The colour a role actually renders as, ramp reference or literal. */
function resolvedOf(key: string): string {
  return resolveRole(valueOf(key), palette.value)
}

/**
 * Moving a role to another colour keeps the STEP it was on.
 *
 * Switching an accent from teal to green should give the same depth of green,
 * not send it back to a default step and lose the shade the author chose.
 */
function setRoleColor(key: string, colorId: string) {
  const current = asRampRef(valueOf(key), palette.value)
  if (colorId === CUSTOM) {
    setToken(key, resolvedOf(key))
    return
  }
  setToken(key, `${colorId}-${current?.tint ?? 500}`)
}

/** A step is picked by its colour, so map the swatch back to its tint. */
function setRoleStep(key: string, value: string) {
  const colorId = colorOf(key)
  const color = palette.value.find((c) => c.id === colorId)
  if (!color) return
  const shades = shadesOf(color.base)
  const tint = TINTS.find(
    (t) => shades[t]?.toLowerCase() === value.toLowerCase(),
  )
  if (tint) setToken(key, `${colorId}-${tint}`)
}

const previewRef = ref<HTMLElement | null>(null)

const idError = computed(() =>
  isValidId(id.value) ? null : 'Lowercase letters, digits and hyphens only.',
)

const visibleGroups = computed(() =>
  GROUPS.filter((g) => showAdvanced.value || !g.advanced),
)

const current = computed(() => (editing.value === 'light' ? light : dark))

function valueOf(key: string): string {
  return current.value.value[key] ?? '#000000'
}

/**
 * Writes a role value: either a ramp reference (`accent-500`) or a literal
 * colour. Anything else is refused rather than stored, because both the
 * preview and the export read this map directly.
 */
function setToken(key: string, value: string) {
  const isRef = !!asRampRef(value, palette.value)
  if (!isRef && !isValidColor(value)) return
  current.value.value = { ...current.value.value, [key]: value }
}

function onNameInput(value: string) {
  if (!idTouched) id.value = slugify(value)
}

function loadSample(nextId: string) {
  const sample = SAMPLE_THEMES.find((t) => t.id === nextId)
  if (!sample) return
  light.value = { ...sample.light }
  dark.value = { ...sample.dark }
  palette.value = sample.palette.map((c) => ({ ...c }))
  name.value = sample.name
  id.value = sample.id
  idTouched = false
}

function reset() {
  loadSample(sampleId.value)
}

/**
 * The preview's tokens, as inline custom properties on one element.
 *
 * Scoped rather than written to `<html>` so the builder's own controls keep
 * the site's theme while the preview shows the theme being authored.
 */
const previewVars = computed(() => {
  const tokens = editing.value === 'light' ? light.value : dark.value
  const style: Record<string, string> = {}
  for (const key of ALL_KEYS) {
    const value = tokens[key]
    if (!value) continue
    const resolved = resolveRole(value, palette.value)
    if (!isValidColor(resolved)) continue
    style[`--nb-c-${key}`] = resolved
    /*
     * The readable foreground travels with the role, exactly as the exported
     * SCSS makes it travel. Without this the preview would take -a11y from
     * the documentation's own theme and show white text on a pale button
     * that the real theme would render readable.
     */
    if (A11Y_ROLES.includes(key)) {
      style[`--nb-c-${key}-a11y`] = a11yOf(resolved)
    }
  }
  // The surface tokens the layer classes normally re-point.
  const layer1 = resolveRole(tokens['layer-1'] ?? '', palette.value)
  const layer0 = resolveRole(tokens['layer-0'] ?? '', palette.value)
  if (isValidColor(layer1)) style['--nb-c-surface'] = layer1
  if (isValidColor(layer0)) style['--nb-c-bg'] = layer0
  return style
})

const theme = computed<ITheme>(() => ({
  id: id.value,
  name: name.value,
  palette: palette.value,
  light: light.value,
  dark: dark.value,
}))

const scss = computed(() => {
  try {
    return toScss(theme.value)
  } catch (error) {
    return `/* ${(error as Error).message} */`
  }
})

/* ── Contrast ─────────────────────────────────────────────────────────────
 * The library's SCSS a11y helpers are compile-time functions and cannot run
 * on a colour picked a moment ago, so the maths is repeated here. Same
 * formula, WCAG 2 relative luminance.
 */
function luminance(hex: string): number {
  const full =
    hex.length === 4
      ? '#' +
        hex
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      : hex
  const channels = (full.slice(1).match(/../g) ?? ['0', '0', '0']).map((h) => {
    const v = parseInt(h, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

interface ICheck {
  label: string
  ratio: string
  threshold: number
  pass: boolean
}

const contrastChecks = computed<ICheck[]>(() => {
  const raw = editing.value === 'light' ? light.value : dark.value
  // Roles hold references; contrast is a property of the colour they resolve
  // to, so resolve first and measure the real values.
  const t: Record<string, string> = {}
  for (const key of ALL_KEYS) {
    t[key] = resolveRole(raw[key] ?? '', palette.value)
  }
  const pairs: [string, string, string, number][] = [
    ['Body text on page', t.text, t['layer-0'], 4.5],
    ['Body text on panel', t.text, t['layer-1'], 4.5],
    ['Muted text on panel', t['text-muted'], t['layer-1'], 4.5],
    ['Subtle text on panel', t['text-subtle'], t['layer-1'], 4.5],
    ['Field rule on field', t['field-border'], t['field-bg'], 3],
    ['Focus ring on page', t['focus-ring'], t['layer-0'], 3],
    ['Danger on panel', t.danger, t['layer-1'], 3],
  ]
  return pairs
    .filter(([, fg, bg]) => isValidColor(fg ?? '') && isValidColor(bg ?? ''))
    .map(([label, fg, bg, threshold]) => {
      const value = ratio(fg, bg)
      return {
        label,
        ratio: value.toFixed(2),
        threshold,
        pass: value >= threshold,
      }
    })
})

const anyFailing = computed(() => contrastChecks.value.some((c) => !c.pass))

/* ── Export ───────────────────────────────────────────────────────────── */

function download() {
  if (idError.value) return
  const blob = new Blob([scss.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${id.value}.scss`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* ── Preview content ──────────────────────────────────────────────────── */

const roleOptions = [
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
]

const previewColumns = [
  { key: 'name', header: 'Member', width: '100%' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status', align: 'center' as const },
]

const previewRows = [
  { id: 1, name: 'Ama Boateng', role: 'Owner', status: 'Active' },
  { id: 2, name: 'Rui Marques', role: 'Admin', status: 'Invited' },
  { id: 3, name: 'Wen Li', role: 'Editor', status: 'Active' },
]
</script>

<style scoped lang="scss">
.tb {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-16);
  min-width: 0;
  container-type: inline-size;
}

.tb__bar {
  min-width: 0;

  :deep(.nb-grid) {
    flex-wrap: wrap;
    min-width: 0;
  }
}

.tb__name,
.tb__id,
.tb__sample {
  flex: 1 1 160px;
  min-width: 0;
}

.tb__body {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: var(--nb-spacing-16);
  align-items: start;
}

@container (max-width: 900px) {
  .tb__body {
    grid-template-columns: minmax(0, 1fr);
  }
}

.tb__controls {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-16);
  min-width: 0;
}

.tb__mode {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-8);
  flex-wrap: wrap;
}

.tb__mode-label,
.tb__group-title {
  font-size: var(--nb-font-size-12);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--nb-c-text-muted);
  margin: 0;
}

.tb__mode-note,
.tb__note {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-muted);
  margin: 0;
}

.tb__group {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-8);
}

.tb__token-row {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-8);
  cursor: pointer;
  min-width: 0;
}

.tb__token-controls {
  display: flex;
  align-items: center;
  gap: var(--nb-base-unit);
  margin-top: calc(var(--nb-base-unit) * 0.5);
}

.tb__color-select {
  width: 9.5rem;
  flex: none;
}

/* The palette: a base colour and the ramp it generates. */
.tb__palette {
  margin-bottom: calc(var(--nb-base-unit) * 1.5);
}

.tb__palette-head {
  display: flex;
  align-items: center;
  gap: var(--nb-base-unit);
  margin-bottom: calc(var(--nb-base-unit) * 0.5);
}

.tb__palette-id {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-subtle);
  margin-right: auto;
}

.tb__resolved {
  display: flex;
  align-items: center;
  gap: calc(var(--nb-base-unit) * 0.5);
  flex: none;
}

.tb__resolved-value {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-muted);
}

/*
 * The readable-foreground proof: the role's own colour with the foreground
 * the library will pair with it, so the -a11y counterpart is visible rather
 * than asserted.
 */
.tb__a11y {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.5rem;
  border-radius: var(--nb-radius-control-sm, 0);
  border: 1px solid var(--nb-c-border);
  font-size: var(--nb-font-size-12);
  font-weight: 600;
}

/* The ramp takes the room it needs; the exact value stays a fixed width. */
.tb__strip {
  flex: 1;
  min-width: 0;
}

.tb__hex {
  width: 11ch;
  flex: none;
}

.tb__hex :deep(input) {
  font-family: var(--nb-font-mono, ui-monospace, monospace);
}

.tb__token-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.tb__token-label {
  font-size: var(--nb-font-size-13);
  color: var(--nb-c-text);
}

.tb__token-hint {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tb__token-value {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-muted);
  flex-shrink: 0;
}

.tb__contrast {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--nb-font-size-12);

  th,
  td {
    text-align: left;
    padding: 4px 8px 4px 0;
  }

  th {
    color: var(--nb-c-text-muted);
    font-weight: 600;
  }
}

.tb__warn {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-muted);
  margin: 0;
}

/* The preview is its own painted world: it carries the authored tokens and
   must not inherit the page's surface. */
.tb__preview {
  min-width: 0;
  border: 1px solid var(--nb-c-border);
  background: var(--nb-c-layer-0);
  color: var(--nb-c-text);
  overflow: hidden;
}

.tb__preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: var(--nb-font-size-12);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--nb-c-text-muted);
  background: var(--nb-c-layer-1);
  border-bottom: 1px solid var(--nb-c-border);
}

.tb__preview-body {
  padding: var(--nb-spacing-16);
}

.tb__field {
  flex: 1 1 150px;
  min-width: 0;
}

/*
 * The right-hand column: the tabs, and the contrast report beneath them.
 * Contrast reads on what the preview shows, so it follows the evidence
 * rather than sitting among the controls that produced it.
 */
.tb__right {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 2);
  min-width: 0;
}

.tb__tabs {
  min-width: 0;
}

.tb__code-block {
  margin: 0;
}

.tb__code {
  max-height: 320px;
  overflow: auto;
  font-size: var(--nb-font-size-12);
  line-height: 1.5;
}
</style>
