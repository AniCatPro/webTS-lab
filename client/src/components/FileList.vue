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
      <button class="button is-primary ml-2" @click="onCreateFolder">Новая папка</button>
    </div>

    <div class="level-right">
      <div class="buttons has-addons">
        <button
            class="button"
            :class="{ 'is-link is-light': viewMode==='grid' }"
            @click="viewMode='grid'"
            title="Сетка"
        >
          Сетка
        </button>
        <button
            class="button"
            :class="{ 'is-link is-light': viewMode==='list' }"
            @click="viewMode='list'"
            title="Список"
        >
          Список
        </button>
      </div>
    </div>
  </div>

  <!-- GRID VIEW -->
  <div v-if="viewMode==='grid'" class="columns is-multiline is-variable is-5" @dragover.prevent="onDesktopDragOver" @drop.prevent="onDesktopDrop">
    <div
        v-for="it in items"
        :key="it.id"
        class="column is-12-mobile is-6-tablet is-4-desktop is-3-widescreen"
    >
      <div class="fm-grid-item" @dblclick="onDblClick(it)" :class="{ 'is-drop-target': dragOverId===it.id }" @dragover.prevent="it.kind==='folder' ? onFolderDragOver(it, $event) : null" @dragleave="it.kind==='folder' ? onFolderDragLeave(it) : null" @drop.prevent="it.kind==='folder' ? onFolderDrop(it, $event) : null">
        <FileCard
            :item="it"
            @open="onOpen"
            @delete="onDelete"
            @move="onMove"
            @context="(item, ev) => openContextMenu(ev, item)"
            @dragstart="onCardDragStart"
            @dragend="onCardDragEnd"
        />
      </div>
    </div>
  </div>

  <!-- LIST VIEW -->
  <div v-else class="table-container" @dragover.prevent="onDesktopDragOver" @drop.prevent="onDesktopDrop">
    <table class="table is-fullwidth is-hoverable is-striped">
      <thead>
      <tr>
        <th>Имя</th>
        <th>Тип</th>
        <th class="has-text-right">Размер</th>
        <th>Добавлен</th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="it in items"
          :key="it.id"
          draggable="true"
          @dragstart="onRowDragStart(it, $event)"
          @dragend="onRowDragEnd"
          @dblclick="onDblClick(it)"
          @contextmenu.prevent="openContextMenu($event, it)"
          :class="{ 'is-drop-target': dragOverId===it.id }"
          @dragover.prevent="it.kind==='folder' ? onFolderDragOver(it, $event) : null"
          @dragleave="it.kind==='folder' ? onFolderDragLeave(it) : null"
          @drop.prevent="it.kind==='folder' ? onFolderDrop(it, $event) : null"
          style="cursor: default;"
      >
        <td>
            <span class="icon-text">
              <span class="icon">
                <i :class="it.kind==='folder' ? 'fas fa-folder' : 'fas fa-file'"></i>
              </span>
              <span>{{ it.name }}</span>
            </span>
        </td>
        <td>
          <span v-if="it.kind==='folder'">Папка</span>
          <span v-else>{{ prettyType(it) }}</span>
        </td>
        <td class="has-text-right">
          <span v-if="it.size != null">{{ prettySize(it.size) }}</span>
          <span v-else>—</span>
        </td>
        <td>{{ prettyDate(it.createdAt || it.updatedAt) }}</td>
      </tr>
      </tbody>
    </table>
  </div>

  <!-- Контекстное меню -->
  <div
      v-if="ctx.visible"
      class="fm-context"
      :style="{ top: `${ctx.y}px`, left: `${ctx.x}px` }"
      @click.stop
  >
    <button class="fm-context-item" @click="onMove(ctx.target!)">Переместить…</button>
    <button class="fm-context-item danger" @click="onDelete(ctx.target!)">Удалить</button>
  </div>

  <!-- Модал перемещения -->
  <MoveDialog
      v-if="moveOpen"
      :current-parent-id="parentId ?? null"
      @close="moveOpen=false"
      @confirm="doMove"
  />

  <!-- Модал: создать папку -->
  <CreateFolderDialog
    v-if="showCreateFolder"
    @close="showCreateFolder=false"
    @confirm="doCreateFolder"
  />

  <!-- Модал: подтверждение удаления -->
  <ConfirmDialog
    v-if="showDelete"
    title="Подтвердите удаление"
    :message="deleteTarget ? `Удалить ${deleteTarget.kind === 'folder' ? 'папку' : 'файл'} «${deleteTarget.name}»?` : ''"
    confirmText="Удалить"
    cancelText="Отмена"
    @close="showDelete=false"
    @confirm="doDelete"
  />

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
import MoveDialog from '@/components/MoveDialog.vue';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FilesApi } from '@/api/files';
import { useFiles } from '@/stores/files';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CreateFolderDialog from '@/components/CreateFolderDialog.vue';

const props = defineProps<{ items: FsEntry[] }>();
const activeFile = ref<FsEntry|null>(null);

const route = useRoute();
const router = useRouter();
const store = useFiles();
const parentId = (route.name === 'folder') ? String(route.params.id) : undefined;

const viewMode = ref<'grid'|'list'>('grid');

// Drag & Drop state and handlers
const dragging = ref<FsEntry | null>(null);
const dragOverId = ref<string | null>(null);

// Modals
const showCreateFolder = ref(false);
const showDelete = ref(false);
let deleteTarget: FsEntry | null = null;

function onCardDragStart(item: FsEntry, ev: DragEvent) {
  dragging.value = item;
  ev.dataTransfer && (ev.dataTransfer.effectAllowed = 'move');
  hideContextMenu();
}
function onCardDragEnd() {
  dragging.value = null;
  dragOverId.value = null;
}
function onRowDragStart(item: FsEntry, ev: DragEvent) {
  dragging.value = item;
  ev.dataTransfer && (ev.dataTransfer.effectAllowed = 'move');
  hideContextMenu();
}
function onRowDragEnd() {
  dragging.value = null;
  dragOverId.value = null;
}

function onFolderDragOver(folder: FsEntry, e: DragEvent) {
  if (folder.kind !== 'folder') return;
  if (dragging.value && dragging.value.id === folder.id) return; // prevent self
  dragOverId.value = folder.id;
  if (e.dataTransfer) e.dataTransfer.dropEffect = dragging.value ? 'move' : 'copy';
}
function onFolderDragLeave(folder: FsEntry) {
  if (dragOverId.value === folder.id) dragOverId.value = null;
}
async function onFolderDrop(folder: FsEntry, e: DragEvent) {
  if (folder.kind !== 'folder') return;

  // Move existing entry
  if (dragging.value) {
    if (dragging.value.id === folder.id) return;
    try {
      await FilesApi.move(dragging.value.id, folder.id);
      await refresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      dragging.value = null;
      dragOverId.value = null;
    }
    return;
  }

  // Upload dropped files from OS to this folder
  const droppedFiles = Array.from(e.dataTransfer?.files || []);
  if (droppedFiles.length) {
    try {
      for (const f of droppedFiles) {
        await FilesApi.upload(f, folder.id);
      }
      await refresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      dragOverId.value = null;
    }
  }
}

// Desktop drop to current folder
function onDesktopDragOver(e: DragEvent) {
  if ((e.dataTransfer?.types || []).includes('Files')) {
    e.dataTransfer!.dropEffect = 'copy';
  }
}
async function onDesktopDrop(e: DragEvent) {
  const droppedFiles = Array.from(e.dataTransfer?.files || []);
  if (!droppedFiles.length) return;
  try {
    for (const f of droppedFiles) {
      await FilesApi.upload(f, parentId ?? null);
    }
    await refresh();
  } catch (err: any) {
    alert(err?.response?.data?.message || err.message);
  }
}

// контекстное меню
const ctx = ref<{ visible: boolean; x: number; y: number; target: FsEntry | null }>({
  visible: false, x: 0, y: 0, target: null
});
function openContextMenu(e: MouseEvent, it: FsEntry) {
  e.preventDefault();
  ctx.value = { visible: true, x: e.clientX, y: e.clientY, target: it };
}

function hideContextMenu() { ctx.value.visible = false; }
function onWindowClick() { hideContextMenu(); }
onMounted(() => window.addEventListener('click', onWindowClick));
onBeforeUnmount(() => window.removeEventListener('click', onWindowClick));

function onOpen(it: FsEntry) {
  if (it.kind === 'file') activeFile.value = it;
}
function onDblClick(it: FsEntry) {
  if (it.kind === 'folder') {
    router.push({ name: 'folder', params: { id: it.id } });
  } else {
    onOpen(it);
  }
}
async function onSaved() { await refresh(); }
async function refresh() { await store.loadList({ parentId }); }

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

function onCreateFolder() {
  showCreateFolder.value = true;
}
async function doCreateFolder(name: string) {
  try {
    await FilesApi.createFolder(name, parentId ?? null);
    await refresh();
  } catch (err: any) {
    alert(err?.response?.data?.message || err.message);
  } finally {
    showCreateFolder.value = false;
  }
}

async function onDelete(it: FsEntry) {
  hideContextMenu();
  deleteTarget = it;
  showDelete.value = true;
}
async function doDelete() {
  if (!deleteTarget) return;
  try {
    await FilesApi.remove(deleteTarget.id);
    await refresh();
  } catch (err: any) {
    alert(err?.response?.data?.message || err.message);
  } finally {
    showDelete.value = false;
    deleteTarget = null;
  }
}

// перемещение через модал выбора папки
const moveOpen = ref(false);
let moveTarget: FsEntry | null = null;
function onMove(it: FsEntry) {
  hideContextMenu();
  moveTarget = it;
  moveOpen.value = true;
}
async function doMove(destParentId: string | null) {
  if (!moveTarget) return;
  try {
    await FilesApi.move(moveTarget.id, destParentId);
    await refresh();
  } catch (err: any) {
    alert(err?.response?.data?.message || err.message);
  } finally {
    moveOpen.value = false;
    moveTarget = null;
  }
}

// helpers
function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}
function prettyDate(v?: string) {
  if (!v) return '—';
  const d = new Date(v);
  return d.toLocaleString();
}
function prettyType(it: FsEntry) {
  if (it.kind === 'folder') return 'Папка';
  if (it.mimeType) return it.mimeType;
  const dot = it.name.lastIndexOf('.');
  return dot > -1 ? it.name.slice(dot + 1).toUpperCase() : 'Файл';
}
</script>

<style scoped>
.fm-grid-item { height: 100%; }
.fm-context {
  position: fixed;
  z-index: 50;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  overflow: hidden;
}
.fm-context-item {
  width: 100%;
  text-align: left;
  padding: .6rem .9rem;
  background: transparent;
  border: none;
  cursor: pointer;
}
.fm-context-item:hover { background: #f6f6f6; }
.fm-context-item.danger { color: #c0392b; }
.is-drop-target {
  outline: 2px dashed #409eff;
  outline-offset: 2px;
  background: rgba(64,158,255,0.06);
  border-radius: 10px;
}
</style>