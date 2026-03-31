<script setup lang="ts">
import { computed } from 'vue'
import { useLoopPlayer } from '../../composables/useLoopPlayer'
import { useLang } from '@/i18n'
import { localMeaning } from '@/utils/helpers'

const { t, currentLang } = useLang()

const {
  loopPlaylist,
  loopIndex,
  loopRound,
  loopPlaying,
  loopPaused,
  loopRepeat,
  togglePlay,
  stop,
  toggleRepeat,
  prevTrack,
  nextTrack,
} = useLoopPlayer()

const visible = computed(() => loopPlaying.value || loopPaused.value)
const currentItem = computed(() => loopPlaylist.value[loopIndex.value])
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[200] flex items-center justify-center bg-black/30"
  >
    <div class="w-[90%] max-w-sm bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] overflow-hidden">
      <!-- Info bar -->
      <div class="flex items-center justify-between px-5 pt-4 pb-2">
        <span class="text-[13px] text-[#999]">
          {{ loopIndex + 1 }} / {{ loopPlaylist.length }} · {{ t('loopRound') }}{{ loopRound }}{{ t('loopRoundSuffix') }}
        </span>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-full text-[#999] hover:bg-gray-100 cursor-pointer text-sm"
          @click="stop"
        >✕</button>
      </div>

      <!-- Word card -->
      <div v-if="currentItem" class="px-5 py-6 text-center">
        <div class="text-3xl font-bold text-[#2d2d2d] leading-snug">{{ currentItem.word }}</div>
        <div class="text-lg text-[#e8735a] mt-2">{{ currentItem.reading }}</div>
        <div class="text-[15px] text-[#555] mt-2">{{ localMeaning(currentItem, currentLang) }}</div>
        <div v-if="currentItem.example" class="text-[13px] text-[#999] mt-3 leading-relaxed">{{ currentItem.example }}</div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-center gap-4 px-5 pb-5 pt-1">
        <!-- Repeat -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border cursor-pointer transition-colors"
          :class="loopRepeat
            ? 'bg-[#fdf0ed] text-[#e8735a] border-[#e8735a]'
            : 'bg-white text-[#999] border-[#e8e2dc]'"
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
          class="w-10 h-10 flex items-center justify-center rounded-full border border-[#e8e2dc] bg-white text-[#555] text-lg cursor-pointer hover:bg-gray-50"
          @click="prevTrack"
        >⏮</button>

        <!-- Play/Pause -->
        <button
          class="w-14 h-14 flex items-center justify-center rounded-full bg-[#e8735a] text-white text-2xl cursor-pointer shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
          @click="togglePlay"
        >{{ loopPaused ? '▶' : '⏸' }}</button>

        <!-- Next -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border border-[#e8e2dc] bg-white text-[#555] text-lg cursor-pointer hover:bg-gray-50"
          @click="nextTrack"
        >⏭</button>

        <!-- Stop -->
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full border border-[#e8e2dc] bg-white text-[#999] text-sm cursor-pointer hover:bg-gray-50"
          @click="stop"
        >■</button>
      </div>
    </div>
  </div>
</template>
