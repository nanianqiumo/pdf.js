<template>
  <a-config-provider>
    <div id="demo-app">
      <!-- 页面标题 -->
      <div class="header-section">
        <a-typography-title :heading="1">
          PDF.js Vue 组件库演示
        </a-typography-title>
        <a-typography-paragraph type="secondary">
          基于 Arco Design Vue 的专业PDF查看器组件，支持插槽定制、响应式布局和丰富的交互功能。
        </a-typography-paragraph>
      </div>

    <!-- 功能演示区域 -->
    <a-row :gutter="[16, 16]" style="margin-bottom: 24px;">
      <a-col :span="24">
        <a-card title="功能演示">
          <a-space wrap align="start">
            <a-button 
              type="primary" 
              @click="showEmbeddedViewer"
            >
              <template #icon><icon-file-text /></template>
              内嵌PDF查看器
            </a-button>
            
            <a-button 
              @click="showModalViewer"
            >
              <template #icon><icon-eye /></template>
              模态框查看器
            </a-button>
            
            <a-button 
              @click="showFullscreenViewer"
            >
              <template #icon><icon-expand /></template>
              全屏查看器
            </a-button>
            
            <a-button 
              @click="showCustomViewer"
            >
              <template #icon><icon-settings /></template>
              自定义配置
            </a-button>
            
            <a-upload
              @before-upload="handleFileUpload"
              :show-file-list="true"
              accept=".pdf"
              :limit="1"
            >
            </a-upload>
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <!-- 内嵌PDF查看器 -->
    <div v-if="showEmbedded" style="margin-bottom: 24px;">
      <a-card title="内嵌PDF查看器" size="small">
        <template #extra>
          <a-button size="small" @click="showEmbedded = false">
            关闭
          </a-button>
        </template>
        
        <div>
          <PdfViewer
            :url="currentPdfUrl"
            :options="embeddedOptions"
            @document-loaded="onDocumentLoaded"
            @page-changed="onPageChanged"
            @zoom-changed="onZoomChanged"
            @error="onError"
          >
            <template #navigation>
              <PdfNavigationPanel />
            </template>

            <template #search>
              <PdfSearchPanel />
            </template>

            <template #highlights>
              <PdfHighlightsPanel />
            </template>

            <template #info>
              <PdfInfoPanel />
            </template>
          </PdfViewer>
        </div>
      </a-card>
    </div>

    <!-- 模态框PDF查看器 -->
    <a-modal
      v-model:visible="modalVisible"
      title="PDF文档查看"
      :width="1200"
      :footer="null"
      :body-style="{ height: '700px', padding: '0' }"
      unmount-on-close
    >
      <PdfViewer
        v-if="modalVisible"
        :url="currentPdfUrl"
        :options="modalOptions"
        style="height: 100%;"
        @document-loaded="onDocumentLoaded"
        @page-changed="onPageChanged"
      >
        <template #navigation>
          <PdfNavigationPanel />
        </template>
        
        <template #search>
          <PdfSearchPanel />
        </template>
        
        <template #highlights>
          <PdfHighlightsPanel />
        </template>
        
        <template #info>
          <PdfInfoPanel />
        </template>
      </PdfViewer>
    </a-modal>

    <!-- 全屏PDF查看器 -->
    <a-modal
      v-model:visible="fullscreenVisible"
      :width="'100vw'"
      :style="{ top: 0, paddingBottom: 0 }"
      :body-style="{ height: '100vh', padding: '0' }"
      :footer="null"
      :closable="true"
      modal-class="fullscreen-modal"
      unmount-on-close
    >
      <PdfViewer
        v-if="fullscreenVisible"
        :url="currentPdfUrl"
        :options="fullscreenOptions"
        style="height: 100%;"
        @document-loaded="onDocumentLoaded"
      >
        <template #navigation>
          <PdfNavigationPanel />
        </template>
        
        <template #search>
          <PdfSearchPanel />
        </template>
        
        <template #highlights>
          <PdfHighlightsPanel />
        </template>
        
        <template #info>
          <PdfInfoPanel />
        </template>
      </PdfViewer>
    </a-modal>

    <!-- 自定义配置模态框 -->
    <a-modal
      v-model:visible="customModalVisible"
      title="自定义PDF查看器配置"
      :width="800"
      @ok="applyCustomConfig"
    >
      <a-form :model="customConfig" layout="vertical">
        <a-row :gutter="[16, 16]">
          <a-col :span="12">
            <a-form-item label="主题">
              <a-select v-model:model-value="customConfig.theme">
                <a-option value="light">浅色主题</a-option>
                <a-option value="dark">深色主题</a-option>
              </a-select>
            </a-form-item>
          </a-col>
          
          <a-col :span="12">
            <a-form-item label="默认面板">
              <a-select v-model:model-value="customConfig.defaultPanel">
                <a-option value="navigation">导航面板</a-option>
                <a-option value="search">搜索面板</a-option>
                <a-option value="highlights">高亮面板</a-option>
                <a-option value="info">信息面板</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="[16, 16]">
          <a-col :span="12">
            <a-form-item label="功能开关">
              <a-checkbox-group v-model:model-value="customConfig.features">
                <a-space direction="vertical">
                  <a-checkbox value="toolbar">显示工具栏</a-checkbox>
                  <a-checkbox value="sidebar">显示侧边栏</a-checkbox>
                  <a-checkbox value="search">启用搜索</a-checkbox>
                  <a-checkbox value="highlight">启用高亮</a-checkbox>
                  <a-checkbox value="fullscreen">启用全屏</a-checkbox>
                </a-space>
              </a-checkbox-group>
            </a-form-item>
          </a-col>
          
          <a-col :span="12">
            <a-form-item label="PDF URL">
              <a-input 
                v-model:model-value="customConfig.pdfUrl" 
                placeholder="输入PDF文件URL"
              />
            </a-form-item>
            
            <a-form-item label="语言">
              <a-select v-model:model-value="customConfig.locale">
                <a-option value="zh-CN">中文(简体)</a-option>
                <a-option value="zh-TW">中文(繁体)</a-option>
                <a-option value="en-US">English</a-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 文档状态信息 -->
    <a-row v-if="documentStatus.loaded" :gutter="[16, 16]">
      <a-col :span="24">
        <a-card title="文档状态" size="small">
          <a-descriptions :column="4" size="small">
            <a-descriptions-item label="文档标题">
              {{ documentStatus.title || '未知' }}
            </a-descriptions-item>
            
            <a-descriptions-item label="作者">
              {{ documentStatus.author || '未知' }}
            </a-descriptions-item>
            
            <a-descriptions-item label="总页数">
              <a-badge :count="documentStatus.totalPages" color="blue" />
            </a-descriptions-item>
            
            <a-descriptions-item label="当前页">
              第 {{ documentStatus.currentPage }} 页
            </a-descriptions-item>
            
            <a-descriptions-item label="缩放级别">
              {{ formatZoomLevel(documentStatus.zoomLevel) }}
            </a-descriptions-item>
            
            <a-descriptions-item label="文件大小">
              {{ formatFileSize(documentStatus.fileSize) }}
            </a-descriptions-item>
            
            <a-descriptions-item label="加载时间">
              {{ documentStatus.loadTime }}ms
            </a-descriptions-item>
            
            <a-descriptions-item label="PDF版本">
              {{ documentStatus.version || 'Unknown' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <!-- 使用说明 -->
    <a-row :gutter="[16, 16]" style="margin-top: 24px;">
      <a-col :span="24">
        <a-card title="使用说明">
          <a-collapse>
            <a-collapse-item key="basic" header="基本使用">
              <pre><code>&lt;PdfViewer :url="pdfUrl" :options="options"&gt;
  &lt;template #navigation&gt;
    &lt;PdfNavigationPanel /&gt;
  &lt;/template&gt;
  &lt;template #search&gt;
    &lt;PdfSearchPanel /&gt;
  &lt;/template&gt;
&lt;/PdfViewer&gt;</code></pre>
            </a-collapse-item>
            
            <a-collapse-item key="config" header="配置选项">
              <a-typography-paragraph>
                <strong>options 支持的配置项：</strong>
                <ul>
                  <li><code>theme</code>: 主题 ('light' | 'dark')</li>
                  <li><code>sidebarOpen</code>: 侧边栏是否默认打开</li>
                  <li><code>defaultPanel</code>: 默认激活的面板</li>
                  <li><code>showToolbar</code>: 是否显示工具栏</li>
                  <li><code>showSidebar</code>: 是否显示侧边栏</li>
                  <li><code>enableFullscreen</code>: 是否启用全屏功能</li>
                  <li><code>enableSearch</code>: 是否启用搜索功能</li>
                  <li><code>enableHighlight</code>: 是否启用高亮功能</li>
                  <li><code>locale</code>: 语言设置</li>
                </ul>
              </a-typography-paragraph>
            </a-collapse-item>
            
            <a-collapse-item key="events" header="事件说明">
              <a-typography-paragraph>
                <strong>支持的事件：</strong>
                <ul>
                  <li><code>@document-loaded</code>: 文档加载完成</li>
                  <li><code>@page-changed</code>: 页面切换</li>
                  <li><code>@zoom-changed</code>: 缩放级别改变</li>
                  <li><code>@error</code>: 错误事件</li>
                  <li><code>@search-result</code>: 搜索结果</li>
                  <li><code>@highlight-created</code>: 创建高亮</li>
                  <li><code>@highlight-deleted</code>: 删除高亮</li>
                </ul>
              </a-typography-paragraph>
            </a-collapse-item>

            <a-collapse-item key="slots" header="插槽说明">
              <a-typography-paragraph>
                <strong>可用插槽：</strong>
                <ul>
                  <li><code>#navigation</code>: 导航面板插槽</li>
                  <li><code>#search</code>: 搜索面板插槽</li>
                  <li><code>#highlights</code>: 高亮面板插槽</li>
                  <li><code>#info</code>: 信息面板插槽</li>
                  <li><code>#toolbar-extra</code>: 工具栏额外按钮插槽</li>
                  <li><code>#empty</code>: 空状态插槽</li>
                </ul>
              </a-typography-paragraph>
            </a-collapse-item>
          </a-collapse>
        </a-card>
      </a-col>
    </a-row>
  </div>
  </a-config-provider>
</template>

<script>
import { h } from 'vue'
export { h }
</script>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Message, Notification } from '@arco-design/web-vue'
import {
  IconFile,
  IconEye,
  IconExpand,
  IconSettings,
  IconUpload
} from '@arco-design/web-vue/es/icon'

// 导入组件
import PdfViewer from './components/pdf-viewer/PdfViewer.vue'
import PdfNavigationPanel from './components/pdf-viewer/panels/PdfNavigationPanel.vue'
import PdfSearchPanel from './components/pdf-viewer/panels/PdfSearchPanel.vue'
import PdfHighlightsPanel from './components/pdf-viewer/panels/PdfHighlightsPanel.vue'
import PdfInfoPanel from './components/pdf-viewer/panels/PdfInfoPanel.vue'

// 响应式数据
const showEmbedded = ref(false)
const modalVisible = ref(false)
const fullscreenVisible = ref(false)
const customModalVisible = ref(false)

// PDF URL管理
const currentPdfUrl = ref('/public/test/pdfs/tracemonkey.pdf')
// 各种查看器配置
const embeddedOptions = reactive({
  theme: 'light',
  sidebarOpen: true,
  defaultPanel: 'navigation',
  showToolbar: true,
  showSidebar: true,
  enableFullscreen: true,
  enableSearch: true,
  enableHighlight: true,
  locale: 'zh-CN',

  viewerPath: '/node_modules/pdfjs-editor/web/viewer.html' // 修改这里
})

const modalOptions = reactive({
  theme: 'light',
  sidebarOpen: true,
  defaultPanel: 'info',
  showToolbar: true,
  showSidebar: true,
  enableFullscreen: false,
  enableSearch: true,
  enableHighlight: true,
  locale: 'zh-CN'
})

const fullscreenOptions = reactive({
  theme: 'dark',
  sidebarOpen: false,
  defaultPanel: 'navigation',
  showToolbar: true,
  showSidebar: true,
  enableFullscreen: false,
  enableSearch: true,
  enableHighlight: true,
  locale: 'zh-CN'
})

// 自定义配置
const customConfig = reactive({
  theme: 'light',
  defaultPanel: 'navigation',
  features: ['toolbar', 'sidebar', 'search', 'highlight', 'fullscreen'],
  pdfUrl: '',
  locale: 'zh-CN'
})

// 文档状态
const documentStatus = reactive({
  loaded: false,
  title: '',
  author: '',
  totalPages: 0,
  currentPage: 1,
  zoomLevel: 'auto',
  fileSize: 0,
  loadTime: 0,
  version: ''
})

// 方法
function showEmbeddedViewer() {
  showEmbedded.value = true
  Message.info('内嵌PDF查看器已打开')
}

function showModalViewer() {
  modalVisible.value = true
  Message.info('模态框PDF查看器已打开')
}

function showFullscreenViewer() {
  fullscreenVisible.value = true
  Message.info('全屏PDF查看器已打开')
}

function showCustomViewer() {
  customModalVisible.value = true
}

function handleFileUpload(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const pdfData = e.target.result
    // 创建 blob URL
    const blob = new Blob([pdfData], { type: 'application/pdf' })
    const blobUrl = URL.createObjectURL(blob)
    currentPdfUrl.value = blobUrl;
    console.log(`currentPdfUrl"${currentPdfUrl}"`)
    Message.success(`文件 "${file.name}" 已加载`)
    showEmbeddedViewer()
  }
  reader.readAsArrayBuffer(file)
  return false // 阻止默认上传行为
}

function applyCustomConfig() {
  // 应用自定义配置
  const config = {
    theme: customConfig.theme,
    defaultPanel: customConfig.defaultPanel,
    showToolbar: customConfig.features.includes('toolbar'),
    showSidebar: customConfig.features.includes('sidebar'),
    enableSearch: customConfig.features.includes('search'),
    enableHighlight: customConfig.features.includes('highlight'),
    enableFullscreen: customConfig.features.includes('fullscreen'),
    locale: customConfig.locale
  }
  
  Object.assign(embeddedOptions, config)
  
  if (customConfig.pdfUrl) {
    currentPdfUrl.value = customConfig.pdfUrl
  }
  
  customModalVisible.value = false
  showEmbeddedViewer()
  
  Notification.success({
    title: '配置已应用',
    content: '自定义配置已成功应用到PDF查看器'
  })
}

// 事件处理器
function onDocumentLoaded(info) {
  console.log('文档已加载:', info)
  
  documentStatus.loaded = true
  documentStatus.title = info.title || '未知标题'
  documentStatus.author = info.author || '未知作者'
  documentStatus.totalPages = info.numPages || 0
  documentStatus.fileSize = info.length || 0
  documentStatus.loadTime = info.loadTime || 0
  documentStatus.version = info.version || 'Unknown'
  
  Notification.success({
    title: '文档加载成功',
    content: `${info.title || '文档'} (${info.numPages} 页) 已成功加载`
  })
}

function onPageChanged(pageNumber) {
  console.log('页面已切换:', pageNumber)
  documentStatus.currentPage = pageNumber
}

function onZoomChanged(zoomLevel) {
  console.log('缩放已改变:', zoomLevel)
  documentStatus.zoomLevel = zoomLevel
}

function onError(error) {
  console.error('PDF查看器错误:', error)
  Notification.error({
    title: 'PDF加载错误',
    content: error.message || '加载PDF时发生未知错误'
  })
}

// 辅助函数
function formatZoomLevel(level) {
  if (typeof level === 'number') {
    return `${Math.round(level * 100)}%`
  }
  
  const textMap = {
    'auto': '自适应',
    'page-fit': '适合页面',
    'page-width': '适合宽度',
    'page-height': '适合高度'
  }
  
  return textMap[level] || level
}

function formatFileSize(bytes) {
  if (!bytes) return '未知'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 组件挂载后自动加载默认PDF
import { onMounted } from 'vue'

onMounted(() => {
  // 自动显示嵌入式查看器，延迟1秒以确保UI组件加载完成
  setTimeout(() => {
    showEmbedded.value = true
  }, 1000)
})
</script>

<style scoped>
#demo-app {
  padding: 24px;
  min-height: 100vh;
  background: #f0f2f5;
}

.header-section {
  text-align: center;
  margin-bottom: 32px;
  padding: 32px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 全屏模态框样式 */
:global(.fullscreen-modal .arco-modal) {
  max-width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
}

:global(.fullscreen-modal .arco-modal-wrapper) {
  border-radius: 0 !important;
}

/* 代码块样式 */
pre {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  overflow-x: auto;
}

code {
  background: #f6f8fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}
</style>
