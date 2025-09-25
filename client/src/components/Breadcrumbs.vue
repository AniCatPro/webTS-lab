<template>
  <nav class="breadcrumb" aria-label="breadcrumbs" v-if="trail.length">
    <ul>
      <li>
        <router-link :to="{ name: 'home' }">Корень</router-link>
      </li>
      <li v-for="(f, idx) in trail" :key="f.id" :class="{ 'is-active': idx === trail.length - 1 }">
        <router-link v-if="idx < trail.length - 1" :to="{ name: 'folder', params: { id: f.id } }">
          {{ f.name }}
        </router-link>
        <a v-else aria-current="page">{{ f.name }}</a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { FsEntry } from '@/types';
import { FilesApi } from '@/api/files';

const props = defineProps<{ folder: FsEntry | null }>();

type FolderOnly = FsEntry & { kind: 'folder' };

const trail = ref<FolderOnly[]>([]);

// Строим цепочку родителей до корня
async function buildTrail(folder: FsEntry | null) {
  const chain: FolderOnly[] = [];
  let cur: FsEntry | null = folder;
  while (cur && cur.parentId !== null && cur.kind === 'folder') {
    chain.unshift(cur as FolderOnly); // добавляем в начало
    // грузим родителя
    cur = cur.parentId ? await FilesApi.get(cur.parentId) : null;
  }
  // если текущая папка — не root (parentId!==null), но цепочка пуста — добавим её
  if (folder && folder.kind === 'folder' && !chain.find(x => x.id === folder.id)) {
    chain.push(folder as FolderOnly);
  }
  trail.value = chain;
}

watch(() => props.folder, (f) => buildTrail(f), { immediate: true });
onMounted(() => buildTrail(props.folder));
</script>
