<template>
  <section class="section">
    <h1 class="title">Админ-панель</h1>
    <p class="subtitle">Последние изменения текстовых файлов</p>

    <progress v-if="loading" class="progress is-small is-primary" max="100">Загрузка…</progress>
    <p v-if="error" class="notification is-danger">{{ error }}</p>

    <table v-if="!loading && revisions.length" class="table is-fullwidth is-striped">
      <thead>
      <tr>
        <th>Дата</th>
        <th>Файл</th>
        <th>Автор</th>
        <th>Фрагмент</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="r in revisions" :key="r.id">
        <td>{{ new Date(r.createdAt).toLocaleString() }}</td>
        <td>
          <router-link :to="r.file.kind==='folder' ? {name:'folder', params:{id:r.file.id}} : {name:'home'}">
            {{ r.file.name }}
          </router-link>
        </td>
        <td>{{ r.author.email }}</td>
        <td><pre style="white-space: pre-wrap; max-width: 560px">{{ r.preview }}</pre></td>
      </tr>
      </tbody>
    </table>

    <p v-if="!loading && !revisions.length" class="has-text-grey">Пока нет изменений.</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { http } from '@/api/http';

interface RevisionDto {
  id: string;
  createdAt: string;
  content?: string; // может отсутствовать, если вы решите не отдавать полный текст
  file: { id: string; name: string; kind: 'file' | 'folder' };
  author: { id: string; email: string };
}

const revisions = ref<Array<RevisionDto & { preview: string }>>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const router = useRouter();

async function load() {
  try {
    loading.value = true;
    error.value = null;
    const { data } = await http.get<RevisionDto[]>('/admin/revisions');
    revisions.value = data.map(r => ({
      ...r,
      preview: (r as any).content ? (r as any).content.slice(0, 180) + ((r as any).content.length > 180 ? '…' : '') : '[без содержимого]'
    }));
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 401) {
      router.push({ name: 'login', query: { redirect: '/#/admin' } });
      return;
    }
    error.value = e?.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
