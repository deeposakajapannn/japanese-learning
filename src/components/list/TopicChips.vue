<script setup lang="ts">
import { ref } from 'vue'
import { useLang } from '@/i18n'

const props = defineProps<{
  topics: string[]
  selected: string
  levels?: string[]
  selectedLevels?: string[]
}>()

const { t } = useLang()

const emit = defineEmits<{
  select: [topic: string]
  'toggle-level': [level: string]
  'clear-levels': []
}>()

const dropdownOpen = ref(false)
const levelDropdownOpen = ref(false)

const TOPIC_I18N_KEYS: Record<string, string> = {
  '问候寒暄': 'topicGreetings',
  '饮食餐厅': 'topicFoodDining',
  '购物': 'topicShopping',
  '交通出行': 'topicTransportation',
  '住宿旅行': 'topicAccommodationTravel',
  '工作职场': 'topicWorkplace',
  '健康医疗': 'topicHealthMedical',
  '情绪心理': 'topicEmotionsPsychology',
  '日语学习': 'topicJapaneseLearning',
  '日本文化': 'topicJapaneseCulture',
  '科技网络': 'topicTechInternet',
  '天气自然': 'topicWeatherNature',
  '兴趣娱乐': 'topicHobbiesEntertainment',
  '人际关系': 'topicRelationships',
  '家庭亲子': 'topicFamilyParenting',
  '励志感悟': 'topicMotivationInsights',
  '思考议论': 'topicThinkingDiscussion',
  '日常生活': 'topicDailyLife',
  '日常场景': 'topicDailyScenes',
}

const TOPIC_ICONS: Record<string, string> = {
  '问候寒暄': '👋',
  '饮食餐厅': '🍜',
  '购物': '🛍️',
  '交通出行': '🚃',
  '住宿旅行': '🏨',
  '工作职场': '💼',
  '健康医疗': '🏥',
  '情绪心理': '💭',
  '日语学习': '📖',
  '日本文化': '⛩️',
  '科技网络': '📱',
  '天气自然': '🌸',
  '兴趣娱乐': '🎬',
  '人际关系': '🤝',
  '家庭亲子': '👨‍👩‍👧',
  '励志感悟': '💪',
  '思考议论': '🧠',
  '日常生活': '🏠',
  '日常场景': '💬',
}

function getTopicLabel(topic: string): string {
  const key = TOPIC_I18N_KEYS[topic]
  return key ? t(key) : topic
}

function onSelect(topic: string) {
  emit('select', topic)
  dropdownOpen.value = false
}

function onLevelToggle(level: string) {
  emit('toggle-level', level)
}

function onLevelClear() {
  emit('clear-levels')
  levelDropdownOpen.value = false
}
</script>

<template>
  <div class="flex items-center gap-2 px-4 pb-3">
    <!-- 全部 -->
    <button
      class="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer whitespace-nowrap"
      :class="selected === '' && (!selectedLevels || selectedLevels.length === 0)
        ? 'bg-[#e8735a] text-white border-[#e8735a] shadow-[0_2px_8px_rgba(232,115,90,0.3)]'
        : 'theme-surface theme-text border-[#e8e2dc] hover:border-[#e8735a] hover:text-[#e8735a]'"
      @click="onSelect(''); onLevelClear()"
    >
      {{ t('allTopics') }}
    </button>

    <!-- 分类下拉 -->
    <div class="relative">
      <button
        class="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer whitespace-nowrap"
        :class="selected !== ''
          ? 'bg-[#e8735a] text-white border-[#e8735a] shadow-[0_2px_8px_rgba(232,115,90,0.3)]'
          : 'theme-surface theme-text border-[#e8e2dc] hover:border-[#e8735a] hover:text-[#e8735a]'"
        @click="dropdownOpen = !dropdownOpen"
      >
        {{ selected ? (TOPIC_ICONS[selected] || '📝') + ' ' + getTopicLabel(selected) : t('topicSelect') }}
        <svg class="inline-block ml-1 -mr-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      <div
        v-if="dropdownOpen"
        class="absolute left-0 top-full mt-1 z-[300] min-w-[180px] max-h-[60vh] overflow-y-auto rounded-xl theme-surface shadow-[0_8px_32px_rgba(0,0,0,0.15)] border py-1"
        style="border-color: var(--border)"
      >
        <button
          class="w-full text-left px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#e8735a]/10"
          :class="!selected ? 'text-[#e8735a]' : 'theme-text'"
          @click="onSelect('')"
        >
          {{ t('filterNone') }}
        </button>
        <button
          v-for="topic in topics"
          :key="topic"
          class="w-full text-left px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#e8735a]/10"
          :class="selected === topic ? 'text-[#e8735a]' : 'theme-text'"
          @click="onSelect(topic)"
        >
          {{ TOPIC_ICONS[topic] || '📝' }} {{ getTopicLabel(topic) }}
        </button>
      </div>
    </div>

    <!-- 级别下拉（多选） -->
    <div v-if="levels && levels.length > 0" class="relative">
      <button
        class="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer whitespace-nowrap"
        :class="selectedLevels && selectedLevels.length > 0
          ? 'bg-[#e8735a] text-white border-[#e8735a] shadow-[0_2px_8px_rgba(232,115,90,0.3)]'
          : 'theme-surface theme-text border-[#e8e2dc] hover:border-[#e8735a] hover:text-[#e8735a]'"
        @click="levelDropdownOpen = !levelDropdownOpen"
      >
        {{ selectedLevels && selectedLevels.length > 0 ? selectedLevels.join(' ') : t('levelSelect') }}
        <svg class="inline-block ml-1 -mr-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      <div
        v-if="levelDropdownOpen"
        class="absolute left-0 top-full mt-1 z-[300] min-w-[100px] rounded-xl theme-surface shadow-[0_8px_32px_rgba(0,0,0,0.15)] border py-1"
        style="border-color: var(--border)"
      >
        <button
          class="w-full text-left px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#e8735a]/10"
          :class="!selectedLevels || selectedLevels.length === 0 ? 'text-[#e8735a]' : 'theme-text'"
          @click="onLevelClear()"
        >
          {{ t('filterNone') }}
        </button>
        <button
          v-for="lv in levels"
          :key="lv"
          class="w-full text-left px-3 py-2 text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#e8735a]/10 flex items-center gap-2"
          @click="onLevelToggle(lv)"
        >
          <svg v-if="selectedLevels?.includes(lv)" class="shrink-0 text-[#e8735a]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span v-else class="shrink-0 w-[14px]" />
          <span :class="selectedLevels?.includes(lv) ? 'text-[#e8735a]' : 'theme-text'">{{ lv }}</span>
        </button>
      </div>
    </div>

    <!-- 点击外部关闭 -->
    <teleport to="body">
      <div v-if="dropdownOpen || levelDropdownOpen" class="fixed inset-0 z-[299]" @click="dropdownOpen = false; levelDropdownOpen = false" />
    </teleport>
  </div>
</template>
