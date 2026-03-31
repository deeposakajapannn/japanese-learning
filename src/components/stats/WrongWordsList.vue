<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { getStats } from '../../composables/useStats'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

const { t, currentLang } = useLang()

const store = useAppStore()

const wrongWords = computed(() => {
  const stats = getStats()
  const wrongMap: Record<string, number> = {}
  for (const d of Object.values(stats)) {
    for (const [k, v] of Object.entries((d as any).wrong || {})) {
      wrongMap[k] = (wrongMap[k] || 0) + (v as number)
    }
  }
  return Object.entries(wrongMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [cat, id] = key.split(':')
      const items = (store.data as any)[cat] as any[] | undefined
      const item = items?.find((it: any) => it.id === parseInt(id))
      return item ? { word: item.word, meaning: item.meaning, meaningEn: item.meaningEn, meaningEs: item.meaningEs, count } : null
    })
    .filter(Boolean) as { word: string; meaning: string; meaningEn?: string; meaningEs?: string; count: number }[]
})
</script>

<template>
  <div class="rounded-xl border border-[#e8e2dc] bg-white p-4 mt-4">
    <h3 class="text-base font-semibold text-[#2d2d2d] mb-3">🔴 {{ t('wrongTitle') }}</h3>

    <div v-if="wrongWords.length === 0" class="text-[#777] text-sm text-center py-5">
      {{ t('noData') }}
    </div>

    <div
      v-for="(item, idx) in wrongWords"
      :key="idx"
      class="flex items-center justify-between py-2 border-b border-[#e8e2dc] last:border-b-0"
    >
      <span class="font-semibold text-[#2d2d2d]">{{ item.word }}</span>
      <span class="text-sm text-[#777] flex-1 mx-3 truncate">{{ localMeaning(item, currentLang) }}</span>
      <span class="text-xs text-white bg-[#e74c3c] rounded-full px-2 py-0.5 shrink-0">
        ×{{ item.count }}
      </span>
    </div>
  </div>
</template>
