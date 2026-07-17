<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <section>
    <h1>首页</h1>
    <p>计数器：{{ counter.count }}，双倍：{{ counter.double }}</p>
    <div class="actions">
      <button @click="counter.increment">+1</button>
      <button @click="counter.reset">重置</button>
    </div>
  </section>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
button {
  padding: 0.4rem 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
button:hover {
  border-color: #185fa5;
  color: #185fa5;
}
</style>
