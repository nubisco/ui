---
layout: nubisco
title: Colour
description: The difference between a brand ramp and a semantic role, what every role in NubiscoUI means, how the -a11y inks work, and what a white-label product may override.
---

There are two colour vocabularies in this library and only one of them is yours.

A **ramp** is a named hue with seventeen tints: `--nb-c-grape-hyacinth-500` is a specific violet, and it is still that violet in a product owned by a green-branded insurer. A **role** is a job: `--nb-c-primary` is "the colour this product acts in". Roles point at ramps, and the pointing is the theme's business, not the application's.

Application code and component code name roles. Only `src/styles/_theme.scss` names ramps.

::: danger This is the rule the audit found broken
A white-label white-label product inherited a violet placeholder series in its charts, because `Charts/shared/palette.ts` listed eight ramp names and a comment claiming brand overrides propagated. They did not: the product did not own those ramps, so it hardcoded hex per chart and now no library upgrade can recolour it. Separately, the ghost button bound its hover border to `--nb-c-grape-hyacinth-200`, so a rebranded product had to name the vendor's brand colour in its own stylesheet to stop purple leaking on hover.

Both now go through roles (`--nb-c-chart-1` through `-8`, and `--nb-c-primary-subtle`). The rule exists so the next one does not happen.
:::

## The ramps

Eleven names live in the `$colors` map in `src/styles/variables/_colors.scss`. Names describe **what the colour looks like**, never what it is for, precisely so that nothing is tempted to use `emerald-reflection` as a synonym for "success".

| Ramp                 | Seed      | What the theme currently points at it                                                 |
| -------------------- | --------- | ------------------------------------------------------------------------------------- |
| `grape-hyacinth`     | `#5c35c4` | `--nb-c-primary`, `--nb-c-chart-1`, the sequential chart scale                        |
| `the-blues-brothers` | `#214da6` | `--nb-c-info`, `--nb-c-chart-2`, the low end of the diverging scale                   |
| `emerald-reflection` | `#4acf7b` | `--nb-c-success`, `--nb-c-status-valid`, `--nb-c-chart-3`                             |
| `phoenix-flames`     | `#f59e0b` | `--nb-c-warning`, `--nb-c-status-warning`, `--nb-c-chart-4`                           |
| `chicken-comb`       | `#dc2626` | `--nb-c-danger`, `--nb-c-status-error`, `--nb-c-chart-5`                              |
| `nouveau-gray`       | `#6b7280` | the `--nb-c-component-*` chrome, `--nb-c-discrete`, neutral surfaces                  |
| `liberty-blue`       | `#4d4f8c` | `--nb-c-chart-6`                                                                      |
| `powder-blue`        | `#b5b8e7` | `--nb-c-chart-7`                                                                      |
| `plain-black`        | `#000000` | `--nb-c-black`, `--nb-c-contrast`, the light-theme `--nb-c-secondary`                 |
| `plain-white`        | `#ffffff` | `--nb-c-white`, `--nb-c-document`                                                     |
| `french-gray`        | `#a7a7a7` | nothing. It is a leftover, kept so removing it cannot break a consumer that named it. |

Each ramp emits `--nb-c-<name>-100` through `--nb-c-<name>-900` in steps of 50 (seventeen tints), plus an `-a11y` companion for each. The seed hex lands on whichever step matches its lightness, which is why `--nb-c-grape-hyacinth-500` is exactly `#5c35c4` while `--nb-c-grape-hyacinth-600` is a computed `rgb(75.37, 43.42, 160.58)`.

::: warning Generated tints are not clean values
Interpolated tints emit fractional rgb channels. `--nb-c-grape-hyacinth-100` is `rgb(222.843373494, 214.8554216867, 244.1445783133)`. Browsers round them fine, but never compare a computed style against a hex string in a test, and do not paste a tint into a design tool expecting a tidy number. The four-level [layer ramp](/theming) is defined as explicit hex values rather than generated tints for exactly this reason, on top of the contrast requirements it has to hit.
:::

## The role registry

Everything below is declared on `:root` in `src/styles/_theme.scss`. This is the whole colour surface of the library. If a colour you want is not here, see [Roles that do not exist yet](#roles-that-do-not-exist-yet) before inventing one.

### Surfaces and depth

Depth is a system of its own, described in [Theming, Layers](/theming). What matters here is which token to name.

| Token                                                           | Means                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-c-surface`                                                | The ground of the thing you are inside right now. It is re-pointed by `.nb-layer-0` to `-3`, so naming it makes your element follow its container's depth automatically. **This is the default answer for a background.** |
| `--nb-c-border`                                                 | The edge that matches `--nb-c-surface`. Always use the pair, never a layer border from a different level.                                                                                                                 |
| `--nb-c-surface-hover`                                          | The hover ground at the current depth. Distinct from every resting surface value, so a hovered row never reads as another layer.                                                                                          |
| `--nb-c-surface-raised`                                         | One step out from the current surface, for something that sits proud of it.                                                                                                                                               |
| `--nb-c-layer-0` .. `-3`                                        | The absolute levels. Name these only when you are the thing that decides depth, such as a shell region.                                                                                                                   |
| `--nb-c-layer-border-0` .. `-3`, `--nb-c-layer-hover-0` .. `-3` | The matching edges and hovers.                                                                                                                                                                                            |
| `--nb-c-bg`, `--nb-c-bg-soft`                                   | Page ground and the first surface on it (aliases of layer 0 and layer 1). Older spelling, still supported.                                                                                                                |
| `--nb-c-document`                                               | A paper-like ground for document content. Nothing in the library paints it; it exists for editor products that need a page that is not a UI surface.                                                                      |
| `--nb-c-contrast`                                               | Maximum contrast against the current theme's surfaces: black in light, near-white in dark. For a deliberate inversion, not for body text.                                                                                 |

### Text

Three tiers. All three are measured against every surface they can land on, including hover surfaces.

| Token                | On layer 1, light | On layer 1, dark | Use for                                                                                                                                       |
| -------------------- | ----------------: | ---------------: | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-c-text`        |         14.69 : 1 |        13.83 : 1 | Body copy, labels, anything a person reads to operate the interface.                                                                          |
| `--nb-c-text-muted`  |         11.07 : 1 |        10.80 : 1 | Secondary text: help under a field, timestamps, column headers.                                                                               |
| `--nb-c-text-subtle` |          7.15 : 1 |         6.94 : 1 | Genuinely non-essential text only. Held to AA, not AAA, and it drops to 4.50 : 1 on the darkest hover surface. Never put an instruction here. |

### Intent fills

These are **fills**: colours you set a background to, with the matching `-a11y` ink on top. They are sized for buttons and badges. They are not text colours (see the warning below).

| Token                                                       | Means                                                                                                                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-c-primary`                                            | The single action this screen wants. One per view. Also feeds `--nb-c-focus-ring` and the shell's sidebar accent.                                     |
| `--nb-c-primary-hover`, `-active`                           | Pointer over, and pointer down.                                                                                                                       |
| `--nb-c-primary-subtle`                                     | A pale wash of the brand for an edge drawn **on** a primary fill. One consumer today: the ghost button's hover border.                                |
| `--nb-c-secondary`                                          | The neutral action next to the primary one. A grey, not a second brand hue, and deliberately so: two saturated buttons side by side is two primaries. |
| `--nb-c-secondary-hover`, `-active`                         | As above.                                                                                                                                             |
| `--nb-c-success`                                            | A fill for an action whose meaning is completion. Not for reporting that something succeeded (that is a status surface).                              |
| `--nb-c-info`                                               | A fill for a neutral-informational action.                                                                                                            |
| `--nb-c-warning`                                            | A fill for an action with a reversible consequence.                                                                                                   |
| `--nb-c-danger`                                             | A fill for an action that destroys something. Pair it with a confirmation, never with colour alone.                                                   |
| each of the above `-hover`, `-active`, and `-a11y` variants | See [The -a11y system](#the-a11y-system).                                                                                                             |

::: danger A fill is not an ink
`--nb-c-warning` measures **2.06 : 1** against layer 1 in the light theme. As a background under `--nb-c-warning-a11y` it is fine. As a text colour it is illegible, and as a 1px outline it fails WCAG 1.4.11.

This is not hypothetical. `NbBadge`'s `orange` variant paints `color: var(--nb-c-warning)` on a 12% tint of the same colour, which measures **1.88 : 1** in light. `green` measures 2.79, `red` 3.84, `blue` 4.45. Only `primary` (6.01) and `grey` (8.86) clear AA. Treat that component's colour variants as a known defect rather than a pattern to copy: for coloured text on a surface use `--nb-c-status-*`, and for a filled block use a status surface pair.
:::

### Status: grounds, inks and glyphs

Three different jobs, three different sets. Picking the wrong set is the most common colour mistake in the fleet.

| Job                                  | Tokens                                                                                                           | Measured                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Fill a block and write in it         | `--nb-c-{info,success,warning,danger,neutral}-surface`, `--nb-c-on-{...}-surface`, `--nb-c-{...}-surface-border` | Ink on ground: 10.87, 8.04, 8.07, 10.28, 10.24 in light. Grounds sit 1.12 to 1.32 : 1 from layer 1, quiet enough not to shout. |
| Draw a glyph or outline on a surface | `--nb-c-status-valid`, `--nb-c-status-warning`, `--nb-c-status-error`                                            | 5.19, 5.20, 6.64 on layer 1 in light; 8.26, 8.89, 5.99 in dark. Safe on every layer.                                           |
| Fill an interactive control          | `--nb-c-success`, `-info`, `-warning`, `-danger` with their `-a11y` inks                                         | See the table in [The -a11y system](#the-a11y-system).                                                                         |

`NbBanner` is the reference consumer of the first set: it maps `status="warning"` to the ground, the ink, the border and an accent, and it ships an icon per status. `NbBlueprintCard` and `NbEmptyState` are the reference consumers of the second.

### Control chrome

Neutral colours for controls that are not carrying intent.

| Token                                    | Means                                                                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-c-component-plain`                 | An unselected, un-hovered control glyph: a checkbox outline, a slider track.                                                                                                     |
| `--nb-c-component-active`                | The same control while it is engaged.                                                                                                                                            |
| `--nb-c-component-inactive`              | The same control while it is off but still operable.                                                                                                                             |
| `--nb-c-component-disabled`              | Not operable. Pair with `--nb-field-disabled-opacity`, and make sure `disabled` or `aria-disabled` is on the element too.                                                        |
| `--nb-c-component-plain-border`          | The outline of a control that has no fill.                                                                                                                                       |
| `--nb-c-discrete`                        | A muted background for a de-emphasised interactive area.                                                                                                                         |
| `--nb-c-component-discrete-text`         | Text on that muted background.                                                                                                                                                   |
| `--nb-c-field-bg`, `--nb-c-field-border` | The input well and its edge. Distinct from `--nb-c-surface` so a field reads as somewhere you can type.                                                                          |
| `--nb-c-focus-ring`                      | The `:focus-visible` ring. Follows `--nb-c-primary`, so a rebrand moves it with everything else. Twenty-two call sites in the library. Never remove a ring without replacing it. |

### Absolutes and overlays

| Token                          | Means                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--nb-c-white`, `--nb-c-black` | Actual white and actual black, in both themes. Only for things that are physically that colour, such as a scrim base. Never as "the text colour". |
| `--nb-c-scrim`                 | The dim laid over the page by a modal or drawer. 45% black in light, 65% in dark.                                                                 |
| `--nb-c-scrim-strong`          | The heavier variant for a spotlight that must suppress the page behind it.                                                                        |

### Data and canvas

| Token                                                        | Means                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `--nb-c-chart-1` .. `-8`                                     | Categorical series roles, in assignment order. A series is "role 3", never "emerald". |
| `--nb-c-chart-sequential-from`, `-to`                        | The two ends of a one-hue magnitude ramp, interpolated at paint time.                 |
| `--nb-c-chart-diverging-low`, `-mid`, `-high`                | A two-hue scale meeting at a neutral zero. Cool to warm, not green to red.            |
| `--nb-c-port-bg`, `--nb-c-port-border`, `--nb-c-node-row-bg` | The node-graph canvas primitives used by `NbBlueprint`.                               |

Chart colour has its own rules (how many series colour can carry, what the measured separations are under colour-vision deficiency). Read [Charts, Colour](/ui/components/charts/color) before assigning a series a colour.

### Roles that do not exist yet

Say so rather than invent one. These are real gaps as of today:

- **No `--nb-c-status-info` or `--nb-c-status-neutral`.** The glyph tier covers valid, warning and error only. An informational glyph on a surface has to borrow `--nb-c-info`, which measures 5.25 : 1 on layer 1 in light but **4.42** in dark, so it is fine for a 24px icon and marginal for small text.
- **No `--nb-c-primary-surface` / `--nb-c-on-primary-surface`.** There is a full ground-and-ink pair for the four statuses and for neutral, but not for the brand. `NbBadge` hand-mixes `color-mix(in srgb, var(--nb-c-primary) 12%, var(--nb-c-surface))` because of it.
- **No selection role.** Selected rows and selected calendar days each solve it locally from `--nb-c-primary`.

## Choosing a colour for a new surface

Work down this list and stop at the first line that applies. It is ordered by how much the choice constrains you.

1. **Is it a background inside another surface?** `--nb-c-surface`, with `--nb-c-border` and `--nb-c-surface-hover` if it has an edge or reacts to a pointer. Do not name a numbered layer.
2. **Is it text?** `--nb-c-text`, dropping to `-muted` for supporting copy. `-subtle` only if nobody needs to read it.
3. **Does it report a state of the system?** Status surface trio for a block, `--nb-c-status-*` for a glyph or an outline.
4. **Is it a control the user operates?** `--nb-c-component-*` for the chrome, `--nb-c-field-*` for anything you type into.
5. **Is it the one action this screen exists for?** `--nb-c-primary` with `--nb-c-primary-a11y` on top, plus the hover and active pair.
6. **Is it data?** A chart role.
7. **None of the above?** You are probably describing a new role. Open an issue naming the role and what it means. Do not reach into a ramp, and do not write a hex value.

A worked example: a callout strip that marks a record as archived. It is a state of the system, it fills a block, and it is not an error, so it is the neutral status trio.

```vue
<template>
  <div class="archived-strip" role="status">
    <NbIcon name="archive" :size="16" aria-hidden="true" />
    <span>Archived on {{ date }}. Restore it to make changes.</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ date: string }>()
</script>

<style lang="scss" scoped>
.archived-strip {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-8);
  padding: var(--nb-spacing-12) var(--nb-spacing-16);
  background: var(--nb-c-neutral-surface);
  color: var(--nb-c-on-neutral-surface);
  border: 1px solid var(--nb-c-neutral-surface-border);
  border-radius: var(--nb-radius-sm);
}
</style>
```

Three properties, no theme conditional, no hex, and it works in dark because the tokens move and the markup does not.

::: danger Style blocks only
That `<style>` block sits **after** the template and script, inside the SFC. CSS placed above `<template>` is silently discarded by the compiler. That shipped broken for three releases here; `tests/sfc-styles.test.ts` now guards it. Never write component CSS anywhere else.
:::

## The -a11y system

### What it actually is

`--nb-c-primary-a11y` is not a lighter or darker primary. It is **the ink to put on primary**: either `#fff` or `#101010`, whichever has more contrast against the fill. The generator runs `color-contrast()` from `src/styles/logic/_a11y.scss` on every tint of every ramp, and the semantic roles alias the result.

```css
--nb-c-grape-hyacinth-500: #5c35c4;
--nb-c-grape-hyacinth-500-a11y: #fff; /* the ink, not a shade */
--nb-c-phoenix-flames-500: #f59e0b;
--nb-c-phoenix-flames-500-a11y: #101010; /* amber wants black */
```

The old version of this page called them "accessible shades", which is how they came to be misread. There are exactly two possible values.

### The pairing rule

Use an `-a11y` token **only as the foreground of the role it is named after, at the same step**.

```scss
/* correct: the ink belongs to the fill under it */
.commit-button {
  background: var(--nb-c-primary);
  color: var(--nb-c-primary-a11y);

  &:hover {
    background: var(--nb-c-primary-hover);
    color: var(--nb-c-primary-hover-a11y);
  }
}
```

```scss
/* wrong: an ink used as a decorative colour, on a ground it knows nothing about */
.hint {
  color: var(--nb-c-primary-a11y);
  background: var(--nb-c-surface);
}
```

The second snippet renders white text on a near-white surface in the light theme. The token is not "a colour that is accessible", it is "the colour that is accessible **on primary**".

### Where it currently breaks

The generator picks the better of black and white. Better is not the same as sufficient. Every pair below is measured off the compiled theme; the failures are all in the dark theme, because `.dark` re-points the fills to lighter tints without re-computing every ink.

| Pair                        |     Light |               Dark | Painted by                                        |
| --------------------------- | --------: | -----------------: | ------------------------------------------------- |
| `primary` / `-a11y`         |  7.60 : 1 |           4.71 : 1 | Button, Badge, DataTable, DatePicker, StepperStep |
| `primary-hover` / `-a11y`   |  9.70 : 1 | **3.76 : 1 fails** | Button, hover and focus outline                   |
| `primary-active` / `-a11y`  | 12.67 : 1 | **3.01 : 1 fails** | Button, active                                    |
| `secondary` / `-a11y`       |  8.52 : 1 |           8.86 : 1 | Button                                            |
| `success` / `-a11y`         |  5.76 : 1 |           8.86 : 1 | Button                                            |
| `info` / `-a11y`            |  5.48 : 1 | **3.74 : 1 fails** | Button                                            |
| `warning` / `-a11y`         |  8.86 : 1 |          10.25 : 1 | Button                                            |
| `danger` / `-a11y`          |  4.83 : 1 | **3.82 : 1 fails** | Button, NotificationCenter                        |
| `component-plain` / `-a11y` |  4.83 : 1 | **2.97 : 1 fails** | nothing today                                     |
| `discrete` / `-a11y`        | 11.64 : 1 | **2.15 : 1 fails** | nothing today                                     |
| `text-subtle` / `-a11y`     |  7.47 : 1 | **2.38 : 1 fails** | nothing today                                     |

::: warning What to do about it today
Four of those failures are live: they are what a dark-theme user sees on a hovered primary button, an info button and a danger button. Until the theme re-computes the missing inks, do not add new call sites for `--nb-c-*-hover-a11y` or `--nb-c-*-active-a11y`, and if you need a guaranteed-legible foreground on a coloured ground, use a status surface pair (`--nb-c-danger-surface` with `--nb-c-on-danger-surface`, 10.28 : 1) instead of a fill with an ink.

Re-measure any change to the fills with `node scripts/audit-contrast.mjs`.
:::

## Colour is never the only signal

WCAG 1.4.1 is the floor: colour may reinforce meaning, never carry it alone. Roughly one in twelve men cannot separate the green and red this system uses for success and danger, and nobody at all can separate them in a screenshot pasted into a ticket.

Every state you paint needs at least two of: a colour, a glyph, and a word.

- `NbBanner` ships an icon per status and takes a `title`. Its `hideIcon` prop exists for the case where the surrounding layout already carries the glyph, and its own prop documentation says so. Setting `hideIcon` on a status-coloured block with no other cue is a bug.
- A destructive action needs the word. `danger` styling on a button that says "Done" is a colour-only signal.
- A chart caps colour-only encoding at five series, and that number comes from measurement, not taste. See [Charts, Colour](/ui/components/charts/color).
- A loading state and an empty state are not the same state. One consuming app renders both through a single `.empty-text` element, so a failed fetch reads as "no contacts yet". Colour cannot fix that and neither can a spinner: the words have to differ.

The audit's sharpest finding on this is not about colour at all. Across twelve apps the commit action is labelled Save, Done, Apply or Create interchangeably, and the exit action Close, Cancel, Dismiss or Back. If the words are inconsistent, colour is the only thing left carrying meaning, and it is the one channel that does not survive a colour-blind user, a monochrome print, or a bright afternoon.

## Dark theme: roles flip, ramps do not

`--nb-c-grape-hyacinth-500` is the same violet in both themes. `--nb-c-primary` is not: under `.dark` it re-points from step 500 to step 400, because the 500 sits at 4.04 : 1 against the dark page ground and the 400 clears the same measurement the light theme makes.

That is the whole mechanism. The `.dark` class on `<html>` re-declares roles; it never re-declares a ramp. Which is why naming a ramp in a component is a dark-theme bug as well as a white-label bug: the value cannot move when the theme does.

**What `.dark` re-points:** the four layer levels with their borders and hovers; `--nb-c-surface`, `-raised`, `-hover`, `--nb-c-border`; all three text tiers; `--nb-c-field-bg`, `-border`; `--nb-c-primary` (with `-hover`, `-active`, `-a11y`), `--nb-c-secondary` (with `-hover`, `-active`, `-a11y`); the base of `--nb-c-success`, `-info`, `-warning`, `-danger`; all five status surface trios; `--nb-c-status-*`; the eight chart roles and both custom scales; the `--nb-c-component-*` chrome; `--nb-c-discrete`; `--nb-c-contrast`; the scrims.

**What it does not:** `--nb-c-white`, `--nb-c-black` (by definition), `--nb-c-primary-subtle`, and every `-hover-a11y` / `-active-a11y` ink. The last of those is the source of the failures tabulated above.

**Status surfaces work differently in dark.** In light they are ramp tints; in dark they are `color-mix(in srgb, <role> 16%, transparent)` over whatever surface they land on. A transparent ground is the only way one token can sit correctly on four layer levels. It also means you cannot measure them with a static tool: check them on the layer you actually paint them on.

Checking your work in dark takes two minutes:

```ts
import { useTheme } from '@nubisco/ui'

const { setTheme } = useTheme()
setTheme('dark')
```

`useTheme` holds a three-state preference (`light`, `dark`, `system`, defaulting to `system`), persists it, and follows the OS mid-session. Read [useTheme](/ui/composables/use-theme) before rolling your own toggle.

::: warning The library still has ramp names in it
Two chart components name ramps directly today: `Charts/InterpolationChart.vue` line 201 (`--nb-c-grape-hyacinth-500`) and `Charts/GanttChart.vue` lines 296 to 300 (five ramps for its status map). Those are the last five in `src/`, and they are bugs rather than precedent. More broadly, the style blocks across 93 SFCs hold 846 `var(--nb-c-*)` references against 74 raw hex and `rgba()` literals. Do not take the remaining literals as a licence.
:::

## Theming and white-label

### What you may override

The role layer, all of it, from your own stylesheet. No SCSS, no build step, no fork.

```css
/* your app's global stylesheet */
:root {
  --nb-c-primary: #1a7f4b;
  --nb-c-primary-hover: #166b40;
  --nb-c-primary-active: #115533;
  --nb-c-primary-a11y: #ffffff;
  --nb-c-primary-hover-a11y: #ffffff;
  --nb-c-primary-active-a11y: #ffffff;
  --nb-c-primary-subtle: #a8dcbf;
}

.dark {
  --nb-c-primary: #35b273;
  --nb-c-primary-hover: #4cc186;
  --nb-c-primary-active: #63d099;
  --nb-c-primary-a11y: #101010;
  --nb-c-primary-hover-a11y: #101010;
  --nb-c-primary-active-a11y: #101010;
}
```

Seven properties in light and six in dark, and the whole product moves: buttons, focus rings, the shell's sidebar accent, selected rows, the first chart series. Nothing in the library needs to know.

You may also override a role on any ancestor rather than on `:root`. `var()` and `color-mix()` resolve at paint time, so scoping a set of roles to one dashboard wrapper retints everything inside it, including SVG chart marks, with no re-render.

### The rebrand checklist

A rebrand that only sets `--nb-c-primary` leaves vendor colour in five places. Each of these is a real miss the audit found or a direct consequence of the token graph:

1. **The `-a11y` inks.** They are computed against the default fills. Change the fill, and the ink may need to flip. Check both themes with `node scripts/audit-contrast.mjs`.
2. **`--nb-c-primary-subtle`.** It does not derive from `--nb-c-primary` today, it aliases a ramp tint, so it stays violet unless you set it. That is deliberate (aliasing kept the rendered pixel identical when the leak was fixed) and it is scheduled to become `color-mix(in srgb, var(--nb-c-primary) 39%, var(--nb-c-white))` in the next major.
3. **The chart roles.** Eight properties, and they default to the Nubisco ramps. A product whose brand is not violet and does not set `--nb-c-chart-1` gets a violet first series.
4. **The shell chrome.** `--nb-shell-sidebar-bg` and the sidebar link states are `color-mix()` derivations of `--nb-c-primary`, so they follow a rebrand automatically. Verify rather than assume: a very light brand hue produces a rail that is no longer near-black.
5. **`--nb-c-secondary`.** It is a grey in both themes on purpose. If your brand has a genuine second colour, it belongs on the chart roles or on a role you introduce, not here. Two saturated buttons in a row is two primaries, whatever they are called.

Nothing in that list requires touching the library. If you find something that does, that is a missing role and worth an issue.

### What is internal

- **Ramp values.** `--nb-c-grape-hyacinth-500` and its siblings are the vendor's palette. Overriding one changes every role pointing at it, in ways the contrast audit has not measured. If you want new colours of your own, add a ramp (see the appendix) rather than repainting an existing one.
- **The layer ramps.** `--nb-c-layer-*` are explicit values chosen to hit measured separation and text-contrast targets in both themes. Repointing one silently breaks the guarantee that `--nb-c-text-subtle` clears AA on every surface. Retheme surfaces by overriding the four layer levels together, and re-run the audit.
- **`--nb-base-unit`.** Not colour, but the same trap: it rescales field heights, radii and shell geometry, and does **not** rescale the spacing scale. See [Spacing](/principles/spacing).
- **`$colors`, `$light`, `$dark` and the SCSS functions.** Compile-time internals. A consumer overriding CSS custom properties never needs them.

## Anti-patterns

Each of these was found in a shipped application.

| Instead of                                            | Do                                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `color: #5c35c4`                                      | `color: var(--nb-c-primary)`                                     |
| `background: var(--nb-c-grape-hyacinth-500)`          | `background: var(--nb-c-primary)`                                |
| `background: rgba(15, 15, 30, 0.95)` on a tooltip     | `background: var(--nb-c-layer-3)` with `color: var(--nb-c-text)` |
| `color: var(--nb-c-danger)` for error text on a card  | `color: var(--nb-c-status-error)`                                |
| `color: var(--nb-c-primary-a11y)` on a page surface   | `color: var(--nb-c-text)`                                        |
| A red dot as the only marker of a failed row          | A red glyph **and** the word "Failed"                            |
| `@media (prefers-color-scheme: dark) { color: #eee }` | Nothing. Name `--nb-c-text` once and let `.dark` do it           |
| A hardcoded chart hex per series                      | `var(--nb-c-chart-3)`                                            |

---

## Appendix: adding a colour to the library

This section is for contributors to NubiscoUI itself. Consumers never need it: a product adds colour by overriding roles, as above.

### 1. Name it

Names describe appearance, not purpose. Generate one from a hex value with the tool below; the original colour is the circle.

<color-steps-generator />

### 2. Add it to the map

`src/styles/variables/_colors.scss`:

```scss
$colors: (
  grape-hyacinth: #5c35c4,
  the-blues-brothers: #214da6,
  // ...
  ocean-drive: #0ea5e9,
);
```

### 3. What that generates

`_theme.scss` iterates `$palette` and emits, for each of the seventeen steps from 100 to 900:

```css
--nb-c-ocean-drive-500: #0ea5e9;
--nb-c-ocean-drive-500-a11y: #101010;
```

`make-shades()` in `src/styles/logic/_tints.scss` places the seed at the step matching its lightness and interpolates the rest. `color-contrast()` in `src/styles/logic/_a11y.scss` picks each `-a11y` ink by comparing the tint against white and against `#101010` and returning whichever wins. Nothing in that pipeline guarantees the winner clears 4.5 : 1; see the measured failures above.

### 4. Wire it to a role, or it does not exist

A ramp with no role is dead weight, which is what `french-gray` became. Point a role at the new ramp in `src/styles/_theme.scss`, in both the `base` and the `dark` mixin, and choose the dark step by measurement rather than by symmetry.

```scss
--nb-c-info: var(--nb-c-ocean-drive-500);
--nb-c-info-a11y: var(--nb-c-ocean-drive-500-a11y);
--nb-c-info-hover: var(--nb-c-ocean-drive-600);
--nb-c-info-hover-a11y: var(--nb-c-ocean-drive-600-a11y);
```

### 5. Measure before you open the PR

```bash
node scripts/audit-contrast.mjs
```

It compiles the theme, resolves every `--nb-*` property to a literal colour, and measures surface separation, border legibility and text on every layer, in both themes. `tests/layerContrast.test.ts` reads the same numbers through `scripts/lib/layerTokens.mjs` and fails CI on a regression. If your change moves a fill, state the new ratio in the PR the way the existing comments in `_theme.scss` do.
