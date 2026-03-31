<script setup lang="ts">
import { useLang } from '@/i18n'

const { t } = useLang()

defineProps<{
  visible: boolean
}>()

defineEmits<{
  correct: []
  wrong: []
  speak: []
}>()
</script>

<template>
  <div v-if="visible" class="flex flex-col items-center gap-3 w-full max-w-[400px] mx-auto animate-fadeUp">
    <div class="flex items-center gap-3 w-full">
      <button
        class="flex-1 py-3 rounded-[10px] border-2 border-[#5b8a72] bg-[#5b8a72] text-white text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(91,138,114,0.3)]"
        @click="$emit('correct')"
      >
        {{ t('correct') }}
      </button>
      <button
        class="py-3 px-5 rounded-[10px] border-2 border-[#e8e2dc] bg-white text-[#2d2d2d] text-sm font-semibold cursor-pointer transition-all hover:border-[#e8735a]"
        @click="$emit('speak')"
      >
        🔊
      </button>
      <button
        class="flex-1 py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
        @click="$emit('wrong')"
      >
        {{ t('wrong') }}
      </button>
    </div>
    <div class="text-xs text-[#777] text-center leading-relaxed">
      {{ t('quizTip') }}
    </div>
  </div>
</template>
