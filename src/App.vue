<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useFirebase } from '@/composables/useFirebase'
import { useQuiz } from '@/composables/useQuiz'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNav from '@/components/layout/AppNav.vue'
import CategoryTabs from '@/components/common/CategoryTabs.vue'
import ListPanel from '@/components/list/ListPanel.vue'
import PracticePanel from '@/components/practice/PracticePanel.vue'
import StatsPanel from '@/components/stats/StatsPanel.vue'
import LoopBar from '@/components/loop/LoopBar.vue'
import KanaGrid from '@/components/kana/KanaGrid.vue'
import { useLoopPlayer } from '@/composables/useLoopPlayer'
import { useTheme } from '@/composables/useTheme'

const store = useAppStore()
const { loopPlaying, startListPlayback, stop: stopLoop } = useLoopPlayer()
const listPanelRef = ref<InstanceType<typeof ListPanel> | null>(null)

watch(loopPlaying, (val) => {
  if (!val) listPanelRef.value?.stopSpeaking()
})
const { userId, initFirebase, pullAndMerge } = useFirebase()
const { isAnswered, showAnswer, submitAnswer, startQuiz } = useQuiz()
const { initTheme } = useTheme()

watch(() => [store.currentMode, store.currentCat], () => {
  if (store.currentMode === 'practice') startQuiz()
})

onMounted(async () => {
  initTheme()
  initFirebase()
  await store.loadData()

  if (userId.value) {
    pullAndMerge()
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (store.currentMode === 'practice') {
      if (e.key === ' ' && !isAnswered.value) {
        e.preventDefault()
        showAnswer()
      }
      if (isAnswered.value && e.key === 'ArrowLeft') submitAnswer(true)
      if (isAnswered.value && e.key === 'ArrowRight') submitAnswer(false)
    }
  })
})
</script>

<template>
  <AppHeader />
  <div class="flex min-h-screen">
    <AppNav />
    <div class="flex-1 min-w-0 pb-20 md:ml-[200px]">
      <CategoryTabs />
      <div v-show="store.currentMode === 'list'">
        <KanaGrid v-if="store.currentCat === 'kana'" />
        <ListPanel
          v-else
          ref="listPanelRef"
          @speak="(items, from, to) => startListPlayback(items, from, to)"
          @stop="() => { stopLoop(); listPanelRef?.stopSpeaking() }"
        />
      </div>
      <div v-show="store.currentMode === 'practice'" class="px-4 pb-5 md:px-10 md:max-w-[800px] md:mx-auto">
        <PracticePanel />
      </div>
      <div v-show="store.currentMode === 'stats'" class="px-4 pb-5 md:px-10 md:max-w-[800px] md:mx-auto">
        <StatsPanel />
      </div>
    </div>
  </div>
  <LoopBar />
</template>
