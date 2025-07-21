<template>
  <div id="app">
    <!-- 头部 -->
    <div class="header bg-dark text-white py-4 mb-4">
      <div class="container">
        <div class="row align-items-center">
          <div class="col">
            <h1>PDF.js Vue测试应用</h1>
            <p class="lead mb-0">使用Vue.js测试增强版PDF查看器的完整功能</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="container">
      <div class="row">
        <!-- PDF 查看器部分 -->
        <div class="col-lg-8">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">PDF 查看器</h5>
            </div>
            <div class="card-body p-0">
              <div ref="pdfContainer" class="viewer-container">
                <!-- PDF查看器将在这里初始化 -->
                <div v-if="!isViewerLoaded" class="progress-container">
                  <p>{{ loadingMessage }}</p>
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 工具栏 -->
          <div class="card mb-4">
            <div class="card-header">
              <h6 class="mb-0">查看器控件</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <!-- PDF选择器 -->
                <div class="col-lg-6">
                  <div class="mb-3">
                    <label for="pdf-select" class="form-label">选择PDF文件</label>
                    <select id="pdf-select" v-model="selectedPdf" class="form-select">
                      <option value="/test/pdfs/tracemonkey.pdf">示例PDF - TracemonKey</option>
                      <option value="/test/pdfs/annotation-line.pdf">注释演示PDF</option>
                      <option value="../../build/dist/web/compressed.tracemonkey-pldi-09.pdf">内置PDF</option>
                      <option value="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf">在线PDF</option>
                      <option value="custom">自定义URL...</option>
                      <option value="upload">上传本地PDF文件...</option>
                    </select>
                  </div>
                  <div class="mb-3" v-if="selectedPdf === 'custom'">
                    <input type="text" v-model="customPdfUrl" class="form-control" placeholder="输入PDF URL">
                  </div>
                  <div class="mb-3" v-if="selectedPdf === 'upload'">
                    <input type="file" @change="handleFileUpload" class="form-control" accept=".pdf">
                  </div>
                  <div class="mb-3">
                    <button @click="loadPdf" class="btn btn-primary" :disabled="isLoading">
                      <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                      {{ isLoading ? '加载中...' : '加载 PDF' }}
                    </button>
                  </div>
                </div>
                
                <!-- 配置选项 -->
                <div class="col-lg-6">
                  <div class="mb-3">
                    <label class="form-label d-block">查看器配置</label>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" v-model="options.enableDownload" id="enable-download">
                      <label class="form-check-label" for="enable-download">允许下载</label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" v-model="options.enablePrint" id="enable-print">
                      <label class="form-check-label" for="enable-print">允许打印</label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" v-model="options.debugger" id="enable-debugger">
                      <label class="form-check-label" for="enable-debugger">调试模式</label>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label for="initial-page" class="form-label">初始页码</label>
                    <input type="number" v-model="options.initialPage" class="form-control" min="1" value="1">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 日志输出 -->
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">操作日志</h6>
              <button @click="clearLog" class="btn btn-sm btn-outline-secondary">清空</button>
            </div>
            <div class="card-body">
              <div class="log" ref="logContainer">
                <div v-for="entry in logEntries" :key="entry.id" class="log-entry" :style="{ color: entry.color }">
                  <span class="log-time">{{ entry.time }}</span>
                  <span class="log-message">{{ entry.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 控制面板部分 -->
        <div class="col-lg-4">
          <ul class="nav nav-tabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'navigation' }"
                @click="activeTab = 'navigation'"
                type="button">导航</button>
            </li>
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'search' }"
                @click="activeTab = 'search'"
                type="button">搜索与高亮</button>
            </li>
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'highlights' }"
                @click="activeTab = 'highlights'"
                type="button">高亮列表</button>
            </li>
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link"
                :class="{ active: activeTab === 'info' }"
                @click="activeTab = 'info'"
                type="button">文档信息</button>
            </li>
          </ul>
          
          <div class="tab-content">
            <!-- 导航标签页 -->
            <div v-if="activeTab === 'navigation'" class="tab-pane fade show active">
              <NavigationPanel 
                :pdf-viewer="pdfViewer"
                @log="addLog"
                @page-updated="updatePageDisplay"
              />
            </div>
            
            <!-- 搜索标签页 -->
            <div v-if="activeTab === 'search'" class="tab-pane fade show active">
              <SearchPanel 
                :pdf-viewer="pdfViewer"
                @log="addLog"
              />
            </div>
            
            <!-- 高亮列表标签页 -->
            <div v-if="activeTab === 'highlights'" class="tab-pane fade show active">
              <HighlightsPanel 
                :pdf-viewer="pdfViewer"
                @log="addLog"
              />
            </div>
            
            <!-- 信息标签页 -->
            <div v-if="activeTab === 'info'" class="tab-pane fade show active">
              <InfoPanel 
                :pdf-viewer="pdfViewer"
                @log="addLog"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
</div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import NavigationPanel from './components/NavigationPanel.vue'
import SearchPanel from './components/SearchPanel.vue'
import HighlightsPanel from './components/HighlightsPanel.vue'
import InfoPanel from './components/InfoPanel.vue'

export default {
  name: 'App',
  components: {
    NavigationPanel,
    SearchPanel,
    HighlightsPanel,
    InfoPanel
  },
  setup() {
    // 响应式数据
    const pdfContainer = ref(null)
    const logContainer = ref(null)
    const pdfViewer = ref(null)
    const isViewerLoaded = ref(false)
    const isLoading = ref(false)
    const loadingMessage = ref('请选择一个PDF文件进行加载')
    const selectedPdf = ref('/test/pdfs/tracemonkey.pdf')
    const customPdfUrl = ref('')
    const uploadedFile = ref(null)
    const activeTab = ref('navigation')
    
    const options = reactive({
      enableDownload: true,
      enablePrint: true,
      debugger: false,
      initialPage: 1,
      viewerPath: '/build/generic/web/viewer.html' // 使用generic build目录下的viewer.html
    })
    
    const logEntries = ref([])
    let logIdCounter = 0
    
    // 日志相关方法
    const addLog = (message, type = 'info') => {
      const colors = {
        info: '#333',
        success: '#198754',
        error: '#dc3545',
        warning: '#ffc107'
      }
      
      const entry = {
        id: ++logIdCounter,
        time: new Date().toLocaleTimeString(),
        message,
        color: colors[type] || colors.info
      }
      
      logEntries.value.push(entry)
      
      // 自动滚动到底部
      nextTick(() => {
        if (logContainer.value) {
          logContainer.value.scrollTop = logContainer.value.scrollHeight
        }
      })
    }
    
    const clearLog = () => {
      logEntries.value = []
    }
    
    // PDF相关方法
    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file && file.type === 'application/pdf') {
        uploadedFile.value = file
        addLog(`已选择文件: ${file.name}`)
      } else {
        addLog('请选择有效的PDF文件', 'error')
      }
    }
    
    const loadPdf = async () => {
      try {
        isLoading.value = true
        loadingMessage.value = '正在初始化PDF查看器...'
        
        let pdfUrl = ''
        
        // 确定PDF URL
        if (selectedPdf.value === 'custom') {
          if (!customPdfUrl.value) {
            addLog('请输入有效的PDF URL', 'error')
            return
          }
          pdfUrl = customPdfUrl.value
        } else if (selectedPdf.value === 'upload') {
          if (!uploadedFile.value) {
            addLog('请选择一个PDF文件上传', 'error')
            return
          }
          pdfUrl = URL.createObjectURL(uploadedFile.value)
          addLog(`正在加载上传的文件: ${uploadedFile.value.name}`)
        } else {
          pdfUrl = selectedPdf.value
        }
        
        addLog(`正在加载PDF: ${pdfUrl}`)
        
        // 动态导入PDF.js模块 - 使用npm包
        const { EnhancedPDFViewer, MessageType } = await import('pdfjs-editor/interface')
        
        // 创建配置选项
        const viewerOptions = {
          ...options,
          timeout: 15000 // 15秒超时
        }
        
        addLog('正在创建PDF查看器实例...')
        
        // 创建查看器实例
        pdfViewer.value = EnhancedPDFViewer.getInstance(pdfContainer.value, viewerOptions)
        
        // 注册事件监听器
        pdfViewer.value.on(MessageType.PDFJS_INTERFACE_READY, () => {
          addLog('PDF查看器已准备就绪', 'success')
          isViewerLoaded.value = true
          isLoading.value = false
        })
        
        pdfViewer.value.on(MessageType.PAGE_CHANGED, (page) => {
          addLog(`页面已更改: ${page}`)
        })
        
        pdfViewer.value.on(MessageType.DOCUMENT_LOADED, (info) => {
          addLog(`文档已加载: ${info.title || '无标题'}`, 'success')
        })
        
        pdfViewer.value.on(MessageType.HIGHLIGHT_CREATED, (highlight) => {
          addLog(`创建了高亮: ${highlight.text}`, 'success')
        })
        
        pdfViewer.value.on(MessageType.HIGHLIGHT_REMOVED, (highlight) => {
          addLog(`移除了高亮: ID ${highlight.id}`)
        })
        
        // 加载PDF
        loadingMessage.value = '正在加载PDF文档...'
        await pdfViewer.value.loadPDF(pdfUrl)
        
        addLog('PDF加载完成', 'success')
        
      } catch (error) {
        addLog(`加载PDF失败: ${error.message}`, 'error')
        console.error('PDF加载错误:', error)
        isLoading.value = false
        isViewerLoaded.value = false
      }
    }
    
    const updatePageDisplay = () => {
      // 页面显示更新逻辑，由子组件触发
    }
    
    // 生命周期
    onMounted(() => {
      addLog('Vue应用已启动', 'success')
      addLog('准备加载PDF.js模块...')
      
      // 自动加载默认PDF
      setTimeout(() => {
        loadPdf()
      }, 1000)
    })
    
    onUnmounted(() => {
      // 清理资源
      if (pdfViewer.value) {
        pdfViewer.value.destroy()
      }
      
      // 清理上传的文件URL
      if (uploadedFile.value) {
        URL.revokeObjectURL(uploadedFile.value)
      }
    })
    
    return {
      // 引用
      pdfContainer,
      logContainer,
      
      // 响应式数据
      pdfViewer,
      isViewerLoaded,
      isLoading,
      loadingMessage,
      selectedPdf,
      customPdfUrl,
      activeTab,
      options,
      logEntries,
      
      // 方法
      addLog,
      clearLog,
      handleFileUpload,
      loadPdf,
      updatePageDisplay
    }
  }
}
</script>
