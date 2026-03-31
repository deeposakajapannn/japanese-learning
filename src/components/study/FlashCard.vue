<script setup lang="ts">
import type { VocabItem } from '../../types'
import { localMeaning } from '@/utils/helpers'
import { useLang } from '@/i18n'

const { currentLang } = useLang()

defineProps<{
  item: VocabItem | null
  isFlipped: boolean
}>()

defineEmits<{
  flip: []
}>()
</script>

<template>
  <div
    class="w-full max-w-[400px] mx-auto cursor-pointer animate-fadeUp"
    style="perspective: 1000px; min-height: 280px"
    @click="$emit('flip')"
  >
    <div
      class="relative w-full transition-transform duration-500"
      style="min-height: 280px; transform-style: preserve-3d"
      :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }"
    >
      <!-- Front -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-center rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] theme-surface p-10"
        style="backface-visibility: hidden"
      >
        <div class="text-3xl font-bold theme-text mb-4">
          {{ item?.word ?? '' }}
        </div>
        <div class="text-sm theme-muted">点击翻转查看释义</div>
      </div>
      <!-- Back -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-center rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] theme-surface p-10"
        style="backface-visibility: hidden; transform: rotateY(180deg)"
      >
        <div class="text-lg font-semibold mb-2" style="color: var(--primary)">{{ item?.reading ?? '' }}</div>
        <div class="text-xl font-bold theme-text mb-4">{{ item ? localMeaning(item, currentLang) : '' }}</div>
        <div v-if="item?.example" class="text-sm theme-muted text-center leading-relaxed">
          {{ item.example }}
          <br v-if="item.exampleCn" />
          <span v-if="item.exampleCn" class="text-[13px]" style="color: var(--accent)">{{ item.exampleCn }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
