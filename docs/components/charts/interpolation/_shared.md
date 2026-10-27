<script setup lang="ts">
import { ref } from 'vue'

const demoPoints = ref([
  { input: 18, output: 35 },
  { input: 20, output: 40 },
  { input: 22, output: 47 },
  { input: 24, output: 55 },
])

const staticPoints = [
  { input: 30, output: 25 },
  { input: 40, output: 35 },
  { input: 50, output: 50 },
  { input: 60, output: 65 },
  { input: 70, output: 75 },
]
</script>
