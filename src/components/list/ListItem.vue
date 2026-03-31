<script setup lang="ts">
import type { VocabItem, CategoryKey } from '../../types'
import { isMastered, getItemCount } from '../../composables/useSpacedRepetition'
import { speakWithExample } from '../../composables/useAudio'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

const { t, currentLang } = useLang()

const props = defineProps<{
  item: VocabItem
  cat: CategoryKey
}>()

function onSpeak() {
  speakWithExample(props.item.word, props.item.example)
}
</script>

<template>
  <div
    class="flex items-center relative bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4 cursor-pointer transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] animate-fadeUp"
    @click="onSpeak"
  >
    <div class="w-9 h-9 rounded-full bg-[#fdf0ed] text-[#e8735a] flex items-center justify-center text-xs font-bold shrink-0 mr-3">
      {{ item.id }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-base font-bold text-[#2d2d2d]">{{ item.word }}</div>
      <div class="text-sm text-[#777]">{{ item.reading }}</div>
      <div class="text-sm text-[#2d2d2d] mt-0.5">{{ localMeaning(item, currentLang) }}</div>
      <div v-if="item.example" class="text-xs text-[#777] mt-1 leading-relaxed">
        {{ item.example }}
        <br v-if="item.exampleCn" />
        <span v-if="item.exampleCn" class="text-[#5b8a72]">{{ item.exampleCn }}</span>
      </div>
    </div>
    <button
      class="text-xl ml-2 shrink-0 bg-transparent border-none cursor-pointer"
      @click.stop="onSpeak"
    >
      🔊
    </button>
    <div
      v-if="isMastered(cat, item.id)"
      class="absolute top-2 right-2 bg-[#5b8a72] text-white text-[10px] px-2 py-0.5 rounded-[10px]"
    >
      {{ t('mastered') }}
    </div>
    <div
      v-else
      class="absolute top-2 right-2 text-[#777] text-[10px]"
    >
      {{ getItemCount(cat, item.id) }}/50
    </div>
  </div>
</template>
