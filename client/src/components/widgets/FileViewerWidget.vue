<template>
  <div class="modal is-active">
    <div class="modal-background" @click="$emit('closed')"></div>
    <div class="modal-card" style="width: 960px; max-width: 95vw;">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ file.name }}</p>
        <button class="delete" @click="$emit('closed')" aria-label="close"></button>
      </header>
      <section class="modal-card-body">
        <Spinner v-if="loading" />
        <p v-if="error" class="notification is-danger">{{ error }}</p>


        <div v-if="!loading && !error">
          <template v-if="isText">
            <textarea class="textarea" rows="18" v-model="text" placeholder="Начните редактировать..."></textarea>
            <p class="help">Изменения сохранятся на сервере.</p>
          </template>
          <template v-else-if="isPdf">
            <iframe :src="file.url" style="width:100%; height:70vh;" />
          </template>
          <template v-else-if="isImage">
            <img :src="file.url" :alt="file.name" style="max-width:100%" />
          </template>
          <template v-else-if="isVideo">
            <video :src="file.url" controls style="width:100%"></video>
          </template>
          <template v-else-if="isAudio">
            <audio :src="file.url" controls style="width:100%"></audio>
          </template>
          <template v-else>
            <p>Предпросмотр недоступен для данного типа файла.</p>
          </template>
        </div>
      </section>
      <footer class="modal-card-foot" v-if="isText">
        <button class="button is-primary" :class="{ 'is-loading': saving }" @click="save">Сохранить</button>
        </style>