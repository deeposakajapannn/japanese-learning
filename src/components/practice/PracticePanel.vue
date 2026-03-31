<script setup lang="ts">
import { computed, watch } from 'vue'
import { useQuiz } from '../../composables/useQuiz'
import { speakLoop, stopLoop, looping } from '../../composables/useAudio'
import { useLang } from '@/i18n'
import QuizCard from '../quiz/QuizCard.vue'
import QuizActions from '../quiz/QuizActions.vue'

const { t } = useLang()
const { quizItems, quizIndex, isAnswered, quizMode, showAnswer, submitAnswer, setQuizMode, speakQuizCurrent } = useQuiz()

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
  if (!quizItems.value.length) return t('allMastered')
  return `${quizIndex.value + 1} / ${quizItems.value.length}`
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

    <div class="text-sm theme-muted font-medium">{{ progressText }}</div>
    <QuizCard
      :item="currentItem"
      :is-answered="isAnswered"
      :mode="quizMode"
      @speak="speakQuizCurrent"
      @card-click="onCardSpeak"
    />
    <button
      v-if="!isAnswered"
      class="w-full max-w-[400px] py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-base font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
      @click="showAnswer"
    >
      {{ t('showAnswer') }}
    </button>
    <QuizActions
      :visible="isAnswered"
      :is-looping="looping"
      @correct="submitAnswer(true)"
      @wrong="submitAnswer(false)"
      @loop="toggleLoop"
    />
  </div>
</template>
