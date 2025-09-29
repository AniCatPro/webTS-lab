<template>
  <div class="toasts">
    <div v-for="t in transfers.items" :key="t.id" class="toast">
      <div class="row">
        <div class="name" :title="t.name">{{ t.name }}</div>
        <div class="status" :class="{ done: t.done, error: t.error }">
          <span v-if="t.error">Ошибка</span>
          <span v-else-if="t.done">Готово</span>
          <span v-else>Загрузка…</span>
        </div>
      </div>

      <div class="row small">
        <div>
          <template v-if="!t.done && !t.error">
            {{ percent(t) }} • {{ speed(t) }} • {{ eta(t) }}
          </template>
          <template v-else-if="t.error">
            {{ t.error }}
          </template>
          <template v-else>
            {{ percent(t) }}
          </template>
        </div>
      </div>

      <div class="bar">
        <div class="progress" :style="{ width: barWidth(t) }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useTransfers, type Transfer } from '@/stores/transfers';

const transfers = useTransfers();

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}
function percent(t: Transfer) {
  if (!t.total) return `${formatBytes(t.loaded)}`;
  const p = Math.floor((t.loaded / t.total) * 100);
  return `${p}% (${formatBytes(t.loaded)} / ${formatBytes(t.total)})`;
}
function speed(t: Transfer) {
  if (!t.speedBps) return '—';
  return `${formatBytes(t.speedBps)}/s`;
}
function eta(t: Transfer) {
  if (t.etaSec == null) return '—';
  const s = Math.max(0, Math.round(t.etaSec));
  return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
}
function barWidth(t: Transfer) {
  if (!t.total) return t.done ? '100%' : '0%';
  const p = Math.min(100, Math.floor((t.loaded / t.total) * 100));
  return `${p}%`;
}

let timer: number | null = null;
onMounted(() => { timer = window.setInterval(() => transfers.sweep(), 1000); });
onBeforeUnmount(() => { if (timer) window.clearInterval(timer); });
</script>

<style scoped>
.toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}
.toast {
  width: 360px;
  background: #fff;
  border: 1px solid #e9e9e9;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0,0,0,.12);
  padding: 10px 12px;
}
.row { display: flex; align-items: center; justify-content: space-between; }
.row.small { font-size: .9rem; color: #666; margin-top: 2px; }
.name {
  font-weight: 600; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.status { font-size: .9rem; color: #909090; }
.status.done { color: #3a9b46; }
.status.error { color: #c0392b; }
.bar {
  height: 8px; background: #f2f2f2; border-radius: 999px; overflow: hidden; margin-top: 8px;
}
.progress { height: 100%; background: linear-gradient(90deg, #3f8cff, #6cb1ff); width: 0%; transition: width .15s ease; }
</style>