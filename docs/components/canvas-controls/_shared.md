<script setup lang="ts">
import { ref } from 'vue'

const zoom = ref(100)
const layer = ref('lanes')
const edges = ref(true)
const layers = [
  { label: 'Lanes', value: 'lanes' },
  { label: 'Treemap', value: 'treemap' },
]
</script>

<style scoped>
.cc-canvas {
  position: relative;
  width: 100%;
  height: 280px;
  background-color: var(--nb-c-layer-0, var(--nb-c-bg));
  background-image: radial-gradient(var(--nb-c-border) 1px, transparent 1px);
  background-size: 16px 16px;
  border: 1px solid var(--nb-c-border);
  overflow: hidden;
}
</style>
