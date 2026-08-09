# Upgrading

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
