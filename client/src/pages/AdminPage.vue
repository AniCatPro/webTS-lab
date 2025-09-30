<template>
  <section class="section">
    <div class="container">
      <div class="level mb-4">
        <div class="level-left">
          <h1 class="title">Админ-панель</h1>
        </div>
        <div class="level-right">
          <div class="buttons">
            <!-- Кнопка на Swagger UI -->
            <a
                :href="apiDocsUrl"
                target="_blank"
                rel="noopener"
                class="button is-link is-light"
                title="Открыть документацию REST API"
            >
              REST API
            </a>
            <button class="button" :class="{ 'is-loading': loading }" @click="load">
              Обновить
            </button>
          </div>
        </div>
      </div>

      <div class="box">
        <h2 class="subtitle">Последние текстовые правки</h2>

        <div v-if="error" class="notification is-danger is-light">
          {{ error }}
        </div>

        <table class="table is-fullwidth is-striped" v-if="items.length">
          <thead>
          <tr>
            <th>Когда</th>
            <th>Файл</th>
            <th>Автор</th>
            <th>Фрагмент</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="r in items" :key="r.id">
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
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { http } from '@/api/http';

type Revision = {
  id: string;
  content: string;
  createdAt: string;
  file?: { id: string; name: string } | null;
  author?: { id: string; email: string } | null;
};

const items = ref<Revision[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Строим ссылку на Swagger UI: .../api/docs/#/
// Если VITE_API_BASE абсолютный — берём origin из него,
// иначе жёстко указываем :4000 на текущем хосте/протоколе.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').toString();
const apiOrigin = /^https?:\/\//.test(API_BASE)
    ? new URL(API_BASE).origin
    : `${window.location.protocol}//${window.location.hostname}:4000`;

const apiDocsUrl = computed(() => `${apiOrigin}/api/docs/#/`);

async function load() {
  try {
    loading.value = true;
    error.value = null;
    // эндпоинт из бэкенда: GET /api/admin/revisions (Bearer)
    const res = await http.get('/admin/revisions');
    items.value = res.data || [];
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || String(e);
  } finally {
    loading.value = false;
  }
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

onMounted(load);
</script>

<style scoped>
.is-clipped {
  max-width: 420px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>