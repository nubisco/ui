<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const base = new Date('2026-11-15T09:00:00Z').getTime()
const lines = ref([
  { text: 'Cloning the repository', time: base },
  { text: 'Installing 412 packages', time: base + 4000 },
  { text: 'deprecated: request@2.88.2 has been replaced', level: 'warning', time: base + 9000 },
  { text: 'Running 1,204 tests', time: base + 21000 },
  { text: 'FAIL tests/import.test.ts: expected 3 rows, received 2', level: 'error', marker: 'stderr', time: base + 33000 },
  { text: 'A long line wraps rather than pushing the log sideways: /var/lib/builds/2026-11-15/artifacts/very/deep/path/to/a/file/that/goes/on/and/on/report.json', time: base + 34000 },
])

let n = 0
let timer: ReturnType<typeof setInterval> | undefined
const running = ref(false)
function toggle() {
  running.value = !running.value
  if (!running.value) return clearInterval(timer)
  timer = setInterval(() => {
    n += 1
    lines.value.push({ text: `step ${n}: ok`, level: n % 7 === 0 ? 'debug' : 'info', time: Date.now() })
  }, 400)
}
onBeforeUnmount(() => clearInterval(timer))

const many = Array.from({ length: 3000 }, (_, i) => `line ${i + 1}`)
</script>
