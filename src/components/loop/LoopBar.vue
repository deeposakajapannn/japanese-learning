<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLoopPlayer } from '../../composables/useLoopPlayer'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

const { t, currentLang } = useLang()

const {
  loopPlaylist,
  loopIndex,
  loopPlaying,
  loopPaused,
  loopRepeat,
  togglePlay,
  stop,
  toggleRepeat,
  prevTrack,
  nextTrack,
  exportLoopDebugLogs,
  clearLoopDebugLogs,
} = useLoopPlayer()

const visible = computed(() => loopPlaying.value || loopPaused.value)
const currentItem = computed(() => loopPlaylist.value[loopIndex.value])

/** 收起态：迷你条在底栏上方，不挡菜单（z 低于底栏） */
const collapsed = ref(false)

watch(visible, (v) => {
  if (v) collapsed.value = false
})

const miniTitle = computed(() => {
  const it = currentItem.value
  if (!it) return '—'
  return it.word
})

async function copyDebugLogs() {
  const text = exportLoopDebugLogs()
  try {
    await navigator.clipboard.writeText(text)
    alert(t('debugCopied'))
  } catch {
    alert(text)
  }
}

function clearDebugLogs() {
  clearLoopDebugLogs()
  alert(t('debugCleared'))
}

function minimize() {
  collapsed.value = true
}
</script>

<template>
  <!-- 收起：底栏上方一行，z-[199] 低于移动底栏 z-[200]，不挡菜单 -->
  <div
    v-if="visible && collapsed"
    class="fixed left-0 right-0 z-[199] flex items-center gap-2 px-3 py-2.5 theme-loop-panel border-t shadow-[0_-4px_18px_rgba(0,0,0,0.08)] max-md:bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] md:bottom-6 md:left-[200px] md:right-4 md:border-x md:border-b md:rounded-b-xl"
    style="border-color: var(--border)"
  >
    <button
      type="button"
      class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-b from-[#f38a73] to-[#e8735a] text-white shadow-md active:scale-[0.98]"
      :aria-label="loopPaused ? t('loopAriaPlay') : t('loopAriaPause')"
      @click="togglePlay"
    >
      <svg v-if="loopPaused" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <polygon points="8,6 18,12 8,18" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <line x1="9" y1="6" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="18" />
      </svg>
    </button>
    <div class="flex-1 min-w-0 text-left">
      <div class="text-sm font-semibold theme-text truncate">{{ miniTitle }}</div>
      <div class="text-[11px] theme-muted">{{ loopIndex + 1 }} / {{ loopPlaylist.length }}</div>
    </div>
    <button
      type="button"
      class="shrink-0 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer theme-surface border"
      style="border-color: var(--border); color: var(--text-secondary)"
      :aria-label="t('loopExpand')"
      @click="collapsed = false"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <button
      type="button"
      class="shrink-0 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer text-sm"
      style="color: var(--text-secondary)"
      :aria-label="t('loopClose')"
      @click="stop"
    >
      ✕
    </button>
  </div>

  <!-- 展开：全屏遮罩 + 更宽面板（手机更大，桌面保持原宽度感） -->
  <div
    v-if="visible && !collapsed"
    class="fixed inset-0 z-[200] flex items-center justify-center bg-black/30"
  >
    <div
      class="w-[95%] max-w-lg md:w-[90%] md:max-w-sm theme-loop-panel rounded-2xl overflow-hidden max-h-[min(92vh,900px)] flex flex-col"
    >
      <!-- Info bar -->
      <div class="flex items-center justify-between px-4 pt-3 pb-2 md:px-5 shrink-0">
        <span class="text-[13px]" style="color: var(--text-secondary)">
          {{ loopIndex + 1 }} / {{ loopPlaylist.length }}
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
            style="color: var(--text-secondary)"
            :aria-label="t('loopMinimize')"
            @click="minimize"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            class="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer text-sm"
            style="color: var(--text-secondary)"
            :aria-label="t('loopClose')"
            @click="stop"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Word card -->
      <div v-if="currentItem" class="px-4 py-5 md:px-5 md:py-6 text-center overflow-y-auto flex-1 min-h-0">
        <div class="text-3xl font-bold leading-snug theme-text">{{ currentItem.word }}</div>
        <div class="text-lg mt-2" style="color: var(--primary)">{{ currentItem.reading }}</div>
        <div class="text-[15px] theme-muted mt-2">{{ localMeaning(currentItem, currentLang) }}</div>
        <div
          v-if="currentItem.example"
          class="text-[13px] mt-3 leading-relaxed"
          style="color: var(--text-secondary)"
        >
          {{ currentItem.example }}
        </div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-3 md:gap-4 px-4 pb-4 pt-1 md:px-5 md:pb-5 shrink-0 flex-wrap">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border cursor-pointer transition-colors"
          :style="
            loopRepeat
              ? { background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)' }
              : { background: 'var(--card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
          "
          @click="toggleRepeat"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            <text
              x="10"
              y="14"
              font-size="7"
              font-weight="bold"
              stroke="none"
              fill="currentColor"
              text-anchor="middle"
            >
              1
            </text>
          </svg>
        </button>

        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border text-lg cursor-pointer"
          style="border-color: var(--border); background: var(--card); color: var(--text-secondary)"
          @click="prevTrack"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="5" y1="5" x2="5" y2="19" />
            <polygon points="7 12 17 19 17 5 7 12" />
          </svg>
        </button>

        <button
          type="button"
          class="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-b from-[#f38a73] to-[#e8735a] text-white cursor-pointer shadow-[0_8px_22px_rgba(232,115,90,0.35)] active:scale-[0.98] transition-transform"
          :aria-label="loopPaused ? t('loopAriaPlay') : t('loopAriaPause')"
          @click="togglePlay"
        >
          <svg v-if="loopPaused" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="8,6 18,12 8,18" />
          </svg>
          <svg
            v-else
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
          >
            <line x1="9" y1="6" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="18" />
          </svg>
        </button>

        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border text-lg cursor-pointer"
          style="border-color: var(--border); background: var(--card); color: var(--text-secondary)"
          @click="nextTrack"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="19" y1="5" x2="19" y2="19" />
            <polygon points="17 12 7 19 7 5 17 12" />
          </svg>
        </button>

        <button
          type="button"
          class="w-10 h-10 flex items-center justify-center rounded-full border text-sm cursor-pointer"
          style="border-color: var(--border); background: var(--card); color: var(--text-secondary)"
          :aria-label="t('loopMinimize')"
          @click="minimize"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <div class="flex items-center justify-end gap-2 px-4 pb-4 md:px-5 shrink-0">
        <button
          class="px-3 py-1.5 rounded-lg border text-xs cursor-pointer theme-surface"
          style="border-color: var(--border); color: var(--text-secondary)"
          @click="copyDebugLogs"
        >
          {{ t('copyDebugLogs') }}
        </button>
        <button
          class="px-3 py-1.5 rounded-lg border text-xs cursor-pointer"
          style="border-color: var(--primary); background: var(--primary-light); color: var(--primary)"
          @click="clearDebugLogs"
        >
          {{ t('clearDebugLogs') }}
        </button>
      </div>
    </div>
  </div>
</template>
