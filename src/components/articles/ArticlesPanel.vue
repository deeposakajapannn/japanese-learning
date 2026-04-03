<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLang } from '@/i18n'
import { audioEl } from '@/composables/useAudio'
import { useLoopPlayer } from '@/composables/useLoopPlayer'
import type { ArticleItem, ArticleEssay, ArticleDialogue, ArticleSegment } from '@/types'
import type { DataItem } from '@/stores/app'

const store = useAppStore()
const { t, currentLang } = useLang()
const { startLoop, stop: stopLoop, loopPlaying, loopIndex } = useLoopPlayer()

const selectedId = ref<string | null>(null)

/** 连播会话：+1 可丢弃未结束的 onended */
let articlePlaySession = 0

const playingAll = ref(false)
/** 当前正在播的原文（连播时高亮） */
const playingJp = ref<string | null>(null)

/** 单句/全文模式 */
const LS_ARTICLE_MODE = 'jp_article_mode'
const singleMode = ref(readStoredBool(LS_ARTICLE_MODE, false))

/** 构建从指定索引开始的 LoopPlayer 播放列表 */
function buildLoopItems(fromIndex: number) {
  const sentences = flatSentences.value
  const items: (DataItem & { _cat: string })[] = []
  for (let i = fromIndex; i < sentences.length; i++) {
    const s = sentences[i]
    const fn = audioFnForJp(s.jp)
    if (fn) {
      items.push({
        id: i,
        word: s.jp,
        reading: s.reading,
        meaning: s.zh,
        _cat: 'articles',
        _audioFn: fn,
      })
    }
  }
  // 把 fromIndex 之前的也追加到末尾，形成完整循环
  for (let i = 0; i < fromIndex; i++) {
    const s = sentences[i]
    const fn = audioFnForJp(s.jp)
    if (fn) {
      items.push({
        id: i,
        word: s.jp,
        reading: s.reading,
        meaning: s.zh,
        _cat: 'articles',
        _audioFn: fn,
      })
    }
  }
  return items
}

const LS_ARTICLE_ZH = 'jp_article_show_zh'
const LS_ARTICLE_READING = 'jp_article_show_reading'
const LS_ARTICLE_VOICE = 'jp_article_tts_voice'

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

function readStoredVoice(): 'female' | 'male' {
  try {
    if (typeof localStorage === 'undefined') return 'female'
    const v = localStorage.getItem(LS_ARTICLE_VOICE)
    return v === 'male' ? 'male' : 'female'
  } catch {
    return 'female'
  }
}

const articleVoiceMale = ref(readStoredVoice() === 'male')

watch(articleVoiceMale, (isMale) => {
  try {
    localStorage.setItem(LS_ARTICLE_VOICE, isMale ? 'male' : 'female')
  } catch {
    /* ignore */
  }
  invalidateArticlePlayback()
  stopLoop()
})

/** 当前篇是否有至少一句男声资源（仅 N2 及以下篇目会带齐） */
const articleOffersMaleVoice = computed(() =>
  flatSentences.value.some((s) => !!store.articleAudioMapMale[s.jp]),
)

/** 文章朗读用文件名：男声优先（有键时），否则女声 */
function audioFnForJp(jp: string): string | undefined {
  if (articleVoiceMale.value) {
    const m = store.articleAudioMapMale[jp]
    if (m) return m
  }
  return store.audioMap[jp]
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
watch(singleMode, (v) => {
  try {
    localStorage.setItem(LS_ARTICLE_MODE, v ? '1' : '0')
  } catch {
    /* ignore */
  }
})

const list = computed(() => store.articles)

const selected = computed(() => {
  if (!selectedId.value) return null
  return list.value.find((a) => a.id === selectedId.value) ?? null
})

/**
 * 短文按「段」分组显示：细切 segment 合并为一段，长段保持单段一段。
 * 不改变 segment / audio_map 键，仅影响全文排版。
 */
function groupEssayIntoParagraphs(segments: ArticleSegment[]): ArticleSegment[][] {
  const out: ArticleSegment[][] = []
  let cur: ArticleSegment[] = []
  let runLen = 0
  const maxChars = 120
  const maxPerGroup = 3
  for (const s of segments) {
    cur.push(s)
    runLen += s.jp.length
    if (runLen >= maxChars || cur.length >= maxPerGroup) {
      out.push(cur)
      cur = []
      runLen = 0
    }
  }
  if (cur.length) out.push(cur)
  return out
}

const essayParagraphGroups = computed(() => {
  const it = selected.value
  if (!it || it.format !== 'essay') return [] as ArticleSegment[][]
  return groupEssayIntoParagraphs(it.segments)
})

/** 扁平化的所有句子（用于单句模式和连播） */
const flatSentences = computed(() => {
  const it = selected.value
  if (!it) return [] as { jp: string; reading: string; zh: string; speaker?: string }[]
  if (it.format === 'essay') {
    return it.segments.map((s) => ({ jp: s.jp, reading: s.reading, zh: s.zh, speaker: (s as any).speaker as string | undefined }))
  }
  const out: { jp: string; reading: string; zh: string; speaker?: string }[] = []
  for (const sec of it.sections) {
    for (const line of sec.lines) {
      out.push({ jp: line.jp, reading: line.reading, zh: line.zh, speaker: line.speaker })
    }
  }
  return out
})

/** 当前篇按顺序的朗读单元（用于连播） */
const playbackUnits = computed(() => {
  return flatSentences.value.map((s) => ({ jp: s.jp }))
})

const canPlayAll = computed(() => playbackUnits.value.some((u) => !!audioFnForJp(u.jp)))

const copied = ref(false)
async function copyFullText() {
  const sentences = flatSentences.value
  const text = sentences.map((s) => s.jp).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* ignore */ }
}

function invalidateArticlePlayback() {
  articlePlaySession++
  playingAll.value = false
  playingJp.value = null
  audioEl.pause()
  audioEl.onended = null
}

function playAllWithLoopPlayer() {
  invalidateArticlePlayback()
  const items = buildLoopItems(0)
  if (items.length) startLoop(items)
}

/** 单句模式：点击某句，从该句开始启动 LoopPlayer */
function playSentenceAt(index: number) {
  invalidateArticlePlayback()
  const items = buildLoopItems(index)
  if (items.length) startLoop(items)
}

function openItem(id: string) {
  selectedId.value = id
}

function back() {
  invalidateArticlePlayback()
  stopLoop()
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
  if (loopPlaying.value) {
    const items = playbackUnits.value.filter((u) => !!audioFnForJp(u.jp))
    const current = items[loopIndex.value]
    return current?.jp === jp
  }
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
          <div
            v-if="articleOffersMaleVoice"
            class="inline-flex items-center rounded-full border border-[var(--border)] p-0.5 text-xs font-medium cursor-pointer select-none"
            @click="articleVoiceMale = !articleVoiceMale"
          >
            <span
              class="px-2 py-0.5 rounded-full transition-colors"
              :class="!articleVoiceMale ? 'bg-[#e8735a]/15 text-[#c45a3e]' : 'theme-muted'"
            >{{ t('articleVoiceFemale') }}</span>
            <span
              class="px-2 py-0.5 rounded-full transition-colors"
              :class="articleVoiceMale ? 'bg-[#e8735a]/15 text-[#c45a3e]' : 'theme-muted'"
            >{{ t('articleVoiceMale') }}</span>
          </div>
          <template v-if="canPlayAll">
            <button
              v-if="!loopPlaying"
              type="button"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer theme-muted border-[var(--border)] bg-transparent hover:theme-text"
              @click="playAllWithLoopPlayer"
            >
              {{ t('articlePlayAll') }}
            </button>
            <button
              v-else
              type="button"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer bg-[#e8735a]/15 border-[#e8735a]/40 text-[#c45a3e]"
              @click="stopLoop"
            >
              {{ t('articleStopPlayback') }}
            </button>
          </template>
          <button
            type="button"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer"
            :class="copied
              ? 'bg-[#5b8a72]/15 border-[#5b8a72]/40 text-[#5b8a72]'
              : 'theme-muted border-[var(--border)] bg-transparent hover:theme-text'"
            @click="copyFullText"
          >
            {{ copied ? t('articleCopied') : t('articleCopy') }}
          </button>

          <!-- 单句/全文 切换滑块 -->
          <div
            class="inline-flex items-center rounded-full border border-[var(--border)] p-0.5 ml-auto cursor-pointer select-none text-xs font-medium"
            @click="singleMode = !singleMode"
          >
            <span
              class="px-2 py-0.5 rounded-full transition-colors"
              :class="!singleMode ? 'bg-[#e8735a]/15 text-[#c45a3e]' : 'theme-muted'"
            >{{ t('articleModeFull') }}</span>
            <span
              class="px-2 py-0.5 rounded-full transition-colors"
              :class="singleMode ? 'bg-[#e8735a]/15 text-[#c45a3e]' : 'theme-muted'"
            >{{ t('articleModeSingle') }}</span>
          </div>
        </div>
      </header>

      <!-- ====== 单句列表模式 ====== -->
      <div v-if="singleMode" class="space-y-3">
        <div
          v-for="(seg, i) in flatSentences"
          :key="i"
          class="relative rounded-2xl theme-surface p-4 md:p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-colors"
          :class="linePlaying(seg.jp) ? 'ring-2 ring-[#e8735a]/40' : ''"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div v-if="seg.speaker" class="text-xs font-bold mb-1" style="color: var(--primary)">{{ seg.speaker }}</div>
              <p class="text-[15px] font-medium theme-text leading-relaxed">{{ seg.jp }}</p>
              <p v-if="showReading" class="text-sm theme-muted mt-1.5 leading-relaxed">{{ seg.reading }}</p>
              <template v-if="showTranslation">
                <p v-if="currentLang === 'zh'" class="text-sm mt-2 leading-relaxed" style="color: var(--accent)">{{ seg.zh }}</p>
                <p v-else class="text-sm mt-2 leading-relaxed theme-muted">{{ seg.zh }}</p>
              </template>
            </div>
            <button
              v-if="audioFnForJp(seg.jp)"
              type="button"
              class="shrink-0 w-9 h-9 mt-0.5 rounded-full flex items-center justify-center cursor-pointer border-0 transition-transform active:scale-95"
              style="background: linear-gradient(135deg, #e8735a 0%, #d4624d 100%); color: #fff;"
              @click="playSentenceAt(i)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ====== 全文模式 ====== -->
      <template v-else-if="!singleMode">
        <!-- 短文 -->
        <article
          v-if="isEssay(selected)"
          class="relative rounded-2xl theme-surface p-5 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        >
          <span
            class="pointer-events-none absolute top-3 right-4 z-[1] text-[9px] font-medium tabular-nums leading-none theme-muted opacity-[0.38] md:top-4 md:right-5 md:text-[10px]"
            aria-hidden="true"
            >{{ selected!.level }}</span>
          <div class="space-y-5">
            <div
              v-for="(para, pi) in essayParagraphGroups"
              :key="pi"
              class="rounded-md -mx-0.5 px-0.5 py-0.5"
            >
              <p class="text-[15px] font-medium theme-text leading-[1.85] [text-indent:1em]">
                <span
                  v-for="(seg, si) in para"
                  :key="`${pi}-${si}`"
                  class="rounded-sm"
                  :class="linePlaying(seg.jp) ? 'bg-[#e8735a]/25 ring-1 ring-[#e8735a]/30' : ''"
                >{{ seg.jp }}</span>
              </p>
              <p
                v-if="showReading"
                class="text-sm theme-muted mt-1.5 leading-relaxed pl-[1em]"
              >{{ para.map((s) => s.reading).join('') }}</p>
              <template v-if="showTranslation">
                <p
                  v-if="currentLang === 'zh'"
                  class="text-sm mt-2 leading-relaxed pl-[1em]"
                  style="color: var(--accent)"
                >{{ para.map((s) => s.zh).join('') }}</p>
                <p
                  v-else
                  class="text-sm mt-2 leading-relaxed theme-muted pl-[1em]"
                >{{ para.map((s) => s.zh).join('') }}</p>
              </template>
            </div>
          </div>
        </article>

        <!-- 对话 -->
        <article
          v-else-if="isDialogue(selected)"
          class="relative rounded-2xl theme-surface p-5 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] space-y-6"
        >
          <span
            class="pointer-events-none absolute top-3 right-4 z-[1] text-[9px] font-medium tabular-nums leading-none theme-muted opacity-[0.38] md:top-4 md:right-5 md:text-[10px]"
            aria-hidden="true"
            >{{ selected!.level }}</span>
          <section v-for="(sec, si) in (selected as ArticleDialogue).sections" :key="si" class="space-y-4">
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
      </template>
    </div>
  </div>
</template>
