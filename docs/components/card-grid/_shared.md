<script setup lang="ts">
import { withBase } from 'vitepress'

const apps = [
  { title: 'Notes', text: 'Write things down and find them again.', icon: 'note-pencil', color: '#f6c453' },
  { title: 'Calendar', text: 'Meetings, deadlines and time off.', icon: 'calendar-blank', color: '#5b8def' },
  { title: 'Files', text: 'Everything the team has shared.', icon: 'folder', color: '#81b29a' },
  { title: 'Reports', text: 'Numbers for the week, ready to send.', icon: 'chart-bar', color: '#e07a5f' },
]
</script>

<style scoped>
.demo-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: #1b1b1b;
}
</style>
