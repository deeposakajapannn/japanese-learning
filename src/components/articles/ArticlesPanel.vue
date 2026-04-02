<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLang } from '@/i18n'
import { playMainTrack, audioEl } from '@/composables/useAudio'
import type { ArticleItem, ArticleEssay, ArticleDialogue } from '@/types'

const store = useAppStore()
const { t, currentLang } = useLang()

const selectedId = ref<string | null>(null)

/** 连播会话：+1 可丢弃未结束的 onended */
let articlePlaySession = 0

const playingAll = ref(false)
/** 当前正在播的原文（连播时高亮） */
const playingJp = ref<string | null>(null)

const LS_ARTICLE_ZH = 'jp_article_show_zh'
const LS_ARTICLE_READING = 'jp_article_show_reading'

function readStoredBool(key: string, defaultVal: boolean): boolean {
  try {
    if (typeof localStorage === 'undefined') return defaultVal
    const v = localStorage.getItem(key)
    if (v === null) return defaultVal
    return v === '1' || v === 'true'
  } catch {
    return defaultVal
  }
}

const showTranslation = ref(readStoredBool(LS_ARTICLE_ZH, true))
const showReading = ref(readStoredBool(LS_ARTICLE_READING, true))

watch(showTranslation, (v) => {
  try {
    localStorage.setItem(LS_ARTICLE_ZH, v ? '1' : '0')
  } catch {
    /* ignore */
  }
})
watch(showReading, (v) => {
  try {
    localStorage.setItem(LS_ARTICLE_READING, v ? '1' : '0')
  } catch {
    /* ignore */
  }
})

const list = computed(() => store.articles)

const selected = computed(() => {
  if (!selectedId.value) return null
  return list.value.find((a) => a.id === selectedId.value) ?? null
})

/** 当前篇按顺序的朗读单元（用于连播） */
const playbackUnits = computed(() => {
  const it = selected.value
  if (!it) return [] as { jp: string }[]
  if (it.format === 'essay') {
    return it.segments.map((s) => ({ jp: s.jp }))
  }
  const out: { jp: string }[] = []
  for (const sec of it.sections) {
    for (const line of sec.lines) {
      out.push({ jp: line.jp })
    }
  }
  return out
})

const canPlayAll = computed(() =>
  playbackUnits.value.some((u) => !!store.audioMap[u.jp]),
)

function invalidateArticlePlayback() {
  articlePlaySession++
  playingAll.value = false
  playingJp.value = null
  audioEl.pause()
  audioEl.onended = null
}

function playAllSequential() {
  invalidateArticlePlayback()
  const session = articlePlaySession
  const units = playbackUnits.value
  let i = 0
  function next() {
    if (session !== articlePlaySession) return
    while (i < units.length && !store.audioMap[units[i].jp]) {
      i++
    }
    if (i >= units.length) {
      invalidateArticlePlayback()
      return
    }
    const jp = units[i].jp
    playingJp.value = jp
    playingAll.value = true
    i++
    const fn = store.audioMap[jp]
    const base = import.meta.env.BASE_URL
    audioEl.onended = () => {
      if (session !== articlePlaySession) return
      next()
    }
    playMainTrack(`${base}audio/${fn}`, () => {
      if (session !== articlePlaySession) return
      next()
    })
  }
  next()
}

function openItem(id: string) {
  selectedId.value = id
}

function back() {
  invalidateArticlePlayback()
  selectedId.value = null
}

watch(selectedId, () => {
  invalidateArticlePlayback()
})

function formatLabel(it: ArticleItem) {
  const kind = it.format === 'essay' ? t('articleKindEssay') : t('articleKindDialogue')
  return `${it.level} · ${kind}`
}

function isEssay(it: ArticleItem | null): it is ArticleEssay {
  return it !== null && it.format === 'essay'
}

function isDialogue(it: ArticleItem | null): it is ArticleDialogue {
  return it !== null && it.format === 'dialogue'
}

function linePlaying(jp: string) {
  return playingAll.value && playingJp.value === jp
}

onUnmounted(() => {
  invalidateArticlePlayback()
})
</script>

<template>
  <div class="px-4 pb-24 md:px-10 md:max-w-[720px] md:mx-auto">
    <!-- 列表 -->
    <div v-if="!selected" class="space-y-3 pt-1">
      <p class="text-sm theme-muted mb-3">{{ t('articleIntro') }}</p>
      <button
        v-for="it in list"
        :key="it.id"
        type="button"
        class="w-full text-left rounded-2xl theme-surface shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-4 transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:scale-[0.99] cursor-pointer border-0"
        @click="openItem(it.id)"
      >
        <div class="text-xs font-medium theme-muted mb-1">{{ formatLabel(it) }}</div>
        <div class="text-base font-bold theme-text leading-snug">{{ it.titleJa }}</div>
        <div v-if="currentLang === 'zh'" class="text-sm mt-1" style="color: var(--accent)">{{ it.titleZh }}</div>
        <div v-else class="text-sm mt-1 theme-muted">{{ it.titleZh }}</div>
      </button>
      <p v-if="!list.length" class="text-sm theme-muted py-8 text-center">{{ t('articleEmpty') }}</p>
    </div>

    <!-- 详情 -->
    <div v-else class="pt-1">
      <button
        type="button"
        class="mb-4 text-sm font-medium theme-muted hover:theme-text cursor-pointer border-0 bg-transparent px-0"
        @click="back"
      >
        ← {{ t('articleBack') }}
      </button>

      <header class="mb-6">
        <h1 class="text-xl font-bold theme-text leading-snug">{{ selected!.titleJa }}</h1>
        <template v-if="showTranslation">
          <p v-if="currentLang === 'zh'" class="text-base mt-2" style="color: var(--accent)">{{ selected!.titleZh }}</p>
          <p v-else class="text-base mt-2 theme-muted">{{ selected!.titleZh }}</p>
        </template>

        <div class="flex flex-wrap items-center gap-2 mt-4">
          <button
            type="button"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer"
            :class="
              showTranslation
                ? 'bg-[#e8735a]/15 border-[#e8735a]/40 text-[#c45a3e]'
                : 'theme-muted border-[var(--border)] bg-transparent opacity-90'
            "
            :aria-pressed="showTranslation"
            @click="showTranslation = !showTranslation"
          >
            {{ t('articleToggleTranslation') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer"
            :class="
              showReading
                ? 'bg-[#e8735a]/15 border-[#e8735a]/40 text-[#c45a3e]'
                : 'theme-muted border-[var(--border)] bg-transparent opacity-90'
            "
            :aria-pressed="showReading"
            @click="showReading = !showReading"
          >
            {{ t('articleToggleReading') }}
          </button>
          <template v-if="canPlayAll">
            <button
              v-if="!playingAll"
              type="button"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer theme-muted border-[var(--border)] bg-transparent hover:theme-text"
              @click="playAllSequential"
            >
              {{ t('articlePlayAll') }}
            </button>
            <button
              v-else
              type="button"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer bg-[#e8735a]/15 border-[#e8735a]/40 text-[#c45a3e]"
              @click="invalidateArticlePlayback()"
            >
              {{ t('articleStopPlayback') }}
            </button>
          </template>
        </div>
      </header>

      <!-- 短文：连续正文，段与段之间仅留白（数据里一段即自然段） -->
      <article
        v-if="isEssay(selected)"
        class="relative rounded-2xl theme-surface p-5 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
      >
        <span
          class="pointer-events-none absolute top-3 right-4 z-[1] text-[9px] font-medium tabular-nums leading-none theme-muted opacity-[0.38] md:top-4 md:right-5 md:text-[10px]"
          aria-hidden="true"
          >{{ selected.level }}</span>
        <div class="space-y-6">
          <div
            v-for="(seg, i) in selected.segments"
            :key="i"
            class="transition-colors rounded-md -mx-0.5 px-0.5 py-0.5"
            :class="linePlaying(seg.jp) ? 'bg-[#e8735a]/10' : ''"
          >
            <p class="text-[15px] font-medium theme-text leading-relaxed">{{ seg.jp }}</p>
            <p v-if="showReading" class="text-sm theme-muted mt-2 leading-relaxed">{{ seg.reading }}</p>
            <template v-if="showTranslation">
              <p v-if="currentLang === 'zh'" class="text-sm mt-3 leading-relaxed" style="color: var(--accent)">{{ seg.zh }}</p>
              <p v-else class="text-sm mt-3 leading-relaxed theme-muted">{{ seg.zh }}</p>
            </template>
          </div>
        </div>
      </article>

      <!-- 对话：同一张卡片内连续排版，小节之间留白；句与句不再画线分隔 -->
      <article
        v-else-if="isDialogue(selected)"
        class="relative rounded-2xl theme-surface p-5 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] space-y-10"
      >
        <span
          class="pointer-events-none absolute top-3 right-4 z-[1] text-[9px] font-medium tabular-nums leading-none theme-muted opacity-[0.38] md:top-4 md:right-5 md:text-[10px]"
          aria-hidden="true"
          >{{ selected.level }}</span>
        <section v-for="(sec, si) in selected.sections" :key="si" class="space-y-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span v-if="sec.badge" class="text-lg" aria-hidden="true">{{ sec.badge }}</span>
            <span class="text-sm font-semibold theme-text">{{ sec.headingJa }}</span>
            <span v-if="showTranslation && currentLang === 'zh'" class="text-xs theme-muted">（{{ sec.headingZh }}）</span>
          </div>
          <div
            v-for="(line, li) in sec.lines"
            :key="li"
            class="transition-colors rounded-md -mx-0.5 px-0.5 py-0.5"
            :class="linePlaying(line.jp) ? 'bg-[#e8735a]/10' : ''"
          >
            <div class="text-xs font-bold mb-0.5" style="color: var(--primary)">{{ line.speaker }}</div>
            <p class="text-[15px] theme-text leading-relaxed">{{ line.jp }}</p>
            <p v-if="showReading" class="text-sm theme-muted mt-1 leading-relaxed">{{ line.reading }}</p>
            <template v-if="showTranslation">
              <p v-if="currentLang === 'zh'" class="text-sm mt-2" style="color: var(--accent)">{{ line.zh }}</p>
              <p v-else class="text-sm mt-2 theme-muted">{{ line.zh }}</p>
            </template>
          </div>
        </section>
      </article>
    </div>
  </div>
</template>
