<template>
  <article class="box fm-box">
    <div class="fm-top">
      <div class="fm-name" :title="item.name">{{ item.name }}</div>
      <div class="fm-meta">
        {{ item.kind === 'folder' ? 'Папка' : (item.mimeType || item.type || 'файл') }}
      </div>
    </div>

    <div class="fm-actions">
      <router-link
          v-if="item.kind==='folder'"
          class="button is-small"
          :to="{ name:'folder', params:{ id:item.id } }"
      >
        Открыть
      </router-link>

      <button
          v-else
          class="button is-small is-link"
          @click="$emit('open', item)"
      >
        Просмотреть
      </button>

      <button
          class="button is-small is-light has-text-danger"
          @click="$emit('delete')"
      >
        Удалить
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { FsEntry } from '@/types';
defineProps<{ item: FsEntry }>();
defineEmits<{ (e:'open', item: FsEntry): void; (e:'delete'): void }>();
</script>

<style scoped>
.fm-box { display:flex; flex-direction: column; gap: .75rem; border-radius: 12px; }
.fm-top { min-height: 44px; }
.fm-name { font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fm-meta { font-size: .85rem; color: #7a7a7a; margin-top: .25rem; }
.fm-actions { display: flex; gap: .5rem; }
</style>
