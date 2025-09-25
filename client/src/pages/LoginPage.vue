<template>
  <section class="section" style="max-width: 480px; margin: 0 auto;">
    <h1 class="title has-text-centered">Вход</h1>

    <form @submit.prevent="onSubmit">
      <div class="field">
        <label class="label">Email</label>
        <div class="control">
          <input class="input" type="email" v-model="email" required autocomplete="username" />
        </div>
      </div>

      <div class="field">
        <label class="label">Пароль</label>
        <div class="control">
          <input class="input" type="password" v-model="password" required autocomplete="current-password" />
        </div>
      </div>

      <p v-if="error" class="notification is-danger">{{ error }}</p>

      <div class="field is-grouped is-justify-content-space-between">
        <div class="control">
          <button class="button is-link" :class="{ 'is-loading': loading }" type="submit">Войти</button>
        </div>
        <div class="control">
          <router-link class="button is-light" :to="{ name: 'home' }">На главную</router-link>
        </div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/stores/auth';

const email = ref('');
const password = ref('');
const auth = useAuth();
const loading = computed(() => auth.loading);
const error = computed(() => auth.error);
const router = useRouter();
const route = useRoute();

async function onSubmit() {
  try {
    await auth.login(email.value.trim(), password.value);
    const redirect = (route.query.redirect as string) || '/#/admin';
    router.push(redirect);
  } catch {
    // ошибка уже установлена в store
  }
}
</script>
