<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const demoValue = ref(0)
const demoStatus = ref<'active' | 'finished'>('active')
let demoTimer: ReturnType<typeof setInterval> | undefined

function restartDemo() {
  demoValue.value = 0
  demoStatus.value = 'active'
  clearInterval(demoTimer)
  demoTimer = setInterval(() => {
    demoValue.value = Math.min(demoValue.value + Math.random() * 9, 100)
    if (demoValue.value >= 100) {
      demoStatus.value = 'finished'
      clearInterval(demoTimer)
    }
  }, 300)
}

onMounted(restartDemo)
onBeforeUnmount(() => clearInterval(demoTimer))

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Uploading assets',
    placeholder: 'Label text',
  },
  {
    label: 'Helper',
    name: 'helper',
    type: 'string',
    default: '42 of 64 files',
    placeholder: 'Helper text',
  },
]
</script>
