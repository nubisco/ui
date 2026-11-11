<script setup lang="ts">
import { ref } from 'vue'

const scope = ref('all')
const scopeSm = ref('all')
const scopes = [
  { value: 'all', label: 'All products' },
  { value: 'docs', label: 'Docs' },
  { value: 'guides', label: 'Guides' },
  { value: 'api', label: 'API' },
  { value: 'changelog', label: 'Changelog' },
]
</script>
