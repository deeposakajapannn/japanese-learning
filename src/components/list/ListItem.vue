<script setup lang="ts">
import { computed } from 'vue'
import type { VocabItem, CategoryKey } from '../../types'
import { getListenedCount, getItemCount, itemCountsTick } from '../../composables/useSpacedRepetition'
import { speakWithExample, speakLoop, stopLoop, looping, loopingWord } from '../../composables/useAudio'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'
import SentenceListenRow from './SentenceListenRow.vue'

const { t, currentLang } = useLang()

const props = defineProps<{
  item: VocabItem
  cat: CategoryKey
}>()

function onSpeak() {
  speakWithExample(props.item.word, props.item.example)
}

const isThisLooping = computed(() => looping.value && loopingWord.value === props.item.word)

function onToggleLoop() {
  if (isThisLooping.value) {
    stopLoop()
  } else {
    speakLoop(props.item.word, props.item.example)
  }
}

const statsLine = computed(() => {
  itemCountsTick.value
  return t('listStatsCounts')
    .replace('{listen}', String(getListenedCount(props.cat, props.item.id)))
    .replace('{practice}', String(getItemCount(props.cat, props.item.id)))
})
</script>

<template>
  <SentenceListenRow v-if="cat === 'sentences'" :item="item" />
  <div
    v-else
    class="flex items-center relative theme-surface rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4 cursor-pointer transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] active:shadow-[0_1px_4px_rgba(0,0,0,0.15)] active:scale-[0.98] animate-fadeUp"
    @click="onSpeak"
  >
    <div class="w-9 h-9 rounded-full theme-soft text-[#e8735a] flex items-center justify-center text-xs font-bold shrink-0 mr-3">
      {{ item.id }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-base font-bold theme-text">{{ item.word }}</div>
      <div class="text-sm theme-muted">{{ item.reading }}</div>
      <div class="text-sm theme-text mt-0.5">{{ localMeaning(item, currentLang) }}</div>
      <div v-if="item.example" class="text-xs theme-muted mt-1 leading-relaxed">
        {{ item.example }}
        <br v-if="item.exampleCn" />
        <span v-if="item.exampleCn" class="text-[#5b8a72]">{{ item.exampleCn }}</span>
      </div>
    </div>
    <button
      class="w-9 h-9 ml-2 shrink-0 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all"
      :class="isThisLooping ? 'border-[#e8735a] bg-[#e8735a] text-white' : 'border-[#e8e2dc] theme-surface hover:border-[#e8735a]'"
      @click.stop="onToggleLoop"
    >
      <svg v-if="isThisLooping" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 01-4 4H3"/></svg>
    </button>
    <div class="absolute top-2 right-12 theme-muted text-[10px] leading-tight text-right max-w-[6rem] pointer-events-none">
      {{ statsLine }}
    </div>
  </div>
</template>
