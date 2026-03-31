<script setup lang="ts">
import { computed } from 'vue'
import StudyStatusCard from './StudyStatusCard.vue'
import { getStats, todayKey } from '../../composables/useStats'
import { formatListenTime } from '../../utils/helpers'
import { useLang } from '@/i18n'

const { t } = useLang()

const stats = computed(() => getStats())
const today = computed(() => todayKey())
const todayData = computed(() => stats.value[today.value] || { studied: 0, quizzed: 0, correct: 0, wrong: {}, listened: 0 })

const studyStatus = computed(() => {
  let weekTotal = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dd = stats.value[key] || {}
    weekTotal += (dd.studied || 0) + (dd.quizzed || 0)
  }
  const dailyAvg = weekTotal / 7
  if (dailyAvg < 10) return { emoji: '🦥', label: t('statusLazy'), color: '#e74c3c' }
  if (dailyAvg < 30) return { emoji: '🐢', label: t('statusOk'), color: '#e67e22' }
  if (dailyAvg < 80) return { emoji: '👍', label: t('statusGood'), color: '#5b8a72' }
  if (dailyAvg < 150) return { emoji: '🔥', label: t('statusHard'), color: '#e8735a' }
  return { emoji: '⚠️', label: t('statusOver'), color: '#e74c3c' }
})

const totalDays = computed(() => Object.keys(stats.value).length)
</script>

<template>
  <div class="grid grid-cols-2 gap-3 mt-4">
    <StudyStatusCard v-bind="studyStatus" />

    <div class="rounded-xl p-4 text-center text-white bg-gradient-to-br from-[#e8735a] to-[#f0a06a]">
      <div class="text-2xl font-bold">{{ todayData.studied + todayData.quizzed }}</div>
      <div class="text-xs opacity-90">{{ t('todayPractice') }}</div>
    </div>

    <div class="rounded-xl p-4 text-center text-white bg-gradient-to-br from-[#c9563f] to-[#e8735a]">
      <div class="text-2xl font-bold">{{ formatListenTime(todayData.listened || 0, t) }}</div>
      <div class="text-xs opacity-90">{{ t('todayListen') }}</div>
    </div>

    <div class="rounded-xl p-4 text-center text-white bg-gradient-to-br from-[#e8735a] to-[#f0a06a]">
      <div class="text-2xl font-bold">{{ totalDays }}</div>
      <div class="text-xs opacity-90">{{ t('totalDays') }}</div>
    </div>
  </div>
</template>
