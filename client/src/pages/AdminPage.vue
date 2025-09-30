<template>
  <section class="section">
    <div class="container">
      <div class="level mb-4">
        <div class="level-left">
          <h1 class="title">Админ-панель</h1>
        </div>
        <div class="level-right">
          <div class="buttons">
            <a :href="apiDocsUrl" target="_blank" rel="noopener" class="button is-link is-light">REST API</a>
            <button class="button" :class="{ 'is-loading': loading }" @click="load">Обновить</button>
          </div>
        </div>
      </div>

      <div class="tabs is-boxed">
        <ul>
          <li :class="{ 'is-active': tab==='logs' }"><a @click.prevent="tab='logs'">Журнал действий</a></li>
          <li :class="{ 'is-active': tab==='revisions' }"><a @click.prevent="tab='revisions'">Правки текстов</a></li>
        </ul>
      </div>

      <!-- ЛОГИ -->
      <div v-if="tab==='logs'" class="box">
        <div class="is-flex is-align-items-center is-justify-content-space-between mb-3">
          <div class="field has-addons">
            <p class="control">
              <span class="select">
                <select v-model="typeFilter">
                  <option value="">Все типы</option>
                  <option value="file.create">file.create</option>
                  <option value="file.upload">file.upload</option>
                  <option value="file.move">file.move</option>
                  <option value="file.delete">file.delete</option>
                  <option value="file.text.update">file.text.update</option>
                  <option value="auth.login">auth.login</option>
                  <option value="auth.logout">auth.logout</option>
                  <option value="user.create">user.create</option>
                </select>
              </span>
            </p>
            <p class="control">
              <button class="button" @click="loadLogs(1)">Фильтр</button>
            </p>
          </div>
          <div class="has-text-grey">Всего: {{ logsTotal }}</div>
        </div>

        <table class="table is-fullwidth is-striped">
          <thead>
          <tr>
            <th>Время</th>
            <th>Автор</th>
            <th>Событие</th>
            <th>Имя файла</th>
            <th>Детали</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="r in logs" :key="r.id">
            <td>{{ prettyDate(r.createdAt) }}</td>
            <td>{{ r.actor?.email || '—' }}</td>
            <td><code>{{ r.type }}</code></td>
            <td>
              <template v-if="r.target">
                {{ r.target.name }}
              </template>
              <template v-else>
                {{ r.targetName || '—' }}
              </template>
            </td>
            <td class="nowrap">
              <span v-if="r.details">
                <span v-if="r.details.size != null">{{ prettySize(r.details.size) }}</span>
                <span v-if="r.details.mimeType" class="tag is-light ml-2">{{ r.details.mimeType }}</span>
              </span>
              <button
                v-if="r.target && r.target.kind==='file'"
                class="button is-small is-link is-light ml-3"
                @click="openFromLog(r.target)"
                title="Открыть файл"
              >Открыть</button>
            </td>
          </tr>
          </tbody>
        </table>

        <nav class="pagination" role="navigation" aria-label="pagination" v-if="logsTotal > pageSize">
          <a class="pagination-previous" :disabled="page<=1" @click="loadLogs(page-1)">Назад</a>
          <a class="pagination-next" :disabled="page*pageSize>=logsTotal" @click="loadLogs(page+1)">Вперёд</a>
          <ul class="pagination-list"></ul>
        </nav>
      </div>

      <!-- ПРАВКИ ТЕКСТОВ -->
      <div v-else class="box">
        <h2 class="subtitle">Последние текстовые правки</h2>
        <div v-if="error" class="notification is-danger is-light">{{ error }}</div>
        <table class="table is-fullwidth is-striped" v-if="revisions.length">
          <thead>
          <tr>
            <th>Когда</th>
            <th>Файл</th>
            <th>Автор</th>
            <th>Фрагмент</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="r in revisions" :key="r.id">
            <td>{{ prettyDate(r.createdAt) }}</td>
            <td>{{ r.file?.name }}</td>
            <td>{{ r.author?.email || '—' }}</td>
            <td class="is-clipped">{{ snippet(r.content) }}</td>
          </tr>
          </tbody>
        </table>
        <p v-else-if="!loading" class="has-text-grey">Записей нет.</p>
      </div>
    </div>
    <FileViewerWidget v-if="viewerFile" :file="viewerFile" @closed="closeViewer" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { http } from '@/api/http';
import FileViewerWidget from "@/components/widgets/FileViewerWidget.vue";

type Actor = { id: string; email: string } | null;
type Target = { id: string; name: string; kind: 'file'|'folder' } | null;

type AuditRow = {
  id: string; // ID записи лога
  type: string;
  actor: Actor;
  target: Target;
  targetType?: string | null;
  targetName?: string | null;
  details?: { size?: number; mimeType?: string; [k: string]: any } | null;
  createdAt: string;
};

type Revision = {
  id: string;
  content: string;
  createdAt: string;
  file?: { id: string; name: string } | null;
  author?: { id: string; email: string } | null;
};

const tab = ref<'logs'|'revisions'>('logs');

const revisions = ref<Revision[]>([]);
const logs = ref<AuditRow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const viewerFile = ref<Target | null>(null);

// базовый адрес API (для ссылок на контент файлов)
const API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').toString();
const apiOrigin = /^https?:\/\//.test(API_BASE)
    ? new URL(API_BASE).origin
    : `${window.location.protocol}//${window.location.hostname}:4000`;
const apiDocsUrl = computed(() => `${apiOrigin}/api/docs/#/`);
const fileContentUrl = (id: string) => `${apiOrigin}/api/files/${id}/content`;

// логи: пагинация и фильтр
const page = ref(1);
const pageSize = ref(50);
const logsTotal = ref(0);
const typeFilter = ref<string>(''); // '' = все

async function loadLogs(p = 1) {
  try {
    loading.value = true;
    error.value = null;
    page.value = p;
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value };
    if (typeFilter.value) params.types = typeFilter.value;
    const res = await http.get('/admin/logs', { params });
    logs.value = res.data?.data || [];
    logsTotal.value = res.data?.total || 0;
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

async function loadRevisions() {
  try {
    loading.value = true;
    error.value = null;
    const res = await http.get('/admin/revisions');
    revisions.value = res.data || [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

async function load() {
  if (tab.value === 'logs') await loadLogs(page.value);
  else await loadRevisions();
}

function prettyDate(v?: string) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}
function snippet(s: string, n = 140) {
  if (!s) return '';
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1) + '…' : one;
}
function prettySize(bytes?: number) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function openFromLog(file: Target) {
  viewerFile.value = file;
}
function closeViewer() {
  viewerFile.value = null;
}

onMounted(() => { load(); });
</script>

<style scoped>
.is-clipped {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nowrap { white-space: nowrap; }
</style>