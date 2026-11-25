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
const fileColumns = [
  { key: 'path', label: 'File', width: 'auto' },
  { key: 'owner', label: 'Owner', width: 'auto' },
  { key: 'note', label: 'Note' },
]
const fileRows = [
  { id: 1, path: 'src/main.ts', owner: 'Platform', note: 'Entry point' },
  { id: 2, path: 'src/server/routes/billing.ts', owner: 'Billing', note: 'Imports the mailer' },
  { id: 3, path: 'README.md', owner: 'Docs and developer experience', note: '' },
]
</script>
