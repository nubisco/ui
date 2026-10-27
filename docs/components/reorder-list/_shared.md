<script setup>
import { ref } from 'vue'
const reorderDemo = ref([
  { id: 'title', label: 'Title' },
  { id: 'slug', label: 'Slug' },
  { id: 'body', label: 'Body' },
  { id: 'cover', label: 'Cover image' },
])
const reorderHandleDemo = ref([
  { id: 'hero', label: 'Hero' },
  { id: 'features', label: 'Feature grid' },
  { id: 'cta', label: 'Call to action' },
])
</script>
