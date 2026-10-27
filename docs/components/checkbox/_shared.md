<script setup lang="ts">
import { computed, ref } from 'vue'

const checked = ref(false)

const consent = ref(false)
const consentError = computed(() =>
  consent.value ? undefined : 'You must accept the terms',
)

const interests = ref({
  web: true,
  mobile: false,
  design: false,
  backend: false,
})

const channels = ref({
  email: true,
  sms: false,
  push: false,
})

const availableProps = [
  {
    label: 'Label',
    name: 'label',
    type: 'string',
    default: 'Accept terms',
    placeholder: 'Label text',
  },
]
</script>
