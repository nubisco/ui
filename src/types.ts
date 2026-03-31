import type { DefineComponent } from 'vue'

// Shared size types (exported once, reused across components)
export * from './types/Size.d'

// Shared prop interfaces — compose these in component prop definitions
export type {
  IDefaultProps,
  IWithMessages,
  IWithLabel,
  IWithFieldAppearance,
  IHumanInputComponent,
  IFieldComponent,
  IReadableFieldComponent,
} from './types/Props.d'

// Grid types
export type { IGridProps } from './components/Grid.d'
export type {
  TClassCollection,
  IHandlerContext,
  TGridType,
  TGridTypeResponsive,
  TGridAlign,
  TGridAlignResponsive,
  TGridJustify,
  TGridJustifyResponsive,
  TGridWrap,
  TGridWrapResponsive,
  TGridGap,
  TGapSize,
  TGridColumns,
  TGridColumnsResponsive,
  TGridShift,
  TGridShiftResponsive,
  TBooleanResponsive,
  TGridMode,
  TBreakpoint,
} from './components/Grid.d'

// Component-specific types
export type { IButtonProps } from './components/Button.d'
export { EButtonType } from './components/Button.d'
export type { IFlagProps } from './components/Flag.d'
export type { IBadgeProps } from './components/Badge.d'
export { EBadgeVariant, EBadgeSize } from './components/Badge.d'
export type { ILabelProps } from './components/Label.d'
export { ELabelSize } from './components/Label.d'
export type { IMessageProps } from './components/Message.d'
export { EMessageVariant } from './components/Message.d'
export type {
  IJsonTreeProps,
  TJsonValue,
  TJsonPrimitive,
  IJsonObject,
  TJsonArray,
} from './components/JsonTree.d'
export { EJsonNodeKind } from './components/JsonTree.d'
export { ESizePixel, ESizePixel as SizePixel } from './types/Size.d'
export type { ICheckboxProps } from './components/Checkbox.d'
export type { IRadioProps, IRadioOption } from './components/Radio.d'
export { ERadioDirection } from './components/Radio.d'
export type { ISliderProps } from './components/Slider.d'
export type { ISwitchProps } from './components/Switch.d'
export { ESwitchSize, ESwitchVariant } from './components/Switch.d'
export type { ISelectOption, ISelectProps } from './components/Select.d'
export type { IColorStripProps } from './components/ColorStrip.d'
export type { IFileUploaderProps, IFileItem } from './components/FileUploader.d'
export { EFileUploaderStatus } from './components/FileUploader.d'
export type { IAiLabelProps } from './components/AiLabel.d'
export { EAiLabelVariant, EAiLabelSize } from './components/AiLabel.d'

// Component type definitions that don't have .d.ts files yet
export type TModalProps = Record<string, never>
export type TPanelProps = Record<string, never>
export type TWellProps = Record<string, never>

export declare const NbModal: DefineComponent<TModalProps>
export declare const NbPanel: DefineComponent<TPanelProps>
export declare const NbWell: DefineComponent<TWellProps>
