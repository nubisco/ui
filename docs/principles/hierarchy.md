---
layout: nubisco
title: Information hierarchy
description: How a page tells a person what matters most. Six ladders (layer, emphasis, type, spacing, position, colour), the rung each role gets on each, and the one rule they add up to.
---

A page that follows every token in this library can still read as a flat list
of equal boxes. Tokens say what a value is. They do not say which value a given
role gets, and without that every region picks the same rung, which is what a
consistent team does. This page is the missing half: for each of the six ways a
screen ranks things, the rung each role takes.

## The one rule

::: tip Every page has one loudest thing, and every region has one loudest thing
And each is loud on **at most two** of the six ladders below. A region that is
raised, wider, larger, bolder, filled and coloured is not important, it is
shouting, and the next region will learn to shout back.
:::

Pick the two ladders on purpose. The main region of a dashboard is usually the
widest and the only raised one (position and layer). A page title is the
largest type and has the most air above it (type and spacing). The primary
action is the only filled button (emphasis), and it does not also need to be
bigger.

If two things on one screen are equally loud, neither of them is the point, and
the reader has to work out which one is. That work is what "the page looks
uniform" means.

## Layer: a surface is a group

The [layer ramp](/theming) gives four planes, and depth is derived from
nesting, so a panel in a panel paints one plane deeper on its own. What the
ramp does not say is when to raise anything at all.

- **A surface change says "this is a group".** Raise a region because its
  contents belong together and apart from the rest, never to decorate it.
- **The ground is for content.** The page ground (`--nb-c-layer-0` in the
  shell's main region) is a real plane, and text, lists and form sections may
  sit straight on it.
- **At most one raised region per page**, and it is the thing the page is for.
  Everything else either sits on the ground or uses a flat tile.
- **At most two nested planes inside anything.** A panel, a well inside it, and
  stop. A third plane is almost always a missing heading.
- **Tiles that are regions of the page sit on the ground.** Use `flat` on
  `NbPanel` or `NbCard`: the border and the padding stay, no surface is
  painted, and the contents stay at the plane the tile sits on. A row of
  supporting tiles is flat, the one main region is raised.

```vue
<!-- One raised region, supporting tiles on the ground -->
<NbPanel title="Waiting on you">...</NbPanel>
<NbCardGrid min="280px">
  <NbPanel flat title="Recent changes">...</NbPanel>
  <NbPanel flat title="Due this week">...</NbPanel>
</NbCardGrid>
```

Overlays (modal, menu, popover) leave the plane and pin to layer 3. They are
temporary, and they are not part of this count.

## Emphasis: one filled button per region

| Rung      | Write                             | Use for                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Primary   | `variant="primary"`               | The one action the page or region exists for. Once per page header, once per region header.                 |
| Tertiary  | `variant="tertiary"`              | Primary outlined. A standalone action of lower rank: a sub-task, an independent action beside a primary.    |
| Secondary | `variant="secondary"`             | **Only beside a primary**, as its negative half: Cancel, Discard, Back. Never a standalone positive action. |
| Ghost     | `variant="ghost"`                 | Rows, toolbars and dashboard tiles. Icon buttons with a tooltip, per the row-action standard.               |
| Link      | `variant="link"`                  | An action that reads as part of a sentence.                                                                 |
| Danger    | `variant="danger"`, or `outlined` | Destructive controls only. Filled where it is the region's one action, outlined everywhere else.            |

- **One primary per page, in its header.** The page header (or `topbar-right`,
  see [The app frame](/patterns/app-frame)) carries it. See
  [Where the primary action goes](/patterns/team-management#where-the-primary-action-goes).
- **One filled button per region header.** A panel's own primary sits in its
  `#actions` slot. Two filled buttons in one header is a warning in
  development.
- **When the page header has a primary, regions step down.** Their actions
  become tertiary or ghost, so the page's own action stays the loudest.
- **Past three actions, prefer tertiary and ghost to secondary.** A row of
  heavy buttons is a toolbar that has lost its ranking.
- **Rows and tables use ghost icon buttons.** That is the row-action standard,
  and it is the one place a bare `ghost` is right. A labelled action anywhere
  else (an inspector's Bind, a form's Apply) is never bare ghost: it reads as
  grey text at rest. See [Building an inspector](/patterns/inspectors#controls-that-look-like-controls).

## Type: one size per role

A dense product page has three sizes doing the ranking, plus body, support,
label and meta. Each role gets exactly one set, and the components that render
a heading pick it for you, so a product cannot drift.

| Role                                        | Set               | Size | Rendered by                             |
| ------------------------------------------- | ----------------- | ---- | --------------------------------------- |
| Page title, the page's one `<h1>`           | `heading-03`      | 24   | `NbPageHeader`                          |
| Region title (a settings section, a column) | `heading-02`      | 20   | your `<h2>` with `.type-heading-02`     |
| Panel title                                 | `heading-01`      | 16   | `NbPanel` `title`                       |
| Row, card and list item title               | `heading-compact` | 14   | `NbCard` `title`, `NbContainedListItem` |
| Body                                        | `body-md`         | 14   |                                         |
| Support: a lede, a description, help text   | `body-sm`         | 12   | `description` props                     |
| Label: a field label, a column header       | `label-md`        | 12   | `NbField`, table headers                |
| Meta: a key, a timestamp, a count           | `label-sm`, muted | 11   | `key` and `#meta`                       |

No ranges. "`heading-02` or `heading-03`" for a section is how one product
ended up with four sizes for the title of a region. If a region seems to need a
size that is not its role's, it is a different role: a panel that has become the
page's main region is a region and takes `heading-02` in its own `<h2>`.

The large sizes do not get heavier as they grow. Size alone carries the rank,
and a 24px bold title in a dense app shouts over everything below it.

## Spacing: the gap states the relationship

| Between                                | Step       | Token                               |
| -------------------------------------- | ---------- | ----------------------------------- |
| Things inside one group (fields, rows) | `sm`, `md` | `--nb-spacing-8`, `--nb-spacing-16` |
| Groups inside one region               | `lg`       | `--nb-spacing-24`                   |
| Regions of the page                    | `xl`       | `--nb-spacing-32`                   |
| The headline region and its neighbours | one more   | `--nb-spacing-48` (`xxl`)           |

- **More space means more important.** The headline region gets one step more
  above and below than its siblings. A destructive section at the end of a
  settings page gets `xxl` before it, so it reads as apart.
- **Equal gaps say equal rank.** A column of panels 24px apart is a column of
  peers. If one of them is the point, the gaps should say so.
- **Space before lines.** A step of space separates two sections without a
  divider. Reach for a rule only when the space is not available.

The full scale, and the `gap` names, are on [Spacing and rhythm](/principles/spacing).

## Position: area is rank

- **The loudest region comes first and is the widest.** Top-left on a
  left-to-right page, full width or the larger column of a
  [`NbPageLayout`](/components/page-layout/usage).
- **Supporting regions are narrower and later**: the aside, or a row of tiles
  below the main region.
- **A row of equal tiles says "these are peers".** Never put the main thing in
  that row. It belongs above it, on its own.
- **Main and aside answer to the container**, not the viewport.
  `NbPageLayout` stacks below a container width, so a page inside the shell
  with an inspector open still reflows at the right moment.

## Colour: hue is status, never rank

Hue says what state a thing is in: [status indicators](/patterns/status-indicators)
own that, with one badge per page header and the carrier chosen by scope. Rank is
said by plane, size, weight, air and area.

- Brand colour appears on the one primary action and on focus. Nowhere else
  claims attention with it.
- A badge is never a heading's decoration. A coloured title is not a more
  important title.
- If you reach for a colour to make something important, you have run out of
  the other five ladders. Go back and use one of them.

## The three page shapes

Each of these is the rule above applied to one kind of page, with a demo built
from the components:

- [Dashboard](/patterns/dashboard): a summary strip, one raised main region,
  flat supporting tiles.
- [Settings](/patterns/settings): sections on the ground, one save model per
  section, the destructive section last and apart.
- [Record](/patterns/record): a sticky page header with one badge, the one or
  two things the record is always open, the rest disclosed with counts.

## See also

- [Layout and breakpoints](/principles/layout) for the grid and the container rule.
- [Spacing and rhythm](/principles/spacing) for the scale.
- [Typography](/principles/typography) for the type sets.
- [Colors](/principles/color) for the layer ramp and the role registry.
