<script setup lang="ts">
import { nextTick, onScopeDispose, ref, watch } from 'vue'
import { useConfirm } from '../../../src'

const confirm = useConfirm()

const openBasic = ref(false)
const openSize = ref<'sm' | 'md' | 'lg' | 'xl' | 'immersive' | null>(null)
const openWide = ref<'lg' | 'xl' | 'immersive' | null>(null)
const confirmAnswer = ref('nothing yet')

async function runConfirm() {
  const answered = await confirm({
    title: 'Delete environment',
    subjectLabel: 'Environment',
    subject: 'staging-eu',
    message: 'Every entry, release and API key in it is deleted.',
    confirmLabel: 'Delete environment',
  })
  confirmAnswer.value = answered ? 'confirmed' : 'cancelled'
}

const regions = [
  { id: 'eu-west-1', latency: '24 ms', uptime: '99.99%', storage: '2 TB', notes: 'Read replicas, nightly snapshots' },
  { id: 'us-east-1', latency: '86 ms', uptime: '99.98%', storage: '4 TB', notes: 'Nightly snapshots' },
  { id: 'ap-south-1', latency: '142 ms', uptime: '99.95%', storage: '1 TB', notes: 'Read replicas, hourly snapshots' },
  { id: 'sa-east-1', latency: '118 ms', uptime: '99.97%', storage: '1 TB', notes: 'Read replicas, nightly snapshots' },
]

/*
 * The focus-trap demo has no focus code of its own. NbModal holds focus
 * itself, so this page cannot demonstrate behaviour the component does not
 * ship: what you see here is what a consumer gets from the component alone.
 */
const openTrap = ref(false)
const trapName = ref('')
const trapNotes = ref('')
const trapModal = ref<{ dialogEl: () => HTMLElement | null } | null>(null)
const focusLabel = ref('nothing yet')

function describeFocus() {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return 'the document'
  const label =
    el.getAttribute('aria-label') ||
    el.textContent?.trim().slice(0, 24) ||
    el.tagName.toLowerCase()
  return `${el.tagName.toLowerCase()} (${label || 'unnamed'})`
}

function onDocFocus() {
  focusLabel.value = describeFocus()
}

watch(openTrap, (isOpen) => {
  if (isOpen) document.addEventListener('focusin', onDocFocus)
  else {
    void nextTick(() => {
      focusLabel.value = describeFocus()
      document.removeEventListener('focusin', onDocFocus)
    })
  }
})

onScopeDispose(() => {
  if (typeof document !== 'undefined')
    document.removeEventListener('focusin', onDocFocus)
})
</script>
