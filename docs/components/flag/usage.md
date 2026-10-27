---
layout: nubisco
title: Flag
intro: '`NbFlag` renders country flag SVGs. Flags are loaded as async Vue components so they are code-split and only fetched when needed.'
source: src/components/Flag.vue
tab: usage
pageTabs: ['usage', 'code']
---

The `name` prop takes a two-letter ISO 3166-1 alpha-2 country code in lowercase (e.g. `pt`, `gb-sct`, `es`). The full list of available flags is below.

## Flags

<preview :props="availableProps" v-slot="{ resultingProps }" propsPosition="top">
  <ul class="flag-demo">
    <li
      v-for="(flag, flagIndex) in flagList.filter((item) => {
        if (resultingProps.search != '' && resultingProps.search.length >= 2) {
          return item.toUpperCase().includes(resultingProps.search.toUpperCase())
        }
        return true
      })"
      :key="flagIndex"
    >
      <span>{{flag}}</span>
      <div class="box">
        <NbFlag
          :name="`${flag}`"
          :size="resultingProps.size"
        />
      </div>
      <span v-if="flag.name"> {{flag.name}}</span>
    </li>
  </ul>
</preview>

<!--@include: ./_shared.md-->
