import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import NbVideo from '../src/components/Video.vue'

enableAutoUnmount(afterEach)

const props = { src: '/loop.mp4', poster: '/loop.jpg' }

/** The observer the component created, so a test can scroll it in and out. */
let observed: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null =
  null

function setMedia(matches: Record<string, boolean>) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: Object.entries(matches).some(([k, v]) => v && query.includes(k)),
  }))
}

function scrollInto(view: boolean) {
  observed?.([{ isIntersecting: view }])
}

beforeEach(() => {
  observed = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
        observed = cb
      }
      observe() {}
      disconnect() {}
    },
  )
  setMedia({})
  // jsdom has no media playback: play and pause flip the element's events.
  // Like a browser, play is refused while the element has no source yet.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    if (!this.getAttribute('src'))
      return Promise.reject(new DOMException('no source', 'NotSupportedError'))
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('NbVideo', () => {
  it('paints the poster and loads nothing until it is on screen', async () => {
    const view = mount(NbVideo, { props })
    const video = view.find('video')
    expect(video.attributes('poster')).toBe('/loop.jpg')
    expect(video.attributes('src')).toBeUndefined()
    expect(video.attributes('preload')).toBe('none')
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()

    scrollInto(true)
    await flushPromises()
    expect(video.attributes('src')).toBe('/loop.mp4')
    expect((video.element as HTMLVideoElement).muted).toBe(true)
    expect(view.find('button').attributes('aria-label')).toBe('Pause video')
  })

  it('pauses off screen and resumes when it comes back', async () => {
    const view = mount(NbVideo, { props })
    scrollInto(true)
    await flushPromises()
    scrollInto(false)
    await flushPromises()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1)
    expect(view.find('button').attributes('aria-label')).toBe('Play video')
    scrollInto(true)
    await flushPromises()
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2)
  })

  it('never starts by itself under reduced motion, but plays on request', async () => {
    setMedia({ 'prefers-reduced-motion': true })
    const view = mount(NbVideo, { props })
    scrollInto(true)
    await flushPromises()
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    expect(view.find('video').attributes('src')).toBeUndefined()

    await view.find('button').trigger('click')
    await flushPromises()
    expect(view.find('video').attributes('src')).toBe('/loop.mp4')
    expect(view.find('button').attributes('aria-label')).toBe('Pause video')
  })

  it('never starts by itself when the visitor saves data', async () => {
    vi.stubGlobal('navigator', { ...navigator, connection: { saveData: true } })
    mount(NbVideo, { props })
    scrollInto(true)
    await flushPromises()
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })

  it('stays paused once the visitor paused it, even when it scrolls back in', async () => {
    const view = mount(NbVideo, { props })
    scrollInto(true)
    await flushPromises()
    await view.find('button').trigger('click')
    scrollInto(false)
    scrollInto(true)
    await flushPromises()
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)
    expect(view.find('button').attributes('aria-label')).toBe('Play video')
  })

  it('takes the mobile cut on a narrow screen', async () => {
    setMedia({ 'max-width: 767.98px': true })
    const view = mount(NbVideo, {
      props: { ...props, mobileSrc: '/loop-mobile.mp4' },
    })
    scrollInto(true)
    await flushPromises()
    expect(view.find('video').attributes('src')).toBe('/loop-mobile.mp4')
  })

  it('is hidden from screen readers unless it is labelled, and reserves its space', () => {
    const plain = mount(NbVideo, { props })
    expect(plain.find('video').attributes('aria-hidden')).toBe('true')
    const named = mount(NbVideo, {
      props: { ...props, label: 'A rig being wired', width: 1600, height: 900 },
    })
    expect(named.find('video').attributes('aria-label')).toBe(
      'A rig being wired',
    )
    expect(named.find('video').attributes('aria-hidden')).toBeUndefined()
    expect(named.find('.nb-video').attributes('style')).toContain(
      'aspect-ratio: 1600 / 900',
    )
  })
})
