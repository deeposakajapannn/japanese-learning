<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLang } from '@/i18n'

const { t } = useLang()

const props = defineProps<{
  currentPage: number
  totalPages: number
  totalItems: number
}>()

const emit = defineEmits<{
  'page-change': [direction: number]
  'page-goto': [page: number]
}>()

const pageInput = ref(String(props.currentPage))

watch(() => props.currentPage, (v) => {
  pageInput.value = String(v)
})

function onInputConfirm() {
  const n = parseInt(pageInput.value, 10)
  if (!isNaN(n) && n >= 1 && n <= props.totalPages && n !== props.currentPage) {
    emit('page-goto', n)
  } else {
    pageInput.value = String(props.currentPage)
  }
}
</script>

<template>
  <div class="flex items-center justify-center gap-3 py-4">
    <button
      class="px-4 py-2 rounded-full border-2 border-[#e8e2dc] theme-surface theme-muted text-sm font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style="box-shadow: 0 2px 8px rgba(0,0,0,0.06)"
      :disabled="currentPage <= 1"
      @click="emit('page-change', -1)"
    >
      {{ t('prevPage') }}
    </button>
    <span class="flex items-center gap-1.5 text-sm theme-muted font-medium">
      <input
        v-model="pageInput"
        type="text"
        inputmode="numeric"
        class="w-10 text-center border-2 border-[#e8e2dc] rounded-lg py-1 text-sm font-semibold theme-text theme-surface outline-none focus:border-[#e8735a] transition-colors"
        @keydown.enter="onInputConfirm"
        @blur="onInputConfirm"
      />
      <span>/ {{ totalPages }}</span>
    </span>
    <button
      class="px-4 py-2 rounded-full border-2 border-[#e8735a] bg-[#e8735a] text-white text-sm font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style="box-shadow: 0 4px 16px rgba(232,115,90,0.3)"
      :disabled="currentPage >= totalPages"
      @click="emit('page-change', 1)"
    >
      {{ t('nextPage') }}
    </button>
  </div>
</template>
