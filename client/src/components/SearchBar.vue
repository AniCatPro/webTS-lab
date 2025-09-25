<template>
  <div class="field is-grouped">
    <p class="control is-expanded">
      <input class="input" type="text" placeholder="Поиск по имени..." v-model="q" @keyup.enter="emitSearch" />
    </p>
    <p class="control">
      <div class="select">
        <select v-model="type" @change="emitSearch">
          <option value="">Все типы</option>
          <option value="image">Изображения</option>
          <option value="video">Видео</option>
          <option value="audio">Музыка</option>
          <option value="document">Документы</option>
          <option value="other">Прочее</option>
        </select>
      </div>
    </p>
    <p class="control">
      <button class="button is-link" @click="emitSearch">Найти</button>
    </p>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const emit = defineEmits<{ (e: 'search', payload: { q?: string; type?: string }): void }>();
const q = ref('');
const type = ref('');
function emitSearch() { emit('search', { q: q.value || undefined, type: type.value || undefined }); }
</script>