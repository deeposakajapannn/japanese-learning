<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useAppStore } from '../../stores/app'
import { useQuiz } from '../../composables/useQuiz'
import { getActiveItems } from '../../composables/useSpacedRepetition'
import { speakLoop, stopLoop, looping } from '../../composables/useAudio'
import { useVoiceRecorder } from '../../composables/useVoiceRecorder'
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

const { recording, audioUrl, startRecording, stopRecording, clearRecording } = useVoiceRecorder()
const playbackAudio = ref<HTMLAudioElement | null>(null)

function onRecordDown() {
  startRecording()
}

function onRecordUp() {
  if (recording.value) stopRecording()
}

function playRecording() {
  if (!audioUrl.value) return
  if (playbackAudio.value) {
    playbackAudio.value.pause()
  }
  playbackAudio.value = new Audio(audioUrl.value)
  playbackAudio.value.play()
}

// 切题时清除录音
watch(quizIndex, () => {
  clearRecording()
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
    <!-- 录音 + 回放 -->
    <div v-if="hasQuizItems" class="w-full max-w-[400px] flex items-center gap-2">
      <button
        type="button"
        class="flex-1 min-h-[44px] py-2 px-3 rounded-[10px] text-sm font-medium transition-all border-2 select-none"
        :class="recording
          ? 'border-[#e8735a] bg-[#e8735a] text-white scale-[1.02]'
          : 'theme-surface theme-muted hover:border-[#e8735a]'"
        @pointerdown.prevent="onRecordDown"
        @pointerup.prevent="onRecordUp"
        @pointerleave="onRecordUp"
        @contextmenu.prevent
      >
        {{ recording ? t('sttListening') : t('sttHoldToRecord') }}
      </button>
      <button
        v-if="audioUrl"
        type="button"
        class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#5b8a72] text-[#5b8a72] bg-transparent cursor-pointer transition-all hover:bg-[#5b8a72]/10 active:scale-95"
        @click="playRecording"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
      </button>
    </div>

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
    />
  </div>
</template>
