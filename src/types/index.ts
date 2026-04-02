export interface GrammarPoint {
  pattern: string
  level: string
  note: string
  noteEn: string
  highlight?: number[]
}

export interface VocabItem {
  id: number
  word: string
  reading: string
  meaning: string
  meaningEn?: string
  meaningEs?: string
  example?: string
  exampleCn?: string
  topic?: string
  level?: string
  grammar?: GrammarPoint[]
  tokens?: string[]
}

export interface VocabItemWithCat extends VocabItem {
  _cat: CategoryKey
}

export type CategoryKey = 'nouns' | 'sentences' | 'kana' | 'articles'

/** 精读文章：短文或对话，按句分段，含注音与译文；audioKey 可选，对应 audio_map */
export interface ArticleSegment {
  jp: string
  reading: string
  zh: string
  audioKey?: string
}

export interface ArticleDialogueLine extends ArticleSegment {
  speaker: 'A' | 'B'
}

export interface ArticleDialogueSection {
  badge?: string
  headingJa: string
  headingZh: string
  lines: ArticleDialogueLine[]
}

export interface ArticleEssay {
  id: string
  level: string
  format: 'essay'
  titleJa: string
  titleZh: string
  segments: ArticleSegment[]
}

export interface ArticleDialogue {
  id: string
  level: string
  format: 'dialogue'
  titleJa: string
  titleZh: string
  sections: ArticleDialogueSection[]
}

export type ArticleItem = ArticleEssay | ArticleDialogue
export type ModeKey = 'list' | 'practice' | 'test' | 'stats'
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
