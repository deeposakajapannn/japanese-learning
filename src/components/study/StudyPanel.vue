<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'
import { useStudy } from '../../composables/useStudy'
import { getActiveItems } from '../../composables/useSpacedRepetition'
import { useLang } from '@/i18n'

const { t } = useLang()
import FlashCard from './FlashCard.vue'
import StudyActions from './StudyActions.vue'
import StudyNav from './StudyNav.vue'

const store = useAppStore()
const { studyIndex, isFlipped, autoRead, flipCard, studyNav, markKnown, speakCurrent, toggleAutoRead } = useStudy()

const items = computed(() => getActiveItems(store.currentCat))
const currentItem = computed(() => items.value[studyIndex.value] ?? null)
const progressText = computed(() => {
  if (!items.value.length) return t('allMastered')
  return `${studyIndex.value + 1} / ${items.value.length} (${t('remaining')})`
})
</script>

<template>
  <div class="flex flex-col items-center gap-4 px-4 py-6">
    <div class="text-sm text-[#777] font-medium">{{ progressText }}</div>
    <FlashCard
      :item="currentItem"
      :is-flipped="isFlipped"
      @flip="flipCard"
    />
    <StudyActions
      @prev="studyNav(-1)"
      @speak="speakCurrent"
      @next="studyNav(1)"
    />
    <StudyNav
      :auto-read="autoRead"
      @toggle-auto-read="toggleAutoRead"
      @mark-known="markKnown"
    />
  </div>
</template>
