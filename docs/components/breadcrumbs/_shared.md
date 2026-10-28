<script setup lang="ts">
import { ref } from 'vue'

const companies = [
  { label: 'Acme', value: 'acme' },
  { label: 'Globex', value: 'globex' },
  { label: 'Initech', value: 'initech' },
  { label: "Côte d'Or", value: 'cote' },
]

const years = [2026, 2025, 2024, 2023].map((y) => ({ label: String(y), value: y }))

const trail = [
  { label: 'Home', to: '/components/breadcrumbs/usage' },
  { label: 'Acme', value: 'acme', options: companies, switchLabel: 'Switch company', searchPlaceholder: 'Find companies' },
  { label: 'Hours' },
  { label: '2026', value: 2026, options: years, switchLabel: 'Switch year', searchPlaceholder: 'Find years' },
]

const last = ref('')
function onSwitch(_item: unknown, option: { label: string }) {
  last.value = option.label
}
</script>
