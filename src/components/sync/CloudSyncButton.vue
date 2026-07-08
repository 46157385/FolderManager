<script setup lang="ts">
import { AlertCircle, Check, Cloud, Loader2, LogIn, LogOut } from '@lucide/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useCloudAuth } from '@/composables/useCloudAuth'
import { useCloudSyncStatus } from '@/composables/useCloudSyncStatus'

const router = useRouter()
const {
  authError,
  isBusy,
  isConfigured,
  isReady,
  isSignedIn,
  signOutCloud,
  user,
} = useCloudAuth()
const { syncError, syncState } = useCloudSyncStatus()

const email = computed(() => user.value?.email ?? '')
const avatarText = computed(() => (email.value.trim().charAt(0) || 'U').toUpperCase())

const statusLabel = computed(() => {
  if (!isConfigured) {
    return '未配置'
  }

  if (!isReady.value || isBusy.value || syncState.value === 'syncing') {
    return '同步中'
  }

  if (authError.value || syncError.value) {
    return '同步异常'
  }

  if (!isSignedIn.value) {
    return '登录同步'
  }

  return email.value || '已登录'
})

const buttonTitle = computed(() => {
  if (!isConfigured) {
    return 'Supabase 未配置'
  }

  if (authError.value) {
    return authError.value
  }

  if (syncError.value) {
    return syncError.value
  }

  if (!isSignedIn.value) {
    return '打开登录页'
  }

  return email.value ? `已登录 ${email.value}` : '已登录'
})

const iconState = computed(() => {
  if (!isConfigured || authError.value || syncError.value) {
    return 'error'
  }

  if (!isReady.value || isBusy.value || syncState.value === 'syncing') {
    return 'busy'
  }

  if (isSignedIn.value && syncState.value === 'synced') {
    return 'synced'
  }

  if (isSignedIn.value) {
    return 'cloud'
  }

  return 'signin'
})

async function handlePrimaryClick() {
  if (!isConfigured || isBusy.value) {
    return
  }

  if (!isSignedIn.value) {
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="sync-wrap">
    <button
      class="sync-pill"
      :class="{ 'sync-pill-error': iconState === 'error', 'sync-pill-signed': isSignedIn }"
      type="button"
      :title="buttonTitle"
      :aria-label="buttonTitle"
      :disabled="!isConfigured || isBusy"
      @click="handlePrimaryClick"
    >
      <span v-if="isSignedIn" class="sync-avatar">{{ avatarText }}</span>
      <Loader2 v-else-if="iconState === 'busy'" class="sync-icon spinning" :size="16" />
      <AlertCircle v-else-if="iconState === 'error'" class="sync-icon" :size="16" />
      <Check v-else-if="iconState === 'synced'" class="sync-icon" :size="16" />
      <LogIn v-else-if="iconState === 'signin'" class="sync-icon" :size="16" />
      <Cloud v-else class="sync-icon" :size="16" />

      <span class="sync-label">{{ statusLabel }}</span>
    </button>

    <button
      v-if="isSignedIn"
      class="sync-logout"
      type="button"
      title="退出登录"
      aria-label="退出登录"
      :disabled="isBusy"
      @click="signOutCloud"
    >
      <LogOut :size="15" />
    </button>
  </div>
</template>

<style scoped>
.sync-wrap {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 30;
  display: flex;
  max-width: calc(100vw - 32px);
  align-items: center;
  gap: 8px;
}

.sync-pill,
.sync-logout {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-muted-strong);
  cursor: pointer;
  box-shadow: 0 1px 1px rgba(16, 24, 40, 0.03);
  backdrop-filter: blur(16px);
}

.sync-pill {
  display: inline-flex;
  min-width: 0;
  max-width: min(320px, calc(100vw - 84px));
  min-height: 40px;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
}

.sync-pill:hover:not(:disabled),
.sync-logout:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

.sync-pill:disabled,
.sync-logout:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.sync-pill-error {
  border-color: rgba(180, 35, 24, 0.28);
  background: #fff5f5;
  color: #b42318;
}

.sync-pill-signed {
  padding-left: 7px;
}

.sync-avatar {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(37, 99, 235, 0.22);
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-size: 13px;
  font-weight: 760;
}

.sync-icon {
  flex: 0 0 auto;
}

.sync-label {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 620;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sync-logout {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}

.spinning {
  animation: spin 900ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .sync-wrap {
    top: 10px;
    right: 10px;
    max-width: calc(100vw - 20px);
  }

  .sync-pill {
    max-width: calc(100vw - 72px);
    min-height: 36px;
    padding-right: 10px;
  }

  .sync-logout {
    width: 36px;
    height: 36px;
  }
}
</style>
