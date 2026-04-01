<script setup lang="ts">
import { computed } from 'vue'
import StudyStatusCard from './StudyStatusCard.vue'
import { getStats, todayKey, statsVersion } from '../../composables/useStats'
import { formatListenTime } from '../../utils/helpers'
import { useLang } from '@/i18n'
import { studyStatus as studyStatusCfg } from '@/config/thresholds'
import { milestoneStateTick } from '@/learning'

const { t } = useLang()
const emit = defineEmits<{ mastered: [] }>()

/** 与 jp_stats 键一致：UTC 日历日 YYYY-MM-DD */
function inclusiveUtcDays(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00.000Z`)
  const b = Date.parse(`${toIso}T00:00:00.000Z`)
  return Math.floor((b - a) / 86400000) + 1
}

const stats = computed(() => { statsVersion.value; return getStats() })
const today = computed(() => todayKey())
const todayData = computed(() => stats.value[today.value] || { studied: 0, quizzed: 0, correct: 0, wrong: {}, listened: 0 })

/** 累计听力时长（小时） + 累计练习次数 */
const cumulativeListenHours = computed(() => {
  statsVersion.value
  const s = getStats()
  let totalSec = 0
  for (const k of Object.keys(s)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && s[k]?.listened) {
      totalSec += s[k].listened
    }
  }
  return Math.round(totalSec / 3600)
})

const cumulativePractice = computed(() => {
  statsVersion.value
  const s = getStats()
  let total = 0
  for (const k of Object.keys(s)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
      total += (s[k]?.studied || 0) + (s[k]?.quizzed || 0)
    }
  }
  return total
})

/** 已掌握词数 */
const masteredCount = computed(() => {
  milestoneStateTick.value
  try {
    const m = JSON.parse(localStorage.getItem('jp_mastery_quiz_passed') || '{}')
    return Object.keys(m).length
  } catch { return 0 }
})

const studyStatus = computed(() => {
  const dateKeys = Object.keys(stats.value).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort()
  const todayStr = today.value
  if (!dateKeys.length || inclusiveUtcDays(dateKeys[0]!, todayStr) < studyStatusCfg.minHistoryDays) {
    return {
      emoji: '📅',
      label: t('statusWarmup').replace('{n}', String(studyStatusCfg.minHistoryDays)),
      color: '#8a7040',
    }
  }

  let weekTotal = 0
  let activeDays = 0
  for (let i = 0; i < studyStatusCfg.rollingDays; i++) {
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
  if (dailyAvg < studyStatusCfg.dailyAvgLazyBelow) return { emoji: '🦥', label: t('statusLazy'), color: '#cf5a4a' }
  if (dailyAvg < studyStatusCfg.dailyAvgOkBelow) return { emoji: '👍', label: t('statusOk'), color: '#b9793b' }
  if (dailyAvg < studyStatusCfg.dailyAvgGoodBelow) return { emoji: '🏆', label: t('statusGood'), color: '#4f8a6f' }
  return { emoji: '⚠️', label: t('statusOver'), color: '#cf5a4a' }
})

</script>

<template>
  <div class="grid grid-cols-2 gap-3 mt-4">
    <StudyStatusCard v-bind="studyStatus" />

    <div class="rounded-xl p-4 text-center text-white stat-card stat-card--practice">
      <div class="text-2xl font-bold">{{ todayData.studied + todayData.quizzed }}</div>
      <div class="text-xs opacity-90">{{ t('todayPractice') }}</div>
    </div>

    <div class="rounded-xl p-4 text-center text-white stat-card stat-card--listen">
      <div class="text-2xl font-bold">{{ formatListenTime(todayData.listened || 0, t) }}</div>
      <div class="text-xs opacity-90">{{ t('todayListen') }}</div>
    </div>

    <div class="rounded-xl p-4 text-center text-white stat-card stat-card--cumulative">
      <div class="text-xl font-bold leading-snug">{{ cumulativeListenHours }}{{ t('hour') }}</div>
      <div class="text-xl font-bold leading-snug">{{ cumulativePractice }}</div>
      <div class="text-xs opacity-90 mt-1">{{ t('cumulativeStats') }}</div>
    </div>

    <div
      class="rounded-xl p-4 text-center text-white stat-card stat-card--mastered cursor-pointer active:scale-[0.97] transition-transform"
      @click="emit('mastered')"
    >
      <div class="text-2xl font-bold">{{ masteredCount }}</div>
      <div class="text-xs opacity-90">{{ t('masteredStats') }}</div>
    </div>

  </div>
</template>
