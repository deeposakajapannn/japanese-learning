<script setup lang="ts">
import type { VocabItemWithCat } from '../../types'
import ListItem from './ListItem.vue'
import { useLang } from '@/i18n'

const { t } = useLang()

defineProps<{
  items: VocabItemWithCat[]
}>()
</script>

<template>
  <div class="flex flex-col gap-3 px-4 pb-4 md:px-10">
    <ListItem
      v-for="item in items"
      :key="item._cat + ':' + item.id"
      :item="item"
      :cat="item._cat"
    />
    <div v-if="items.length === 0" class="text-center theme-muted py-12 text-sm">
      {{ t('notFound') }}
    </div>
  </div>
</template>
