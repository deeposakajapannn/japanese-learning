<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { VocabItem } from '../../types'
import { isMastered, getItemCount } from '../../composables/useSpacedRepetition'
import { speakWithExample } from '../../composables/useAudio'
import { listenDismissClear, listenDismissHideOnly } from '../../composables/useListenListDismiss'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

const ACTION_W = 144

const { t, currentLang } = useLang()

const props = defineProps<{
  item: VocabItem
}>()

const cat = 'sentences' as const

const offsetPx = ref(0)
const dragging = ref(false)
const cardEl = ref<HTMLElement | null>(null)
let touchStartX = 0
let touchStartY = 0
let touchStartOffset = 0

const useSwipe = ref(true)
function updateSwipeMode() {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768
  if (useSwipe.value && !mobile) offsetPx.value = 0
  useSwipe.value = mobile
}

let cardTouchMoveCleanup: (() => void) | null = null

onMounted(() => {
  updateSwipeMode()
  window.addEventListener('resize', updateSwipeMode)
  nextTick(() => {
    const el = cardEl.value
    if (!el) return
    el.addEventListener('touchmove', onTouchMoveScrollable, { passive: false })
    cardTouchMoveCleanup = () => el.removeEventListener('touchmove', onTouchMoveScrollable)
  })
})
onUnmounted(() => {
  window.removeEventListener('resize', updateSwipeMode)
  cardTouchMoveCleanup?.()
  cardTouchMoveCleanup = null
})

function onTouchMoveScrollable(e: TouchEvent) {
  if (!useSwipe.value || !dragging.value) return
  const t = e.touches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
    e.preventDefault()
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
  listenDismissClear(cat, props.item.id)
}

function onHide() {
  listenDismissHideOnly(cat, props.item.id)
}

function onCardClick() {
  if (useSwipe.value && offsetPx.value < -20) {
    offsetPx.value = 0
    return
  }
  onSpeak()
}

function onTouchStart(e: TouchEvent) {
  if (!useSwipe.value) return
  dragging.value = true
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  touchStartOffset = offsetPx.value
}

function onTouchEnd() {
  if (!useSwipe.value) return
  dragging.value = false
  if (offsetPx.value < -ACTION_W / 2) {
    offsetPx.value = -ACTION_W
  } else {
    offsetPx.value = 0
  }
}

const cardTransform = computed(() => {
  if (!useSwipe.value) return undefined
  return { transform: `translateX(${offsetPx.value}px)` }
})

const cardTransitionClass = computed(() => {
  if (!useSwipe.value || dragging.value) return ''
  return 'transition-transform duration-200 ease-out'
})
</script>

<template>
  <div
    class="flex md:flex-row flex-col rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden animate-fadeUp"
  >
    <div class="relative flex-1 min-w-0 overflow-hidden md:overflow-visible">
      <div
        class="absolute inset-y-0 right-0 flex w-36 z-0 md:hidden"
        aria-hidden="true"
      >
        <button
          type="button"
          class="flex-1 flex items-center justify-center bg-[#5b8a72] text-white text-xs font-semibold px-1 leading-tight border-0 cursor-pointer active:opacity-90"
          @click.stop="onClear"
        >
          {{ t('listenClear') }}
        </button>
        <button
          type="button"
          class="flex-1 flex items-center justify-center bg-[#c9563f] text-white text-xs font-semibold px-1 leading-tight border-0 cursor-pointer active:opacity-90"
          @click.stop="onHide"
        >
          {{ t('listenRemove') }}
        </button>
      </div>
      <div
        ref="cardEl"
        class="relative z-10 theme-surface p-4 cursor-pointer select-none touch-pan-y"
        :class="cardTransitionClass"
        :style="cardTransform"
        @click="onCardClick"
        @touchstart.passive="onTouchStart"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <div class="flex items-center relative">
          <div class="w-9 h-9 rounded-full theme-soft text-[#e8735a] flex items-center justify-center text-xs font-bold shrink-0 mr-3">
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
            v-if="isMastered(cat, item.id)"
            class="absolute top-0 right-10 md:right-12 bg-[#5b8a72] text-white text-[10px] px-2 py-0.5 rounded-[10px]"
          >
            {{ t('mastered') }}
          </div>
          <div
            v-else
            class="absolute top-0 right-10 md:right-12 theme-muted text-[10px]"
          >
            {{ getItemCount(cat, item.id) }}/50
          </div>
        </div>
      </div>
    </div>
    <div
      class="hidden md:flex flex-col justify-center gap-1.5 w-[104px] shrink-0 px-2 py-3 border-l border-[#e8e2dc] theme-soft"
    >
      <button
        type="button"
        class="py-2 rounded-[10px] bg-[#5b8a72] text-white text-xs font-semibold border-0 cursor-pointer hover:opacity-95"
        @click.stop="onClear"
      >
        {{ t('listenClear') }}
      </button>
      <button
        type="button"
        class="py-2 rounded-[10px] bg-[#c9563f] text-white text-xs font-semibold border-0 cursor-pointer hover:opacity-95"
        @click.stop="onHide"
      >
        {{ t('listenRemove') }}
      </button>
    </div>
  </div>
</template>
