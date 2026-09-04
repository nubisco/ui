<template>
  <div ref="rootRef" class="nb-user-menu">
    <slot name="trigger" :open="open" :toggle="toggle">
      <button
        type="button"
        class="nb-user-menu__avatar"
        :title="props.user.email"
        :aria-label="t('userMenu.ACCOUNT_MENU')"
        aria-haspopup="menu"
        :aria-expanded="open"
        :disabled="disabled"
        @click="toggle"
      >
        {{ initials(props.user) }}
      </button>
    </slot>

    <Teleport to="body">
      <Transition name="nb-user-menu-pop">
        <div
          v-if="open"
          ref="panelRef"
          class="nb-user-menu__panel"
          :style="panelStyle"
          role="menu"
        >
          <p class="nb-user-menu__label">{{ t('userMenu.SIGNED_IN_AS') }}</p>
          <p class="nb-user-menu__email">{{ props.user.email }}</p>

          <template v-if="showAccountActions">
            <div class="nb-user-menu__divider" role="separator" />

            <template v-if="props.accounts && props.accounts.length">
              <button
                v-for="account in props.accounts"
                :key="account.id"
                type="button"
                role="menuitem"
                class="nb-user-menu__account"
                :class="{ 'nb-user-menu__account--current': account.current }"
                :disabled="account.current"
                @click="onSwitch(account)"
              >
                <span class="nb-user-menu__account-main">
                  <span class="nb-user-menu__account-email">{{
                    account.email
                  }}</span>
                  <span
                    v-if="account.name"
                    class="nb-user-menu__account-name"
                    >{{ account.name }}</span
                  >
                </span>
                <NbIcon
                  v-if="account.current"
                  name="check"
                  :size="14"
                  class="nb-user-menu__check"
                />
                <NbIcon
                  v-else-if="account.removable !== false"
                  name="x"
                  :size="13"
                  class="nb-user-menu__remove"
                  :title="t('userMenu.REMOVE_ACCOUNT')"
                  @click.stop="onRemove(account)"
                />
              </button>
            </template>
            <button
              v-else-if="props.accountsUnknown"
              type="button"
              role="menuitem"
              class="nb-user-menu__action"
              @click="onSwitchAccount"
            >
              <NbIcon name="users" :size="15" />
              {{ t('userMenu.SWITCH_ACCOUNT') }}
            </button>

            <button
              type="button"
              role="menuitem"
              class="nb-user-menu__action"
              @click="onAddAccount"
            >
              <NbIcon name="plus" :size="15" />
              {{ t('userMenu.USE_ANOTHER_ACCOUNT') }}
            </button>
          </template>

          <template v-if="$slots.default">
            <div class="nb-user-menu__divider" role="separator" />
            <slot :close="close" />
          </template>

          <div class="nb-user-menu__divider" role="separator" />

          <button
            v-if="showProfile"
            type="button"
            role="menuitem"
            class="nb-user-menu__action"
            @click="onProfile"
          >
            <NbIcon name="user" :size="15" />
            {{ t('userMenu.PROFILE') }}
          </button>
          <button
            type="button"
            role="menuitem"
            class="nb-user-menu__action nb-user-menu__action--danger"
            @click="onSignOut"
          >
            <NbIcon name="sign-out" :size="15" />
            {{ t('userMenu.SIGN_OUT') }}
          </button>

          <template v-if="props.brand !== 'none'">
            <div class="nb-user-menu__divider" role="separator" />
            <slot name="brand">
              <p class="nb-user-menu__brand">
                <NbNubiscoPlatformMark :size="13" class="nb-user-menu__mark" />
                <span class="nb-user-menu__brand-line"
                  >{{ brandLine.prefix
                  }}<span class="nb-user-menu__brand-name">{{
                    brandLine.name
                  }}</span></span
                >
              </p>
            </slot>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NbIcon from './Icon.vue'
import NbNubiscoPlatformMark from './NubiscoPlatformMark.vue'
import type { IUserMenuAccount, IUserMenuProps } from './UserMenu.d'

// Resolution order per string: the host app's global catalog under
// `userMenu.*` for the active locale, else the built-in default for the
// active language, else built-in English. This keeps the menu correct in any
// host while letting products override or add locales without touching the
// library.
const BUILT_IN: Record<string, Record<string, string>> = {
  en: {
    ACCOUNT_MENU: 'Account menu',
    SIGNED_IN_AS: 'Signed in as',
    SWITCH_ACCOUNT: 'Switch account',
    USE_ANOTHER_ACCOUNT: 'Use another account',
    REMOVE_ACCOUNT: 'Sign this account out of this browser',
    PROFILE: 'Profile',
    SIGN_OUT: 'Sign out',
    poweredBy: 'Powered by Nubisco Platform',
  },
  pt: {
    ACCOUNT_MENU: 'Menu de conta',
    SIGNED_IN_AS: 'Sessão iniciada como',
    SWITCH_ACCOUNT: 'Mudar de conta',
    USE_ANOTHER_ACCOUNT: 'Usar outra conta',
    REMOVE_ACCOUNT: 'Terminar a sessão desta conta neste browser',
    PROFILE: 'Perfil',
    SIGN_OUT: 'Terminar sessão',
    poweredBy: 'Fornecido pela Nubisco Platform',
  },
}

const { t: globalT, te, locale } = useI18n({ useScope: 'global' })

function t(fullKey: string): string {
  if (te(fullKey)) return globalT(fullKey)
  const key = fullKey.slice('userMenu.'.length)
  const lang = String(locale.value).toLowerCase().split('-')[0]
  return BUILT_IN[lang]?.[key] ?? BUILT_IN.en[key] ?? fullKey
}

const props = withDefaults(defineProps<IUserMenuProps>(), {
  accounts: undefined,
  accountsUnknown: false,
  showAccountActions: true,
  showProfile: true,
  // The vendor mark renders BY DEFAULT, and that is the wrong default: a
  // client product should not have to opt out of showing someone else's
  // brand inside its own account menu. It stays 'footer' here only because
  // flipping it would silently remove the footer from every product already
  // shipping one, which is a breaking change. Two escapes exist today and
  // are documented under "White-labelling" in docs/ui/components/user-menu:
  // brand="none" removes the footer, and the #brand slot replaces it with
  // the product's own line. Flip this default to 'none' in the next major.
  brand: 'footer',
  placement: 'right-end',
  disabled: false,
})

// "Nubisco Platform" is a product name and stays untranslated inside the
// localised sentence, so the emphasis is found rather than hardcoded per
// locale. A translation that drops the name renders wholly emphasised, which
// is the higher-contrast half of the pair.
const BRAND_NAME = 'Nubisco Platform'

const brandLine = computed(() => {
  const line = t('userMenu.poweredBy')
  const at = line.indexOf(BRAND_NAME)
  if (at < 0) return { prefix: '', name: line }
  return { prefix: line.slice(0, at), name: line.slice(at) }
})

const emit = defineEmits<{
  /** An inline account row was chosen. */
  switch: [account: IUserMenuAccount]
  /** The x on an inline account row was clicked. Does not close the menu. */
  remove: [account: IUserMenuAccount]
  /** "Switch account" (accounts unknown) was chosen. */
  'switch-account': []
  /** "Use another account" was chosen. */
  'add-account': []
  profile: []
  'sign-out': []
  open: []
  close: []
}>()

const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const open = ref(false)
const panelStyle = ref<Record<string, string>>({})

function initials(entity: { email: string; name?: string | null }): string {
  const name = entity.name?.trim()
  if (name) {
    const parts = name.split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
    return (first + last).toUpperCase()
  }
  return (entity.email.split('@')[0] ?? '').slice(0, 2).toUpperCase()
}

// Shells commonly clip their sidebars (overflow: hidden), so the panel is
// teleported and fixed-positioned from the trigger's viewport rect on open.
function positionPanel() {
  const rect = rootRef.value?.getBoundingClientRect()
  if (!rect) return
  if (props.placement === 'top-start') {
    panelStyle.value = {
      left: `${Math.round(rect.left)}px`,
      bottom: `${Math.round(window.innerHeight - rect.top + 8)}px`,
    }
  } else {
    panelStyle.value = {
      left: `${Math.round(rect.right + 12)}px`,
      bottom: `${Math.round(window.innerHeight - rect.bottom)}px`,
    }
  }
}

function toggle() {
  if (props.disabled) return
  if (open.value) {
    close()
  } else {
    positionPanel()
    open.value = true
    emit('open')
  }
}

function close() {
  if (!open.value) return
  open.value = false
  emit('close')
}

function onSwitch(account: IUserMenuAccount) {
  if (account.current) return
  close()
  emit('switch', account)
}

function onRemove(account: IUserMenuAccount) {
  emit('remove', account)
}

function onSwitchAccount() {
  close()
  emit('switch-account')
}

function onAddAccount() {
  close()
  emit('add-account')
}

function onProfile() {
  close()
  emit('profile')
}

function onSignOut() {
  close()
  emit('sign-out')
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as Node
  if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) {
    return
  }
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})

defineExpose({ open, toggle, close })
</script>

<style lang="scss">
.nb-user-menu {
  position: relative;
  display: flex;
}

.nb-user-menu__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--nb-c-layer-border-3);
  background: var(--nb-c-primary, #6b46c1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  padding: 0;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.nb-user-menu__panel {
  position: fixed;
  width: 260px;
  background: var(--nb-c-layer-3);
  border: 1px solid var(--nb-c-layer-border-3);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  padding: 0.6rem 0;
  z-index: var(--nb-zindex-menu);
}

.nb-user-menu-pop-enter-active,
.nb-user-menu-pop-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.nb-user-menu-pop-enter-from,
.nb-user-menu-pop-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

.nb-user-menu__label {
  margin: 0.15rem 1rem 0;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--nb-c-text-subtle);
}

.nb-user-menu__email {
  margin: 0.1rem 1rem 0.35rem;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--nb-c-text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.nb-user-menu__divider {
  height: 1px;
  background: var(--nb-c-layer-border-3);
  margin: 0.35rem 0;
}

.nb-user-menu__account,
.nb-user-menu__action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  border: 0;
  background: none;
  padding: 0.45rem 1rem;
  font-size: 0.82rem;
  font-family: inherit;
  color: var(--nb-c-text);
  cursor: pointer;
  text-align: left;

  &:hover {
    background: var(--nb-c-layer-hover-3, rgba(0, 0, 0, 0.05));
  }
}

.nb-user-menu__account--current {
  cursor: default;

  &:hover {
    background: none;
  }
}

.nb-user-menu__account-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.nb-user-menu__account-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.nb-user-menu__account-name {
  font-size: 0.72rem;
  color: var(--nb-c-text-subtle);
}

.nb-user-menu__check {
  color: var(--nb-c-success, #16a34a);
}

.nb-user-menu__remove {
  color: var(--nb-c-text-subtle);
  cursor: pointer;

  &:hover {
    color: var(--nb-c-danger, #b91c1c);
  }
}

.nb-user-menu__brand {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  padding: 0.3rem 1rem 0.15rem;
  font-size: 0.68rem;
  line-height: 1.2;
  color: var(--nb-c-text-muted);
  user-select: none;
}

.nb-user-menu__mark {
  width: 13px;
  height: 13px;
  flex: none;
  display: block;
}

.nb-user-menu__brand-name {
  font-weight: 600;
  color: var(--nb-c-text);
}

.nb-user-menu__action--danger {
  color: var(--nb-c-danger, #b91c1c);

  &:hover {
    background: rgba(239, 68, 68, 0.08);
  }
}
</style>
