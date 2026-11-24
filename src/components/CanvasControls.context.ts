import type { InjectionKey, Ref } from 'vue'

/** What an NbCanvasControlsGroup reads from the NbCanvasControls around it. */
export interface ICanvasControlsContext {
  orientation: Readonly<Ref<'horizontal' | 'vertical'>>
}

export const NB_CANVAS_CONTROLS: InjectionKey<ICanvasControlsContext | null> =
  Symbol.for('@nubisco/ui:canvas-controls')
