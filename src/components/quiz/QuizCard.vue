<script setup lang="ts">
import { computed } from 'vue'
import type { VocabItem } from '../../types'
import type { QuizMode } from '../../composables/useQuiz'
import { useLang, currentLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

const { t } = useLang()
const lang = computed(() => currentLang.value)

defineProps<{
  item: VocabItem | null
  isAnswered: boolean
  mode: QuizMode
}>()

defineEmits<{
  speak: []
}>()
</script>

<template>
  <div class="w-full max-w-[400px] mx-auto rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] bg-white p-10 text-center animate-fadeUp">
    <!-- MODE: word (original) — show Japanese word, recall meaning + reading -->
    <template v-if="mode === 'word'">
      <div class="text-3xl font-bold text-[#2d2d2d] mb-4">{{ item?.word ?? '' }}</div>
      <div v-if="!isAnswered" class="flex items-center justify-center gap-2 text-sm text-[#777]">
        <span>{{ t('quizHintWord') }}</span>
        <button
          class="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#e8e2dc] bg-white text-base cursor-pointer transition-all hover:border-[#e8735a]"
          @click.stop="$emit('speak')"
        >🔊</button>
      </div>
    </template>

    <!-- MODE: audio — play audio only, recall word + meaning -->
    <template v-if="mode === 'audio'">
      <div v-if="!isAnswered" class="flex flex-col items-center gap-4">
        <button
          class="w-20 h-20 rounded-full border-2 border-[#e8735a] bg-[#fff5f3] text-3xl cursor-pointer transition-all hover:bg-[#fce8e4] active:scale-95"
          @click.stop="$emit('speak')"
        >🔊</button>
        <span class="text-sm text-[#777]">{{ t('quizHintAudio') }}</span>
      </div>
    </template>

    <!-- MODE: meaning — show Chinese meaning, recall Japanese word + reading -->
    <template v-if="mode === 'meaning'">
      <div v-if="!isAnswered">
        <div class="text-2xl font-bold text-[#5b8a72] mb-3">{{ item ? localMeaning(item, lang) : '' }}</div>
        <div class="text-sm text-[#777]">{{ t('quizHintMeaning') }}</div>
      </div>
    </template>

    <!-- ANSWER (all modes) -->
    <template v-if="isAnswered && item">
      <div v-if="mode !== 'word'" class="text-3xl font-bold text-[#2d2d2d] mb-2">{{ item.word }}</div>
      <div class="text-lg text-[#e8735a] font-semibold mb-2">{{ item.reading }}</div>
      <div class="text-xl font-bold text-[#2d2d2d] mb-4">{{ localMeaning(item, lang) }}</div>
      <div v-if="item.example" class="text-sm text-[#777] leading-relaxed">
        {{ item.example }}
        <br v-if="item.exampleCn" />
        <span v-if="item.exampleCn" class="text-[#5b8a72] text-[13px]">{{ item.exampleCn }}</span>
      </div>
      <button
        v-if="mode !== 'word'"
        class="mt-4 inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#e8e2dc] bg-white text-lg cursor-pointer transition-all hover:border-[#e8735a]"
        @click.stop="$emit('speak')"
      >🔊</button>
    </template>
  </div>
</template>
