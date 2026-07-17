import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 组合式风格（setup store）：推荐写法
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }
  function reset() {
    count.value = 0
  }

  return { count, double, increment, reset }
})
