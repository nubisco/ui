<template>
  <NbGrid :id="componentInternalId" :class="classes" align="center" gap="sm">
    <NbLabel
      v-if="label"
      :for="`${componentInternalId}-input`"
      :disabled="disabled"
    >
      {{ label }}
    </NbLabel>
    <label
      :for="`${componentInternalId}-input`"
      :class="wrapperClasses"
      v-bind="attributes"
      @click.stop
    >
      <input
        :id="`${componentInternalId}-input`"
        v-model="model"
        :name="name"
        type="checkbox"
        :disabled="disabled"
      />
      <div class="slider round" />
    </label>
  </NbGrid>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { ESwitchSize, ESwitchVariant } from './Switch.d'
import NbLabel from './Label.vue'
import { useStableId } from '@/composables/useStableId.composable'

const model = defineModel<boolean>()

const props = defineProps({
  id: {
    type: String,
    default: () => null,
  },
  label: {
    type: String,
    default: '',
  },
  size: {
    type: String as PropType<ESwitchSize>,
    default: ESwitchSize.Medium,
    validator: (value: ESwitchSize) =>
      Object.values(ESwitchSize).includes(value),
  },
  verbose: Boolean,
  name: {
    type: String,
    required: true,
  },
  disabled: Boolean,
  variant: {
    type: String as PropType<ESwitchVariant>,
    default: ESwitchVariant.Primary,
    validator: (value: ESwitchVariant) =>
      Object.values(ESwitchVariant).includes(value),
  },
})

const componentInternalId = useStableId(props)

const attributes = computed(() => ({
  'aria-disabled': props.disabled,
}))

const classes = computed(() => ({
  'nb-switch': true,
  disabled: props.disabled,
}))

const wrapperClasses = computed(() => ({
  'nb-switch-wrapper': true,
  verbose: props.verbose,
  [props.size]: true,
  [`nb-${props.variant}`]: true,
}))
</script>

<style lang="scss" scoped>
.nb-switch {
  &-wrapper {
    position: relative;
    display: inline-block;
    width: calc(var(--nb-base-unit) * 4);
    height: calc(var(--nb-base-unit) * 2);
    cursor: pointer;
    .slider {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--nb-c-component-inactive);
      transition: 0.3s;
      border-radius: calc(var(--nb-base-unit) * 4);
      &:before {
        position: absolute;
        content: '';
        height: calc(var(--nb-base-unit) * 1);
        width: calc(var(--nb-base-unit) * 1);
        left: calc(var(--nb-base-unit) / 2);
        bottom: calc(var(--nb-base-unit) / 2);
        background-color: var(--nb-c-white);
        border-radius: 50%;
        transition: transform 0.3s;
      }
    }
    &[aria-disabled='true'] {
      * {
        cursor: not-allowed;
      }
      input + .slider {
        background-color: var(--nb-c-component-disabled);
      }
    }
    input {
      display: none;
      &:checked + .slider {
        &:before {
          -webkit-transform: translateX(calc(var(--nb-base-unit) * 2));
          -ms-transform: translateX(calc(var(--nb-base-unit) * 2));
          transform: translateX(calc(var(--nb-base-unit) * 2));
        }
      }
      &:focus + .slider {
        box-shadow: 0 0 1px var(--nb-c-component-active);
      }
    }
    &:not([aria-disabled='true']) {
      input {
        + .slider {
          background-color: var(--nb-c-component-inactive);
        }
        &:checked + .slider {
          background-color: var(--nb-c-primary);
        }
      }

      &.nb-secondary input:checked + .slider {
        background-color: var(--nb-c-success);
      }
    }
    &.verbose {
      &.sm {
        width: calc(var(--nb-base-unit) * 5.5);
        height: calc(var(--nb-base-unit) * 2);
        .slider {
          &:before {
            height: calc(var(--nb-base-unit) * 1);
            width: calc(var(--nb-base-unit) * 1);
            left: calc(var(--nb-base-unit) / 2);
            bottom: calc(var(--nb-base-unit) / 2);
            border-radius: calc(var(--nb-base-unit) * 4);
          }
          &:after {
            content: 'OFF';
            position: absolute;
            top: calc(var(--nb-base-unit) / 2);
            right: calc(var(--nb-base-unit) - 2px);
            font-weight: var(--nb-font-weight-bold);
            font-size: var(--nb-font-size-10);
            letter-spacing: 0.4px;
            color: var(--nb-c-white);
            line-height: calc(var(--nb-base-unit) * 1);
          }
        }
        input {
          &:checked + .slider {
            &:before {
              -webkit-transform: translateX(calc(var(--nb-base-unit) * 3.4));
              -ms-transform: translateX(calc(var(--nb-base-unit) * 3.4));
              transform: translateX(calc(var(--nb-base-unit) * 3.4));
            }
            &:after {
              content: 'ON';
              left: calc(var(--nb-base-unit) - 2px);
            }
          }
        }
      }
      &.md {
        width: calc(var(--nb-base-unit) * 8);
        height: calc(var(--nb-base-unit) * 3);
        .slider {
          &:before {
            height: calc(var(--nb-base-unit) * 1.5);
            width: calc(var(--nb-base-unit) * 1.5);
            left: var(--nb-base-unit);
            bottom: calc(var(--nb-base-unit) / 1.3);
            border-radius: calc(var(--nb-base-unit) * 8);
          }
          &:after {
            content: 'OFF';
            position: absolute;
            top: calc(var(--nb-base-unit) / 2);
            right: calc(var(--nb-base-unit) * 1);
            font-weight: var(--nb-font-weight-bold);
            font-size: var(--nb-font-size-12);
            color: var(--nb-c-white);
            line-height: calc(var(--nb-base-unit) * 2);
          }
        }
        input {
          &:checked + .slider {
            &:before {
              -webkit-transform: translateX(calc(var(--nb-base-unit) * 4));
              -ms-transform: translateX(calc(var(--nb-base-unit) * 4));
              transform: translateX(calc(var(--nb-base-unit) * 4));
            }
            &:after {
              content: 'ON';
              left: calc(var(--nb-base-unit) * 1);
            }
          }
        }
      }
      &.lg {
        width: calc(var(--nb-base-unit) * 8);
        height: calc(var(--nb-base-unit) * 4);
        .slider {
          &:before {
            height: calc(var(--nb-base-unit) * 2);
            width: calc(var(--nb-base-unit) * 2);
            left: var(--nb-base-unit);
            bottom: var(--nb-base-unit);
            border-radius: calc(var(--nb-base-unit) * 8);
          }
          &:after {
            content: 'OFF';
            position: absolute;
            top: calc(var(--nb-base-unit) / 2);
            right: calc(var(--nb-base-unit) * 1);
            font-weight: var(--nb-font-weight-bold);
            font-size: var(--nb-font-size-12);
            color: var(--nb-c-white);
            line-height: calc(var(--nb-base-unit) * 3);
          }
        }
        input {
          &:checked + .slider {
            &:before {
              -webkit-transform: translateX(calc(var(--nb-base-unit) * 4));
              -ms-transform: translateX(calc(var(--nb-base-unit) * 4));
              transform: translateX(calc(var(--nb-base-unit) * 4));
            }
            &:after {
              content: 'ON';
              left: calc(var(--nb-base-unit) * 1);
            }
          }
        }
      }
    }
  }
}
</style>
