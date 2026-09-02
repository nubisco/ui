# Upgrading

## To 3.0.1 from 3.0.0

Ports render as one element each instead of three. Nothing about how they look
or behave changes.

### What changed

A port was a slot `div`, a hit `button` and a pin `span`. It is now a single
`button` that carries `data-port`, is drawn at the hit size, and paints the
visible pin with `::before` at its centre. Fill, stripes, level and the event
pulse are all pseudo-element backgrounds rather than nested boxes. An inline
label is a child of the button, positioned outside its box.

A card with 16 I/O put 48 nodes in the tree and now puts 16. On a 41-card
session with 268 ports that is 886 port-related nodes down to 350.

### Why

On large sessions the port lanes were a measurable share of pan and zoom frame
cost, worst on zoom because consumers promote cards to cached compositor layers
and a scale change re-rasters every one of them, each carrying its ports.

### What to check

- **CSS bound to `.nb-blueprint-card__port-hit`.** Still works: it is retained
  as a second class on the same element. So is `.nb-blueprint-card__port`. They
  now name the same node, which means a rule intended for one applies to both.
  If you had different rules for each, merge them.
- **`.nb-blueprint-card__port-slot` is gone.** Nothing should have targeted it;
  it existed only to lay out a pin next to its label.
- **The port element is now 24&times;24 rather than 8&times;16.** If you were
  measuring it for anything other than its centre, measure `::before` or use
  the centre. The centre is unchanged and is what the wire layer uses.
- **The hit target now reaches about 8px back over the card's padding**, where
  before it stopped at the card edge. That area is empty by construction, but
  a host that draws its own content into the card's left or right padding
  should check.
- **A metered pin's level no longer tweens between values.** The fill is a
  gradient stop rather than an animated height. Consumers already quantise
  these values; if you were relying on the 90ms ease to smooth a noisy signal,
  smooth it at the source.

## To 3.0.0 from 2.9.x

The `'diamond'` pin shape is removed. That is the whole release.

### Breaking

`TBlueprintPortShape` is now `'pill' | 'square' | 'circle'`. A TypeScript
consumer passing `shape: 'diamond'` will fail to compile; at runtime such a pin
falls back to the default pill rather than breaking.

2.9.0 already stopped deriving the diamond from `dataType`, so by this point
the value only affected cards that asked for one by hand.

### Why

Shape is the target a user aims a wire at. A pin that changes form is a pin
they have to re-learn, and the diamond was the worst offender: it is the only
shape whose visual bounds did not match its box, and a rotated square converges
with a pill as soon as the canvas is zoomed out, which is where a node graph
spends much of its time. It was carrying a distinction that `signal` now
carries better, as a fill rather than a form.

### What to use instead

- To say what a port **carries**, use `signal` (`'analog' | 'digital'`, which
  renders solid or striped) or an explicit `color`. Neither disturbs the
  outline.
- To make one port stand out from its **immediate neighbours** on the same
  card, `'square'` and `'circle'` remain.

## To 2.9.0 from 2.8.x

Ports gained an analog / digital distinction, and stopped changing shape by
data type. Additive: no prop was removed and no port stops rendering, but MIDI
and control pins look different, so look at a canvas after upgrading.

### What changed

**No pin defaults to a diamond or a square any more.** `midi`, `control`,
`number`, `vector3`, `color` and `asset` all rendered as diamonds or squares;
every data type now renders as the same pill. A pin is the target a user aims a
wire at, and a target whose shape changes with its type is one they have to
re-learn per port. The shape was also the least robust way to carry the
difference: a rotated square converges with a pill as soon as the canvas is
zoomed out. `shape` is still honoured when set explicitly, so a consumer that
wants a diamond keeps one.

**`signal: 'analog' | 'digital'` replaces it**, defaulted from `dataType`.
Digital pins are striped and analog pins are solid. A stripe is a fill rather
than a form, so it survives scaling, and it leaves the colour channel to
`dataType`.

**Activity now depends on the kind.** An analog port fills in proportion to
`portLevels`. A digital port has no meaningful level, so it pulses once when it
enters `activePorts` instead. Pulsing is now digital-only; an analog port that
goes live without a level still takes the steady fill and halo.

**The pulse and the live halo take the pin's own colour.** They were drawn in
`--nb-c-port-signal`, a blue that belonged to neither the pin nor the node, so
a firing port read as a third thing happening near it.

| Where               | 2.8.x                           | 2.9.0                |
| ------------------- | ------------------------------- | -------------------- |
| `midi` pin shape    | Diamond                         | Pill, striped        |
| `control` pin shape | Diamond                         | Pill, striped        |
| `color` / `asset`   | Square                          | Pill, striped        |
| Pulse colour        | `--nb-c-port-signal` (blue)     | The pin's own colour |
| Live halo colour    | `--nb-c-port-signal` (blue)     | The pin's own colour |
| Pulse applies to    | Any port entering `activePorts` | Digital ports only   |

### Removed

`--nb-c-port-signal` is gone. It was added in 2.8.0 for the pulse and the halo,
both of which now use the pin's colour, so it had no remaining user. If you
referenced it, use `--pin-color` inside a port rule or the port's own `color`.

### What to check

- **Ports that relied on the derived diamond to mean something.** If a card
  distinguished MIDI from audio purely by the shape it got for free, that now
  comes from the stripe instead. It still reads, but it reads differently, so
  it is worth a look rather than an assumption.
- **`portLevels` on digital ports.** Harmless, but pointless: a level meter on
  an event stream is noise. Move those ports to `activePorts` and let them
  pulse.
- **Anything that pulsed and should not.** Pulsing is digital-only now. An
  analog port that was relying on entering `activePorts` to flash will hold a
  steady fill instead, which is the intended behaviour but is a visible change.

## To 2.8.0 from 2.7.x

`NbBlueprint` ports moved outside the card, and the wire layer now measures
the pin rather than a box that also contained the pin's label. Everything else
in this release follows from those two changes.

It ships in a minor, so a `^2` range picks it up on a routine update. No prop
was removed or renamed and no event stopped firing, but graphs will look
different and card bounding boxes changed size, so look at a canvas after
upgrading rather than after the next deploy.

### What changed

**Wires land on pins.** A wire endpoint is derived from the element carrying
`data-port`. That element used to be a flex row containing the pin _and_, when
`showPortLabels` was on, the inline label, so the endpoint sat at the centre
of pin + gap + label, up to 11.5px away from the pin it was supposed to touch.
The label is now a sibling, and the pin is the only thing in that box.

For the same reason, `size: 'sm'` and `size: 'lg'` are real dimensions instead
of `transform: scale()`. A scaled pin looked larger while keeping a medium
pin's box, so its endpoint and its hit area both stayed the wrong size.

**Pins sit outside the card.** They used to straddle the border, covering it
and any left-edge decoration for their full height. Outside, the card's border
stays continuous, the hit target never overlaps card content, and the pin is
unambiguous to aim at. This is the change with a real cost, in the table below.

**The port column is anchored to the top of the card.** It used to centre in
the card's height, which made a pin's Y a function of how tall the card
happened to be: expanding a card or adding a parameter row moved every wire
attached to it. Pins now start at `--nb-blueprint-port-top` and step by
`--nb-blueprint-port-pitch`.

**Drop targets exist.** While a wire is dragged, compatible pins ring and
incompatible ones dim. Nothing to wire up.

**The card is keyboard-operable.** It had no `tabindex`, no `aria-*` and no
focus styles at all; selection and connection were mousedown-only.

**Colour, type and radius come from tokens.** The card carried around fourteen
literal colours, including a `rgba(255, 255, 255, 0.015)` parameter-row fill
that is invisible on the light ramp, and its own 10px corner radius. It now
reads `--nb-c-port-*`, `--nb-c-status-*`, `--nb-c-node-row-bg` and
`--nb-radius-xs`, and the node colour is spent once, on a rail down the card's
left edge, instead of on the top bar, the category, every wired pin and the
toggle at the same time.

| Where              | 2.7.x                            | 2.8.0                                       |
| ------------------ | -------------------------------- | ------------------------------------------- |
| Pin position       | Straddling the card border       | Fully outside, flush with the outer edge    |
| Card bounding box  | The card                         | The card + 24px of port gutter on each side |
| Wire endpoint      | Centre of the port element's box | Centre of the pin                           |
| Port column origin | Centred in the card's height     | `--nb-blueprint-port-top` from the top      |
| Port pitch         | 6px gap, variable                | `--nb-blueprint-port-pitch`, 24px           |
| Hit target         | The 6&times;14 pin               | A 24&times;24 button behind it              |
| Card radius        | `10px`                           | `var(--nb-radius-xs)`                       |
| Category colour    | The node colour                  | `--nb-c-text-subtle`                        |
| Toggle "on" colour | The node colour                  | `--nb-c-primary`                            |
| Status indicator   | 6px colour-only dot with a glow  | 14px glyph, distinct per state              |
| Hover              | `translateY(-1px)` + drop shadow | Surface steps to `--nb-c-layer-hover-1`     |
| Active port        | Infinite 1s ring in `#38e0ff`    | Level fill, or one ping per event           |

### New API

All additive.

| Addition                                           | On                               | For                                                                  |
| -------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------- |
| `density`                                          | `NbBlueprint`, `NbBlueprintCard` | `'default'` or `'compact'`. Set once on the canvas; cards inherit.   |
| `portLevels`                                       | `NbBlueprintCard`                | `Record<string, number>`, 0 to 1. Listed pins render as meters.      |
| `dataType`                                         | `IBlueprintCardPortEvent`        | The pin's declared type, so the other end of a drag can validate it. |
| `dragOrigin`, `density`, `nudge`, `cancelPortDrag` | `IBlueprintCardContext`          | What the card needs to draw drop targets and route keyboard nudges.  |
| `--nb-radius-none`                                 | Theme                            | Completes the existing radius scale.                                 |
| `--nb-c-port-bg`, `-port-border`, `-port-signal`   | Theme                            | Port colours, previously literals in the component.                  |
| `--nb-c-status-valid`, `-warning`, `-error`        | Theme                            | Status foregrounds, held to 3:1 on every surface a card paints.      |
| `--nb-c-node-row-bg`                               | Theme                            | Parameter row fill.                                                  |

### What to check

- **Card spacing in your layouts.** This is the one that will bite. A card's
  visual box is now 24px wider on each side that has ports. If your positions
  were tuned so cards sat close together, adjacent cards' port gutters will
  now touch or overlap. Auto-layout inside the component already accounts for
  it; hand-authored coordinates and any spacing maths of your own do not.

- **Anything that measured a card element.** `getBoundingClientRect` on
  `.nb-blueprint-card` is unchanged, the gutters are absolutely positioned
  outside it, but if you were measuring a wrapper, or hit-testing against a
  card rectangle to decide what the pointer is over, the ports now sit outside
  the rectangle you were testing.

- **CSS that targeted `.nb-blueprint-card__port` for layout or interaction.**
  It is now the pin only, a `pointer-events: none` span inside a
  `.nb-blueprint-card__port-hit` button. Selectors that styled it still apply,
  but rules that positioned it, gave it a hover state, or bound a listener to
  it need to move to `.nb-blueprint-card__port-hit`.

  The one to check first is any rule that made ports inert, because it will
  now silently do nothing:

  ```css
  /* Before: disabled the port. After: disables a span that was already
     pointer-events: none, while the button behind it stays live. */
  .nb-blueprint-card__port {
    pointer-events: none;
  }

  /* After */
  .nb-blueprint-card__port-hit {
    pointer-events: none;
  }
  ```

- **Handlers typed against the old port-event shape.** The payload gained an
  optional `dataType`. If you asserted on the whole object (`toEqual` in a
  test, an exhaustive destructure), it now has one more key.

- **`--nb-card-glow`.** Still published on the card, so host CSS reading it
  keeps working, but the component no longer paints anything with it. If you
  were relying on the card's own radial wash, it is gone deliberately: it was
  invented to fake depth on a dark ground and it reads as a grey smudge on the
  light ramp.

- **Custom card headers.** `--nb-blueprint-port-top` lines the first pin up
  with the stock header. If you replaced the header through the default slot,
  set it to your own header's centre.

- **Reduced motion.** The card now honours `prefers-reduced-motion`. If your
  tests asserted on the port ping, it does not schedule under that preference.

### Keeping the old look

There is no flag for it, and the geometry changes are not separable from the
fixes. The nearest thing, if you need cards to occupy their old footprint
while you retune positions, is to shrink the gutter:

```css
.nb-blueprint-card {
  --nb-blueprint-port-hit: 8px; /* gutter matches the pin, as it used to */
}
```

That gives back the horizontal space at the cost of the comfortable hit target,
so treat it as a migration aid rather than a setting.

## To 2.6.0 from 2.5.x

The main region of `NbShell` is now the page ground. It paints layer 0, and the
first surface a page puts into it paints layer 1 instead of layer 2. Nothing was
renamed and no prop changed: this is a visual upgrade, and in most applications
it is the one you were working around.

It ships in a minor, so a `^2` range picks it up on a routine update. Look at a
couple of screens after upgrading rather than after the next deploy.

### What changed

`NbShell` resolved to layer 1 and provided that as the context for every one of
its slots, so a top-level `NbPanel` on a page painted **layer 2**, `#e7e8e9` in
the light theme. That is the darkest fill in the light ramp, sitting on a
near-white body, and one level deeper than the model the layer documentation
describes (ground 0, panel 1, nested section 2).

The chrome keeps its old depth. Topbar, menu strips, fixedbar and the shell body
still resolve to layer 1 and are pixel-identical, and a surface dropped into a
chrome slot still counts from there.

| Where                                    | 2.5.x   | 2.6.0   |
| ---------------------------------------- | ------- | ------- |
| Shell chrome (topbar, menu strips, body) | layer 1 | layer 1 |
| Shell main region                        | layer 1 | layer 0 |
| First `NbPanel` on a page                | layer 2 | layer 1 |
| Panel inside that panel                  | layer 3 | layer 2 |
| Surface in a `topbar-*` slot             | layer 2 | layer 2 |

In colours, a top-level panel goes from `#e7e8e9` to `#f9fafb` in the light
theme and from `#2d2e2f` to `#1e1f20` in the dark one, and the page behind it
from `#f9fafb` to `#edeeef` (light) and `#1e1f20` to `#0f1011` (dark).

### What to check

- **Surfaces you painted by hand inside a page.** If you wrote `#fff` (or any
  literal) on rows and cards to escape the too-dark panel, delete it and let the
  layer tokens do the work. That workaround now fights the ramp instead of
  rescuing it.
- **`.nb-layer-N` containers and `:layer` props inside `main`.** A number written
  to compensate for the old off-by-one is now one too deep. Containers still win
  over derivation, so nothing breaks, it just stays wrong. Delete the annotation
  and let nesting derive it.
- **Any CSS in your page that reads `var(--nb-c-surface)` directly.** Inside the
  main region that now resolves to layer 0, the ground. If the rule was painting
  a card, put it in an `NbPanel` or wrap it in `<NbLayer>`.

### Keeping the old look

Pin the page back to the chrome depth. This is a migration aid, not a
recommendation.

```vue
<NbShell>
  <NbLayer :level="2">
    <!-- panels in here paint 2, as they did in 2.5.x -->
  </NbLayer>
</NbShell>
```

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
