<script setup lang="ts">
defineProps<{
  topics: string[]
  selected: string
}>()

const emit = defineEmits<{
  select: [topic: string]
}>()

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
      全部
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
      {{ TOPIC_ICONS[topic] || '📝' }} {{ topic }}
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
