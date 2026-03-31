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
  <div class="theme-card p-4 mt-4">
    <h3 class="text-base font-semibold theme-text mb-3">{{ t('chartTitle') }}</h3>

    <div v-for="day in days" :key="day" class="mb-1">
      <!-- Study + Quiz row -->
      <div class="flex items-center gap-2 h-6">
        <div class="w-12 text-right text-xs theme-muted shrink-0">{{ day.slice(5) }}</div>
        <div class="flex-1 h-4 rounded-full overflow-hidden chart-track">
          <div
            class="h-full rounded-full chart-bar-study"
            :style="{ width: (((stats[day]?.studied || 0) + (stats[day]?.quizzed || 0)) / maxVal * 100) + '%' }"
          />
        </div>
        <div class="w-8 text-xs theme-muted text-right shrink-0">
          {{ (stats[day]?.studied || 0) + (stats[day]?.quizzed || 0) }}
        </div>
      </div>

      <!-- Listen row -->
      <div class="flex items-center gap-2 h-5 -mt-1">
        <div class="w-12 shrink-0" />
        <div class="flex-1 h-2.5 rounded-full overflow-hidden chart-track">
          <div
            class="h-full rounded-full chart-bar-listen"
            :style="{ width: ((stats[day]?.listened || 0) / maxListen * 100) + '%' }"
          />
        </div>
        <div class="w-8 text-[10px] chart-text-listen text-right shrink-0">
          {{ (stats[day]?.listened || 0) > 0 ? formatListenTime(stats[day]?.listened || 0, t) : '' }}
        </div>
      </div>
    </div>

    <div class="text-[11px] theme-muted mt-2">🟢 {{ t('practiceLabel') }} &nbsp; 🔵 {{ t('listenLabel') }}</div>
  </div>
</template>

<style scoped>
.chart-track {
  background: color-mix(in srgb, var(--text) 8%, transparent);
}

.chart-bar-study {
  background: #4f8a6f;
}

.chart-bar-listen {
  background: #5d81b5;
}

.chart-text-listen {
  color: #5d81b5;
}

:global(:root.theme-dark) .chart-track {
  background: color-mix(in srgb, #ffffff 14%, transparent);
}

:global(:root.theme-dark) .chart-bar-study {
  background: #6da585;
}

:global(:root.theme-dark) .chart-bar-listen {
  background: #7aa0d2;
}

:global(:root.theme-dark) .chart-text-listen {
  color: #89b0e2;
}
</style>
