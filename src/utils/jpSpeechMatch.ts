import type { VocabItem } from '@/types'

/** 口述比对：去空白与常见标点 */
export function normalizeJpSpeech(s: string): string {
  return s
    .trim()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[。．、，,.]/g, '')
}

/** 识别结果是否与词条的「表记」或「读音」匹配（宽松包含） */
export function speechMatchesVocab(transcript: string, item: Pick<VocabItem, 'word' | 'reading'>): boolean {
  const t = normalizeJpSpeech(transcript)
  if (t.length < 1) return false
  const w = normalizeJpSpeech(item.word)
  const r = normalizeJpSpeech(item.reading)
  if (t === w || t === r) return true
  if (w.length >= 2 && (t.includes(w) || w.includes(t))) return true
  if (r.length >= 2 && (t.includes(r) || r.includes(t))) return true
  if (w.length === 1 && t === w) return true
  if (r.length === 1 && t === r) return true
  return false
}
