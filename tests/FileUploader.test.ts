import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileUploader from '../src/components/FileUploader.vue'

function file(name = 'a.png', size = 10, type = 'image/png'): File {
  return new File([new Uint8Array(size)], name, { type })
}

function mountUploader(props: Record<string, unknown> = {}) {
  return mount(FileUploader, { props, attachTo: document.body })
}

// A drop as the browser delivers it: a dataTransfer carrying the files, and a
// dropEffect the handler may write to.
function dragData(files: File[] = []) {
  return { files, dropEffect: 'copy' }
}

describe('NbFileUploader', () => {
  describe('enabled (the default)', () => {
    it('renders the trigger, the input and no disabled attributes', () => {
      const wrapper = mountUploader()
      const button = wrapper.find('.nb-file-uploader__btn')
      const input = wrapper.find('input[type="file"]')
      expect(button.attributes('disabled')).toBeUndefined()
      expect(input.attributes('disabled')).toBeUndefined()
      expect(wrapper.classes()).not.toContain('nb-file-uploader--disabled')
    })

    it('opens the picker when the trigger is clicked', async () => {
      const wrapper = mountUploader()
      const input = wrapper.find('input[type="file"]')
        .element as HTMLInputElement
      const click = vi.spyOn(input, 'click')
      await wrapper.find('.nb-file-uploader__btn').trigger('click')
      expect(click).toHaveBeenCalledTimes(1)
    })

    it('shows the drop zone while dragging and adds dropped files', async () => {
      const wrapper = mountUploader()
      await wrapper.trigger('dragenter', { dataTransfer: dragData() })
      expect(wrapper.find('.nb-file-uploader__dropzone').exists()).toBe(true)
      await wrapper.trigger('drop', { dataTransfer: dragData([file()]) })
      expect(wrapper.find('.nb-file-uploader__dropzone').exists()).toBe(false)
      expect(wrapper.emitted('change')).toEqual([[[expect.any(File)]]])
      expect(wrapper.findAll('.nb-file-uploader__item')).toHaveLength(1)
    })

    it('removes a file from the list', async () => {
      const wrapper = mountUploader()
      await wrapper.trigger('drop', { dataTransfer: dragData([file()]) })
      await wrapper.find('.nb-file-uploader__remove').trigger('click')
      expect(wrapper.emitted('remove')).toHaveLength(1)
      expect(wrapper.findAll('.nb-file-uploader__item')).toHaveLength(0)
    })
  })

  describe('disabled', () => {
    it('disables the trigger and the file input, and marks the root', () => {
      const wrapper = mountUploader({ disabled: true })
      const button = wrapper.find('.nb-file-uploader__btn')
      const input = wrapper.find('input[type="file"]')
      expect(button.attributes('disabled')).toBeDefined()
      expect(input.attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('nb-file-uploader--disabled')
    })

    it('does not open the picker on a click', async () => {
      const wrapper = mountUploader({ disabled: true })
      const input = wrapper.find('input[type="file"]')
        .element as HTMLInputElement
      const click = vi.spyOn(input, 'click')
      await wrapper.find('.nb-file-uploader__btn').trigger('click')
      expect(click).not.toHaveBeenCalled()
    })

    it('does not open the picker from the keyboard', async () => {
      const wrapper = mountUploader({ disabled: true })
      const input = wrapper.find('input[type="file"]')
        .element as HTMLInputElement
      const click = vi.spyOn(input, 'click')
      const button = wrapper.find('.nb-file-uploader__btn')
      await button.trigger('keydown', { key: 'Enter' })
      await button.trigger('keydown', { key: ' ' })
      await button.trigger('keyup', { key: ' ' })
      expect(click).not.toHaveBeenCalled()
      // A natively disabled button cannot take focus, so Tab skips it.
      ;(button.element as HTMLButtonElement).focus()
      expect(document.activeElement).not.toBe(button.element)
      wrapper.unmount()
    })

    it('ignores a drag: no drop zone, and a none drop effect', async () => {
      const wrapper = mountUploader({ disabled: true })
      await wrapper.trigger('dragenter', { dataTransfer: dragData() })
      expect(wrapper.find('.nb-file-uploader__dropzone').exists()).toBe(false)
      const over = dragData()
      await wrapper.trigger('dragover', { dataTransfer: over })
      expect(over.dropEffect).toBe('none')
    })

    it('ignores a drop: no file is added and nothing is emitted', async () => {
      const wrapper = mountUploader({ disabled: true })
      await wrapper.trigger('drop', { dataTransfer: dragData([file()]) })
      expect(wrapper.emitted('change')).toBeUndefined()
      expect(wrapper.findAll('.nb-file-uploader__item')).toHaveLength(0)
    })

    it('still cancels the drop, so the browser does not open the file', async () => {
      const wrapper = mountUploader({ disabled: true })
      const event = new Event('drop', { cancelable: true, bubbles: true })
      Object.defineProperty(event, 'dataTransfer', {
        value: dragData([file()]),
      })
      wrapper.element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(true)
      expect(wrapper.emitted('change')).toBeUndefined()
    })

    it('ignores a change on the input', async () => {
      const wrapper = mountUploader({ disabled: true })
      const input = wrapper.find('input[type="file"]')
      Object.defineProperty(input.element, 'files', { value: [file()] })
      await input.trigger('change')
      expect(wrapper.emitted('change')).toBeUndefined()
    })

    it('keeps the files it already has: remove is disabled too', async () => {
      const wrapper = mountUploader()
      await wrapper.trigger('drop', { dataTransfer: dragData([file()]) })
      await wrapper.setProps({ disabled: true })
      const remove = wrapper.find('.nb-file-uploader__remove')
      expect(remove.attributes('disabled')).toBeDefined()
      await remove.trigger('click')
      expect(wrapper.emitted('remove')).toBeUndefined()
      expect(wrapper.findAll('.nb-file-uploader__item')).toHaveLength(1)
    })

    it('drops the highlight when it turns disabled mid-drag', async () => {
      const wrapper = mountUploader()
      await wrapper.trigger('dragenter', { dataTransfer: dragData() })
      expect(wrapper.find('.nb-file-uploader__dropzone').exists()).toBe(true)
      await wrapper.setProps({ disabled: true })
      expect(wrapper.find('.nb-file-uploader__dropzone').exists()).toBe(false)
      expect(wrapper.find('.nb-file-uploader__btn').exists()).toBe(true)
    })

    it('works again once re-enabled', async () => {
      const wrapper = mountUploader({ disabled: true })
      await wrapper.setProps({ disabled: false })
      await wrapper.trigger('drop', { dataTransfer: dragData([file()]) })
      expect(wrapper.emitted('change')).toHaveLength(1)
    })
  })
})
