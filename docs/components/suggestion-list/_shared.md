<script setup lang="ts">
import { computed, ref } from 'vue'

const people = [
  { id: 1, name: 'Ada Lovelace', handle: 'ada' },
  { id: 2, name: 'Alan Turing', handle: 'alan' },
  { id: 3, name: 'Grace Hopper', handle: 'grace' },
  { id: 4, name: 'Katherine Johnson', handle: 'katherine' },
  { id: 5, name: 'Margaret Hamilton', handle: 'margaret' },
]

const comment = ref('')
const mentionOpen = ref(false)
const query = ref('')
const matches = computed(() =>
  people.filter((p) => p.name.toLowerCase().includes(query.value) || p.handle.includes(query.value)),
)

let field: HTMLTextAreaElement | null = null

function onCommentInput(event: Event) {
  field = event.target as HTMLTextAreaElement
  const before = field.value.slice(0, field.selectionStart ?? 0)
  const match = before.match(/@([\w.-]*)$/)
  mentionOpen.value = !!match
  query.value = match?.[1].toLowerCase() ?? ''
}

function insertMention(person: { handle: string }) {
  if (!field) return
  const caret = field.selectionStart ?? comment.value.length
  const before = comment.value.slice(0, caret).replace(/@([\w.-]*)$/, `@${person.handle} `)
  comment.value = before + comment.value.slice(caret)
  const at = before.length
  requestAnimationFrame(() => field?.setSelectionRange(at, at))
}
</script>
