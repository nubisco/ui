<script setup lang="ts">
import { ref } from 'vue'

const simpleDate = ref<string | null>(null)
const singleDate = ref<string | null>(null)
const rangeStart = ref<string | null>(null)
const rangeEnd = ref<string | null>(null)
const labeledStart = ref<string | null>(null)
const labeledEnd = ref<string | null>(null)
const constrainedDate = ref<string | null>(null)
const blockedDate = ref<string | null>(null)
const errorDate = ref<string | null>(null)
const warningDate = ref<string | null>(null)
const rangeErrStart = ref<string | null>('2026-04-20')
const rangeErrEnd = ref<string | null>('2026-04-12')
const helperDate = ref<string | null>(null)
const smDate = ref<string | null>(null)
const mdDate = ref<string | null>(null)
const lgDate = ref<string | null>(null)
const fluidDate = ref<string | null>(null)
const fluidErrDate = ref<string | null>(null)
const sundayDate = ref<string | null>(null)

function isWeekend(iso: string): boolean {
  const day = new Date(iso + 'T00:00:00').getDay()
  return day === 0 || day === 6
}
</script>
