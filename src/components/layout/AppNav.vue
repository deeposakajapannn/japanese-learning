<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useLang } from '@/i18n'

const store = useAppStore()
const { t } = useLang()

const navItems = [
  { mode: 'list', icon: '👂', key: 'tabList' },
  { mode: 'practice', icon: '✏️', key: 'tabPractice' },
  { mode: 'test', icon: '📝', key: 'tabTest' },
  { mode: 'stats', icon: '🤪', key: 'tabStats' },
] as const
</script>

<template>
  <!-- Mobile: fixed bottom bar -->
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-[200] flex theme-nav-mobile"
    style="box-shadow: 0 -2px 12px rgba(0,0,0,0.06); padding-bottom: env(safe-area-inset-bottom)"
  >
    <button
      v-for="item in navItems"
      :key="item.mode"
      class="flex-1 flex flex-col items-center gap-[2px] pt-2.5 pb-2 border-none bg-transparent text-[11px] font-semibold cursor-pointer transition-all"
      :class="store.currentMode === item.mode ? 'text-[#e8735a]' : 'text-[#777]'"
      @click="store.switchMode(item.mode)"
    >
      <span class="text-[22px]">{{ item.icon }}</span>
      <span>{{ t(item.key) }}</span>
    </button>
  </nav>

  <!-- Desktop: fixed left sidebar -->
  <nav
    class="hidden md:flex fixed top-0 left-0 bottom-0 w-[200px] flex-col gap-1 pt-20 px-3 pb-6 theme-nav-desktop z-[300]"
    style="box-shadow: 2px 0 12px rgba(0,0,0,0.04)"
  >
    <div class="text-lg font-bold text-[#e8735a] px-3 pb-5">
    </div>
    <button
      v-for="item in navItems"
      :key="item.mode"
      class="flex items-center gap-2.5 px-4 py-3.5 border-none bg-transparent rounded-[10px] text-[15px] font-semibold cursor-pointer transition-all text-left"
      :class="store.currentMode === item.mode ? 'app-nav-pill--active' : 'text-[#777]'"
      @click="store.switchMode(item.mode)"
    >
      <span class="text-xl">{{ item.icon }}</span>
      <span>{{ t(item.key) }}</span>
    </button>
  </nav>
</template>
