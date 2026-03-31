<template>
  <div class="content-tabs">
    <div class="content-tabs__header">
      <div
        ref="tablist"
        class="content-tabs__tab-list"
        role="tablist"
        @keydown="onKeydown"
      >
        <button
          v-for="tabLabel in tabLabels"
          :id="`tab-${tabLabel}-${uid}`"
          ref="buttonRefs"
          :key="tabLabel"
          role="tab"
          class="content-tabs__tab"
          :aria-selected="tabLabel === selected"
          :aria-controls="`panel-${tabLabel}-${uid}`"
          :tabindex="tabLabel === selected ? 0 : -1"
          @click="() => selectStable(tabLabel)"
        >
          <NbIcon
            :name="iconName(tabLabel)"
            color="var(--vp-content-tabs-tab-text-color)"
          />{{ tabLabel }}
        </button>
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, useId } from 'vue'
import { useStabilizeScrollPosition } from './useStabilizeScrollPosition'
import { useTabsSelectedState } from './useTabsSelectedState'
import { useTabLabels } from './useTabLabels'
import { provideTabsSingleState } from './useTabsSingleState'

const props = defineProps<{ sharedStateKey?: string }>()

const tabLabels = useTabLabels()

const { selected, select } = useTabsSelectedState(
  tabLabels,
  toRef(props, 'sharedStateKey'),
)

const tablist = ref<HTMLDivElement>()
const { stabilizeScrollPosition } = useStabilizeScrollPosition(tablist)
const selectStable = stabilizeScrollPosition(select)

const buttonRefs = ref<HTMLButtonElement[]>([])

const iconName = (label: string): string => {
  switch (label.toLowerCase()) {
    case 'preview':
      return 'eye'
    case 'code':
      return 'code'
    case 'api':
      return 'plugs'
    case 'params':
    case 'parameters':
      return 'toggle-right'
    case 'returns':
      return 'key-return'
    case 'design':
      return 'compass-tool'
    case 'notes':
      return 'note'
    case 'accessibility':
      return 'person-arms-spread'
    default:
      return 'info'
  }
}

const onKeydown = (e: KeyboardEvent) => {
  const currentIndex = tabLabels.value.indexOf(selected.value)
  let selectIndex: number | undefined

  if (e.key === 'ArrowLeft') {
    selectIndex =
      currentIndex >= 1 ? currentIndex - 1 : tabLabels.value.length - 1
  } else if (e.key === 'ArrowRight') {
    selectIndex =
      currentIndex < tabLabels.value.length - 1 ? currentIndex + 1 : 0
  }

  if (selectIndex !== undefined) {
    selectStable(tabLabels.value[selectIndex])
    buttonRefs.value[selectIndex]?.focus()
  }
}

const uid = useId()

provideTabsSingleState({ uid, selected })
</script>

<style lang="scss">
:root {
  --vp-content-tabs-tab-text-color: var(--vp-c-text-2);
  --vp-content-tabs-tab-active-text-color: var(--vp-c-text-1);
  --vp-content-tabs-tab-hover-text-color: var(--vp-c-text-1);
  --vp-content-tabs-tab-active-bg: var(--vp-c-bg);
}

.content-tabs {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  row-gap: 4px;
  border: solid 1px var(--vp-c-divider);
  &__header {
    display: flex;
    justify-content: flex-end;
  }
  &__tab-list {
    padding: 4px;
    display: flex;
    column-gap: 4px;
    overflow-x: auto;
    overflow-y: hidden;
  }
  &__tab {
    position: relative;
    padding: 0 12px;
    line-height: 48px;
    color: var(--vp-content-tabs-tab-text-color);
    font-size: 14px;
    font-weight: 400;
    white-space: nowrap;
    transition: color 0.25s;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    &[aria-selected='true'] {
      color: var(--vp-content-tabs-tab-active-text-color);
      font-weight: 600;
    }
    &:hover {
      color: var(--vp-content-tabs-tab-hover-text-color);
      background-color: var(--vp-content-tabs-tab-active-bg);
    }
  }
}
</style>
