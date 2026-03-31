<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[200] flex items-center justify-center bg-black/30"
  >
    <div class="w-[90%] max-w-sm theme-loop-panel rounded-2xl overflow-hidden">
      <!-- Info bar -->
      <div class="flex items-center justify-between px-5 pt-4 pb-2">
        <span class="text-[13px]" style="color: var(--text-secondary)">
          {{ loopIndex + 1 }} / {{ loopPlaylist.length }}
        </span>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer text-sm" style="color: var(--text-secondary)"
          @click="stop"
        >✕</button>
      </div>

      <!-- Word card -->
      <div v-if="currentItem" class="px-5 py-6 text-center">
        <div class="text-3xl font-bold leading-snug theme-text">{{ currentItem.word }}</div>
        <div class="text-lg mt-2" style="color: var(--primary)">{{ currentItem.reading }}</div>
        <div class="text-[15px] theme-muted mt-2">{{ localMeaning(currentItem, currentLang) }}</div>
        <div v-if="currentItem.example" class="text-[13px] mt-3 leading-relaxed" style="color: var(--text-secondary)">{{ currentItem.example }}</div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-4 px-5 pb-5 pt-1">
        <!-- Repeat -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border cursor-pointer transition-colors"
          :style="loopRepeat
            ? { background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary)' }
            : { background: 'var(--card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }"
          @click="toggleRepeat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 1 21 5 17 9"/>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
            <polyline points="7 23 3 19 7 15"/>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            <text x="10" y="14" font-size="7" font-weight="bold" stroke="none" fill="currentColor" text-anchor="middle">1</text>
          </svg>
        </button>

        <!-- Prev -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border text-lg cursor-pointer"
          style="border-color: var(--border); background: var(--card); color: var(--text-secondary)"
          @click="prevTrack"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="5" x2="5" y2="19"/>
            <polygon points="7 12 17 19 17 5 7 12"/>
          </svg>
        </button>

        <!-- Play/Pause -->
        <button
          class="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-b from-[#f38a73] to-[#e8735a] text-white cursor-pointer shadow-[0_8px_22px_rgba(232,115,90,0.35)] active:scale-[0.98] transition-transform"
          @click="togglePlay"
        >
          <svg v-if="loopPaused" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="8,6 18,12 8,18"/>
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <line x1="9" y1="6" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="18"/>
          </svg>
        </button>

        <!-- Next -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border text-lg cursor-pointer"
          style="border-color: var(--border); background: var(--card); color: var(--text-secondary)"
          @click="nextTrack"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="5" x2="19" y2="19"/>
            <polygon points="17 12 7 19 7 5 17 12"/>
          </svg>
        </button>

        <!-- Stop -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border text-sm cursor-pointer"
          style="border-color: var(--border); background: var(--card); color: var(--text-secondary)"
          @click="stop"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="1.5"/>
          </svg>
        </button>
      </div>

      <div class="flex items-center justify-end gap-2 px-5 pb-4">
        <button
          class="px-3 py-1.5 rounded-lg border text-xs cursor-pointer theme-surface"
          style="border-color: var(--border); color: var(--text-secondary)"
          @click="copyDebugLogs"
        >{{ t('copyDebugLogs') }}</button>
        <button
          class="px-3 py-1.5 rounded-lg border text-xs cursor-pointer"
          style="border-color: var(--primary); background: var(--primary-light); color: var(--primary)"
          @click="clearDebugLogs"
        >{{ t('clearDebugLogs') }}</button>
      </div>
    </div>
  </div>
</template>
