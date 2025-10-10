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
          <li :class="{ 'is-active': tab==='logs' }"><a @click.prevent="tab='logs'; load()">Журнал действий</a></li>
          <li :class="{ 'is-active': tab==='revisions' }"><a @click.prevent="tab='revisions'; load()">Правки текстов</a></li>
        </ul>
      </div>

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
            <p class="control"><button class="button" @click="loadLogs(1)">Фильтр</button></p>
          </div>
          <div class="has-text-grey">Всего: {{ logsTotal }}</div>
        </div>

        <div v-if="error" class="notification is-danger is-light">{{ error }}</div>

        <table class="table is-fullwidth is-striped">
          <thead>
          <tr>
            <th>Время</th>
            <th>Автор</th>
            <th>Событие</th>
            <th>Файл/Папка</th>
            <th>Детали</th>
            <th class="has-text-right">Открыть</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="r in logs" :key="r.id">
            <td>{{ prettyDate(r.createdAt) }}</td>
            <td>{{ r.actor?.email || '—' }}</td>
            <td><code>{{ r.type }}</code></td>
            <td>
              <template v-if="r.target">
                {{ r.target.kind === 'folder' ? 'Папка' : 'Файл' }} — {{ r.target.name }}
              </template>
              <template v-else>
                {{ r.targetType }} <span v-if="r.targetName">— {{ r.targetName }}</span>
              </template>
            </td>
            <td class="details"><span class="tag is-light">{{ shortDetails(r.details) }}</span></td>
            <td class="has-text-right">
              <button
                  v-if="r.target?.kind==='file'"
                  class="button is-small"
                  @click="openTarget(r)"
                  :disabled="openingId===r.target.id"
              >
                <span v-if="openingId===r.target.id" class="loader mr-1"></span>
                Открыть
              </button>
              <span v-else class="has-text-grey">—</span>
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

    <FileViewerWidget
        v-if="activeFile"
        :file="activeFile"
        @closed="activeFile=null"
        @saved="onSaved"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { http } from '@/api/http';
import FileViewerWidget from '@/components/widgets/FileViewerWidget.vue';

type Actor = { id: string; email: string } | null;
type Target = { id: string; name: string; kind: 'file'|'folder' } | null;

type AuditRow = {
  id: string;
  type: string;
  actor: Actor;
  target: Target;
  targetType: string;
  targetName?: string | null;
  details?: any;
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

const logs = ref<AuditRow[]>([]);
const revisions = ref<Revision[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const activeFile = ref<any | null>(null);
const openingId = ref<string | null>(null);

const API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').toString();
const apiOrigin = /^https?:\/\//.test(API_BASE)
    ? new URL(API_BASE).origin
    : `${window.location.protocol}//${window.location.hostname}:4000`;
const apiDocsUrl = computed(() => `${apiOrigin}/api/docs/#/`);

const page = ref(1);
const pageSize = ref(50);
const logsTotal = ref(0);
const typeFilter = ref<string>(''); // '' = all

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

async function openTarget(r: AuditRow) {
  const id = r.target?.id;
  if (!id) return;
  openingId.value = id;
  try {
    const file = await http.get(`/files/${id}`).then(res => res.data);
    activeFile.value = file;
  } catch (e: any) {
    alert(e?.response?.data?.message || e?.message || String(e));
  } finally {
    openingId.value = null;
  }
}

// function onSaved() {}

function prettyDate(v?: string) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}
function snippet(s: string, n = 140) {
  if (!s) return '';
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1) + '…' : one;
}
function shortDetails(d: any) {
  if (!d || typeof d !== 'object') return '';
  const parts: string[] = [];
  if (d.mimeType) parts.push(d.mimeType);
  if (d.size != null) parts.push(`${(d.size/1024).toFixed(1)} KB`);
  if (d.parentId !== undefined) parts.push(`parent: ${d.parentId ?? '—'}`);
  if (d.fromParentId !== undefined || d.toParentId !== undefined) {
    parts.push(`from: ${d.fromParentId ?? '—'} → to: ${d.toParentId ?? '—'}`);
  }
  if (!parts.length) return JSON.stringify(d);
  return parts.join(' · ');
}

onMounted(load);
</script>

<style scoped>
.is-clipped {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.details { white-space: nowrap; }
.loader {
  width: 1em; height: 1em; border: 2px solid rgba(0,0,0,.25); border-top-color: currentColor;
  border-radius: 50%; display: inline-block; animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>