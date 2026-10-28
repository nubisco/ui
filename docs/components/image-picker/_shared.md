<script setup lang="ts">
import { ref } from 'vue'

// An inline SVG mark, so the demo needs no file.
const mark =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="#6d4fc2"/><circle cx="60" cy="60" r="26" fill="none" stroke="#fff" stroke-width="10"/></svg>',
  )

const logo = ref<string>(mark)
const empty = ref<string>('')
const rejected = ref('')

function read(file: File, then: (url: string) => void) {
  rejected.value = ''
  const reader = new FileReader()
  reader.onload = () => then(String(reader.result))
  reader.readAsDataURL(file)
}

const pickLogo = (file: File) => read(file, (url) => (logo.value = url))
const pickEmpty = (file: File) => read(file, (url) => (empty.value = url))

function onReject({ file, reason }: { file: File; reason: string }) {
  rejected.value =
    reason === 'size'
      ? `${file.name} is too large. The limit is 200 KB.`
      : `${file.name} is not an image.`
}
</script>
