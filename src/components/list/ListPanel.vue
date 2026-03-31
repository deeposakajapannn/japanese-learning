<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/app'
import type { VocabItemWithCat } from '../../types'
import ListToolbar from './ListToolbar.vue'
import ListContainer from './ListContainer.vue'
import PaginationBar from '../common/PaginationBar.vue'
import TopicChips from './TopicChips.vue'

const store = useAppStore()

const PAGE_SIZE = 50
const searchQuery = ref('')
const currentPage = ref(1)
const isSpeaking = ref(false)
const selectedTopic = ref('')

const emit = defineEmits<{
  speak: [items: VocabItemWithCat[], from: number, to: number]
  stop: []
}>()

const allItems = computed<VocabItemWithCat[]>(() => {
  if (store.currentCat === 'mix') {
    return [
      ...store.data.nouns.map(it => ({ ...it, _cat: 'nouns' as const })),
      ...store.data.sentences.map(it => ({ ...it, _cat: 'sentences' as const })),
    ]
  }
  const cat = store.currentCat as 'nouns' | 'sentences'
  return (store.data[cat] || []).map(it => ({ ...it, _cat: cat }))
})

const topics = computed(() => {
  const counts: Record<string, number> = {}
  for (const it of allItems.value) {
    if (it.topic) counts[it.topic] = (counts[it.topic] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
})

const filteredItems = computed<VocabItemWithCat[]>(() => {
  let items = allItems.value

  if (selectedTopic.value) {
    items = items.filter(it => it.topic === selectedTopic.value)
  }

  const q = searchQuery.value.toLowerCase()
  if (!q) return items
  return items.filter(it =>
    it.word.toLowerCase().includes(q) ||
    it.reading.includes(q) ||
    it.meaning.includes(q) || (it.meaningEn && it.meaningEn.toLowerCase().includes(q)) || (it.meaningEs && it.meaningEs.toLowerCase().includes(q)) ||
    (it.example && it.example.includes(q))
  )
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / PAGE_SIZE))

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredItems.value.slice(start, start + PAGE_SIZE)
})

function onSearch(q: string) {
  searchQuery.value = q
  currentPage.value = 1
}

function onTopicSelect(topic: string) {
  selectedTopic.value = topic
  currentPage.value = 1
}

function onPageChange(dir: number) {
  currentPage.value = Math.max(1, Math.min(totalPages.value, currentPage.value + dir))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onPageGoto(page: number) {
  currentPage.value = Math.max(1, Math.min(totalPages.value, page))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onSpeak(from: number, to: number) {
  isSpeaking.value = true
  emit('speak', filteredItems.value, from, to)
}

function onStop() {
  isSpeaking.value = false
  emit('stop')
}

defineExpose({ stopSpeaking: () => { isSpeaking.value = false } })
</script>

<template>
  <div>
    <TopicChips
      v-if="topics.length > 0"
      :topics="topics"
      :selected="selectedTopic"
      @select="onTopicSelect"
    />
    <ListToolbar
      :total-items="filteredItems.length"
      :is-speaking="isSpeaking"
      @search="onSearch"
      @speak="onSpeak"
      @stop="onStop"
    />
    <ListContainer :items="pagedItems" />
    <PaginationBar
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="filteredItems.length"
      @page-change="onPageChange"
      @page-goto="onPageGoto"
    />
  </div>
</template>
