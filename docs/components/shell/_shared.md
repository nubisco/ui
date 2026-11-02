<script setup lang="ts">
import { ref } from 'vue'

const showNotification = ref(true)
const inspectorOpen = ref(false)
const inspectorExpanded = ref(false)
const inspectorWidth = ref<number | null>(null)
const panelSize = ref('default')
const kitchenInspector = ref(true)
const kitchenPanelSize = ref('default')
const detachedInspector = ref(true)
const detachedPanelSize = ref('default')
</script>
