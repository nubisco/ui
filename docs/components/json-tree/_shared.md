<script setup lang="ts">
import { ref } from 'vue'

const sample = ref({
  name: 'Ada Lovelace',
  active: true,
  score: 99,
  tags: ['math', 'engineering'],
  meta: null,
})

const editableSample = ref({
  username: 'ada',
  email: 'ada@example.com',
  verified: false,
  age: 36,
})

const nestedSample = ref({
  status: 'ok',
  data: {
    users: [
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' },
    ],
    pagination: { page: 1, total: 2 },
  },
})

const readOnlySample = ref({
  theme: 'dark',
  locale: 'en-US',
  features: {
    beta: true,
    experimental: false,
  },
  limits: [10, 100, 1000],
})
</script>
