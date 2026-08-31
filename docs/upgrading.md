# Upgrading

## To 2.0.0 from 1.x

Every layer, text and field colour changed, in both themes, and surfaces now
work out their own depth instead of being told it. No component was removed and
no prop was renamed, so this upgrade is almost entirely visual: the things to
check are your token overrides and any place you hand-annotated a layer.

If you never override `--nb-c-*` and never wrote `.nb-layer-N`, upgrading is
just a version bump. Look at a couple of screens and move on.

### Why it changed

We audited the layer system against WCAG contrast targets and decided to
rebuild it: the ramp was not doing the job it existed to do.

- Muted text scored **3.62:1** on dark layer 3, below WCAG AA, and 4.82:1 on
  light layers 0 and 2.
- `--nb-c-text-subtle` was below AA on **every layer in both themes**, as low as
  2.22:1, and had never been measured at all.
- Text on hover surfaces was never measured. A hovered row is where muted text
  most often lives.
- Dark layers separated by 6.70 / 5.20 / 5.58 dL\*, flat and weakest in the
  middle, so nesting got harder to read as it got deeper.
- Light layer 2 was byte-identical to layer 0, and layer 3 to layer 1, so past
  one level of nesting the fill carried no depth information.
- `--nb-c-field-bg` was the same value as layer 0, so a field on the page had no
  fill boundary.
- Surfaces emitted as fractional `rgb(229.5, 229.5, 229.5)`, because they came
  from a lightness-stepped tint chain rather than chosen values.

Both text tiers now clear **AAA (7:1)** on all nine painted surfaces per theme:
four layers, four hover states, and the field. `--nb-c-text-subtle` clears AA on
the same nine. Run `node scripts/audit-contrast.mjs` in the repo to see the
current numbers against a published reference set.

### 1. Token values moved

If you override any of these, your value was chosen against the old ramp and
almost certainly no longer fits. Re-check each one.

**Light**

| Token                   | 1.x                           | 2.0       |
| ----------------------- | ----------------------------- | --------- |
| `--nb-c-layer-0`        | `rgb(229.5, 229.5, 229.5)`    | `#edeeef` |
| `--nb-c-layer-1`        | `#ffffff`                     | `#f9fafb` |
| `--nb-c-layer-2`        | `rgb(229.5, 229.5, 229.5)`    | `#e7e8e9` |
| `--nb-c-layer-3`        | `#ffffff`                     | `#f3f4f5` |
| `--nb-c-layer-border-0` | `rgb(191.25, 191.25, 191.25)` | `#a3a4a5` |
| `--nb-c-layer-border-1` | `rgb(191.25, 191.25, 191.25)` | `#9c9d9e` |
| `--nb-c-layer-border-2` | `#a7a7a7`                     | `#838485` |
| `--nb-c-layer-border-3` | `#cccccc`                     | `#818283` |
| `--nb-c-layer-hover-0`  | `#cccccc`                     | `#dcddde` |
| `--nb-c-layer-hover-1`  | `rgb(216.75, 216.75, 216.75)` | `#e2e3e4` |
| `--nb-c-layer-hover-2`  | `#cccccc`                     | `#d7d8d9` |
| `--nb-c-layer-hover-3`  | `rgb(216.75, 216.75, 216.75)` | `#e1e2e3` |
| `--nb-c-text`           | `#000000`                     | `#242526` |
| `--nb-c-text-muted`     | `rgb(92.9, 99.0, 111.1)`      | `#38393a` |
| `--nb-c-text-subtle`    | `#6b7280`                     | `#545556` |
| `--nb-c-field-bg`       | `rgb(229.5, 229.5, 229.5)`    | `#cacbcc` |
| `--nb-c-field-border`   | `rgb(127.5, 127.5, 127.5)`    | `#646566` |

**Dark**

| Token                   | 1.x                           | 2.0       |
| ----------------------- | ----------------------------- | --------- |
| `--nb-c-layer-0`        | `rgb(23.2, 24.7, 27.8)`       | `#0f1011` |
| `--nb-c-layer-1`        | `rgb(38.25, 38.25, 38.25)`    | `#1e1f20` |
| `--nb-c-layer-2`        | `rgb(46.4, 49.5, 55.6)`       | `#2d2e2f` |
| `--nb-c-layer-3`        | `rgb(58.1, 61.9, 69.4)`       | `#3d3e3f` |
| `--nb-c-layer-border-0` | `rgb(58.1, 61.9, 69.4)`       | `#434445` |
| `--nb-c-layer-border-1` | `rgb(69.7, 74.2, 83.3)`       | `#4d4e4f` |
| `--nb-c-layer-border-2` | `rgb(81.3, 86.6, 97.2)`       | `#595a5b` |
| `--nb-c-layer-border-3` | `rgb(92.9, 99.0, 111.1)`      | `#696a6b` |
| `--nb-c-layer-hover-0`  | `rgb(46.4, 49.5, 55.6)`       | `#1a1b1c` |
| `--nb-c-layer-hover-1`  | `rgb(58.1, 61.9, 69.4)`       | `#292a2b` |
| `--nb-c-layer-hover-2`  | `rgb(69.7, 74.2, 83.3)`       | `#38393a` |
| `--nb-c-layer-hover-3`  | `rgb(81.3, 86.6, 97.2)`       | `#313233` |
| `--nb-c-text`           | `rgb(216.75, 216.75, 216.75)` | `#eaebec` |
| `--nb-c-text-muted`     | `rgb(143.9, 150.0, 162.1)`    | `#d0d1d2` |
| `--nb-c-text-subtle`    | `#6b7280`                     | `#a7a8aa` |
| `--nb-c-field-bg`       | `#333333`                     | `#141516` |
| `--nb-c-field-border`   | `rgb(92.9, 99.0, 111.1)`      | `#626364` |

Two shape changes worth knowing when you re-pick values:

- **Dark hover reverses at layer 3.** Levels 0 to 2 lighten, level 3 darkens.
  There is no headroom above layer 3, and a hover lighter than it forces muted
  text toward white and collapses the gap between the two text tiers.
  Established dark ramps reverse at the top of the stack for the same reason.
- **Light alternates rather than descending.** Grey ground, lighter panel,
  darker nested section, lighter popover, so the theme stays light as surfaces
  stack. No two surfaces repeat, so every level of nesting still carries depth.

### 2. `--nb-c-bg` and `--nb-c-bg-soft` now follow the ramp

They used to carry independent values. They are now aliases:

```css
--nb-c-bg: var(--nb-c-layer-0);
--nb-c-bg-soft: var(--nb-c-layer-1);
```

If you override `--nb-c-layer-0` or `--nb-c-layer-1`, the background tiers move
with it. If you were relying on them differing from the layer ramp, set them
explicitly.

### 3. Nested surfaces now deepen on their own

This is the behaviour change most likely to show up on screen.

In 1.x, `--nb-c-surface` defaulted to layer 1 everywhere, so a `NbPanel` inside
a `NbPanel` painted the same colour, and a `NbModal` on a plain page also
painted layer 1. The only fix was to annotate every nesting site by hand.

In 2.0 a surface derives its level from how deeply it is nested. Concretely:

- `NbPanel` inside `NbPanel` now paints layer 1 then layer 2, not layer 1 twice.
- `NbModal` now paints layer 3 rather than layer 1.
- The same applies to `NbBoard`, `NbCalendar`, `NbDataTable`, `NbFileUploader`
  and `NbShellPanel`.

**Your existing `.nb-layer-N` markup still works and still means the same
thing.** A surface directly inside `.nb-layer-2` still paints exactly layer 2.
What changed is what happens _below_ that: a second surface nested inside the
first now goes one deeper instead of repeating.

So if you hand-annotated deep trees to work around the old behaviour, you now
have annotations fighting a mechanism that would have done it for you. Delete
the inner ones and keep the outermost:

```vue
<!-- 1.x: every level annotated because nothing was automatic -->
<div class="nb-layer-0">
  <NbPanel class="nb-layer-1">
    <NbPanel class="nb-layer-2">
      <NbPanel class="nb-layer-3">…</NbPanel>
    </NbPanel>
  </NbPanel>
</div>

<!-- 2.0: state the ground, let nesting do the rest -->
<div class="nb-layer-0">
  <NbPanel>
    <NbPanel>
      <NbPanel>…</NbPanel>
    </NbPanel>
  </NbPanel>
</div>
```

Both render identically. The second one keeps working when someone adds or
removes a level.

### 4. Setting a layer deliberately

Three ways, strongest first:

```vue
<!-- a prop, on components that paint a surface -->
<NbPanel :layer="2" />

<!-- a component that sets or resets context for its subtree -->
<NbLayer :level="0">
  <NbPanel />
</NbLayer>

<!-- the class, unchanged from 1.x -->
<div class="nb-layer-2"><NbPanel /></div>
```

And for your own surface-painting components:

```ts
import { useSurfaceLayer } from '@nubisco/ui'

const { layerProps } = useSurfaceLayer()
// bind layerProps on the element that paints the background
```

Pass `{ overlay: true }` for anything teleported (a popover, a floating menu) so
it pins to the top layer instead of inheriting the depth of whatever the
teleport target happens to sit in. `useLayer()` reads the current level without
claiming one.

### 5. `--nb-c-text-subtle` is an AA role now

It is held to **AA (4.5:1)**, not AAA, and that is deliberate. Muted text
already sits at 9.43:1 on the darkest light surface, so a third tier lighter
than muted and still above 7:1 has almost no room to exist and would stop
reading as a separate tier. That is the usual call for a helper-text tier.

Use it only for genuinely non-essential text. If you used `--nb-c-text-subtle`
for anything someone has to read to operate your interface, move that to
`--nb-c-text-muted`, which is AAA on every surface.

### Recommended upgrade order

1. Bump the version and run your app. Nothing should crash: no API changed.
2. `grep -rn "nb-c-layer-\|nb-c-text\|nb-c-field-\|nb-c-bg" src/` in your app.
   Every hit is an override written against the old ramp. Re-check each.
3. `grep -rn "nb-layer-" src/` in your app. Keep the outermost annotation on
   each tree, delete the ones below it, and confirm the tree still reads.
4. Look at your modals and popovers specifically. They moved from layer 1 to
   layer 3, which is the largest single visual change.
5. Check anything using `--nb-c-text-subtle` for essential text.

### If you need more time

Every value is a CSS custom property, so you can pin the old ramp on `:root`
and upgrade the rest of the release now, then move to the new values on your own
schedule:

```css
:root {
  /* the 1.x values verbatim, fractional channels and all */
  --nb-c-layer-0: rgb(229.5, 229.5, 229.5);
  --nb-c-layer-1: #ffffff;
  --nb-c-layer-2: rgb(229.5, 229.5, 229.5);
  --nb-c-layer-3: #ffffff;
  /* and the rest from the tables above */
}
```

This is an escape hatch, not a destination: the old values are the ones that
failed WCAG AA on muted text in both themes, and pinning them keeps those
failures. The contextual nesting in section 3 still applies, because that is
behaviour rather than colour.

## To 1.56.1 from 1.53.1-1.56.0

If you already upgraded to 1.53.1-1.56.0 and your type checker stayed green,
it was not telling you the truth, and this release is when the errors actually
arrive. Work through the 1.56.0 section below: it applies to you now.

Those releases restored the type declarations, but only for types you `import`
by name. Components registered globally by the plugin are never imported, so
they resolve through a different path: Vue's template checker looks up the
interface `GlobalComponents` in module `vue`, by that exact name.

We emitted the augmentation as `IGlobalComponents`, to satisfy an internal
lint rule requiring an `I` prefix on interfaces. That is a perfectly valid
module augmentation of an interface nothing reads. The result was that every
`<Nb*>` tag in every consumer template still resolved to `any`, and no prop on
any globally-registered component was checked at all.

So if you consume the components globally (`app.use(NubiscoUI)`) rather than
importing them one by one, none of the prop checking described below was ever
in effect for you. Expect the burst of errors on this upgrade instead.

Nothing about the components changed, at runtime or in their API. This release
only corrects the name of the emitted interface, and adds a build gate
(`verify:consumer-globals`) that type-checks a consumer template against the
built output so the name cannot drift again.

## To 1.56.0 from anything below 1.53.1

If you are coming from **1.52.x or earlier**, upgrading will surface TypeScript
errors that look like new breakage but are not. Nothing was removed from the
API. Types that were silently unenforced started being enforced, and two of
them were then corrected to match the components' real behaviour.

Read this section before you start deleting `size` props.

### Why errors appear

Every release up to and including 1.53.0 shipped a broken type surface. The
build never emitted the hand-written declaration modules (`DataTable.d.ts`,
`Size.d.ts`, `Props.d.ts` and 54 others), because TypeScript treats a `.d.ts`
input as already-emitted output and skips it. `dist/main.d.ts` re-exported
those modules anyway, so they resolved to nothing.

Under the usual `skipLibCheck: true` this failed **silently**. Imports still
worked, but every affected type degraded to `any`, and `any` accepts anything.
On 1.53.0 the number `42` was an acceptable `IDataTableColumn`.

**1.53.1** restored the missing declarations. Your types started being checked
for the first time, so pre-existing incorrect usage became visible all at once.
That is the source of nearly every error you will see.

### What to change

#### 1. `size="xs"` on components that never supported it

`ESizeShort` is `sm | md | lg` and always has been. It was never enforced, so
`size="xs"` was accepted on components that have no `xs` style at all.

**NbModal** is the common case. Its sizes come from a map of `sm | md | lg`
only. `size="xs"` matched no rule, leaving the dialog on its base `width: 100%`
with no `max-width`, so those modals have been rendering full width rather than
"extra small". Pick a real size:

```vue
<!-- before: no xs rule exists, renders full width -->
<NbModal size="xs" />
<!-- after -->
<NbModal size="sm" />
```

The same applies to `NbDataTable` and `NbPagination` (`sm | md | lg`).

#### 2. `size="xs"` on NbButton, which is now valid

`NbButton` is the opposite case. Its stylesheet has always implemented seven
sizes, but the prop was typed with the three-value scale, so four valid sizes
were rejected. **Since 1.55.0 the type matches the CSS** and the full scale is
accepted:

```vue
<NbButton size="xxs" />
<NbButton size="xs" />
<NbButton size="sm" />
<NbButton size="md" />
<NbButton size="lg" />
<NbButton size="xl" />
<NbButton size="xxl" />
```

If your buttons already used `size="xs"` and looked correct, they were correct.
Keep them.

#### 3. String literals on props typed with enums

A template attribute is a string literal, and a string literal is not
assignable to a string enum even when the values match, so `size="sm"` failed
against `size?: ESwitchSize` despite `ESwitchSize.Small === 'sm'`.

**1.56.0 fixed this across the library.** Every template-facing prop now
accepts its plain string value. No change is needed on your side beyond
upgrading, and existing enum-member call sites keep working:

```vue
<!-- now valid -->
<NbSwitch size="sm" />

<!-- still valid -->
<NbSwitch :size="ESwitchSize.Small" />
```

Props fixed in 1.56.0:

| Component         | Props                                  |
| ----------------- | -------------------------------------- |
| `NbAiLabel`       | `variant`, `size`                      |
| `NbBadge`         | `variant`, `size`                      |
| `NbButton`        | `type`                                 |
| `NbCheckboxGroup` | `direction`                            |
| `NbFileUploader`  | `status`, `variant`                    |
| `NbIcon`          | `weight`, `animationMode`, `animation` |
| `NbLabel`         | `size`                                 |
| `NbModal`         | `size`                                 |
| `NbProgressBar`   | `size`, `status`                       |
| `NbRadio`         | `direction`                            |
| `NbSwitch`        | `variant`, `size`                      |

`NbButton`'s `type` covers the native HTML button types, so a form submit
button works without a passthrough prop:

```vue
<NbButton type="submit">Save</NbButton>
```

### Recommended upgrade order

1. Upgrade to the latest version and run your type checker.
2. Expect a burst of errors. They are pre-existing incorrect usage becoming
   visible, not new regressions.
3. Fix `size` values against the table below. Do not silence errors by removing
   the prop, because that changes the rendering.
4. Re-run. Anything left is likely a genuine bug the old `any` types were
   hiding.

### Valid size values

| Component       | Accepted sizes                       |
| --------------- | ------------------------------------ |
| `NbButton`      | `xxs` `xs` `sm` `md` `lg` `xl` `xxl` |
| `NbSwitch`      | `sm` `md` `lg`                       |
| `NbModal`       | `sm` `md` `lg`                       |
| `NbDataTable`   | `sm` `md` `lg`                       |
| `NbPagination`  | `sm` `md` `lg`                       |
| `NbProgressBar` | `sm` `md`                            |
| `NbBadge`       | `sm` `md`                            |
| `NbLabel`       | `sm` `md`                            |
| `NbAiLabel`     | `sm` `md` `lg`                       |

### Known gap

The enums themselves (`ESwitchSize`, `EButtonType`, …) are not re-exported from
the package root, so `import { ESwitchSize } from '@nubisco/ui'` does not
resolve. Use the plain string values, which is the supported form, or reach an
enum through its component path (`@nubisco/ui/components/Switch`).
