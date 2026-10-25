import { computed, type Component } from 'vue'
import { useRouterLink } from '@/composables/useRouterLink.composable'

/**
 * What a surface that may navigate or act needs to know to pick its element.
 *
 * Shared by `NbCard` and `NbStat`, so a card and a tile that look clickable
 * also behave the same way under a keyboard, a screen reader and a middle
 * click.
 */
export interface ISurfaceLinkProps {
  to?: string | Record<string, unknown>
  href?: string
  target?: string
  clickable?: boolean
  selected?: boolean
  disabled?: boolean
}

/**
 * A surface that navigates is a link, one that acts is a button, and one that
 * does neither is a div. Picking the element from the behaviour is what gives
 * each case the right keyboard and the right browser affordances without the
 * consumer having to ask for them.
 *
 * `to` behaves as it does on `NbButton`: a real `<RouterLink>` when the app has
 * a router, so navigation stays in the app and the link still has an href for
 * middle click and the status bar. Without a router a string `to` is a plain
 * link, and an object `to` (which only a router can resolve) is not a link.
 *
 * Must be called during `setup()`.
 */
export function useSurfaceLink(props: ISurfaceLinkProps, onSelect: () => void) {
  const routerLink = useRouterLink()

  const isRouterLink = computed(
    () => props.to != null && !props.disabled && !!routerLink.value,
  )
  const linkHref = computed<string | undefined>(() => {
    if (typeof props.to === 'string') return props.to
    return props.href || undefined
  })
  const isLink = computed(
    () => !props.disabled && (isRouterLink.value || !!linkHref.value),
  )
  const isInteractive = computed(
    () => (isLink.value || !!props.clickable) && !props.disabled,
  )
  const tag = computed<string | Component>(() => {
    if (isRouterLink.value) return routerLink.value as Component
    return isLink.value ? 'a' : 'div'
  })

  // Spread rather than bound one by one: RouterLink renders its own href on
  // the <a> it owns, and a fallthrough `href`, even an undefined one, would
  // land on top of it.
  const attrs = computed<Record<string, unknown>>(() => {
    const rel = props.target === '_blank' ? 'noopener' : undefined
    if (isRouterLink.value) return { to: props.to, target: props.target, rel }
    if (isLink.value) return { href: linkHref.value, target: props.target, rel }
    if (props.clickable && !props.disabled)
      return {
        role: 'button',
        tabindex: 0,
        'aria-pressed': props.selected ? true : undefined,
      }
    return {}
  })

  const acts = () => !!props.clickable && !props.disabled && !isLink.value

  function onClick() {
    if (acts()) onSelect()
  }

  function onKeydown(event: KeyboardEvent) {
    if (!acts()) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect()
  }

  return { tag, attrs, isLink, isInteractive, onClick, onKeydown }
}
