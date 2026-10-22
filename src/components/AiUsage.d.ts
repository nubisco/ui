export interface IAiUsageProps {
  /** The panel heading. */
  title?: string
  /** How many days the figures cover. */
  days?: number
  /** A key is stored. Without one the panel says nothing has been sent yet. */
  hasKey?: boolean
  /** The figures are loading. */
  loading?: boolean
  /** Requests that reached the provider. */
  requests?: number
  /** What a request is called in this product ("Briefings written"). */
  requestsLabel?: string
  /**
   * Answers served from a cache, at no cost. Omit it in a product with no
   * cache and the row is not shown.
   */
  cacheHits?: number | null
  inputTokens?: number
  outputTokens?: number
  /** Estimated cost in USD, or null when a model has no published price. */
  estimatedCostUsd?: number | null
  /** The models with no price on file, named when the cost is null. */
  unpricedModels?: string[]
  /** The date the price table was last checked, as YYYY-MM-DD. */
  pricingVerifiedOn?: string
}
