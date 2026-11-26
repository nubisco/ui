---
layout: nubisco
title: Rating
intro: '`NbRating` shows or takes a score out of a few stars: one to five by default. Read only it is an image named by its value, as input it is a radio group, and clearable lets the score go back to not rated.'
source: src/components/Rating.vue
tab: code
pageTabs: ['usage', 'code', 'accessibility']
---

## Props

| Prop         | Type                   | Default    | Description                                                    |
| ------------ | ---------------------- | ---------- | -------------------------------------------------------------- |
| `modelValue` | `number \| null`       | `null`     | The rating (`v-model`), 1 to `max`. `null` is not rated        |
| `max`        | `number`               | `5`        | How many stars                                                 |
| `label`      | `string`               | `'Rating'` | What is rated: the group's name, or the image's                |
| `readonly`   | `boolean`              | `false`    | An image of the value instead of an input                      |
| `disabled`   | `boolean`              | `false`    | Dimmed, and out of the tab order                               |
| `size`       | `'sm' \| 'md' \| 'lg'` | `'md'`     | Stars at 16, 20 or 24px                                        |
| `clearable`  | `boolean`              | `false`    | A clear button, and Delete or Backspace, set it back to `null` |

## Events

| Event               | Payload                 | Fired when                    |
| ------------------- | ----------------------- | ----------------------------- |
| `update:modelValue` | `value: number \| null` | A star was chosen, or cleared |

## Slots

None.

## Strings

The names it speaks come from the string catalogue, so
`provideNbStrings()` translates them: `ratingLabel`, `ratingValue(value, max)`,
`ratingStars(count)`, `ratingNotRated` and `ratingClear`.
