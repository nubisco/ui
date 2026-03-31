<template>
  <!-- Grid demo mode: lean container for documentation styling only -->
  <template v-if="styleGrid">
    <div class="preview--grid-demo">
      <ClientOnly>
        <slot />
      </ClientOnly>
    </div>
  </template>
  <template v-else>
    <NbGrid dir="col" tabindex="-1" grow>
      <NbGrid
        dir="col"
        :class="classes"
        justify="around"
        tabindex="-1"
        :reverse="propsPosition === 'top'"
        grow
      >
        <NbGrid
          dir="col"
          :class="previewWrapperClasses"
          align="center"
          justify="center"
          :style="{ margin: 'var(--nb-base-unit)' }"
          gap="sm"
          tabindex="-1"
          grow
        >
          <NbGrid
            :dir="dir"
            gap="md"
            :style="{
              width: '100%',
              padding: 'var(--nb-base-unit)',
              ...(backgroundColor && { backgroundColor: backgroundColor }),
            }"
            :class="previewClasses"
            tabindex="-1"
            grow
          >
            <ClientOnly>
              <slot :resultingProps="reactiveValues" />
            </ClientOnly>
          </NbGrid>
        </NbGrid>
        <NbGrid
          v-if="props.props.length"
          class="preview--header"
          grow
          distributed
          tabindex="-1"
          :style="{ background: 'lightgrey', gap: '1px' }"
        >
          <template v-if="themeable">
            <NbSelect
              v-model="themeClass"
              variant="fluid"
              label="Theme selector"
              :options="[
                { label: 'light', value: 'light' },
                { label: 'dark', value: 'dark' },
              ]"
              name="theme-selector"
              :virtual="false"
            />
          </template>
          <template
            v-for="availableProp in props.props"
            :key="availableProp.name"
          >
            <template v-if="availableProp.type === 'single'">
              <NbSelect
                v-model="reactiveValues[availableProp.name]"
                variant="fluid"
                :label="availableProp.label ?? availableProp.name"
                :options="availableProp.options"
                :name="availableProp.name"
                :allowClear="availableProp.allowClear ?? true"
                :virtual="false"
                :placeholder="availableProp.placeholder"
              />
            </template>
            <template v-else-if="availableProp.type === 'multi'">
              <NbSelect
                v-model="reactiveValues[availableProp.name]"
                variant="fluid"
                :label="availableProp.label ?? availableProp.name"
                :options="availableProp.options"
                :name="availableProp.name"
                :allowClear="availableProp.allowClear ?? true"
                multiple
                :virtual="false"
                :placeholder="availableProp.placeholder"
              />
            </template>
            <!-- boolean -->
            <template v-else-if="availableProp.type === 'boolean'">
              <NbSelect
                v-model="reactiveValues[availableProp.name]"
                variant="fluid"
                :label="availableProp.label ?? availableProp.name"
                :options="[
                  { label: 'true', value: true },
                  { label: 'false', value: false },
                ]"
                :name="availableProp.name"
                :virtual="false"
                :placeholder="availableProp.placeholder"
              />
            </template>
            <!-- string -->
            <template v-else-if="availableProp.type === 'string'">
              <NbTextInput
                v-model="reactiveValues[availableProp.name]"
                variant="fluid"
                :label="availableProp.label ?? availableProp.name"
                :name="availableProp.name"
                :placeholder="availableProp.placeholder"
              />
            </template>
            <!-- number -->
            <template v-else-if="availableProp.type === 'number'">
              <NbNumberInput
                v-model="reactiveValues[availableProp.name]"
                variant="fluid"
                :label="availableProp.label ?? availableProp.name"
                :name="availableProp.name"
                :min="availableProp.min ?? 0"
                :max="availableProp.max ?? 100"
                :step="availableProp.step ?? 1"
                :placeholder="availableProp.placeholder"
              />
            </template>
            <!-- range -->
            <template v-else-if="availableProp.type === 'slider'">
              <NbSlider
                v-model="reactiveValues[availableProp.name]"
                variant="fluid"
                :label="availableProp.label ?? availableProp.name"
                :name="availableProp.name"
                :min="availableProp.min ?? 0"
                :max="availableProp.max ?? 100"
                :step="availableProp.step ?? 1"
                :placeholder="availableProp.placeholder"
              />
            </template>
            <template v-else-if="availableProp.type === 'color'">
              <NbColorStrip
                v-model="reactiveValues[availableProp.name]"
                variant="fluid"
                :label="availableProp.label ?? availableProp.name"
                :name="availableProp.name"
                :options="availableProp.options"
              />
            </template>
          </template>
        </NbGrid>
      </NbGrid>
      <NbGrid
        v-if="slots.footer"
        dir="col"
        class="footer"
        gap="xs"
        tabindex="-1"
      >
        <label for="preview-footer">FOOTER</label>
        <NbGrid
          id="preview-footer"
          gap="sm"
          align="center"
          class="footer-wrapper"
          tabindex="-1"
        >
          <slot name="footer" />
        </NbGrid>
      </NbGrid>
    </NbGrid>
  </template>
</template>

<script setup lang="ts">
import { computed, useSlots, provide, reactive, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vitepress'
import { PreviewProps, PreviewDirection } from './Preview.d'

const slots = useSlots()
const route = useRoute()
const router = useRouter()

provide('route', route)
provide('router', router)

const props = withDefaults(defineProps<PreviewProps>(), {
  demo: false,
  backgroundColor: undefined,
  dir: PreviewDirection.Column,
  raw: true,
  constrained: false,
  props: () => [],
  styleGrid: false,
  themeable: false,
  propsPosition: 'bottom',
})

const themeClass = ref('light')

const previewClasses = computed(() => {
  return themeClass ? { [themeClass.value]: true } : {}
})

const reactiveValues = reactive(
  props.props.reduce(
    (acc, prop) => {
      let defaultValue = prop.default
      switch (prop.type) {
        case 'boolean':
          defaultValue = defaultValue !== undefined ? defaultValue : false
          break
        case 'string':
        case 'color': // treat color as a string
          defaultValue = defaultValue !== undefined ? defaultValue : ''
          break
        case 'number':
          defaultValue = defaultValue !== undefined ? defaultValue : 0
          break
        case 'single':
          defaultValue =
            defaultValue !== undefined
              ? defaultValue
              : prop.options && prop.options.length
                ? prop.options[0].value
                : null
          break
        case 'multi':
          defaultValue = defaultValue !== undefined ? defaultValue : []
          break
        default:
          defaultValue = defaultValue !== undefined ? defaultValue : null
      }
      acc[prop.name] = defaultValue
      return acc
    },
    {} as Record<string, any>,
  ),
)

// watch for changes in props.props and update reactiveValues accordingly
watch(
  () => props.props,
  (newProps) => {
    newProps.forEach((prop) => {
      if (!(prop.name in reactiveValues)) {
        let defaultValue: any
        switch (prop.type) {
          case 'boolean':
            defaultValue = prop.default !== undefined ? prop.default : false
            break
          case 'string':
          case 'color':
            defaultValue = prop.default !== undefined ? prop.default : ''
            break
          case 'number':
            defaultValue = prop.default !== undefined ? prop.default : 0
            break
          case 'single':
            defaultValue =
              prop.default !== undefined
                ? prop.default
                : prop.options && prop.options.length
                  ? prop.options[0].value
                  : null
            break
          case 'multi':
            defaultValue = prop.default !== undefined ? prop.default : []
            break
          default:
            defaultValue = prop.default !== undefined ? prop.default : null
        }
        reactiveValues[prop.name] = defaultValue
      }
    })
  },
  { deep: true },
)

const classes = computed(() => ({
  preview: true,
  'vp-raw': props.raw,
  demo: props.demo,
  constrained: props.constrained,
}))
const previewWrapperClasses = computed(() => ({
  'preview-wrapper': true,
  [themeClass.value]: true,
}))
</script>

<style lang="scss" scoped>
.preview {
  position: relative;
  background: var(--nb-c-surface);
  &.constrained {
    overflow: hidden;
  }
  &-wrapper {
    position: relative;
    overflow: visible;
    padding: calc(var(--nb-base-unit) * 4);
    background: var(--nb-c-surface);
  }
  .configuration-wrapper {
    padding: 12px 20px;
    border-top: solid 1px var(--nb-c-field-border);
    background-color: var(--nb-c-surface);
    label {
      color: var(--nb-c-info);
      font-size: 11px;
    }
    .table-wrapper {
      max-height: 50vh;
      overflow-y: auto;
      .props-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: calc(var(--nb-base-unit) / 2);
        th,
        td {
          border: none;
        }
        th,
        td {
          padding: calc(var(--nb-base-unit) * 0.75);
        }
        th {
          text-align: left;
          position: sticky;
          top: 0;
          background: var(--nb-c-surface); // match the container background
          z-index: 1;
        }
        td {
          background-color: var(--nb-c-surface);
          code {
            padding: calc(var(--nb-base-unit) / 4);
            border-radius: calc(var(--nb-base-unit) / 2);
            background-color: var(--vp-code-bg);
            color: var(--nb-c-info);
            font-size: var(--nb-font-size-14);
            line-height: var(--nb-line-height-14);
          }
        }
        .prop-default {
          code {
            background-color: var(--vp-code-bg);
            color: var(--vp-code-color);
            &:hover {
              cursor: pointer;
              background-color: var(--vp-code-link-hover-color);
              color: white;
            }
          }
        }
      }
    }
  }
  &.demo .preview-wrapper {
    display: block;
    :deep(ul) {
      padding: 0;
    }
    :deep(li) + li {
      margin: 0;
    }
    > :deep(.NbGrid) {
      font-size: 12px;
      background: transparent;
      outline: dotted 1px var(--nb-c-info);
      color: var(--nb-c-info-a11y);
      > .NbGrid {
        font-size: 12px;
        background: linear-gradient(
          90deg,
          var(--nb-c-info) 0%,
          var(--nb-c-info-hover) 100%
        );
        color: var(--nb-c-info-a11y);
        outline: dotted 1px
          linear-gradient(
            90deg,
            var(--nb-c-info) 0%,
            var(--nb-c-info-hover) 100%
          );
        padding: 8px;
        border-radius: 8px;
        margin: 2px 0;
        transition: transform 0.2s ease-in-out;
        &:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        }
      }
      &.row,
      &.phone-small-row,
      &.phone-large-row,
      &.tablet-small-row,
      &.tablet-large-row,
      &.desktop-small-row,
      &.desktop-large-row {
        &:empty {
          min-height: 1rem;
        }
      }
      &.large {
        height: 8rem;
      }
      &.col,
      &.small,
      &.medium,
      &.large,
      &.xlarge,
      &.maximum {
        &:empty {
          min-height: 1rem;
        }
      }
      &.highlighted {
        border-style: solid;
      }
    }
  }
  .footer {
    background-color: var(--nb-c-field-bg);
    padding: 8px 16px;
    border-radius: 4px;
    border-top: solid 1px var(--vp-c-divider);
    label {
      color: var(--vp-code-lang-color);
      font-size: 10px;
    }
  }
}

/* Grid demo container styles */
.preview--grid-demo {
  padding: 2rem 8px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 1rem 0;
  position: relative;

  /* Boundary markers: light pink bars on left and right */
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #ffb3ba;
    z-index: 1;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  /* Grid demo row/col separators: dashed borders for visual structure */
  :deep(.grid-demo-row) {
    border: 1px dashed #ccc;
    padding: 8px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  /* Section labels */
  :deep(.grid-demo-label) {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Section descriptions */
  :deep(.grid-demo-description) {
    font-size: 14px;
    color: #888;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  /* Demo items: unified orange color as base */
  :deep(.grid-demo-item) {
    background: #fff3e0;
    border: 2px solid #ff9800;
    border-radius: 4px;
    padding: 8px 12px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: #f57c00;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    /* Compact variant for smaller items */
    &.demo-small {
      min-height: 30px;
      font-size: 12px;
      padding: 6px 8px;
    }
  }

  /* Span color scheme: multicolor for columns demo to show proportions */
  :deep(.grid-demo-item.span-1) {
    background: #e8f5e8;
    border-color: #4caf50;
    color: #2e7d32;
  }

  :deep(.grid-demo-item.span-2) {
    background: #fff3e0;
    border-color: #ff9800;
    color: #f57c00;
  }

  :deep(.grid-demo-item.span-3) {
    background: #fce4ec;
    border-color: #e91e63;
    color: #c2185b;
  }

  :deep(.grid-demo-item.span-4) {
    background: #f3e5f5;
    border-color: #9c27b0;
    color: #7b1fa2;
  }

  :deep(.grid-demo-item.span-5) {
    background: #e0f2f1;
    border-color: #009688;
    color: #00695c;
  }

  :deep(.grid-demo-item.span-6) {
    background: #e1f5fe;
    border-color: #00bcd4;
    color: #00838f;
  }

  :deep(.grid-demo-item.span-7) {
    background: #fff8e1;
    border-color: #ffc107;
    color: #f57f17;
  }

  :deep(.grid-demo-item.span-8) {
    background: #ffebee;
    border-color: #f44336;
    color: #d32f2f;
  }

  /* Order demo: highlight the reordered item */
  :deep(.grid-demo-item.order-first),
  :deep(.grid-demo-item.order-last) {
    background: #e3f2fd;
    border-color: #2196f3;
    color: #1565c0;
    font-weight: 700;
  }

  /* Visibility demo: hidden items */
  :deep(.grid-demo-item.hidden) {
    opacity: 0.25;
    text-decoration: line-through;
  }
}
</style>
