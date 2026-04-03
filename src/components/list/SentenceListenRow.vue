<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GrammarPoint, VocabItem } from '../../types'
import { getListenedCount, getItemCount, itemCountsTick, listenedCountsTick, recordItemListened } from '../../composables/useSpacedRepetition'
import { speakWithExample } from '../../composables/useAudio'
import { useListenListCardSwipe } from '@/composables/useListenListCardSwipe'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

const { t, currentLang } = useLang()

const expandedGrammar = ref<GrammarPoint | null>(null)

const highlightIndices = computed(() => {
  const g = expandedGrammar.value
  if (!g || !g.highlight) return new Set<number>()
  return new Set(g.highlight)
})

function onGrammarTag(g: GrammarPoint, e: Event) {
  e.stopPropagation()
  expandedGrammar.value = expandedGrammar.value?.pattern === g.pattern ? null : g
}

const props = defineProps<{
  item: VocabItem
  rowNumber: number
}>()

const emit = defineEmits<{
  playListFrom: [rowNumber: number]
}>()

function onPlayListFromRow() {
  emit('playListFrom', props.rowNumber)
}

const cat = 'sentences' as const

const statsLine = computed(() => {
  itemCountsTick.value
  listenedCountsTick.value
  return t('listStatsCounts')
    .replace('{listen}', String(getListenedCount(cat, props.item.id)))
    .replace('{practice}', String(getItemCount(cat, props.item.id)))
})

function onSpeak() {
  speakWithExample(props.item.word, props.item.example)
  recordItemListened(cat, props.item.id)
}

const {
  onPointerDown,
  onCardClick,
  onAddQuiz,
  inQueue,
  cardTransform,
  cardTransitionClass,
} = useListenListCardSwipe(
  () => 'sentences',
  () => props.item.id,
  onSpeak,
)
</script>

<template>
  <div class="flex flex-col rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden animate-fadeUp">
    <div class="relative flex-1 min-w-0 overflow-hidden">
      <div class="absolute inset-y-0 right-0 flex w-[100px] z-0" aria-hidden="true">
        <button
          type="button"
          class="w-full flex items-center justify-center text-white text-xs font-semibold px-2 leading-tight border-0 cursor-pointer active:opacity-90 hover:opacity-95"
          :class="inQueue ? 'bg-[#999] cursor-default' : 'btn-grad-primary btn-grad-primary--borderless'"
          :disabled="inQueue"
          @pointerdown.stop
          @click.stop="onAddQuiz"
        >
          {{ inQueue ? t('quizQueueReady') : t('quizQueueAdd') }}
        </button>
      </div>
      <div
        class="relative z-10 theme-surface p-4 select-none touch-pan-y cursor-grab active:cursor-grabbing"
        :class="cardTransitionClass"
        :style="cardTransform"
        @click="onCardClick"
        @pointerdown="onPointerDown"
      >
        <div class="flex items-start gap-3 -mt-2">
          <div
            class="min-w-9 h-9 max-w-[3.25rem] px-1 rounded-full theme-soft text-[#e8735a] flex items-center justify-center text-xs font-bold tabular-nums shrink-0 leading-none mt-0.5"
          >
            {{ rowNumber }}
          </div>
          <div class="flex-1 min-w-0 min-h-0">
            <div class="text-base font-bold theme-text leading-relaxed">
              <template v-if="item.tokens && item.tokens.length">
                <span
                  v-for="(tk, i) in item.tokens"
                  :key="i"
                  class="inline-block transition-colors duration-200 border-b"
                  :class="[
                    highlightIndices.has(i)
                      ? 'text-[#c45a3e] bg-[#e8735a]/10 rounded-t px-[2px] border-[#e8735a]/40'
                      : 'border-[#e8735a]/15',
                    i > 0 ? 'ml-[5px]' : ''
                  ]"
                >{{ tk }}</span>
              </template>
              <template v-else>{{ item.word }}</template>
            </div>
            <div class="text-sm theme-muted">{{ item.reading }}</div>
            <div class="text-sm theme-text mt-0.5">{{ localMeaning(item, currentLang) }}</div>
            <div v-if="item.grammar && item.grammar.length" class="flex flex-wrap gap-1 mt-1.5">
              <button
                v-for="g in item.grammar"
                :key="g.pattern"
                type="button"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] leading-tight border cursor-pointer transition-colors"
                :class="expandedGrammar?.pattern === g.pattern
                  ? 'bg-[#e8735a]/15 border-[#e8735a]/40 text-[#c45a3e]'
                  : 'theme-soft border-transparent theme-muted hover:border-[#e8735a]/30'"
                @click="onGrammarTag(g, $event)"
              >
                <span class="font-medium">{{ g.pattern }}</span>
                <span class="opacity-60">{{ g.level }}</span>
              </button>
            </div>
            <div
              v-if="expandedGrammar"
              class="mt-1 px-2 py-1.5 rounded-lg text-xs leading-relaxed theme-soft"
              @click.stop
            >
              <span class="font-medium text-[#c45a3e]">{{ expandedGrammar.pattern }}</span>
              <span class="theme-muted ml-1">{{ expandedGrammar.level }}</span>
              <div class="mt-0.5 theme-text">{{ currentLang === 'en' ? expandedGrammar.noteEn : expandedGrammar.note }}</div>
            </div>
            <div v-if="item.example" class="text-xs theme-muted mt-1 leading-relaxed">
              {{ item.example }}
              <br v-if="item.exampleCn" />
              <span v-if="item.exampleCn" class="text-[#5b8a72]">{{ item.exampleCn }}</span>
            </div>
          </div>
          <div class="flex flex-col items-end shrink-0 gap-2">
            <div
              class="theme-muted text-[10px] leading-tight tabular-nums text-right whitespace-nowrap pointer-events-none"
            >
              {{ statsLine }}
            </div>
            <button
              type="button"
              class="w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all border-[#e8e2dc] theme-surface text-[#e8735a] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[#e8735a] hover:shadow-[0_4px_12px_rgba(232,115,90,0.2)] active:scale-[0.96]"
              :aria-label="t('listPlayFromHere')"
              @pointerdown.stop
              @click.stop="onPlayListFromRow"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
