---
layout: nubisco
title: Skeleton
intro: '`NbSkeleton` stands in for content that is about to arrive, in the shape and at the size the real content will occupy. That last part is the whole component: a placeholder that is not the right height is worse than no placeholder, because the page settles twice, once when the skeleton appears and again when it is replaced.'
source: src/components/Skeleton.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- With no `label`, the whole component is `aria-hidden="true"`. Placeholders are
  decorative: their content is fake, and reading it out would be noise.
- With a `label`, the root becomes `role="status"` with `aria-live="polite"` and
  the label is rendered as visually hidden text (clipped, so it stays in the
  accessibility tree). Put it on exactly one skeleton per region.
- **The region is mounted empty and the label is written on the next task.** A
  live region inserted and filled in the same frame has no previous contents to
  be diffed against, and the update is frequently never reported. Going in blank
  and filling a task later makes it a change to a region that was already being
  watched. [`NbSpinner`](/components/spinner/usage) does the same thing for the
  same reason.
- `aria-busy="true"` sits on the shapes, not on the live region. On a live
  region, `aria-busy` means "withhold every update until I clear it", and a
  skeleton is unmounted rather than flipped back to `busy="false"`, so that
  promise is never kept and the `label` you set would never be spoken. If you
  want the busy state on the surrounding region as well, put `aria-busy` on the
  container the skeletons stand in and clear it when the content lands:

  ```vue
  <template>
    <section :aria-busy="loading">
      <NbSkeleton v-if="loading" :lines="3" label="Loading description" />
      <p v-else>{{ description }}</p>
    </section>
  </template>
  ```

- **Announce the arrival, not only the wait.** The skeleton is unmounted at the
  exact moment the content appears, taking its own live region with it, so the
  end of the load is silent unless something else speaks. `completeLabel` hands
  the message to a shared live region that stays in the document, so it is
  still there to be read after this component is gone:

  ```vue
  <template>
    <NbSkeleton
      v-if="loading"
      :lines="3"
      label="Loading description"
      complete-label="Description loaded"
    />
    <p v-else>{{ description }}</p>
  </template>
  ```

  Same rule as `label`: one skeleton per region carries it, or a table of forty
  placeholders announces itself forty times over. If the load ends by moving
  focus into the content that arrived, that move is the announcement and
  `completeLabel` would repeat it. Choose one. What you must not do is choose
  neither, which is what every hand-rolled placeholder in the fleet does today.

- **The message is fired on any unmount, including a failed one.** The component
  cannot tell the two apart: Vue does not update props on the render that
  removes a component, so a flag set in the same tick as the failure never
  reaches the teardown handler. Call `suppressLoadingAnnouncement()` in your
  `catch`, or drive the request through
  [`useInlineLoading`](/components/inline-loading/usage), which does it for you.
  The Usage tab spells out the pattern under "when the fetch fails". Without it,
  a failure announces itself as an arrival, which is worse than saying nothing.
- Because the skeleton reserves the real geometry, the focus ring and the
  scroll position do not move when content lands, which is an accessibility
  outcome and not only a visual one: a shifting page loses low-vision users
  their place and moves click targets under the pointer.
- Skeletons hold no focus and take no tab stop. Do not put one inside a control
  that can be focused while it is loading.
- **Reduced motion**: under `prefers-reduced-motion: reduce` the travelling
  highlight is dropped and the bar fades slowly in place instead. Nothing
  translates, and the placeholder is still visibly loading rather than looking
  like broken layout. `animated: false` stays genuinely still in both cases.
  The preference is honoured twice, by the media query and by a
  `nb-skeleton--reduced-motion` class read from `matchMedia`, so flipping the
  OS setting with the page already open takes effect without a reload.
- **Windows high contrast**: forced colours discard every author background,
  which would turn the fill into a blank rectangle on a blank page and make the
  region read as empty rather than as loading. Under `forced-colors: active` the
  fill opts out with `forced-color-adjust` and repaints from the system
  palette: text and heading bars in `CanvasText`, blocks and circles outlined so
  they stay visible against either scheme.
- The placeholder colour (`--nb-c-discrete`) is a surface, not text, and carries
  no information that colour alone must convey.

<!--@include: ./_shared.md-->
