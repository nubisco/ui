---
layout: nubisco
title: Skeleton
intro: '`NbSkeleton` stands in for content that is about to arrive, in the shape and at the size the real content will occupy. That last part is the whole component: a placeholder that is not the right height is worse than no placeholder, because the page settles twice, once when the skeleton appears and again when it is replaced.'
source: src/components/Skeleton.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<preview :props="availableProps" v-slot="{ resultingProps }">
  <NbSkeleton v-bind="resultingProps" />
</preview>

```vue
<template>
  <NbSkeleton v-if="loading" :lines="3" label="Loading description" />
  <p v-else>{{ description }}</p>
</template>
```

## When not to use one

- **The shape is unknown.** A skeleton is a promise about the layout. If the
  response might be empty, or a table might have any number of columns, use
  [`NbSpinner`](/components/spinner/usage) and do not promise.
- **A control that could simply be disabled.** A form waiting for its values is
  a form with disabled fields, not a stack of grey slabs. `NbTextInput`,
  `NbSelect` and `NbButton` all carry `disabled`, and a disabled control keeps
  its label, its help text and its place in the tab order, all of which a
  placeholder throws away. See
  [Disabled and read-only](/patterns/disabled-and-read-only).
- **A load with a measurable total.** That is
  [`NbProgressBar`](/components/progress-bar/usage), which can say how far along it
  is. A skeleton says nothing about time.
- **A refresh of content already on screen.** Replacing rendered rows with grey
  bars destroys what the user was reading. Leave the rows and put a
  [`NbSpinner`](/components/spinner/usage) with `overlay="container"` over them.
- **Loads that finish instantly.** A skeleton that flashes is a flicker. Gate it
  behind the same delay you would give a spinner.

<!--@include: ./_shared.md-->
