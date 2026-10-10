import { readonly, ref, type Ref } from 'vue'

/**
 * The phone layout, as a media query. Below 672px (the `md` breakpoint, where
 * NbShell collapses), or a touch screen too short to be anything but a phone
 * held sideways. A desktop, a desktop app window or a touch laptop driven by
 * a mouse reports a fine pointer or hover, so the second clause never
 * matches it.
 *
 * Kept in step with `$phone-query` in styles/variables/_breakpoints.scss: a
 * unit test compares the two.
 */
export const NB_PHONE_QUERY =
  '(max-width: 671.98px), (pointer: coarse) and (hover: none) and (max-height: 500px)'

/** The phone layout on a touch screen: where hit areas and field text grow. */
export const NB_PHONE_TOUCH_QUERY =
  '(max-width: 671.98px) and (pointer: coarse), (pointer: coarse) and (hover: none) and (max-height: 500px)'

interface IShared {
  phone: Ref<boolean>
  phoneTouch: Ref<boolean>
}

let shared: IShared | null = null

function watchQuery(query: string, target: Ref<boolean>): void {
  const media = window.matchMedia(query)
  target.value = media.matches
  const onChange = (event: MediaQueryListEvent) => {
    target.value = event.matches
  }
  if (typeof media.addEventListener === 'function')
    media.addEventListener('change', onChange)
  else if (typeof media.addListener === 'function') media.addListener(onChange)
}

/**
 * Whether the page is laid out for a phone.
 *
 * One listener per query for the whole app, shared by every caller, so a
 * hundred cards asking costs nothing. Off the document (tests without
 * matchMedia, SSR) both answers are false, which is the desktop answer.
 */
export function usePhoneLayout(): {
  phone: Readonly<Ref<boolean>>
  phoneTouch: Readonly<Ref<boolean>>
} {
  if (!shared) {
    shared = { phone: ref(false), phoneTouch: ref(false) }
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      watchQuery(NB_PHONE_QUERY, shared.phone)
      watchQuery(NB_PHONE_TOUCH_QUERY, shared.phoneTouch)
    }
  }
  return {
    phone: readonly(shared.phone),
    phoneTouch: readonly(shared.phoneTouch),
  }
}

/** Test hook: forget the shared listeners so a test can stub matchMedia. */
export function resetPhoneLayoutForTests(): void {
  shared = null
}
