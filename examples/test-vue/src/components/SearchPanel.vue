<template>
  <div class="card border-top-0 rounded-top-0">
    <div class="card-body">
      <div class="mb-3">
        <label class="form-label">文本搜索</label>
        <div class="input-group mb-3">
          <input 
            type="text" 
            v-model="searchText" 
            @keyup.enter="searchNext"
            class="form-control" 
            placeholder="输入搜索文本">
          <button @click="searchPrev" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-arrow-up"></i>
          </button>
          <button @click="searchNext" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-arrow-down"></i>
          </button>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" v-model="caseSensitive" id="case-sensitive">
          <label class="form-check-label" for="case-sensitive">区分大小写</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" v-model="wholeWord" id="whole-word">
          <label class="form-check-label" for="whole-word">完全匹配单词</label>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">标注高亮</label>
        <div class="input-group mb-3">
          <input 
            type="text" 
            v-model="highlightText" 
            @keyup.enter="addHighlight"
            class="form-control" 
            placeholder="输入要高亮标注的文本">
          <button @click="addHighlight" class="btn btn-outline-warning" type="button">
            <i class="bi bi-highlighter"></i> 添加标注
          </button>
        </div>
        <button @click="clearSearchHighlight" class="btn btn-outline-secondary btn-sm mb-3">
          清除搜索高亮
        </button>
        <div>
          <label class="form-label">高亮颜色:</label>
          <div class="color-swatches">
            <span 
              v-for="color in highlightColors" 
              :key="color.value"
              class="color-swatch"
              :class="{ active: selectedColor === color.value }"
              :style="{ backgroundColor: color.value }"
              @click="selectedColor = color.value"
              :title="color.name">
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SearchPanel',
  props: {
    pdfViewer: {
      type: Object,
      default: null
    }
  },
  emits: ['log'],
  setup(props, { emit }) {
    const searchText = ref('')
    const caseSensitive = ref(false)
    const wholeWord = ref(false)
    const highlightText = ref('')
    const selectedColor = ref('#ffff00')
    
    const highlightColors = [
      { name: '黄色', value: '#ffff00' },
      { name: '绿色', value: '#a5f7b3' },
      { name: '蓝色', value: '#7bf1fa' },
      { name: '粉色', value: '#f8c6f8' },
      { name: '橙色', value: '#fec488' }
    ]
    
    // 搜索功能
    const searchNext = async () => {
      if (!props.pdfViewer || !searchText.value) {
        emit('log', '请输入搜索文本', 'error')
        return
      }
      
      try {
        const options = {
          caseSensitive: caseSensitive.value,
          wholeWord: wholeWord.value,
          direction: 'forward'
        }
        
        const result = await props.pdfViewer.findText(searchText.value, options)
        
        if (result.found) {
          emit('log', `已找到文本"${searchText.value}"，位于第${result.page}页`)
        } else {
          emit('log', `未找到文本"${searchText.value}"`)
        }
      } catch (error) {
        emit('log', `搜索失败: ${error.message}`, 'error')
      }
    }
    
    const searchPrev = async () => {
      if (!props.pdfViewer || !searchText.value) {
        emit('log', '请输入搜索文本', 'error')
        return
      }
      
      try {
        const options = {
          caseSensitive: caseSensitive.value,
          wholeWord: wholeWord.value,
          direction: 'backward'
        }
        
        const result = await props.pdfViewer.findText(searchText.value, options)
        
        if (result.found) {
          emit('log', `已找到文本"${searchText.value}"，位于第${result.page}页`)
        } else {
          emit('log', `未找到文本"${searchText.value}"`)
        }
      } catch (error) {
        emit('log', `搜索失败: ${error.message}`, 'error')
      }
    }
    
    // 高亮功能
    const addHighlight = async () => {
      if (!props.pdfViewer || !highlightText.value) {
        emit('log', '请输入要高亮的文本', 'error')
        return
      }
      
      try {
        const result = await props.pdfViewer.highlightText(highlightText.value, { 
          color: selectedColor.value 
        })
        
        if (result.success) {
          emit('log', `已高亮文本"${highlightText.value}"`, 'success')
          highlightText.value = '' // 清空输入框
        } else {
          emit('log', '高亮文本失败')
        }
      } catch (error) {
        emit('log', `高亮操作失败: ${error.message}`, 'error')
      }
    }
    
    const clearSearchHighlight = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.clearTextHighlight()
        emit('log', '已清除搜索高亮')
      } catch (error) {
        emit('log', `清除搜索高亮失败: ${error.message}`, 'error')
      }
    }
    
    return {
      searchText,
      caseSensitive,
      wholeWord,
      highlightText,
      selectedColor,
      highlightColors,
      searchNext,
      searchPrev,
      addHighlight,
      clearSearchHighlight
    }
  }
}
</script>
