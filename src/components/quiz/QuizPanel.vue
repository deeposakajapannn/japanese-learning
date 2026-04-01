<script setup lang="ts">
import { computed } from 'vue'
import { useQuiz } from '../../composables/useQuiz'
import { speakLoop, stopLoop, looping } from '../../composables/useAudio'
import { useLang } from '@/i18n'

const { t } = useLang()
import QuizCard from './QuizCard.vue'
import QuizActions from './QuizActions.vue'

const { quizItems, quizIndex, isAnswered, showAnswer, submitAnswer, speakQuizCurrent } = useQuiz()

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
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-4 py-6">
    <div class="text-sm text-[#777] font-medium">{{ progressText }}</div>
    <QuizCard
      :item="currentItem"
      :is-answered="isAnswered"
      mode="word"
      @card-click="speakQuizCurrent"
    />
    <button
      v-if="!isAnswered"
      class="w-full max-w-[400px] py-3 rounded-[10px] text-base font-semibold cursor-pointer transition-all btn-grad-primary"
      @click="showAnswer"
    >
      显示答案
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
