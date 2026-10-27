<script setup lang="ts">
import { ref } from 'vue'
import { useWalkthrough, createMemoryWalkthroughStorage } from '../../../src'

const demoEvent = ref('none')

// A memory adapter so the demo replays on every page load instead of
// remembering that you have already seen it.
const demoTour = useWalkthrough(
  {
    id: 'docs-demo',
    version: 1,
    steps: [
      {
        title: 'A guided tour',
        body: 'Steps without a target are centred, which suits an intro like this one.',
      },
      {
        target: 'demo-nav',
        title: 'Navigation',
        body: 'The spotlight cuts a hole in the scrim around the current target.',
        placement: 'right',
      },
      {
        target: 'demo-content',
        title: 'Content',
        body: 'The popover flips and clamps itself to stay inside the viewport.',
        placement: 'bottom',
      },
      {
        target: 'demo-actions',
        title: 'Actions',
        body: 'Press Done to finish, or Escape at any point to skip.',
        placement: 'left',
      },
      {
        target: 'demo-start',
        title: 'Replay',
        body: 'restart() clears the stored record and runs the tour again.',
        placement: 'bottom',
      },
    ],
  },
  { storage: createMemoryWalkthroughStorage() },
)
</script>
