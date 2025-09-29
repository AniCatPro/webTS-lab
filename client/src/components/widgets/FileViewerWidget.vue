<template>
  <div class="modal is-active">
    <div class="modal-background" @click="$emit('closed')"></div>
    <div class="modal-card" style="width: 960px; max-width: 95vw;">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ file.name }}</p>
        <button class="delete" @click="$emit('closed')" aria-label="close"></button>
      </header>

      <section class="modal-card-body">
        <Spinner v-if="loading" />
        <p v-if="error" class="notification is-danger">{{ error }}</p>

        <div v-if="!loading && !error">
          <template v-if="isText">
            <textarea class="textarea" rows="18" v-model="text" />
            <p class="help">Изменения сохранятся на сервере.</p>
          </template>

          <template v-else-if="isPdf">
            <iframe v-if="objectUrl" :src="objectUrl" style="width:100%; height:70vh;" />
          </template>

          <template v-else-if="isImage">
            <img v-if="objectUrl" :src="objectUrl" :alt="file.name" style="max-width:100%" />
          </template>

          <template v-else-if="isVideo">
            <video v-if="objectUrl" :src="objectUrl" controls style="width:100%"></video>
          </template>

          <template v-else-if="isAudio">
            <audio v-if="objectUrl" :src="objectUrl" controls style="width:100%"></audio>
          </template>

          <template v-else>
            <p>Предпросмотр недоступен для данного типа файла.</p>
          </template>
        </div>
      </section>

      <footer class="modal-card-foot" v-if="isText">
        <button class="button is-primary" :class="{ 'is-loading': saving }" @click="save">Сохранить</button>
        <button class="button" @click="$emit('closed')">Закрыть</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { FsEntry } from '@/types';
import { FilesApi } from '@/api/files';
import Spinner from '@/components/Spinner.vue';

const props = defineProps<{ file: FsEntry }>();
const emit = defineEmits<{ (e: 'saved'): void; (e: 'closed'): void }>();

const text = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

// blob URL для медиа
const objectUrl = ref<string | null>(null);
function revoke() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
}

const isText = computed(() =>
    props.file.mimeType?.startsWith('text/') ||
    props.file.mimeType === 'application/json' ||
    props.file.mimeType === 'text/markdown'
);
const isPdf = computed(() => props.file.mimeType === 'application/pdf');
const isImage = computed(() => props.file.mimeType?.startsWith('image/'));
const isVideo = computed(() => props.file.mimeType?.startsWith('video/'));
const isAudio = computed(() => props.file.mimeType?.startsWith('audio/'));

async function loadBlobIfNeeded() {
  if (isText.value) return;
  try {
    loading.value = true; error.value = null; revoke();
    const blob = await FilesApi.getContentBlob(props.file.id);
    objectUrl.value = URL.createObjectURL(blob);
  } catch (e: any) {
    error.value = e?.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (isText.value) {
    try {
      loading.value = true; error.value = null;
      text.value = (await FilesApi.getText(props.file.id)).content;
    } catch (e: any) {
      error.value = e?.response?.data?.message || e.message;
    } finally {
      loading.value = false;
    }
  } else {
    await loadBlobIfNeeded();
  }
});

watch(() => props.file.id, async () => {
  revoke();
  if (isText.value) {
    try {
      loading.value = true; error.value = null;
      text.value = (await FilesApi.getText(props.file.id)).content;
    } catch (e: any) {
      error.value = e?.response?.data?.message || e.message;
    } finally {
      loading.value = false;
    }
  } else {
    await loadBlobIfNeeded();
  }
});

onBeforeUnmount(revoke);

async function save() {
  try {
    saving.value = true;
    await FilesApi.saveText(props.file.id, text.value);
    emit('saved');
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-card-body { overflow: auto; }
</style>