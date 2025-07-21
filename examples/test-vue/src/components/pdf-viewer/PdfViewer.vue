<template>
  <a-config-provider :theme="themeConfig">
    <div class="pdf-viewer-container" :class="containerClasses">
      <!-- 全屏模式的标题栏 -->
      <div v-if="isFullscreen" class="pdf-viewer-header">
        <a-space>
          <file-text-outlined />
          <a-typography-text strong>{{ documentTitle || 'PDF文档' }}</a-typography-text>
        </a-space>
        <a-space>
          <a-button
            type="text"
            :icon="h(FullscreenExitOutlined)"
            @click="exitFullscreen"
          />
        </a-space>
      </div>

      <!-- 主要布局 -->
      <a-layout class="pdf-viewer-layout">
        <!-- PDF查看器主体 -->
        <a-layout-content class="pdf-viewer-content">
          <a-card 
            :bordered="!isModal && !isFullscreen"
            :bodyStyle="{ padding: 0, height: '100%' }"
            class="pdf-viewer-card"
          >
            <!-- 加载状态 -->
            <a-spin 
              :spinning="loading" 
              :tip="loadingMessage"
              size="large"
              class="pdf-viewer-spinner"
            >
              <div ref="pdfContainer" class="pdf-container" :style="containerStyle">
                <!-- PDF内容将在这里渲染 -->
                <a-empty 
                  v-if="!pdfViewer && !loading"
                  description="请加载PDF文档"
                  class="pdf-empty-state"
                >
                  <template #image>
                    <file-text-outlined style="font-size: 64px; color: #d9d9d9;" />
                  </template>
                </a-empty>
              </div>
            </a-spin>
          </a-card>
        </a-layout-content>

        <!-- 侧边栏 -->
        <a-layout-sider
          v-if="showSidebar"
          :width="sidebarWidth"
          :collapsible="false"
          theme="light"
          class="pdf-viewer-sidebar"
        >
          <a-card 
            :bordered="false" 
            :bodyStyle="{ padding: 0, height: '100%' }"
            class="sidebar-card"
          >
            <!-- 侧边栏标题 -->
            <template #title>
              <a-space>
                <component :is="sidebarIcon" />
                {{ sidebarTitle }}
              </a-space>
            </template>
            
            <!-- 侧边栏内容 -->
            <div class="sidebar-content">
              <!-- 使用插槽渲染自定义内容 -->
              <slot 
                name="sidebar" 
                :pdf-viewer="pdfViewer"
                :document-info="documentInfo"
                :highlights="highlights"
                :current-page="currentPage"
                :total-pages="totalPages"
                :zoom-level="zoomLevel"
                :loading="loading"
                :emit-event="emitEvent"
              >
                <!-- 默认的标签页内容 -->
                <a-tabs 
                  v-model:activeKey="activeSidebarTab" 
                  :tabPosition="sidebarTabPosition"
                  class="sidebar-tabs"
                >
                  <!-- 导航面板 -->
                  <a-tab-pane 
                    v-if="panels.navigation" 
                    key="navigation" 
                    tab="导航"
                  >
                    <template #tab>
                      <span><menu-outlined />导航</span>
                    </template>
                    <pdf-navigation-panel
                      :pdf-viewer="pdfViewer"
                      :current-page="currentPage"
                      :total-pages="totalPages"
                      @page-change="handlePageChange"
                    />
                  </a-tab-pane>

                  <!-- 搜索面板 -->
                  <a-tab-pane 
                    v-if="panels.search" 
                    key="search" 
                    tab="搜索"
                  >
                    <template #tab>
                      <span><search-outlined />搜索</span>
                    </template>
                    <pdf-search-panel
                      :pdf-viewer="pdfViewer"
                      @search-result="handleSearchResult"
                    />
                  </a-tab-pane>

                  <!-- 高亮面板 -->
                  <a-tab-pane 
                    v-if="panels.highlights" 
                    key="highlights" 
                    tab="高亮"
                  >
                    <template #tab>
                      <span>
                        <highlight-outlined />
                        高亮
                        <a-badge v-if="highlights.length > 0" :count="highlights.length" />
                      </span>
                    </template>
                    <pdf-highlights-panel
                      :highlights="highlights"
                      :pdf-viewer="pdfViewer"
                      @highlight-click="handleHighlightClick"
                      @highlight-delete="handleHighlightDelete"
                    />
                  </a-tab-pane>

                  <!-- 信息面板 -->
                  <a-tab-pane 
                    v-if="panels.info" 
                    key="info" 
                    tab="信息"
                  >
                    <template #tab>
                      <span><info-circle-outlined />信息</span>
                    </template>
                    <pdf-info-panel
                      :document-info="documentInfo"
                      :current-page="currentPage"
                      :total-pages="totalPages"
                      :zoom-level="zoomLevel"
                    />
                  </a-tab-pane>
                </a-tabs>
              </slot>
            </div>
          </a-card>
        </a-layout-sider>
      </a-layout>

      <!-- 工具栏 -->
      <div v-if="showToolbar" class="pdf-viewer-toolbar">
        <slot 
          name="toolbar" 
          :pdf-viewer="pdfViewer"
          :loading="loading"
          :actions="toolbarActions"
        >
          <!-- 默认工具栏 -->
          <a-space wrap>
            <a-button-group v-if="options.enableNavigation">
              <a-button 
                :disabled="currentPage <= 1"
                @click="previousPage"
                :icon="h(LeftOutlined)"
              />
              <a-button 
                :disabled="currentPage >= totalPages"
                @click="nextPage"
                :icon="h(RightOutlined)"
              />
            </a-button-group>

            <a-input-number
              v-if="options.enableNavigation"
              v-model:value="currentPage"
              :min="1"
              :max="totalPages"
              :disabled="!pdfViewer"
              @change="goToPage"
              size="small"
              style="width: 80px"
            />
            <span v-if="totalPages > 0">/ {{ totalPages }}</span>

            <a-divider type="vertical" />

            <a-button-group v-if="options.enableZoom">
              <a-button 
                @click="zoomOut"
                :icon="h(ZoomOutOutlined)"
                :disabled="!pdfViewer"
              />
              <a-button 
                @click="zoomIn"
                :icon="h(ZoomInOutlined)"
                :disabled="!pdfViewer"
              />
            </a-button-group>

            <a-select
              v-if="options.enableZoom"
              v-model:value="zoomLevel"
              @change="setZoom"
              :disabled="!pdfViewer"
              size="small"
              style="width: 100px"
            >
              <a-select-option value="auto">自适应</a-select-option>
              <a-select-option value="page-width">适合宽度</a-select-option>
              <a-select-option :value="0.5">50%</a-select-option>
              <a-select-option :value="0.75">75%</a-select-option>
              <a-select-option :value="1">100%</a-select-option>
              <a-select-option :value="1.25">125%</a-select-option>
              <a-select-option :value="1.5">150%</a-select-option>
              <a-select-option :value="2">200%</a-select-option>
            </a-select>

            <a-divider type="vertical" />

            <a-button 
              v-if="options.enableDownload"
              :icon="h(DownloadOutlined)"
              @click="downloadPdf"
              :disabled="!pdfViewer"
              type="default"
            >
              下载
            </a-button>

            <a-button 
              v-if="options.enablePrint"
              :icon="h(PrinterOutlined)"
              @click="printPdf"
              :disabled="!pdfViewer"
              type="default"
            >
              打印
            </a-button>

            <a-button 
              v-if="options.enableFullscreen && !isModal"
              :icon="h(isFullscreen ? FullscreenExitOutlined : FullscreenOutlined)"
              @click="toggleFullscreen"
              type="default"
            >
              {{ isFullscreen ? '退出全屏' : '全屏' }}
            </a-button>
          </a-space>
        </slot>
      </div>
    </div>
  </a-config-provider>
</template>

<script setup>
import { h, ref, reactive, computed, watch, onMounted, onUnmounted, provide, nextTick, readonly } from 'vue'
import { message, notification } from 'ant-design-vue'
import { 
  FileTextOutlined,
  HighlightOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  MenuOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons-vue'

import { DEFAULT_VIEWER_OPTIONS, PDF_EVENTS, THEME_CONFIG } from './config.js'
import PdfNavigationPanel from './panels/PdfNavigationPanel.vue'
import PdfSearchPanel from './panels/PdfSearchPanel.vue'
import PdfHighlightsPanel from './panels/PdfHighlightsPanel.vue'
import PdfInfoPanel from './panels/PdfInfoPanel.vue'

// Props 定义
const props = defineProps({
  // PDF文档URL
  url: {
    type: String,
    default: ''
  },
  
  // 查看器配置选项
  options: {
    type: Object,
    default: () => ({})
  },
  
  // 是否显示侧边栏
  showSidebar: {
    type: Boolean,
    default: true
  },
  
  // 侧边栏宽度
  sidebarWidth: {
    type: Number,
    default: 320
  },
  
  // 侧边栏标签位置
  sidebarTabPosition: {
    type: String,
    default: 'top'
  },
  
  // 启用的面板
  panels: {
    type: Object,
    default: () => ({
      navigation: true,
      search: true,
      highlights: true,
      info: true
    })
  },
  
  // 是否显示工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  
  // 容器高度
  height: {
    type: [String, Number],
    default: '600px'
  },
  
  // 是否在模态框中显示
  isModal: {
    type: Boolean,
    default: false
  },
  
  // 主题
  theme: {
    type: String,
    default: 'light'
  },
  
  // 是否响应式
  responsive: {
    type: Boolean,
    default: true
  }
})

// Emits 定义
const emit = defineEmits([
  'ready',
  'document-loaded',
  'document-error',
  'page-changed',
  'zoom-changed',
  'highlight-created',
  'highlight-removed',
  'highlight-updated',
  'highlights-changed',
  'search-started',
  'search-found',
  'search-not-found',
  'text-selected',
  'loading-state-changed',
  'error-occurred',
  'fullscreen-changed'
])

// 响应式数据
const pdfContainer = ref(null)
const pdfViewer = ref(null)
const loading = ref(false)
const loadingMessage = ref('准备加载PDF...')
const documentTitle = ref('')
const documentInfo = ref({})
const currentPage = ref(1)
const totalPages = ref(0)
const zoomLevel = ref(1)
const activeSidebarTab = ref('navigation')
const isFullscreen = ref(false)
const highlights = ref([])

// 计算属性
const mergedOptions = computed(() => ({
  ...DEFAULT_VIEWER_OPTIONS,
  ...props.options
}))

const themeConfig = computed(() => THEME_CONFIG[props.theme] || THEME_CONFIG.light)

const containerStyle = computed(() => {
  const height = typeof props.height === 'number' ? `${props.height}px` : props.height
  return {
    height: isFullscreen.value ? '100%' : height,
    minHeight: '400px'
  }
})

const containerClasses = computed(() => ({
  'pdf-viewer-fullscreen': isFullscreen.value,
  'pdf-viewer-modal': props.isModal,
  'pdf-viewer-responsive': props.responsive
}))

const sidebarTitle = computed(() => {
  const titleMap = {
    navigation: '文档导航',
    search: '搜索功能', 
    highlights: `高亮列表 ${highlights.value.length > 0 ? `(${highlights.value.length})` : ''}`,
    info: '文档信息'
  }
  return titleMap[activeSidebarTab.value] || '面板'
})

const sidebarIcon = computed(() => {
  const iconMap = {
    navigation: MenuOutlined,
    search: SearchOutlined,
    highlights: HighlightOutlined,
    info: InfoCircleOutlined
  }
  return iconMap[activeSidebarTab.value] || FileTextOutlined
})

// 工具栏操作
const toolbarActions = reactive({
  loadPdf: loadPdf,
  downloadPdf: downloadPdf,
  printPdf: printPdf,
  zoomIn: zoomIn,
  zoomOut: zoomOut,
  setZoom: setZoom,
  goToPage: goToPage,
  previousPage: previousPage,
  nextPage: nextPage,
  toggleFullscreen: toggleFullscreen
})

// 事件发射器
const emitEvent = (eventType, data) => {
  emit(eventType, data)
  
  // 内部事件处理
  switch (eventType) {
    case PDF_EVENTS.HIGHLIGHT_CREATED:
      highlights.value.push(data)
      emit('highlights-changed', highlights.value)
      break
    case PDF_EVENTS.HIGHLIGHT_REMOVED:
      highlights.value = highlights.value.filter(h => h.id !== data.id)
      emit('highlights-changed', highlights.value)
      break
    case PDF_EVENTS.PAGE_CHANGED:
      currentPage.value = data
      break
    case PDF_EVENTS.DOCUMENT_LOADED:
      documentInfo.value = data
      documentTitle.value = data.title || '未知文档'
      totalPages.value = data.numPages || 0
      break
  }
}

// PDF查看器方法
async function loadPdf(url = props.url) {
  if (!url) {
    message.warning('请提供PDF文件URL')
    return
  }
  
  try {
    loading.value = true
    loadingMessage.value = '正在初始化PDF查看器...'
    emit('loading-state-changed', { loading: true, message: loadingMessage.value })
    
    // 动态导入PDF.js模块
    const { EnhancedPDFViewer, MessageType } = await import('pdfjs-editor/interface')
    
    loadingMessage.value = '正在创建查看器实例...'
    
    // 创建查看器实例
    pdfViewer.value = EnhancedPDFViewer.getInstance(pdfContainer.value, mergedOptions.value)
    
    // 注册事件监听器
    registerPdfEvents()
    
    loadingMessage.value = '正在加载PDF文档...'
    await pdfViewer.value.loadPDF(url)
    
    loading.value = false
    emit('ready', pdfViewer.value)
    
  } catch (error) {
    loading.value = false
    const errorMessage = `加载PDF失败: ${error.message}`
    message.error(errorMessage)
    emitEvent('error-occurred', { error, message: errorMessage })
  }
}

function registerPdfEvents() {
  const eventMap = {
    [PDF_EVENTS.PDFJS_INTERFACE_READY]: () => {
      message.success('PDF查看器已准备就绪')
    },
    [PDF_EVENTS.DOCUMENT_LOADED]: (info) => {
      emitEvent('document-loaded', info)
      message.success(`文档加载完成: ${info.title || '未知文档'}`)
    },
    [PDF_EVENTS.PAGE_CHANGED]: (page) => {
      emitEvent('page-changed', page)
    },
    [PDF_EVENTS.HIGHLIGHT_CREATED]: (highlight) => {
      emitEvent('highlight-created', highlight)
      notification.success({
        message: '创建高亮',
        description: `已创建高亮: ${highlight.text.substring(0, 50)}...`,
        duration: 2
      })
    },
    [PDF_EVENTS.HIGHLIGHT_REMOVED]: (highlight) => {
      emitEvent('highlight-removed', highlight)
      message.info('已删除高亮')
    }
  }
  
  Object.entries(eventMap).forEach(([eventType, handler]) => {
    if (pdfViewer.value) {
      pdfViewer.value.on(eventType, handler)
    }
  })
}

// 导航方法
function goToPage(page) {
  if (pdfViewer.value && page >= 1 && page <= totalPages.value) {
    pdfViewer.value.goToPage(page)
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1)
  }
}

// 缩放方法
function zoomIn() {
  if (pdfViewer.value) {
    pdfViewer.value.zoomIn()
  }
}

function zoomOut() {
  if (pdfViewer.value) {
    pdfViewer.value.zoomOut()
  }
}

function setZoom(level) {
  if (pdfViewer.value) {
    pdfViewer.value.setZoom(level)
    zoomLevel.value = level
  }
}

// 功能方法
function downloadPdf() {
  if (pdfViewer.value) {
    pdfViewer.value.download()
  }
}

function printPdf() {
  if (pdfViewer.value) {
    pdfViewer.value.print()
  }
}

// 全屏功能
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  emit('fullscreen-changed', isFullscreen.value)
}

function exitFullscreen() {
  isFullscreen.value = false
  emit('fullscreen-changed', false)
}

// 事件处理器
function handlePageChange(page) {
  goToPage(page)
}

function handleSearchResult(result) {
  emitEvent('search-found', result)
}

function handleHighlightClick(highlight) {
  if (pdfViewer.value && highlight.page) {
    goToPage(highlight.page)
  }
}

function handleHighlightDelete(highlight) {
  if (pdfViewer.value) {
    pdfViewer.value.removeHighlight(highlight.id)
  }
}

// 监听器
watch(() => props.url, (newUrl) => {
  if (newUrl && pdfViewer.value) {
    loadPdf(newUrl)
  }
})

// 提供给子组件的上下文
provide('pdfViewerContext', {
  pdfViewer,
  options: mergedOptions,
  emitEvent,
  currentPage,
  totalPages,
  zoomLevel,
  loading
})

// 生命周期
onMounted(() => {
  // 如果没有提供URL，则使用默认的PDF文件
  const defaultUrl = '/build/generic/web/viewer.html?file=/examples/learning/helloworld.pdf'
  const pdfUrl = props.url || defaultUrl
  
  if (pdfUrl) {
    nextTick(() => {
      loadPdf(pdfUrl)
    })
  }
})

onUnmounted(() => {
  if (pdfViewer.value) {
    pdfViewer.value.destroy()
  }
})

// 暴露方法给父组件
defineExpose({
  loadPdf,
  pdfViewer: readonly(pdfViewer),
  goToPage,
  previousPage,
  nextPage,
  zoomIn,
  zoomOut,
  setZoom,
  downloadPdf,
  printPdf,
  toggleFullscreen,
  getCurrentPage: () => currentPage.value,
  getTotalPages: () => totalPages.value,
  getZoomLevel: () => zoomLevel.value,
  getHighlights: () => highlights.value,
  getDocumentInfo: () => documentInfo.value
})
</script>

<style scoped>
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.pdf-viewer-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: white;
}

.pdf-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

.pdf-viewer-layout {
  flex: 1;
  overflow: hidden;
}

.pdf-viewer-content {
  display: flex;
  flex-direction: column;
}

.pdf-viewer-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-container {
  width: 100%;
  overflow: hidden;
}

.pdf-empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-viewer-sidebar {
  border-left: 1px solid #e8e8e8;
  background: white;
}

.sidebar-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}

.sidebar-tabs {
  height: 100%;
}

.sidebar-tabs :deep(.ant-tabs-content-holder) {
  overflow: auto;
}

.pdf-viewer-toolbar {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pdf-viewer-spinner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式样式 */
.pdf-viewer-responsive {
  /* 移动端适配 */
  @media (max-width: 768px) {
    .pdf-viewer-sidebar {
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      z-index: 100;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    }
    
    .pdf-viewer-toolbar {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>
