<template>
  <div class="modal is-active">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card" style="width: 680px; max-width: 95vw;">
      <header class="modal-card-head">
        <p class="modal-card-title">Переместить в папку</p>
        <button class="delete" aria-label="close" @click="$emit('close')"></button>
      </header>
      <section class="modal-card-body">
        <nav class="breadcrumb" aria-label="breadcrumbs" v-if="trail.length">
          <ul>
            <li v-for="(node, idx) in trail" :key="node.id" :class="{ 'is-active': idx===trail.length-1 }">
              <a href="#" @click.prevent="goTo(node.id)">{{ node.name || 'Корень' }}</a>
            </li>
          </ul>
        </nav>

        <div class="buttons mb-3">
          <button class="button is-small" @click="goTo(null)">В корень</button>
          <button class="button is-small" :disabled="!selected" @click="confirm">Выбрать</button>
        </div>

        <p v-if="loading">Загрузка…</p>
        <p v-if="error" class="notification is-danger">{{ error }}</p>

        <ul v-if="!loading" class="menu-list">
          <li v-for="f in folders" :key="f.id">
            <a
                href="#"
                :class="{ 'is-active': selected && selected.id===f.id }"
                @click.prevent="selected = f"
                @dblclick.prevent="enter(f)"
            >
              📁 {{ f.name }}
            </a>
          </li>
          <li v-if="folders.length===0"><em>Папок нет</em></li>
        </ul>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-primary" :disabled="!selected" @click="confirm">Переместить сюда</button>
        <button class="button" @click="$emit('close')">Отмена</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { FilesApi } from '@/api/files';
import type { FsEntry } from '@/types';

const props = defineProps<{ currentParentId: string | null }>();
const emit = defineEmits<{ (e:'close'): void; (e:'confirm', parentId: string | null): void }>();

const loading = ref(false);
const error = ref<string | null>(null);
const folders = ref<FsEntry[]>([]);
const selected = ref<FsEntry | null>(null);

const trail = ref<{ id: string | null; name: string }[]>([]); // хлебные крошки
let current: string | null = props.currentParentId ?? null;

async function load() {
  try {
    loading.value = true;
    error.value = null;
    const res = await FilesApi.list({ parentId: current, page: 1, pageSize: 100 });
    folders.value = (res.data as FsEntry[]).filter(f => f.kind === 'folder');
    selected.value = null;

    // trail: перезагрузим хлебные крошки — в простом виде хранить только текущий узел
    // можно улучшить до полноценной цепочки, если хранить map id->name.
    if (trail.value.length === 0 || trail.value[trail.value.length - 1].id !== current) {
      trail.value.push({ id: current, name: current ? 'Папка' : 'Корень' });
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

function goTo(id: string | null) {
  current = id;
  // обрежем trail до найденного места (или корня)
  const idx = trail.value.findIndex(t => t.id === id);
  if (idx >= 0) trail.value = trail.value.slice(0, idx + 1);
  else trail.value.push({ id, name: id ? 'Папка' : 'Корень' });
  load();
}
function enter(f: FsEntry) {
  // заход внутрь папки
  current = f.id;
  trail.value.push({ id: f.id, name: f.name });
  load();
}
function confirm() {
  // если выбрана папка — туда; если нет — текущий уровень (можно корень)
  const dest = selected.value ? selected.value.id : current;
  emit('confirm', dest ?? null);
}

onMounted(load);
</script>

<style scoped>
.menu-list a.is-active { font-weight: 600; }
</style>