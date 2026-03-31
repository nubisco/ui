---
layout: nubisco
title: z-Index
---

Nubisco UI uses a two-tier z-index system driven by CSS custom properties. All layers are declared as `--nb-zindex-*` variables on `:root` so host applications can shift the entire stack by overriding `--nb-zindex-root`.

## How it works

Every z-index value is a `calc()` expression relative to a named ancestor, not a hardcoded number. This means:

- **Changing `--nb-zindex-root`** shifts the whole stack — useful when embedding the UI inside an iframe or alongside a third-party shell with its own stacking.
- **Each layer chains off the one below it**, so inserting a new layer never requires renumbering the rest.

## Root context layers

These are the layers available in the standard page context, in ascending order:

| Variable                            | Computed value     | Purpose                                           |
| ----------------------------------- | ------------------ | ------------------------------------------------- |
| `--nb-zindex-root`                  | `0`                | Baseline. All others build on this.               |
| `--nb-zindex-inspector`             | `root + 1`         | Element inspector overlays.                       |
| `--nb-zindex-table-rows`            | `root + 1`         | Table row z-positioning.                          |
| `--nb-zindex-table-rows-fixed`      | `root + 2`         | Sticky/fixed table rows.                          |
| `--nb-zindex-table-rows-last-fixed` | `root + 3`         | Last sticky row, above the others.                |
| `--nb-zindex-tableheader`           | `root + 5`         | Sticky table header, above all rows.              |
| `--nb-zindex-select`                | `root + 10`        | Select panel.                                     |
| `--nb-zindex-dropdown`              | `root + 10`        | Dropdown panel.                                   |
| `--nb-zindex-pageheader`            | `dropdown + 1`     | Page-level header bar.                            |
| `--nb-zindex-splitviewhandle`       | `dropdown + 2`     | Split-view resize handle.                         |
| `--nb-zindex-debug`                 | `root + 15`        | Debug/inspector overlays, above all page content. |
| `--nb-zindex-titlebar`              | `root + 20`        | Application title bar.                            |
| `--nb-zindex-navigation`            | `root + 100`       | Main navigation (sidebar, top nav).               |
| `--nb-zindex-backdrop`              | `navigation + 200` | Modal backdrop scrim.                             |
| `--nb-zindex-modal`                 | `backdrop + 1`     | Modal dialog.                                     |
| `--nb-zindex-toast`                 | `modal + 50`       | Toast / notification. Always above modals.        |
| `--nb-zindex-tooltip`               | `modal + 100`      | Tooltip. Topmost layer.                           |

::: info Default values
With `--nb-zindex-root: 0` the concrete values are: inspector=1, tableheader=5, select/dropdown=10, pageheader=11, splitviewhandle=12, debug=15, titlebar=20, navigation=100, backdrop=300, modal=301, toast=351, tooltip=401.
:::

## Modal context layers

Components that open overlays (select panels, dropdowns) use `<Teleport>` to escape the DOM subtree, which means they cannot inherit a z-index re-scoped on the modal element. To handle this, a separate set of variables is provided for use **inside a modal**:

| Variable                     | Computed value | Purpose                                  |
| ---------------------------- | -------------- | ---------------------------------------- |
| `--nb-zindex-modal-select`   | `modal + 10`   | Select panel opened from within a modal. |
| `--nb-zindex-modal-dropdown` | `modal + 10`   | Dropdown opened from within a modal.     |
| `--nb-zindex-modal-debug`    | `modal + 11`   | Debug overlay within a modal context.    |

Components that are modal-aware (e.g. `NbSelect`) should automatically switch to the modal-context variable when rendered inside an `NbModal`. This is typically handled by a `provide`/`inject` flag set by the modal.

## Overriding the root

To shift the entire Nubisco stack above a third-party layer:

```css
:root {
  --nb-zindex-root: 1000;
}
```

All other variables recompute automatically via `calc()`.

## Adding a new layer

Edit `src/styles/variables/_layout.scss` and add an entry to `$zIndexesRoot` (or `$zIndexesModal` for modal-context overlays). Chain it off the nearest semantic ancestor rather than using an absolute number:

```scss
$zIndexesRoot: (
  // ...
  my-overlay: #{calc(var(--nb-zindex-dropdown) + 5)} // ...
) !default;
```

This generates `--nb-zindex-my-overlay` on `:root` automatically.
