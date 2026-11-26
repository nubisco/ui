---
layout: nubisco
title: Rating
intro: '`NbRating` shows or takes a score out of a few stars: one to five by default. Read only it is an image named by its value, as input it is a radio group, and clearable lets the score go back to not rated.'
source: src/components/Rating.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
a11y:
  automated: not recorded
  keyboard: tested
  screenReader: not recorded
---

## Accessibility

- As input, a `radiogroup` named by `label`, with one `radio` per star
  named "1 star", "2 stars" and so on. Only the chosen star is checked.
- One tab stop, on the chosen star, or the first while nothing is rated.
  The arrow keys choose as they move and wrap, Home chooses one star and End
  all of them. With `clearable`, Delete and Backspace clear.
- Read only, one `img` named by the label and the value: "Quality, 4 of 5
  stars", or "Quality, Not rated". The stars inside are hidden.
- Never colour alone: a filled star is the solid glyph, an empty star the
  outline. Both inks are text tokens that clear 3:1 on every layer in light
  and dark.
- Focus draws the library's control ring around the star.
- On a phone touch screen each star is a 44px target.
