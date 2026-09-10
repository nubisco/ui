/**
 * Demo data and state for the Team management example.
 *
 * Everything here is fictional. The names are invented, the addresses are on
 * `example.com`, which is reserved by RFC 2606 for exactly this, and nothing
 * is derived from any real organisation or person.
 *
 * The logic lives outside the component for two reasons: the example is
 * supposed to be readable as an application, and a reader who wants to see how
 * search, filtering, sorting, paging and selection interact should be able to
 * read that without stepping through template markup.
 */

import { computed, ref } from 'vue'

export interface ITeamMember {
  id: number
  name: string
  email: string
  role: TRole
  status: TStatus
  team: string
  lastActive: string
}

export type TRole = 'Owner' | 'Admin' | 'Editor' | 'Viewer'
export type TStatus = 'Active' | 'Invited' | 'Suspended'

export const ROLES: TRole[] = ['Owner', 'Admin', 'Editor', 'Viewer']
export const STATUSES: TStatus[] = ['Active', 'Invited', 'Suspended']

/**
 * Deliberately more rows than one page holds, so paging is a real interaction
 * rather than a disabled control, and with enough spread across roles, teams
 * and statuses that two filters combined still leave something on screen.
 */
const SEED: ITeamMember[] = [
  ['Ama Boateng', 'Owner', 'Active', 'Platform', '2 hours ago'],
  ['Rui Marques', 'Admin', 'Active', 'Platform', '11 minutes ago'],
  ['Sofia Haddad', 'Editor', 'Active', 'Design', 'Yesterday'],
  ['Nils Vestergaard', 'Viewer', 'Invited', 'Design', 'Never'],
  ['Priya Raman', 'Admin', 'Active', 'Data', '3 days ago'],
  ['Tomás Iglesias', 'Editor', 'Suspended', 'Data', '2 weeks ago'],
  ['Wen Li', 'Editor', 'Active', 'Platform', '40 minutes ago'],
  ['Hanna Öberg', 'Viewer', 'Active', 'Support', '5 hours ago'],
  ['Kwame Mensah', 'Admin', 'Invited', 'Support', 'Never'],
  ['Isabela Duarte', 'Editor', 'Active', 'Design', 'Yesterday'],
  ['Yusuf Demir', 'Viewer', 'Suspended', 'Platform', 'A month ago'],
  ['Marta Kowalska', 'Editor', 'Active', 'Data', '1 hour ago'],
  ['Diego Salazar', 'Viewer', 'Invited', 'Support', 'Never'],
  ['Aoife Brennan', 'Admin', 'Active', 'Design', '6 hours ago'],
  ['Chidi Okafor', 'Editor', 'Active', 'Support', '3 hours ago'],
  ['Lena Fischer', 'Viewer', 'Active', 'Data', '4 days ago'],
  ['Rafael Pinto', 'Editor', 'Suspended', 'Design', '3 weeks ago'],
  ['Mei Tanaka', 'Admin', 'Active', 'Platform', '20 minutes ago'],
  ['Oscar Lindqvist', 'Viewer', 'Invited', 'Data', 'Never'],
  ['Fatima Zahra', 'Editor', 'Active', 'Support', '8 hours ago'],
  ['Janek Nowak', 'Viewer', 'Active', 'Platform', '2 days ago'],
  ['Cristina Rossi', 'Editor', 'Active', 'Design', '30 minutes ago'],
].map(([name, role, status, team, lastActive], index) => ({
  id: index + 1,
  name: name as string,
  // A stable, obviously fake address derived from the name.
  email: `${(name as string)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]+/g, '.')}@example.com`,
  role: role as TRole,
  status: status as TStatus,
  team: team as string,
  lastActive: lastActive as string,
}))

/** The demo's simulated failure and loading switches. */
export type TDemoState = 'ready' | 'loading' | 'error'

export function useTeamData() {
  const members = ref<ITeamMember[]>(structuredClone(SEED))
  const demoState = ref<TDemoState>('ready')

  const search = ref('')
  const roleFilter = ref<TRole | null>(null)
  const statusFilter = ref<TStatus | null>(null)

  const page = ref(1)
  const pageSize = ref(10)
  const sortKey = ref<string>('name')
  const sortDirection = ref<'asc' | 'desc' | 'none'>('asc')
  const selected = ref<(string | number)[]>([])

  const teams = computed(() =>
    [...new Set(SEED.map((m) => m.team))].sort((a, b) => a.localeCompare(b)),
  )

  /**
   * Search and both filters compose: each one narrows what the previous one
   * left, so combining "Admin" with "Suspended" asks for the intersection and
   * is allowed to return nothing. That empty result is a different state from
   * "this team has no members", and the component distinguishes them.
   */
  const filtered = computed(() => {
    const needle = search.value.trim().toLowerCase()
    return members.value.filter((m) => {
      if (roleFilter.value && m.role !== roleFilter.value) return false
      if (statusFilter.value && m.status !== statusFilter.value) return false
      if (!needle) return true
      return (
        m.name.toLowerCase().includes(needle) ||
        m.email.toLowerCase().includes(needle) ||
        m.team.toLowerCase().includes(needle)
      )
    })
  })

  const sorted = computed(() => {
    const key = sortKey.value
    const direction = sortDirection.value
    if (direction === 'none' || !key) return filtered.value
    const factor = direction === 'asc' ? 1 : -1
    return [...filtered.value].sort((a, b) => {
      const av = String(a[key as keyof ITeamMember] ?? '')
      const bv = String(b[key as keyof ITeamMember] ?? '')
      return av.localeCompare(bv) * factor
    })
  })

  const total = computed(() => sorted.value.length)

  /**
   * Paging is clamped rather than trusted. Deleting the last row of the last
   * page, or narrowing a filter, can leave `page` past the end; without this
   * the table renders an empty page with a working "previous" button, which
   * reads as data loss.
   */
  const pageCount = computed(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value)),
  )

  const paged = computed(() => {
    const current = Math.min(page.value, pageCount.value)
    const start = (current - 1) * pageSize.value
    return sorted.value.slice(start, start + pageSize.value)
  })

  function clampPage() {
    if (page.value > pageCount.value) page.value = pageCount.value
  }

  /**
   * Selection is kept to rows the current result actually contains.
   *
   * Without this, filtering to "Design", selecting three people, then clearing
   * the filter and pressing Delete removes rows the user cannot see and did
   * not knowingly choose. Narrowing the results narrows the selection with it.
   */
  function reconcileSelection() {
    const visible = new Set(filtered.value.map((m) => m.id))
    selected.value = selected.value.filter((id) => visible.has(id as number))
  }

  function resetFilters() {
    search.value = ''
    roleFilter.value = null
    statusFilter.value = null
    page.value = 1
    reconcileSelection()
  }

  function resetDemo() {
    members.value = structuredClone(SEED)
    demoState.value = 'ready'
    selected.value = []
    resetFilters()
    sortKey.value = 'name'
    sortDirection.value = 'asc'
    pageSize.value = 10
  }

  function update(id: number, patch: Partial<ITeamMember>) {
    const index = members.value.findIndex((m) => m.id === id)
    if (index === -1) return
    members.value[index] = { ...members.value[index], ...patch }
  }

  function remove(ids: (string | number)[]) {
    const doomed = new Set(ids)
    members.value = members.value.filter((m) => !doomed.has(m.id))
    selected.value = selected.value.filter((id) => !doomed.has(id))
    clampPage()
  }

  return {
    members,
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
    filtered,
    sorted,
    paged,
    total,
    pageCount,
    clampPage,
    reconcileSelection,
    resetFilters,
    resetDemo,
    update,
    remove,
  }
}

/** Validation for the edit form. Returns a message, or null when the field is fine. */
export function validateName(value: string): string | null {
  if (!value.trim()) return 'A name is required.'
  if (value.trim().length < 2) return 'Use at least two characters.'
  return null
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'An email address is required.'
  // Deliberately permissive: enough to catch a typo, not a spec implementation.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return 'That does not look like an email address.'
  return null
}
