<script setup lang="ts">
const props = defineProps<{
  pageIndex: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  'update:pageIndex': [value: number]
}>()

const from = computed(() => props.total ? props.pageIndex * props.pageSize + 1 : 0)
const to = computed(() => Math.min((props.pageIndex + 1) * props.pageSize, props.total))
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-default px-4 py-3.5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
    <span>{{ from }}-{{ to }} nga {{ total }} rreshta</span>
    <UPagination
      :page="pageIndex + 1"
      :items-per-page="pageSize"
      :total="total"
      size="sm"
      @update:page="emit('update:pageIndex', $event - 1)"
    />
  </div>
</template>
