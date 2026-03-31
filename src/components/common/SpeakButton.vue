<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'

const props = defineProps<{
  word: string
  example?: string
}>()

const { speakWithExample } = useAudio()

function handleSpeak() {
  speakWithExample(props.word, props.example)
}
</script>

<template>
  <button
    class="shrink-0 w-10 h-10 border-none rounded-full bg-[#fdf0ed] text-[#e8735a] text-lg cursor-pointer transition-all flex items-center justify-center active:bg-[#e8735a] active:text-white"
    @click.stop="handleSpeak"
  >
    🔊
  </button>
</template>
