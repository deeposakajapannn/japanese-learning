export interface VocabItem {
  id: number
  word: string
  reading: string
  meaning: string
  meaningEn?: string
  example?: string
  exampleCn?: string
  topic?: string
}

export interface VocabItemWithCat extends VocabItem {
  _cat: CategoryKey
}

export type CategoryKey = 'nouns' | 'sentences'
export type ModeKey = 'list' | 'practice' | 'stats'
export type LangKey = 'zh' | 'en'

export interface DayStats {
  studied: number
  quizzed: number
  correct: number
  listened?: number
  wrong: Record<string, number>
}

export type StatsMap = Record<string, DayStats>
export type ItemCounts = Record<string, number>
export type DelayMap = Record<string, string>

export interface AudioMap {
  [text: string]: string
}
