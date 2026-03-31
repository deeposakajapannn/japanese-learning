<script setup lang="ts">
import { useFirebase } from '../../composables/useFirebase'
import { useLang } from '@/i18n'

const { t } = useLang()
const { userId, logout } = useFirebase()

const emit = defineEmits<{
  login: []
}>()

function handleLogout() {
  logout()
  window.location.reload()
}
</script>

<template>
  <!-- Not logged in: sync banner -->
  <div v-if="!userId" class="rounded-xl border border-[#f0d9a0] bg-[#fffbf0] p-4 mt-4 text-center">
    <div class="text-sm text-[#8a7040] mb-2">{{ t('syncBanner') }}</div>
    <button
      class="px-5 py-2 rounded-full bg-[#e8735a] text-white text-sm font-semibold cursor-pointer hover:bg-[#c9563f] transition-colors"
      @click="emit('login')"
    >{{ t('registerOrLogin') }}</button>
  </div>

  <!-- Logged in: account info -->
  <div v-else class="rounded-xl border border-[#e8e2dc] bg-white p-5 text-center mt-4">
    <div class="text-[13px] text-[#777] mb-1">{{ t('loggedInAs') }}</div>
    <div class="text-2xl font-extrabold tracking-widest text-[#e8735a]">{{ userId }}</div>
    <div class="text-[12px] text-[#aaa] mt-1">{{ t('syncEnabled') }}</div>
    <button
      class="mt-3 px-4 py-1.5 border border-[#e8e2dc] rounded-full bg-white text-[13px] text-[#777] cursor-pointer hover:bg-gray-50"
      @click="handleLogout"
    >{{ t('logoutBtn') }}</button>
  </div>
</template>
