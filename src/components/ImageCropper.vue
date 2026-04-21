<template>
  <div class="nb-image-cropper">
    <div
      class="canvas-container"
      @mousedown="onCanvasMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchstart="onCanvasMouseDown"
      @touchmove="onMouseMove"
      @touchend="onMouseUp"
    >
      <canvas ref="canvas"></canvas>
      <div
        v-for="handle in handles"
        :key="handle.name"
        :class="['resize-handle', handle.name]"
        :style="handlePositions[handle.name]"
        @mousedown.stop="startResize($event, handle.name)"
        @touchstart.stop="startResize($event, handle.name)"
      ></div>
    </div>
    <NbGrid
      v-if="showPreview && croppedImageUrl && cropGeometry"
      class="cropped-image-preview"
    >
      <NbGrid is="ul" dir="col" justify="center" gap="sm">
        <li>
          <strong>{{ t('common.X') }}</strong> {{ cropGeometry.x.toFixed(0) }}
        </li>
        <li>
          <strong>{{ t('common.Y') }}</strong> {{ cropGeometry.y.toFixed(0) }}
        </li>
        <li>
          <strong>{{ t('common.WIDTH') }}</strong>
          {{ cropGeometry.width.toFixed(0) }}
        </li>
        <li>
          <strong>{{ t('common.HEIGHT') }}</strong>
          {{ cropGeometry.height.toFixed(0) }}
        </li>
      </NbGrid>
      <img :src="croppedImageUrl" :alt="t('common.IMAGE_THUMBNAIL')" />
    </NbGrid>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { ICropRect, EHandleName, IImageCropperProps } from './ImageCropper.d'

const { t } = useI18n({})

const props = withDefaults(defineProps<IImageCropperProps>(), {
  cropAsCircle: false,
  outputAsCircle: false,
  lockAspectRatio: false,
  showPreview: false,
})

const emit = defineEmits<{
  crop: [payload: { blob: Blob; geometry: ICropRect }]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
const img = new Image()
let sourceImageUrl: string | null = null

const DISPLAY_WIDTH = 700
const DISPLAY_HEIGHT = 400
let scale = { x: 1, y: 1 }

const cropRect = ref<ICropRect>({ x: 50, y: 50, width: 200, height: 200 })
const croppedImageUrl = ref<string | null>(null)
const cropGeometry = ref<ICropRect | null>(null)

let isDragging = false
let isDraggingCrop = false
let dragStart = { x: 0, y: 0 }

let isResizing = false
let resizeStart = { x: 0, y: 0 }
let initialCropRect = { x: 0, y: 0, width: 0, height: 0 }
let currentHandle: EHandleName | null = null
let isShiftPressed = false

const handles: Array<{ name: EHandleName }> = [
  { name: EHandleName.TopLeft },
  { name: EHandleName.Top },
  { name: EHandleName.TopRight },
  { name: EHandleName.Right },
  { name: EHandleName.BottomRight },
  { name: EHandleName.Bottom },
  { name: EHandleName.BottomLeft },
  { name: EHandleName.Left },
]

const loadImage = () => {
  if (!props.image) {
    console.error('No image file provided')
    return
  }

  if (sourceImageUrl) {
    URL.revokeObjectURL(sourceImageUrl)
    sourceImageUrl = null
  }

  img.onload = () => {
    const { drawWidth, drawHeight } = calculateScale()

    if (canvas.value) {
      // Set canvas size to match the rendered image dimensions.
      canvas.value.width = drawWidth
      canvas.value.height = drawHeight

      const offsetX = (canvas.value.width - img.width * scale.x) / 2
      const offsetY = (canvas.value.height - img.height * scale.y) / 2

      // if cropping as a circle or locking the aspect ratio, use a square crop.
      if (props.cropAsCircle || props.lockAspectRatio) {
        const minDimension = Math.min(img.width * scale.x, img.height * scale.y)
        const initialCropSize = minDimension * 0.5
        cropRect.value = {
          x: offsetX + (img.width * scale.x - initialCropSize) / 2,
          y: offsetY + (img.height * scale.y - initialCropSize) / 2,
          width: initialCropSize,
          height: initialCropSize,
        }
      } else {
        // otherwise, set initial crop to 50% of the image dimensions.
        cropRect.value = {
          x: offsetX + (img.width * scale.x * 0.5 - img.width * scale.x * 0.25),
          y:
            offsetY +
            (img.height * scale.y * 0.5 - img.height * scale.y * 0.25),
          width: img.width * scale.x * 0.5,
          height: img.height * scale.y * 0.5,
        }
      }

      drawImage()
      cropImage()
    }
  }
  img.onerror = () => {
    console.error('Failed to load image')
  }
  sourceImageUrl = URL.createObjectURL(props.image)
  img.src = sourceImageUrl
}

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    if (ctx) {
      // enable antialiasing for smoother drawing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
    }
    if (props.image) {
      loadImage()
    }
  }
})

onBeforeUnmount(() => {
  if (sourceImageUrl) {
    URL.revokeObjectURL(sourceImageUrl)
    sourceImageUrl = null
  }
  const currentPreviewUrl = croppedImageUrl.value
  if (currentPreviewUrl) {
    URL.revokeObjectURL(currentPreviewUrl)
    croppedImageUrl.value = null
  }
})

watch(
  () => props.image,
  (newImage) => {
    if (newImage) {
      loadImage()
    }
  },
)

// watch for prop changes that affect the crop area
watch(
  () => [props.cropAsCircle, props.outputAsCircle, props.lockAspectRatio],
  () => {
    if (canvas.value && ctx) {
      // redraw the canvas to reflect prop changes
      drawImage()
    }
  },
)

const calculateScale = () => {
  const aspectRatio = img.width / img.height
  let drawWidth = DISPLAY_WIDTH
  let drawHeight = DISPLAY_HEIGHT

  if (aspectRatio > DISPLAY_WIDTH / DISPLAY_HEIGHT) {
    drawHeight = DISPLAY_WIDTH / aspectRatio
  } else {
    drawWidth = DISPLAY_HEIGHT * aspectRatio
  }

  scale.x = drawWidth / img.width
  scale.y = drawHeight / img.height
  return { drawWidth, drawHeight }
}

const drawImage = () => {
  if (ctx && canvas.value) {
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
    // center the image on the canvas
    const offsetX = (canvas.value.width - img.width * scale.x) / 2
    const offsetY = (canvas.value.height - img.height * scale.y) / 2
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      offsetX,
      offsetY,
      img.width * scale.x,
      img.height * scale.y,
    )
    drawOverlay()
  }
}

const drawOverlay = () => {
  if (ctx && canvas.value) {
    ctx.save()

    // draw the dimming overlay
    ctx.beginPath()
    if (props.cropAsCircle) {
      ctx.arc(
        cropRect.value.x + cropRect.value.width / 2,
        cropRect.value.y + cropRect.value.height / 2,
        cropRect.value.width / 2,
        0,
        Math.PI * 2,
      )
    } else {
      ctx.rect(
        cropRect.value.x,
        cropRect.value.y,
        cropRect.value.width,
        cropRect.value.height,
      )
    }
    ctx.rect(0, 0, canvas.value.width, canvas.value.height)
    ctx.clip('evenodd')
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)

    // draw the crop area outline
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    // disable antialiasing for crisp outlines
    ctx.imageSmoothingEnabled = false

    if (props.cropAsCircle) {
      ctx.beginPath()
      ctx.arc(
        cropRect.value.x + cropRect.value.width / 2,
        cropRect.value.y + cropRect.value.height / 2,
        cropRect.value.width / 2,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    } else {
      ctx.strokeRect(
        cropRect.value.x,
        cropRect.value.y,
        cropRect.value.width,
        cropRect.value.height,
      )
    }

    ctx.restore()
  }
}

// compute handle positions based on crop area shape
const handlePositions = computed<
  Record<EHandleName, { left: string; top: string }>
>(() => {
  if (props.cropAsCircle) {
    // for circle, position handles at the circle's boundary points
    const centerX = cropRect.value.x + cropRect.value.width / 2
    const centerY = cropRect.value.y + cropRect.value.height / 2
    const radius = cropRect.value.width / 2

    return {
      'top-left': {
        left: `${centerX - radius - 5}px`,
        top: `${centerY - radius - 5}px`,
      },
      top: { left: `${centerX - 5}px`, top: `${centerY - radius - 5}px` },
      'top-right': {
        left: `${centerX + radius - 5}px`,
        top: `${centerY - radius - 5}px`,
      },
      right: { left: `${centerX + radius - 5}px`, top: `${centerY - 5}px` },
      'bottom-right': {
        left: `${centerX + radius - 5}px`,
        top: `${centerY + radius - 5}px`,
      },
      bottom: { left: `${centerX - 5}px`, top: `${centerY + radius - 5}px` },
      'bottom-left': {
        left: `${centerX - radius - 5}px`,
        top: `${centerY + radius - 5}px`,
      },
      left: { left: `${centerX - radius - 5}px`, top: `${centerY - 5}px` },
    }
  } else {
    // for rectangle, position handles at corners and edges
    return {
      'top-left': {
        left: `${cropRect.value.x - 5}px`,
        top: `${cropRect.value.y - 5}px`,
      },
      top: {
        left: `${cropRect.value.x + cropRect.value.width / 2 - 5}px`,
        top: `${cropRect.value.y - 5}px`,
      },
      'top-right': {
        left: `${cropRect.value.x + cropRect.value.width - 5}px`,
        top: `${cropRect.value.y - 5}px`,
      },
      right: {
        left: `${cropRect.value.x + cropRect.value.width - 5}px`,
        top: `${cropRect.value.y + cropRect.value.height / 2 - 5}px`,
      },
      'bottom-right': {
        left: `${cropRect.value.x + cropRect.value.width - 5}px`,
        top: `${cropRect.value.y + cropRect.value.height - 5}px`,
      },
      bottom: {
        left: `${cropRect.value.x + cropRect.value.width / 2 - 5}px`,
        top: `${cropRect.value.y + cropRect.value.height - 5}px`,
      },
      'bottom-left': {
        left: `${cropRect.value.x - 5}px`,
        top: `${cropRect.value.y + cropRect.value.height - 5}px`,
      },
      left: {
        left: `${cropRect.value.x - 5}px`,
        top: `${cropRect.value.y + cropRect.value.height / 2 - 5}px`,
      },
    }
  }
})

const getClientCoordinates = (event: MouseEvent | TouchEvent) => {
  if ('touches' in event && event.touches.length > 0) {
    const touch = event.touches[0]
    return { clientX: touch.clientX, clientY: touch.clientY }
  } else if ('clientX' in event && 'clientY' in event) {
    return { clientX: event.clientX, clientY: event.clientY }
  }
  return { clientX: 0, clientY: 0 }
}

const getCanvasPoint = (event: MouseEvent | TouchEvent) => {
  const canvasEl = canvas.value
  if (!canvasEl) return null
  const { clientX, clientY } = getClientCoordinates(event)
  const { left, top } = canvasEl.getBoundingClientRect()
  return { x: clientX - left, y: clientY - top }
}

const onCanvasMouseDown = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  const point = getCanvasPoint(event)
  if (!point) return
  const { x, y } = point
  if (isInCropArea(x, y)) {
    isDraggingCrop = true
    isDragging = true
    dragStart = { x: x - cropRect.value.x, y: y - cropRect.value.y }
  }
}

const onMouseMove = (event: MouseEvent | TouchEvent) => {
  if (isDraggingCrop) {
    onDrag(event)
  } else if (isResizing) {
    onResize(event)
  }
}

const onMouseUp = () => {
  if (isDraggingCrop) {
    endDrag()
    isDraggingCrop = false
    cropImage()
  }
  if (isResizing) {
    endResize()
    cropImage()
  }
  // reset drag state to ensure clean state
  isDragging = false
  isDraggingCrop = false
}

const onDrag = (event: MouseEvent | TouchEvent) => {
  if (isDragging) {
    const point = getCanvasPoint(event)
    if (!point) return
    const { x, y } = point

    // use Math.floor to avoid off-by-one issues when dragging to top/left edges.
    cropRect.value.x = Math.floor(x - dragStart.x)
    cropRect.value.y = Math.floor(y - dragStart.y)
    // don't constrain during drag, let it move freely
    drawImage()
  }
}

const endDrag = () => {
  if (isDragging) {
    // apply constraints only when dragging ends
    constrainCropRect()
    drawImage()
    isDragging = false
  }
}

const startResize = (
  event: MouseEvent | TouchEvent,
  handleName: EHandleName,
) => {
  event.preventDefault()
  const point = getCanvasPoint(event)
  if (!point) return
  isResizing = true
  currentHandle = handleName
  resizeStart = { x: point.x, y: point.y }
  initialCropRect = { ...cropRect.value }
  isShiftPressed = event instanceof MouseEvent && event.shiftKey
}

const onResize = (event: MouseEvent | TouchEvent) => {
  if (!isResizing) return

  // in lockAspectRatio mode, perform a symmetric resize (keeping center fixed)
  if (props.lockAspectRatio && canvas.value) {
    const point = getCanvasPoint(event)
    if (!point) return
    const { x, y } = point
    const centerX = initialCropRect.x + initialCropRect.width / 2
    const centerY = initialCropRect.y + initialCropRect.height / 2

    if (props.cropAsCircle) {
      // for circle mode with locked aspect ratio, enforce square
      const halfSize = Math.max(Math.abs(x - centerX), Math.abs(y - centerY))
      const newSize = halfSize * 2
      cropRect.value = {
        x: centerX - halfSize,
        y: centerY - halfSize,
        width: newSize,
        height: newSize,
      }
    } else {
      // for rectangle mode with locked aspect ratio, maintain original aspect ratio
      const aspectRatio = initialCropRect.width / initialCropRect.height
      const dx = Math.abs(x - centerX)
      const newWidth = Math.max(dx * 2, 50)
      const newHeight = newWidth / aspectRatio
      cropRect.value = {
        x: centerX - newWidth / 2,
        y: centerY - newHeight / 2,
        width: newWidth,
        height: newHeight,
      }
    }
    // don't constrain during resize, let it grow beyond bounds
    drawImage()
    return
  }

  // non-locked (free) resizing
  const point = getCanvasPoint(event)
  if (!point) return
  const { x, y } = point
  const dx = x - resizeStart.x
  const dy = y - resizeStart.y

  isShiftPressed = event instanceof MouseEvent && event.shiftKey

  const newCropRect = { ...initialCropRect }

  switch (currentHandle) {
    case 'top-left':
      newCropRect.x += dx
      newCropRect.y += dy
      newCropRect.width -= dx
      newCropRect.height -= dy
      break
    case 'top':
      newCropRect.y += dy
      newCropRect.height -= dy
      break
    case 'top-right':
      newCropRect.y += dy
      newCropRect.width += dx
      newCropRect.height -= dy
      break
    case 'right':
      newCropRect.width += dx
      break
    case 'bottom-right':
      newCropRect.width += dx
      newCropRect.height += dy
      break
    case 'bottom':
      newCropRect.height += dy
      break
    case 'bottom-left':
      newCropRect.x += dx
      newCropRect.width -= dx
      newCropRect.height += dy
      break
    case 'left':
      newCropRect.x += dx
      newCropRect.width -= dx
      break
  }

  // prevent negative dimensions
  if (newCropRect.width < 50) newCropRect.width = 50
  if (newCropRect.height < 50) newCropRect.height = 50

  if (isShiftPressed && currentHandle) {
    const aspectRatio = initialCropRect.width / initialCropRect.height
    if (['left', 'right'].includes(currentHandle)) {
      newCropRect.height = newCropRect.width / aspectRatio
      if (currentHandle === 'left') {
        newCropRect.y =
          initialCropRect.y - (newCropRect.height - initialCropRect.height) / 2
      }
    } else if (['top', 'bottom'].includes(currentHandle)) {
      newCropRect.width = newCropRect.height * aspectRatio
      if (currentHandle === 'top') {
        newCropRect.x =
          initialCropRect.x - (newCropRect.width - initialCropRect.width) / 2
      }
    }
  }

  cropRect.value = newCropRect
  // don't constrain during resize, let it grow beyond bounds
  drawImage()
}

const endResize = () => {
  if (isResizing) {
    // apply constraints only when resizing ends
    constrainCropRect()
    drawImage()
    isResizing = false
    currentHandle = null
  }
}

const isInCropArea = (x: number, y: number) => {
  if (props.cropAsCircle) {
    const centerX = cropRect.value.x + cropRect.value.width / 2
    const centerY = cropRect.value.y + cropRect.value.height / 2
    const radius = cropRect.value.width / 2
    const dx = x - centerX
    const dy = y - centerY
    return dx * dx + dy * dy <= radius * radius
  } else {
    // add a small tolerance for better drag detection
    const tolerance = 2
    return (
      x >= cropRect.value.x - tolerance &&
      x <= cropRect.value.x + cropRect.value.width + tolerance &&
      y >= cropRect.value.y - tolerance &&
      y <= cropRect.value.y + cropRect.value.height + tolerance
    )
  }
}

const constrainCropRect = () => {
  const maxX = canvas.value!.width
  const maxY = canvas.value!.height

  // ensure minimum size
  if (cropRect.value.width < 50) cropRect.value.width = 50
  if (cropRect.value.height < 50) cropRect.value.height = 50

  // if lockAspectRatio is true, enforce aspect ratio constraints
  if (props.lockAspectRatio) {
    if (props.cropAsCircle) {
      // for circle mode with locked aspect ratio, enforce square
      cropRect.value.height = cropRect.value.width
    } else {
      // for rectangle mode with locked aspect ratio, maintain original aspect ratio
      const aspectRatio = initialCropRect.width / initialCropRect.height
      cropRect.value.height = cropRect.value.width / aspectRatio
    }
  } else if (isShiftPressed) {
    // when shift is pressed, maintain aspect ratio temporarily
    const aspectRatio = initialCropRect.width / initialCropRect.height
    cropRect.value.height = cropRect.value.width / aspectRatio
  }

  // for circle or locked aspect ratio, maintain the aspect ratio when constraining
  if (props.cropAsCircle || props.lockAspectRatio) {
    const aspectRatio = cropRect.value.width / cropRect.value.height

    // if the crop area is too large, scale it down while maintaining aspect ratio
    if (cropRect.value.width > maxX || cropRect.value.height > maxY) {
      if (cropRect.value.width > cropRect.value.height) {
        cropRect.value.width = maxX
        cropRect.value.height = maxX / aspectRatio
      } else {
        cropRect.value.height = maxY
        cropRect.value.width = maxY * aspectRatio
      }
    }

    // ensure it stays within bounds, only move if it's actually outside
    if (cropRect.value.x < 0) cropRect.value.x = 0
    if (cropRect.value.y < 0) cropRect.value.y = 0
    if (cropRect.value.x + cropRect.value.width > maxX) {
      cropRect.value.x = maxX - cropRect.value.width
    }
    if (cropRect.value.y + cropRect.value.height > maxY) {
      cropRect.value.y = maxY - cropRect.value.height
    }
  } else {
    // for free resize, use the original logic
    // constrain position to keep crop area within canvas bounds
    if (cropRect.value.x < 0) cropRect.value.x = 0
    if (cropRect.value.y < 0) cropRect.value.y = 0

    // if crop area is larger than canvas, center it
    if (cropRect.value.width > maxX) {
      cropRect.value.width = maxX
      cropRect.value.x = 0
    }
    if (cropRect.value.height > maxY) {
      cropRect.value.height = maxY
      cropRect.value.y = 0
    }

    // ensure crop area doesn't extend beyond canvas bounds
    if (cropRect.value.x + cropRect.value.width > maxX) {
      cropRect.value.x = maxX - cropRect.value.width
    }
    if (cropRect.value.y + cropRect.value.height > maxY) {
      cropRect.value.y = maxY - cropRect.value.height
    }
  }
}

const cropImage = () => {
  if (canvas.value && ctx) {
    const offsetX = (canvas.value.width - img.width * scale.x) / 2
    const offsetY = (canvas.value.height - img.height * scale.y) / 2

    const sx = (cropRect.value.x - offsetX) / scale.x
    const sy = (cropRect.value.y - offsetY) / scale.y
    const sWidth = cropRect.value.width / scale.x
    const sHeight = cropRect.value.height / scale.y

    const geometry = {
      x: Math.round(sx),
      y: Math.round(sy),
      width: Math.round(sWidth),
      height: Math.round(sHeight),
    }

    // clamp the crop area to the actual image bounds
    const clampedSX = Math.max(0, Math.min(geometry.x, img.width))
    const clampedSY = Math.max(0, Math.min(geometry.y, img.height))
    const clampedSWidth = Math.min(geometry.width, img.width - clampedSX)
    const clampedSHeight = Math.min(geometry.height, img.height - clampedSY)

    const croppedCanvas = document.createElement('canvas')
    croppedCanvas.width = clampedSWidth
    croppedCanvas.height = clampedSHeight
    const croppedCtx = croppedCanvas.getContext('2d')
    if (croppedCtx) {
      croppedCtx.drawImage(
        img,
        clampedSX,
        clampedSY,
        clampedSWidth,
        clampedSHeight,
        0,
        0,
        clampedSWidth,
        clampedSHeight,
      )

      if (props.cropAsCircle && props.outputAsCircle) {
        croppedCtx.globalCompositeOperation = 'destination-in'
        croppedCtx.beginPath()
        croppedCtx.arc(
          clampedSWidth / 2,
          clampedSHeight / 2,
          clampedSWidth / 2,
          0,
          Math.PI * 2,
        )
        croppedCtx.closePath()
        croppedCtx.fill()
        croppedCtx.globalCompositeOperation = 'source-over'
      }

      // expose the cropped image via the `crop` event
      croppedCanvas.toBlob(
        (blob) => {
          if (blob) {
            const oldPreviewUrl = croppedImageUrl.value
            if (oldPreviewUrl) {
              URL.revokeObjectURL(oldPreviewUrl)
            }
            croppedImageUrl.value = URL.createObjectURL(blob)
            cropGeometry.value = geometry
            emit('crop', { blob, geometry })
          }
        },
        'image/jpeg',
        0.8,
      )
    }
  }
}

watch(
  () => props,
  () => {
    cropImage()
  },
  { deep: true },
)
</script>

<style lang="scss" scoped>
$handle-size: 10px;
$handle-offset: -7px;
$border-color: var(--nb-c-border);
$background-color: var(--nb-c-surface);

.nb-image-cropper {
  position: relative;
  user-select: none;
  display: inline-block;
  max-width: 100%;
  height: auto;
  overflow: hidden;

  .canvas-container {
    position: relative;
    display: inline-block;
    width: 100%;
    height: auto;

    canvas {
      display: block;
      max-width: 100%;
      height: auto;
    }
  }

  .resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background: var(--nb-c-surface);
    border: 1px solid var(--nb-c-border);
    z-index: 1;

    &.top-left {
      cursor: nwse-resize;
    }

    &.top {
      cursor: ns-resize;
    }

    &.top-right {
      cursor: nesw-resize;
    }

    &.right {
      cursor: ew-resize;
    }

    &.bottom-right {
      cursor: nwse-resize;
    }

    &.bottom {
      cursor: ns-resize;
    }

    &.bottom-left {
      cursor: nesw-resize;
    }

    &.left {
      cursor: ew-resize;
    }
  }

  .cropped-image-preview {
    position: absolute;
    right: calc(var(--nb-base-unit, 8px) * 2);
    bottom: calc(var(--nb-base-unit, 8px) * 2);
    border-radius: var(--nb-border-radius-sm, 6px);
    overflow: hidden;
    height: calc(var(--nb-base-unit, 8px) * 14);
    margin-top: 20px;
    border: dotted 1px var(--nb-c-border);
    background: var(--nb-c-surface);
    user-select: none;
    pointer-events: none;
    ul {
      min-width: calc(var(--nb-base-unit, 8px) * 9);
      background: var(--nb-c-contrast);
      color: var(--nb-c-surface);
      font-size: var(--nb-font-size-10, 10px);
      padding: calc(var(--nb-base-unit, 8px) / 2);
      line-height: var(--nb-font-size-14, 14px);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
    }
  }
}
</style>
