<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../../stores/app'
import { quizQueueTick } from '@/learning'
import { useMasteryTest } from '../../composables/useMasteryTest'
import { useJaSpeechRecognition } from '../../composables/useJaSpeechRecognition'
import { speakLoop, stopLoop, looping } from '../../composables/useAudio'
import { useLang, currentLang } from '@/i18n'
import { speechMatchesVocab } from '@/utils/jpSpeechMatch'
import { localMeaning } from '@/utils/helpers'

const { t } = useLang()
const lang = computed(() => currentLang.value)
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
const justPassed = ref(false)
const store = useAppStore()
const {
  currentItem,
  isAnswered,
  passedCount,
  totalCount,
  hasItems,
  rebuildItems,
  pickRandom,
  markPassed,
  skip,
  nextAfterPass,
  speakCurrent,
} = useMasteryTest()

watch(
  () => store.isDataLoaded,
  (ok) => {
    if (ok) rebuildItems()
  },
  { immediate: true },
)

watch(quizQueueTick, () => rebuildItems())

watch(() => store.currentCat, () => {
  rebuildItems()
})

watch(currentItem, () => {
  abortJaStt()
  resetJaStt()
  lastHeard.value = ''
  sttMismatch.value = false
  justPassed.value = false
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
    justPassed.value = true
    markPassed()
  } else {
    sttMismatch.value = true
  }
}

function startStt() {
  sttMismatch.value = false
  startJaStt(onSttDone)
}

function handleNext() {
  if (isAnswered.value) {
    nextAfterPass()
  } else {
    skip()
  }
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
  if (totalCount.value === 0 && passedCount.value === 0) return ''
  return t('testProgress').replace('{passed}', String(passedCount.value)).replace('{total}', String(totalCount.value))
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-4 py-6">
    <p class="text-xs theme-muted text-center max-w-[22rem] leading-relaxed">
      {{ t('testIntro') }}
    </p>

    <div v-if="progressText" class="text-sm theme-muted font-medium text-center px-1">{{ progressText }}</div>

    <!-- Card: show word + reading + meaning + example -->
    <div
      v-if="currentItem && hasItems"
      class="w-full max-w-[400px] mx-auto rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] theme-surface p-10 text-center animate-fadeUp"
      :class="isAnswered ? '' : 'cursor-pointer active:scale-[0.98]'"
      @click="speakCurrent"
    >
      <div class="text-3xl font-bold theme-text mb-3">{{ currentItem.word }}</div>
      <div class="text-lg font-semibold mb-2" style="color: var(--primary)">{{ currentItem.reading }}</div>
      <div class="text-xl font-bold theme-text mb-4">{{ localMeaning(currentItem, lang) }}</div>
      <div v-if="currentItem.example" class="text-sm theme-muted leading-relaxed">
        {{ currentItem.example }}
        <br v-if="currentItem.exampleCn" />
        <span v-if="currentItem.exampleCn" class="text-[13px]" style="color: var(--accent)">{{ currentItem.exampleCn }}</span>
      </div>

      <!-- Pass indicator -->
      <div
        v-if="justPassed"
        class="mt-4 py-2 px-4 rounded-xl bg-[#5b8a72]/10 text-[#5b8a72] font-semibold text-sm animate-fadeUp"
      >
        {{ t('testPassed') }}
      </div>
    </div>

    <div v-if="!hasItems" class="text-sm theme-muted text-center py-8">
      {{ t('masteryEmptyQueue') }}
    </div>

    <!-- STT controls -->
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

    <!-- Action buttons -->
    <div v-if="hasItems" class="flex items-center gap-3 w-full max-w-[400px]">
      <button
        v-if="isAnswered"
        type="button"
        class="py-3 px-5 rounded-[10px] border-2 flex items-center justify-center cursor-pointer transition-all"
        :class="looping ? 'border-[#e8735a] bg-[#e8735a] text-white' : 'border-[#e8e2dc] theme-surface hover:border-[#e8735a]'"
        @click="toggleLoop"
      >
        <svg v-if="looping" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 01-4 4H3"/></svg>
      </button>
      <button
        type="button"
        class="flex-1 py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-base font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
        @click="handleNext"
      >
        {{ t('testNext') }}
      </button>
    </div>
  </div>
</template>
