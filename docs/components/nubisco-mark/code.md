---
layout: nubisco
title: Nubisco Mark
intro: '`NbNubiscoMark` is the Nubisco mark itself: the three-leg gradient artwork, inlined as an SVG. It exists so no product has to keep its own copy of the logo. One mark ships with the library, every product renders that one, and it cannot drift between them.'
source: src/components/NubiscoMark.vue
tab: code
pageTabs: ['usage', 'code']
---

## Naming it, or hiding it

By default the mark is decorative: `aria-hidden`, not focusable, and silent to a screen reader. That is right whenever adjacent text already names the product, which is the common case in a header or a footer lockup.

Pass `title` when the mark carries the meaning on its own, for example a bare logo link with no visible label. It then renders as `role="img"` with an accessible name.

```vue
<template>
  <!-- Beside the word "Nubisco": announcing it twice helps nobody. -->
  <NbNubiscoMark :size="24" />
  <span>Nubisco</span>

  <!-- Alone in a header link: it needs a name. -->
  <a href="/"><NbNubiscoMark :size="24" title="Nubisco home" /></a>
</template>
```

## The file, for favicons and static HTML

Markup that is not Vue, a favicon, an email template, a splash screen, gets the same artwork as a file through the package exports map:

```ts
import corporateMark from '@nubisco/ui/assets/nubisco-mark.svg'
import platformMark from '@nubisco/ui/assets/nubisco-platform-mark.svg'
```

```html
<link rel="icon" href="/path/to/nubisco-mark.svg" type="image/svg+xml" />
```

Neither mark is ever fetched from a URL at runtime. The menu carrying the lockup is what people open when the platform is having a bad day, and a broken image there is worse than no lockup at all, so the artwork is inlined: about 2 kB gzipped, no request.

The component and the file are held to the same artwork by `pnpm run verify:marks`, which runs in CI and compares every path, gradient stop, offset, opacity and transform in one against the other. Change the drawing in one place only and the build fails, naming the mark and the part that drifted.

## Props

| Prop    | Type               | Default | Description                                                                                             |
| ------- | ------------------ | ------- | ------------------------------------------------------------------------------------------------------- |
| `size`  | `number \| string` | `20`    | Rendered edge length. A number is pixels; a string is passed to CSS as given.                           |
| `title` | `string`           | —       | Accessible name. Omit it when adjacent text already names the product: the mark is then hidden from AT. |

## Notes

- Both `NbNubiscoMark` and `NbNubiscoPlatformMark` take exactly these props.
- No events, no slots, no exposed methods. It is artwork.
- Colours are fixed brand gradients, deliberately not themed.
- Attributes fall through to the `<svg>` root, so `class` and `style` work as expected.
