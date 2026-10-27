<script setup lang="ts">
import { ref } from 'vue'
import type { IBlueprintCardMove } from '@/main'

interface IDemoCard {
  id: string
  title: string
  category: string
  color: string
  x: number
  y: number
  ports: { id: string; label: string; type: 'input' | 'output' }[]
}

const initialDemoCards: IDemoCard[] = [
  {
    id: 'input',
    title: 'Audio In',
    category: 'source',
    color: '#22c55e',
    x: 40,
    y: 80,
    ports: [{ id: 'out', label: 'out', type: 'output' }],
  },
  {
    id: 'filter',
    title: 'Low-pass',
    category: 'effect',
    color: '#a855f7',
    x: 240,
    y: 60,
    ports: [
      { id: 'in', label: 'in', type: 'input' },
      { id: 'out', label: 'out', type: 'output' },
    ],
  },
  {
    id: 'gain',
    title: 'Gain',
    category: 'effect',
    color: '#38bdf8',
    x: 240,
    y: 160,
    ports: [
      { id: 'in', label: 'in', type: 'input' },
      { id: 'out', label: 'out', type: 'output' },
    ],
  },
  {
    id: 'output',
    title: 'Speakers',
    category: 'sink',
    color: '#f97316',
    x: 440,
    y: 110,
    ports: [{ id: 'in', label: 'in', type: 'input' }],
  },
]

const initialConnections = [
  { fromNode: 'input', fromPort: 'out', toNode: 'filter', toPort: 'in' },
  { fromNode: 'filter', fromPort: 'out', toNode: 'output', toPort: 'in' },
]

const demoBlueprint = ref<any>(null)

// Background section demo: switch the built-in pattern, or drop a custom
// NbBlueprintBackground into the #background slot.
const bgVariants = ['dots', 'lines', 'grid', 'none'] as const
const bgBackground = ref<(typeof bgVariants)[number]>('grid')
const bgCustom = ref(false)

const demoCards = ref<IDemoCard[]>(
  initialDemoCards.map((c) => ({ ...c, ports: c.ports.map((p) => ({ ...p })) })),
)
const demoConnections = ref([...initialConnections])

function connectedPortsFor(cardId: string): string[] {
  const ports = new Set<string>()
  for (const c of demoConnections.value) {
    if (c.fromNode === cardId) ports.add(c.fromPort)
    if (c.toNode === cardId) ports.add(c.toPort)
  }
  return Array.from(ports)
}

function onDemoConnect(c: {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}) {
  const exists = demoConnections.value.some(
    (x) =>
      x.fromNode === c.fromNode &&
      x.fromPort === c.fromPort &&
      x.toNode === c.toNode &&
      x.toPort === c.toPort,
  )
  if (!exists) demoConnections.value.push(c)
}

function onDemoDisconnect(c: {
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}) {
  demoConnections.value = demoConnections.value.filter(
    (x) =>
      !(
        x.fromNode === c.fromNode &&
        x.fromPort === c.fromPort &&
        x.toNode === c.toNode &&
        x.toPort === c.toPort
      ),
  )
}

function onDemoMove(moves: IBlueprintCardMove[]) {
  for (const m of moves) {
    const card = demoCards.value.find((c) => c.id === m.id)
    if (card) {
      card.x = m.x
      card.y = m.y
    }
  }
}

function resetDemo() {
  demoCards.value = initialDemoCards.map((c) => ({
    ...c,
    ports: c.ports.map((p) => ({ ...p })),
  }))
  demoConnections.value = [...initialConnections]
}
</script>
