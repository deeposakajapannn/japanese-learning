<script setup lang="ts">
import { useLang } from '@/i18n'

const { t } = useLang()

defineProps<{
  autoRead: boolean
}>()

defineEmits<{
  toggleAutoRead: []
  markKnown: [days: number]
}>()
</script>

<template>
  <div class="flex flex-col gap-2 w-full max-w-[400px] mx-auto mt-1">
    <button
      class="w-full py-3 rounded-[10px] border-2 border-[#e8e2dc] theme-surface text-sm font-semibold cursor-pointer transition-all"
      :style="{ opacity: autoRead ? 1 : 0.7 }"
      @click="$emit('toggleAutoRead')"
    >
      {{ autoRead ? t('autoReadOn') : t('autoReadOff') }}
    </button>
    <div class="flex items-center gap-3 mt-1">
      <button
        class="flex-1 py-3 rounded-[10px] border-2 border-[#e8e2dc] theme-surface text-sm font-semibold cursor-pointer transition-all hover:border-[#5b8a72]"
        @click="$emit('markKnown', 3)"
      >
        {{ t('know3') }}
      </button>
      <button
        class="flex-1 py-3 rounded-[10px] border-2 border-[#5b8a72] bg-[#5b8a72] text-white text-sm font-semibold cursor-pointer transition-all shadow-[0_4px_16px_rgba(91,138,114,0.3)]"
        @click="$emit('markKnown', 7)"
      >
        {{ t('know7') }}
      </button>
    </div>
  </div>
</template>
