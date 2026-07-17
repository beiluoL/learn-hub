<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="app-header">
    <strong class="brand">Vue 练手骨架</strong>
    <nav>
      <RouterLink to="/">首页</RouterLink>
      <RouterLink to="/about">关于</RouterLink>
    </nav>
  </header>
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}
.brand {
  font-size: 1.05rem;
}
.app-header nav {
  display: flex;
  gap: 1rem;
}
.app-header nav a {
  color: #334155;
  text-decoration: none;
}
.app-header nav a.router-link-active {
  color: #185fa5;
  font-weight: 500;
}
.app-main {
  padding: 1.25rem;
  max-width: 720px;
  margin: 0 auto;
}
</style>
