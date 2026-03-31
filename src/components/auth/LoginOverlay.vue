<script setup lang="ts">
import { ref } from 'vue'
import { useFirebase } from '../../composables/useFirebase'
import { useLang } from '@/i18n'

const { t } = useLang()

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { register, login } = useFirebase()

const tab = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const message = ref('')
const isError = ref(false)
const loading = ref(false)

function reset() {
  username.value = ''
  password.value = ''
  message.value = ''
  isError.value = false
}

function switchTab(t: 'login' | 'register') {
  tab.value = t
  reset()
}

async function onSubmit() {
  if (loading.value) return
  loading.value = true
  message.value = ''

  const fn = tab.value === 'register' ? register : login
  const result = await fn(username.value, password.value)
  message.value = result.message
  isError.value = !result.success
  loading.value = false

  if (result.success) {
    setTimeout(() => {
      emit('close')
      window.location.reload()
    }, 1000)
  }
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#e8735a]/80 to-[#f0a06a]/80"
  >
    <div class="bg-white rounded-2xl p-8 w-[90%] max-w-sm shadow-xl">
      <!-- Tabs -->
      <div class="flex mb-6 border-b border-[#e8e2dc]">
        <button
          class="flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer"
          :class="tab === 'login' ? 'border-[#e8735a] text-[#e8735a]' : 'border-transparent text-[#999]'"
          @click="switchTab('login')"
        >{{ t('loginTab') }}</button>
        <button
          class="flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer"
          :class="tab === 'register' ? 'border-[#e8735a] text-[#e8735a]' : 'border-transparent text-[#999]'"
          @click="switchTab('register')"
        >{{ t('registerTab') }}</button>
      </div>

      <p class="text-sm text-[#777] mb-4 text-center">
        {{ tab === 'register' ? t('registerDesc') : t('loginDescShort') }}
      </p>

      <input
        v-model="username"
        class="w-full px-4 py-3 border border-[#e8e2dc] rounded-xl text-base text-[#2d2d2d] outline-none focus:border-[#e8735a] transition-colors"
        :placeholder="t('usernamePlaceholder')"
        maxlength="30"
        autocomplete="username"
        @keyup.enter="onSubmit"
      />

      <input
        v-model="password"
        type="password"
        class="w-full mt-3 px-4 py-3 border border-[#e8e2dc] rounded-xl text-base text-[#2d2d2d] outline-none focus:border-[#e8735a] transition-colors"
        :placeholder="tab === 'register' ? t('passwordPlaceholder') : t('passwordInput')"
        maxlength="50"
        autocomplete="current-password"
        @keyup.enter="onSubmit"
      />

      <button
        class="w-full mt-4 py-3 rounded-xl bg-[#e8735a] text-white font-semibold text-base cursor-pointer hover:bg-[#c9563f] transition-colors disabled:opacity-50"
        :disabled="loading || !username.trim() || !password"
        @click="onSubmit"
      >
        {{ loading ? t('loginConnecting') : (tab === 'register' ? t('registerBtn') : t('loginBtn2')) }}
      </button>

      <div
        v-if="message"
        class="mt-3 text-sm text-center"
        :class="isError ? 'text-red-500' : 'text-green-600'"
      >
        {{ message }}
      </div>

      <button
        class="w-full mt-3 border-none bg-transparent text-[#777] text-[13px] cursor-pointer underline"
        @click="emit('close')"
      >
        {{ t('cancel') }}
      </button>
    </div>
  </div>
</template>
