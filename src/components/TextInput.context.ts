import type { InjectionKey, Ref } from 'vue'

/**
 * What something placed in `NbTextInput`'s `#dropdown` slot can reach: the
 * native field the person is typing in. `NbSuggestionList` uses it to listen
 * to the keys and to tell assistive technology the field drives a list.
 *
 * Lives in a `.ts` rather than a `.d.ts` because the key is a runtime value.
 */
export interface ITextInputContext {
  field: Ref<HTMLInputElement | HTMLTextAreaElement | null>
}

export const NB_TEXT_INPUT_CONTEXT: InjectionKey<ITextInputContext> =
  Symbol.for('@nubisco/ui:text-input-context')
