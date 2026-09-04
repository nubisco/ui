import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import NbConfirm from '../src/components/Confirm.vue'
import NbButton from '../src/components/Button.vue'
import NbModal from '../src/components/Modal.vue'
import {
  CONFIRM_LEAVE_MS,
  registerConfirmFloatingSelector,
} from '../src/components/Confirm.env'
import {
  useConfirm,
  dismissConfirms,
} from '../src/composables/useConfirm.composable'

// Nothing here stubs Teleport. NbConfirm wraps the real NbModal, which
// teleports its dialog to <body>, so the dialog is a SIBLING of whatever
// mounted it and never a descendant. A passthrough Teleport stub hides that,
// and a selector written against the stubbed tree ("inside the wrapper",
// "inside the host div") passes in the test and matches nothing in a browser.
// Every assertion below therefore queries the document, exactly as the
// running page would.

const dialogEl = () =>
  document.querySelector<HTMLElement>('[role="dialog"],[role="alertdialog"]')
const dialogEls = () =>
  document.querySelectorAll('[role="dialog"],[role="alertdialog"]')
const part = (which: 'cancel' | 'confirm' | 'gate') =>
  document.querySelector<HTMLElement>(`[data-nb-confirm="${which}"]`)
const cancelEl = () => part('cancel')!
const confirmEl = () => part('confirm')!
const closeEl = () =>
  dialogEl()!.querySelector<HTMLButtonElement>('header button')!
const modalBody = () => dialogEl()!.querySelector<HTMLElement>('main')!
const gateInput = () => dialogEl()!.querySelector<HTMLInputElement>('input')!
const text = () => dialogEl()?.textContent ?? ''

// Escape is dispatched from inside the dialog, which is where a real keypress
// originates: the focused control. Dispatching on `document` instead would
// bypass the capture phase entirely and test nothing about ordering.
function pressEscape(from: Element = dialogEl() ?? document.body) {
  from.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  )
}
function pressTab(shiftKey = false) {
  ;(document.activeElement ?? document).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }),
  )
}

/**
 * Waits for something to become true instead of sleeping for a fixed span.
 *
 * The queue holds a settled dialog on screen for the length of its own exit,
 * CONFIRM_LEAVE_MS. Two tests here used to sleep for that number plus a
 * guessed margin, which made them wall-clock brittle and, worse, silently
 * wrong if the duration ever changed. The bound below is a safety net, not
 * the thing being measured.
 */
async function waitFor(predicate: () => boolean, what: string) {
  const deadline = Date.now() + CONFIRM_LEAVE_MS + 1000
  while (Date.now() < deadline) {
    if (predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 5))
    await nextTick()
  }
  throw new Error(`timed out waiting for ${what}`)
}

const mounted: { unmount: () => void }[] = []
function mountConfirm(props: Record<string, unknown> = {}, options = {}) {
  const wrapper = mount(NbConfirm, {
    props: { title: 'Delete environment', open: true, ...props },
    attachTo: document.body,
    ...options,
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  dismissConfirms()
  while (mounted.length) mounted.pop()!.unmount()
  document.body.style.overflow = ''
  document.body.innerHTML = ''
})

describe('NbConfirm', () => {
  describe('button contract', () => {
    it('puts cancel before confirm in the DOM, which is also the tab order', () => {
      mountConfirm()
      const order = Array.from(
        dialogEl()!.querySelectorAll('[data-nb-confirm]'),
      ).map((el) => el.getAttribute('data-nb-confirm'))
      expect(order).toEqual(['cancel', 'confirm'])
    })

    it('gives cancel the ghost variant and confirm the danger variant', () => {
      mountConfirm()
      expect(cancelEl().className).toContain('nb-button--ghost')
      expect(confirmEl().className).toContain('nb-button--danger')
    })

    it('uses the primary variant for the neutral tone, keeping the order', () => {
      mountConfirm({ tone: 'neutral' })
      expect(confirmEl().className).toContain('nb-button--primary')
      expect(confirmEl().className).not.toContain('nb-button--danger')
      expect(cancelEl().className).toContain('nb-button--ghost')
    })

    it('defaults the labels and lets both be localised', () => {
      mountConfirm()
      expect(cancelEl().textContent!.trim()).toBe('Cancel')
      mounted.pop()!.unmount()

      mountConfirm({
        cancelLabel: 'Cancelar',
        confirmLabel: 'Eliminar entorno',
      })
      expect(cancelEl().textContent!.trim()).toBe('Cancelar')
      expect(confirmEl().textContent!.trim()).toBe('Eliminar entorno')
    })

    it('emits confirm from the confirm button and cancel from the cancel button', async () => {
      const wrapper = mountConfirm()
      confirmEl().click()
      cancelEl().click()
      await nextTick()
      expect(wrapper.emitted('confirm')).toHaveLength(1)
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })
  })

  describe('naming the record', () => {
    it('renders the subject verbatim, with its kind', () => {
      mountConfirm({
        subject: 'production',
        subjectLabel: 'Environment',
        message: 'Every entry in it is deleted.',
      })
      const dialog = dialogEl()!
      expect(
        dialog.querySelector('.nb-confirm__subject-name')!.textContent,
      ).toBe('production')
      expect(
        dialog.querySelector('.nb-confirm__subject-kind')!.textContent!.trim(),
      ).toBe('Environment')
      expect(dialog.querySelector('.nb-confirm__message')!.textContent).toBe(
        'Every entry in it is deleted.',
      )
    })

    it('omits the subject strip entirely when no record is named', () => {
      mountConfirm()
      expect(dialogEl()!.querySelector('.nb-confirm__subject')).toBeNull()
    })

    it('lets the default slot replace the body without touching the footer', () => {
      mountConfirm(
        { title: 'Delete', message: 'ignored' },
        { slots: { default: '<ul class="impact"><li>3 releases</li></ul>' } },
      )
      const dialog = dialogEl()!
      expect(dialog.querySelector('.impact')).not.toBeNull()
      expect(dialog.querySelector('.nb-confirm__message')).toBeNull()
      expect(cancelEl().textContent!.trim()).toBe('Cancel')
    })
  })

  describe('focus', () => {
    it('lands initial focus on cancel, never on the destructive button', async () => {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(document.activeElement).toBe(cancelEl())
    })

    it('returns focus to the control that opened it', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(document.activeElement).not.toBe(opener)

      await wrapper.setProps({ open: false })
      await nextTick()
      expect(document.activeElement).toBe(opener)
    })

    it('returns focus to the opener when the dialog is destroyed rather than closed', async () => {
      const opener = document.createElement('button')
      document.body.appendChild(opener)
      opener.focus()

      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()

      // No close, no transition: straight to unmount, which is what
      // dismissConfirms() does to the host.
      mounted.pop()
      wrapper.unmount()
      await nextTick()
      expect(document.activeElement).toBe(opener)
    })

    it('wraps Tab from the last control back to the first', async () => {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()

      const buttons = dialogEl()!.querySelectorAll('button')
      const last = buttons[buttons.length - 1] as HTMLElement
      last.focus()
      pressTab()
      expect(document.activeElement).toBe(buttons[0])
    })

    it('pulls focus back inside when Tab has escaped the dialog', async () => {
      const outside = document.createElement('button')
      document.body.appendChild(outside)
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()

      outside.focus()
      pressTab()
      expect(document.activeElement).not.toBe(outside)
      expect(dialogEl()!.contains(document.activeElement)).toBe(true)
    })

    it('recovers focus moved by something other than a keystroke', async () => {
      const outside = document.createElement('button')
      document.body.appendChild(outside)
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()

      // A mouse click on the page behind the scrim, or an application calling
      // focus() itself: no Tab keydown ever happens.
      outside.focus()
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      expect(dialogEl()!.contains(document.activeElement)).toBe(true)
    })

    it('leaves focus alone inside a popup its own controls teleported out', async () => {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()

      // What NbSelect, NbMenu and NbDatePicker do: the list is teleported to
      // <body>, so it is a sibling of the dialog, not a descendant.
      const popup = document.createElement('div')
      popup.setAttribute('data-nb-confirm-floating', '')
      popup.innerHTML = '<button id="opt">Option</button>'
      document.body.appendChild(popup)
      const option = popup.querySelector('button')!
      option.focus()

      pressTab()
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
      expect(document.activeElement).toBe(option)
    })
  })

  describe('accessible naming and roles', () => {
    it('names and describes the dialog, which NbModal alone does not', async () => {
      const wrapper = mountConfirm({
        open: false,
        message: 'Every entry in it is deleted.',
      })
      await wrapper.setProps({ open: true })
      await nextTick()
      const dialog = dialogEl()!
      expect(dialog.getAttribute('aria-labelledby')).toBe(
        dialog.querySelector('.nb-confirm__heading')!.id,
      )
      expect(dialog.getAttribute('aria-describedby')).toBe(
        dialog.querySelector('.nb-confirm__body')!.id,
      )
      expect(dialog.getAttribute('aria-modal')).toBe('true')
    })

    it('does not point aria-describedby at an empty element', async () => {
      // A title-only confirm has nothing to describe. Naming an empty
      // container as the description reads worse than having none.
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(dialogEl()!.hasAttribute('aria-describedby')).toBe(false)
    })

    it('keeps the states that change out of the described subtree', async () => {
      // The description is announced once, on entry. The pending line, the
      // finished beat and the failure all arrive later, so they live in a
      // separate region: an update to an empty live region is a case every
      // screen reader handles the same way, an edit to the sentence already
      // read is not.
      const wrapper = mountConfirm({
        open: false,
        message: 'Every entry in it is deleted.',
      })
      await wrapper.setProps({ open: true })
      await nextTick()
      await wrapper.setProps({ busy: true })
      await nextTick()
      await nextTick()

      const described = dialogEl()!.querySelector('.nb-confirm__body')!
      const status = dialogEl()!.querySelector('[role="status"]')!
      expect(status.textContent).toContain('Working')
      expect(described.contains(status)).toBe(false)
    })

    it('is an alertdialog when destructive and a dialog when merely consequential', async () => {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(dialogEl()!.getAttribute('role')).toBe('alertdialog')

      await wrapper.setProps({ tone: 'neutral' })
      await nextTick()
      await nextTick()
      expect(dialogEl()!.getAttribute('role')).toBe('dialog')
    })

    it('marks the dialog aria-busy only while the action is in flight', async () => {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(dialogEl()!.hasAttribute('aria-busy')).toBe(false)

      await wrapper.setProps({ busy: true })
      await nextTick()
      await nextTick()
      expect(dialogEl()!.getAttribute('aria-busy')).toBe('true')
    })

    it('makes a scrolling body reachable by keyboard, and only then', async () => {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()

      // jsdom lays nothing out, so the overflow is declared rather than
      // measured. The branch under test is the decision, not the layout.
      const body = modalBody()
      expect(body.hasAttribute('tabindex')).toBe(false)

      Object.defineProperty(body, 'scrollHeight', {
        configurable: true,
        value: 800,
      })
      Object.defineProperty(body, 'clientHeight', {
        configurable: true,
        value: 300,
      })
      await wrapper.setProps({ error: 'Try again.' })
      await nextTick()
      await nextTick()

      expect(body.getAttribute('tabindex')).toBe('0')
      expect(body.getAttribute('role')).toBe('region')
      expect(body.getAttribute('aria-labelledby')).toBe(
        dialogEl()!.querySelector('.nb-confirm__heading')!.id,
      )
    })

    it('does not animate when the user has asked for less motion', async () => {
      const original = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia

      try {
        const wrapper = mountConfirm({ open: false })
        await wrapper.setProps({ open: true })
        await nextTick()
        // A duration of zero rather than `transition: none`, because the
        // same number is what useConfirm() waits before showing the next
        // queued question, and because a `none` cannot be undone.
        expect(dialogEl()!.style.transitionDuration).toBe('0ms')
        expect(
          (dialogEl()!.parentElement as HTMLElement).style.transitionDuration,
        ).toBe('0ms')
      } finally {
        window.matchMedia = original
      }
    })

    it('animates for exactly as long as the queue waits, and no guessing', async () => {
      // The dialog writes its own exit duration onto the nodes NbModal
      // animates, which is why the composable can wait CONFIRM_LEAVE_MS
      // without hand-copying a number out of NbModal's stylesheet.
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(dialogEl()!.style.transitionDuration).toBe(`${CONFIRM_LEAVE_MS}ms`)
    })

    it('gives the animation back when the preference is turned off mid-question', async () => {
      const listeners: ((event: { matches: boolean }) => void)[] = []
      const original = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: (_: string, fn: (e: { matches: boolean }) => void) =>
          listeners.push(fn),
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia

      try {
        const wrapper = mountConfirm({ open: false })
        await wrapper.setProps({ open: true })
        await nextTick()
        expect(dialogEl()!.style.transitionDuration).toBe('0ms')

        // The OS setting flips while the dialog is on screen.
        listeners.forEach((fn) => fn({ matches: false }))
        await nextTick()
        expect(dialogEl()!.style.transitionDuration).toBe(
          `${CONFIRM_LEAVE_MS}ms`,
        )
      } finally {
        window.matchMedia = original
      }
    })
  })

  describe('dismissal', () => {
    it('treats Escape as cancel', async () => {
      const wrapper = mountConfirm()
      pressEscape()
      await nextTick()
      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('does not close a modal underneath it on the same Escape', async () => {
      // An application modal is open; the confirm is asked on top of it. One
      // Escape must answer one question.
      const outer = mount(NbModal, {
        props: { open: true, title: 'Edit environment' },
        attachTo: document.body,
      })
      mounted.push(outer)
      const confirm = mountConfirm()
      await nextTick()

      pressEscape(dialogEls()[dialogEls().length - 1])
      await nextTick()

      expect(confirm.emitted('cancel')).toHaveLength(1)
      expect(outer.emitted('close')).toBeUndefined()
    })

    it('gives the page back its scrollbar only when nothing is left on top of it', async () => {
      const outer = mount(NbModal, {
        props: { open: false, title: 'Edit environment' },
        attachTo: document.body,
      })
      mounted.push(outer)
      await outer.setProps({ open: true })
      await nextTick()
      expect(document.body.style.overflow).toBe('hidden')

      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      await wrapper.setProps({ open: false })
      await nextTick()
      await nextTick()

      // The lock is counted, not boolean: the outer modal is still on screen,
      // so the page must still not scroll behind it. Before NbModal counted,
      // the inner dialog closing cleared it for both.
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('treats a backdrop click as cancel', async () => {
      const wrapper = mountConfirm()
      const overlay = dialogEl()!.parentElement as HTMLElement
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })

    it('treats the close button as cancel, not as a third answer', async () => {
      const wrapper = mountConfirm()
      closeEl().click()
      await nextTick()
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })
  })

  describe('pending state', () => {
    it('locks both buttons and announces the wait', async () => {
      mountConfirm({ busy: true, busyLabel: 'Deleting...' })
      await nextTick()
      expect(cancelEl().hasAttribute('disabled')).toBe(true)
      expect(confirmEl().hasAttribute('disabled')).toBe(true)
      const status = dialogEl()!.querySelector('.nb-confirm__status')!
      expect(status.getAttribute('role')).toBe('status')
      expect(status.textContent!.trim()).toBe('Deleting...')
    })

    it('takes the close button out of service instead of leaving it inert', async () => {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(closeEl().disabled).toBe(false)

      await wrapper.setProps({ busy: true })
      await nextTick()
      await nextTick()
      // The alternative shipped once: an enabled, focusable X that swallowed
      // the click and did nothing.
      expect(closeEl().disabled).toBe(true)
      expect(closeEl().getAttribute('aria-disabled')).toBe('true')

      await wrapper.setProps({ busy: false })
      await nextTick()
      await nextTick()
      expect(closeEl().disabled).toBe(false)
      expect(closeEl().hasAttribute('aria-disabled')).toBe(false)
    })

    it('does not emit confirm a second time while busy', async () => {
      const wrapper = mountConfirm({ busy: true })
      confirmEl().click()
      await nextTick()
      expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('refuses Escape while busy, because a fired action cannot be un-fired', async () => {
      const wrapper = mountConfirm({ busy: true })
      pressEscape()
      await nextTick()
      expect(wrapper.emitted('cancel')).toBeUndefined()
      expect(dialogEl()).not.toBeNull()
    })

    it('shows a failure without closing', async () => {
      mountConfirm({ error: 'Environment is locked.' })
      await nextTick()
      expect(text()).toContain('Environment is locked.')
      expect(dialogEl()).not.toBeNull()
    })
  })

  describe('type-to-confirm', () => {
    function setValue(input: HTMLInputElement, value: string) {
      input.value = value
      input.dispatchEvent(new Event('input', { bubbles: true }))
      return nextTick()
    }

    it('disables confirm until the phrase matches exactly', async () => {
      mountConfirm({ typeToConfirm: 'production' })
      await nextTick()
      expect(confirmEl().hasAttribute('disabled')).toBe(true)

      await setValue(gateInput(), 'Production')
      expect(confirmEl().hasAttribute('disabled')).toBe(true)

      await setValue(gateInput(), 'production')
      expect(confirmEl().hasAttribute('disabled')).toBe(false)
    })

    it('ignores whitespace pasted around the phrase', async () => {
      mountConfirm({ typeToConfirm: 'production' })
      await nextTick()
      await setValue(gateInput(), '  production ')
      expect(confirmEl().hasAttribute('disabled')).toBe(false)
    })

    it('labels the field with the exact phrase, and takes an override', async () => {
      mountConfirm({ typeToConfirm: 'production' })
      await nextTick()
      expect(
        dialogEl()!.querySelector('.nb-confirm__gate')!.textContent,
      ).toContain('Type production to confirm')
      mounted.pop()!.unmount()

      mountConfirm({
        typeToConfirm: 'production',
        typeToConfirmLabel: 'Escriba production para confirmar',
      })
      await nextTick()
      expect(
        dialogEl()!.querySelector('.nb-confirm__gate')!.textContent,
      ).toContain('Escriba production para confirmar')
    })

    it('renders no gate when none is asked for', () => {
      mountConfirm()
      expect(dialogEl()!.querySelector('.nb-confirm__gate')).toBeNull()
      expect(dialogEl()!.querySelector('input')).toBeNull()
    })

    it('clears the typed phrase between openings', async () => {
      const wrapper = mountConfirm({ typeToConfirm: 'production' })
      await nextTick()
      await setValue(gateInput(), 'production')
      expect(confirmEl().hasAttribute('disabled')).toBe(false)

      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()
      expect(confirmEl().hasAttribute('disabled')).toBe(true)
    })
  })
})

describe('useConfirm', () => {
  // Deliberately the same document-level selectors the component half uses.
  // The host div is where the app is mounted; the dialog is teleported out of
  // it to <body> and is its sibling, so anything scoped inside the host would
  // match nothing.
  const hostEl = () => document.querySelector('[data-nb-confirm-host]')

  it('mounts its own host: nothing to install, nothing to place in App.vue', async () => {
    const confirm = useConfirm()
    expect(hostEl()).toBeNull()

    const answer = confirm({ title: 'Delete environment' })
    await nextTick()
    expect(hostEl()).not.toBeNull()
    expect(dialogEl()).not.toBeNull()
    // The dialog is NOT inside the host element. If this ever becomes true,
    // NbModal stopped teleporting and every selector here needs rereading.
    expect(hostEl()!.contains(dialogEl())).toBe(false)

    cancelEl().click()
    expect(await answer).toBe(false)
  })

  it('resolves true on confirm and false on cancel', async () => {
    const confirm = useConfirm()

    const yes = confirm({ title: 'Delete environment' })
    await nextTick()
    confirmEl().click()
    expect(await yes).toBe(true)

    // The answered dialog stays rendered for the length of its own exit, so
    // the next question is waited for by name rather than by clock.
    const no = confirm({ title: 'Revoke key' })
    await waitFor(() => text().includes('Revoke key'), 'the second question')
    cancelEl().click()
    expect(await no).toBe(false)
  })

  it('carries the request through to the dialog', async () => {
    const confirm = useConfirm()
    const answer = confirm({
      title: 'Delete environment',
      subject: 'production',
      subjectLabel: 'Environment',
      confirmLabel: 'Delete environment',
    })
    await nextTick()
    expect(text()).toContain('Delete environment')
    expect(
      dialogEl()!.querySelector('.nb-confirm__subject-name')!.textContent,
    ).toBe('production')
    cancelEl().click()
    await answer
  })

  it('renders every sibling in its own app, gate included, with nothing unresolved', async () => {
    // The host is a bare createApp() with no plugin installed, so a sibling
    // resolved by name rather than imported renders as an unknown element and
    // Vue only warns. The gate is the deepest branch (NbTextInput, which
    // resolves NbGrid globally), so it is the one that proves the
    // registration list in useConfirm.composable.ts is still complete.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const confirm = useConfirm()
      const answer = confirm({
        title: 'Delete environment',
        typeToConfirm: 'production',
      })
      await nextTick()

      const dialog = dialogEl()!
      expect(dialog.querySelector('input')).not.toBeNull()
      expect(dialog.querySelector('label')).not.toBeNull()
      // An unresolved component leaves its own tag name in the tree.
      expect(dialog.querySelector('nbgrid,nbicon,nblabel,nbmessage')).toBeNull()
      expect(error).not.toHaveBeenCalled()

      const gate = dialog.querySelector<HTMLInputElement>('input')!
      expect(confirmEl().hasAttribute('disabled')).toBe(true)
      gate.value = 'production'
      gate.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()
      expect(confirmEl().hasAttribute('disabled')).toBe(false)

      confirmEl().click()
      expect(await answer).toBe(true)
    } finally {
      warn.mockRestore()
      error.mockRestore()
    }
  })

  it('awaits onConfirm, locking the dialog so it cannot be fired twice', async () => {
    const confirm = useConfirm()
    let release!: () => void
    const gate = new Promise<void>((r) => {
      release = r
    })
    const action = vi.fn(() => gate)

    const answer = confirm({ title: 'Delete environment', onConfirm: action })
    await nextTick()

    confirmEl().click()
    await flushPromises()
    expect(action).toHaveBeenCalledTimes(1)

    // The second and third clicks are the double-fire this exists to stop.
    confirmEl().click()
    confirmEl().click()
    await flushPromises()
    expect(action).toHaveBeenCalledTimes(1)
    expect(dialogEl()).not.toBeNull()

    // And neither Escape nor the close X may take the dialog away from under
    // a request that has already left the building.
    pressEscape()
    closeEl().click()
    await flushPromises()
    expect(dialogEl()).not.toBeNull()
    expect(closeEl().disabled).toBe(true)

    release()
    expect(await answer).toBe(true)
  })

  it('keeps the dialog open on failure and resolves false only if the user then cancels', async () => {
    const confirm = useConfirm()
    const action = vi.fn(() => Promise.reject(new Error('Environment locked')))

    const answer = confirm({ title: 'Delete environment', onConfirm: action })
    await nextTick()
    confirmEl().click()
    await flushPromises()

    expect(dialogEl()).not.toBeNull()
    expect(text()).toContain('Environment locked')

    cancelEl().click()
    expect(await answer).toBe(false)
  })

  it('lets a caller format the failure', async () => {
    const confirm = useConfirm()
    const answer = confirm({
      title: 'Delete environment',
      onConfirm: () => Promise.reject({ status: 423 }),
      formatError: (error) =>
        `Server said ${(error as { status: number }).status}`,
    })
    await nextTick()
    confirmEl().click()
    await flushPromises()
    expect(text()).toContain('Server said 423')
    cancelEl().click()
    await answer
  })

  it('queues a second question instead of stacking two scrims', async () => {
    const confirm = useConfirm()
    const first = confirm({ title: 'Delete environment' })
    const second = confirm({ title: 'Revoke key' })
    await nextTick()

    expect(dialogEls()).toHaveLength(1)
    expect(text()).toContain('Delete environment')

    cancelEl().click()
    expect(await first).toBe(false)

    await waitFor(() => text().includes('Revoke key'), 'the queued question')
    confirmEl().click()
    expect(await second).toBe(true)
  })

  it('dismissConfirms resolves everything outstanding to false and tears the host down', async () => {
    const confirm = useConfirm()
    const first = confirm({ title: 'Delete environment' })
    const second = confirm({ title: 'Revoke key' })
    await nextTick()

    dismissConfirms()

    expect(await first).toBe(false)
    expect(await second).toBe(false)
    expect(hostEl()).toBeNull()
    expect(dialogEl()).toBeNull()
  })

  it('dismissConfirms hands focus back to the opener instead of dropping it on <body>', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const confirm = useConfirm()
    const answer = confirm({ title: 'Delete environment' })
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(cancelEl())

    // What a router guard calls. A keyboard user must not be left at the top
    // of the next page with no idea where they are.
    dismissConfirms()
    expect(await answer).toBe(false)
    expect(document.activeElement).toBe(opener)
  })

  it('does not leak the behavioural options onto the DOM', async () => {
    const confirm = useConfirm()
    const answer = confirm({
      title: 'Delete environment',
      onConfirm: () => undefined,
      formatError: () => 'x',
    })
    await nextTick()
    expect(dialogEl()!.hasAttribute('formaterror')).toBe(false)
    cancelEl().click()
    await answer
  })
})

// ---------------------------------------------------------------------------
// The pending state is the one this component exists to make safe, and it is
// also the one where every control it owns is disabled at once. jsdom never
// blurs a disabled element, so the browser's half of the sequence (focus
// falling to <body> the moment the focused button is disabled) is reproduced
// by hand here rather than assumed away.
// ---------------------------------------------------------------------------
const raf = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

describe('NbConfirm focus while the action is in flight', () => {
  async function openThenBusy(props: Record<string, unknown> = {}) {
    const wrapper = mountConfirm({ open: false, ...props })
    await wrapper.setProps({ open: true })
    await nextTick()
    await wrapper.setProps({ busy: true })
    await nextTick()
    await nextTick()
    return wrapper
  }

  it('has nothing focusable left, which is why the dialog itself takes focus', async () => {
    await openThenBusy()
    const dialog = dialogEl()!

    // Cancel, confirm and the close control are all disabled together. This
    // is the state, not an accident of the test.
    expect(
      dialog.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    ).toHaveLength(0)

    expect(dialog.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(dialog)
  })

  it('recovers focus from <body>, where a browser drops it when the focused control is disabled', async () => {
    await openThenBusy()
    const dialog = dialogEl()!
    ;(document.activeElement as HTMLElement | null)?.blur()
    expect(document.activeElement).toBe(document.body)

    // relatedTarget is null: a blur to nothing, which is exactly what
    // disabling the focused element produces.
    dialog.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    )
    await raf()
    expect(document.activeElement).toBe(dialog)
  })

  it('does not let Tab walk out onto the page it is about to delete from', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    await openThenBusy()

    outside.focus()
    pressTab()
    expect(document.activeElement).toBe(dialogEl())

    pressTab(true)
    expect(dialogEl()!.contains(document.activeElement)).toBe(true)
  })

  it('moves focus to the failure when the work comes back with one', async () => {
    const wrapper = await openThenBusy()
    await wrapper.setProps({ busy: false, error: 'Environment is locked.' })
    await nextTick()
    await nextTick()

    const failure = dialogEl()!.querySelector('.nb-confirm__error')!
    expect(document.activeElement).toBe(failure)
    expect(failure.getAttribute('tabindex')).toBe('-1')
    expect(failure.textContent).toContain('Environment is locked.')
  })

  it('puts focus back on a control once the buttons come back', async () => {
    const wrapper = await openThenBusy()
    await wrapper.setProps({ busy: false })
    await nextTick()
    await nextTick()
    expect(dialogEl()!.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).not.toBe(document.body)
  })
})

describe('NbConfirm Escape ordering', () => {
  it('leaves Escape to a popup one of its own controls teleported out', async () => {
    const wrapper = mountConfirm({ open: false })
    await wrapper.setProps({ open: true })
    await nextTick()

    // An open NbSelect list inside the dialog body. Escape there means
    // "close the list", and the dialog must not answer it.
    const popup = document.createElement('div')
    popup.className = 'nb-select__dropdown'
    popup.innerHTML = '<button>Option</button>'
    document.body.appendChild(popup)
    const option = popup.querySelector('button')!
    option.focus()

    pressEscape(option)
    await nextTick()
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(dialogEl()).not.toBeNull()
  })

  it('is answered by the confirm in front of the user, not the older one', async () => {
    // Two components rendered from route or store state, which the docs
    // recommend for exactly that case. Both listen on the document.
    const first = mountConfirm({ title: 'Delete environment' })
    const second = mountConfirm({ title: 'Revoke key' })
    await nextTick()
    expect(dialogEls()).toHaveLength(2)

    const topmost = dialogEls()[1] as HTMLElement
    pressEscape(topmost)
    await nextTick()

    expect(second.emitted('cancel')).toHaveLength(1)
    expect(first.emitted('cancel')).toBeUndefined()
  })
})

describe('NbModal corrections NbConfirm relies on', () => {
  it('re-decides the scroll region when the body changes size after opening', async () => {
    const observers: (() => void)[] = []
    const original = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        observers.push(callback)
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver

    try {
      const wrapper = mountConfirm({ open: false })
      await wrapper.setProps({ open: true })
      await nextTick()

      const body = modalBody()
      expect(body.hasAttribute('tabindex')).toBe(false)
      expect(observers.length).toBeGreaterThan(0)

      // The viewport shrank, or a translated string wrapped onto more lines.
      // Nothing about the dialog's props changed, which is the point: this
      // used to be computed once, at open.
      Object.defineProperty(body, 'scrollHeight', {
        configurable: true,
        value: 900,
      })
      Object.defineProperty(body, 'clientHeight', {
        configurable: true,
        value: 240,
      })
      observers.forEach((run) => run())
      await nextTick()

      expect(body.getAttribute('tabindex')).toBe('0')
      expect(body.getAttribute('role')).toBe('region')
    } finally {
      globalThis.ResizeObserver = original
    }
  })

  it('gives the page back the overflow it had, not a blank one', async () => {
    document.body.style.overflow = 'scroll'
    const wrapper = mountConfirm({ open: false })
    await wrapper.setProps({ open: true })
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ open: false })
    await nextTick()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('answers Escape from the topmost modal only, on NbModal itself', async () => {
    const under = mount(NbModal, {
      props: { open: true, title: 'Edit environment' },
      attachTo: document.body,
    })
    const over = mount(NbModal, { props: { open: true, title: 'Details' } })
    mounted.push(under, over)
    await nextTick()

    const dialogs = document.querySelectorAll('[aria-modal="true"]')
    dialogs[dialogs.length - 1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    await nextTick()

    expect(over.emitted('close')).toHaveLength(1)
    expect(under.emitted('close')).toBeUndefined()
  })

  it('takes the close control out of service when asked, without a wrapper reaching into its DOM', async () => {
    const modal = mount(NbModal, {
      props: { open: true, title: 'Edit', closeDisabled: true },
      attachTo: document.body,
    })
    mounted.push(modal)
    await nextTick()
    const close = document.querySelector<HTMLButtonElement>('.nb-modal--close')!
    expect(close.disabled).toBe(true)
    expect(close.getAttribute('aria-disabled')).toBe('true')
  })
})

describe('useConfirm pending-state escape hatches', () => {
  it('turns a hung onConfirm into a failure the user can act on', async () => {
    vi.useFakeTimers()
    try {
      const confirm = useConfirm()
      // Never settles. Without a timeout every control is locked forever and
      // the dialog cannot be dismissed by any means at all.
      const answer = confirm({
        title: 'Delete environment',
        onConfirm: () => new Promise(() => {}),
        timeout: 5000,
        timeoutMessage: 'The API did not answer.',
      })
      await nextTick()
      confirmEl().click()
      await nextTick()
      expect(cancelEl().hasAttribute('disabled')).toBe(true)

      await vi.advanceTimersByTimeAsync(5000)
      await nextTick()

      expect(text()).toContain('The API did not answer.')
      expect(cancelEl().hasAttribute('disabled')).toBe(false)

      cancelEl().click()
      await vi.advanceTimersByTimeAsync(300)
      expect(await answer).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a finished beat when one is asked for, and closes itself', async () => {
    vi.useFakeTimers()
    try {
      const confirm = useConfirm()
      const answer = confirm({
        title: 'Delete environment',
        successLabel: 'Environment deleted',
        onConfirm: async () => undefined,
      })
      await nextTick()
      confirmEl().click()
      await vi.advanceTimersByTimeAsync(0)
      await nextTick()

      expect(text()).toContain('Environment deleted')
      // The question is answered, so nothing may re-answer it.
      pressEscape()
      await nextTick()
      expect(dialogEl()).not.toBeNull()

      await vi.advanceTimersByTimeAsync(1000)
      expect(await answer).toBe(true)
      await vi.advanceTimersByTimeAsync(300)
      expect(dialogEl()).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes with no beat at all unless a success line is supplied', async () => {
    const confirm = useConfirm()
    const answer = confirm({
      title: 'Delete environment',
      onConfirm: async () => undefined,
    })
    await nextTick()
    confirmEl().click()
    expect(await answer).toBe(true)
    await nextTick()
    // The promise resolves as the dialog starts leaving, with no success
    // line ever rendered: the default path is unchanged by the beat.
    expect(document.querySelector('.nb-confirm__status--success')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The guarantee: nothing is confirmed that the user did not confirm.
//
// Every test below lets a request outlive the dialog that started it, which
// is the shape of failure the rest of this suite was blind to. The flows are
// not exotic: a slow DELETE plus the route change the docs recommend
// handling, or a retry after the timeout escape hatch. Before the entry
// identity check in useConfirm.composable.ts, each of these answered the NEXT
// question with the previous one's result.
// ---------------------------------------------------------------------------
describe('useConfirm ownership of a request in flight', () => {
  function deferred<T = void>() {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  /** Whether a promise has settled, without waiting on it forever. */
  async function isSettled(promise: Promise<unknown>) {
    let settled = false
    void promise.then(
      () => {
        settled = true
      },
      () => {
        settled = true
      },
    )
    await flushPromises()
    return settled
  }

  it('does not answer the next question with a dead request, resolved', async () => {
    const confirm = useConfirm()
    const work = deferred()

    // A: the user confirms, and the DELETE is slow.
    const a = confirm({
      title: 'Delete environment',
      onConfirm: () => work.promise,
    })
    await nextTick()
    confirmEl().click()
    await nextTick()

    // The ground moves: a router guard tears the dialog down. This is the
    // exact call the docs tell the reader to make on a route change.
    dismissConfirms()
    expect(await a).toBe(false)

    // B is asked, and it is a different destructive action.
    const b = confirm({ title: 'Revoke every API key' })
    await waitFor(() => text().includes('Revoke every API key'), 'question B')

    // A's request finally lands.
    work.resolve()
    await flushPromises()
    await nextTick()

    // B is untouched: still on screen, still unanswered.
    expect(dialogEl()).not.toBeNull()
    expect(text()).toContain('Revoke every API key')
    expect(await isSettled(b)).toBe(false)

    cancelEl().click()
    expect(await b).toBe(false)
  })

  it('does not print a dead request failure inside the next question', async () => {
    const confirm = useConfirm()
    const work = deferred()

    const a = confirm({
      title: 'Delete environment',
      onConfirm: () => work.promise,
    })
    await nextTick()
    confirmEl().click()
    await nextTick()

    dismissConfirms()
    expect(await a).toBe(false)

    const b = confirm({ title: 'Revoke every API key' })
    await waitFor(() => text().includes('Revoke every API key'), 'question B')

    work.reject(new Error('Environment is locked'))
    await flushPromises()
    await nextTick()

    // The message belongs to a record B never touched.
    expect(text()).not.toContain('Environment is locked')
    expect(dialogEl()!.querySelector('.nb-confirm__error')).toBeNull()
    expect(dialogEl()!.getAttribute('aria-busy')).toBeNull()

    cancelEl().click()
    expect(await b).toBe(false)
  })

  it('leaves the queued question alone when the one in front of it dies mid-request', async () => {
    // Same shape, but the second question was already waiting in the queue
    // rather than asked afterwards, so the entry A resolves against is one
    // the composable itself chose.
    const confirm = useConfirm()
    const work = deferred()

    const a = confirm({
      title: 'Delete environment',
      onConfirm: () => work.promise,
    })
    const b = confirm({ title: 'Revoke every API key' })
    await nextTick()
    confirmEl().click()
    await nextTick()

    // Cancelling A is not possible while it is busy, which is the point, so
    // the only way out is the teardown, and it must not take B with it into
    // an answer nobody gave.
    dismissConfirms()
    expect(await a).toBe(false)
    expect(await b).toBe(false)

    work.resolve()
    await flushPromises()
    expect(dialogEl()).toBeNull()
  })

  it('ignores the first request when the user retried after a timeout', async () => {
    // The timeout hatch hands the buttons back while the first request may
    // still be running. If that first one then succeeds, it is answering a
    // question the user has already asked again.
    const confirm = useConfirm()
    const first = deferred()
    const second = deferred()
    const calls: number[] = []
    let n = 0

    const answer = confirm({
      title: 'Delete environment',
      timeout: 10,
      onConfirm: () => {
        calls.push(++n)
        return n === 1 ? first.promise : second.promise
      },
    })
    await nextTick()
    confirmEl().click()

    await waitFor(() => text().includes('taking longer'), 'the timeout notice')
    expect(await isSettled(answer)).toBe(false)

    // Retry.
    confirmEl().click()
    await nextTick()
    expect(calls).toEqual([1, 2])

    // The abandoned first request lands.
    first.resolve()
    await flushPromises()
    expect(await isSettled(answer)).toBe(false)
    expect(dialogEl()).not.toBeNull()

    // The attempt the user is actually waiting on.
    second.resolve()
    await flushPromises()
    expect(await answer).toBe(true)
  })

  it('does not let a dead request cancel the deadline of a live one', async () => {
    // Both attempts had their timeout on one module-level timer, so whichever
    // settled first cleared the other's deadline and the dialog it belonged
    // to could hang with every control disabled.
    const confirm = useConfirm()
    const first = deferred()
    const second = deferred()
    let n = 0

    const answer = confirm({
      title: 'Delete environment',
      timeout: 30,
      timeoutMessage: 'Still running.',
      onConfirm: () => (++n === 1 ? first.promise : second.promise),
    })
    await nextTick()
    confirmEl().click()
    await waitFor(() => text().includes('Still running.'), 'first timeout')

    confirmEl().click()
    await nextTick()
    first.resolve()
    await flushPromises()

    // The second attempt's own deadline still fires.
    await waitFor(() => text().includes('Still running.'), 'second timeout')
    cancelEl().click()
    expect(await answer).toBe(false)
    second.resolve()
  })
})

describe('NbConfirm double-fire guard', () => {
  // NbButton already refuses to emit while disabled or loading. That is not
  // enough: the guarantee cannot depend on which button occupies the footer,
  // and a click dispatched by application code, a test or an automation
  // driver goes straight past the attribute. These emit from the child
  // component, exactly as a swapped-in button would.
  function fireConfirmButton(wrapper: ReturnType<typeof mountConfirm>) {
    const buttons = wrapper.findAllComponents(NbButton)
    buttons[buttons.length - 1].vm.$emit('click', new MouseEvent('click'))
  }

  it('does not emit confirm while the action is in flight', async () => {
    const wrapper = mountConfirm({ busy: true })
    await nextTick()
    fireConfirmButton(wrapper)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('does not emit confirm during the finished beat', async () => {
    const wrapper = mountConfirm({ succeeded: true, successLabel: 'Deleted' })
    await nextTick()
    fireConfirmButton(wrapper)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('does not emit confirm while the typed gate is unmet', async () => {
    const wrapper = mountConfirm({ typeToConfirm: 'production' })
    await nextTick()
    fireConfirmButton(wrapper)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('still emits once when everything is in order', async () => {
    const wrapper = mountConfirm()
    await nextTick()
    fireConfirmButton(wrapper)
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })
})

describe('NbConfirm and popups it does not own', () => {
  function openPopup(className: string, attrs: Record<string, string> = {}) {
    const popup = document.createElement('div')
    popup.className = className
    for (const [key, value] of Object.entries(attrs))
      popup.setAttribute(key, value)
    const option = document.createElement('button')
    option.textContent = 'An option'
    popup.appendChild(option)
    document.body.appendChild(popup)
    option.focus()
    return { popup, option }
  }

  it('exempts a popup named by the floatingSelectors prop', async () => {
    const wrapper = mountConfirm({ floatingSelectors: ['.acme-combo-menu'] })
    await nextTick()
    const { option } = openPopup('acme-combo-menu')

    pressEscape(option)
    await nextTick()
    // Escape closed the list, not the question.
    expect(wrapper.emitted('cancel')).toBeUndefined()

    // And Tab does not haul focus back out of it.
    pressTab()
    await nextTick()
    expect(document.activeElement).toBe(option)
  })

  it('exempts a popup registered once for the whole application', async () => {
    const undo = registerConfirmFloatingSelector('.tomselect-dropdown')
    try {
      const wrapper = mountConfirm()
      await nextTick()
      const { option } = openPopup('tomselect-dropdown')
      pressEscape(option)
      await nextTick()
      expect(wrapper.emitted('cancel')).toBeUndefined()
    } finally {
      undo()
    }
  })

  it('still answers Escape from a popup nobody claimed', async () => {
    const wrapper = mountConfirm()
    await nextTick()
    const { option } = openPopup('some-unknown-menu')
    pressEscape(option)
    await nextTick()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})

describe('NbConfirm slot content the trap has to know about', () => {
  it('cycles through content types a button-only selector would miss', async () => {
    // Every button in the dialog is out of service while the action runs, so
    // the only tab stops left are the ones the slot brought. If the selector
    // list does not know about them, the trap decides there is nothing to
    // cycle and pins focus to the dialog box instead, which is a rich-text
    // field the user cannot reach.
    const wrapper = mountConfirm(
      { busy: true },
      {
        slots: {
          default:
            '<div><iframe title="Preview"></iframe>' +
            '<div contenteditable="true">Reason</div>' +
            '<a href="#doc" tabindex="-1">Skipped</a></div>',
        },
      },
    )
    await nextTick()

    const frame = dialogEl()!.querySelector<HTMLElement>('iframe')!
    const editable =
      dialogEl()!.querySelector<HTMLElement>('[contenteditable]')!
    const skipped = dialogEl()!.querySelector<HTMLElement>('a[href]')!

    // Forward from the last stop wraps to the first, and the two stops are
    // the iframe and the contenteditable, not the link that took itself out
    // of the tab order.
    editable.focus()
    pressTab()
    await nextTick()
    expect(document.activeElement).toBe(frame)

    pressTab(true)
    await nextTick()
    expect(document.activeElement).toBe(editable)
    expect(document.activeElement).not.toBe(skipped)

    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})

describe('NbConfirm and a drag that ends on the scrim', () => {
  const overlay = () => dialogEl()!.parentElement as HTMLElement

  it('does not cancel when the press started inside the dialog', async () => {
    // Selecting the name of the record to copy it, and releasing past the
    // edge of the dialog, is a click on the overlay by the DOM's reckoning.
    const wrapper = mountConfirm({ subject: 'production' })
    await nextTick()
    const name = dialogEl()!.querySelector('.nb-confirm__subject-name')!

    name.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('still cancels on a press that starts and ends on the scrim', async () => {
    const wrapper = mountConfirm()
    await nextTick()
    overlay().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('still closes on the close button, which is a press inside', async () => {
    const wrapper = mountConfirm()
    await nextTick()
    closeEl().dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    closeEl().dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})

describe('useConfirm body content', () => {
  it('reaches the default slot from an options object', async () => {
    // Without this the slot is documented but unreachable for every caller
    // who uses the composable, which is nearly all of them.
    const confirm = useConfirm()
    const answer = confirm({
      title: 'Delete environment',
      body: () =>
        h('ul', { class: 'blast-radius' }, [
          h('li', '4 releases'),
          h('li', '2 keys'),
        ]),
    })
    await nextTick()

    const list = dialogEl()!.querySelector('.blast-radius')!
    expect(list.textContent).toContain('4 releases')
    // It counts as the description, so the dialog is described by it.
    expect(dialogEl()!.getAttribute('aria-describedby')).toBe(
      dialogEl()!.querySelector('.nb-confirm__body')!.id,
    )
    expect(dialogEl()!.hasAttribute('body')).toBe(false)

    cancelEl().click()
    expect(await answer).toBe(false)
  })
})
