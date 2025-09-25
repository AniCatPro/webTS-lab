<template>
  <section class="section">
    <h1 class="title">Файлы — Корень</h1>
    <SearchBar @search="onSearch" />
    <Spinner v-if="loading" />
    <p v-if="error" class="notification is-danger">{{ error }}</p>
    <FileList :items="items" />
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useFiles } from '@/stores/files';
import SearchBar from '@/components/SearchBar.vue';
import FileList from '@/components/FileList.vue';
import Spinner from '@/components/Spinner.vue';


const files = useFiles();
const items = computed(() => files.items);
const loading = computed(() => files.loading);
const error = computed(() => files.error);


onMounted(() => files.openFolder(null));


function onSearch({ q, type }: { q?: string; type?: string }) {
  files.loadList({ parentId: null, q, type: type as any });
}
</script>