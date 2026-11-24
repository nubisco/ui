<script setup lang="ts">
import { ref } from 'vue'

const svg = ref(`<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="100" height="60" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
  <circle cx="60" cy="40" r="14" fill="currentColor"/>
</svg>`)

const json = ref(`{
  "name": "Field notes",
  "pages": 143,
  "subjects": ["História", "Matemática", "Ciências"]
}`)

const notes = ref('')
const broken = ref('{ "name": "missing a brace"')
</script>
