<script setup lang="ts">
import { ref, onMounted } from 'vue'

const selectedImage = ref<File | null>(null)

const availableProps = [
  {
    label: 'Crop as Circle',
    name: 'cropAsCircle',
    type: 'boolean',
    placeholder: 'Display crop area as a circle overlay',
    default: false,
  },
  {
    label: 'Output as Circle',
    name: 'outputAsCircle',
    type: 'boolean',
    placeholder: 'Output cropped image as a circle with transparent corners',
    default: false,
  },
  {
    label: 'Lock Aspect Ratio',
    name: 'lockAspectRatio',
    type: 'boolean',
    placeholder: 'Lock the aspect ratio during resizing',
    default: false,
  },
  {
    label: 'Show Preview',
    name: 'showPreview',
    type: 'boolean',
    placeholder: 'Display live preview of cropped image',
    default: false,
  },
]

const handleCrop = (croppedData: { blob: Blob; geometry: { x: number; y: number; width: number; height: number } }) => {
  const { blob, geometry } = croppedData
  const formData = new FormData()
  formData.append('file', blob, 'cropped-image.png')
  formData.append('geometry', JSON.stringify(geometry))
}

const loadDefaultImage = async () => {
  try {
    const response = await fetch('/media/sample.webp', { mode: 'cors' })
    if (!response.ok) return
    const blob = await response.blob()
    selectedImage.value = new File([blob], 'sample-image.jpg', { type: blob.type })
  } catch {
    // silently ignore — user can load their own image
  }
}

onMounted(() => {
  loadDefaultImage()
})
</script>
