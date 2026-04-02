import { ref, computed, watch } from 'vue'
import { useAppStore } from '../stores/app'
import { speakWithExample, stopLoop } from './useAudio'
import { recordQuiz } from './useStats'
import { makeItemKey, parseItemKey } from '@/learning/itemKey'
import { isInQuizQueue, quizQueueTick } from '@/learning'
import { markPracticeAnswerKnown, markPracticeAnswerUnknown, milestoneStateTick, hasMasteryQuizPassed } from '@/learning/milestones'
import {
  getActiveItems,
  getQuizProgressSnapshot,
  snapIsListenedToday,
  snapListenCount,
  snapItemCount,
  type QuizProgressSnapshot,
} from './useSpacedRepetition'
import { quiz as quizThresholds } from '@/config/thresholds'

export type QuizMode = 'word' | 'audio' | 'meaning'
export type QuizScope = 'heard' | 'new'

const NEW_BATCH_SIZE = quizThresholds.newBatchSize

const quizItems = ref<any[]>([])
const quizIndex = ref(0)
const isAnswered = ref(false)
const quizMode = ref<QuizMode>((localStorage.getItem('jp_quiz_mode') as QuizMode) || 'word')
const quizLevels = ref<string[]>([])

function migrateQuizScope(): QuizScope {
  const s = localStorage.getItem('jp_quiz_scope')
  if (s === 'heard' || s === 'new') return s
  if (s === 'today') return 'heard'
  return 'new'
}

const quizScope = ref<QuizScope>(migrateQuizScope())
if (localStorage.getItem('jp_quiz_scope') !== quizScope.value) {
  localStorage.setItem('jp_quiz_scope', quizScope.value)
}

/** 新词本组 key 列表（cat:id） */
const newBatchKeysRef = ref<string[]>([])
/** 本组内点过「认识」的 key */
const newBatchKnown = ref<Record<string, boolean>>({})
/** 上一组（用于抽下一组时优先避开） */
let lastCompletedNewBatchKeys: string[] = []
/** 换分类时清空新词组 */
let lastQuizCategory = ''

function filterByLevel(items: any[]): any[] {
  if (quizLevels.value.length === 0) return items
  return items.filter((it) => it.level && quizLevels.value.includes(it.level))
}

function quizItemKey(it: { _cat?: string; id: number }, cat: string) {
  return makeItemKey(it._cat || cat, it.id)
}

const newBatchKnownCount = computed(() =>
  newBatchKeysRef.value.reduce((n, k) => n + (newBatchKnown.value[k] ? 1 : 0), 0),
)

function isNewBatchComplete(): boolean {
  const keys = newBatchKeysRef.value
  if (!keys.length) return true
  return keys.every((k) => newBatchKnown.value[k])
}

function clearNewBatchState() {
  newBatchKeysRef.value = []
  newBatchKnown.value = {}
  lastCompletedNewBatchKeys = []
}

/** 「学习过」池排序：优先今天听过，再按听过总次、练习次（用快照，避免排序比较器里反复 parse） */
function sortStudiedPool(items: any[], cat: string, snap: QuizProgressSnapshot) {
  const copy = [...items]
  copy.sort(() => Math.random() - 0.5)
  copy.sort((a, b) => {
    const ca = a._cat || cat
    const cb = b._cat || cat
    const ta = snapIsListenedToday(snap, ca, a.id) ? 1 : 0
    const tb = snapIsListenedToday(snap, cb, b.id) ? 1 : 0
    if (tb !== ta) return tb - ta
    const la = snapListenCount(snap, ca, a.id)
    const lb = snapListenCount(snap, cb, b.id)
    if (lb !== la) return lb - la
    return snapItemCount(snap, cb, b.id) - snapItemCount(snap, ca, a.id)
  })
  return copy
}

function sortQuizPool(items: any[], cat: string, snap: QuizProgressSnapshot) {
  const copy = [...items]
  copy.sort(() => Math.random() - 0.5)
  copy.sort((a, b) => {
    const ca = a._cat || cat
    const cb = b._cat || cat
    const sa = snapListenCount(snap, ca, a.id) + snapItemCount(snap, ca, a.id)
    const sb = snapListenCount(snap, cb, b.id) + snapItemCount(snap, cb, b.id)
    return sb - sa
  })
  return copy
}

function keysToItems(keys: string[], cat: string): any[] {
  const pool = new Map(getActiveItems(cat).map((it) => [quizItemKey(it, cat), it]))
  return keys.map((k) => pool.get(k)).filter(Boolean) as any[]
}

function isBrandNewItem(it: { _cat?: string; id: number }, cat: string, snap: QuizProgressSnapshot) {
  const c = it._cat || cat
  return snapListenCount(snap, c, it.id) === 0 && snapItemCount(snap, c, it.id) === 0
}

function pickNewBatch(cat: string, snap: QuizProgressSnapshot) {
  const poolAll = filterByLevel(getActiveItems(cat)).filter((it) => isBrandNewItem(it, cat, snap))
  if (!poolAll.length) {
    newBatchKeysRef.value = []
    newBatchKnown.value = {}
    quizItems.value = []
    return
  }
  const exclude = new Set(lastCompletedNewBatchKeys)
  const shuffled = [...poolAll].sort(() => Math.random() - 0.5)
  let candidates = shuffled.filter((it) => !exclude.has(quizItemKey(it, cat)))
  if (candidates.length < NEW_BATCH_SIZE) {
    candidates = shuffled
  }
  const pick = candidates.slice(0, NEW_BATCH_SIZE)
  newBatchKeysRef.value = pick.map((it) => quizItemKey(it, cat))
  newBatchKnown.value = {}
  quizItems.value = sortQuizPool(pick, cat, snap)
  lastCompletedNewBatchKeys = []
}

function startQuiz() {
  const store = useAppStore()
  const cat = store.currentCat
  const snap = getQuizProgressSnapshot()

  if (quizScope.value === 'new') {
    if (lastQuizCategory && lastQuizCategory !== cat) clearNewBatchState()
  }
  lastQuizCategory = cat

  if (quizScope.value === 'heard') {
    clearNewBatchState()
    let items = filterByLevel([...getActiveItems(cat)]).filter((it) => !isBrandNewItem(it, cat, snap))
    quizItems.value = sortStudiedPool(items, cat, snap)
    quizIndex.value = 0
    isAnswered.value = false
    return
  }

  // new
  const keys = newBatchKeysRef.value
  if (keys.length > 0 && !isNewBatchComplete()) {
    let rebuilt = filterByLevel(keysToItems(keys, cat))
    if (rebuilt.length < keys.length) {
      newBatchKeysRef.value = rebuilt.map((it) => quizItemKey(it, cat))
    }
    if (!rebuilt.length) {
      clearNewBatchState()
      pickNewBatch(cat, snap)
    } else {
      quizItems.value = sortQuizPool(rebuilt, cat, snap)
    }
  } else {
    if (keys.length > 0 && isNewBatchComplete()) {
      lastCompletedNewBatchKeys = [...keys]
    }
    pickNewBatch(cat, snap)
  }
  quizIndex.value = 0
  isAnswered.value = false
}

function setQuizScope(scope: QuizScope) {
  if (quizScope.value === scope) return
  quizScope.value = scope
  localStorage.setItem('jp_quiz_scope', scope)
  if (scope === 'heard') clearNewBatchState()
  startQuiz()
}

function showAnswer() {
  isAnswered.value = true
}

function submitAnswer(correct: boolean) {
  stopLoop()
  const store = useAppStore()
  const it = quizItems.value[quizIndex.value]
  if (!it) return
  const cat = it._cat || store.currentCat
  if (correct) markPracticeAnswerKnown(cat, it.id)
  else markPracticeAnswerUnknown(cat, it.id)
  recordQuiz(it, correct, cat)

  if (quizScope.value === 'new' && correct) {
    const k = quizItemKey(it, cat)
    if (newBatchKeysRef.value.includes(k)) {
      newBatchKnown.value = { ...newBatchKnown.value, [k]: true }
    }
  }

  quizIndex.value++
  isAnswered.value = false

  if (quizIndex.value >= quizItems.value.length) {
    quizIndex.value = 0
    const c = store.currentCat
    const snapAfter = getQuizProgressSnapshot()
    if (quizScope.value === 'new') {
      if (isNewBatchComplete() && newBatchKeysRef.value.length > 0) {
        lastCompletedNewBatchKeys = [...newBatchKeysRef.value]
        pickNewBatch(c, snapAfter)
        quizIndex.value = 0
      } else {
        quizItems.value = sortQuizPool(quizItems.value, c, snapAfter)
      }
    } else {
      quizItems.value = sortQuizPool(quizItems.value, c, snapAfter)
    }
  }
}

function setQuizLevels(levels: string[]) {
  quizLevels.value = levels
  clearNewBatchState()
  startQuiz()
}

function setQuizMode(mode: QuizMode) {
  quizMode.value = mode
  localStorage.setItem('jp_quiz_mode', mode)
}

function speakQuizCurrent() {
  const it = quizItems.value[quizIndex.value]
  if (!it) return
  speakWithExample(it.word, it.example)
}

// 云端同步 / 加入掌握队列后，实时过滤已掌握与「仅在测」队列中的题目
watch([milestoneStateTick, quizQueueTick], () => {
  const store = useAppStore()
  const cat = store.currentCat

  if (newBatchKeysRef.value.length) {
    const nk = newBatchKeysRef.value.filter((k) => {
      const p = parseItemKey(k)
      if (!p) return false
      if (hasMasteryQuizPassed(p.cat, p.id)) return false
      if (isInQuizQueue(p.cat, p.id)) return false
      return true
    })
    if (nk.length !== newBatchKeysRef.value.length) {
      newBatchKeysRef.value = nk
      const known: Record<string, boolean> = {}
      for (const k of nk) {
        if (newBatchKnown.value[k]) known[k] = true
      }
      newBatchKnown.value = known
    }
  }

  const before = quizItems.value.length
  quizItems.value = quizItems.value.filter((it) => {
    const c = it._cat || cat
    return !hasMasteryQuizPassed(c, it.id) && !isInQuizQueue(c, it.id)
  })
  if (quizItems.value.length !== before && quizIndex.value >= quizItems.value.length) {
    quizIndex.value = Math.max(0, quizItems.value.length - 1)
  }
})

export function useQuiz() {
  return {
    quizItems,
    quizIndex,
    isAnswered,
    quizMode,
    quizScope,
    newBatchKnownCount,
    newBatchSize: computed(() => newBatchKeysRef.value.length),
    quizLevels,
    startQuiz,
    setQuizLevels,
    showAnswer,
    submitAnswer,
    setQuizMode,
    setQuizScope,
    speakQuizCurrent,
  }
}
