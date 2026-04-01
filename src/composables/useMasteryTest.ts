import { ref, computed } from 'vue'
import { useAppStore, type DataItem } from '../stores/app'
import type { VocabItem } from '../types'
import {
  getQuizQueueKeys,
  removeFromQuizQueue,
  markMasteryQuizPassed,
  parseItemKey,
} from '@/learning'
import { speakWithExample, stopLoop } from './useAudio'
import type { QuizMode } from './useQuiz'

type QueueItem = VocabItem & { _cat: string }

const items = ref<QueueItem[]>([])
const index = ref(0)
const isAnswered = ref(false)
const mode = ref<QuizMode>((localStorage.getItem('jp_mastery_quiz_mode') as QuizMode) || 'word')

function rebuildItems() {
  const store = useAppStore()
  if (!store.isDataLoaded) return
  const next: QueueItem[] = []
  for (const k of getQuizQueueKeys()) {
    const p = parseItemKey(k)
    if (!p) continue
    const list = store.data[p.cat as 'nouns' | 'sentences']
    if (!Array.isArray(list)) continue
    const it = (list as DataItem[]).find((x) => x.id === p.id)
    if (it) next.push({ ...it, _cat: p.cat })
    else removeFromQuizQueue(p.cat, p.id)
  }
  items.value = next
  if (index.value >= next.length) index.value = Math.max(0, next.length - 1)
}

const currentItem = computed(() => items.value[index.value] ?? null)
const hasItems = computed(() => items.value.length > 0)

function showAnswer() {
  isAnswered.value = true
}

function speakCurrent() {
  const it = currentItem.value
  if (!it) return
  speakWithExample(it.word, it.example)
}

/** 通过：记入掌握、移出队列 */
function pass() {
  stopLoop()
  const it = currentItem.value
  if (!it) return
  markMasteryQuizPassed(it._cat, it.id)
  removeFromQuizQueue(it._cat, it.id)
  rebuildItems()
  if (index.value >= items.value.length) index.value = Math.max(0, items.value.length - 1)
  isAnswered.value = false
}

/** 未通过：仅下一题，仍留在队列 */
function fail() {
  stopLoop()
  isAnswered.value = false
  if (!items.value.length) return
  index.value = (index.value + 1) % items.value.length
}

function setMode(m: QuizMode) {
  mode.value = m
  localStorage.setItem('jp_mastery_quiz_mode', m)
}

export function useMasteryTest() {
  return {
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
  }
}
