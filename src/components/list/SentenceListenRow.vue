<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { VocabItem } from '../../types'
import { getListenedCount, getItemCount, itemCountsTick } from '../../composables/useSpacedRepetition'
import { speakWithExample } from '../../composables/useAudio'
import { markListenCleared } from '@/learning'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

/** 左滑露出的「听清了」按钮宽度 */
const ACTION_W = 100

const { t, currentLang } = useLang()

const props = defineProps<{
  item: VocabItem
}>()

const cat = 'sentences' as const

const statsLine = computed(() => {
  itemCountsTick.value
  return t('listStatsCounts')
    .replace('{listen}', String(getListenedCount(cat, props.item.id)))
    .replace('{practice}', String(getItemCount(cat, props.item.id)))
})

const offsetPx = ref(0)
const dragging = ref(false)
const cardEl = ref<HTMLElement | null>(null)
let touchStartX = 0
let touchStartY = 0
let touchStartOffset = 0
/** 桌面鼠标拖移后避免误触朗读 */
let hadHorizontalDrag = false
let activePointerId: number | null = null

let pointerMoveCleanup: (() => void) | null = null

onMounted(() => {
  nextTick(() => {
    const el = cardEl.value
    if (!el) return
    const move = (e: PointerEvent) => onPointerMove(e)
    el.addEventListener('pointermove', move, { passive: false })
    pointerMoveCleanup = () => el.removeEventListener('pointermove', move)
  })
})

onUnmounted(() => {
  pointerMoveCleanup?.()
  pointerMoveCleanup = null
})

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || activePointerId !== e.pointerId) return
  const dx = e.clientX - touchStartX
  const dy = e.clientY - touchStartY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
    e.preventDefault()
    if (Math.abs(dx) > 10) hadHorizontalDrag = true
    let next = touchStartOffset + dx
    if (next > 0) next = 0
    if (next < -ACTION_W) next = -ACTION_W
    offsetPx.value = next
  }
}

function onSpeak() {
  speakWithExample(props.item.word, props.item.example)
}

function onClear() {
  markListenCleared(cat, props.item.id)
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dragging.value = true
  hadHorizontalDrag = false
  activePointerId = e.pointerId
  touchStartX = e.clientX
  touchStartY = e.clientY
  touchStartOffset = offsetPx.value
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}

function onPointerUp(e: PointerEvent) {
  if (activePointerId !== e.pointerId) return
  dragging.value = false
  activePointerId = null
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
  if (offsetPx.value < -ACTION_W / 2) {
    offsetPx.value = -ACTION_W
  } else {
    offsetPx.value = 0
  }
}

function onCardClick() {
  if (offsetPx.value < -20) {
    offsetPx.value = 0
    hadHorizontalDrag = false
    return
  }
  if (hadHorizontalDrag) {
    hadHorizontalDrag = false
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
          class="w-full flex items-center justify-center bg-[#5b8a72] text-white text-xs font-semibold px-2 leading-tight border-0 cursor-pointer active:opacity-90 hover:opacity-95"
          @click.stop="onClear"
        >
          {{ t('listenClear') }}
        </button>
      </div>
      <div
        ref="cardEl"
        class="relative z-10 theme-surface p-4 select-none touch-pan-y cursor-grab active:cursor-grabbing"
        :class="cardTransitionClass"
        :style="cardTransform"
        @click="onCardClick"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="flex items-center relative">
          <div
            class="w-9 h-9 rounded-full theme-soft text-[#e8735a] flex items-center justify-center text-xs font-bold shrink-0 mr-3"
          >
            {{ item.id }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-base font-bold theme-text">{{ item.word }}</div>
            <div class="text-sm theme-muted">{{ item.reading }}</div>
            <div class="text-sm theme-text mt-0.5">{{ localMeaning(item, currentLang) }}</div>
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
