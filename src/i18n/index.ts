import { ref, computed } from 'vue'
import type { LangKey } from '@/types'
import { messages } from './messages'

export const currentLang = ref<LangKey>((localStorage.getItem('jp_lang') as LangKey) || 'zh')

// Plain function for use in non-reactive contexts (composables, etc.)
export function t(key: string): string {
  return messages[currentLang.value]?.[key] || messages.zh[key] || key
}

export function switchLang(lang: LangKey) {
  currentLang.value = lang
  localStorage.setItem('jp_lang', lang)
}

export function useLang() {
  // Computed messages object that updates when language changes
  const msgs = computed(() => messages[currentLang.value] || messages.zh)

  // Reactive t function — Vue tracks msgs.value access
  const tr = (key: string): string => {
    return msgs.value[key] || messages.zh[key] || key
  }

  return { currentLang, t: tr, switchLang, msgs }
}
