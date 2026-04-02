<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useMenuAnchor } from '@/composables/useMenuAnchor'
import { useAppStore } from '../../stores/app'
import { useQuiz } from '../../composables/useQuiz'
import { getActiveItems } from '../../composables/useSpacedRepetition'
import { quizQueueTick } from '@/learning'
import { speakLoop, stopLoop, looping } from '../../composables/useAudio'
import { useVoiceRecorder } from '../../composables/useVoiceRecorder'
import { useJaSpeechRecognition } from '../../composables/useJaSpeechRecognition'
import { normalizeJpSpeech } from '@/utils/jpSpeechMatch'
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
  quizLevels,
  newBatchKnownCount,
  newBatchSize,
  showAnswer,
  submitAnswer,
  setQuizMode,
  setQuizScope,
  setQuizLevels,
  speakQuizCurrent,
} = useQuiz()

const levelDropdownOpen = ref(false)
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1']

const levelTriggerRef = ref<HTMLElement | null>(null)
const LEVEL_DROPDOWN_Z_BACKDROP = 450
const levelMenuStyle = useMenuAnchor(levelDropdownOpen, levelTriggerRef, { minWidth: 100 })

const levelPanelStyle = computed(() => ({
  ...levelMenuStyle.value,
  borderColor: 'var(--border)',
}))

function closeLevelDropdown() {
  levelDropdownOpen.value = false
}

function toggleLevel(lv: string) {
  const cur = [...quizLevels.value]
  const idx = cur.indexOf(lv)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(lv)
  setQuizLevels(cur)
}

function clearLevels() {
  setQuizLevels([])
  closeLevelDropdown()
}

const showLevelFilter = computed(() => store.currentCat === 'sentences' || store.currentCat === 'mix')

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
  quizQueueTick.value
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
const {
  supported: sttSupported,
  listening: sttListening,
  start: startStt,
  stopListening: stopStt,
} = useJaSpeechRecognition()

const playbackAudio = ref<HTMLAudioElement | null>(null)
const playingBack = ref(false)
const sttResult = ref('')
const sttScore = ref<number | null>(null)

/** 最长公共子序列长度 */
function lcsLen(a: string, b: string): number {
  const m = a.length, n = b.length
  if (!m || !n) return 0
  const prev = new Uint16Array(n + 1)
  const curr = new Uint16Array(n + 1)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1])
    }
    prev.set(curr)
  }
  return curr[n]
}

function calcScore(transcript: string, item: { word: string; reading: string }): number {
  const t = normalizeJpSpeech(transcript)
  if (!t) return 0
  const w = normalizeJpSpeech(item.word)
  const r = normalizeJpSpeech(item.reading)
  const scoreW = w.length ? lcsLen(t, w) / Math.max(t.length, w.length) : 0
  const scoreR = r.length ? lcsLen(t, r) / Math.max(t.length, r.length) : 0
  return Math.round(Math.max(scoreW, scoreR) * 100)
}

function onSttDone(text: string) {
  sttResult.value = text
  if (currentItem.value && text) {
    sttScore.value = calcScore(text, currentItem.value)
  }
}

function onRecordDown() {
  sttResult.value = ''
  sttScore.value = null
  startRecording()
  if (sttSupported.value) startStt(onSttDone)
}

function onRecordUp() {
  if (recording.value) stopRecording()
  if (sttListening.value) stopStt()
}

function playRecording() {
  if (!audioUrl.value) return
  if (playbackAudio.value) {
    playbackAudio.value.pause()
  }
  playingBack.value = true
  playbackAudio.value = new Audio(audioUrl.value)
  playbackAudio.value.onended = () => { playingBack.value = false }
  playbackAudio.value.onerror = () => { playingBack.value = false }
  playbackAudio.value.play()
}

// 切题时清除录音和评分
watch(quizIndex, () => {
  clearRecording()
  if (playbackAudio.value) playbackAudio.value.pause()
  playingBack.value = false
  sttResult.value = ''
  sttScore.value = null
})

// Auto-play audio when entering audio mode question
watch([quizIndex, quizMode], () => {
  if (quizMode.value === 'audio' && !isAnswered.value && currentItem.value) {
    setTimeout(() => speakQuizCurrent(), 300)
  }
})
</script>

<template>
  <!-- 级别筛选（句子）：紧贴分类 tab 下方 -->
  <div v-if="showLevelFilter" class="pb-2 relative">
    <button
      ref="levelTriggerRef"
      type="button"
      class="filter-chip px-3 py-1.5 rounded-full text-[13px] font-medium cursor-pointer whitespace-nowrap"
      :class="quizLevels.length > 0 ? 'filter-chip--on' : 'filter-chip--off'"
      @click="levelDropdownOpen = !levelDropdownOpen"
    >
      {{ quizLevels.length > 0 ? quizLevels.join(' ') : t('levelSelect') }}
      <svg class="inline-block ml-1 -mr-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <Teleport to="body">
      <template v-if="levelDropdownOpen">
        <div
          class="fixed inset-0"
          :style="{
            position: 'fixed',
            inset: 0,
            zIndex: LEVEL_DROPDOWN_Z_BACKDROP,
            background: 'var(--overlay-scrim)',
          }"
          aria-hidden="true"
          @pointerdown.prevent="closeLevelDropdown"
        />
        <div
          class="rounded-xl theme-surface shadow-[0_8px_32px_rgba(0,0,0,0.15)] border py-1"
          :style="levelPanelStyle"
          @pointerdown.stop
        >
          <button
            type="button"
            class="w-full text-left px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#e8735a]/10"
            :class="quizLevels.length === 0 ? 'text-[#e8735a]' : 'theme-text'"
            @click="clearLevels()"
          >
            {{ t('filterNone') }}
          </button>
          <button
            v-for="lv in LEVELS"
            :key="lv"
            type="button"
            class="w-full text-left px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#e8735a]/10 flex items-center gap-2"
            @click="toggleLevel(lv)"
          >
            <svg v-if="quizLevels.includes(lv)" class="shrink-0 text-[#e8735a]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span v-else class="shrink-0 w-[14px]" />
            <span :class="quizLevels.includes(lv) ? 'text-[#e8735a]' : ''">{{ lv }}</span>
          </button>
        </div>
      </template>
    </Teleport>
  </div>

  <div class="flex flex-col items-center gap-4 py-6">
    <!-- 学习过 / 全新的（内部仍用 heard | new 存 localStorage） -->
    <div class="flex gap-2 w-full max-w-[400px]">
      <button
        v-for="s in (['heard', 'new'] as const)"
        :key="s"
        class="flex-1 py-2 rounded-lg text-sm font-medium transition-all border-2"
        :class="quizScope === s
          ? 'btn-grad-accent text-white'
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
          ? 'btn-grad-primary text-white'
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
          ? 'btn-grad-primary btn-grad-primary--pressed text-white scale-[1.02]'
          : 'theme-surface theme-muted hover:border-[#e8735a]'"
        @pointerdown.prevent="onRecordDown"
        @pointerup.prevent="onRecordUp"
        @pointerleave="onRecordUp"
        @contextmenu.prevent
      >
        {{ recording ? t('sttListening') : t('sttHoldToRecord') }}
      </button>
      <span class="shrink-0 text-[10px] theme-muted opacity-60 leading-tight">{{ t('sttChromeTip') }}</span>
      <button
        v-if="audioUrl"
        type="button"
        class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full border-2 cursor-pointer transition-all active:scale-95"
        :class="playingBack
          ? 'border-[#e8735a] text-white bg-[#e8735a]'
          : 'border-[#5b8a72] text-[#5b8a72] bg-transparent hover:bg-[#5b8a72]/10'"
        @click="playRecording"
      >
        <svg v-if="playingBack" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
      </button>
    </div>
    <!-- 语音评分结果 -->
    <div
      v-if="sttScore !== null"
      class="w-full max-w-[400px] rounded-xl px-4 py-3 theme-surface shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
    >
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-xs theme-muted">{{ t('sttHeard') }}</span>
        <span
          class="text-lg font-bold"
          :class="sttScore >= 80 ? 'text-[#5b8a72]' : sttScore >= 50 ? 'text-[#b9793b]' : 'text-[#cf5a4a]'"
        >
          {{ sttScore }}分
        </span>
      </div>
      <div class="text-sm theme-text leading-relaxed">{{ sttResult || '—' }}</div>
      <div
        class="mt-2 h-2 rounded-full overflow-hidden"
        style="background: var(--bg-soft, #eee)"
      >
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="sttScore >= 80 ? 'bg-[#5b8a72]' : sttScore >= 50 ? 'bg-[#b9793b]' : 'bg-[#cf5a4a]'"
          :style="{ width: sttScore + '%' }"
        />
      </div>
    </div>

    <button
      v-if="hasQuizItems && !isAnswered"
      class="w-full max-w-[400px] py-3 rounded-[10px] text-base font-semibold cursor-pointer transition-all btn-grad-primary"
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
