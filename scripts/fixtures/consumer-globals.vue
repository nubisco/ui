<!--
  Stand-in for an external consumer's SFC, type-checked against the BUILT
  `dist/global.d.ts` by `scripts/verify-consumer-globals.mjs`.

  Our components are registered globally by the plugin, so a consumer never
  imports them. Vue's template checker resolves such a tag through exactly one
  name: `interface GlobalComponents` in module 'vue'. Up to and including
  1.56.0 the generator emitted `IGlobalComponents` instead. That is a
  well-formed module augmentation, it just augments an interface nothing reads,
  so every <Nb*> tag in every consumer template silently stayed `any` and no
  prop was ever checked. `verify-consumer-types` could not see it: that fixture
  imports named types directly, which never went through GlobalComponents.

  The `@vue-expect-error` probes below are what make this fixture meaningful.
  A plain "does it compile" template passes happily against `any`. These only
  pass when the tag genuinely resolves to the component, because `any` accepts
  the bad values and leaves the directives unused, which tsc reports as TS2578.
-->
<template>
  <!-- Resolves at all: a bad prop VALUE must be rejected. -->
  <!-- @vue-expect-error 'xs' is not an NbBadge size (sm | md) -->
  <NbBadge size="xs">nope</NbBadge>

  <!-- Resolves to the RIGHT component: NbButton's scale really is wider. -->
  <NbButton size="xxs">fine</NbButton>
  <NbButton size="xxl">fine</NbButton>
  <!-- @vue-expect-error 'huge' is not on NbButton's xxs-xxl scale -->
  <NbButton size="huge">nope</NbButton>

  <!-- No probe for an unknown attribute: Vue treats one as a fallthrough
       attr, so it is legitimately not a type error and would never fail. -->

  <!-- Valid usage must keep compiling, so the probes above cannot pass by
       breaking the component types outright. -->
  <NbBadge size="sm" variant="green">ok</NbBadge>
</template>
