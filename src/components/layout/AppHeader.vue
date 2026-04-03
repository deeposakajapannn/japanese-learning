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
    class="sticky top-0 z-[400] px-6 py-2.5 md:px-10 md:py-3 theme-header flex items-center justify-between gap-4"
    style="box-shadow: 0 4px 20px rgba(0,0,0,0.22)"
  >
    <h1 class="text-[22px] font-bold tracking-wider leading-none flex items-center shrink-0 min-w-0">
      <ruby style="ruby-position: over">
        日本語学習
        <rp>(</rp>
        <rt class="text-[10px] font-normal tracking-[2px] opacity-90 leading-tight">にほんご がくしゅう</rt>
        <rp>)</rp>
      </ruby>
    </h1>
    <div class="flex flex-col items-end justify-center gap-1.5 shrink-0 text-xs">
      <span
        v-if="userId"
        class="bg-white/25 px-3 py-1 rounded-xl text-xs tracking-wide"
      >
        {{ userId }}
      </span>
      <span class="flex gap-[3px] opacity-85">
        <button
          v-for="lang in langs"
          :key="lang.key"
          type="button"
          class="border-none px-2 py-[3px] rounded-lg text-[10px] cursor-pointer transition-opacity"
          :class="currentLang === lang.key ? 'bg-white/40' : 'bg-white/15'"
          @click="switchLang(lang.key)"
        >
          {{ lang.label }}
        </button>
      </span>
    </div>
  </header>
</template>
