<template>
  <div :class="classes">
    <div :class="togglerClasses" @click="toggleCollapse" />
    <div class="content" :class="{ editable: editable, editor: inputActive }">
      <div class="title" :class="{ editor: inputActive }">
        {{ title }}
        <span v-if="isNode(localModel)" class="type">
          {{
            isArray(localModel)
              ? `[ ${localModel.length} items ]`
              : `{ ${localModel && typeof localModel === 'object' ? Object.keys(localModel).length : 0} properties }`
          }}
        </span>
      </div>
      <div v-if="!isNode(localModel)" class="data">
        <span
          v-if="!isBoolean(localModel)"
          v-show="!inputActive"
          :class="{ value: true, 'value--null': isNull(localModel) }"
          @dblclick="() => (inputActive = editable)"
        >
          {{ isNull(localModel) ? nullString : localModel }}
        </span>
        <input
          v-if="!isBoolean(localModel) && inputActive"
          v-model="localModel"
          @keyup.enter="() => (inputActive = false)"
          @blur="() => (inputActive = false)"
        />
        <span
          v-if="isBoolean(localModel)"
          class="boolean"
          @click="() => (localModel = !localModel)"
          >{{ !localModel ? i18n.strFalse : i18n.strTrue }}</span
        >
        <div class="controls" />
      </div>
      <div v-if="localModel && isNode(localModel)">
        <NbJsonTree
          v-for="(_, indexKey) in localModel"
          :key="indexKey"
          v-model="asIndexable(localModel)[indexKey]"
          :title="`${indexKey}`"
          :class="{ colapsed: colapsed }"
          :loaded="true"
          :root="false"
          :editable="editable"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { IJsonTreeProps, TJsonValue } from './JsonTree.d'

const nullString = 'null'

const props = withDefaults(defineProps<IJsonTreeProps>(), {
  title: null,
  modelValue: null,
  root: true,
  editable: false,
  startCollapsed: false,
})

const emit = defineEmits(['update:modelValue'])

const localModel = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    if (props.editable) {
      emit('update:modelValue', value)
    }
  },
})

// internal state
const colapsed = ref(props.startCollapsed)
const inputActive = ref(false)
const i18n = ref({
  strBoolean: 'boolean',
  strString: 'string',
  strNumber: 'number',
  strObject: 'object',
  strArray: 'array',
  strNull: 'null',
  strFalse: 'false',
  strTrue: 'true',
})

// computed
const classes = computed(() => {
  return {
    'nb-json-tree': true,
    node: isNode(localModel.value),
    leaf: !isNode(localModel.value),
    root: props.root,
  }
})

const togglerClasses = computed(() => {
  return {
    toggler: true,
    node: isNode(localModel.value),
    colapse: !colapsed.value,
    expand: colapsed.value,
  }
})

// methods
const toggleCollapse = () => (colapsed.value = !colapsed.value)
const isNode = (value: TJsonValue) =>
  value instanceof Object || Array.isArray(value)
const isArray = (value: TJsonValue) => Array.isArray(value)
const isNull = (value: TJsonValue) => value === null
const isBoolean = (value: TJsonValue): value is boolean =>
  typeof value === 'boolean'
const asIndexable = (v: TJsonValue): Record<string | number, TJsonValue> =>
  (v as Record<string | number, TJsonValue>) ?? {}
</script>

<style lang="scss">
:root {
  --nb-json-tree-sprite: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMTMyIDExMiIgd2lkdGg9IjEzMnB4IiBoZWlnaHQ9IjExMnB4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxnPgogICAgPHRpdGxlPm1pbnVzPC90aXRsZT4KICAgIDxyZWN0IHN0eWxlPSJzdHJva2U6IHJnYig2MCwgNjAsIDYwKTsgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyBzdHJva2UtbGluZWpvaW46IHJvdW5kIiB4PSI0IiB5PSI5IiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHJ4PSIxIiByeT0iMSIvPgogICAgPGxpbmUgc3R5bGU9InN0cm9rZS13aWR0aDogMnB4OyBzdHJva2UtbGluZWNhcDogcm91bmQ7IHN0cm9rZTogcmdiKDE1NiwgMTU2LCAxNTYpOyIgeDE9IjgiIHkxPSIxNSIgeDI9IjEyIiB5Mj0iMTUiPgogICAgICA8dGl0bGU+bWludXM8L3RpdGxlPgogICAgPC9saW5lPgogIDwvZz4KICA8Zz4KICAgIDx0aXRsZT5wbHVzPC90aXRsZT4KICAgIDxyZWN0IHN0eWxlPSJmaWxsOiAjM0QzRDNEOyBzdHJva2U6ICMzRDNEM0Q7IHN0cm9rZS1saW5lY2FwOiByb3VuZDsgc3Ryb2tlLWxpbmVqb2luOiByb3VuZCIgeD0iMzciIHk9IjkiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgcng9IjEiIHJ5PSIxIi8+CiAgICA8Zz4KICAgICAgPHRpdGxlPnBsdXM8L3RpdGxlPgogICAgICA8bGluZSBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAycHg7IHN0cm9rZS1saW5lY2FwOiByb3VuZDsgZmlsbDogIzNEM0QzRDsgc3Ryb2tlOiAjRUJFQkVCOyIgeDE9IjQwIiB5MT0iMTUiIHgyPSI0NiIgeTI9IjE1Ij4KICAgICAgICA8dGl0bGU+bWludXM8L3RpdGxlPgogICAgICA8L2xpbmU+CiAgICAgIDxsaW5lIHN0eWxlPSJzdHJva2Utd2lkdGg6IDJweDsgc3Ryb2tlLWxpbmVjYXA6IHJvdW5kOyBmaWxsOiAjM0QzRDNEOyBzdHJva2U6ICNFQkVCRUI7IiB4MT0iNDMiIHkxPSIxMiIgeDI9IjQzIiB5Mj0iMTgiPgogICAgICAgIDx0aXRsZT5taW51czwvdGl0bGU+CiAgICAgIDwvbGluZT4KICAgIDwvZz4KICA8L2c+CiAgPGxpbmUgc3R5bGU9InN0cm9rZS1kYXNoYXJyYXk6IDE7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IHN0cm9rZTogcmdiKDI1NSwgMjU1LCAyNTUpOyIgeDE9IjE3IiB5MT0iMTUiIHgyPSIzMSIgeTI9IjE1Ii8+CiAgPGxpbmUgc3R5bGU9InN0cm9rZS1kYXNoYXJyYXk6IDE7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IHN0cm9rZTogcmdiKDI1NSwgMjU1LCAyNTUpOyIgeDE9IjUwIiB5MT0iMTUiIHgyPSI2NSIgeTI9IjE1Ii8+CiAgPGxpbmUgc3R5bGU9InN0cm9rZS1kYXNoYXJyYXk6IDE7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IHN0cm9rZTogcmdiKDI1NSwgMjU1LCAyNTUpOyIgeDE9Ijc3IiB5MT0iMTUiIHgyPSI5OSIgeTI9IjE1Ii8+CiAgPGxpbmUgc3R5bGU9InN0cm9rZS1kYXNoYXJyYXk6IDE7IHN0cm9rZS1saW5lam9pbjogcm91bmQ7IHN0cm9rZTogcmdiKDI1NSwgMjU1LCAyNTUpOyIgeDE9IjEwOC41IiB5MT0iMC41IiB4Mj0iMTA4LjUiIHkyPSIxMTEuNSIvPgo8L3N2Zz4=');
}
.nb-json-tree {
  display: flex;
  font-family: var(--nb-font-family-sans);
  font-weight: var(--nb-front-weight-regular);
  font-size: var(--nb-font-size-14);
  text-align: left;
  line-height: 24px;
  background: var(--nb-json-tree-sprite);
  background-color: transparent;
  background-repeat: no-repeat;
  &:not(.root) {
    background-repeat: repeat-y;
    background-position: -99px 0px;
  }

  &.root,
  &:last-child {
    background-repeat: no-repeat;
    background-position: -99px -96px;
  }

  .toggler {
    display: block;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    cursor: pointer;
    background-position: -66px 0px;
    background-image: var(--nb-json-tree-sprite);
    background-color: transparent;
    background-repeat: no-repeat;
  }

  &.colapsed {
    display: none;
  }

  .content {
    display: flex;
    box-sizing: border-box;
    padding: 1px 5px;
    width: 100%;
    .title {
      font-weight: 500;
    }
  }

  &.node {
    .toggler.node {
      &.colapse {
        background-position: 0px 0px;
      }
      &.expand {
        background-position: -33px 0px;
      }
    }
    .content {
      flex-direction: column;

      .title {
        display: flex;
        flex-direction: row;
        flex-shrink: 0;
        span {
          font-family: var(--nb-font-family-mono);
          font-weight: var(--nb-json-tree-sprite);
          margin-left: 5px;
          color: var(--nb-c-primary);
          text-transform: capitalize;
        }
      }
    }
  }

  &.leaf {
    .content {
      flex-direction: row;
      border-bottom: solid 1px transparent;

      .title {
        cursor: pointer;
        &:after {
          content: ': ';
          margin-right: 5px;
        }
      }

      .data {
        display: flex;
        flex-grow: 1;
        overflow-x: hidden;
        position: relative;
        span {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow-x: hidden;
          width: auto;
          &.value--null {
            color: var(--nb-c-text-faded);
          }
        }
        input {
          border: 0;
          outline: 0;
          padding: 0;
          font-size: 14px;
          width: 100%;
          background: transparent;
        }
        .boolean {
          cursor: pointer;
        }
      }

      &.editable {
        .data {
          span {
            &.value {
              cursor: text;
            }
            &.boolean {
              cursor: pointer;
            }
          }
        }
        &:hover {
          border-bottom: dotted 1px var(--nb-c-primary);
        }
      }

      &.editor {
        background: var(--nb-c-panel-background);
        border-bottom: solid 1px var(--nb-c-component-border);
      }
    }
  }
}
</style>
