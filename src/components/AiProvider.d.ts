/** A provider a product can send AI requests to. */
export interface IAiProviderOption {
  label: string
  value: string
}

/** A model a person may pick, for one provider. */
export interface IAiModelOption {
  /** What the person reads ("Claude Haiku 5.5"). */
  label: string
  /** The id the provider's API takes ("claude-haiku-5-5"). */
  value: string
}

export interface IAiProviderProps {
  /** The panel heading. It carries the AI mark. */
  title?: string
  /** The providers on offer. Defaults to Anthropic, OpenAI and Google Gemini. */
  providers?: IAiProviderOption[]
  /** The selected provider (`v-model:provider`). */
  provider?: string
  /** The model (`v-model:model`). Empty means the provider's default. */
  model?: string
  /**
   * The key being typed (`v-model:api-key`). Write-only: a stored key is
   * never sent back, so this is always empty when the page loads.
   */
  apiKey?: string
  /** Each provider's default model, shown as the model field's placeholder. */
  defaultModels?: Record<string, string>
  /**
   * The models a person may pick, by provider. When the selected provider
   * has a list, the model is a choice from it instead of free text, so a
   * mistyped id cannot be saved. Without one (a product running on its own,
   * or a list that could not be read) the field stays free text, as before.
   * A saved model missing from the list is still shown, marked as such.
   */
  models?: Record<string, IAiModelOption[]>
  /** A key is stored. Changes the key placeholder and offers Remove key. */
  hasKey?: boolean
  /** A save or removal is in flight. Disables the form. */
  busy?: boolean
}
