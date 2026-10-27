<script setup lang="ts">
import { ref } from 'vue'

const clientTabs = [
  { id: 'settings', label: 'Settings' },
  { id: 'hours', label: 'Hours' },
  { id: 'invoices', label: 'Invoices' },
]

const authTabs = [
  { id: 'sign-in', label: 'Sign in' },
  { id: 'sign-up', label: 'Sign up' },
]

const decoratedTabs = [
  { id: 'files', label: 'Files', icon: 'folder' },
  { id: 'issues', label: 'Issues', icon: 'warning-circle', badge: 12 },
  { id: 'history', label: 'History', icon: 'clock-counter-clockwise' },
]

const detailTab = ref('activity')
const detailTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'history', label: 'History' },
]

const partiallyDisabledTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'billing', label: 'Billing', disabled: true },
  { id: 'members', label: 'Members' },
]

const activeTab = ref('settings')

const availableProps = [
  {
    label: 'Variant',
    name: 'variant',
    type: 'single',
    options: [
      { value: 'line', label: 'Line' },
      { value: 'contained', label: 'Contained' },
    ],
    default: 'line',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'single',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
    default: 'md',
  },
  {
    label: 'Full width',
    name: 'fullWidth',
    type: 'boolean',
    placeholder: 'Share the width equally',
    default: false,
  },
  {
    label: 'Disabled',
    name: 'disabled',
    type: 'boolean',
    placeholder: 'Disable every tab',
    default: false,
  },
]
</script>
