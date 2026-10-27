# Penpot library (draft)

The design library for `@nubisco/ui`, kept in the repository while it grows.
It is not published as a team library or linked from the documentation yet.

| File                | What it is                                                          |
| ------------------- | ------------------------------------------------------------------- |
| `nubisco-ui.penpot` | The Penpot file: tokens, foundations pages and primitive components |
| `tokens.json`       | The token sets and themes the file is built on, generated from SCSS |

## Contents

- **Tokens.** Sets `core`, `semantic/light`, `semantic/dark`, `component`,
  `appearance/square` and `appearance/rounded`, with two theme groups that
  combine freely: Mode (Light, Dark) and Appearance (Square, Rounded).
- **Foundations.** Color, Typography, Spacing, Radius and Elevation pages.
- **Components.** Button, Checkbox, Radio, Switch, Badge, Avatar and Text
  input, as variant sets with every fill, stroke, size, spacing, radius and
  font bound to a token.

## Working on it

Open the file in Penpot with Import (Projects > Import Penpot files). To pick
up token changes from `src/styles`, regenerate the tokens and import them over
the existing sets (Tokens > Import):

```sh
pnpm penpot:tokens
```

The source of truth stays in `src/`. Values the components write as literals
in their scoped styles are listed in `LOCAL` and `LOCAL_COLORS` in
`scripts/penpot-tokens.mjs`, so update those tables when the styles change.

After editing in Penpot, download the file again (Main menu > File >
Download Penpot file) and replace `nubisco-ui.penpot`.

## Known gaps

- No Tag component (it does not exist in the library), no Field wrapper, and
  no icon or loading button variants until the file has an icon set.
- Line heights are not bound: Penpot binds line height only through
  typography tokens.
- Switch focus glow and the link button focus offset are approximated.
