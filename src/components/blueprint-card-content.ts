// Declarative content model for GPU-native card bodies.
//
// A card the Pixi renderer paints (every card except the focused one) describes
// its inner controls as a flat list of drawing primitives in CARD-LOCAL pixels
// (0,0 = the card's top-left). The Pixi content painter draws them on one GPU
// surface, so a board of hundreds of cards composites as a single layer instead
// of one DOM layer per card. Clicking a card still swaps it to the real Vue DOM
// for editing; this descriptor is purely what the *unfocused* card looks like.
//
// A value is either a fixed number (a static parameter: fader position, knob
// angle) or a { live } key into the blueprint's non-reactive live channel (an
// audio-rate value: a meter, a tuner needle) read on the throttled render tick.
// Static primitives are drawn once and only redrawn when the descriptor changes;
// live primitives update per tick without any Vue reactivity.

/** A primitive value: a fixed 0..1 number, or a key into the live channel. */
export type TCardValue = number | { live: string }

/** True when a value is a live-channel key rather than a fixed number. */
export function isLive(v: TCardValue): v is { live: string } {
  return typeof v === 'object' && v !== null && 'live' in v
}

/** Filled / stroked rounded rectangle: sub-panels, buttons, LED squares, the
 *  metronome's beat dots, section backgrounds. */
export interface ICardRect {
  kind: 'rect'
  x: number
  y: number
  w: number
  h: number
  /** Fill colour (CSS string / theme token). Omit for no fill. */
  color?: string
  radius?: number
  alpha?: number
  /** Border colour. Omit for no border. */
  stroke?: string
  strokeWidth?: number
}

/** A text label or numeric readout. Static in v1 (redrawn on descriptor change);
 *  high-rate readouts simply show their last pushed value. */
export interface ICardText {
  kind: 'text'
  x: number
  y: number
  text: string
  /** Font size in px (card-local). Default 11. */
  size?: number
  color?: string
  weight?: number | string
  /** Horizontal anchor at x. Default 'left'. */
  align?: 'left' | 'center' | 'right'
  /** Use the monospace stack (readouts / logs). */
  mono?: boolean
}

/** A fill bar: faders, horizontal sliders, per-channel level bars, true-peak
 *  bars, LED-ladder meters. `value` fills the track; a { live } value animates
 *  it per tick. `level` colours the fill green -> yellow -> red by magnitude. */
export interface ICardBar {
  kind: 'bar'
  x: number
  y: number
  w: number
  h: number
  value: TCardValue
  /** 'v' fills from the bottom up (default), 'h' from the left. */
  orient?: 'v' | 'h'
  /** Solid fill colour. Ignored when `level` is set. */
  color?: string
  /** Colour the fill by level (meters). */
  level?: boolean
  /** Fill from the centre out (pan / balance). */
  centered?: boolean
  /** Draw as an LED ladder with this many segment gaps. */
  segments?: number
  /** Track (background) colour. Default the theme's layer-2. */
  track?: string
}

/** A rotary knob: gain / pan / EQ. Draws a bezel ring, a value arc from the
 *  min angle, and a pointer notch. `centered` puts 0.5 at 12 o'clock (balance).
 *  Static (knob values are parameters, not audio-rate). */
export interface ICardKnob {
  kind: 'knob'
  cx: number
  cy: number
  r: number
  value: TCardValue
  color?: string
  centered?: boolean
}

/** A round indicator LED: the boolean card's ON light, the tuner's in-tune dot.
 *  `on` >= 0.5 lights it; a { live } value can pulse it. */
export interface ICardLed {
  kind: 'led'
  cx: number
  cy: number
  r: number
  on: TCardValue
  color?: string
}

/** A needle travelling along a track: the tuner's cents needle, the VU meter's
 *  analogue needle. `pos` is 0..1 across the track (0.5 = centre). Live-capable. */
export interface ICardNeedle {
  kind: 'needle'
  /** Track box (card-local px). */
  x: number
  y: number
  w: number
  h: number
  pos: TCardValue
  color?: string
  /** Needle travels vertically along the box instead of horizontally. */
  vertical?: boolean
}

/** A polyline / filled polygon: EQ frequency-response curves, VU scale arcs,
 *  waveform displays. Points are card-local px. Static. */
export interface ICardPoly {
  kind: 'poly'
  points: [number, number][]
  color?: string
  width?: number
  closed?: boolean
  fill?: string
}

/** Built-in glyphs drawn as vector paths (no font/asset): transport + I/O. */
export type TCardIcon = 'play' | 'stop' | 'pause' | 'stereo' | 'mono'

export interface ICardIcon {
  kind: 'icon'
  x: number
  y: number
  size: number
  icon: TCardIcon
  color?: string
}

/** The closed set of drawable card-content primitives. */
export type TCardPrimitive =
  | ICardRect
  | ICardText
  | ICardBar
  | ICardKnob
  | ICardLed
  | ICardNeedle
  | ICardPoly
  | ICardIcon
