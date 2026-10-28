---
layout: nubisco
title: User Menu
intro: '`NbUserMenu` is the account menu every Nubisco product hangs off its shell: who you are signed in as, which other identities this browser holds, and the way out. It renders an avatar trigger and a panel teleported to `<body>`, so a sidebar with `overflow: hidden` cannot clip it.'
source: src/components/UserMenu.vue
tab: code
pageTabs: ['usage', 'code']
---

## Picture

Give `user.picture` an image URL, such as the platform's OIDC `picture` claim, and the trigger shows it instead of initials:

```vue
<NbUserMenu :user="{ email: me.email, name: me.name, picture: me.picture }" />
```

It is optional and it is allowed to fail. Without a picture, or when the image does not load, the trigger shows initials exactly as it did before. That second case is ordinary rather than exceptional: the platform gives a replaced avatar a new URL and answers the old one with a 404, so a product holding a stale URL would otherwise show a broken image. A new URL gets a fresh attempt.

## In a rail that expands

A bare avatar belongs in a collapsed rail, where every item is an icon. In an expanded rail, where every item above it is a labelled row, it floats out of line and does not say whose account it is. `trigger="identity"` follows the rail instead:

```vue
<template #sidebar-bottom>
  <NbUserMenu :user="user" trigger="identity" @sign-out="signOut" />
</template>
```

In an expanded rail it renders a row with the avatar, the name and the email, aligned to the menu items above it: the avatar's centre sits on the same line as their icons. In a collapsed rail it renders the avatar alone. It reads the rail's state from `NbShell`, so it changes when the rail does, with nothing to wire up. Outside a shell it shows the row. The row's accessible name is the visible name; nothing overrides it.

The default is `trigger="avatar"`, which is unchanged: a product that does not opt in renders exactly as before. Pair `identity` with [NbSidebarCollapseToggle](/components/sidebar-collapse-toggle/usage) and [useSidebarVariant](/composables/use-sidebar-variant), as the [app frame](/patterns/app-frame#expanding-and-collapsing-the-rail) describes.

## Appearance

Theme is a personal setting, so it belongs in this menu in every product. Set `show-theme` and the menu adds an **Appearance** section (Light, Dark, Match my system) bound to [`useTheme()`](/composables/use-theme), between the account switcher and the product entries. Do not build a theme block in the default slot. A hand-rolled one drifts from the menu's layout, which is how one product ended up with its "Theme" label squeezed to a single letter.

```ts
// main.ts: namespace the stored preference once, at start-up.
configureTheme({ storageKey: 'product.theme' })
```

```vue
<NbUserMenu :user="user" trigger="identity" show-theme />
```

The labels translate under `userMenu.APPEARANCE`, `userMenu.THEME_LIGHT`, `userMenu.THEME_DARK` and `userMenu.THEME_SYSTEM`. English and Portuguese ship built in.

## Elevated powers

Pass `role-badge` when the person is signed in with powers most people do not have, such as an instance operator or an admin. The avatar gets a ring in the warning colour, the menu header shows the label, and the trigger's accessible name carries it. It is a reminder to the person themselves that they can do more here than usual, so leave it unset for everyone else.

```vue
<NbUserMenu
  :user="user"
  trigger="identity"
  :role-badge="isOperator ? 'Operator' : undefined"
/>
```

## Product entries

The default slot sits above the Profile / Sign out group, behind its own divider. It receives `close`, so a product entry can dismiss the menu as it navigates.

```vue
<template>
  <NbUserMenu :user="user" v-slot="{ close }">
    <button
      class="my-entry"
      @click="
        close()
        go('/billing')
      "
    >
      Billing
    </button>
  </NbUserMenu>
</template>
```

## The Accord lockup

The foot of the panel names who holds the session: **Accord by Nubisco**, with the Nubisco mark at 13px beside the word Nubisco. Accord is the product that signs people in, and Nubisco is the company behind it. It is a signature, not a control. It is not a link, takes no tab stop, carries no ARIA role, and has no hover state, because right now there is nothing to link to.

`brand` is on by default, so upgrading gets you the lockup without changing anything.

::: warning White-labelling: this is an opt-out, not an opt-in

The default renders the **vendor's** brand inside **your** product. If the app is sold under a client's name, or is deployed to a customer's own domain, set `brand="none"` (or fill the `#brand` slot with the client's line) at the single place you mount `NbUserMenu`, and do it before the first release rather than after someone spots a foreign logo in their account menu.

```vue
<!-- White-label: no vendor signature anywhere in the menu. -->
<NbUserMenu :user="user" brand="none" />
```

We know the default is the wrong way round: nobody should have to opt out of another company's branding. It stays `'footer'` because flipping it would silently strip the footer from every Nubisco product already shipping one, which is a breaking change, so it is queued for the next major. The prop and the slot are stable either way, an app that sets `brand="none"` today keeps working after the flip.

:::

<preview dir="row">
  <NbUserMenu :user="{ email: 'jose@nubisco.io', name: 'José Silva' }" brand="footer" />
  <NbUserMenu :user="{ email: 'tools@nubisco.io' }" brand="none" />
</preview>

```vue
<template>
  <!-- Default: the lockup, after the last divider. -->
  <NbUserMenu :user="user" brand="footer" />

  <!-- White-label deployments, and hosts that are not Nubisco products. -->
  <NbUserMenu :user="user" brand="none" />
</template>
```

The mark is [`NbNubiscoMark`](/components/nubisco-mark/usage), the company's mark, and it sits beside the company's name and nowhere else. Placed at the start of the line it would read as Accord's logo, which it is not. Accord's own mark is not in this library: it belongs to the Accord app. The mark is inlined rather than fetched, so it cannot drift and cannot break when the network does. Until 5.41 the line read "Powered by Nubisco Platform" with `NbNubiscoPlatformMark`, before Accord replaced Platform.

The panel is teleported to `<body>`, so it follows the **site** theme rather than any local preview wrapper: use the theme switch in the header to check the lockup on both grounds. The mark is one asset in both themes, and the text is token-only. Against `--nb-c-layer-3`, the names ("Accord", "Nubisco") measure 13.94:1 light and 8.98:1 dark, and the "by" between them 10.51:1 and 7.01:1: comfortably past the 4.5:1 and 3:1 the lockup is held to.

`brand` is a string union rather than a boolean because a third mode, `'hub'`, is coming: the same lockup, but a real link to the Accord product page, once that page exists.

### Replacing the lockup

Products that must localise the lockup themselves, or restyle it to their own signature, use the `#brand` slot. It replaces the default lockup and keeps the divider above it.

```vue
<template>
  <NbUserMenu :user="user">
    <template #brand>
      <p class="acme-brand">An Acme company</p>
    </template>
  </NbUserMenu>
</template>
```

## Translations

Strings resolve in three steps: the host's global catalog under `userMenu.*` for the active locale, then the built-in default for the active language, then built-in English. English and Portuguese ship with the component; any other locale works by adding the keys to the host catalog, nothing in the library has to change.

```ts
createI18n({
  legacy: false,
  locale: 'de',
  messages: {
    de: {
      userMenu: {
        SIGNED_IN_AS: 'Angemeldet als',
        SIGN_OUT: 'Abmelden',
        poweredBy: 'Accord von Nubisco',
      },
    },
  },
})
```

"Accord" and "Nubisco" are names and stay untranslated inside the localised sentence, which is how the component knows what to emphasise and where the mark goes. A translation that drops both names renders wholly emphasised, the higher-contrast half of the pair, led by the mark.

## Props

| Prop                 | Type                         | Default       | Description                                                                                                              |
| -------------------- | ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `user`               | `IUserMenuUser`              | (required)    | The identity the product is signed in as. `{ email, name?, picture? }`. See [Picture](#picture).                         |
| `accounts`           | `IUserMenuAccount[]`         | —             | Identities signed in on this browser, rendered as an inline switch list.                                                 |
| `accountsUnknown`    | `boolean`                    | `false`       | The identities could not be determined. Renders a generic "Switch account" action instead of the list.                   |
| `showAccountActions` | `boolean`                    | `true`        | Hides the whole switch / add section for single-account products.                                                        |
| `showProfile`        | `boolean`                    | `true`        | Hides the Profile entry when the product has no profile page.                                                            |
| `brand`              | `'footer' \| 'none'`         | `'footer'`    | `'footer'` renders the non-interactive Accord lockup; `'none'` renders nothing.                                          |
| `placement`          | `'right-end' \| 'top-start'` | `'right-end'` | Where the panel opens relative to the trigger.                                                                           |
| `trigger`            | `'avatar' \| 'identity'`     | `'avatar'`    | `'identity'` follows the rail: a labelled row when expanded, the avatar alone when collapsed.                            |
| `roleBadge`          | `string`                     | —             | A label for elevated powers ("Operator"). Rings the avatar and shows the label. See [Elevated powers](#elevated-powers). |
| `showTheme`          | `boolean`                    | `false`       | Adds the built-in Appearance section bound to `useTheme()`. See [Appearance](#appearance).                               |
| `disabled`           | `boolean`                    | `false`       | Renders the trigger inert.                                                                                               |

## Events

| Event            | Payload   | Description                                               |
| ---------------- | --------- | --------------------------------------------------------- |
| `switch`         | `account` | An inline account row was chosen. The menu closes.        |
| `remove`         | `account` | The x on an account row was clicked. The menu stays open. |
| `switch-account` | —         | "Switch account" was chosen (accounts unknown).           |
| `add-account`    | —         | "Use another account" was chosen.                         |
| `profile`        | —         | The Profile entry was chosen.                             |
| `sign-out`       | —         | Sign out was chosen.                                      |
| `open` / `close` | —         | The panel opened or was dismissed.                        |

## Slots

| Slot      | Props            | Description                                                          |
| --------- | ---------------- | -------------------------------------------------------------------- |
| `default` | `close`          | Product entries, in their own section above Profile / Sign out.      |
| `trigger` | `open`, `toggle` | Replaces the avatar button.                                          |
| `brand`   | —                | Replaces the Accord lockup. Not rendered at all when `brand="none"`. |

## Exposed methods

| Member   | Type           | Description                |
| -------- | -------------- | -------------------------- |
| `open`   | `Ref<boolean>` | Current visibility.        |
| `toggle` | `() => void`   | Opens or closes the panel. |
| `close`  | `() => void`   | Closes the panel.          |

## Tokens used

| Token                                     | Applied to                                     |
| ----------------------------------------- | ---------------------------------------------- |
| `--nb-c-layer-3`, `--nb-c-layer-border-3` | Panel surface, border and dividers             |
| `--nb-c-layer-hover-3`                    | Row hover                                      |
| `--nb-c-text`                             | Email, account rows, "Accord", "Nubisco"       |
| `--nb-c-text-muted`                       | The "Powered by" prefix                        |
| `--nb-c-text-subtle`                      | Section label, account name, remove affordance |
| `--nb-c-primary`                          | Avatar fill                                    |
| `--nb-c-success` / `--nb-c-danger`        | Current-account check / sign out               |
| `--nb-zindex-menu`                        | Panel stacking                                 |
