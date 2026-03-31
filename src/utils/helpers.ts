export function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function generateId(): string {
  const words = ['sakura','kaze','yama','umi','sora','hana','tsuki','hoshi','kumo','ame','yuki','mori','kawa','take','ishi']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return word + '-' + num
}

export function localMeaning(item: { meaning: string; meaningEn?: string }, lang: string): string {
  if (lang === 'en' && item.meaningEn) return item.meaningEn
  return item.meaning
}

export function formatListenTime(sec: number, t: (k: string) => string): string {
  sec = Math.round(sec || 0)
  if (sec < 60) return sec + t('sec')
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return m + t('min') + (s > 0 ? s + t('sec') : '')
  const h = Math.floor(m / 60)
  return h + t('hour') + (m % 60) + t('min')
}
