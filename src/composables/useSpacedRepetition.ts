import { useAppStore, type DataItem } from '../stores/app'
import { useFirebase } from './useFirebase'

const { debouncedSync } = useFirebase()

export const MASTERED_THRESHOLD = 50

function getItemCounts(): Record<string, number> {
  return JSON.parse(localStorage.getItem('jp_item_counts') || '{}')
}

function saveItemCounts(c: Record<string, number>) {
  localStorage.setItem('jp_item_counts', JSON.stringify(c))
  debouncedSync()
}

export function recordItemSeen(cat: string, id: number): number {
  const c = getItemCounts()
  const key = cat + ':' + id
  c[key] = (c[key] || 0) + 1
  saveItemCounts(c)
  return c[key]
}

export function getActiveItems(cat: string): (DataItem & { _cat?: string })[] {
  const store = useAppStore()
  const c = getItemCounts()
  const delays = getDelays()
  const today = new Date().toISOString().slice(0, 10)

  if (cat === 'mix') {
    const all: (DataItem & { _cat: string })[] = []
    for (const k of ['nouns', 'sentences'] as const) {
      store.data[k].forEach((it: DataItem) => {
        const key = k + ':' + it.id
        if ((c[key] || 0) < MASTERED_THRESHOLD && !(delays[key] > today)) {
          all.push({ ...it, _cat: k })
        }
      })
    }
    // Shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }
    return all
  }

  const items = store.data[cat as keyof typeof store.data]
  if (!items) return []
  return items.filter((it: DataItem) => {
    const key = cat + ':' + it.id
    return (c[key] || 0) < MASTERED_THRESHOLD && !(delays[key] > today)
  })
}

export function isMastered(cat: string, id: number): boolean {
  const c = getItemCounts()
  return (c[cat + ':' + id] || 0) >= MASTERED_THRESHOLD
}

/** 直接标记为已掌握（用于听列表「听清了」等） */
export function setItemMastered(cat: string, id: number) {
  const c = getItemCounts()
  c[cat + ':' + id] = MASTERED_THRESHOLD
  saveItemCounts(c)
}

export function getItemCount(cat: string, id: number): number {
  const c = getItemCounts()
  return c[cat + ':' + id] || 0
}

export function getDelays(): Record<string, string> {
  return JSON.parse(localStorage.getItem('jp_delays') || '{}')
}

function saveDelays(d: Record<string, string>) {
  localStorage.setItem('jp_delays', JSON.stringify(d))
  debouncedSync()
}

export function delayItem(cat: string, id: number, days: number) {
  const d = getDelays()
  const until = new Date()
  until.setDate(until.getDate() + days)
  d[cat + ':' + id] = until.toISOString().slice(0, 10)
  saveDelays(d)
}

// --- Listened items tracking ---
function getListenedItems(): Record<string, number> {
  return JSON.parse(localStorage.getItem('jp_listened') || '{}')
}

function saveListenedItems(l: Record<string, number>) {
  localStorage.setItem('jp_listened', JSON.stringify(l))
  debouncedSync()
}

export function recordItemListened(cat: string, id: number) {
  const l = getListenedItems()
  const key = cat + ':' + id
  l[key] = (l[key] || 0) + 1
  saveListenedItems(l)
}

export function getListenedCount(cat: string, id: number): number {
  const l = getListenedItems()
  return l[cat + ':' + id] || 0
}

export function isDelayed(cat: string, id: number): boolean {
  const d = getDelays()
  const until = d[cat + ':' + id]
  if (!until) return false
  return until > new Date().toISOString().slice(0, 10)
}

export function useSpacedRepetition() {
  return {
    MASTERED_THRESHOLD,
    recordItemSeen,
    getActiveItems,
    isMastered,
    getItemCount,
    delayItem,
    getDelays,
    isDelayed,
    recordItemListened,
    getListenedCount,
  }
}
