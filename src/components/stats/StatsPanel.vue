<script setup lang="ts">
import { ref } from 'vue'
import ProfileSection from './ProfileSection.vue'
import StatsGrid from './StatsGrid.vue'
import WeeklyChart from './WeeklyChart.vue'
import WrongWordsList from './WrongWordsList.vue'
import LoginOverlay from '../auth/LoginOverlay.vue'
import { useFirebase } from '../../composables/useFirebase'
import { useLang } from '@/i18n'

const { t } = useLang()
const { syncToCloud, SYNCED_KEYS } = useFirebase()
const showLogin = ref(false)
const confirmStep = ref<0 | 1 | 2>(0)

function openResetConfirm() {
  confirmStep.value = 1
}

function closeResetConfirm() {
  confirmStep.value = 0
}

function onConfirmReset() {
  if (confirmStep.value === 1) {
    confirmStep.value = 2
    return
  }

  for (const k of SYNCED_KEYS) localStorage.removeItem(k.local)
  syncToCloud()
  confirmStep.value = 0
}

function resetStats() {
  openResetConfirm()
}
</script>

<template>
  <div class="pb-8">
    <ProfileSection @login="showLogin = true" />
    <StatsGrid />
    <WeeklyChart />
    <WrongWordsList />

    <button
      class="w-full mt-6 py-3 rounded-xl border border-red-300 text-red-500 bg-white text-sm hover:bg-red-50 cursor-pointer"
      @click="resetStats"
    >
      {{ t('resetBtn2') }}
    </button>

    <LoginOverlay :visible="showLogin" @close="showLogin = false" />

    <div
      v-if="confirmStep > 0"
      class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
      @click.self="closeResetConfirm"
    >
      <div class="w-[90%] max-w-md rounded-2xl bg-white p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <div class="mb-3 flex items-center gap-2">
          <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500">!</span>
          <h3 class="text-[15px] font-semibold text-[#2d2d2d]">{{ t('resetBtn2') }}</h3>
        </div>

        <p class="whitespace-pre-line text-sm leading-6 text-[#666]">
          {{ confirmStep === 1 ? t('resetConfirm1') : t('resetConfirm2') }}
        </p>

        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            class="px-4 py-2 rounded-lg border border-[#e8e2dc] text-[#666] text-sm hover:bg-[#f8f8f8] cursor-pointer"
            @click="closeResetConfirm"
          >
            {{ t('cancel') }}
          </button>
          <button
            class="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 cursor-pointer"
            @click="onConfirmReset"
          >
            {{ t('confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
