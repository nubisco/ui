export interface IBriefingProps {
  /** What the briefing is ("Daily report", "Recurring reports"). */
  title: string
  /**
   * Whether the briefing runs (`v-model:enabled`). Leave it undefined and no
   * switch is shown, for a briefing that is always on, such as one made of
   * rows that each have their own schedule.
   */
  enabled?: boolean
  /**
   * Whether AI writes it (`v-model:ai-writing`). Off, the product sends the
   * plain version it builds from its own data. Leave it undefined for a
   * briefing that is only ever AI.
   */
  aiWriting?: boolean
  /** A short state line beside the title, such as the next run. */
  status?: string
  /** Disable the switches while a save is in flight. */
  busy?: boolean
}
