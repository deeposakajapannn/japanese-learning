<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useLang } from '@/i18n'

const store = useAppStore()
const { t } = useLang()

const categories = [
  { key: 'sentences', labelKey: 'catSent', count: '1680' },
  { key: 'nouns', labelKey: 'catNouns', count: '948' },
  { key: 'kana', labelKey: 'catKana' },
] as const
</script>

<template>
  <div
    v-if="store.currentMode !== 'stats'"
    class="flex gap-2 px-4 pt-1 pb-3 flex-wrap md:px-10"
  >
    <button
      v-for="cat in categories"
      :key="cat.key"
      class="px-4 py-[7px] border-2 rounded-full text-[13px] font-medium cursor-pointer transition-all duration-300"
      :class="
        store.currentCat === cat.key
          ? 'border-[#e8735a] bg-[#fdf0ed] text-[#e8735a]'
          : 'border-[#e8e2dc] bg-transparent text-[#777]'
      "
      @click="store.switchCat(cat.key)"
    >
      {{ t(cat.labelKey) + ('count' in cat ? ' (' + cat.count + ')' : '') }}
    </button>
  </div>
</template>
