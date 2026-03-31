<script setup lang="ts">
import { useLang } from '@/i18n'

defineProps<{
  topics: string[]
  selected: string
}>()

const { t } = useLang()

const emit = defineEmits<{
  select: [topic: string]
}>()

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
</script>

<template>
  <div class="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
    <button
      class="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer whitespace-nowrap"
      :class="selected === ''
        ? 'bg-[#e8735a] text-white border-[#e8735a] shadow-[0_2px_8px_rgba(232,115,90,0.3)]'
        : 'bg-white text-[#555] border-[#e8e2dc] hover:border-[#e8735a] hover:text-[#e8735a]'"
      @click="emit('select', '')"
    >
      {{ t('allTopics') }}
    </button>
    <button
      v-for="topic in topics"
      :key="topic"
      class="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer whitespace-nowrap"
      :class="selected === topic
        ? 'bg-[#e8735a] text-white border-[#e8735a] shadow-[0_2px_8px_rgba(232,115,90,0.3)]'
        : 'bg-white text-[#555] border-[#e8e2dc] hover:border-[#e8735a] hover:text-[#e8735a]'"
      @click="emit('select', topic)"
    >
      {{ TOPIC_ICONS[topic] || '📝' }} {{ getTopicLabel(topic) }}
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
