<template>
  <div class="local-session-import-backdrop" role="presentation" @click="onClose">
    <section
      class="local-session-import-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('Import local sessions')"
      @click.stop
    >
      <header class="local-session-import-header">
        <div class="local-session-import-heading">
          <h2>{{ t('Import local sessions') }}</h2>
          <p>{{ threads.length }} {{ t('sessions on this computer') }}</p>
        </div>
        <button class="local-session-import-close" type="button" :aria-label="t('Close')" @click="onClose">
          <IconTablerX />
        </button>
      </header>

      <div v-if="isLoading" class="local-session-import-loading" role="status">
        <IconTablerRefresh class="local-session-import-spinner" />
        <span>{{ t('Loading local sessions...') }}</span>
      </div>

      <div v-else-if="error" class="local-session-import-error" role="alert">
        <p>{{ error }}</p>
        <button type="button" @click="$emit('retry')">{{ t('Retry') }}</button>
      </div>

      <template v-else>
        <div class="local-session-import-search">
          <IconTablerSearch aria-hidden="true" />
          <input v-model="query" type="search" :placeholder="t('Search local sessions...')">
        </div>

        <div class="local-session-import-toolbar">
          <label>
            <input type="checkbox" :checked="allFilteredSelected" @change="toggleAllFiltered">
            <span>{{ t('Select all shown') }}</span>
          </label>
          <span>{{ selectedIds.size }} {{ t('selected') }}</span>
        </div>

        <div v-if="filteredThreads.length === 0" class="local-session-import-empty">
          {{ t('No local sessions found') }}
        </div>
        <div v-else class="local-session-import-list">
          <label v-for="thread in visibleThreads" :key="thread.id" class="local-session-import-row">
            <input type="checkbox" :checked="selectedIds.has(thread.id)" @change="toggleThread(thread.id)">
            <span class="local-session-import-row-copy">
              <span class="local-session-import-row-title">{{ thread.title || t('Untitled thread') }}</span>
              <span class="local-session-import-row-meta">
                <span>{{ thread.projectName }}</span>
                <time :datetime="thread.updatedAtIso">{{ formatUpdatedAt(thread.updatedAtIso) }}</time>
              </span>
              <span class="local-session-import-row-path" :title="thread.cwd">{{ thread.cwd }}</span>
            </span>
            <span v-if="initialSelectedIds.has(thread.id)" class="local-session-import-status">
              {{ t('Imported') }}
            </span>
          </label>
          <button
            v-if="visibleThreads.length < filteredThreads.length"
            class="local-session-import-more"
            type="button"
            @click="visibleCount += PAGE_SIZE"
          >
            {{ t('Show more') }}
          </button>
        </div>

        <footer class="local-session-import-actions">
          <button type="button" class="local-session-import-cancel" @click="onClose">{{ t('Cancel') }}</button>
          <button type="button" class="local-session-import-confirm" @click="confirmSelection">
            {{ t('Import') }} {{ selectedIds.size }}
          </button>
        </footer>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { UiThread } from '../../types/codex'
import { useUiLanguage } from '../../composables/useUiLanguage'
import IconTablerRefresh from '../icons/IconTablerRefresh.vue'
import IconTablerSearch from '../icons/IconTablerSearch.vue'
import IconTablerX from '../icons/IconTablerX.vue'

const PAGE_SIZE = 60

const props = defineProps<{
  threads: UiThread[]
  selectedThreadIds: string[]
  isLoading: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  retry: []
  confirm: [threadIds: string[]]
}>()

const { t } = useUiLanguage()
const query = ref('')
const visibleCount = ref(PAGE_SIZE)
const initialSelectedIds = new Set(props.selectedThreadIds)
const selectedIds = ref(new Set(props.selectedThreadIds))

const filteredThreads = computed(() => {
  const normalizedQuery = query.value.trim().toLocaleLowerCase()
  if (!normalizedQuery) return props.threads
  return props.threads.filter((thread) => (
    thread.title.toLocaleLowerCase().includes(normalizedQuery)
    || thread.projectName.toLocaleLowerCase().includes(normalizedQuery)
    || thread.cwd.toLocaleLowerCase().includes(normalizedQuery)
  ))
})
const visibleThreads = computed(() => filteredThreads.value.slice(0, visibleCount.value))
const allFilteredSelected = computed(() => (
  filteredThreads.value.length > 0
  && filteredThreads.value.every((thread) => selectedIds.value.has(thread.id))
))

watch(query, () => {
  visibleCount.value = PAGE_SIZE
})

function toggleThread(threadId: string): void {
  const next = new Set(selectedIds.value)
  if (next.has(threadId)) next.delete(threadId)
  else next.add(threadId)
  selectedIds.value = next
}

function toggleAllFiltered(): void {
  const next = new Set(selectedIds.value)
  if (allFilteredSelected.value) {
    for (const thread of filteredThreads.value) next.delete(thread.id)
  } else {
    for (const thread of filteredThreads.value) next.add(thread.id)
  }
  selectedIds.value = next
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

function onClose(): void {
  emit('close')
}

function confirmSelection(): void {
  emit('confirm', Array.from(selectedIds.value))
}
</script>
