<template>
  <article
    class="drive-card"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @contextmenu.stop="$emit('context', item, $event)"
  >
    <div class="thumb">
      <img v-if="thumb?.url" :src="thumb.url" :alt="item.name" />
      <div v-else class="thumb-fallback">
        <span v-if="item.kind==='folder'">📁</span>
        <span v-else-if="isVideo">🎬</span>
        <span v-else-if="isAudio">🎵</span>
        <span v-else-if="isPdf">📄</span>
        <span v-else>📄</span>
      </div>
    </div>

    <div class="caption" :title="item.name">
      <div class="name">{{ baseName }}</div>
      <div class="ext" v-if="ext">.{{ ext }}</div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import type { FsEntry } from '@/types';
import { makeThumbnail, type ThumbResult } from '@/utils/thumbnail';

const props = defineProps<{ item: FsEntry }>();
const emit = defineEmits<{
  (e:'open', item: FsEntry): void;
  (e:'delete', item: FsEntry): void;
  (e:'move', item: FsEntry): void;
  (e:'context', item: FsEntry, ev: MouseEvent): void;
  (e:'dragstart', item: FsEntry, ev: DragEvent): void;
  (e:'dragend', item: FsEntry, ev: DragEvent): void;
}>();

const item = props.item;

const isVideo = computed(() => item.kind === 'file' && (item.mimeType?.startsWith('video/') ?? false));
const isAudio = computed(() => item.kind === 'file' && (item.mimeType?.startsWith('audio/') ?? false));
const isPdf   = computed(() => item.kind === 'file' && item.mimeType === 'application/pdf');

const thumb = ref<ThumbResult>(null);

function splitName(name: string) {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, dot), ext: name.slice(dot + 1) };
}
const { base: baseNameInit, ext: extInit } = splitName(item.name);
const baseName = ref(baseNameInit);
const ext = ref(extInit.toLowerCase());

function onDragStart(ev: DragEvent) {
  ev.dataTransfer?.setData('text/plain', item.id);
  ev.dataTransfer!.effectAllowed = 'move';
  emit('dragstart', item, ev);
}

function onDragEnd(ev: DragEvent) {
  emit('dragend', item, ev);
}

onMounted(async () => {
  thumb.value = await makeThumbnail(item);
});
</script>

<style scoped>
.drive-card {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: .5rem;
  background: var(--surface);
  height: 100%;
  transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
  cursor: default;
}
.drive-card:hover {
  /* мягкая тень, одинаково смотрится в обеих темах */
  box-shadow: 0 6px 16px rgba(0,0,0,.12);
  border-color: var(--border);
}

.thumb {
  position: relative;
  width: 100%;
  padding-top: 66%;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  /* тонкая внутренняя рамка, чтобы белые превью не «резали глаз» */
  outline: 1px solid var(--border);
  outline-offset: 0;
}
.thumb img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 2rem;
  color: var(--text-muted);
}

.caption {
  display: flex;
  align-items: baseline;
  gap: .4rem;
  padding: 0 .25rem .25rem;
  min-height: 1.6rem;
}
.name {
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ext {
  font-size: .85rem;
  color: var(--text-muted);
}
</style>