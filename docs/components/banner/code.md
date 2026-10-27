---
layout: nubisco
title: Banner
intro: '`NbBanner` is a page-level message: a filled block that states something about the page or the task, sitting above or at the top of the content it concerns.'
source: src/components/Banner.vue
tab: code
pageTabs: ['usage', 'code']
---

## Inline or callout

The `variant` decides what the banner _is_, which in turn decides whether it can be dismissed.

An **inline** banner reports the outcome of something the user did. It has been read once it has been read, so it may carry a close button.

A **callout** states a standing fact that loads with the page: a trial expiring, a draft awaiting approval, an environment that is not production. Dismissing it would not make it untrue, so it cannot be dismissed. Passing `dismissible` to a callout does nothing, deliberately.

<preview>
  <div class="banner-stack">
    <NbBanner status="success" variant="inline" title="Changes requested" dismissible>The author has been notified.</NbBanner>
    <NbBanner status="info" variant="callout" title="This draft is waiting for approval" dismissible>Visitors still see the published version.</NbBanner>
  </div>
</preview>

```vue
<template>
  <!-- Reports an outcome, so it can be dismissed. -->
  <NbBanner status="success" title="Changes requested" dismissible>
    The author has been notified.
  </NbBanner>

  <!-- States a standing fact. `dismissible` is ignored. -->
  <NbBanner
    status="info"
    variant="callout"
    title="This draft is waiting for approval"
  >
    Visitors still see the published version.
  </NbBanner>
</template>
```

## With an action

Put the way to resolve the banner in the `action` slot. Keep it to one or two controls: a banner is not a toolbar.

<preview>
  <div class="banner-stack">
    <NbBanner status="warning" title="Rebuild not confirmed">
      The content is live in the API; the site may still serve old HTML.
      <template #action>
        <NbButton size="sm" variant="ghost">Check rebuild</NbButton>
        <NbButton size="sm" variant="primary">Retry</NbButton>
      </template>
    </NbBanner>
  </div>
</preview>

```vue
<template>
  <NbBanner status="warning" title="Rebuild not confirmed">
    The content is live in the API; the site may still serve old HTML.
    <template #action>
      <NbButton size="sm" variant="ghost" @click="check"
        >Check rebuild</NbButton
      >
      <NbButton size="sm" variant="primary" @click="retry">Retry</NbButton>
    </template>
  </NbBanner>
</template>
```

## In the shell

`flush` drops the radius and the side borders so the banner meets both edges of the region holding it. This is what `NbShell`'s [`#notification` slot](/components/shell/usage) expects.

```vue
<template>
  <NbShell>
    <template #notification>
      <NbBanner
        status="warning"
        variant="callout"
        flush
        title="Your trial expires in 3 days"
      >
        <template #action>
          <NbButton size="sm" variant="ghost" href="/billing">Upgrade</NbButton>
        </template>
      </NbBanner>
    </template>
  </NbShell>
</template>
```

## Props

| Prop          | Type                                                       | Default     | Description                                              |
| ------------- | ---------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `status`      | `'info' \| 'success' \| 'warning' \| 'error' \| 'neutral'` | `'info'`    | The tone. Picks the ground, the ink and the icon.        |
| `variant`     | `'inline' \| 'callout'`                                    | `'inline'`  | Reports an outcome, or states a standing fact.           |
| `title`       | `string`                                                   | —           | Short and declarative, no full stop.                     |
| `dismissible` | `boolean`                                                  | `false`     | Shows a close button. Ignored when `variant="callout"`.  |
| `icon`        | `string`                                                   | —           | Overrides the icon that `status` would pick.             |
| `hideIcon`    | `boolean`                                                  | `false`     | Removes the icon. Colour must then not be the only cue.  |
| `flush`       | `boolean`                                                  | `false`     | Drops the radius and side borders, for edge-to-edge use. |
| `closeLabel`  | `string`                                                   | `'Dismiss'` | Accessible label for the close button.                   |

## Slots

| Slot      | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `default` | The body text, rendered after `title` in the same paragraph. |
| `action`  | One or two controls that resolve the banner.                 |

## Events

| Event     | Payload | Description                            |
| --------- | ------- | -------------------------------------- |
| `dismiss` | —       | Emitted when the close button is used. |

## Icon and colour mapping

| Status    | Icon             | Ground                   | Ink                         |
| --------- | ---------------- | ------------------------ | --------------------------- |
| `info`    | `info`           | `--nb-c-info-surface`    | `--nb-c-on-info-surface`    |
| `success` | `check-circle`   | `--nb-c-success-surface` | `--nb-c-on-success-surface` |
| `warning` | `warning`        | `--nb-c-warning-surface` | `--nb-c-on-warning-surface` |
| `error`   | `warning-circle` | `--nb-c-danger-surface`  | `--nb-c-on-danger-surface`  |
| `neutral` | `note`           | `--nb-c-neutral-surface` | `--nb-c-on-neutral-surface` |

These are semantic surface tokens, distinct from `--nb-c-warning` and friends. Those are inks, strong enough to set a word in and far too strong to fill a block with. In dark mode the grounds become a translucent wash of the same colour so the banner sits on the page instead of punching a hole in it.

## Theming a single banner

Every rule reads from one pair of custom properties, so one banner can be retinted without reaching into the internals:

```css
.my-banner {
  --nb-banner-bg: var(--nb-c-layer-2);
  --nb-banner-fg: var(--nb-c-text);
  --nb-banner-border: var(--nb-c-layer-border-2);
}
```

## Accessibility

- `status="error"` renders `role="alert"` with `aria-live="assertive"`, so it interrupts. Every other status uses `role="status"` with `aria-live="polite"`.
- The title and body are one `<p>`, so a screen reader announces the banner as a single sentence rather than two fragments.
- The icon is `aria-hidden`; the text carries the meaning.
- The close button takes its accessible name from `closeLabel`.

<!--@include: ./_shared.md-->
