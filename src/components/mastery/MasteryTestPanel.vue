<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../../stores/app'
import { quizQueueTick } from '@/learning'
import { useMasteryTest } from '../../composables/useMasteryTest'
import { useJaSpeechRecognition } from '../../composables/useJaSpeechRecognition'
import { speakLoop, stopLoop, looping } from '../../composables/useAudio'
import { useLang } from '@/i18n'
import { speechMatchesVocab } from '@/utils/jpSpeechMatch'
import QuizCard from '../quiz/QuizCard.vue'
import QuizActions from '../quiz/QuizActions.vue'

const { t } = useLang()
const {
  supported: sttSupported,
  listening: sttListening,
  interimText: sttInterim,
  lastFinalText: sttFinal,
  lastError: sttLastError,
  start: startJaStt,
  abortListening: abortJaStt,
  resetSessionText: resetJaStt,
} = useJaSpeechRecognition()
const lastHeard = ref('')
const sttMismatch = ref(false)
const store = useAppStore()
const {
  items,
  index,
  isAnswered,
  mode,
  currentItem,
  hasItems,
  rebuildItems,
  showAnswer,
  speakCurrent,
  pass,
  fail,
  setMode,
} = useMasteryTest()

watch(
  () => store.isDataLoaded,
  (ok) => {
    if (ok) rebuildItems()
  },
  { immediate: true },
)

watch(quizQueueTick, () => rebuildItems())

watch([index, mode], () => {
  abortJaStt()
  resetJaStt()
  lastHeard.value = ''
  sttMismatch.value = false
  if (mode.value === 'audio' && !isAnswered.value && currentItem.value) {
    setTimeout(() => speakCurrent(), 300)
  }
})

watch(isAnswered, (answered) => {
  if (answered) {
    abortJaStt()
    resetJaStt()
    lastHeard.value = ''
    sttMismatch.value = false
  }
})

const sttLiveText = computed(() => {
  const f = sttFinal.value
  const i = sttInterim.value
  return (f + i).trim()
})

const sttErrorHint = computed(() => {
  const e = sttLastError.value
  if (!e || e === 'aborted') return ''
  if (e === 'not-allowed') return t('sttDenied')
  return t('sttError')
})

function onSttDone(full: string) {
  lastHeard.value = full
  const item = currentItem.value
  if (!item || isAnswered.value) return
  if (!full) {
    sttMismatch.value = false
    return
  }
  if (speechMatchesVocab(full, item)) {
    sttMismatch.value = false
    showAnswer()
  } else {
    sttMismatch.value = true
  }
}

function startStt() {
  sttMismatch.value = false
  startJaStt(onSttDone)
}

function toggleLoop() {
  if (looping.value) {
    stopLoop()
  } else {
    const it = currentItem.value
    if (it) speakLoop(it.word, it.example)
  }
}

const progressText = computed(() => {
  const n = items.value.length
  if (!n) return t('masteryEmptyQueue')
  return `${index.value + 1} / ${n}`
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-4 py-6">
    <p class="text-xs theme-muted text-center max-w-[22rem] leading-relaxed">
      {{ t('masteryIntro') }}
    </p>

    <div class="flex gap-2 w-full max-w-[400px]">
      <button
        v-for="m in (['word', 'audio', 'meaning'] as const)"
        :key="m"
        type="button"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-all border-2"
        :class="mode === m
          ? 'border-[#e8735a] bg-[#e8735a] text-white'
          : 'theme-surface theme-muted hover:border-[#e8735a]'"
        @click="setMode(m)"
      >
        {{ t('quizMode_' + m) }}
      </button>
    </div>

    <div class="text-sm theme-muted font-medium text-center px-1">{{ progressText }}</div>

    <QuizCard
      :item="currentItem"
      :is-answered="isAnswered"
      :mode="mode"
      @speak="speakCurrent"
      @card-click="speakCurrent"
    />

    <div
      v-if="hasItems && !isAnswered"
      class="w-full max-w-[400px] flex flex-col gap-2 text-sm"
    >
      <p v-if="!sttSupported" class="text-xs theme-muted text-center leading-relaxed">
        {{ t('sttNotSupported') }}
      </p>
      <template v-else>
        <div class="flex gap-2 items-stretch">
          <button
            type="button"
            class="flex-1 min-h-[44px] py-2 px-3 rounded-[10px] text-sm font-medium transition-all border-2 theme-surface theme-muted hover:border-[#e8735a] disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="sttListening"
            @click="startStt"
          >
            {{ sttListening ? t('sttListening') : t('sttStart') }}
          </button>
          <button
            v-if="sttListening"
            type="button"
            class="shrink-0 min-w-[5rem] py-2 px-3 rounded-[10px] text-sm font-medium border-2 theme-surface theme-muted hover:border-[#e8735a]"
            @click="abortJaStt()"
          >
            {{ t('sttStop') }}
          </button>
        </div>
        <p v-if="sttListening && sttLiveText" class="text-xs theme-muted break-words">
          {{ t('sttHeard') }}：{{ sttLiveText }}
        </p>
        <p v-else-if="lastHeard" class="text-xs theme-muted break-words">
          {{ t('sttHeard') }}：{{ lastHeard }}
        </p>
        <p v-if="sttMismatch" class="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
          {{ t('sttMismatch') }}
        </p>
        <p v-if="sttErrorHint" class="text-xs text-red-600 dark:text-red-400/90">
          {{ sttErrorHint }}
        </p>
      </template>
    </div>

    <button
      v-if="hasItems && !isAnswered"
      type="button"
      class="w-full max-w-[400px] py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-base font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
      @click="showAnswer"
    >
      {{ t('showAnswer') }}
    </button>

    <QuizActions
      :visible="isAnswered && hasItems"
      :is-looping="looping"
      correct-key="masteryPassBtn"
      wrong-key="masteryFailBtn"
      tip-key="masteryQuizTip"
      @correct="pass"
      @wrong="fail"
      @loop="toggleLoop"
    />
  </div>
</template>
