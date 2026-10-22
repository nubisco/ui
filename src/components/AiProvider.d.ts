/** A provider a product can send AI requests to. */
export interface IAiProviderOption {
  label: string
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
  /** A key is stored. Changes the key placeholder and offers Remove key. */
  hasKey?: boolean
  /** A save or removal is in flight. Disables the form. */
  busy?: boolean
}
