<script setup lang="ts">
const roleColumns = [
  { key: 'name', label: 'Role' },
  { key: 'people', label: 'People', width: '6rem', align: 'end' },
  { key: 'can', label: 'Can' },
]
const roleRows = [
  { id: 'owner', name: 'Owner', people: 1, can: 'Everything, including deleting the project' },
  { id: 'editor', name: 'Editor', people: 6, can: 'Change content and settings' },
  { id: 'viewer', name: 'Viewer', people: 14, can: 'Read' },
  { id: 'guest', name: 'Guest', people: 0, can: '' },
]
</script>
