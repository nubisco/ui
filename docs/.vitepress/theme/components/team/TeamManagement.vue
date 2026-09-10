<template>
  <!--
    `vp-raw` opts this subtree out of VitePress's prose styling.

    Without it the documentation theme's own table rules land on NbDataTable's
    real <table>: in dark mode the rows kept a light prose background while the
    component's text went light, which is unreadable. A component that renders
    genuine table semantics inside a docs page has to be excluded from the
    page's table styling, and `vp-raw` is the supported way to say so.
  -->
  <div class="team vp-raw" :data-nb-preset="preset">
    <!-- Page header: where you are, and the one action this screen is for. -->
    <header class="team__header">
      <div class="team__heading">
        <NbBreadcrumbs
          title="Workspace"
          subtitle="Settings"
          class="team__crumbs"
        >
          <a href="#">Members</a>
        </NbBreadcrumbs>
        <h2 class="team__title">Team members</h2>
        <p class="team__subtitle">
          {{ total }} {{ total === 1 ? 'person' : 'people' }} across
          {{ teams.length }} teams.
        </p>
      </div>

      <!-- Action hierarchy: one primary, one neutral secondary, nothing else
           competing. Status colour is not used for ordinary actions. -->
      <NbGrid dir="row" gap="sm" align="center">
        <NbButton variant="ghost" @click="resetDemo">Reset demo</NbButton>
        <NbButton variant="primary" icon="plus" @click="invite">
          Invite member
        </NbButton>
      </NbGrid>
    </header>

    <!-- Demo controls, clearly labelled as such so nobody reads a simulated
         failure as a real one. -->
    <NbPanel class="team__demo-bar">
      <NbGrid dir="row" gap="md" align="center" wrap>
        <span class="team__demo-label">Demo controls</span>
        <NbGrid dir="row" gap="xs" align="center">
          <NbButton
            v-for="state in demoStates"
            :key="state"
            size="sm"
            :variant="demoState === state ? 'secondary' : 'ghost'"
            :aria-pressed="demoState === state"
            @click="demoState = state"
          >
            {{ state }}
          </NbButton>
        </NbGrid>

        <NbGrid dir="row" gap="xs" align="center">
          <span class="team__demo-label">Density</span>
          <NbButton
            v-for="d in densities"
            :key="d.value"
            size="sm"
            :variant="density === d.value ? 'secondary' : 'ghost'"
            :aria-pressed="density === d.value"
            @click="density = d.value"
          >
            {{ d.label }}
          </NbButton>
        </NbGrid>

        <NbGrid dir="row" gap="xs" align="center">
          <span class="team__demo-label">Appearance</span>
          <NbButton
            size="sm"
            :variant="appearance === 'square' ? 'secondary' : 'ghost'"
            :aria-pressed="appearance === 'square'"
            @click="setAppearance('square')"
          >
            Square
          </NbButton>
          <NbButton
            size="sm"
            :variant="appearance === 'rounded' ? 'secondary' : 'ghost'"
            :aria-pressed="appearance === 'rounded'"
            @click="setAppearance('rounded')"
          >
            Rounded
          </NbButton>
        </NbGrid>

        <NbGrid dir="row" gap="xs" align="center">
          <span class="team__demo-label">Fields</span>
          <NbButton
            size="sm"
            :variant="preset ? 'ghost' : 'secondary'"
            :aria-pressed="!preset"
            @click="preset = null"
          >
            Default
          </NbButton>
          <NbButton
            size="sm"
            :variant="preset ? 'secondary' : 'ghost'"
            :aria-pressed="!!preset"
            @click="preset = 'classic-fields'"
          >
            Classic
          </NbButton>
        </NbGrid>
      </NbGrid>
    </NbPanel>

    <NbDataTable
      :columns="columns"
      :rows="paged"
      row-key="id"
      :size="density"
      selectable="multiple"
      v-model:selected="selected"
      :sort-state="{ key: sortKey, direction: sortDirection }"
      :loading="demoState === 'loading'"
      :error="demoState === 'error' ? errorMessage : undefined"
      :empty-message="emptyMessage"
      aria-label="Team members"
      class="team__table"
      @sort="onSort"
    >
      <!-- The filters live in the toolbar the table already reserves for its
           batch bar. That strip is rendered whether or not anything is
           selected, so leaving it empty showed an unexplained blank box; and
           the component marks it inert while rows are selected, which is the
           right behaviour for a filter the batch action does not apply to. -->
      <template #toolbar>
        <NbGrid dir="row" gap="md" align="end" wrap class="team__filters">
          <NbTextInput
            v-model="search"
            label="Search"
            placeholder="Name, email or team"
            :size="density"
            class="team__search"
            @update:model-value="onFilterChange"
          />
          <NbSelect
            v-model="roleFilter"
            label="Role"
            placeholder="Any role"
            :options="roleOptions"
            :size="density"
            class="team__filter"
            @update:model-value="onFilterChange"
          />
          <NbSelect
            v-model="statusFilter"
            label="Status"
            placeholder="Any status"
            :options="statusOptions"
            :size="density"
            class="team__filter"
            @update:model-value="onFilterChange"
          />
          <NbButton
            variant="ghost"
            :size="density"
            :disabled="!hasFilters"
            @click="resetFilters"
          >
            Clear filters
          </NbButton>
        </NbGrid>
      </template>

      <template #batch-actions="{ clear }">
        <NbGrid dir="row" gap="sm" align="center">
          <NbButton variant="ghost" size="sm" @click="clear">Cancel</NbButton>
          <!-- Status colour reserved for what it means: this one destroys data. -->
          <NbButton variant="danger" size="sm" @click="confirmRemoveSelected">
            Remove {{ selected.length }}
          </NbButton>
        </NbGrid>
      </template>

      <template #cell-name="{ row }">
        <!-- Compact drops the second line and shrinks the avatar. Without
             that, this cell is 48px tall and the row never gets shorter than
             it, so the density control moves the table's own token and
             changes nothing anyone can see. A custom cell has to take part in
             density or it silently overrides it. -->
        <div :class="['team__person', `team__person--${density}`]">
          <span class="team__avatar" aria-hidden="true">
            {{ initials(row.name) }}
          </span>
          <span class="team__person-text">
            <span class="team__person-name">{{ row.name }}</span>
            <span v-if="density !== 'sm'" class="team__person-email">
              {{ row.email }}
            </span>
          </span>
        </div>
      </template>

      <template #cell-status="{ row }">
        <NbBadge :variant="statusVariant(row.status)">{{ row.status }}</NbBadge>
      </template>

      <template #row-actions="{ row }">
        <NbGrid dir="row" gap="xs">
          <NbButton
            variant="ghost"
            size="sm"
            icon="pencil-simple"
            :aria-label="`Edit ${row.name}`"
            @click="openEditor(row)"
          />
          <NbButton
            variant="ghost"
            size="sm"
            icon="trash"
            :aria-label="`Remove ${row.name}`"
            @click="confirmRemoveOne(row)"
          />
        </NbGrid>
      </template>

      <template #footer>
        <NbPagination
          v-model:page="page"
          :page-size="pageSize"
          :total="total"
          :size="density"
          item-label="people"
          @update:page-size="onPageSize"
        />
      </template>
    </NbDataTable>

    <!-- The editor. A dialog rather than an inline row edit because it has
         validation and a cancel that has to mean something. -->
    <NbModal
      :open="editorOpen"
      size="sm"
      title="Edit member"
      initial-focus="input"
      @close="cancelEdit"
    >
      <NbGrid dir="col" gap="md">
        <NbTextInput
          v-model="draft.name"
          label="Name"
          :error="errors.name ?? undefined"
          @update:model-value="errors.name = null"
        />
        <NbTextInput
          v-model="draft.email"
          label="Email"
          :error="errors.email ?? undefined"
          @update:model-value="errors.email = null"
        />
        <NbSelect v-model="draft.role" label="Role" :options="roleOptions" />
        <NbSelect
          v-model="draft.status"
          label="Status"
          :options="statusOptions"
        />
      </NbGrid>

      <template #footer>
        <NbButton variant="ghost" @click="cancelEdit">Cancel</NbButton>
        <NbButton variant="primary" @click="saveEdit">Save changes</NbButton>
      </template>
    </NbModal>

    <NbToaster />
  </div>
</template>

<script setup lang="ts">
/**
 * A complete application screen built only from library components.
 *
 * It exists to answer a question the component pages cannot: what does this
 * library look like when the pieces have to work together on one screen, with
 * real interaction and every state a list actually reaches. Nothing here uses
 * a private selector or a one-off style to make a component look better than
 * it ships; if something needed fixing to make this screen work, it was fixed
 * in the component.
 *
 * All data is fictional and lives in memory. There is no backend.
 */
import { computed, reactive, ref, watch } from 'vue'
import {
  useTeamData,
  validateEmail,
  validateName,
  ROLES,
  STATUSES,
  type ITeamMember,
  type TDemoState,
} from './teamData'
import { useConfirm } from '../../../../../src/composables/useConfirm.composable'
import { useToast } from '../../../../../src/composables/useToast.composable'
import { useAppearance } from '../../../../../src/composables/useAppearance.composable'

const {
  demoState,
  search,
  roleFilter,
  statusFilter,
  page,
  pageSize,
  sortKey,
  sortDirection,
  selected,
  teams,
  paged,
  total,
  clampPage,
  reconcileSelection,
  resetFilters,
  resetDemo,
  update,
  remove,
} = useTeamData()

const confirm = useConfirm()
const toast = useToast()
const { appearance, setAppearance } = useAppearance()

const density = ref<'sm' | 'md' | 'lg'>('md')
const preset = ref<string | null>(null)

const demoStates: TDemoState[] = ['ready', 'loading', 'error']
const densities = [
  { label: 'Compact', value: 'sm' as const },
  { label: 'Comfortable', value: 'md' as const },
]

const errorMessage = 'Could not load the team. Check your connection.'

/**
 * Widths sit on the short columns; Member takes whatever is left.
 *
 * The table lays out `auto`, where a column with no width settles at its
 * max-content size rather than absorbing slack. The first version pinned
 * Member to `34%` and the columns finished 357px short of the table's right
 * edge, leaving a band of dead space beside the last one. `width: '100%'` on
 * exactly one column is the table-layout idiom for "this one takes the
 * remainder", and it is what keeps the long values in the widest cell.
 */
const columns = [
  { key: 'name', header: 'Member', sortable: true, width: '100%' },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    cellClass: 'team__nowrap',
  },
  {
    key: 'team',
    header: 'Team',
    sortable: true,
    cellClass: 'team__nowrap',
  },
  { key: 'status', header: 'Status', align: 'center' as const },
  {
    key: 'lastActive',
    header: 'Last active',
    align: 'right' as const,
    cellClass: 'team__nowrap',
  },
]

const roleOptions = ROLES.map((r) => ({ label: r, value: r }))
const statusOptions = STATUSES.map((s) => ({ label: s, value: s }))

const hasFilters = computed(
  () => !!search.value || !!roleFilter.value || !!statusFilter.value,
)

/**
 * One empty surface, two sentences.
 *
 * The first version rendered a separate NbEmptyState under the table while the
 * table showed its own default "No data to display", so a filtered-to-nothing
 * result stacked two different empty messages. The table is the thing that is
 * empty, so it says so; "Clear filters" is already in the toolbar directly
 * above it and stays enabled, so the way out is still one click away.
 */
const emptyMessage = computed(() =>
  hasFilters.value
    ? 'No people match these filters. Try a different search, or clear the filters above.'
    : 'No one has been added to this workspace yet.',
)

function onFilterChange() {
  page.value = 1
  reconcileSelection()
}

function onSort(state: { key: string; direction: 'asc' | 'desc' | 'none' }) {
  sortKey.value = state.key
  sortDirection.value = state.direction
  page.value = 1
}

function onPageSize(size: number) {
  pageSize.value = size
  page.value = 1
}

// Removing the last row of a page must not strand the user on an empty one.
watch(total, () => clampPage())

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

function statusVariant(status: string) {
  if (status === 'Active') return 'green'
  if (status === 'Invited') return 'blue'
  return 'orange'
}

function invite() {
  toast.info('Inviting is not wired up in this example.')
}

/* ── Editing ─────────────────────────────────────────────── */

const editorOpen = ref(false)
const editing = ref<ITeamMember | null>(null)
const draft = reactive({ name: '', email: '', role: '', status: '' })
const errors = reactive<{ name: string | null; email: string | null }>({
  name: null,
  email: null,
})

function openEditor(row: ITeamMember) {
  editing.value = row
  draft.name = row.name
  draft.email = row.email
  draft.role = row.role
  draft.status = row.status
  errors.name = null
  errors.email = null
  editorOpen.value = true
}

/** Cancel discards. The draft is a copy, so there is nothing to roll back. */
function cancelEdit() {
  editorOpen.value = false
  editing.value = null
}

function saveEdit() {
  errors.name = validateName(draft.name)
  errors.email = validateEmail(draft.email)
  // A form that fails validation keeps the dialog open and says why.
  if (errors.name || errors.email) return

  const target = editing.value
  if (!target) return
  update(target.id, {
    name: draft.name.trim(),
    email: draft.email.trim(),
    role: draft.role as ITeamMember['role'],
    status: draft.status as ITeamMember['status'],
  })
  editorOpen.value = false
  editing.value = null
  toast.success(`${draft.name.trim()} updated.`)
}

/* ── Removal ─────────────────────────────────────────────── */

async function confirmRemoveOne(row: ITeamMember) {
  const answered = await confirm({
    title: 'Remove member',
    tone: 'danger',
    subjectLabel: 'Member',
    subject: row.name,
    message: 'They lose access to this workspace immediately.',
    confirmLabel: 'Remove member',
  })
  if (!answered) return
  remove([row.id])
  toast.success(`${row.name} removed.`)
}

async function confirmRemoveSelected() {
  const count = selected.value.length
  const answered = await confirm({
    title: `Remove ${count} ${count === 1 ? 'member' : 'members'}`,
    tone: 'danger',
    message: 'They lose access to this workspace immediately.',
    confirmLabel: `Remove ${count}`,
  })
  if (!answered) return
  remove([...selected.value])
  toast.success(`${count} ${count === 1 ? 'member' : 'members'} removed.`)
}
</script>

<style scoped lang="scss">
@use '../../../../../src/styles/logic/radius' as radius;

.team {
  display: flex;
  flex-direction: column;
  gap: var(--nb-spacing-16);
  container-type: inline-size;
  /*
   * A flex item will not shrink below its content's intrinsic width unless it
   * is told it may. Without this the table's own horizontal scroller never
   * engages: the table pushes this column wider instead, and the whole page
   * scrolls sideways on a narrow screen rather than the table doing it.
   */
  min-width: 0;
}

.team__table {
  min-width: 0;
}

.team__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--nb-spacing-16);
  flex-wrap: wrap;
}

.team__crumbs {
  margin-bottom: 6px;
}

// Applied to table cells through NbDataTable's `cellClass`, so it has to
// escape scoping: the element belongs to the component, not to this template.
:deep(.team__nowrap) {
  white-space: nowrap;
}

.team__title {
  margin: 0;
  font-size: var(--nb-font-size-20);
  font-weight: 600;
  color: var(--nb-c-text);
  line-height: 1.3;
  // The docs theme styles bare headings; this one is page furniture.
  border: none;
  padding: 0;
}

.team__subtitle {
  margin: 2px 0 0;
  font-size: var(--nb-font-size-13);
  color: var(--nb-c-text-muted);
}

.team__demo-bar {
  // A demo control strip, visibly not part of the product screen.
  border: 1px dashed var(--nb-c-layer-border-2);
  min-width: 0;

  /*
   * Every row in here wraps, nested groups included.
   *
   * Only the outer grid was set to wrap, so at 400px the strip measured 992px
   * wide and pushed the whole example into horizontal overflow: the table was
   * innocent, its own scroller was working, and the demo furniture was the
   * thing breaking the narrow layout.
   */
  :deep(.nb-grid) {
    flex-wrap: wrap;
    min-width: 0;
  }
}

.team__demo-label {
  font-size: var(--nb-font-size-12);
  font-weight: 600;
  color: var(--nb-c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.team__search {
  flex: 1 1 220px;
  min-width: 0;
}

.team__filter {
  flex: 0 1 160px;
  min-width: 0;
}

.team__person {
  display: flex;
  align-items: center;
  gap: var(--nb-spacing-8);
  min-width: 0;
}

.team__person--sm {
  .team__avatar {
    width: 20px;
    height: 20px;
    font-size: 9px;
  }
}

.team__avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: var(--nb-c-primary);
  color: var(--nb-c-primary-a11y);
  // Round because it is an avatar, at every appearance.
  @include radius.circular;
}

.team__person-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.team__person-name {
  font-weight: 500;
  color: var(--nb-c-text);
  // Long names truncate rather than breaking the row height.
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team__person-email {
  font-size: var(--nb-font-size-12);
  color: var(--nb-c-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Narrow screens: the header stacks and the filters go full width, so the
// primary action stays reachable without horizontal scrolling.
@container (max-width: 640px) {
  .team__header {
    flex-direction: column;
    align-items: stretch;
  }

  .team__search,
  .team__filter {
    flex: 1 1 100%;
  }
}
</style>
