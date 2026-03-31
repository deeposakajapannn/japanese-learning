<script setup lang="ts">
import { computed } from 'vue'
import { useQuiz } from '../../composables/useQuiz'
import { useLang } from '@/i18n'

const { t } = useLang()
import QuizCard from './QuizCard.vue'
import QuizActions from './QuizActions.vue'

const { quizItems, quizIndex, isAnswered, showAnswer, submitAnswer, speakQuizCurrent } = useQuiz()

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
    />
    <button
      v-if="!isAnswered"
      class="w-full max-w-[400px] py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-base font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
      @click="showAnswer"
    >
      显示答案
    </button>
    <QuizActions
      :visible="isAnswered"
      @correct="submitAnswer(true)"
      @wrong="submitAnswer(false)"
      @speak="speakQuizCurrent"
    />
  </div>
</template>
