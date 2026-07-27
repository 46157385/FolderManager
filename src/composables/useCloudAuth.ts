import type { User } from '@supabase/supabase-js'
import { computed, readonly, shallowRef } from 'vue'

import { isSupabaseConfigured, supabaseServices } from '@/services/supabase'

const user = shallowRef<User | null>(null)
const isReady = shallowRef(!isSupabaseConfigured)
const isBusy = shallowRef(false)
const authError = shallowRef<string | null>(null)
const authMessage = shallowRef<string | null>(null)
const isPasswordRecovery = shallowRef(false)
let authListenerStarted = false

export function useCloudAuth() {
  startAuthListener()

  const isSignedIn = computed(() => Boolean(user.value))

  async function signIn(email: string, redirectPath = '/login') {
    if (!supabaseServices) {
      authError.value = 'Supabase 尚未配置'
      return
    }

    isBusy.value = true
    authError.value = null
    authMessage.value = null

    try {
      const { error } = await supabaseServices.client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
        },
      })

      if (error) {
        throw error
      }

      authMessage.value = '登录邮件已发送'
    }
    catch (error) {
      authError.value = getErrorMessage(error)
    }
    finally {
      isBusy.value = false
    }
  }

  async function signInWithPassword(email: string, password: string) {
    if (!supabaseServices) {
      authError.value = 'Supabase 尚未配置'
      return false
    }

    isBusy.value = true
    authError.value = null
    authMessage.value = null

    try {
      const { error } = await supabaseServices.client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      authMessage.value = '登录成功'
      return true
    }
    catch (error) {
      authError.value = getErrorMessage(error)
      return false
    }
    finally {
      isBusy.value = false
    }
  }

  async function signUpWithPassword(email: string, password: string, redirectPath = '/login') {
    if (!supabaseServices) {
      authError.value = 'Supabase 尚未配置'
      return false
    }

    isBusy.value = true
    authError.value = null
    authMessage.value = null

    try {
      const { error } = await supabaseServices.client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
        },
      })

      if (error) {
        throw error
      }

      authMessage.value = '注册成功。请检查邮箱完成验证，然后用密码登录。'
      return true
    }
    catch (error) {
      authError.value = getErrorMessage(error)
      return false
    }
    finally {
      isBusy.value = false
    }
  }

  async function sendPasswordReset(email: string, redirectPath = '/login?mode=reset-password') {
    if (!supabaseServices) {
      authError.value = 'Supabase 尚未配置'
      return false
    }

    isBusy.value = true
    authError.value = null
    authMessage.value = null

    try {
      const { error } = await supabaseServices.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${redirectPath}`,
      })

      if (error) {
        throw error
      }

      authMessage.value = '重置密码邮件已发送'
      return true
    }
    catch (error) {
      authError.value = getErrorMessage(error)
      return false
    }
    finally {
      isBusy.value = false
    }
  }

  async function updatePassword(password: string) {
    if (!supabaseServices) {
      authError.value = 'Supabase 尚未配置'
      return false
    }

    isBusy.value = true
    authError.value = null
    authMessage.value = null

    try {
      const { error } = await supabaseServices.client.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      authMessage.value = '密码已更新'
      isPasswordRecovery.value = false
      return true
    }
    catch (error) {
      authError.value = getErrorMessage(error)
      return false
    }
    finally {
      isBusy.value = false
    }
  }

  async function signOutCloud() {
    if (!supabaseServices) {
      return
    }

    isBusy.value = true
    authError.value = null
    authMessage.value = null

    try {
      const { error } = await supabaseServices.client.auth.signOut()

      if (error) {
        throw error
      }

      isPasswordRecovery.value = false
    }
    catch (error) {
      authError.value = getErrorMessage(error)
    }
    finally {
      isBusy.value = false
    }
  }

  return {
    user: readonly(user),
    isReady: readonly(isReady),
    isBusy: readonly(isBusy),
    authError: readonly(authError),
    authMessage: readonly(authMessage),
    isPasswordRecovery: readonly(isPasswordRecovery),
    isSignedIn,
    isConfigured: isSupabaseConfigured,
    signIn,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
    updatePassword,
    signOutCloud,
  }
}

function startAuthListener() {
  if (authListenerStarted || !supabaseServices) {
    return
  }

  authListenerStarted = true
  isPasswordRecovery.value = isPasswordRecoveryCallbackUrl()

  supabaseServices.client.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        throw error
      }

      user.value = data.session?.user ?? null
    })
    .catch((error) => {
      authError.value = getErrorMessage(error)
    })
    .finally(() => {
      isReady.value = true
      isBusy.value = false
    })

  supabaseServices.client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      isPasswordRecovery.value = true
      authError.value = null
      authMessage.value = '身份验证成功，请设置新密码'
    }
    else if (event === 'SIGNED_OUT') {
      isPasswordRecovery.value = false
    }

    user.value = session?.user ?? null
    isReady.value = true
    isBusy.value = false
  })
}

function isPasswordRecoveryCallbackUrl() {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  return searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery'
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return '同步登录失败'
  }

  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return '邮箱或密码不正确。如果刚注册，请先点击邮箱里的验证链接再登录。'
  }

  if (message.includes('email not confirmed')) {
    return '邮箱还没有验证。请先点击邮箱里的验证链接。'
  }

  if (message.includes('user already registered') || message.includes('already registered')) {
    return '这个邮箱已经注册过了，请直接登录或使用忘记密码。'
  }

  return error.message
}
