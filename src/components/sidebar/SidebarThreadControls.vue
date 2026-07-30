<template>
  <div class="sidebar-thread-controls">
    <button
      class="sidebar-thread-controls-button"
      type="button"
      :aria-label="isSidebarCollapsed ? t('Expand sidebar') : t('Collapse sidebar')"
      :title="isSidebarCollapsed ? t('Expand sidebar') : t('Collapse sidebar')"
      @click="$emit('toggle-sidebar')"
    >
      <IconTablerLayoutSidebarFilled v-if="isSidebarCollapsed" class="sidebar-thread-controls-icon" />
      <IconTablerLayoutSidebar v-else class="sidebar-thread-controls-icon" />
    </button>

    <slot />

    <button
      v-if="showLocalSessionImportButton"
      class="sidebar-thread-controls-button"
      type="button"
      :aria-label="isLoadingLocalSessions ? t('Loading local sessions...') : t('Import local sessions')"
      :title="isLoadingLocalSessions ? t('Loading local sessions...') : t('Import local sessions')"
      :disabled="isLoadingLocalSessions"
      @click="$emit('load-local-sessions')"
    >
      <IconTablerRefresh
        class="sidebar-thread-controls-icon"
        :class="{ 'sidebar-thread-controls-icon--spinning': isLoadingLocalSessions }"
      />
    </button>

    <button
      v-if="showNewThreadButton"
      class="sidebar-thread-controls-button"
      type="button"
      :aria-label="t('Start new thread')"
      :title="t('Start new thread')"
      @click="$emit('start-new-thread')"
    >
      <IconTablerFilePencil class="sidebar-thread-controls-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useUiLanguage } from '../../composables/useUiLanguage'
import IconTablerFilePencil from '../icons/IconTablerFilePencil.vue'
import IconTablerLayoutSidebar from '../icons/IconTablerLayoutSidebar.vue'
import IconTablerLayoutSidebarFilled from '../icons/IconTablerLayoutSidebarFilled.vue'
import IconTablerRefresh from '../icons/IconTablerRefresh.vue'

defineProps<{
  isSidebarCollapsed: boolean
  showNewThreadButton?: boolean
  showLocalSessionImportButton?: boolean
  isLoadingLocalSessions?: boolean
}>()

defineEmits<{
  'toggle-sidebar': []
  'start-new-thread': []
  'load-local-sessions': []
}>()

const { t } = useUiLanguage()
</script>

<style scoped>
@reference "tailwindcss";

.sidebar-thread-controls {
  @apply flex flex-row flex-nowrap items-center gap-2;
}

.sidebar-thread-controls-button {
  @apply h-6.75 w-6.75 rounded-md border border-transparent bg-transparent text-zinc-600 flex items-center justify-center transition hover:border-zinc-200 hover:bg-zinc-50;
}

.sidebar-thread-controls-button:disabled {
  @apply cursor-wait opacity-60;
}

.sidebar-thread-controls-icon {
  @apply w-4 h-4;
}

.sidebar-thread-controls-icon--spinning {
  animation: sidebar-thread-controls-spin 0.8s linear infinite;
}

@keyframes sidebar-thread-controls-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
