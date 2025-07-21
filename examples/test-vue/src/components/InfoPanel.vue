<template>
  <div class="card border-top-0 rounded-top-0">
    <div class="card-body">
      <button @click="getDocumentInfo" class="btn btn-outline-primary mb-3">
        获取文档信息
      </button>
      
      <div v-if="documentInfo" id="document-info" class="mb-4">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">文档信息</h6>
            <p><strong>标题:</strong> {{ documentInfo.title || '无' }}</p>
            <p><strong>作者:</strong> {{ documentInfo.author || '无' }}</p>
            <p><strong>主题:</strong> {{ documentInfo.subject || '无' }}</p>
            <p><strong>创建者:</strong> {{ documentInfo.creator || '无' }}</p>
            <p><strong>生成者:</strong> {{ documentInfo.producer || '无' }}</p>
            <p><strong>页数:</strong> {{ documentInfo.pageCount }}</p>
            <p><strong>创建时间:</strong> {{ formatDate(documentInfo.creationDate) }}</p>
            <p><strong>修改时间:</strong> {{ formatDate(documentInfo.modificationDate) }}</p>
          </div>
        </div>
      </div>
      
      <hr>
      
      <button @click="getDocumentOutline" class="btn btn-outline-primary mb-3">
        获取文档大纲
      </button>
      
      <div v-if="documentOutline !== null" id="document-outline">
        <div v-if="documentOutline && documentOutline.length > 0">
          <h6>文档大纲</h6>
          <OutlineTree 
            :items="documentOutline" 
            @navigate="navigateToOutlineItem"
          />
        </div>
        <div v-else class="alert alert-info">
          该文档没有大纲结构
        </div>
      </div>
      
      <hr>
      
      <div class="d-grid gap-2">
        <button @click="getAllText" class="btn btn-outline-info">
          提取全部文本
        </button>
        <button @click="getCurrentPageText" class="btn btn-outline-info">
          提取当前页文本
        </button>
      </div>
      
      <div v-if="extractedText" class="mt-3">
        <div class="card">
          <div class="card-header d-flex justify-content-between">
            <span>提取的文本</span>
            <button @click="copyText" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-clipboard"></i> 复制
            </button>
          </div>
          <div class="card-body">
            <textarea 
              v-model="extractedText" 
              class="form-control" 
              rows="6" 
              readonly>
            </textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import OutlineTree from './OutlineTree.vue'

export default {
  name: 'InfoPanel',
  components: {
    OutlineTree
  },
  props: {
    pdfViewer: {
      type: Object,
      default: null
    }
  },
  emits: ['log'],
  setup(props, { emit }) {
    const documentInfo = ref(null)
    const documentOutline = ref(null)
    const extractedText = ref('')
    
    // 获取文档信息
    const getDocumentInfo = async () => {
      if (!props.pdfViewer) return
      
      try {
        const info = await props.pdfViewer.getDocumentInfo()
        documentInfo.value = info
        emit('log', '已获取文档信息', 'success')
      } catch (error) {
        emit('log', `获取文档信息失败: ${error.message}`, 'error')
      }
    }
    
    // 获取文档大纲
    const getDocumentOutline = async () => {
      if (!props.pdfViewer) return
      
      try {
        const outline = await props.pdfViewer.getDocumentOutline()
        documentOutline.value = outline
        emit('log', '已获取文档大纲', 'success')
      } catch (error) {
        emit('log', `获取文档大纲失败: ${error.message}`, 'error')
      }
    }
    
    // 导航到大纲项目
    const navigateToOutlineItem = async (item) => {
      if (!props.pdfViewer || !item.dest) return
      
      try {
        await props.pdfViewer.getInterface().navigateTo(item.dest)
        emit('log', `已导航至"${item.title}"`)
      } catch (error) {
        emit('log', `导航失败: ${error.message}`, 'error')
      }
    }
    
    // 提取全部文本
    const getAllText = async () => {
      if (!props.pdfViewer) return
      
      try {
        emit('log', '正在提取全部文本，请稍候...')
        const text = await props.pdfViewer.getAllText()
        extractedText.value = text
        emit('log', `已提取全部文本，共${text.length}个字符`, 'success')
      } catch (error) {
        emit('log', `提取全部文本失败: ${error.message}`, 'error')
      }
    }
    
    // 提取当前页文本
    const getCurrentPageText = async () => {
      if (!props.pdfViewer) return
      
      try {
        const currentPage = await props.pdfViewer.getCurrentPage()
        const text = await props.pdfViewer.getPageText(currentPage)
        extractedText.value = text
        emit('log', `已提取第${currentPage}页文本，共${text.length}个字符`, 'success')
      } catch (error) {
        emit('log', `提取当前页文本失败: ${error.message}`, 'error')
      }
    }
    
    // 复制文本到剪贴板
    const copyText = async () => {
      if (!extractedText.value) return
      
      try {
        await navigator.clipboard.writeText(extractedText.value)
        emit('log', '文本已复制到剪贴板', 'success')
      } catch (error) {
        emit('log', `复制失败: ${error.message}`, 'error')
      }
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '无'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN')
      } catch {
        return dateString
      }
    }
    
    return {
      documentInfo,
      documentOutline,
      extractedText,
      getDocumentInfo,
      getDocumentOutline,
      navigateToOutlineItem,
      getAllText,
      getCurrentPageText,
      copyText,
      formatDate
    }
  }
}
</script>
