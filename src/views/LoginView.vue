<script setup lang="ts">
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from "@lucide/vue";
import { computed, shallowRef, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { useCloudAuth } from "@/composables/useCloudAuth";
import { isCloudSyncEnabled } from "@/config/features";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

const route = useRoute();
const router = useRouter();
const {
  authError,
  authMessage,
  isBusy,
  isConfigured,
  isReady,
  isSignedIn,
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
  user,
} = useCloudAuth();

const mode = shallowRef<AuthMode>(
  route.query.mode === "reset-password" ? "reset-password" : "sign-in",
);
const email = shallowRef("");
const password = shallowRef("");
const confirmPassword = shallowRef("");

const trimmedEmail = computed(() => email.value.trim());
const signedInEmail = computed(() => user.value?.email ?? "");
const needsPassword = computed(() => mode.value !== "forgot-password");
const canSubmit = computed(() => {
  if (!isConfigured || isBusy.value || !isReady.value) {
    return false;
  }

  if (mode.value === "reset-password") {
    return isValidPassword.value && passwordsMatch.value;
  }

  if (!trimmedEmail.value) {
    return false;
  }

  if (mode.value === "forgot-password") {
    return true;
  }

  return (
    isValidPassword.value && (mode.value === "sign-in" || passwordsMatch.value)
  );
});
const isValidPassword = computed(() => password.value.length >= 6);
const passwordsMatch = computed(() => password.value === confirmPassword.value);
const title = computed(() => {
  if (mode.value === "sign-up") {
    return "创建账号";
  }

  if (mode.value === "forgot-password") {
    return "重置密码";
  }

  if (mode.value === "reset-password") {
    return "设置新密码";
  }

  return "账号密码登录";
});
const description = computed(() => {
  if (mode.value === "sign-up") {
    return isCloudSyncEnabled
      ? "用邮箱注册账号。验证邮箱后，就可以用密码同步收藏和历史记录。"
      : "用邮箱注册账号。验证邮箱后，就可以在正式环境登录。";
  }

  if (mode.value === "forgot-password") {
    return "输入绑定邮箱，我们会发送一封重置密码邮件。";
  }

  if (mode.value === "reset-password") {
    return "为当前账号设置一个新密码。";
  }

  return isCloudSyncEnabled
    ? "登录后，收藏列表和历史记录会同步到你的 Supabase 账号。"
    : "登录功能正常可用；收藏和历史暂时保存在当前浏览器。";
});
const submitLabel = computed(() => {
  if (mode.value === "sign-up") {
    return "注册账号";
  }

  if (mode.value === "forgot-password") {
    return "发送重置邮件";
  }

  if (mode.value === "reset-password") {
    return "更新密码";
  }

  return "登录";
});

async function submitAuth() {
  if (!canSubmit.value) {
    return;
  }

  if (mode.value === "sign-up") {
    const didSignUp = await signUpWithPassword(
      trimmedEmail.value,
      password.value,
      "/login",
    );

    if (didSignUp) {
      password.value = "";
      confirmPassword.value = "";
    }

    return;
  }

  if (mode.value === "forgot-password") {
    await sendPasswordReset(trimmedEmail.value);
    return;
  }

  if (mode.value === "reset-password") {
    const didUpdate = await updatePassword(password.value);

    if (didUpdate) {
      password.value = "";
      confirmPassword.value = "";
      await router.replace({ name: "library" });
    }

    return;
  }

  await signInWithPassword(trimmedEmail.value, password.value);
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode;
  password.value = "";
  confirmPassword.value = "";

  if (nextMode !== "reset-password" && route.query.mode) {
    router.replace({ name: "login" });
  }
}

watch(
  () => route.query.mode,
  (nextMode) => {
    if (nextMode === "reset-password") {
      mode.value = "reset-password";
    }
  },
);

watch(isSignedIn, (signedIn) => {
  if (signedIn && mode.value !== "reset-password") {
    window.setTimeout(() => {
      router.push({ name: "library" });
    }, 700);
  }
});
</script>

<template>
  <main class="login-page">
    <section class="login-shell">
      <RouterLink
        class="back-link"
        :to="{ name: 'library' }"
        title="返回列表"
        aria-label="返回列表"
      >
        <ArrowLeft :size="19" />
      </RouterLink>

      <section class="login-panel">
        <span class="login-icon">
          <KeyRound :size="24" />
        </span>

        <div class="login-copy">
          <p class="eyebrow">{{ isCloudSyncEnabled ? "Cloud Sync" : "Account" }}</p>
          <h1 class="title">{{ title }}</h1>
          <p class="description">{{ description }}</p>
        </div>

        <section
          v-if="isSignedIn && mode !== 'reset-password'"
          class="signed-state"
        >
          <CheckCircle2 :size="20" />
          <span>{{ signedInEmail || "已登录" }}</span>
        </section>

        <form v-else class="login-form" @submit.prevent="submitAuth">
          <label v-if="mode !== 'reset-password'" class="field">
            <span class="field-label">邮箱地址</span>
            <span class="input-wrap">
              <Mail class="input-icon" :size="17" />
              <input
                v-model="email"
                class="input input-with-icon"
                type="email"
                autocomplete="email"
                placeholder="name@example.com"
                :disabled="isBusy || !isConfigured"
              />
            </span>
          </label>

          <label v-if="needsPassword" class="field">
            <span class="field-label">密码</span>
            <span class="input-wrap">
              <Lock class="input-icon" :size="17" />
              <input
                v-model="password"
                class="input input-with-icon"
                type="password"
                :autocomplete="
                  mode === 'sign-in' ? 'current-password' : 'new-password'
                "
                placeholder="至少 6 位"
                :disabled="isBusy || !isConfigured"
              />
            </span>
          </label>

          <label
            v-if="mode === 'sign-up' || mode === 'reset-password'"
            class="field"
          >
            <span class="field-label">确认密码</span>
            <span class="input-wrap">
              <Lock class="input-icon" :size="17" />
              <input
                v-model="confirmPassword"
                class="input input-with-icon"
                type="password"
                autocomplete="new-password"
                placeholder="再输入一次密码"
                :disabled="isBusy || !isConfigured"
              />
            </span>
          </label>

          <p v-if="needsPassword && password && !isValidPassword" class="hint">
            密码至少需要 6 位。
          </p>
          <p
            v-else-if="confirmPassword && !passwordsMatch"
            class="hint hint-error"
          >
            两次输入的密码不一致。
          </p>

          <button class="submit-button" type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isBusy || !isReady" class="spinning" :size="18" />
            <KeyRound v-else :size="18" />
            <span>{{ submitLabel }}</span>
          </button>

          <div v-if="mode !== 'reset-password'" class="mode-actions">
            <button
              v-if="mode !== 'sign-in'"
              class="text-button"
              type="button"
              :disabled="isBusy"
              @click="switchMode('sign-in')"
            >
              返回登录
            </button>

            <button
              v-if="mode === 'sign-in'"
              class="text-button"
              type="button"
              :disabled="isBusy"
              @click="switchMode('forgot-password')"
            >
              忘记密码
            </button>

            <button
              class="text-button"
              type="button"
              :disabled="isBusy"
              @click="switchMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')"
            >
              {{ mode === "sign-up" ? "已有账号" : "创建账号" }}
            </button>
          </div>
        </form>
        <!--  -->
        <p v-if="!isConfigured" class="status status-error">
          Supabase 尚未配置
        </p>
        <p v-else-if="authError" class="status status-error">{{ authError }}</p>
        <p v-else-if="authMessage" class="status">{{ authMessage }}</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - var(--app-toolbar-height));
  background: transparent;
  color: var(--color-text);
}

.login-shell {
  width: min(520px, calc(100% - 48px));
  margin: 0 auto;
  padding: 56px 0 72px;
}

.back-link {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.74);
  color: var(--color-muted-strong);
  box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04);
}

.back-link:hover {
  border-color: var(--color-border-strong);
  background: var(--color-bg-elevated);
  color: var(--color-text-strong);
  transform: translateY(-1px);
}

.login-panel {
  display: grid;
  gap: 22px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.84);
  border-radius: 22px;
  background:
    radial-gradient(circle at 100% 0%, rgba(94, 106, 210, 0.12), transparent 18rem),
    var(--color-surface-glass);
  box-shadow: var(--shadow-hover);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.login-icon {
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(94, 106, 210, 0.18);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.login-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 720;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 34px;
  font-weight: 720;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.description {
  margin: 12px 0 0;
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.65;
}

.login-form {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  color: var(--color-muted-strong);
  font-size: 13px;
  font-weight: 620;
}

.input-wrap {
  position: relative;
  display: block;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  color: var(--color-muted);
  transform: translateY(-50%);
}

.input {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  padding: 0 12px;
}

.input-with-icon {
  padding-left: 40px;
}

.input:disabled {
  opacity: 0.7;
}

.input:focus {
  border-color: rgba(94, 106, 210, 0.46);
  outline: 0;
  box-shadow: 0 0 0 4px rgba(94, 106, 210, 0.09);
}

.hint {
  margin: -4px 0 0;
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.hint-error {
  color: #b42318;
}

.submit-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: linear-gradient(180deg, #6873dc, var(--color-primary));
  color: white;
  cursor: pointer;
  font-weight: 650;
}

.submit-button:hover:not(:disabled) {
  border-color: var(--color-primary-strong);
  background: var(--color-primary-strong);
  transform: translateY(-1px);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

.mode-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.text-button {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  padding: 0;
}

.text-button:hover:not(:disabled) {
  color: var(--color-primary-strong);
}

.text-button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.signed-state {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(22, 163, 74, 0.22);
  border-radius: var(--radius-sm);
  background: #f0fdf4;
  color: #15803d;
  font-size: 14px;
  font-weight: 620;
  overflow-wrap: anywhere;
}

.status {
  margin: 0;
  color: var(--color-muted-strong);
  font-size: 13px;
  line-height: 1.55;
}

.status-error {
  color: #b42318;
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
  .login-shell {
    width: min(100% - 24px, 520px);
    padding: 32px 0 56px;
  }

  .login-panel {
    padding: 22px;
  }

  .title {
    font-size: 30px;
  }
}
</style>
