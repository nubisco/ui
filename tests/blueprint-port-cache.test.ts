import { describe, it, expect, beforeEach } from 'vitest'
import { createPortCache } from '../src/components/blueprint-port-cache'

function makePort(nodeId: string, portId: string): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('data-port', `${nodeId}:${portId}`)
  return el
}

describe('createPortCache', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.replaceChildren(container)
  })

  it('returns null when the port does not exist', () => {
    const cache = createPortCache(() => container)
    expect(cache.get('n1', 'p1')).toBeNull()
    expect(cache.size()).toBe(0)
  })

  it('returns the port element and caches it', () => {
    const el = makePort('n1', 'p1')
    container.appendChild(el)
    const cache = createPortCache(() => container)
    expect(cache.get('n1', 'p1')).toBe(el)
    expect(cache.size()).toBe(1)
  })

  it('serves subsequent lookups from cache (no extra DOM queries)', () => {
    // The port el must be attached to the document so isConnected===true
    // and the cache doesn't keep evicting it on every hit.
    const wrapper = document.createElement('div')
    document.body.appendChild(wrapper)
    const el = makePort('n1', 'p1')
    wrapper.appendChild(el)
    let querySelectorCalls = 0
    const proxy = new Proxy(wrapper, {
      get(target, prop, receiver) {
        if (prop === 'querySelector') {
          querySelectorCalls++
          return target.querySelector.bind(target)
        }
        return Reflect.get(target, prop, receiver)
      },
    }) as HTMLElement
    const cache = createPortCache(() => proxy)
    cache.get('n1', 'p1')
    cache.get('n1', 'p1')
    cache.get('n1', 'p1')
    expect(querySelectorCalls).toBe(1)
  })

  it('self-heals when the cached element is detached', () => {
    const el = makePort('n1', 'p1')
    container.appendChild(el)
    const cache = createPortCache(() => container)
    expect(cache.get('n1', 'p1')).toBe(el)

    // Card remounted — same data-port key, new element instance.
    container.removeChild(el)
    const fresh = makePort('n1', 'p1')
    container.appendChild(fresh)
    expect(cache.get('n1', 'p1')).toBe(fresh)
    expect(cache.size()).toBe(1)
  })

  it('returns null after the port is removed entirely', () => {
    const el = makePort('n1', 'p1')
    container.appendChild(el)
    const cache = createPortCache(() => container)
    expect(cache.get('n1', 'p1')).toBe(el)
    container.removeChild(el)
    expect(cache.get('n1', 'p1')).toBeNull()
    expect(cache.size()).toBe(0)
  })

  it('prune() drops disconnected entries', () => {
    const a = makePort('a', 'p')
    const b = makePort('b', 'p')
    container.append(a, b)
    const cache = createPortCache(() => container)
    cache.get('a', 'p')
    cache.get('b', 'p')
    expect(cache.size()).toBe(2)
    container.removeChild(a)
    cache.prune()
    expect(cache.size()).toBe(1)
    expect(cache.get('b', 'p')).toBe(b)
  })

  it('clear() empties the cache', () => {
    const a = makePort('a', 'p')
    container.appendChild(a)
    const cache = createPortCache(() => container)
    cache.get('a', 'p')
    cache.clear()
    expect(cache.size()).toBe(0)
  })

  it('returns null if container is unavailable', () => {
    const cache = createPortCache(() => null)
    expect(cache.get('n', 'p')).toBeNull()
  })

  it('handles many concurrent ports without quadratic cost', () => {
    for (let i = 0; i < 200; i++) {
      container.appendChild(makePort(`n${i}`, 'out'))
    }
    const cache = createPortCache(() => container)
    // Prime the cache once.
    for (let i = 0; i < 200; i++) cache.get(`n${i}`, 'out')
    expect(cache.size()).toBe(200)
    // 10k subsequent hits should all be cache hits.
    for (let n = 0; n < 10000; n++) {
      const i = n % 200
      expect(cache.get(`n${i}`, 'out')).not.toBeNull()
    }
  })
})
