<template>
  <div class="card">
    <div class="card-content">
      <p class="title is-6">{{ item.name }}</p>
      <p class="subtitle is-7">{{ item.kind === 'folder' ? 'Папка' : item.mimeType }}</p>
      <div class="buttons">
        <router-link v-if="item.kind==='folder'" class="button is-small" :to="{name:'folder', params:{id:item.id}}">Открыть</router-link>
        <button v-else class="button is-small is-link" @click="$emit('open', item)">Просмотреть</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { FsEntry } from '@/types';
const props = defineProps<{ item: FsEntry }>();
</script>