---
layout: nubisco
title: Icon
intro: '`NbIcon` renders SVG icons from the Phosphor icon set. Icons are loaded as async Vue components via a Vite virtual module, so only icons that are actually used end up in your bundle.'
source: src/components/Icon.vue
tab: usage
pageTabs: ['usage', 'code']
---

## Icons

<preview :props="availableProps" v-slot="{ resultingProps }" propsPosition="top">
  <ul class="icon-demo">
    <li
      v-for="(icon, iconIndex) in iconList.filter((icon) => {
        if (resultingProps.category && !icon.categories.includes(resultingProps.category)) return false
        if (resultingProps.search !== '' && resultingProps.search.length >= 2) {
          const q = resultingProps.search.toUpperCase()
          return icon.name.toUpperCase().includes(q)
            || icon.tags.some((t) => t.toUpperCase().includes(q))
        }
        return true
      })"
      :key="iconIndex"
      :class="{ copied: copiedIcon === icon.name }"
      @click="copyName(icon.name)"
    >
      <NbIcon
        :name="copiedIcon === icon.name ? 'check' : icon.name"
        :size="resultingProps.size"
        :color="resultingProps.color"
        :weight="resultingProps.weight"
        v-bind="{...(resultingProps.animation && {animation: resultingProps.animation})}"
      />
      <span class="icon-name">{{ icon.name }}</span>
      <div class="icon-overlay">
        <NbGrid dir="col">
          <span v-for="(category, categoryIndex) in icon.categories" :key="categoryIndex">{{ category }}</span>
        </NbGrid>
        <p v-if="icon.tags.length" class="icon-overlay-tags">{{ icon.tags.map(tag => `#${tag}`).join(', ') }}</p>
      </div>
    </li>
  </ul>
</preview>

<!--@include: ./_shared.md-->
