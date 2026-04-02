<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useFirebase } from '@/composables/useFirebase'
import { useQuiz } from '@/composables/useQuiz'
import { useMasteryTest } from '@/composables/useMasteryTest'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppNav from '@/components/layout/AppNav.vue'
import CategoryTabs from '@/components/common/CategoryTabs.vue'
import ListPanel from '@/components/list/ListPanel.vue'
import PracticePanel from '@/components/practice/PracticePanel.vue'
import MasteryTestPanel from '@/components/mastery/MasteryTestPanel.vue'
import StatsPanel from '@/components/stats/StatsPanel.vue'
import LoopBar from '@/components/loop/LoopBar.vue'
import KanaGrid from '@/components/kana/KanaGrid.vue'
import ArticlesPanel from '@/components/articles/ArticlesPanel.vue'
import { useLoopPlayer } from '@/composables/useLoopPlayer'
import { stopLoop as stopPracticeAudioLoop } from '@/composables/useAudio'
import { useTheme } from '@/composables/useTheme'
import { restoreListenListHiddenOnTestMode } from '@/learning'

const store = useAppStore()
const { loopPlaying, startListPlayback, stop: stopListPlayback } = useLoopPlayer()
const listPanelRef = ref<InstanceType<typeof ListPanel> | null>(null)

watch(loopPlaying, (val) => {
  if (!val) listPanelRef.value?.stopSpeaking()
})
const { userId, initFirebase, pullAndMerge } = useFirebase()
const { isAnswered, showAnswer, submitAnswer, startQuiz } = useQuiz()
const masteryTest = useMasteryTest()
const { initTheme } = useTheme()

watch(() => [store.currentMode, store.currentCat], () => {
  if (store.currentMode === 'practice') startQuiz()
})

watch(
  () => store.currentMode,
  (mode, prev) => {
    if (mode === 'test') restoreListenListHiddenOnTestMode()
    // 离开「听」：停列表循环，避免与测/练争用全局 audioEl
    if (prev === 'list' && mode !== 'list') {
      stopListPlayback()
      listPanelRef.value?.stopSpeaking()
    }
    // 离开「测」「练」：停单曲循环与保活（v-show 下面板仍挂载，否则会抢主轨或让 iOS 上后续 play 失败）
    if ((prev === 'test' || prev === 'practice') && mode !== prev) {
      stopPracticeAudioLoop()
    }
  },
)

function onGlobalKeydown(e: KeyboardEvent) {
  if (store.currentMode === 'practice') {
    if (e.key === ' ' && !isAnswered.value) {
      e.preventDefault()
      showAnswer()
    }
    if (isAnswered.value && e.key === 'ArrowLeft') submitAnswer(true)
    if (isAnswered.value && e.key === 'ArrowRight') submitAnswer(false)
  }
  if (store.currentMode === 'test') {
    if (e.key === ' ' || e.key === 'ArrowRight') {
      e.preventDefault()
      if (masteryTest.isAnswered.value) {
        masteryTest.nextAfterPass()
      } else {
        masteryTest.skip()
      }
    }
  }
}

onMounted(async () => {
  initTheme()
  initFirebase()
  await store.loadData()

  if (userId.value) {
    pullAndMerge()
  }

  document.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <AppHeader />
  <div class="flex min-h-[100svh]">
    <AppNav />
    <div class="flex-1 min-w-0 pb-20 md:ml-[200px]">
      <CategoryTabs />
      <div v-show="store.currentMode === 'list'">
        <KanaGrid v-if="store.currentCat === 'kana'" />
        <ArticlesPanel v-else-if="store.currentCat === 'articles'" />
        <ListPanel
          v-else
          ref="listPanelRef"
          @speak="(items, from, to) => startListPlayback(items, from, to)"
          @stop="() => { stopListPlayback(); listPanelRef?.stopSpeaking() }"
        />
      </div>
      <div v-show="store.currentMode === 'practice'" class="px-4 pb-5 md:px-10 md:max-w-[800px] md:mx-auto">
        <PracticePanel />
      </div>
      <div v-show="store.currentMode === 'test'" class="px-4 pb-5 md:px-10 md:max-w-[800px] md:mx-auto">
        <MasteryTestPanel />
      </div>
      <div v-show="store.currentMode === 'stats'" class="px-4 pb-5 md:px-10 md:max-w-[800px] md:mx-auto">
        <StatsPanel />
      </div>
    </div>
  </div>
  <LoopBar />
</template>
