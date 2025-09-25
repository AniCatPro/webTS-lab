<template>
  <div class="columns is-multiline">
    <div v-for="it in items" :key="it.id" class="column is-3">
      <FileCard :item="it" @open="onOpen" />
    </div>
  </div>
  <FileViewerWidget v-if="activeFile" :file="activeFile" @closed="activeFile=null" @saved="onSaved" />
</template>
<script setup lang="ts">
import type { FsEntry } from '@/types';
import FileCard from './FileCard.vue';
import FileViewerWidget from "@/components/widgets/FileViewerWidget.vue";
import { ref } from 'vue';


const props = defineProps<{ items: FsEntry[] }>();
const activeFile = ref<FsEntry|null>(null);
function onOpen(it: FsEntry) { if (it.kind === 'file') activeFile.value = it; }
function onSaved() { /* можно всплывающее уведомление */ }
</script>