---
layout: nubisco
title: Avatar
intro: '`NbAvatar` shows a person: their picture when there is one, their initials when there is not.'
source: src/components/Avatar.vue
tab: usage
pageTabs: ['usage', 'code']
---

```vue
<template>
  <NbAvatar name="Ana Costa" picture="https://example.test/ana.png" />
  <NbAvatar email="ivan@nubisco.io" size="sm" />
</template>
```

## A picture that fails to load shows initials

An avatar host can stop serving an address, for example when someone replaces their picture and the old URL starts returning 404. The avatar then shows initials instead of a broken image. A new `picture` gets a fresh attempt.

## Initials

The first letters of the first and last words of `name`, or the first two characters of the email's local part when there is no name. `NbUserMenu` uses the same rule, so a person has the same initials everywhere.
