---
layout: nubisco
title: Inline Loading
intro: '`NbInlineLoading` is the status line for one named action: it runs beside the button or row that triggered the work, reports that the work is running, and then says whether it worked. It is the only component in the library that confirms an outcome in place.'
source: src/components/InlineLoading.vue
tab: accessibility
pageTabs: ['usage', 'code', 'accessibility']
---

## Accessibility

- The root is `role="status"`, present in every state including `inactive`, so
  the live region exists before the first message is written into it.
- `aria-live` is chosen per state: `off` while inactive (nothing to say, and no
  announcement when the node is first inserted), `polite` for `active` and
  `finished`, and `assertive` for `error`. Progress and success wait their turn;
  a failure interrupts, because the user is usually about to walk away.
- The spinner shown during `active` is rendered with `decorative`, so it has no
  role and no label of its own. One operation announces once.
- The state icons are `aria-hidden`. Every state is carried by its text, so
  nothing depends on the check mark, the warning mark or the colour.
- The visible text is real text, not a `title` or a pseudo-element, so it is
  translatable, selectable and reachable by a screen reader's virtual cursor.
- Anything placed in the default slot renders inside that same live region and
  is announced with the state. That is the reason for the one-action rule: a
  `Retry` button is useful in an announcement, three sentences of advice are
  not.
- Nothing here depends on colour. `--nb-c-success` and `--nb-c-danger` reinforce
  a mark and a sentence that already say the same thing, which is also why
  forced-colours mode costs this component nothing: the system palette flattens
  the two tones and the state still reads.
- The component owns no focus. It never moves the caret, which matters because
  it changes while the user is typing in the same form.
- Reduced motion is inherited from [`NbSpinner`](/components/spinner/usage): under
  `prefers-reduced-motion: reduce` the arc becomes a complete ring that breathes
  in opacity, so nothing rotates and nothing freezes.

<!--@include: ./_shared.md-->
