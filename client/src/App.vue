<template>
  <div class="layout">
    <nav
        class="navbar"
        :class="effectiveTheme==='dark' ? 'is-dark' : 'is-light'"
        role="navigation"
        aria-label="main navigation"
    >
      <div class="navbar-brand">
        <router-link class="navbar-item is-flex is-align-items-center" :to="{ name: 'home' }">
          <img :src="logoSrc" alt="Logo" class="logo" />
          <strong class="ml-2">FileManager</strong>
        </router-link>

        <a
            role="button"
            class="navbar-burger"
            :class="{ 'is-active': burger }"
            @click="burger = !burger"
            aria-label="menu"
            aria-expanded="false"
            data-target="navMenu"
        >
          <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navMenu" class="navbar-menu" :class="{ 'is-active': burger }">
        <div class="navbar-start">
          <router-link class="navbar-item" :to="{ name: 'home' }">Главная</router-link>
          <router-link
            v-if="user?.role === 'ADMIN'"
            class="navbar-item"
            :to="{ name: 'admin' }"
          >
            Админ
          </router-link>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="theme-toggle-icons" role="group" aria-label="Theme switch">
              <button
                  class="tt-btn"
                  :class="{ active: theme.mode==='auto' }"
                  @click="theme.setMode('auto')"
                  title="Авто (от системы)"
                  aria-label="Авто (от системы)"
              >🅰️</button>

              <button
                  class="tt-btn"
                  :class="{ active: theme.mode==='light' }"
                  @click="theme.setMode('light')"
                  title="Дневная тема"
                  aria-label="Дневная тема"
              >☀️</button>

              <button
                  class="tt-btn"
                  :class="{ active: theme.mode==='dark' }"
                  @click="theme.setMode('dark')"
                  title="Ночная тема"
                  aria-label="Ночная тема"
              >🌙</button>
            </div>
          </div>

          <div class="navbar-item" v-if="user">
            <div class="buttons">
              <span class="mr-3">👤 {{ user.email }}</span>
              <button class="button" :class="effectiveTheme==='dark' ? '' : 'is-light'" @click="logout">Выйти</button>
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

    <main class="page-body">
      <router-view />
      <UploadToasts />
    </main>

    <footer class="site-footer">
      <img :src="avatarSrc" alt="Avatar" class="avatar" />
      <span>
        <a href="https://github.com/AniCatPro" target="_blank" rel="noopener noreferrer">@anicatpro</a> — Павел Афанасьев 2025. Проект выполнен в рамках лабораторной работы по предмету "Web разработка".
      </span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '@/stores/auth';
import UploadToasts from '@/components/UploadToasts.vue';
import { useTheme } from '@/stores/theme';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-night.png';
import avatarSrc from '@/assets/avatar.jpeg';

const burger = ref(false);

const auth = useAuth();
const user = computed(() => auth.user);

const theme = useTheme();
onMounted(() => {
  theme.init();
  auth.fetchMe();
});

const effectiveTheme = computed(() => theme.effective); // 'light' | 'dark'
const logoSrc = computed(() => effectiveTheme.value === 'dark' ? logoDark : logoLight);

async function logout() { await auth.logout(); }
</script>

<style>
html, body, #app { height: 100%; }

:root {
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-2: #f6f8fa;
  --text: #1f2328;
  --text-muted: #6e7781;
  --border: #d0d7de;
  --link: #0969da;
  --accent: #409eff;
}

html.theme-dark {
  --bg: #0d1117;
  --surface: #161b22;
  --surface-2: #1c222b;
  --text: #c9d1d9;
  --text-muted: #8b949e;
  --border: #30363d;
  --link: #58a6ff;
  --accent: #58a6ff;
}

html { color-scheme: light dark; }

body {
  background: var(--bg);
  color: var(--text);
}

.navbar.is-dark { background: #161b22; }
.navbar.is-light { background: #f6f8fa; }

.navbar-menu {
  background: var(--surface) !important;
  border-bottom: 1px solid var(--border);
}
html.theme-dark .navbar-menu {
  background: var(--surface) !important;
  border-bottom: 1px solid var(--border);
}
.navbar-item,
.navbar-link {
  color: var(--text) !important;
}
.navbar-item:hover,
.navbar-link:hover {
  background: var(--surface-2) !important;
  color: var(--text) !important;
}

.navbar-burger {
  color: var(--text) !important;
}
.navbar-burger span {
  background-color: var(--text) !important;
}

.navbar-dropdown {
  background: var(--surface) !important;
  border-color: var(--border) !important;
}
.navbar-dropdown a.navbar-item:hover {
  background: var(--surface-2) !important;
}


.logo { width: 28px; height: 28px; }

.box, .card, .modal-card, .dropdown-content, .menu, .message, .hero {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}

.table {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}
.table thead th {
  background: var(--surface-2);
  color: var(--text);
  border-color: var(--border);
}
.table td, .table th { border-color: var(--border) !important; }
.table.is-striped tbody tr:not(.is-selected):nth-child(even) { background: var(--surface-2); }

.input, .textarea, .select select {
  background: var(--surface-2);
  color: var(--text);
  border-color: var(--border);
}
.input::placeholder, .textarea::placeholder { color: var(--text-muted); }
.select:not(.is-multiple):not(.is-loading)::after { border-color: var(--text); }

.button.is-link {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
html.theme-dark .button.is-light {
  background: #2d333b;
  border-color: var(--border);
  color: var(--text);
}
html.theme-dark .button.is-light:hover { background: #262c34; }

a { color: var(--link); }

.empty-drop {
  background: var(--surface-2);
  border-color: var(--border);
  color: var(--text-muted);
}
.empty-drop.is-over {
  background: rgba(88,166,255,0.08);
  border-color: var(--accent);
}
.folder-drop-overlay { background: rgba(0,0,0,0.35); }
.folder-drop-overlay .overlay-card {
  background: var(--surface);
  border-color: var(--accent);
  color: var(--text);
}

.fm-context {
  background: var(--surface) !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0,0,0,.14);
  z-index: 1000;
}

.fm-context .ctx-actions { display: flex; gap: .5rem; }

.fm-context .button:not(.is-link):not(.is-danger):not(.is-dark) {
  background: var(--surface-2) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

.fm-context .button.is-white {
  background: var(--surface-2) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

.fm-context .button:not(.is-link):not(.is-danger):not(.is-dark):hover {
  background: var(--surface) !important;
  filter: brightness(0.98);
}

.fm-context .button.is-link {
  background: var(--accent) !important;
  border-color: var(--accent) !important;
  color: #fff !important;
}
.fm-context .button.is-link:hover { filter: brightness(0.95); }

.fm-context .button.is-danger {
  background: #dc3545 !important;
  border-color: #dc3545 !important;
  color: #fff !important;
}

.fm-context .button.is-danger:hover { filter: brightness(0.95); }

html.theme-dark .fm-context .button {
  background: #2d333b !important;
  border-color: var(--border) !important;
  color: var(--text) !important;
}

html.theme-dark .fm-context .button:hover {
  background: #262c34 !important;
}

.fm-context-item { color: var(--text) !important; }
.fm-context-item:hover { background: var(--surface-2) !important; }

.fm-context .button:focus-visible,
.fm-context-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.drive-card {
  background: var(--surface);
  border: 1px solid var(--border);
}
.thumb { background: var(--surface-2); }

.table-container { background: transparent; }
.is-drop-target {
  outline: 2px dashed var(--accent);
  background: rgba(88,166,255,0.08);
}

.text-muted { color: var(--text-muted); }

html.theme-dark .title {
  color: var(--text);
}
html.theme-dark .subtitle {
  color: var(--text-muted);
}

.theme-toggle-icons {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  padding: 2px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.theme-toggle-icons .tt-btn {
  appearance: none;
  background: transparent;
  border: none;
  padding: .35rem .5rem;
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 999px;
  color: var(--text);
  opacity: .8;
  transition: background .15s ease, opacity .15s ease, transform .12s ease;
}

.theme-toggle-icons .tt-btn:hover {
  opacity: 1;
  background: rgba(0,0,0,.04);
}
html.theme-dark .theme-toggle-icons .tt-btn:hover {
  background: rgba(255,255,255,.06);
}

.theme-toggle-icons .tt-btn.active {
  opacity: 1;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0,0,0,.08) inset;
}

.navbar-end .navbar-item .theme-toggle-icons { margin-right: .25rem; }

.modal-card,
.modal-card-head,
.modal-card-body,
.modal-card-foot {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}

.modal-card-head,
.modal-card-foot {
  border-bottom: 1px solid var(--border);
}
.modal-card-foot { border-top: 1px solid var(--border); }

.modal-card-title { color: var(--text); }
.modal .delete {
  background: transparent;
  border: 1px solid var(--border);
}
.modal .delete:hover {
  background: var(--surface-2);
  border-color: var(--border);
}

html.theme-dark .modal-background {
  background-color: rgba(0, 0, 0, 0.6);
}

.modal-card .input,
.modal-card .textarea,
.modal-card .select select {
  background: var(--surface-2);
  color: var(--text);
  border-color: var(--border);
}
.modal-card .input::placeholder,
.modal-card .textarea::placeholder {
  color: var(--text-muted);
}

html.theme-dark input[type="radio"],
html.theme-dark input[type="checkbox"] {
  accent-color: var(--accent);
}

.modal-card .menu,
.modal-card .menu-list,
.modal-card .breadcrumb,
.modal-card .box {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}
.modal-card .menu-list a:hover {
  background: var(--surface-2);
}

html.theme-dark .modal-card .button.is-light {
  background: #2d333b;
  border-color: var(--border);
  color: var(--text);
}
html.theme-dark .modal-card .button.is-light:hover {
  background: #262c34;
}

html.theme-dark .folder-drop-overlay {
  background: rgba(0, 0, 0, 0.45);
}

.layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.page-body {
  flex: 1 0 auto;
}

.site-footer {
  flex: 0 0 auto;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.site-footer a {
  color: var(--link);
  text-decoration: none;
  margin-left: .35rem;
}

.site-footer a:hover {
  text-decoration: underline;
}

.site-footer .avatar {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  object-fit: cover;
  vertical-align: middle;
  margin-right: 8px;
  display: inline-block;
}
</style>