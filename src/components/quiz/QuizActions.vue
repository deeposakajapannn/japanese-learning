<script setup lang="ts">
import { useLang } from '@/i18n'

const { t } = useLang()

withDefaults(
  defineProps<{
    visible: boolean
    isLooping: boolean
    /** i18n key，默认 correct / wrong / quizTip */
    correctKey?: string
    wrongKey?: string
    tipKey?: string | false
  }>(),
  {
    correctKey: 'correct',
    wrongKey: 'wrong',
    tipKey: 'quizTip',
  },
)

defineEmits<{
  correct: []
  wrong: []
  loop: []
}>()
</script>

<template>
  <div v-if="visible" class="flex flex-col items-center gap-3 w-full max-w-[400px] mx-auto animate-fadeUp">
    <div class="flex items-center gap-3 w-full">
      <button
        class="flex-1 py-3 rounded-[10px] border-2 border-[#5b8a72] bg-[#5b8a72] text-white text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(91,138,114,0.3)]"
        @click="$emit('correct')"
      >
        {{ t(correctKey) }}
      </button>
      <button
        class="py-3 px-5 rounded-[10px] border-2 flex items-center justify-center cursor-pointer transition-all"
        :class="isLooping ? 'border-[#e8735a] bg-[#e8735a] text-white' : 'border-[#e8e2dc] theme-surface hover:border-[#e8735a]'"
        @click="$emit('loop')"
      >
        <svg v-if="isLooping" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 01-4 4H3"/></svg>
      </button>
      <button
        class="flex-1 py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
        @click="$emit('wrong')"
      >
        {{ t(wrongKey) }}
      </button>
    </div>
    <div
      v-if="tipKey !== false"
      class="text-xs theme-muted text-center leading-relaxed"
    >
      {{ t(tipKey) }}
    </div>
  </div>
</template>
