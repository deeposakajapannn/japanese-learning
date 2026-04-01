<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VocabItem } from '../../types'
import { getListenedCount, getItemCount, itemCountsTick, listenedCountsTick, recordItemListened } from '../../composables/useSpacedRepetition'
import { speakWithExample } from '../../composables/useAudio'
import { isInQuizQueue, addToQuizQueue, quizQueueTick } from '@/learning'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'
import type { GrammarPoint } from '../../types'

/** 左滑露出的操作区宽度（仅「加入测验」） */
const ACTION_W = 100

const { t, currentLang } = useLang()

const expandedGrammar = ref<GrammarPoint | null>(null)

/** 当前展开的语法点高亮的 token indices */
const highlightIndices = computed(() => {
  const g = expandedGrammar.value
  if (!g || !g.highlight) return new Set<number>()
  return new Set(g.highlight)
})

function onGrammarTag(g: GrammarPoint, e: Event) {
  e.stopPropagation()
  expandedGrammar.value = expandedGrammar.value?.pattern === g.pattern ? null : g
}

const props = defineProps<{
  item: VocabItem
}>()

const cat = 'sentences' as const

const statsLine = computed(() => {
  itemCountsTick.value
  listenedCountsTick.value
  return t('listStatsCounts')
    .replace('{listen}', String(getListenedCount(cat, props.item.id)))
    .replace('{practice}', String(getItemCount(cat, props.item.id)))
})

const offsetPx = ref(0)
const dragging = ref(false)
let touchStartX = 0
let touchStartY = 0
let touchStartOffset = 0
/** 桌面鼠标拖移后避免误触朗读 */
let hadHorizontalDrag = false
let activePointerId: number | null = null
/** 方向锁定：一旦判定水平/垂直就不再切换 */
let dragAxis: 'x' | 'y' | null = null

function onWindowPointerMove(e: PointerEvent) {
  if (!dragging.value || activePointerId !== e.pointerId) return
  const dx = e.clientX - touchStartX
  const dy = e.clientY - touchStartY
  if (!dragAxis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
    dragAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
  }
  if (dragAxis === 'x') {
    e.preventDefault()
    if (Math.abs(dx) > 10) hadHorizontalDrag = true
    let next = touchStartOffset + dx
    if (next > 0) next = 0
    if (next < -ACTION_W) next = -ACTION_W
    offsetPx.value = next
  }
}

function onWindowPointerUp(e: PointerEvent) {
  if (!dragging.value || activePointerId !== e.pointerId) return
  dragging.value = false
  activePointerId = null
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  if (offsetPx.value < -40) {
    offsetPx.value = -ACTION_W
  } else {
    offsetPx.value = 0
  }
}

function onSpeak() {
  speakWithExample(props.item.word, props.item.example)
  recordItemListened(cat, props.item.id)
}

const inQueue = computed(() => {
  quizQueueTick.value
  return isInQuizQueue(cat, props.item.id)
})

function onAddQuiz() {
  addToQuizQueue(cat, props.item.id)
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dragging.value = true
  hadHorizontalDrag = false
  dragAxis = null
  activePointerId = e.pointerId
  touchStartX = e.clientX
  touchStartY = e.clientY
  touchStartOffset = offsetPx.value
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
}

function onCardClick() {
  if (hadHorizontalDrag) {
    hadHorizontalDrag = false
    return
  }
  if (offsetPx.value < -20) {
    offsetPx.value = 0
    return
  }
  onSpeak()
}

const cardTransform = computed(() => ({ transform: `translateX(${offsetPx.value}px)` }))

const cardTransitionClass = computed(() => {
  if (dragging.value) return ''
  return 'transition-transform duration-200 ease-out'
})
</script>

<template>
  <div class="flex flex-col rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden animate-fadeUp">
    <div class="relative flex-1 min-w-0 overflow-hidden">
      <div class="absolute inset-y-0 right-0 flex w-[100px] z-0" aria-hidden="true">
        <button
          type="button"
          class="w-full flex items-center justify-center text-white text-xs font-semibold px-2 leading-tight border-0 cursor-pointer active:opacity-90 hover:opacity-95"
          :class="inQueue ? 'bg-[#999] cursor-default' : 'btn-grad-primary btn-grad-primary--borderless'"
          :disabled="inQueue"
          @click.stop="onAddQuiz"
        >
          {{ inQueue ? t('quizQueueReady') : t('quizQueueAdd') }}
        </button>
      </div>
      <div
        class="relative z-10 theme-surface p-4 select-none touch-pan-y cursor-grab active:cursor-grabbing"
        :class="cardTransitionClass"
        :style="cardTransform"
        @click="onCardClick"
        @pointerdown="onPointerDown"
      >
        <div class="flex items-center relative">
          <div
            class="w-9 h-9 rounded-full theme-soft text-[#e8735a] flex items-center justify-center text-xs font-bold shrink-0 mr-3"
          >
            {{ item.id }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-base font-bold theme-text leading-relaxed">
              <template v-if="item.tokens && item.tokens.length">
                <span
                  v-for="(tk, i) in item.tokens"
                  :key="i"
                  class="inline-block transition-colors duration-200 border-b"
                  :class="[
                    highlightIndices.has(i)
                      ? 'text-[#c45a3e] bg-[#e8735a]/10 rounded-t px-[2px] border-[#e8735a]/40'
                      : 'border-[#e8735a]/15',
                    i > 0 ? 'ml-[5px]' : ''
                  ]"
                >{{ tk }}</span>
              </template>
              <template v-else>{{ item.word }}</template>
            </div>
            <div class="text-sm theme-muted">{{ item.reading }}</div>
            <div class="text-sm theme-text mt-0.5">{{ localMeaning(item, currentLang) }}</div>
            <div v-if="item.grammar && item.grammar.length" class="flex flex-wrap gap-1 mt-1.5">
              <button
                v-for="g in item.grammar"
                :key="g.pattern"
                type="button"
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] leading-tight border cursor-pointer transition-colors"
                :class="expandedGrammar?.pattern === g.pattern
                  ? 'bg-[#e8735a]/15 border-[#e8735a]/40 text-[#c45a3e]'
                  : 'theme-soft border-transparent theme-muted hover:border-[#e8735a]/30'"
                @click="onGrammarTag(g, $event)"
              >
                <span class="font-medium">{{ g.pattern }}</span>
                <span class="opacity-60">{{ g.level }}</span>
              </button>
            </div>
            <div
              v-if="expandedGrammar"
              class="mt-1 px-2 py-1.5 rounded-lg text-xs leading-relaxed theme-soft"
              @click.stop
            >
              <span class="font-medium text-[#c45a3e]">{{ expandedGrammar.pattern }}</span>
              <span class="theme-muted ml-1">{{ expandedGrammar.level }}</span>
              <div class="mt-0.5 theme-text">{{ currentLang === 'en' ? expandedGrammar.noteEn : expandedGrammar.note }}</div>
            </div>
            <div v-if="item.example" class="text-xs theme-muted mt-1 leading-relaxed">
              {{ item.example }}
              <br v-if="item.exampleCn" />
              <span v-if="item.exampleCn" class="text-[#5b8a72]">{{ item.exampleCn }}</span>
            </div>
          </div>
          <button
            type="button"
            class="text-xl ml-2 shrink-0 bg-transparent border-none cursor-pointer"
            @click.stop="onSpeak"
          >
            🔊
          </button>
          <div
            class="absolute top-0 right-10 theme-muted text-[10px] leading-tight text-right max-w-[6rem] pointer-events-none"
          >
            {{ statsLine }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
