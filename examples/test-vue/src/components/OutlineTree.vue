<template>
  <ul class="list-group list-group-flush">
    <li 
      v-for="item in items" 
      :key="item.title"
      class="list-group-item outline-item"
      :style="{ paddingLeft: `${1 + level * 1.5}rem` }"
      @click="handleItemClick(item)">
      <div class="d-flex justify-content-between align-items-center">
        <span :class="{ 'fw-bold': level === 0 }">{{ item.title }}</span>
        <span v-if="item.items && item.items.length > 0" class="badge bg-secondary">
          {{ item.items.length }}
        </span>
      </div>
      
      <!-- 递归渲染子项目 -->
      <OutlineTree 
        v-if="item.items && item.items.length > 0 && expandedItems.includes(item.title)"
        :items="item.items"
        :level="level + 1"
        @navigate="$emit('navigate', $event)"
      />
    </li>
  </ul>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'OutlineTree',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    level: {
      type: Number,
      default: 0
    }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const expandedItems = ref([])
    
    const handleItemClick = (item) => {
      // 如果有子项目，切换展开状态
      if (item.items && item.items.length > 0) {
        const index = expandedItems.value.indexOf(item.title)
        if (index > -1) {
          expandedItems.value.splice(index, 1)
        } else {
          expandedItems.value.push(item.title)
        }
      }
      
      // 如果有目标，发出导航事件
      if (item.dest) {
        emit('navigate', item)
      }
    }
    
    return {
      expandedItems,
      handleItemClick
    }
  }
}
</script>

<style scoped>
.outline-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.outline-item:hover {
  background-color: #f8f9fa;
}
</style>
