import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { speakWithExample } from './useAudio'
import { recordQuiz } from './useStats'
import { getActiveItems, recordItemSeen, delayItem, getListenedCount } from './useSpacedRepetition'

export type QuizMode = 'word' | 'audio' | 'meaning'

const quizItems = ref<any[]>([])
const quizIndex = ref(0)
const isAnswered = ref(false)
const quizMode = ref<QuizMode>((localStorage.getItem('jp_quiz_mode') as QuizMode) || 'word')

function startQuiz() {
  const store = useAppStore()
  const items = [...getActiveItems(store.currentCat)]
  // Prioritize listened items: sort by listened count desc, then shuffle within each group
  items.sort(() => Math.random() - 0.5) // shuffle first
  items.sort((a, b) => {
    const la = getListenedCount(a._cat || store.currentCat, a.id)
    const lb = getListenedCount(b._cat || store.currentCat, b.id)
    return (lb > 0 ? 1 : 0) - (la > 0 ? 1 : 0) // listened items first
  })
  quizItems.value = items
  quizIndex.value = 0
  isAnswered.value = false
}

function showAnswer() {
  isAnswered.value = true
}

function submitAnswer(correct: boolean) {
  const store = useAppStore()
  const it = quizItems.value[quizIndex.value]
  if (!it) return
  const cat = it._cat || store.currentCat
  recordItemSeen(cat, it.id)
  if (correct) delayItem(cat, it.id, 1)
  recordQuiz(it, correct, cat)
  quizIndex.value++
  isAnswered.value = false
  // Wrap around and reshuffle
  if (quizIndex.value >= quizItems.value.length) {
    quizIndex.value = 0
    quizItems.value.sort(() => Math.random() - 0.5)
    quizItems.value.sort((a, b) => {
      const la = getListenedCount(a._cat || store.currentCat, a.id)
      const lb = getListenedCount(b._cat || store.currentCat, b.id)
      return (lb > 0 ? 1 : 0) - (la > 0 ? 1 : 0)
    })
  }
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

export function useQuiz() {
  return {
    quizItems,
    quizIndex,
    isAnswered,
    quizMode,
    startQuiz,
    showAnswer,
    submitAnswer,
    setQuizMode,
    speakQuizCurrent,
  }
}
