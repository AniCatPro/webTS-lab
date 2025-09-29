<template>
  <div class="level mb-4">
    <div class="level-left">
      <div class="file is-link">
        <label class="file-label">
          <input class="file-input" type="file" @change="onPick" />
          <span class="file-cta">
            <span class="file-label">Загрузить файл</span>
          </span>
        </label>
      </div>
    </div>
  </div>

  <div class="columns is-multiline is-variable is-5">
    <div
        v-for="it in items"
        :key="it.id"
        class="column is-12-mobile is-6-tablet is-4-desktop is-3-widescreen"
    >
      <FileCard :item="it" @open="onOpen" @delete="onDelete(it)" />
    </div>
  </div>

  <FileViewerWidget
      v-if="activeFile"
      :file="activeFile"
      @closed="activeFile=null"
      @saved="onSaved"
  />
</template>

<script setup lang="ts">
import type { FsEntry } from '@/types';
import FileCard from './FileCard.vue';
import FileViewerWidget from '@/components/widgets/FileViewerWidget.vue';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { FilesApi } from '@/api/files';
import { useFiles } from '@/stores/files';

const props = defineProps<{ items: FsEntry[] }>();
const activeFile = ref<FsEntry|null>(null);

const route = useRoute();
const store = useFiles();
const parentId = (route.name === 'folder') ? String(route.params.id) : undefined;

function onOpen(it: FsEntry) {
  if (it.kind === 'file') activeFile.value = it;
}
async function onSaved() {
  await refresh();
}

async function refresh() {
  await store.loadList({ parentId });
}

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    await FilesApi.upload(file, parentId ?? null);
    await refresh();
  } catch (err: any) {
    alert(err?.response?.data?.message || err.message);
  } finally {
    input.value = '';
  }
}

function onDelete(it: FsEntry) {
  return async () => {
    if (!confirm(`Удалить ${it.kind === 'folder' ? 'папку' : 'файл'} "${it.name}"?`)) return;
    try {
      await FilesApi.remove(it.id);
      await refresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message);
    }
  };
}
</script>
