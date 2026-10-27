<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { catalog as flagCatalog } from '@nubisco/ui/flags/catalog'
import type { PreviewPropDef } from '../../.vitepress/components/Preview.d'
import { getCountryByCode } from '../../mocks/countries-mocks'

const { t } = useI18n({})

const isDialogOpen = ref(false)

const flagList = Object.keys(flagCatalog)

const availableProps: PreviewPropDef[] = [
  {
    label: 'Search',
    name: 'search',
    type: 'string',
    default: '',
    placeholder: 'Search by code',
  },
  {
    label: 'Size',
    name: 'size',
    type: 'slider',
    default: 32,
    placeholder: 'Flag size',
    min: 16,
    max: 128,
  },
]

const searchString = ref('')
const flagSize = ref(32)

const usableFlags = computed(() => {
  return flagList.map((flag) => {
    const countryData = getCountryByCode(flag)
    return {
      file: flag,
      ...(countryData && { name: t(`core.COUNTRY_NAMES.${countryData?.i18n_key}`) }),
    }
  })
})

const selectedSize = computed(() => {
  return Number(flagSize.value)
})
</script>

<style lang="scss" scoped>
.flag-demo {
  display: grid;
  list-style-type: none;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  padding: 0;
  margin: 0;
  margin: calc(var(--nb-base-unit) * 2) 0 0 0;
  background-color: var(--vp-c-divider);

  li {
    display: flex;
    flex-direction: column;
    align-items: flex-start; // Left-align content
    height: 120px;
    background: var(--vp-code-block-bg);
    border-radius: 0;
    padding: calc(var(--nb-base-unit) * 1.5);
    margin: 0;
    box-sizing: border-box;
    .box {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      flex-grow: 1;
      margin: 0;
      padding: 0;
    }

    span {
      font-size: 12px;
      word-break: break-word;
      width: 100%;
      text-align: left;
      margin: 0;
      padding: 0;
    }
  }
}
</style>
