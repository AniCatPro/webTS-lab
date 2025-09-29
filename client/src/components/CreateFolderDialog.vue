<template>
  <div class="modal is-active">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card" style="max-width: 520px;">
      <header class="modal-card-head">
        <p class="modal-card-title">Новая папка</p>
        <button class="delete" aria-label="close" @click="$emit('close')"></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">Название</label>
          <div class="control">
            <input class="input" type="text" v-model="name" placeholder="Например: Документы" @keyup.enter="submit" />
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-primary" :disabled="!name.trim()" @click="submit">Создать</button>
        <button class="button" @click="$emit('close')">Отмена</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const emit = defineEmits<{ (e:'close'): void; (e:'confirm', name: string): void }>();
const name = ref('');
function submit() {
  const v = name.value.trim();
  if (!v) return;
  emit('confirm', v);
}
</script>