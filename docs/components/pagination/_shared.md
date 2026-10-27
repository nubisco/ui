<script setup lang="ts">
import { ref } from 'vue'

const page = ref(1)
const pageSize = ref(10)
function onPageSize(size) {
  pageSize.value = size
  page.value = 1
}

const page2 = ref(1)
const pageSize2 = ref(5)
</script>
