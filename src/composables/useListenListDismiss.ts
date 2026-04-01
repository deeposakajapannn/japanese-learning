import { ref } from 'vue'
import { makeItemKey } from '@/learning/itemKey'
import { useFirebase } from './useFirebase'

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

export function isListenDismissed(cat: string, id: number): boolean {
  return !!readDismissed()[makeItemKey(cat, id)]
}

/** 听清了：从听列表隐藏（不改动练习/听过计数） */
export function listenDismissClear(cat: string, id: number) {
  const r = readDismissed()
  r[makeItemKey(cat, id)] = true
  writeDismissed(r)
  listenDismissTick.value++
}
