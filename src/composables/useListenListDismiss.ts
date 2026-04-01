import { ref } from 'vue'
import { useFirebase } from './useFirebase'
import { setItemMastered } from './useSpacedRepetition'

const STORAGE_KEY = 'jp_listen_dismissed'

const { debouncedSync } = useFirebase()

/** 列表重渲染用 */
export const listenDismissTick = ref(0)

function readDismissed(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeDismissed(r: Record<string, true>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
  debouncedSync()
}

function itemKey(cat: string, id: number) {
  return `${cat}:${id}`
}

export function isListenDismissed(cat: string, id: number): boolean {
  return !!readDismissed()[itemKey(cat, id)]
}

/** 听清了：标记掌握并从听列表隐藏 */
export function listenDismissClear(cat: string, id: number) {
  setItemMastered(cat, id)
  const r = readDismissed()
  r[itemKey(cat, id)] = true
  writeDismissed(r)
  listenDismissTick.value++
}

/** 删除：仅从听列表隐藏，不影响练习计数 */
export function listenDismissHideOnly(cat: string, id: number) {
  const r = readDismissed()
  r[itemKey(cat, id)] = true
  writeDismissed(r)
  listenDismissTick.value++
}
