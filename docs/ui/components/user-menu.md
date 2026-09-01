---
layout: nubisco
title: User Menu
tabs: ['Usage', 'Api']
---

<doc-tab name="Usage">

`NbUserMenu` is the account menu every Nubisco product hangs off its shell: who you are signed in as, which other identities this browser holds, and the way out. It renders an avatar trigger and a panel teleported to `<body>`, so a sidebar with `overflow: hidden` cannot clip it.

<preview dir="col">
  <!-- align-self keeps the trigger at its own width: the panel is anchored to
       the right edge of the component root, which a stretching flex column
       would otherwise widen to the full preview. -->
  <NbUserMenu
    :user="{ email: 'jose@nubisco.io', name: 'José Silva' }"
    style="align-self: flex-start"
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

## The Nubisco Platform lockup

The foot of the panel signs the product as part of Nubisco Platform: the Nubisco mark at 13px and the line **Powered by Nubisco Platform**. It is a signature, not a control. It is not a link, takes no tab stop, carries no ARIA role, and has no hover state, because right now there is nothing to link to.

`brand` is on by default, so upgrading gets you the lockup without changing anything.

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

The panel is teleported to `<body>`, so it follows the **site** theme rather than any local preview wrapper: use the theme switch in the header to check the lockup on both grounds. The mark is one asset in both themes, and the text is token-only. Against `--nb-c-layer-3`, "Nubisco Platform" measures 13.94:1 light and 8.98:1 dark, and the "Powered by" prefix 10.51:1 and 7.01:1: comfortably past the 4.5:1 and 3:1 the lockup is held to.

`brand` is a string union rather than a boolean because a third mode, `'hub'`, is coming: the same lockup, but a real link to the Nubisco Platform product page, once that page exists.

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
        poweredBy: 'Bereitgestellt von Nubisco Platform',
      },
    },
  },
})
```

"Nubisco Platform" is a product name and stays untranslated inside the localised sentence, which is how the component knows which half of the line to emphasise. A translation that drops the name renders wholly emphasised, the higher-contrast half of the pair.

## Placement

`right-end` (the default) opens the panel to the right of the trigger, aligned to its bottom, for a rail-style sidebar. `top-start` opens it above and left-aligned, for a trigger sitting at the bottom of a wide sidebar or in a header.

</doc-tab>

<doc-tab name="Api">

## Props

| Prop                 | Type                         | Default       | Description                                                                                            |
| -------------------- | ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `user`               | `IUserMenuUser`              | —             | The identity the product is signed in as. `{ email, name? }`.                                          |
| `accounts`           | `IUserMenuAccount[]`         | —             | Identities signed in on this browser, rendered as an inline switch list.                               |
| `accountsUnknown`    | `boolean`                    | `false`       | The identities could not be determined. Renders a generic "Switch account" action instead of the list. |
| `showAccountActions` | `boolean`                    | `true`        | Hides the whole switch / add section for single-account products.                                      |
| `showProfile`        | `boolean`                    | `true`        | Hides the Profile entry when the product has no profile page.                                          |
| `brand`              | `'footer' \| 'none'`         | `'footer'`    | `'footer'` renders the non-interactive Nubisco Platform lockup; `'none'` renders nothing.              |
| `placement`          | `'right-end' \| 'top-start'` | `'right-end'` | Where the panel opens relative to the trigger.                                                         |
| `disabled`           | `boolean`                    | `false`       | Renders the trigger inert.                                                                             |

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

| Slot      | Props            | Description                                                                    |
| --------- | ---------------- | ------------------------------------------------------------------------------ |
| `default` | `close`          | Product entries, in their own section above Profile / Sign out.                |
| `trigger` | `open`, `toggle` | Replaces the avatar button.                                                    |
| `brand`   | —                | Replaces the Nubisco Platform lockup. Not rendered at all when `brand="none"`. |

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
| `--nb-c-text`                             | Email, account rows, "Nubisco Platform"        |
| `--nb-c-text-muted`                       | The "Powered by" prefix                        |
| `--nb-c-text-subtle`                      | Section label, account name, remove affordance |
| `--nb-c-primary`                          | Avatar fill                                    |
| `--nb-c-success` / `--nb-c-danger`        | Current-account check / sign out               |
| `--nb-zindex-menu`                        | Panel stacking                                 |

</doc-tab>
