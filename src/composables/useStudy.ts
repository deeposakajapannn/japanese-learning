import { ref } from 'vue'
import { useAppStore } from '../stores/app'
import { audioEl } from './useAudio'
import { speakWithExample } from './useAudio'
import { recordStudy, recordListenTime } from './useStats'
import { getActiveItems, recordItemSeen, delayItem } from './useSpacedRepetition'

const studyIndex = ref(0)
const isFlipped = ref(false)
const autoRead = ref(false)

let _autoReadTimer: ReturnType<typeof setTimeout> | null = null

function flipCard() {
  isFlipped.value = !isFlipped.value
}

function studyNav(dir: number) {
  const store = useAppStore()
  const items = getActiveItems(store.currentCat)
  if (!items.length) return
  studyIndex.value = (studyIndex.value + dir + items.length) % items.length
  isFlipped.value = false
  const it = items[studyIndex.value]
  recordItemSeen(it._cat || store.currentCat, it.id)
  recordStudy()
}

function markKnown(days: number = 3) {
  const store = useAppStore()
  const items = getActiveItems(store.currentCat)
  if (!items.length) return
  const it = items[studyIndex.value]
  delayItem(it._cat || store.currentCat, it.id, days)
  // Re-render by adjusting index if needed
  const newItems = getActiveItems(store.currentCat)
  if (studyIndex.value >= newItems.length && newItems.length > 0) {
    studyIndex.value = 0
  }
  isFlipped.value = false
}

function speakCurrent() {
  const store = useAppStore()
  const items = getActiveItems(store.currentCat)
  if (!items.length) return
  const it = items[studyIndex.value]
  speakWithExample(it.word, it.example)
}

function stopAutoRead() {
  if (_autoReadTimer) clearTimeout(_autoReadTimer)
  _autoReadTimer = null
  audioEl.onended = null
}

function autoReadCurrent() {
  const store = useAppStore()
  if (!autoRead.value || store.currentMode !== 'practice') return
  const items = getActiveItems(store.currentCat)
  if (!items.length) return
  const it = items[studyIndex.value]
  const fn1 = store.audioMap[it.word]
  if (!fn1) {
    _autoReadTimer = setTimeout(() => {
      studyNav(1)
      autoReadCurrent()
    }, 500)
    return
  }
  // Play word, then flip, then play example, then advance
  audioEl.onended = () => {
    recordListenTime(audioEl.duration)
    if (!autoRead.value) return
    isFlipped.value = true
    _autoReadTimer = setTimeout(() => {
      if (!autoRead.value) return
      if (it.example && store.audioMap[it.example]) {
        audioEl.onended = () => {
          recordListenTime(audioEl.duration)
          if (!autoRead.value) return
          _autoReadTimer = setTimeout(() => {
            studyNav(1)
            autoReadCurrent()
          }, 1200)
        }
        audioEl.src = `${import.meta.env.BASE_URL}audio/` +store.audioMap[it.example]
        audioEl.play().catch(() => {})
      } else {
        _autoReadTimer = setTimeout(() => {
          studyNav(1)
          autoReadCurrent()
        }, 1200)
      }
    }, 500)
  }
  audioEl.src = `${import.meta.env.BASE_URL}audio/` +fn1
  audioEl.play().catch(() => {})
}

function toggleAutoRead() {
  autoRead.value = !autoRead.value
  if (autoRead.value) {
    autoReadCurrent()
  } else {
    stopAutoRead()
  }
}

export function useStudy() {
  return {
    studyIndex,
    isFlipped,
    autoRead,
    flipCard,
    studyNav,
    markKnown,
    speakCurrent,
    toggleAutoRead,
    stopAutoRead,
  }
}
