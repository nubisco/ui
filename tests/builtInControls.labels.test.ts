/**
 * The small built-in controls name their icon-only buttons with NbButton's
 * `label` (one name, one tooltip, never a second hand-wired copy of either),
 * and every word they render on their own comes from the string catalogue,
 * with the caller's prop winning over it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, type Component } from 'vue'
import { createI18n } from 'vue-i18n'
import {
  provideNbStrings,
  resetNbStrings,
} from '../src/composables/useNbStrings.composable'
import {
  NB_PHONE_QUERY,
  resetPhoneLayoutForTests,
} from '../src/composables/usePhoneLayout.composable'
import {
  NB_COMMAND_PALETTE_KEY,
  createCommandPaletteState,
} from '../src/composables/useCommandPalette.composable'
import NbButton from '../src/components/Button.vue'
import NbCopyButton from '../src/components/CopyButton.vue'
import NbBackToTop from '../src/components/BackToTop.vue'
import NbImagePicker from '../src/components/ImagePicker.vue'
import NbVideo from '../src/components/Video.vue'
import NbUserMenu from '../src/components/UserMenu.vue'
import NbBlueprintCard from '../src/components/BlueprintCard.vue'
import NbCommandPalette from '../src/components/CommandPalette.vue'

enableAutoUnmount(afterEach)

afterEach(() => {
  resetNbStrings()
  vi.unstubAllGlobals()
  resetPhoneLayoutForTests()
  document.body.innerHTML = ''
})

/** Mounts `child` under a provider that overrides the given strings. */
function withStrings(
  overrides: Parameters<typeof provideNbStrings>[0],
  child: Component,
  props: Record<string, unknown> = {},
) {
  return mount(
    defineComponent({
      setup() {
        provideNbStrings(overrides)
        return () => h(child, props)
      },
    }),
    { attachTo: document.body },
  )
}

describe('NbCopyButton', () => {
  it('names itself through label, with no tooltip directive of its own', () => {
    const w = mount(NbCopyButton, { props: { text: 'x' } })
    const button = w.find('button')
    expect(button.attributes('aria-label')).toBe('Copy')
    expect(w.findComponent(NbButton).props('label')).toBe('Copy')
  })

  it('reads its words from the catalogue, and a prop still wins', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const w = withStrings(
      { copyButtonCopy: 'Copiar', copyButtonCopied: 'Copiado' },
      NbCopyButton,
      { text: 'x' },
    )
    expect(w.find('button').attributes('aria-label')).toBe('Copiar')
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.find('button').attributes('aria-label')).toBe('Copiado')
    expect(w.find('[role="status"]').text()).toBe('Copiado')

    const own = withStrings({ copyButtonCopy: 'Copiar' }, NbCopyButton, {
      text: 'x',
      label: 'Copy link',
    })
    expect(own.find('button').attributes('aria-label')).toBe('Copy link')
  })
})

describe('NbBackToTop', () => {
  it('takes its name from the catalogue', async () => {
    Object.defineProperty(window, 'scrollY', {
      value: 5000,
      configurable: true,
    })
    const w = withStrings({ backToTop: 'Voltar ao topo' }, NbBackToTop, {
      threshold: 10,
    })
    await nextTick()
    expect(w.find('button').attributes('aria-label')).toBe('Voltar ao topo')
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
})

describe('NbImagePicker', () => {
  it('names the remove button through label, from the catalogue', () => {
    const w = withStrings({ imagePickerRemove: 'Remover' }, NbImagePicker, {
      src: '/logo.png',
    })
    const remove = w.find('.nb-image-picker__remove')
    expect(remove.attributes('aria-label')).toBe('Remover')
    expect(w.find('.nb-image-picker__surface').attributes('aria-label')).toBe(
      'Replace image',
    )
  })
})

describe('NbVideo', () => {
  it('reads play and pause from the catalogue', () => {
    const w = withStrings({ videoPlay: 'Reproduzir' }, NbVideo, {
      src: '/clip.mp4',
    })
    expect(w.find('button').attributes('aria-label')).toBe('Reproduzir')
  })
})

describe('NbUserMenu account rows', () => {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: {} } })

  it('removes an account through a real, named button beside the row', async () => {
    const w = mount(NbUserMenu, {
      props: {
        user: { email: 'jose@nubisco.io' },
        accounts: [
          { id: 'a', email: 'jose@nubisco.io', current: true },
          { id: 'b', email: 'tools@nubisco.io' },
        ],
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    await w.find('.nb-user-menu__avatar').trigger('click')
    const rows = document.body.querySelectorAll('.nb-user-menu__account-row')
    expect(rows).toHaveLength(2)
    // The current account has nothing to remove.
    expect(rows[0].querySelector('.nb-user-menu__remove')).toBeNull()
    const remove = rows[1].querySelector<HTMLButtonElement>(
      'button.nb-user-menu__remove',
    )
    expect(remove).not.toBeNull()
    expect(remove!.closest('.nb-user-menu__account')).toBeNull()
    expect(remove!.getAttribute('aria-label')).toBe(
      'Sign this account out of this browser',
    )
    remove!.click()
    expect(w.emitted('remove')?.[0]?.[0]).toMatchObject({ id: 'b' })
    expect(w.emitted('switch')).toBeUndefined()
  })
})

describe('NbBlueprintCard header', () => {
  it('names collapse and remove from the catalogue', () => {
    const w = withStrings(
      {
        blueprintCollapseCard: (title: string) => `Recolher ${title}`,
        blueprintRemoveCardNamed: (title: string) => `Remover ${title}`,
      },
      NbBlueprintCard,
      { id: 'c', title: 'Filtro', removable: true },
    )
    expect(
      w.find('.nb-blueprint-card__collapse').attributes('aria-label'),
    ).toBe('Recolher Filtro')
    expect(w.find('.nb-blueprint-card__remove').attributes('aria-label')).toBe(
      'Remover Filtro',
    )
  })
})

describe('NbCommandPalette', () => {
  function mountPalette(phone: boolean) {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: phone && query === NB_PHONE_QUERY,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const state = createCommandPaletteState()
    const w = mount(NbCommandPalette, {
      attachTo: document.body,
      global: {
        provide: { [NB_COMMAND_PALETTE_KEY as symbol]: state },
        stubs: { Transition: { template: '<div><slot /></div>' } },
      },
    })
    return { w, state }
  }

  it('reads its words from the catalogue', async () => {
    const { state } = mountPalette(false)
    state.open()
    await nextTick()
    await nextTick()
    const dialog = document.body.querySelector('[role="dialog"]')!
    expect(dialog.getAttribute('aria-label')).toBe('Command palette')
    expect(
      document.body.querySelector('.nb-command-palette__empty')?.textContent,
    ).toContain('Type to search commands')
    expect(document.body.querySelector('.nb-command-palette__close')).toBeNull()
  })

  it('gives a phone a named way out', async () => {
    const { state } = mountPalette(true)
    state.open()
    await nextTick()
    await nextTick()
    const close = document.body.querySelector<HTMLButtonElement>(
      '.nb-command-palette__close',
    )
    expect(close?.getAttribute('aria-label')).toBe('Close command palette')
    close!.click()
    expect(state.isOpen).toBe(false)
  })
})
