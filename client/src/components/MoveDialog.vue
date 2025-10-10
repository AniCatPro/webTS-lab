<template>
  <div class="modal is-active" @keydown.esc.prevent.stop="$emit('close')">
    <div class="modal-background" @click="$emit('close')" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Переместить в…</p>
        <button class="delete" aria-label="close" @click="$emit('close')"></button>
      </header>

      <section class="modal-card-body">
        <nav class="breadcrumb" aria-label="breadcrumbs">
          <ul>
            <li :class="{ 'is-active': browseId === null }">
              <a href="#" @click.prevent="go(null)">/</a>
            </li>
            <li v-for="(node, idx) in breadcrumb" :key="node.id" :class="{ 'is-active': idx === breadcrumb.length - 1 }">
              <a href="#" @click.prevent="go(node.id)">{{ node.name }}</a>
            </li>
          </ul>
        </nav>
        <div class="box is-flex is-align-items-center is-justify-content-space-between mb-3">
          <div>
            <strong>Текущая папка назначения:</strong>
            <span class="tag is-info ml-2">
              {{ browseId === null ? '/' : (currentName || '…') }}
            </span>
          </div>
          <label class="checkbox">
            <input type="radio" name="dest" :checked="selectedId === browseId" @change="selectedId = browseId" />
            Выбрать эту папку
          </label>
        </div>
        <div class="menu">
          <p class="menu-label">Папки внутри</p>
          <ul class="menu-list">
            <li v-if="loading"><em>Загрузка…</em></li>
            <li v-else-if="folders.length === 0"><em>Нет подпапок</em></li>
            <li v-else v-for="f in folders" :key="f.id" class="is-flex is-align-items-center is-justify-content-space-between">
              <a href="#" @click.prevent="go(f.id)">
                📁 {{ f.name }}
              </a>
              <label class="checkbox ml-2">
                <input type="radio" name="dest" :checked="selectedId === f.id" @change="selectedId = f.id" />
              </label>
            </li>
          </ul>
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-flex-end">
        <button class="button" @click="$emit('close')">Отмена</button>
        <button class="button is-primary" :disabled="submitting" @click="confirm">
          <span v-if="submitting" class="loader mr-2"></span>
          Переместить
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { FsEntry } from '@/types';
import { FilesApi } from '@/api/files';

const props = defineProps<{
  currentParentId: string | null;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', destParentId: string | null): void;
}>();

const browseId = ref<string | null>(props.currentParentId ?? null);
const selectedId = ref<string | null>(browseId.value);

const folders = ref<FsEntry[]>([]);
const loading = ref(false);
const submitting = ref(false);

const breadcrumb = ref<{ id: string; name: string }[]>([]);
const currentName = ref<string>('');

async function loadFolders(parentId: string | null) {
  loading.value = true;
  try {
    const res = await FilesApi.list({ parentId, page: 1, pageSize: 1000 });
    folders.value = (res.data || res.items || res).filter((x: FsEntry) => x.kind === 'folder');
  } finally {
    loading.value = false;
  }
}

async function buildBreadcrumb(id: string | null) {
  breadcrumb.value = [];
  currentName.value = id === null ? '/' : '';
  if (id === null) return;

  const chain: { id: string; name: string; parentId: string | null }[] = [];
  let cur: string | null = id;
  for (let i = 0; i < 50 && cur; i++) {
    const node = await FilesApi.get(cur);
    chain.push({ id: node.id, name: node.name, parentId: node.parentId ?? null });
    cur = node.parentId ?? null;
  }
  chain.reverse();
  breadcrumb.value = chain.map(n => ({ id: n.id, name: n.name }));
  currentName.value = chain[chain.length - 1]?.name || '';
}

async function go(id: string | null) {
  browseId.value = id;
  selectedId.value = id;
  await Promise.all([
    loadFolders(id),
    buildBreadcrumb(id),
  ]);
}

async function confirm() {
  submitting.value = true;
  try {
    emit('confirm', selectedId.value ?? null);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await go(browseId.value);
});

watch(() => props.currentParentId, async (v) => {
  if (v !== browseId.value) await go(v ?? null);
});
</script>

<style scoped>
.modal-card { width: 640px; max-width: 92vw; }
.loader {
  width: 1em; height: 1em; border: 2px solid rgba(255,255,255,.5); border-top-color: #fff;
  border-radius: 50%; display: inline-block; animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.menu-list > li { padding: .25rem 0; }
.menu-list a { display: inline-block; padding: .25rem 0; }
</style>