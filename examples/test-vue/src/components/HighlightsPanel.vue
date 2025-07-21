<template>
  <div class="card border-top-0 rounded-top-0">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="mb-0">标注高亮列表</h6>
        <button @click="clearAllHighlights" class="btn btn-sm btn-outline-danger">
          清除全部标注
        </button>
      </div>
      
      <div v-if="highlights.length === 0" class="text-muted text-center py-3">
        暂无高亮内容
      </div>
      
      <div v-else>
        <div 
          v-for="highlight in highlights" 
          :key="highlight.id" 
          class="highlight-box"
          :style="{ borderLeftColor: highlight.color || '#ffff00' }">
          <div class="highlight-text">{{ highlight.text }}</div>
          <div class="highlight-info">页码: {{ highlight.page }}</div>
          <div class="highlight-actions">
            <button 
              @click="goToHighlight(highlight)" 
              class="btn btn-sm btn-outline-secondary me-2">
              跳转
            </button>
            <button 
              @click="deleteHighlight(highlight)" 
              class="btn btn-sm btn-outline-danger">
              删除
            </button>
          </div>
        </div>
      </div>
      
      <div class="mt-3">
        <button @click="refreshHighlights" class="btn btn-sm btn-outline-primary">
          <i class="bi bi-arrow-clockwise"></i> 刷新列表
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'HighlightsPanel',
  props: {
    pdfViewer: {
      type: Object,
      default: null
    }
  },
  emits: ['log'],
  setup(props, { emit }) {
    const highlights = ref([])
    
    // 更新高亮列表
    const refreshHighlights = async () => {
      if (!props.pdfViewer) return
      
      try {
        const result = await props.pdfViewer.getHighlights()
        highlights.value = result || []
        emit('log', `已刷新高亮列表，共${highlights.value.length}个高亮`)
      } catch (error) {
        emit('log', `获取高亮列表失败: ${error.message}`, 'error')
      }
    }
    
    // 跳转到高亮位置
    const goToHighlight = async (highlight) => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.goToPage(highlight.page)
        emit('log', `已跳转到第 ${highlight.page} 页`)
      } catch (error) {
        emit('log', `跳转失败: ${error.message}`, 'error')
      }
    }
    
    // 删除高亮
    const deleteHighlight = async (highlight) => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.clearHighlightById(highlight.id)
        emit('log', `已删除高亮: ${highlight.id}`)
        // 刷新列表
        refreshHighlights()
      } catch (error) {
        emit('log', `删除高亮失败: ${error.message}`, 'error')
      }
    }
    
    // 清除所有高亮
    const clearAllHighlights = async () => {
      if (!props.pdfViewer) return
      
      try {
        const result = await props.pdfViewer.clearAllHighlights()
        emit('log', `已清除所有高亮: ${result.clearedCount}个`, 'success')
        highlights.value = []
      } catch (error) {
        emit('log', `清除所有高亮失败: ${error.message}`, 'error')
      }
    }
    
    // 监听pdfViewer变化
    watch(() => props.pdfViewer, (newViewer) => {
      if (newViewer) {
        // PDF查看器就绪后自动刷新高亮列表
        setTimeout(refreshHighlights, 1000)
      }
    })
    
    return {
      highlights,
      refreshHighlights,
      goToHighlight,
      deleteHighlight,
      clearAllHighlights
    }
  }
}
</script>
