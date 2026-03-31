<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLang } from '@/i18n'

const { t } = useLang()

const props = defineProps<{
  totalItems: number
  isSpeaking: boolean
  canUseRange: boolean
}>()

const emit = defineEmits<{
  search: [query: string]
  speak: [from: number, to: number]
  stop: []
}>()

const searchQuery = ref('')
const listenFrom = ref(1)
const listenTo = ref<number | undefined>(undefined)
const showRange = ref(false)

watch(
  () => props.canUseRange,
  (canUseRange) => {
    if (!canUseRange) showRange.value = false
  }
)

function onSearch() {
  emit('search', searchQuery.value)
}

function onToggleSpeak() {
  if (props.isSpeaking) {
    emit('stop')
    showRange.value = false
  } else if (!props.canUseRange) {
    emit('speak', 1, props.totalItems)
  } else {
    showRange.value = !showRange.value
  }
}

function onSpeakRange() {
  const rangeMax = Math.max(1, props.totalItems)
  const from = Math.max(1, Math.min(listenFrom.value || 1, rangeMax))
  const to = Math.max(from, Math.min(listenTo.value || rangeMax, rangeMax))
  emit('speak', from, to)
}
</script>

<template>
  <div class="flex flex-col gap-2 px-4 pb-3">
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('search')"
        class="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-[#e8e2dc] theme-surface text-sm outline-none focus:border-[#e8735a] transition-colors"
        @input="onSearch"
      />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    </div>
    <div class="w-full">
      <button
        class="w-full py-3 border-0 text-white text-[15px] font-semibold cursor-pointer transition-all"
        :class="[
          isSpeaking ? 'bg-[#c9563f]' : 'bg-[#e8735a] shadow-[0_4px_16px_rgba(232,115,90,0.3)]',
          canUseRange && showRange ? 'rounded-t-[10px]' : 'rounded-[10px]'
        ]"
        @click="onToggleSpeak"
      >
        {{ isSpeaking ? t('listStop') : t('listSpeak') }}
      </button>
      <div v-if="canUseRange && showRange" class="flex flex-col gap-2 px-3 py-2.5 theme-surface border-t-0 rounded-b-[10px]">
        <div class="flex items-center justify-center gap-2">
        <span class="text-[13px] theme-muted whitespace-nowrap">{{ t('from') }}</span>
        <input
          v-model.number="listenFrom"
          type="number"
          min="1"
          :max="totalItems"
          class="w-14 py-1 px-1 border border-[#e8e2dc] rounded-lg text-sm text-center theme-surface outline-none focus:border-[#e8735a]"
        />
        <span class="text-[13px] theme-muted whitespace-nowrap">{{ t('to') }}</span>
        <input
          v-model.number="listenTo"
          type="number"
          min="1"
          :max="totalItems"
          :placeholder="String(totalItems)"
          class="w-14 py-1 px-1 border border-[#e8e2dc] rounded-lg text-sm text-center theme-surface outline-none focus:border-[#e8735a]"
        />
        </div>
        <div class="flex items-center justify-end gap-2">
          <button
            class="px-3 py-1.5 rounded-lg border border-[#e8e2dc] theme-muted text-xs font-medium hover:border-[#d8d2cc]"
            @click="showRange = false"
          >
            {{ t('cancel') }}
          </button>
          <button
            class="px-3 py-1.5 rounded-lg bg-[#e8735a] text-white text-xs font-semibold"
            @click="onSpeakRange"
          >
            {{ t('confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
