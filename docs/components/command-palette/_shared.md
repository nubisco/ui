<script setup lang="ts">
import { ref } from 'vue'
import { useCommandPalette } from '../../../src'

const palette = useCommandPalette()
const lastExecuted = ref('')

function showAction(name: string) {
  lastExecuted.value = name
}

// Register sample commands for the demo
palette.registerMany([
  {
    id: 'demo.file.new',
    label: 'New File',
    icon: 'file-plus',
    namespace: 'File',
    shortcut: 'Cmd+N',
    handler: () => showAction('New File'),
  },
  {
    id: 'demo.file.open',
    label: 'Open File',
    icon: 'folder-open',
    namespace: 'File',
    shortcut: 'Cmd+O',
    handler: () => showAction('Open File'),
  },
  {
    id: 'demo.file.save',
    label: 'Save',
    icon: 'floppy-disk',
    namespace: 'File',
    shortcut: 'Cmd+S',
    handler: () => showAction('Save'),
  },
  {
    id: 'demo.file.saveas',
    label: 'Save As...',
    icon: 'floppy-disk',
    namespace: 'File',
    shortcut: 'Cmd+Shift+S',
    handler: () => showAction('Save As'),
  },
  {
    id: 'demo.edit.undo',
    label: 'Undo',
    icon: 'arrow-counter-clockwise',
    namespace: 'Edit',
    shortcut: 'Cmd+Z',
    handler: () => showAction('Undo'),
  },
  {
    id: 'demo.edit.redo',
    label: 'Redo',
    icon: 'arrow-clockwise',
    namespace: 'Edit',
    shortcut: 'Cmd+Shift+Z',
    handler: () => showAction('Redo'),
  },
  {
    id: 'demo.edit.find',
    label: 'Find in Files',
    icon: 'magnifying-glass',
    namespace: 'Edit',
    shortcut: 'Cmd+Shift+F',
    handler: () => showAction('Find in Files'),
  },
  {
    id: 'demo.edit.replace',
    label: 'Find and Replace',
    icon: 'swap',
    namespace: 'Edit',
    shortcut: 'Cmd+H',
    handler: () => showAction('Find and Replace'),
  },
  {
    id: 'demo.view.sidebar',
    label: 'Toggle Sidebar',
    icon: 'sidebar',
    namespace: 'View',
    shortcut: 'Cmd+B',
    handler: () => showAction('Toggle Sidebar'),
  },
  {
    id: 'demo.view.terminal',
    label: 'Toggle Terminal',
    icon: 'terminal',
    namespace: 'View',
    shortcut: 'Cmd+`',
    handler: () => showAction('Toggle Terminal'),
  },
  {
    id: 'demo.view.zoom-in',
    label: 'Zoom In',
    icon: 'magnifying-glass-plus',
    namespace: 'View',
    shortcut: 'Cmd+=',
    handler: () => showAction('Zoom In'),
  },
  {
    id: 'demo.view.zoom-out',
    label: 'Zoom Out',
    icon: 'magnifying-glass-minus',
    namespace: 'View',
    shortcut: 'Cmd+-',
    handler: () => showAction('Zoom Out'),
  },
  {
    id: 'demo.help.docs',
    label: 'Open Documentation',
    icon: 'book-open',
    namespace: 'Help',
    handler: () => showAction('Open Documentation'),
    keywords: ['manual', 'guide', 'reference'],
  },
  {
    id: 'demo.help.about',
    label: 'About',
    icon: 'info',
    namespace: 'Help',
    handler: () => showAction('About'),
  },
])
</script>
