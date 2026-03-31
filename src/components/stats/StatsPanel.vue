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

function resetStats() {
  if (!confirm(t('resetConfirm1'))) return
  if (!confirm(t('resetConfirm2'))) return

  for (const k of SYNCED_KEYS) localStorage.removeItem(k.local)
  syncToCloud()
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
  </div>
</template>
