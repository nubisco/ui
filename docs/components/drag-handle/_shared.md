<script setup lang="ts">
import { ref } from 'vue'

const blocks = ref([
  { id: 'intro', label: 'Introduction' },
  { id: 'setup', label: 'Setup' },
  { id: 'usage', label: 'Usage' },
])
const announcement = ref('')

function onMove(index: number, event: { via: string; direction?: string }) {
  if (event.via !== 'keyboard') return
  const to = event.direction === 'up' ? index - 1 : event.direction === 'down' ? index + 1 : index
  if (to < 0 || to >= blocks.value.length || to === index) return
  const next = [...blocks.value]
  const [moved] = next.splice(index, 1)
  next.splice(to, 0, moved)
  blocks.value = next
  announcement.value = `${moved.label} moved to position ${to + 1} of ${next.length}`
}
</script>
