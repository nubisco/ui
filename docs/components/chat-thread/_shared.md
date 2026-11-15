<script setup lang="ts">
import { ref } from 'vue'

const draft = ref('')
const working = ref(false)
const messages = ref([
  { id: 1, author: 'Sam Rivera', picture: null, own: false, ai: false, text: 'Can you check why the nightly import failed?', time: '2026-11-15T09:02:00Z' },
  { id: 2, author: 'Assistant', picture: null, own: false, ai: true, text: 'The import stopped at row 4,182: the date column held "31/02/2026", which is not a date. Every row before it was saved.', time: '2026-11-15T09:02:20Z' },
  { id: 3, author: 'You', picture: null, own: true, ai: false, text: 'Skip that row and run it again.', time: '2026-11-15T09:03:00Z' },
])

function onSend(text: string) {
  messages.value.push({ id: Date.now(), author: 'You', picture: null, own: true, ai: false, text, time: new Date().toISOString() })
  working.value = true
  setTimeout(() => {
    messages.value.push({ id: Date.now() + 1, author: 'Assistant', picture: null, own: false, ai: true, text: 'Done. The import finished with one row skipped.', time: new Date().toISOString() })
    working.value = false
  }, 1500)
}
</script>
