/**
 * 掌握测验候选队列：仅在「练」页、且该词听过≥1 次且练过≥1 次时可加入。
 * 正式测验抽题必须只使用 getQuizQueueKeys()，不得从全量词表抽题。
 */
import { ref } from 'vue'
import { makeItemKey } from './itemKey'
import { useFirebase } from '@/composables/useFirebase'
import { getListenedCount, getItemCount } from '@/composables/useSpacedRepetition'

const STORAGE = 'jp_quiz_queue'

const { debouncedSync } = useFirebase()

/** 列表「加入测验 / 可以测验了」行刷新用 */
export const quizQueueTick = ref(0)

function readStore(): Record<string, number> {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE) || '{}')
    if (!p || typeof p !== 'object' || Array.isArray(p)) return {}
    const out: Record<string, number> = {}
    for (const k of Object.keys(p)) {
      const n = Number(p[k])
      if (k && Number.isFinite(n)) out[k] = n
    }
    return out
  } catch {
    return {}
  }
}

function writeStore(r: Record<string, number>) {
  localStorage.setItem(STORAGE, JSON.stringify(r))
  debouncedSync()
  quizQueueTick.value++
}

/** 同时听过、练过至少各 1 次才可加入测验队列 */
export function canJoinQuizQueue(cat: string, id: number): boolean {
  return getListenedCount(cat, id) > 0 && getItemCount(cat, id) > 0
}

/** 按加入顺序（时间戳升序）返回 cat:id 列表，供测验模块唯一数据源 */
export function getQuizQueueKeys(): string[] {
  const r = readStore()
  return Object.entries(r)
    .sort((a, b) => a[1] - b[1])
    .map(([k]) => k)
}

export function isInQuizQueue(cat: string, id: number): boolean {
  return makeItemKey(cat, id) in readStore()
}

export function addToQuizQueue(cat: string, id: number): void {
  if (!canJoinQuizQueue(cat, id)) return
  const k = makeItemKey(cat, id)
  const r = readStore()
  if (r[k] != null) return
  r[k] = Date.now()
  writeStore(r)
}

/** 移出队列（用户取消或测验结束后可调用） */
export function removeFromQuizQueue(cat: string, id: number): void {
  const k = makeItemKey(cat, id)
  const r = readStore()
  if (!(k in r)) return
  delete r[k]
  writeStore(r)
}

export function getQuizQueueSize(): number {
  return Object.keys(readStore()).length
}
