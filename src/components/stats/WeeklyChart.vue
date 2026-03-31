<script setup lang="ts">
import { computed } from 'vue'
import { getStats } from '../../composables/useStats'
import { formatListenTime } from '../../utils/helpers'
import { useLang } from '@/i18n'

const { t } = useLang()

const stats = computed(() => getStats())

const days = computed(() => {
  const result: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    result.push(d.toISOString().slice(0, 10))
  }
  return result
})

const maxVal = computed(() => {
  let m = 50
  for (const d of days.value) {
    const dd = stats.value[d] || {}
    m = Math.max(m, (dd.studied || 0) + (dd.quizzed || 0))
  }
  return m
})

const maxListen = computed(() => {
  let m = 30
  for (const d of days.value) {
    const dd = stats.value[d] || {}
    m = Math.max(m, dd.listened || 0)
  }
  return m
})
</script>

<template>
  <div class="rounded-xl border border-[#e8e2dc] bg-white p-4 mt-4">
    <h3 class="text-base font-semibold text-[#2d2d2d] mb-3">{{ t('chartTitle') }}</h3>

    <div v-for="day in days" :key="day" class="mb-1">
      <!-- Study + Quiz row -->
      <div class="flex items-center gap-2 h-6">
        <div class="w-12 text-right text-xs text-[#777] shrink-0">{{ day.slice(5) }}</div>
        <div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-green-500 rounded-full"
            :style="{ width: (((stats[day]?.studied || 0) + (stats[day]?.quizzed || 0)) / maxVal * 100) + '%' }"
          />
        </div>
        <div class="w-8 text-xs text-[#777] text-right shrink-0">
          {{ (stats[day]?.studied || 0) + (stats[day]?.quizzed || 0) }}
        </div>
      </div>

      <!-- Listen row -->
      <div class="flex items-center gap-2 h-5 -mt-1">
        <div class="w-12 shrink-0" />
        <div class="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 rounded-full"
            :style="{ width: ((stats[day]?.listened || 0) / maxListen * 100) + '%' }"
          />
        </div>
        <div class="w-8 text-[10px] text-blue-500 text-right shrink-0">
          {{ (stats[day]?.listened || 0) > 0 ? formatListenTime(stats[day]?.listened || 0, t) : '' }}
        </div>
      </div>
    </div>

    <div class="text-[11px] text-[#777] mt-2">🟢 {{ t('practiceLabel') }} &nbsp; 🔵 {{ t('listenLabel') }}</div>
  </div>
</template>
