import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

/**
 * The validation wiring every form field shares: which message shows, the id
 * it carries, what the control points at, and when the message is announced.
 *
 * A field shows one message at a time, in the order error, warning, helper.
 * Each kind gets its own id derived from the field's id
 * (`{fieldId}-error`, `{fieldId}-warning`, `{fieldId}-helper`), so a test or
 * a consumer can reach the one that is showing without guessing.
 *
 * Announcing is the subtle part. A message rendered with the page is read
 * through `aria-describedby` when the control takes focus, which is the
 * right moment. Announcing it as well, on mount, makes every form with a
 * server-side error shout as it loads. So `live` stays `off` until a message
 * changes after mount: an error then mounts with `role="alert"`, a warning
 * with `role="status"`, and `key` changes with the text so the element is
 * mounted fresh, which is what screen readers reliably announce.
 */
// #region useFieldMessage
export type TFieldMessageVariant = 'error' | 'warning' | 'helper'
export type TFieldMessageLive = 'off' | 'alert' | 'status'

export interface IFieldMessageSource {
  error?: string | null
  warning?: string | null
  helper?: string | null
}

export function useFieldMessage(
  props: IFieldMessageSource,
  fieldId: MaybeRefOrGetter<string>,
) {
  const variant = computed<TFieldMessageVariant | null>(() => {
    if (props.error) return 'error'
    if (props.warning) return 'warning'
    if (props.helper) return 'helper'
    return null
  })

  const text = computed(() =>
    variant.value ? String(props[variant.value] ?? '') : '',
  )

  const ids = computed(() => {
    const base = toValue(fieldId)
    return {
      error: `${base}-error`,
      warning: `${base}-warning`,
      helper: `${base}-helper`,
    }
  })

  const messageId = computed(() =>
    variant.value ? ids.value[variant.value] : undefined,
  )

  const invalid = computed<'true' | undefined>(() =>
    props.error ? 'true' : undefined,
  )

  // Becomes true the first time a message changes after mount, never before.
  const changed = ref(false)
  watch(
    () => [props.error, props.warning, props.helper],
    () => {
      changed.value = true
    },
  )

  const live = computed<TFieldMessageLive>(() => {
    if (!changed.value) return 'off'
    if (variant.value === 'error') return 'alert'
    if (variant.value === 'warning') return 'status'
    return 'off'
  })

  const key = computed(() => `${variant.value ?? 'none'}:${text.value}`)

  return { variant, text, ids, messageId, invalid, live, key }
}

/**
 * Joins `aria-describedby` id lists, dropping empties and duplicates, so a
 * consumer's own `aria-describedby` survives beside the field's message.
 */
export function joinDescribedBy(
  ...parts: Array<string | null | undefined | false>
): string | undefined {
  const tokens = parts
    .filter(Boolean)
    .flatMap((p) => String(p).split(/\s+/))
    .filter(Boolean)
  const unique = [...new Set(tokens)]
  return unique.length ? unique.join(' ') : undefined
}
// #endregion useFieldMessage
