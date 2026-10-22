export interface IBriefingDestinationProps {
  /** Where it goes. Sets the icon and the default label. */
  kind: 'slack' | 'email' | 'webhook'
  /** Overrides the label ("Slack", "Email", "Webhook"). */
  label?: string
  /** Where exactly, once set up: a channel, an address. */
  summary?: string
  /** Set up and able to receive a test. */
  configured?: boolean
  /** A test is being sent. */
  testing?: boolean
  /** The test button's text. Hidden when empty. */
  testLabel?: string
}
