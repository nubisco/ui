---
layout: nubisco
title: User Menu
intro: '`NbUserMenu` is the account menu every Nubisco product hangs off its shell: who you are signed in as, which other identities this browser holds, and the way out. It renders an avatar trigger and a panel teleported to `<body>`, so a sidebar with `overflow: hidden` cannot clip it.'
source: src/components/UserMenu.vue
tab: usage
pageTabs: ['usage', 'code']
---

<preview dir="col">
  <!-- Trailing edge, which is where this lives in a real shell topbar. The
       panel anchors to the right edge of the component root, so a trigger
       pinned to the LEFT of a wide preview opened its panel away from it. -->
  <NbUserMenu
    :user="{ email: 'jose@nubisco.io', name: 'José Silva' }"
    style="align-self: flex-end"
  />
</preview>

```vue
<template>
  <NbUserMenu
    :user="{ email: 'jose@nubisco.io', name: 'José Silva' }"
    @profile="router.push('/profile')"
    @sign-out="auth.signOut()"
  />
</template>
```

## Accounts

Pass `accounts` when the product can enumerate the identities signed in on this browser: each one becomes a row, the current one is checked and inert, and the rest emit `switch`. Set `accountsUnknown` when that lookup failed, and the menu offers a generic **Switch account** action instead, so the identity provider can show its own chooser. Single-account products turn the whole section off with `:show-account-actions="false"`.

## Placement

`right-end` (the default) opens the panel to the right of the trigger, aligned to its bottom, for a rail-style sidebar. `top-start` opens it above and left-aligned, for a trigger sitting at the bottom of a wide sidebar or in a header.

On a phone (below 672px, or a touch phone held sideways) the rail is a drawer as wide as most of the screen, so `right-end` would open the panel past the right edge. There the panel always opens above the trigger, as `top-start` does, held 8px inside both screen edges. Desktops keep the placement you asked for.
