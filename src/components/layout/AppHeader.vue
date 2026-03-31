<script setup lang="ts">
import { useLang } from '@/i18n'
import { useFirebase } from '@/composables/useFirebase'

const { currentLang, switchLang } = useLang()
const { userId } = useFirebase()

const langs = [
  { key: 'zh', label: '中' },
  { key: 'en', label: 'EN' },
] as const
</script>

<template>
  <header
    class="sticky top-0 z-[400] text-white px-6 pt-5 pb-4 md:px-10 md:pt-6 md:pb-5"
    style="background: linear-gradient(135deg, #e8735a 0%, #e8a05a 100%); box-shadow: 0 4px 20px rgba(232,115,90,0.3)"
  >
    <div class="flex justify-between items-center">
      <h1 class="text-[22px] font-bold tracking-wider">
        <ruby style="ruby-position: over">
          日本語学習
          <rp>(</rp>
          <rt class="text-[10px] font-normal tracking-[2px]">にほんご がくしゅう</rt>
          <rp>)</rp>
        </ruby>
      </h1>
      <span
        v-if="userId"
        class="bg-white/25 px-3 py-1 rounded-xl text-xs tracking-wide"
      >
        {{ userId }}
      </span>
    </div>
    <div class="flex justify-between items-center mt-1.5 text-xs opacity-85">
      <span />
      <span class="flex gap-[3px]">
        <button
          v-for="lang in langs"
          :key="lang.key"
          class="border-none text-white px-2 py-[3px] rounded-lg text-[10px] cursor-pointer transition-opacity"
          :class="currentLang === lang.key ? 'bg-white/40' : 'bg-white/15'"
          @click="switchLang(lang.key)"
        >
          {{ lang.label }}
        </button>
      </span>
    </div>
  </header>
</template>
