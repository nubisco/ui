---
layout: nubisco
title: Rating
intro: '`NbRating` shows or takes a score out of a few stars: one to five by default. Read only it is an image named by its value, as input it is a radio group, and clearable lets the score go back to not rated.'
source: src/components/Rating.vue
tab: usage
pageTabs: ['usage', 'code', 'accessibility']
---

<script setup lang="ts">
import { ref } from 'vue'
const quality = ref<number | null>(3)
const optional = ref<number | null>(4)
</script>

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbRating v-model="quality" label="Quality" />
    <span>Value: {{ quality ?? 'null' }}</span>
  </div>
</preview>

```vue
<NbRating v-model="quality" label="Quality" />
```

## When to use it

- To show a score on a short, fixed scale: a quality score, a difficulty.
- To let someone set that score in one gesture.
- Not for a number on a long or open scale: that is
  [`NbSlider`](/components/slider/usage) or
  [`NbNumberInput`](/components/number-input/usage).
- Not for a choice between named options: that is a radio group.

## Read only

`readonly` draws the stars and takes no input. It is one image to assistive
technology, named by the label and the value: "Quality, 4 of 5 stars". A
fraction, such as an average, draws to the nearest half star and is
announced as given.

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbRating :model-value="4" label="Quality" readonly />
    <NbRating :model-value="3.5" label="Average" readonly />
    <NbRating :model-value="null" label="Quality" readonly />
  </div>
</preview>

```vue
<NbRating :model-value="4" label="Quality" readonly />
<NbRating :model-value="3.5" label="Average" readonly />
```

## Clearable

`null` means not rated. With `clearable`, a clear button follows the stars
while there is a rating, and Delete or Backspace clears it from the keyboard.
Without it, a rating once set can be changed but not removed.

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbRating v-model="optional" label="Override" clearable />
    <span>Value: {{ optional ?? 'null' }}</span>
  </div>
</preview>

```vue
<NbRating v-model="override" label="Override" clearable />
```

## Sizes

`sm`, `md` (the default) and `lg` draw the stars at 16, 20 and 24px, the
icon scale. On a phone touch screen every star is a 44px target, at any
size.

<preview>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start;">
    <NbRating :model-value="3" label="Small" size="sm" />
    <NbRating :model-value="3" label="Medium" size="md" />
    <NbRating :model-value="3" label="Large" size="lg" />
  </div>
</preview>

## Disabled

`disabled` keeps the rating in place, dimmed, and out of the tab order.

<preview>
  <NbRating :model-value="2" label="Quality" disabled />
</preview>

## More or fewer stars

`max` sets the scale. Keep it short: past five or so a row of stars stops
reading at a glance.

<preview>
  <NbRating :model-value="2" label="Difficulty" :max="3" />
</preview>

## Light and dark

Filled stars are the fill weight in the text colour and empty ones the
outline in the muted text colour, so they follow the theme, and they differ
in shape as well as tone. Switch the docs theme to see both.
