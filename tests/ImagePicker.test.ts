import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import NbImagePicker from '../src/components/ImagePicker.vue'
import tooltipDirective from '@/directives/ToolTip.directive'

/** The tooltip is the app's global directive, as it is in a real host. */
const global = { plugins: [{ install: tooltipDirective }] }

enableAutoUnmount(afterEach)

const mountPicker = (props = {}) =>
  mount(NbImagePicker, { props, global, attachTo: document.body })

const png = (name = 'logo.png', bytes = 10) =>
  new File([new Uint8Array(bytes)], name, { type: 'image/png' })

/** A change event on the hidden input, with the files a person chose. */
async function choose(view: ReturnType<typeof mountPicker>, ...files: File[]) {
  const input = view.find<HTMLInputElement>('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: files,
    configurable: true,
  })
  await input.trigger('change')
}

async function dropOn(view: ReturnType<typeof mountPicker>, ...files: File[]) {
  await view.trigger('drop', { dataTransfer: { files } })
}

describe('NbImagePicker', () => {
  describe('empty', () => {
    it('is a labelled drop target, with no remove button', () => {
      const view = mountPicker({ label: 'Add logo' })
      expect(view.find('.nb-image-picker__image').exists()).toBe(false)
      expect(
        view.find('.nb-image-picker__surface').attributes('aria-label'),
      ).toBe('Add logo')
      expect(view.text()).toContain('Add logo')
      expect(view.find('.nb-image-picker__remove').exists()).toBe(false)
    })
  })

  describe('with an image', () => {
    it('shows it, named for a screen reader', () => {
      const view = mountPicker({
        src: 'data:image/png;base64,AAAA',
        alt: 'Acme logo',
      })
      const img = view.find('img')
      expect(img.attributes('src')).toBe('data:image/png;base64,AAAA')
      expect(img.attributes('alt')).toBe('Acme logo')
    })

    it('names the surface as the way to replace it', () => {
      const view = mountPicker({ src: '/logo.png', replaceLabel: 'Substituir' })
      expect(
        view.find('.nb-image-picker__surface').attributes('aria-label'),
      ).toBe('Substituir')
    })
  })

  describe('picking', () => {
    it('emits the chosen file', async () => {
      const view = mountPicker()
      const file = png()
      await choose(view, file)
      expect(view.emitted('pick')).toEqual([[file]])
    })

    it('opens the file dialog from the surface', async () => {
      const view = mountPicker()
      let clicked = 0
      view
        .find('input[type="file"]')
        .element.addEventListener('click', () => clicked++)
      await view.find('.nb-image-picker__surface').trigger('click')
      expect(clicked).toBe(1)
    })

    it('takes images by default, and passes accept through', () => {
      expect(mountPicker().find('input').attributes('accept')).toBe('image/*')
      expect(
        mountPicker({ accept: '.svg,image/png' })
          .find('input')
          .attributes('accept'),
      ).toBe('.svg,image/png')
    })

    it('emits a dropped file', async () => {
      const view = mountPicker()
      const file = png()
      await dropOn(view, file)
      expect(view.emitted('pick')).toEqual([[file]])
    })

    it('rejects a file of the wrong type, on a drop as on a pick', async () => {
      const view = mountPicker()
      const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' })
      await dropOn(view, pdf)
      expect(view.emitted('pick')).toBeUndefined()
      expect(view.emitted('reject')).toEqual([[{ file: pdf, reason: 'type' }]])
    })

    it('reads an extension in accept', async () => {
      const view = mountPicker({ accept: '.svg' })
      const svg = new File(['<svg/>'], 'mark.SVG', { type: '' })
      await dropOn(view, svg)
      expect(view.emitted('pick')).toEqual([[svg]])
    })

    it('rejects a file over maxSize', async () => {
      const view = mountPicker({ maxSize: 100 })
      const big = png('big.png', 101)
      await choose(view, big)
      expect(view.emitted('pick')).toBeUndefined()
      expect(view.emitted('reject')).toEqual([[{ file: big, reason: 'size' }]])
      await choose(view, png('ok.png', 100))
      expect(view.emitted('pick')).toHaveLength(1)
    })
  })

  describe('drag', () => {
    it('shows the drop label while a file is over it', async () => {
      const view = mountPicker({ dropLabel: 'Largar aqui' })
      await view.trigger('dragenter')
      expect(view.classes()).toContain('nb-image-picker--dragging')
      expect(view.text()).toContain('Largar aqui')
      await view.trigger('dragleave')
      expect(view.classes()).not.toContain('nb-image-picker--dragging')
    })
  })

  describe('remove', () => {
    it('is on by default, named, and emits remove', async () => {
      const view = mountPicker({ src: '/logo.png', removeLabel: 'Delete logo' })
      const button = view.find('.nb-image-picker__remove')
      expect(button.exists()).toBe(true)
      expect(button.attributes('aria-label')).toBe('Delete logo')
      await button.trigger('click')
      expect(view.emitted('remove')).toHaveLength(1)
      // Removing does not open the file dialog
      expect(view.emitted('pick')).toBeUndefined()
    })

    it('is not a button inside the surface button', () => {
      const view = mountPicker({ src: '/logo.png' })
      expect(
        view
          .find('.nb-image-picker__surface .nb-image-picker__remove')
          .exists(),
      ).toBe(false)
    })

    it('is hidden with removable off', () => {
      const view = mountPicker({ src: '/logo.png', removable: false })
      expect(view.find('.nb-image-picker__remove').exists()).toBe(false)
    })

    it('stays but is unavailable with removeDisabled', async () => {
      const view = mountPicker({ src: '/logo.png', removeDisabled: true })
      const button = view.find('.nb-image-picker__remove')
      expect(button.exists()).toBe(true)
      expect(button.attributes('disabled')).toBeDefined()
      await button.trigger('click')
      expect(view.emitted('remove')).toBeUndefined()
    })

    it('does not keep removeDisabled alive when removable is off', () => {
      const view = mountPicker({
        src: '/logo.png',
        removable: false,
        removeDisabled: true,
      })
      expect(view.find('.nb-image-picker__remove').exists()).toBe(false)
    })
  })

  describe('loading and disabled', () => {
    it('blocks picking, dropping and removing while loading', async () => {
      const view = mountPicker({ src: '/logo.png', loading: true })
      expect(view.find('.nb-image-picker__loading').exists()).toBe(true)
      expect(
        view.find('.nb-image-picker__surface').attributes('aria-busy'),
      ).toBe('true')
      expect(
        view.find('.nb-image-picker__surface').attributes('disabled'),
      ).toBeDefined()
      expect(
        view.find('.nb-image-picker__remove').attributes('disabled'),
      ).toBeDefined()
      await dropOn(view, png())
      await choose(view, png())
      expect(view.emitted('pick')).toBeUndefined()
    })

    it('blocks everything when disabled, and does not highlight a drag', async () => {
      const view = mountPicker({ src: '/logo.png', disabled: true })
      await view.trigger('dragenter')
      expect(view.classes()).not.toContain('nb-image-picker--dragging')
      await dropOn(view, png())
      expect(view.emitted('pick')).toBeUndefined()
      expect(view.find('input').attributes('disabled')).toBeDefined()
    })
  })

  describe('size and shape', () => {
    it('takes a number as pixels and a string as a CSS length', () => {
      expect(mountPicker({ size: 96 }).attributes('style')).toContain(
        '--nb-image-picker-size: 96px',
      )
      expect(mountPicker({ size: '6rem' }).attributes('style')).toContain(
        '--nb-image-picker-size: 6rem',
      )
    })

    it('passes the ratio and fit to the box', () => {
      const style = mountPicker({ ratio: '3 / 1', fit: 'cover' }).attributes(
        'style',
      )
      expect(style).toContain('--nb-image-picker-ratio: 3 / 1')
      expect(style).toContain('--nb-image-picker-fit: cover')
    })
  })
})
