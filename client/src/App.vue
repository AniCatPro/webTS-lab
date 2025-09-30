<template>
  <div>
    <nav class="navbar is-light" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <router-link class="navbar-item is-flex is-align-items-center" :to="{ name: 'home' }">
          <img src="@/assets/logo.png" alt="Logo" class="logo" />
          <strong class="ml-2">FileManager</strong>
        </router-link>
        <a role="button" class="navbar-burger" :class="{ 'is-active': burger }" @click="burger = !burger"
           aria-label="menu" aria-expanded="false" data-target="navMenu">
          <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navMenu" class="navbar-menu" :class="{ 'is-active': burger }">
        <div class="navbar-start">
          <router-link class="navbar-item" :to="{ name: 'home' }">Главная</router-link>
          <router-link class="navbar-item" :to="{ name: 'admin' }">Админ</router-link>
        </div>

        <div class="navbar-end">
          <div class="navbar-item" v-if="user">
            <div class="buttons">
              <span class="mr-3">👤 {{ user.email }}</span>
              <button class="button is-light" @click="logout">Выйти</button>
            </div>
          </div>
          <div class="navbar-item" v-else>
            <div class="buttons">
              <router-link class="button is-link" :to="{ name: 'login' }">Войти</router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <router-view />
    <UploadToasts />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/stores/auth';
import UploadToasts from '@/components/UploadToasts.vue';

const burger = ref(false);
const auth = useAuth();
const user = computed(() => auth.user);

onMounted(() => auth.fetchMe());
async function logout() { await auth.logout(); }
</script>

<style>
html, body, #app { height: 100%; }
</style>
