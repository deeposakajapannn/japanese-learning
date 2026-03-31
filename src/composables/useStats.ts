import { ref } from 'vue'
import { useFirebase } from './useFirebase'

const { debouncedSync } = useFirebase()

/** Bump this to trigger reactive re-reads of stats */
export const statsVersion = ref(0)

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getStats(): Record<string, any> {
  return JSON.parse(localStorage.getItem('jp_stats') || '{}')
}

export function saveStats(s: Record<string, any>) {
  localStorage.setItem('jp_stats', JSON.stringify(s))
  statsVersion.value++
  debouncedSync()
}

export function recordStudy() {
  const s = getStats()
  const d = todayKey()
  if (!s[d]) s[d] = { studied: 0, quizzed: 0, correct: 0, wrong: {} }
  s[d].studied++
  saveStats(s)
}

export function recordQuiz(item: { id: number }, correct: boolean, cat: string) {
  const s = getStats()
  const d = todayKey()
  if (!s[d]) s[d] = { studied: 0, quizzed: 0, correct: 0, wrong: {} }
  s[d].quizzed++
  if (correct) {
    s[d].correct++
  } else {
    const key = cat + ':' + item.id
    s[d].wrong[key] = (s[d].wrong[key] || 0) + 1
  }
  saveStats(s)
}

export function recordListenTime(seconds: number) {
  if (!seconds || !isFinite(seconds)) return
  const s = getStats()
  const d = todayKey()
  if (!s[d]) s[d] = { studied: 0, quizzed: 0, correct: 0, wrong: {} }
  s[d].listened = Math.round(((s[d].listened || 0) + seconds) * 10) / 10
  saveStats(s)
}

export function useStats() {
  return {
    recordStudy,
    recordQuiz,
    recordListenTime,
    getStats,
    saveStats,
    todayKey,
  }
}
