---
layout: nubisco
title: Message
intro: '`NbMessage` displays contextual feedback below (or inside) a form field: errors, warnings, successes, or helper hints. It pairs naturally with `NbTextInput`, `NbSelect`, and other form controls, but can also be used standalone anywhere feedback text is needed.'
source: src/components/Message.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview>
  <NbMessage variant="error">This field is required.</NbMessage>
  <NbMessage variant="warning">Value will be trimmed to 255 characters.</NbMessage>
  <NbMessage variant="success">Username is available.</NbMessage>
  <NbMessage variant="helper">Use dot-notation, e.g. <code>auth.login.title</code>.</NbMessage>
</preview>

```vue
<template>
  <NbMessage variant="error">This field is required.</NbMessage>
  <NbMessage variant="warning">Value exceeds limit.</NbMessage>
  <NbMessage variant="success">Username is available.</NbMessage>
  <NbMessage variant="helper">Use dot-separated notation.</NbMessage>
</template>
```
