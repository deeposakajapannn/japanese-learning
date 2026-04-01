<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAppStore } from '../../stores/app'
import { useQuiz } from '../../composables/useQuiz'
import { getActiveItems, itemCountsTick, listenedCountsTick } from '../../composables/useSpacedRepetition'
import { speakLoop, stopLoop, looping } from '../../composables/useAudio'
import { canJoinQuizQueue } from '@/learning'
import { useLang } from '@/i18n'
import QuizCard from '../quiz/QuizCard.vue'
import QuizActions from '../quiz/QuizActions.vue'
import ListQuizQueueBar from '../list/ListQuizQueueBar.vue'

const { t } = useLang()
const store = useAppStore()
const {
  quizItems,
  quizIndex,
  isAnswered,
  quizMode,
  quizScope,
  newBatchKnownCount,
  newBatchSize,
  showAnswer,
  submitAnswer,
  setQuizMode,
  setQuizScope,
  speakQuizCurrent,
} = useQuiz()

function onCardSpeak() {
  speakQuizCurrent()
}

function toggleLoop() {
  if (looping.value) {
    stopLoop()
  } else {
    const it = quizItems.value[quizIndex.value]
    if (it) speakLoop(it.word, it.example)
  }
}

const currentItem = computed(() => quizItems.value[quizIndex.value] ?? null)
const progressText = computed(() => {
  if (quizItems.value.length) {
    const base = `${quizIndex.value + 1} / ${quizItems.value.length}`
    if (quizScope.value === 'new' && newBatchSize.value > 0) {
      const sub = t('quizNewBatchKnown')
        .replace('{known}', String(newBatchKnownCount.value))
        .replace('{total}', String(newBatchSize.value))
      return `${base} · ${sub}`
    }
    return base
  }
  if (getActiveItems(store.currentCat).length === 0) return t('allMastered')
  return quizScope.value === 'new' ? t('quizEmptyNew') : t('quizEmptyHeard')
})

const hasQuizItems = computed(() => quizItems.value.length > 0)

/** 听过≥1 且 练过≥1 才可点「加入测验」 */
const quizQueueEligible = computed(() => {
  itemCountsTick.value
  listenedCountsTick.value
  const it = currentItem.value
  if (!it) return false
  const cat = it._cat || store.currentCat
  return canJoinQuizQueue(cat, it.id)
})

// Auto-play audio when entering audio mode question
watch([quizIndex, quizMode], () => {
  if (quizMode.value === 'audio' && !isAnswered.value && currentItem.value) {
    setTimeout(() => speakQuizCurrent(), 300)
  }
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-4 py-6">
    <!-- 学习过 / 全新的（内部仍用 heard | new 存 localStorage） -->
    <div class="flex gap-2 w-full max-w-[400px]">
      <button
        v-for="s in (['heard', 'new'] as const)"
        :key="s"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-all border-2"
        :class="quizScope === s
          ? 'border-[#5b8a72] bg-[#5b8a72] text-white'
          : 'theme-surface theme-muted hover:border-[#5b8a72]'"
        @click="setQuizScope(s)"
      >
        {{ s === 'heard' ? t('quizScopeHeard') : t('quizScopeNew') }}
      </button>
    </div>

    <!-- Mode selector -->
    <div class="flex gap-2 w-full max-w-[400px]">
      <button
        v-for="m in (['word', 'audio', 'meaning'] as const)"
        :key="m"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-all border-2"
        :class="quizMode === m
          ? 'border-[#e8735a] bg-[#e8735a] text-white'
          : 'theme-surface theme-muted hover:border-[#e8735a]'"
        @click="setQuizMode(m)"
      >
        {{ t('quizMode_' + m) }}
      </button>
    </div>

    <div class="text-sm theme-muted font-medium text-center px-1">{{ progressText }}</div>
    <QuizCard
      :item="currentItem"
      :is-answered="isAnswered"
      :mode="quizMode"
      @speak="speakQuizCurrent"
      @card-click="onCardSpeak"
    />
    <button
      v-if="hasQuizItems && !isAnswered"
      class="w-full max-w-[400px] py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-base font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
      @click="showAnswer"
    >
      {{ t('showAnswer') }}
    </button>
    <QuizActions
      :visible="isAnswered && hasQuizItems"
      :is-looping="looping"
      @correct="submitAnswer(true)"
      @wrong="submitAnswer(false)"
      @loop="toggleLoop"
    />
    <ListQuizQueueBar
      v-if="hasQuizItems && currentItem"
      class="w-full max-w-[400px] mx-auto px-1"
      :cat="currentItem._cat || store.currentCat"
      :id="currentItem.id"
      :eligible="quizQueueEligible"
    />
  </div>
</template>
