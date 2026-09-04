import type { App } from 'vue'
import components from './components/index'
import directives from './directives/index'
import { NbCommandPalettePlugin } from './plugins/commandPalette'

export default {
  install(app: App) {
    app.use(components)
    app.use(directives)
    app.use(NbCommandPalettePlugin)
  },
}

export { registerIcons, unregisterIcon } from './composables/iconRegistry'
export type {
  TCustomIcon,
  ICustomIconWeights,
} from './composables/iconRegistry'

// Named exports for tree-shakeable individual imports
export { default as NbAccordion } from './components/Accordion.vue'
export { default as NbAccordionItem } from './components/AccordionItem.vue'
export type {
  IAccordionProps,
  IAccordionItemProps,
  TAccordionAlign,
  TAccordionSize,
} from './components/Accordion.d'
export { default as NbCard } from './components/Card.vue'
export { default as NbCardGrid } from './components/CardGrid.vue'
export type { ICardProps, ICardGridProps } from './components/CardGrid.d'
export { default as NbDefinitionList } from './components/DefinitionList.vue'
export { default as NbDefinitionListItem } from './components/DefinitionListItem.vue'
export type {
  IDefinitionListProps,
  IDefinitionListItemProps,
  IDefinitionListItem,
  TDefinitionListLayout,
} from './components/DefinitionList.d'
export { default as NbEmptyState } from './components/EmptyState.vue'
export type {
  IEmptyStateProps,
  TEmptyStateKind,
  TEmptyStateSize,
} from './components/EmptyState.d'
export { default as NbReorderList } from './components/ReorderList.vue'
export type {
  IReorderListProps,
  IReorderEvent,
} from './components/ReorderList.d'
export { default as NbBoard } from './components/Board.vue'
export type {
  IBoardColumn,
  IBoardLane,
  IBoardItem,
  IBoardMoveEvent,
  IBoardColumnMoveEvent,
  IBoardProps,
} from './components/Board.d'
export { default as NbBreadcrumbs } from './components/Breadcrumbs.vue'
export { default as NbCalendar } from './components/Calendar.vue'
export type { ICalendarEvent, ICalendarProps } from './components/Calendar.d'
export { default as NbBadge } from './components/Badge.vue'
export { default as NbBanner } from './components/Banner.vue'
export type { IBannerProps } from './components/Banner.d'
export { EBannerStatus, EBannerVariant } from './components/Banner.d'
export { default as NbBarChart } from './components/Charts/BarChart.vue'
export { default as NbButton } from './components/Button.vue'
export type { IButtonProps, TButtonSize } from './components/Button.d'
export { default as NbDatePicker } from './components/DatePicker.vue'
export type { IDatePickerProps } from './components/DatePicker.d'
export { default as NbNubiscoMark } from './components/NubiscoMark.vue'
export { default as NbNubiscoPlatformMark } from './components/NubiscoPlatformMark.vue'
export type { INubiscoMarkProps } from './components/NubiscoMark.d'
export { default as NbUserMenu } from './components/UserMenu.vue'
export type {
  IUserMenuProps,
  IUserMenuUser,
  IUserMenuAccount,
  TUserMenuPlacement,
  TUserMenuBrand,
} from './components/UserMenu.d'
export { default as NbCheckbox } from './components/Checkbox.vue'
export { default as NbCheckboxGroup } from './components/CheckboxGroup.vue'
export type { ICheckboxGroupProps } from './components/CheckboxGroup.d'
export { default as NbSwitch } from './components/Switch.vue'
export type { ISwitchProps } from './components/Switch.d'
export { default as NbColorStrip } from './components/ColorStrip.vue'
export { default as NbDataTable } from './components/DataTable.vue'
export type {
  IDataTableColumn,
  IDataTableProps,
  IDataTableSortState,
  IDataTableEmits,
  TColumnAlign,
  TSortDirection,
  TDataTableSelectable,
  TRowKey,
} from './components/DataTable.d'
export { default as NbPagination } from './components/Pagination.vue'
export type {
  IPaginationProps,
  IPaginationEmits,
} from './components/Pagination.d'
export { default as NbFlag } from './components/Flag.vue'
export { default as NbGanttChart } from './components/Charts/GanttChart.vue'
export type {
  IGanttTask,
  IGanttDependency,
  IGanttGroup,
  IGanttChartProps,
  TGanttTaskStatus,
  TGanttTimeScale,
  TDependencyType,
} from './components/Charts/GanttChart.d'
export { default as NbGrid } from './components/Grid.vue'
export { default as NbIcon } from './components/Icon.vue'
export { default as NbInfoHint } from './components/InfoHint.vue'
export type {
  IInfoHintProps,
  TInfoHintPlacement,
} from './components/InfoHint.d'
export { default as NbJsonTree } from './components/JsonTree.vue'
export { default as NbInterpolationChart } from './components/Charts/InterpolationChart.vue'
export type {
  IInterpolationPoint,
  IInterpolationChartProps,
} from './components/Charts/InterpolationChart.d'
export { default as NbLineChart } from './components/Charts/LineChart.vue'
export { default as NbLabel } from './components/Label.vue'
export { default as NbField } from './components/Field.vue'
export type { IFieldProps } from './components/Field.d'
export { default as NbMenu } from './components/Menu.vue'
export { default as NbMenuBar } from './components/MenuBar.vue'
export { default as NbMenuBarItem } from './components/MenuBarItem.vue'
export { default as NbMenuItem } from './components/MenuItem.vue'
export { default as NbMenuDivider } from './components/MenuDivider.vue'
export { default as NbSubmenu } from './components/Submenu.vue'
export { default as NbCommandPalette } from './components/CommandPalette.vue'
export type {
  IMenuProps,
  IMenuItemProps,
  ISubmenuProps,
  IMenuBarProps,
  TMenuItemSize,
} from './components/Menu.d'
export type {
  ICommand,
  ICommandPaletteProps,
  ICommandPaletteState,
} from './components/CommandPalette.d'
export { default as NbMessage } from './components/Message.vue'
export { default as NbModal } from './components/Modal.vue'
export type { IModalProps, TModalSize } from './components/Modal.d'
export { default as NbConfirm } from './components/Confirm.vue'
export type {
  IConfirmProps,
  IConfirmOptions,
  TConfirmTone,
} from './components/Confirm.d'
export {
  registerConfirmFloatingSelector,
  CONFIRM_LEAVE_MS,
} from './components/Confirm.env'
export { default as NbLayer } from './components/Layer.vue'
export type { ILayerProps } from './components/Layer.d'
export { default as NbPanel } from './components/Panel.vue'
export type { IPanelProps } from './components/Panel.d'
export { default as NbPieChart } from './components/Charts/PieChart.vue'
export { default as NbShell } from './components/Shell.vue'
export type {
  IShellProps,
  TInspectorSize,
  TSidebarVariant,
  TShellTopbar,
  TShellCollapseAt,
} from './components/Shell.d'
export { default as NbSidebarBrand } from './components/SidebarBrand.vue'
export type { ISidebarBrandProps } from './components/SidebarBrand.d'
export { default as NbSidebarLink } from './components/SidebarLink.vue'
export { default as NbSidebarMenu } from './components/SidebarMenu.vue'
export type { ISidebarMenuProps } from './components/SidebarMenu.d'
export { default as NbSidebarMenuGroup } from './components/SidebarMenuGroup.vue'
export type { ISidebarMenuGroupProps } from './components/SidebarMenuGroup.d'
export { default as NbSidebarMenuItem } from './components/SidebarMenuItem.vue'
export type { ISidebarMenuItemProps } from './components/SidebarMenuItem.d'
export { default as NbToast } from './components/Toast.vue'
export type { TToastVariant, IToastCta } from './components/Toast.vue'
export { default as NbToaster } from './components/Toaster.vue'
export type { TToasterPlacement } from './components/Toaster.vue'
export type { IToasterProps } from './components/Toaster.d'
export { default as NbProgressBar } from './components/ProgressBar.vue'
export type { IProgressBarProps } from './components/ProgressBar.d'
// ── Loading ──────────────────────────────────────────────────────────────────
// Indeterminate waiting. NbProgressBar above covers the determinate case; pick
// between them in docs/ui/components/spinner.md.
export { default as NbSpinner } from './components/Spinner.vue'
export type { ISpinnerProps } from './components/Spinner.d'
export {
  ESpinnerSize,
  ESpinnerOverlay,
  ESpinnerTone,
} from './components/Spinner.d'
// The one exception to a blocking overlay's containment: a live region an
// application owns and mounts at the top of the document. Without it, a toast
// raised while `overlay="page"` is up is painted above the scrim and silent,
// because `inert` removes a subtree from the accessibility tree too.
export {
  markOverlayExempt,
  NB_OVERLAY_EXEMPT_ATTR,
} from './components/Spinner.overlay'
export { default as NbInlineLoading } from './components/InlineLoading.vue'
export type { IInlineLoadingProps } from './components/InlineLoading.d'
export { EInlineLoadingStatus } from './components/InlineLoading.d'
export { default as NbSkeleton } from './components/Skeleton.vue'
export type { ISkeletonProps, TSkeletonTypeSet } from './components/Skeleton.d'
export { ESkeletonVariant } from './components/Skeleton.d'
export { default as NbRadio } from './components/Radio.vue'
export { default as NbNotificationCenter } from './components/NotificationCenter.vue'
export type {
  INotificationCenterProps,
  INotificationItem,
} from './components/NotificationCenter.vue'
export { default as NbNotificationCenterItem } from './components/NotificationCenterItem.vue'
export type {
  INotificationCenterItemProps,
  TNotificationStatus,
} from './components/NotificationCenterItem.vue'
export { default as NbNumberInput } from './components/NumberInput.vue'
export { default as NbSlider } from './components/Slider.vue'
// ── Flow progress ────────────────────────────────────────────────────────────
// A linear multi-step indicator. It reports where a wizard is, it does not own
// the flow. NbWalkthrough is the other thing: a guided tour over existing UI.
export { default as NbStepper } from './components/Stepper.vue'
export { default as NbStepperStep } from './components/StepperStep.vue'
export type {
  IStepperProps,
  IStepperStepProps,
  IStepperLabels,
} from './components/Stepper.d'
export {
  EStepperOrientation,
  EStepperSize,
  EStepStatus,
} from './components/Stepper.d'
export { default as NbSparkline } from './components/Charts/Sparkline.vue'

// The chart colour contract. Charts paint through the eight `--nb-c-chart-*`
// role tokens, but the sequential and diverging ramps cannot be expressed by
// setting a custom property: they are built with `color-mix()`, so a consumer
// needs these builders. Documented in docs/ui/components/charts/color.md.
export {
  CHART_ROLE_COUNT,
  DEFAULT_PALETTE,
  colorAt,
  chartRole,
  seriesColors,
  sequentialAt,
  divergingAt,
  rampSteps,
} from './components/Charts/shared/palette'
export type { TChartMark } from './components/Charts/shared/palette'
export { default as NbSelect } from './components/Select.vue'
export { default as NbTabs } from './components/Tabs.vue'
export type { ITabItem, ITabsProps } from './components/Tabs.d'
export { default as NbTextInput } from './components/TextInput.vue'
export type { ISelectOption, ISelectProps } from './components/Select.d'

export { default as NbTree } from './components/Tree.vue'
export { default as NbTreeNode } from './components/TreeNode.vue'
export type {
  ITreeProps,
  ITreeNodeProps,
  ITreeContext,
  ITreeDropEvent,
  ITreeDragState,
  TTreeDropPosition,
} from './components/Tree.d'
export { default as NbBottomPanel } from './components/BottomPanel.vue'
export type { TBottomPanelSize } from './components/BottomPanel.d'
export { default as NbShellPanel } from './components/ShellPanel.vue'
export type {
  IShellPanelProps,
  TShellPanelSize,
} from './components/ShellPanel.d'
export { default as NbBlueprint } from './components/Blueprint.vue'
export type {
  IBlueprintConnection,
  IBlueprintCard,
  IBlueprintCardMove,
  IBlueprintProps,
  IBlueprintController,
  IBlueprintCanvasPoint,
  IBlueprintScreenPoint,
  IBlueprintCardPaint,
  TBlueprintRenderer,
  TBlueprintBackground,
} from './components/Blueprint.types'
// The signal-flow auto-layout as a standalone pure function, for hosts that
// want to compute card positions without mounting the canvas (or to reuse the
// banding elsewhere). NbBlueprint.autoLayout() calls this internally.
export { computeAutoLayout } from './components/blueprint-autolayout'
export type {
  IAutoLayoutCard,
  IAutoLayoutEdge,
  IAutoLayoutOptions,
  TAutoLayoutEdgeKind,
} from './components/blueprint-autolayout'
export { default as NbBlueprintControls } from './components/BlueprintControls.vue'
export type {
  IBlueprintControlsProps,
  TBlueprintChromePosition,
} from './components/BlueprintControls.d'
export { default as NbBlueprintMinimap } from './components/BlueprintMinimap.vue'
export type { IBlueprintMinimapProps } from './components/BlueprintMinimap.d'
export {
  NB_BLUEPRINT_CONTEXT,
  NB_BLUEPRINT_CONTROLLER,
} from './components/Blueprint.context'
export { BlueprintLiveData } from './components/blueprint-pixi/live-data'
export { default as NbBlueprintCard } from './components/BlueprintCard.vue'
export type {
  IBlueprintPort,
  IBlueprintCardProps,
  IBlueprintCardParameter,
} from './components/BlueprintCard.types'
export { default as NbBlueprintBackground } from './components/BlueprintBackground.vue'
export type {
  IBlueprintBackgroundProps,
  TBlueprintBackgroundVariant,
} from './components/BlueprintBackground.d'

// Registered by the plugin since before this block existed, but never given a
// named export, so `<NbForm>` worked while `import { NbForm }` did not. Found by
// tests/component-registration.test.ts once it started treating the component
// folder as the source of truth rather than comparing two lists that could both
// be wrong in the same way.
export { default as NbAiLabel } from './components/AiLabel.vue'
export { default as NbFileUploader } from './components/FileUploader.vue'
export { default as NbForm } from './components/Form.vue'
export { default as NbImageCropper } from './components/ImageCropper.vue'

// Onboarding: walkthrough / product tour
export { default as NbWalkthrough } from './components/Walkthrough.vue'
export type {
  IWalkthrough,
  IWalkthroughStep,
  IWalkthroughProps,
  IWalkthroughRecord,
  IWalkthroughStorage,
  IWalkthroughOptions,
  IWalkthroughController,
  IWalkthroughLabels,
  TWalkthroughPlacement,
  TWalkthroughOutcome,
  TWalkthroughTarget,
} from './components/Walkthrough.d'
export {
  createLocalStorageWalkthroughStorage,
  createMemoryWalkthroughStorage,
  createDefaultWalkthroughStorage,
  WALKTHROUGH_STORAGE_PREFIX,
} from './utils/walkthroughStorage.helper'
export {
  resolveTourTarget,
  tourStepSelector,
  isTargetVisible,
  TOUR_STEP_ATTRIBUTE,
} from './utils/tourTarget.helper'

// Directives
export { default as nbTooltipDirective } from './directives/ToolTip.directive'
export { dismissAllTooltips } from './directives/ToolTip.directive'
// The tooltip's binding types. Without these the documented
// `const opts: ITooltipOptions = { ... }` does not compile for a consumer:
// there is no `export *` in this entry, so a type that is not named here
// does not reach dist/index.d.ts.
export type {
  ITooltipOptions,
  TTooltipAria,
  TTooltipStatus,
  TTooltipTrigger,
  TTooltipReason,
  TTooltipDirective,
} from './directives/ToolTip.directive'
export { default as nbTourStepDirective } from './directives/TourStep.directive'

// Composables
export { useCommandPalette } from './composables/useCommandPalette.composable'
export {
  useToast,
  createToastQueue,
  resetToastQueue,
  NB_TOAST_QUEUE_KEY,
  NB_TOAST_DURATIONS,
  NB_TOAST_STATUS_LABELS,
} from './composables/useToast.composable'
export type {
  IToastQueue,
  IToastQueueOptions,
  IToastOptions,
  IToastHandle,
  IToastRecord,
  IToastLabels,
  TToastPatch,
  TToastDismissReason,
} from './composables/useToast.composable'
export {
  useConfirm,
  dismissConfirms,
} from './composables/useConfirm.composable'
export type { TConfirmFn } from './composables/useConfirm.composable'
export { useWalkthrough } from './composables/useWalkthrough.composable'
export {
  useReducedMotion,
  prefersReducedMotion,
} from './composables/useReducedMotion.composable'
export { useContextMenu } from './composables/useContextMenu.composable'
export { useInlineLoading } from './composables/useInlineLoading.composable'
export type {
  TInlineLoadingStatus,
  IUseInlineLoading,
  IUseInlineLoadingOptions,
} from './composables/useInlineLoading.composable'
// The shared "loading complete" live region behind NbSpinner's and
// NbSkeleton's `completeLabel`. Exported so an app that unmounts an indicator
// through its own routing can still announce the arrival.
// `suppressLoadingAnnouncement` is its other half: a failed load must not be
// reported as an arrival, and only the catch block knows which one it was.
export {
  announceLoadingComplete,
  suppressLoadingAnnouncement,
} from './composables/useLoadingAnnouncer.composable'
// The counted page-scroll lock every blocking surface in the library shares.
// Exported so an application's own overlay joins the same count instead of
// becoming a fourth owner of `body { overflow }`.
export {
  acquireScrollLock,
  releaseScrollLock,
  useScrollLock,
} from './composables/useScrollLock.composable'
// The supported way for a view to put controls into the surrounding NbShell.
// Replaces the eight hand-rolled DOM ids the audit found across the fleet.
export { useShellSlot } from './composables/useShellSlot.composable'
export type {
  TShellSlotName,
  TShellSlotClaim,
  IShellSlotOptions,
  IShellSlot,
} from './composables/useShellSlot.composable'
export { useTheme, configureTheme } from './composables/useTheme.composable'
export type {
  TTheme,
  TResolvedTheme,
  IThemeOptions,
  IThemeController,
} from './composables/useTheme.composable'
export { useBlueprint } from './composables/useBlueprint.composable'
export {
  useSurfaceLayer,
  useLayer,
  clampLayer,
  layerClassFor,
  probeLayerFromDom,
  NB_LAYER_INJECTION_KEY,
  NB_LAYER_ATTRIBUTE,
  NB_MIN_LAYER,
  NB_MAX_LAYER,
} from './composables/useSurfaceLayer.composable'
export type {
  TLayerLevel,
  ILayerProbeResult,
  IUseSurfaceLayerOptions,
  IUseSurfaceLayerResult,
} from './composables/useSurfaceLayer.composable'

// Plugins
export { NbCommandPalettePlugin } from './plugins/commandPalette'

// Labs plugin (experimental components)
export { default as NubiscoUILabs } from './labs'
export { default as NbSpreadsheet } from './components/labs/Spreadsheet.vue'
export type {
  ISpreadsheetProps,
  ISpreadsheetColumn,
  ISpreadsheetRow,
  ISpreadsheetCellAttrs,
  ISpreadsheetChange,
  ISpreadsheetSelection,
  TSpreadsheetCellType,
  TSpreadsheetAlign,
  TSpreadsheetPinCol,
  TSpreadsheetPinRow,
  TSpreadsheetSortDir,
} from './components/labs/Spreadsheet.d'
