<template>
  <section class="section">
    <Breadcrumbs :folder="folder" />
    <SearchBar @search="onSearch" />
    <Spinner v-if="loading" />
    <p v-if="error" class="notification is-danger">{{ error }}</p>
    <FileList :items="items" />
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useFiles } from '@/stores/files';
import Breadcrumbs from '@/components/Breadcrumbs.vue';
import SearchBar from '@/components/SearchBar.vue';
import FileList from '@/components/FileList.vue';
import Spinner from '@/components/Spinner.vue';


const files = useFiles();
const route = useRoute();
const folderId = computed(() => String(route.params.id));


const items = computed(() => files.items);
const loading = computed(() => files.loading);
const error = computed(() => files.error);
const folder = computed(() => files.currentFolder);


onMounted(() => files.openFolder(folderId.value));
watch(folderId, id => files.openFolder(id));


function onSearch({ q, type }: { q?: string; type?: string }) {
  files.loadList({ parentId: folderId.value, q, type: type as any });
}
</script>