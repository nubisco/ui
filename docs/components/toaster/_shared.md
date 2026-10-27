<script setup lang="ts">
import NbToasterDemo from '../../../src/components/Toaster.vue'
import { createToastQueue } from '../../../src/composables/useToast.composable'

const demoQueue = createToastQueue({ max: 3 })

async function demoSave() {
  const saving = demoQueue.push({
    key: 'docs-save',
    message: 'Saving changes...',
    duration: 0,
  })
  await new Promise((resolve) => setTimeout(resolve, 1200))
  saving.update({ variant: 'success', message: 'Changes saved' })
}
</script>

<style scoped>
/* A transformed, relatively positioned frame: the toaster is position: fixed,
   and a transform on an ancestor is what makes fixed positioning resolve
   against that ancestor rather than the viewport. Demos and visual tests are
   the reason the `to` prop exists. */
.toaster-demo-frame {
  position: relative;
  transform: translateZ(0);
  min-height: 220px;
  border: 1px dashed var(--nb-c-border);
  border-radius: var(--nb-radius-md);
}
</style>
