<script setup lang="ts">
import { computed } from 'vue'
import StudyStatusCard from './StudyStatusCard.vue'
import { getStats, todayKey, statsVersion } from '../../composables/useStats'
import { formatListenTime } from '../../utils/helpers'
import { useLang } from '@/i18n'

const { t } = useLang()

const stats = computed(() => { statsVersion.value; return getStats() })
const today = computed(() => todayKey())
const todayData = computed(() => stats.value[today.value] || { studied: 0, quizzed: 0, correct: 0, wrong: {}, listened: 0 })

const studyStatus = computed(() => {
  let weekTotal = 0
  let activeDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dd = stats.value[key]
    if (dd) {
      activeDays++
      weekTotal += (dd.studied || 0) + (dd.quizzed || 0)
    }
  }
  const days = Math.max(activeDays, 1)
  const dailyAvg = weekTotal / days
  if (dailyAvg < 20) return { emoji: '🦥', label: t('statusLazy'), color: '#cf5a4a' }
  if (dailyAvg < 40) return { emoji: '👍', label: t('statusOk'), color: '#b9793b' }
  if (dailyAvg < 80) return { emoji: '🔥', label: t('statusGood'), color: '#4f8a6f' }
  if (dailyAvg < 100) return { emoji: '💪', label: t('statusHard'), color: '#d86e55' }
  return { emoji: '⚠️', label: t('statusOver'), color: '#cf5a4a' }
})

</script>

<template>
  <div class="grid grid-cols-3 gap-3 mt-4">
    <StudyStatusCard v-bind="studyStatus" />

    <div class="rounded-xl p-4 text-center text-white stat-card stat-card--practice">
      <div class="text-2xl font-bold">{{ todayData.studied + todayData.quizzed }}</div>
      <div class="text-xs opacity-90">{{ t('todayPractice') }}</div>
    </div>

    <div class="rounded-xl p-4 text-center text-white stat-card stat-card--listen">
      <div class="text-2xl font-bold">{{ formatListenTime(todayData.listened || 0, t) }}</div>
      <div class="text-xs opacity-90">{{ t('todayListen') }}</div>
    </div>

  </div>
</template>
