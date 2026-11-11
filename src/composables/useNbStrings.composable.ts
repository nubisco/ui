import {
  computed,
  getCurrentInstance,
  inject,
  provide,
  ref,
  unref,
  type App,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'
import { pluralize } from '@/utils/pluralize.helper'

/**
 * Every string the library renders on its own, with no prop to pass it
 * through: accessible names, icon-button titles, chart fallbacks, the toast
 * status words. A string a component exposes as a prop (`closeLabel`,
 * `pageSizeLabel`) stays a prop, and the prop wins over this catalogue.
 *
 * The defaults are en-US, which is the library's ruling for user-facing
 * strings. A string that carries a value is a function, so a translation can
 * put the value where its own grammar wants it rather than where English does.
 */
export interface INbStrings {
  // NbPagination
  paginationLabel: string
  paginationPrevious: string
  paginationNext: string
  paginationPageOf: (page: number, totalPages: number) => string
  /** `itemLabel` is the prop the caller passes, already a plural noun. */
  paginationRange: (
    start: number,
    end: number,
    total: number,
    itemLabel: string,
  ) => string
  // NbDatePicker
  datePickerPreviousYear: string
  datePickerPreviousMonth: string
  datePickerNextMonth: string
  datePickerNextYear: string
  datePickerChooseDate: string
  datePickerChooseEndDate: string
  datePickerChangeDate: (date: string) => string
  datePickerChangeEndDate: (date: string) => string
  datePickerDialog: string
  datePickerDialogFor: (label: string) => string
  // NbDataTable
  dataTableBatchActions: string
  dataTableSelectAll: string
  dataTableSelectRow: (row: number) => string
  dataTableEmpty: string
  dataTableError: string
  // NbDataTable and NbBoard batch bars
  selectionCount: (count: number) => string
  // NbOverflowMenu, NbBatchActions and the row actions they serve
  overflowMenuLabel: string
  batchActionsCancel: string
  batchActionsLabel: string
  dataTableToolbar: string
  dataTableRowActions: string
  // NbModal
  modalClose: string
  // NbCloseButton, and every close or dismiss control built on it
  close: string
  // NbConfirm
  confirmConfirm: string
  confirmCancel: string
  confirmBusy: string
  confirmTypeToConfirm: (phrase: string) => string
  // NbShell, the inspector sheet's own dismiss
  shellInspectorClose: string
  // NbShellPanel size controls
  shellPanelSize: string
  shellPanelSizeFor: (title: string) => string
  shellPanelMinimize: string
  shellPanelRestore: string
  shellPanelMaximize: string
  // NbBottomPanel size group
  bottomPanelSize: string
  // NbNotificationCenter
  notificationCenterClose: string
  // NbCalendar
  calendarToday: string
  calendarPreviousMonth: string
  calendarNextMonth: string
  // NbWalkthrough
  walkthroughBack: string
  walkthroughNext: string
  walkthroughSkip: string
  walkthroughDone: string
  walkthroughProgress: (current: number, total: number) => string
  walkthroughDialog: string
  // NbTextInput `showCount`
  textInputCount: (length: number, max: number) => string
  // NbTextInput `clearable` and `revealable`
  textInputClear: string
  textInputShowPassword: string
  textInputHidePassword: string
  // NbSearch
  searchLabel: string
  searchPlaceholder: string
  // NbSelect `clearable`, when no `clearLabel` is passed
  selectClear: string
  // NbNumberInput
  numberInputDecrease: string
  numberInputIncrease: string
  // NbFileUploader
  fileUploaderDropHint: string
  /** The remove button's tooltip: short, because it is a chip. */
  fileUploaderRemove: string
  /** The remove button's spoken name, which says which file. */
  fileUploaderRemoveFile: (fileName: string) => string
  // NbInlineEdit: the spoken name of the value while it is not being edited
  inlineEditEmpty: string
  inlineEditName: (label: string, value: string) => string
  // NbBoard
  boardSelectionActions: string
  boardClearSelection: string
  boardSelectionCleared: string
  boardCardsSelected: (count: number) => string
  // NbBottomPanel
  bottomPanelMinimize: string
  bottomPanelDefault: string
  bottomPanelHalf: string
  bottomPanelMaximize: string
  // NbBlueprint controls, minimap and card
  blueprintControls: string
  blueprintZoomIn: string
  blueprintZoomOut: string
  blueprintFitToView: string
  blueprintCenter: string
  blueprintAutoLayout: string
  blueprintAlignLeft: string
  blueprintAlignHorizontalCenter: string
  blueprintAlignRight: string
  blueprintAlignTop: string
  blueprintAlignVerticalCenter: string
  blueprintAlignBottom: string
  blueprintDistributeHorizontally: string
  blueprintDistributeVertically: string
  blueprintMinimap: string
  blueprintRemoveCard: string
  blueprintInputs: (count: number) => string
  blueprintOutputs: (count: number) => string
  /** The card header's collapse button, named with the card's title. */
  blueprintExpandCard: (title: string) => string
  blueprintCollapseCard: (title: string) => string
  /** The remove button's spoken name. `blueprintRemoveCard` is its tooltip. */
  blueprintRemoveCardNamed: (title: string) => string
  // NbCopyButton
  copyButtonCopy: string
  copyButtonCopied: string
  // NbBackToTop
  backToTop: string
  // NbImagePicker
  imagePickerAdd: string
  imagePickerDrop: string
  imagePickerReplace: string
  imagePickerRemove: string
  // NbVideo
  videoPlay: string
  videoPause: string
  // NbInfoHint
  infoHintLabel: string
  /** NbAccordionItem's hint, named after its section. */
  accordionAbout: (title: string) => string
  // NbBreadcrumbs switcher
  breadcrumbsSwitch: (label: string) => string
  breadcrumbsFind: string
  breadcrumbsNoResults: string
  // NbCommandPalette
  commandPaletteLabel: string
  commandPalettePlaceholder: string
  commandPaletteSearching: string
  commandPaletteNoMatches: string
  commandPaletteHint: string
  commandPaletteClose: string
  // Charts
  chartBar: string
  chartLine: string
  chartPie: string
  chartGantt: string
  chartInterpolation: string
  chartSparkline: string
  chartInput: string
  chartOutput: string
  // NbSpinner
  spinnerLabel: string
  // Toast status words, read before the message so the severity is announced
  toastSuccess: string
  toastError: string
  toastWarning: string
  toastInfo: string
}

export type TNbStringsOverrides = Partial<INbStrings>

export const NB_DEFAULT_STRINGS: Readonly<INbStrings> = Object.freeze({
  paginationLabel: 'Pagination',
  paginationPrevious: 'Previous page',
  paginationNext: 'Next page',
  paginationPageOf: (page: number, totalPages: number) =>
    `Page ${page} of ${totalPages}`,
  paginationRange: (
    start: number,
    end: number,
    total: number,
    itemLabel: string,
  ) => `${start}-${end} of ${total} ${itemLabel}`,
  datePickerPreviousYear: 'Previous year',
  datePickerPreviousMonth: 'Previous month',
  datePickerNextMonth: 'Next month',
  datePickerNextYear: 'Next year',
  datePickerChooseDate: 'Choose date',
  datePickerChooseEndDate: 'Choose end date',
  datePickerChangeDate: (date: string) => `Change date, ${date}`,
  datePickerChangeEndDate: (date: string) => `Change end date, ${date}`,
  datePickerDialog: 'Date picker',
  datePickerDialogFor: (label: string) => `${label} calendar`,
  dataTableBatchActions: 'Table batch actions',
  dataTableSelectAll: 'Select all rows',
  dataTableSelectRow: (row: number) => `Select row ${row}`,
  dataTableEmpty: 'No data to display',
  dataTableError: 'Could not load the data',
  selectionCount: (count: number) => `${count} selected`,
  overflowMenuLabel: 'More actions',
  batchActionsCancel: 'Cancel',
  batchActionsLabel: 'Batch actions',
  dataTableToolbar: 'Table tools',
  dataTableRowActions: 'Row actions',
  modalClose: 'Close',
  close: 'Close',
  confirmConfirm: 'Confirm',
  confirmCancel: 'Cancel',
  confirmBusy: 'Working',
  confirmTypeToConfirm: (phrase: string) => `Type ${phrase} to confirm`,
  shellInspectorClose: 'Close inspector',
  shellPanelSize: 'Panel size',
  shellPanelSizeFor: (title: string) => `${title} panel size`,
  shellPanelMinimize: 'Minimize',
  shellPanelRestore: 'Restore',
  shellPanelMaximize: 'Maximize',
  bottomPanelSize: 'Panel size',
  notificationCenterClose: 'Close notifications',
  calendarToday: 'Today',
  calendarPreviousMonth: 'Previous month',
  calendarNextMonth: 'Next month',
  walkthroughBack: 'Back',
  walkthroughNext: 'Next',
  walkthroughSkip: 'Skip',
  walkthroughDone: 'Done',
  walkthroughProgress: (current: number, total: number) =>
    `Step ${current} of ${total}`,
  walkthroughDialog: 'Product walkthrough',
  textInputCount: (length: number, max: number) => `${length}/${max}`,
  textInputClear: 'Clear',
  textInputShowPassword: 'Show password',
  textInputHidePassword: 'Hide password',
  searchLabel: 'Search',
  searchPlaceholder: 'Search',
  selectClear: 'Clear selection',
  numberInputDecrease: 'Decrease',
  numberInputIncrease: 'Increase',
  fileUploaderDropHint: 'Drag and drop files here or click to upload',
  fileUploaderRemove: 'Remove',
  fileUploaderRemoveFile: (fileName: string) => `Remove ${fileName}`,
  inlineEditEmpty: 'empty',
  inlineEditName: (label: string, value: string) =>
    `${label}: ${value}. Press Enter to edit.`,
  boardSelectionActions: 'Actions for the selected cards',
  boardClearSelection: 'Clear selection',
  boardSelectionCleared: 'Selection cleared',
  boardCardsSelected: (count: number) =>
    pluralize(count, {
      one: '{count} card selected',
      other: '{count} cards selected',
    }),
  bottomPanelMinimize: 'Minimize',
  bottomPanelDefault: 'Default',
  bottomPanelHalf: 'Half',
  bottomPanelMaximize: 'Maximize',
  blueprintControls: 'Blueprint controls',
  blueprintZoomIn: 'Zoom in',
  blueprintZoomOut: 'Zoom out',
  blueprintFitToView: 'Fit to view',
  blueprintCenter: 'Center',
  blueprintAutoLayout: 'Auto layout',
  blueprintAlignLeft: 'Align left',
  blueprintAlignHorizontalCenter: 'Align horizontal center',
  blueprintAlignRight: 'Align right',
  blueprintAlignTop: 'Align top',
  blueprintAlignVerticalCenter: 'Align vertical center',
  blueprintAlignBottom: 'Align bottom',
  blueprintDistributeHorizontally: 'Distribute horizontally',
  blueprintDistributeVertically: 'Distribute vertically',
  blueprintMinimap: 'Blueprint minimap',
  blueprintRemoveCard: 'Remove',
  blueprintInputs: (count: number) =>
    pluralize(count, { one: '{count} input', other: '{count} inputs' }),
  blueprintOutputs: (count: number) =>
    pluralize(count, { one: '{count} output', other: '{count} outputs' }),
  blueprintExpandCard: (title: string) => `Expand ${title}`,
  blueprintCollapseCard: (title: string) => `Collapse ${title}`,
  blueprintRemoveCardNamed: (title: string) => `Remove ${title}`,
  copyButtonCopy: 'Copy',
  copyButtonCopied: 'Copied',
  backToTop: 'Back to top',
  imagePickerAdd: 'Add image',
  imagePickerDrop: 'Drop to upload',
  imagePickerReplace: 'Replace image',
  imagePickerRemove: 'Remove image',
  videoPlay: 'Play video',
  videoPause: 'Pause video',
  infoHintLabel: 'More information',
  accordionAbout: (title: string) =>
    title ? `About ${title}` : 'About this section',
  breadcrumbsSwitch: (label: string) => `Switch ${label}`,
  breadcrumbsFind: 'Find',
  breadcrumbsNoResults: 'No results',
  commandPaletteLabel: 'Command palette',
  commandPalettePlaceholder: 'Search commands...',
  commandPaletteSearching: 'Searching...',
  commandPaletteNoMatches: 'No matches',
  commandPaletteHint: 'Type to search commands',
  commandPaletteClose: 'Close command palette',
  chartBar: 'Bar chart',
  chartLine: 'Line chart',
  chartPie: 'Pie chart',
  chartGantt: 'Gantt chart',
  chartInterpolation: 'Interpolation chart',
  chartSparkline: 'Sparkline',
  chartInput: 'Input',
  chartOutput: 'Output',
  spinnerLabel: 'Loading content',
  toastSuccess: 'Success',
  toastError: 'Error',
  toastWarning: 'Warning',
  toastInfo: 'Information',
})

export const NB_STRINGS_KEY: InjectionKey<ComputedRef<INbStrings>> =
  Symbol('nb-strings')

type TOverridesSource = TNbStringsOverrides | Ref<TNbStringsOverrides>

/**
 * The catalogue used where no `provideNbStrings()` is in scope: components
 * rendered by a detached host (the confirm host, a toast queue created at
 * module level) and an app that set its strings once with
 * `provideNbStrings(strings)` outside any component.
 */
const globalOverrides = ref<TNbStringsOverrides>({})
const globalStrings = computed<INbStrings>(() => ({
  ...NB_DEFAULT_STRINGS,
  ...stripUndefined(globalOverrides.value),
}))

function stripUndefined(source: TNbStringsOverrides): TNbStringsOverrides {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) out[key] = value
  }
  return out as TNbStringsOverrides
}

/**
 * Replaces the library's built-in strings, in one of three scopes:
 *
 * - inside a component's `setup()`: that component's subtree, merged over
 *   whatever an ancestor provided;
 * - with an `app`: the whole application (`provideNbStrings(pt, app)`);
 * - anywhere else: the global fallback, which also reaches hosts the library
 *   mounts on its own, such as `useConfirm()`.
 *
 * The argument may be a ref, so switching language at runtime is one
 * assignment.
 */
export function provideNbStrings(
  overrides: TOverridesSource,
  app?: App,
): ComputedRef<INbStrings> {
  if (app) {
    const merged = computed<INbStrings>(() => ({
      ...globalStrings.value,
      ...stripUndefined(unref(overrides)),
    }))
    app.provide(NB_STRINGS_KEY, merged)
    return merged
  }
  if (getCurrentInstance()) {
    const parent = inject(NB_STRINGS_KEY, globalStrings)
    const merged = computed<INbStrings>(() => ({
      ...parent.value,
      ...stripUndefined(unref(overrides)),
    }))
    provide(NB_STRINGS_KEY, merged)
    return merged
  }
  globalOverrides.value = { ...unref(overrides) }
  return globalStrings
}

/**
 * The strings in scope for the calling component: the nearest
 * `provideNbStrings()`, else the global catalogue, else the English defaults.
 * Safe outside a component too, where it returns the global catalogue.
 */
export function useNbStrings(): ComputedRef<INbStrings> {
  if (!getCurrentInstance()) return globalStrings
  return inject(NB_STRINGS_KEY, globalStrings)
}

/** Clears the global overrides. For tests. */
export function resetNbStrings(): void {
  globalOverrides.value = {}
}
