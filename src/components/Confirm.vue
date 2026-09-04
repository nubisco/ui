<template>
  <NbModal
    :open="open"
    :size="size"
    :role="tone === 'danger' ? 'alertdialog' : 'dialog'"
    :labelled-by="headingId"
    :described-by="hasDescription() ? bodyId : undefined"
    :busy="busy"
    :close-on-overlay="!locked"
    :close-disabled="locked"
    :close-on-escape="false"
    @close="onDismiss"
  >
    <template #header>
      <span
        :id="headingId"
        :class="['nb-confirm__heading', `nb-confirm__heading--${tone}`]"
      >
        <NbIcon
          v-if="tone === 'danger'"
          name="warning"
          :size="16"
          aria-hidden="true"
        />
        <span>{{ title }}</span>
      </span>
    </template>

    <div ref="rootRef" :class="['nb-confirm', contentClass]">
      <!-- The description proper: what is about to happen, and to what. It is
           what `aria-describedby` points at, so it holds nothing that changes
           while the dialog is open. -->
      <div v-if="hasDescription()" :id="bodyId" class="nb-confirm__body">
        <slot>
          <p v-if="message" class="nb-confirm__message">{{ message }}</p>
        </slot>

        <p
          v-if="subject"
          :class="['nb-confirm__subject', `nb-confirm__subject--${tone}`]"
        >
          <span v-if="subjectLabel" class="nb-confirm__subject-kind">
            {{ subjectLabel }}
          </span>
          <span class="nb-confirm__subject-name">{{ subject }}</span>
        </p>
      </div>

      <div v-if="typeToConfirm" class="nb-confirm__gate">
        <NbTextInput
          v-model="typed"
          class="nb-confirm__gate-field"
          :label="gateLabel"
          :helper="typeToConfirmHelper"
          :disabled="locked"
          autocomplete="off"
          spellcheck="false"
          data-nb-confirm="gate"
          @keydown.enter.prevent
        />
      </div>

      <!-- Everything that changes while the dialog is open lives here, in its
           own region, outside the described subtree. A screen reader is told
           about the description once on entry; these arrive later and are
           announced as updates to a region that was empty, rather than as an
           edit to the sentence it already read. -->
      <div class="nb-confirm__live">
        <!-- The pending line is a live region rather than a spinner alone: a
             screen reader user gets no signal at all from a button that has
             quietly become disabled. -->
        <p v-if="busy" class="nb-confirm__status" role="status">
          {{ busyLabel }}
        </p>

        <!-- The finished beat. Opt-in, because a dialog that lingers after a
             successful delete is a cost, but a dialog that vanishes the
             instant a slow call returns leaves the user unsure whether it
             ran. -->
        <p
          v-if="succeeded && successLabel"
          class="nb-confirm__status nb-confirm__status--success"
          role="status"
        >
          <NbIcon name="check" :size="14" aria-hidden="true" />
          <span>{{ successLabel }}</span>
        </p>

        <!-- Focusable on purpose. When the work fails, every control the user
             had was disabled a moment ago, so focus is parked on the dialog
             itself; the failure is what they need to read first. -->
        <div
          v-if="error"
          ref="errorRef"
          class="nb-confirm__error"
          tabindex="-1"
        >
          <NbMessage variant="error">{{ error }}</NbMessage>
        </div>
      </div>
    </div>

    <template #footer>
      <!-- Cancel first, and it holds initial focus. Confirm sits where the
           eye finishes and the hand rests, but nothing lands on it. -->
      <NbButton
        ref="cancelRef"
        class="nb-confirm__action nb-confirm__action--cancel"
        variant="ghost"
        size="lg"
        :disabled="locked"
        data-nb-confirm="cancel"
        @click="onCancel"
      >
        {{ cancelLabel }}
      </NbButton>
      <NbButton
        class="nb-confirm__action nb-confirm__action--confirm"
        :variant="confirmVariant"
        size="lg"
        :disabled="!canConfirm"
        :loading="busy"
        data-nb-confirm="confirm"
        @click="onConfirmClick"
      >
        {{ confirmLabel }}
      </NbButton>
    </template>
  </NbModal>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useId,
  useSlots,
  watch,
} from 'vue'
import NbModal from './Modal.vue'
import NbButton from './Button.vue'
import NbIcon from './Icon.vue'
import NbMessage from './Message.vue'
import NbTextInput from './TextInput.vue'
import { useReducedMotion } from '@/composables/useReducedMotion.composable'
import { applyConfirmMotion, floatingSelector } from './Confirm.env'
import type { IConfirmProps } from './Confirm.d'

// Every sibling is imported rather than resolved globally. `useConfirm()`
// mounts this component into its own Vue app, which has no plugin installed
// and therefore no global registrations, so a template-resolved sibling would
// render as an unknown element there and nowhere else.

const props = withDefaults(defineProps<IConfirmProps>(), {
  open: false,
  message: undefined,
  subject: undefined,
  subjectLabel: undefined,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  tone: 'danger',
  typeToConfirm: undefined,
  typeToConfirmLabel: undefined,
  typeToConfirmHelper: undefined,
  busy: false,
  busyLabel: 'Working...',
  succeeded: false,
  successLabel: undefined,
  error: undefined,
  size: 'sm',
  floatingSelectors: () => [],
  contentClass: undefined,
})

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const uid = useId()
const headingId = `nb-confirm-title-${uid}`
const bodyId = `nb-confirm-body-${uid}`

const slots = useSlots()
const rootRef = ref<HTMLElement | null>(null)
const errorRef = ref<HTMLElement | null>(null)
const cancelRef = ref<InstanceType<typeof NbButton> | null>(null)
const typed = ref('')
const reducedMotion = useReducedMotion()

// The two states in which nothing may dismiss the dialog: work is in flight,
// or it has just succeeded and the finished beat is on screen. Cancelling
// either would resolve a question that is already answered.
const locked = computed(() => props.busy || props.succeeded)

/**
 * aria-describedby has to point at something. An empty container would name
 * the dialog's description as the empty string, which reads worse to a screen
 * reader than no description at all.
 *
 * A function, not a computed. `useSlots()` hands back an object that Vue
 * mutates in place when the parent re-renders with different children, and a
 * computed over it caches the answer from the first render: the composable's
 * host mounts before it has a question to ask, so `body` content supplied
 * through `confirm()` arrived on the second render and was never shown.
 */
function hasDescription(): boolean {
  return !!props.message || !!props.subject || !!slots.default
}

const confirmVariant = computed(() =>
  props.tone === 'danger' ? 'danger' : 'primary',
)

const gateLabel = computed(
  () => props.typeToConfirmLabel ?? `Type ${props.typeToConfirm} to confirm`,
)

// Trimmed, because a trailing space pasted along with a name is not a
// different intent. Case is significant: the phrase is the friction.
const gateMet = computed(
  () => !props.typeToConfirm || typed.value.trim() === props.typeToConfirm,
)
/**
 * The confirm button's own gate, and not only the button's `disabled`
 * attribute. `locked` is in here because the double-fire this whole component
 * exists to prevent must not depend on NbButton: swap the button through the
 * footer, dispatch a click from application code or from a test, and a
 * guarantee that lives in a child component's `disabled` binding is gone.
 */
const canConfirm = computed(() => gateMet.value && !locked.value)

/** The only place `confirm` is emitted, and it re-checks the gate itself. */
function onConfirmClick() {
  if (!canConfirm.value) return
  emit('confirm')
}

function cancelEl(): HTMLElement | null {
  const el = cancelRef.value?.$el
  return el instanceof HTMLElement ? el : null
}

/**
 * The dialog element NbModal renders. Reached through its role rather than
 * NbModal's private class name, because the role is the part of that markup
 * this component is entitled to rely on, and NbConfirm sets it itself (via a
 * prop) to `alertdialog` or `dialog` depending on tone.
 */
function dialogEl(): HTMLElement | null {
  return rootRef.value?.closest('[role="dialog"],[role="alertdialog"]') ?? null
}

/** Every aria-modal surface currently on screen, in document order. */
function openDialogs(): HTMLElement[] {
  if (typeof document === 'undefined') return []
  return Array.from(
    document.querySelectorAll<HTMLElement>('[aria-modal="true"]'),
  )
}

/**
 * Whether this dialog is the last aria-modal surface in the document, which
 * for teleported overlays is the one painted on top.
 *
 * Without this test, two NbConfirms open at once (two components rendered
 * from route or store state, which is a supported way to use this) both
 * answer one Escape, and the older instance answers first: the user cancels
 * a question they cannot see while the one in front of them stays put.
 */
function isTopmost(): boolean {
  const mine = dialogEl()
  if (!mine) return false
  const all = openDialogs()
  return all.length === 0 || all[all.length - 1] === mine
}

/**
 * What the browser will stop on with Tab, as far as a dialog needs to care.
 *
 * The long tail matters here because the default slot takes arbitrary
 * content: a preview of the record being deleted is often an `<iframe>`, an
 * embedded player, an image map or a rich-text field, and every one of those
 * is a tab stop the trap has to know about or the cycle breaks at the dialog
 * edge. Elements that are focusable but explicitly removed from the tab order
 * (`tabindex="-1"`, and our own error holder is one) are excluded, as are
 * controls hidden from assistive technology or from the page.
 */
const FOCUSABLE = [
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'summary:not([tabindex="-1"])',
  'audio[controls]:not([tabindex="-1"])',
  'video[controls]:not([tabindex="-1"])',
  'iframe:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
]
  .map((selector) => `${selector}:not([hidden]):not([aria-hidden="true"])`)
  .join(',')

/**
 * Which teleported popups count as being inside this dialog. The built-in
 * list and the application-wide register live in Confirm.env.ts; the
 * `floatingSelectors` prop adds to them for this dialog only.
 */
function floating(): string {
  return floatingSelector(props.floatingSelectors)
}

function inFloatingMenu(node: EventTarget | Element | null): boolean {
  return node instanceof Element ? !!node.closest(floating()) : false
}

function contains(node: Element | null): boolean {
  const dialog = dialogEl()
  return !!dialog && !!node && dialog.contains(node)
}

function focusables(): HTMLElement[] {
  const dialog = dialogEl()
  if (!dialog) return []
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getAttribute('aria-disabled') !== 'true',
  )
}

/**
 * The one place focus can always go. While the work is in flight this dialog
 * disables cancel, confirm, the gate field and NbModal's close control, which
 * leaves it with no focusable descendant at all. A browser does not hold
 * focus on a control that becomes disabled: it drops it to `<body>`, outside
 * the dialog, where Escape does nothing, the trap has nothing to catch and a
 * screen reader is reading the page behind the scrim.
 *
 * NbModal carries `tabindex="-1"` on the dialog box for exactly this, so
 * there is always a container to hold focus even when there is no control to
 * put it on. jsdom never blurs a disabled element, so no jsdom test can
 * observe the browser's half of this; the recovery below is asserted
 * directly instead.
 */
function focusFallback(): boolean {
  const dialog = dialogEl()
  if (!dialog) return false
  dialog.focus()
  return true
}

/** Puts focus somewhere legitimate inside the dialog, controls or not. */
function focusInside() {
  const first = focusables()[0]
  if (first) first.focus()
  else focusFallback()
}

let previouslyFocused: HTMLElement | null = null

/**
 * Hands focus back to whatever opened the dialog. Called on close and again
 * on unmount, because `dismissConfirms()` destroys the host outright and a
 * close that is never rendered has no transition to hang a restore on. Losing
 * this drops a keyboard user at the top of the document.
 */
function restoreFocus() {
  const target = previouslyFocused
  previouslyFocused = null
  if (target?.isConnected) target.focus()
}

/**
 * NbModal animates its overlay and its content unconditionally. The
 * preference is a script decision here rather than a media query, because the
 * rule would have to live in NbModal's stylesheet and this component is not
 * entitled to restyle every modal in the library.
 *
 * What is written is a duration, never `transition: none`. A `none` left
 * behind on a recycled node survives the user turning the preference back
 * off, and it also disagrees with the delay `useConfirm()` waits before
 * showing the next queued question. A duration is reversible and is the same
 * number the queue reads.
 */
function syncMotion() {
  applyConfirmMotion(dialogEl(), reducedMotion.value)
}

// The preference can change while the dialog is open. A user who turns
// reduced motion on mid-question should not be shown the exit animation, and
// one who turns it off should get it back.
watch(reducedMotion, () => {
  if (props.open) syncMotion()
})

// Focus through the pending state. Going into `busy` there is nothing left to
// focus, so the dialog box itself takes it; coming out of it with a failure,
// the failure takes it, because that is the sentence the user has to read
// before deciding whether to retry.
watch(
  () => [props.busy, props.error] as const,
  async (next, previous) => {
    if (!props.open) return
    const [busy, error] = next
    const wasBusy = previous?.[0] ?? false
    await nextTick()
    if (busy) {
      if (focusables().length === 0) focusFallback()
      return
    }
    if (wasBusy && error) {
      const el = errorRef.value
      if (el) el.focus()
      else focusInside()
      return
    }
    const active = document.activeElement as Element | null
    if (!contains(active) && !inFloatingMenu(active)) focusInside()
  },
)

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      typed.value = ''
      await nextTick()

      syncMotion()

      // Initial focus is Cancel, always. The confirm button is one Space
      // away from whatever is focused when a dialog appears, and a dialog
      // that steals focus onto a destructive default turns a stray keypress
      // into a deletion. Cancel is the safe landing.
      if (cancelEl()) cancelEl()?.focus()
      else focusFallback()
    } else {
      restoreFocus()
    }
  },
  { immediate: true },
)

function onCancel() {
  if (locked.value) return
  emit('cancel')
}

// Where the last press started, and where the click that followed landed.
// A drag that begins on a word inside the dialog (selecting the name of the
// record to copy it) and releases over the scrim produces a click whose
// target is the overlay, and NbModal reads that as "clicked outside". It is
// not: the user never let go of the dialog. The press has to have started
// outside as well.
let pressStartedInside = false
let clickLandedInside = false

function onPressStart(event: Event) {
  const target = event.target as Element | null
  pressStartedInside = contains(target) || inFloatingMenu(target)
}

function onClickCapture(event: Event) {
  clickLandedInside = contains(event.target as Element | null)
}

/** The overlay and NbModal's close button both land here. */
function onDismiss() {
  const draggedOut = pressStartedInside && !clickLandedInside
  pressStartedInside = false
  if (draggedOut) return
  onCancel()
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return

  // A popup teleported out of the dialog by one of its own controls is still
  // part of it as far as the user is concerned, and Escape inside it means
  // "close the list", not "abandon the question". It gets first refusal on
  // both keys this handler answers.
  if (inFloatingMenu(document.activeElement)) return

  if (event.key === 'Escape') {
    // Only the surface in front of the user answers. Anything underneath,
    // an application modal or an older confirm, keeps its state.
    if (!isTopmost()) return
    // Nothing else sees the key: NbModal's own Escape is switched off by
    // prop, but an application listening on the document for its own reasons
    // (a command palette, a drawer) would otherwise act on the same press.
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    onCancel()
    return
  }

  if (event.key !== 'Tab') return
  if (!isTopmost()) return

  // The page behind the scrim is inert to the eye but not to Tab, and the
  // fleet's hand-rolled confirms all let focus walk out of the dialog onto
  // the very list the user is about to delete from.
  const items = focusables()
  if (items.length === 0) {
    // Nothing to cycle between, which is the pending state. Focus stays on
    // the dialog box rather than being allowed out onto the page behind.
    event.preventDefault()
    if (!contains(document.activeElement as Element | null)) focusFallback()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement as Element | null

  if (event.shiftKey && (active === first || !contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  } else if (!contains(active)) {
    event.preventDefault()
    first.focus()
  }
}

/**
 * Tab is not the only way out. A click on the page behind the scrim, a
 * programmatic `focus()` from application code, or a control being disabled
 * out from under the caret all move focus without a keystroke, and a trap
 * that only reads keydowns never notices.
 */
function onFocusOut(event: FocusEvent) {
  if (!props.open) return
  const next = event.relatedTarget
  if (next instanceof Element) {
    if (contains(next) || inFloatingMenu(next)) return
  } else if (next !== null) {
    return
  }
  // relatedTarget is null for a blur to nothing as well as for a blur into a
  // cross-document target, so confirm against the live focus after the event
  // settles rather than acting on the event alone.
  requestAnimationFrame(() => {
    if (!props.open) return
    const active = document.activeElement as Element | null
    if (contains(active) || inFloatingMenu(active)) return
    if (active && active !== document.body && !active.isConnected) return
    if (!isTopmost()) return
    focusInside()
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', onKeydown, true)
  document.addEventListener('focusout', onFocusOut, true)
  document.addEventListener('mousedown', onPressStart, true)
  document.addEventListener('touchstart', onPressStart, true)
  document.addEventListener('click', onClickCapture, true)
}

onMounted(() => {
  // Mounted already open is the composable's path: its host renders the
  // dialog on the first frame, so the `open` watcher fires during setup with
  // nothing in the DOM yet to name or focus. It captured the opener, this
  // finishes the job.
  if (props.open) {
    syncMotion()
    if (cancelEl()) cancelEl()?.focus()
    else focusFallback()
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onKeydown, true)
    document.removeEventListener('focusout', onFocusOut, true)
    document.removeEventListener('mousedown', onPressStart, true)
    document.removeEventListener('touchstart', onPressStart, true)
    document.removeEventListener('click', onClickCapture, true)
  }
  // The host `useConfirm()` mounts is destroyed outright by
  // `dismissConfirms()`, so there is no close for the watcher to see.
  restoreFocus()
})

defineExpose({
  focusCancel: () => cancelEl()?.focus(),
  restoreFocus,
  isTopmost,
})
</script>

<style scoped lang="scss">
/**
 * Branded overrides.
 *
 * Everything below reads a `--nb-confirm-*` custom property first and falls
 * back to the global token, so a product can restyle the parts of this dialog
 * that carry its identity without forking the component or fighting its
 * specificity. Two things to know about where to set them:
 *
 * - The dialog is teleported to `<body>`, so it inherits from `<body>` and
 *   not from the component that called `confirm()`. Set the properties on
 *   `:root` (or `.dark:root`) for the whole application.
 * - Pass `contentClass` to scope them to one dialog. That class sits on the
 *   content region below; the footer buttons are outside it and carry
 *   `.nb-confirm__action` plus `[data-nb-confirm="cancel|confirm"]`, both of
 *   which are part of the public surface and are not renamed without a major.
 */
.nb-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--nb-confirm-gap, var(--nb-spacing-12));
}

.nb-confirm__heading {
  display: inline-flex;
  align-items: center;
  gap: var(--nb-spacing-8);

  &--danger {
    color: var(--nb-confirm-heading-color, var(--nb-c-danger));
  }
}

.nb-confirm__body,
.nb-confirm__live {
  display: flex;
  flex-direction: column;
  gap: var(--nb-confirm-gap, var(--nb-spacing-12));
}

// An empty live region must not add a gap of its own to the stack.
.nb-confirm__live:empty {
  display: none;
}

.nb-confirm__message {
  margin: 0;
  color: var(--nb-c-text);
  font-size: var(--nb-font-size-14);
  line-height: 1.5;
}

// The record being acted on gets its own strip so it cannot be skimmed past
// with the sentence around it. Mono, because half of these are identifiers
// where l/1 and O/0 decide whether the right thing is deleted.
.nb-confirm__subject {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-2);
  margin: 0;
  padding: var(--nb-spacing-8) var(--nb-spacing-12);
  border-left: 2px solid var(--nb-confirm-subject-border, var(--nb-c-border));
  background: var(--nb-confirm-subject-bg, var(--nb-c-bg-soft));

  &--danger {
    border-left-color: var(
      --nb-confirm-subject-border,
      var(--nb-c-danger-surface-border)
    );
    background: var(--nb-confirm-subject-bg, var(--nb-c-danger-surface));
  }
}

.nb-confirm__subject-kind {
  font-size: var(--nb-font-size-11);
  text-transform: uppercase;
  letter-spacing: var(--nb-letter-spacing-wide);
  color: var(--nb-confirm-subject-kind-color, var(--nb-c-text-muted));

  .nb-confirm__subject--danger & {
    color: var(--nb-confirm-subject-color, var(--nb-c-on-danger-surface));
  }
}

.nb-confirm__subject-name {
  font-family: var(--nb-confirm-subject-font, var(--nb-font-family-mono));
  font-size: var(--nb-font-size-13);
  color: var(--nb-confirm-subject-color, var(--nb-c-text));
  word-break: break-word;

  .nb-confirm__subject--danger & {
    color: var(--nb-confirm-subject-color, var(--nb-c-on-danger-surface));
  }
}

.nb-confirm__status {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-4);
  margin: 0;
  font-size: var(--nb-font-size-12);
  color: var(--nb-confirm-status-color, var(--nb-c-text-muted));

  &--success {
    color: var(--nb-confirm-success-color, var(--nb-c-success));
  }
}

// The failure takes focus when the work fails, so it needs a visible focus
// ring of its own: it is not a control, and the browser draws nothing for a
// programmatic focus on a plain container.
.nb-confirm__error:focus-visible {
  outline: 2px solid var(--nb-c-focus-ring);
  outline-offset: 2px;
}

.nb-confirm__gate-field {
  width: 100%;
}
</style>
