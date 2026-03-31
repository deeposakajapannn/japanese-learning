<script setup lang="ts">
import { useLang } from '@/i18n'

const { t } = useLang()

defineEmits<{
  prev: []
  speak: []
  next: []
}>()
</script>

<template>
  <div class="flex items-center gap-3 w-full max-w-[400px] mx-auto">
    <button
      class="flex-1 py-3 rounded-[10px] border-2 border-[#e8e2dc] bg-white text-[#2d2d2d] text-sm font-semibold cursor-pointer transition-all hover:border-[#e8735a]"
      @click="$emit('prev')"
    >
      {{ t('prev') }}
    </button>
    <button
      class="flex-1 py-3 rounded-[10px] border-2 border-[#e8e2dc] bg-white text-[#2d2d2d] text-sm font-semibold cursor-pointer transition-all hover:border-[#e8735a]"
      @click="$emit('speak')"
    >
      {{ t('speak') }}
    </button>
    <button
      class="flex-1 py-3 rounded-[10px] border-2 border-[#e8735a] bg-[#e8735a] text-white text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(232,115,90,0.3)]"
      @click="$emit('next')"
    >
      {{ t('next') }}
    </button>
  </div>
</template>
