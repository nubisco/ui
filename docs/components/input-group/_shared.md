<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const slug = ref('quarterly-report')
const unit = ref('days')
const due = ref<string | null>(null)
const units = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
]
</script>
