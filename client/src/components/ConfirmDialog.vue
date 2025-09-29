<template>
  <div class="modal is-active">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card" style="max-width: 520px;">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ title }}</p>
        <button class="delete" aria-label="close" @click="$emit('close')"></button>
      </header>
      <section class="modal-card-body">
        <p v-if="message">{{ message }}</p>
        <slot />
      </section>
      <footer class="modal-card-foot">
        <button class="button is-danger" @click="$emit('confirm')">{{ confirmText || 'Удалить' }}</button>
        <button class="button" @click="$emit('close')">{{ cancelText || 'Отмена' }}</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}>();
defineEmits<{ (e:'close'): void; (e:'confirm'): void }>();
</script>