---
layout: nubisco
title: Types, Interfaces & Enums
tabs: ['Overview', 'Shared types', 'Component types']
---

<doc-tab name="Overview">

All TypeScript contracts in Nubisco UI — props, options, enums — live in dedicated `.d.ts` files. Never inline a type, interface or enum inside a `.vue` file.

## Naming prefixes

Three prefixes make it immediately clear what a symbol is before you look it up:

| Prefix | Meaning                                                | Example                         |
| ------ | ------------------------------------------------------ | ------------------------------- |
| `I`    | Interface — describes the shape of an object           | `ISliderProps`, `IWithMessages` |
| `E`    | Enum — a fixed set of named string or numeric values   | `ESize`, `EVariant`             |
| `T`    | Type alias — a union, intersection, or primitive alias | `TActiveHandle`, `TJsonValue`   |

This convention applies everywhere: shared types, component types, and documentation-only imports.

## Where types live

Types are placed based on how widely they are shared:

```
src/
  types/           ← shared across multiple components
    Props.d.ts     — base interfaces for all input components
    Size.d.ts      — ESize, ESizeShort, ESizePixel enums
    Variants.d.ts  — EVariant enum
    Option.d.ts    — IOption, IOptionGroup
    Decoration.d.ts

  components/
    Slider.vue
    Slider.d.ts    ← types used only by Slider
    Select.vue
    Select.d.ts    ← types used only by Select
```

The rule: if two or more components share a type, it belongs in `src/types/`. If only one component uses it, it lives adjacent to that component as `ComponentName.d.ts`.

## Exports

Always use explicit named exports. No default exports, no re-exporting from index files unless intentional.

```ts
// ✓ correct
export { ESize, ESizeShort }

// ✗ avoid
export default ESize
```

</doc-tab>

<doc-tab name="Shared types">

These are the types every component author works with daily. They live in `src/types/` and are imported directly from their individual files.

## Props hierarchy

All input components build their prop interface by composing these base interfaces rather than redeclaring common fields. The hierarchy:

```
IDefaultProps
  └── IHumanInputComponent
        └── IFieldComponent
              ├── IWithLabel
              ├── IWithMessages
              └── IWithFieldAppearance
                    └── IReadableFieldComponent
```

### IDefaultProps

The root of every component. Provides the `id` prop.

<<< @../../src/types/Props.d.ts#IDefaultProps

### IWithMessages

Adds the three feedback message slots below a field.

<<< @../../src/types/Props.d.ts#IWithMessages

### IWithLabel

Adds the visible field label.

<<< @../../src/types/Props.d.ts#IWithLabel

### IWithFieldAppearance

Adds `variant` and `size` — the two most common presentation props.

<<< @../../src/types/Props.d.ts#IWithFieldAppearance

### IHumanInputComponent

Extends `IDefaultProps` with `name`, `disabled`, and `required`.

<<< @../../src/types/Props.d.ts#IHumanInputComponent

### IFieldComponent

Combines all four mixin interfaces. The baseline for text, number, and select inputs.

<<< @../../src/types/Props.d.ts#IFieldComponent

### IReadableFieldComponent

Extends `IFieldComponent` with a `readonly` mode.

<<< @../../src/types/Props.d.ts#IReadableFieldComponent

---

## Size enums

`ESize` covers the full seven-step scale. `ESizeShort` is the three-step version used by most interactive controls. `ESizePixel` provides numeric pixel values for icon and image dimensions.

<<< @../../src/types/Size.d.ts#ESize

<<< @../../src/types/Size.d.ts#ESizeShort

<<< @../../src/types/Size.d.ts#ESizePixel

---

## Variant enum

<<< @../../src/types/Variants.d.ts#EVariant

---

## Option types

`IOption` and `IOptionGroup` are used by any component that renders a list of selectable items — `Select`, `Radio`, and others.

<<< @../../src/types/Option.d.ts#IOption

<<< @../../src/types/Option.d.ts#IOptionGroup

</doc-tab>

<doc-tab name="Component types">

Every component that exposes a public API has an adjacent `.d.ts` file with the same name. These files contain everything that isn't shared: the component's own prop interface, any enums specific to its behaviour, and internal types that are worth making visible to consumers.

## File structure

```
src/components/
  Button.vue
  Button.d.ts    ← EButtonType, IButtonProps
  Select.vue
  Select.d.ts    ← ESelectStatus, ISelectProps
  Slider.vue
  Slider.d.ts    ← ISliderProps, TActiveHandle
```

## Composing from shared types

Component prop interfaces extend the shared base interfaces rather than redeclaring common props:

```ts
// src/components/TextInput.d.ts
import { IReadableFieldComponent } from '@/types/Props.d'

interface ITextInputProps extends IReadableFieldComponent {
  /** Maximum character count. Shows a counter when set. */
  maxLength?: number
}

export { ITextInputProps }
```

This keeps intellisense descriptions centralised — a change to `IWithMessages` propagates to every component that extends `IFieldComponent`.

## Adding regions for documentation

Any part of a `.d.ts` file can be pulled directly into a documentation page using VitePress's code snippet import with a named region. Mark the region with `#region` / `#endregion` comments:

```ts
// #region EAiLabelSize
enum EAiLabelSize {
  Small = 'sm',
  Medium = 'md',
  Large = 'lg',
}
// #endregion EAiLabelSize
```

Then inline it in a markdown page:

```md
\<<< @../../src/components/AiLabel.d.ts#EAiLabelSize
```

> [!TIP]
> Name the region after the symbol it wraps. This makes it self-documenting and easy to target from multiple pages if needed.

Region names are case-sensitive and must be unique within a file. A single symbol can only belong to one region.

</doc-tab>
