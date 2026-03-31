import { ref } from 'vue'

const shape = ref<'square' | 'rounded'>(
  (localStorage.getItem('shape') as 'square' | 'rounded') || 'rounded',
)

export function useShape() {
  function toggle() {
    shape.value = shape.value === 'rounded' ? 'square' : 'rounded'
    localStorage.setItem('shape', shape.value)
  }
  return { shape, toggle }
}
