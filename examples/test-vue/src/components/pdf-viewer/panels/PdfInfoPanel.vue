<template>
  <div class="pdf-info-panel">
    <a-space direction="vertical" style="width: 100%" size="middle">
      <!-- 文档基本信息 -->
      <a-card size="small" title="文档信息" :bordered="false">
        <a-descriptions size="small" :column="1">
          <a-descriptions-item label="标题">
            <a-typography-text 
              :content="documentInfo.title || '未知标题'"
              :ellipsis="{ tooltip: true }"
            />
          </a-descriptions-item>
          
          <a-descriptions-item label="作者">
            <a-typography-text 
              :content="documentInfo.author || '未知作者'"
              :ellipsis="{ tooltip: true }"
            />
          </a-descriptions-item>
          
          <a-descriptions-item label="主题">
            <a-typography-text 
              :content="documentInfo.subject || '无'"
              :ellipsis="{ tooltip: true }"
            />
          </a-descriptions-item>
          
          <a-descriptions-item label="关键词">
            <a-typography-text 
              :content="documentInfo.keywords || '无'"
              :ellipsis="{ tooltip: true }"
            />
          </a-descriptions-item>
          
          <a-descriptions-item label="创建应用">
            <a-typography-text 
              :content="documentInfo.creator || '未知'"
              :ellipsis="{ tooltip: true }"
            />
          </a-descriptions-item>
          
          <a-descriptions-item label="PDF生成器">
            <a-typography-text 
              :content="documentInfo.producer || '未知'"
              :ellipsis="{ tooltip: true }"
            />
          </a-descriptions-item>
          
          <a-descriptions-item label="创建日期">
            <span>{{ formatDate(documentInfo.creationDate) }}</span>
          </a-descriptions-item>
          
          <a-descriptions-item label="修改日期">
            <span>{{ formatDate(documentInfo.modificationDate) }}</span>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 页面信息 -->
      <a-card size="small" title="页面信息" :bordered="false">
        <a-descriptions size="small" :column="1">
          <a-descriptions-item label="总页数">
            <a-badge :count="totalPages" color="blue" />
          </a-descriptions-item>
          
          <a-descriptions-item label="当前页">
            <a-space>
              <span>第 {{ currentPage }} 页</span>
              <a-progress 
                :percent="pageProgress" 
                size="small"
                :showInfo="false"
                style="width: 100px"
              />
            </a-space>
          </a-descriptions-item>
          
          <a-descriptions-item label="页面尺寸">
            <span v-if="currentPageInfo">
              {{ Math.round(currentPageInfo.width) }} × {{ Math.round(currentPageInfo.height) }} pt
            </span>
            <span v-else>未知</span>
          </a-descriptions-item>
          
          <a-descriptions-item label="页面比例">
            <span v-if="currentPageInfo">
              {{ getPageRatio(currentPageInfo.width, currentPageInfo.height) }}
            </span>
            <span v-else>未知</span>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 查看器状态 -->
      <a-card size="small" title="查看器状态" :bordered="false">
        <a-descriptions size="small" :column="1">
          <a-descriptions-item label="缩放级别">
            <a-space>
              <span>{{ formatZoomLevel(zoomLevel) }}</span>
              <a-tag v-if="typeof zoomLevel === 'string'" color="green">
                {{ getZoomLevelText(zoomLevel) }}
              </a-tag>
            </a-space>
          </a-descriptions-item>
          
          <a-descriptions-item label="渲染模式">
            <a-tag color="blue">{{ renderMode || 'Canvas' }}</a-tag>
          </a-descriptions-item>
          
          <a-descriptions-item label="文本层">
            <a-tag :color="textLayerEnabled ? 'green' : 'red'">
              {{ textLayerEnabled ? '启用' : '禁用' }}
            </a-tag>
          </a-descriptions-item>
          
          <a-descriptions-item label="注释层">
            <a-tag :color="annotationLayerEnabled ? 'green' : 'red'">
              {{ annotationLayerEnabled ? '启用' : '禁用' }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 文件信息 -->
      <a-card size="small" title="文件信息" :bordered="false">
        <a-descriptions size="small" :column="1">
          <a-descriptions-item label="PDF版本">
            <a-tag>{{ documentInfo.version || 'Unknown' }}</a-tag>
          </a-descriptions-item>
          
          <a-descriptions-item label="文件大小">
            <span>{{ formatFileSize(documentInfo.length) }}</span>
          </a-descriptions-item>
          
          <a-descriptions-item label="是否加密">
            <a-tag :color="documentInfo.isEncrypted ? 'red' : 'green'">
              {{ documentInfo.isEncrypted ? '是' : '否' }}
            </a-tag>
          </a-descriptions-item>
          
          <a-descriptions-item label="是否线性化">
            <a-tag :color="documentInfo.isLinearized ? 'green' : 'orange'">
              {{ documentInfo.isLinearized ? '是' : '否' }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 统计信息 -->
      <a-card size="small" title="内容统计" :bordered="false">
        <a-row :gutter="[16, 16]">
          <a-col :span="12">
            <a-statistic 
              title="总页数"
              :value="totalPages"
              :value-style="{ color: '#1890ff' }"
            />
          </a-col>
          <a-col :span="12">
            <a-statistic 
              title="高亮数量"
              :value="highlightCount"
              :value-style="{ color: '#52c41a' }"
            />
          </a-col>
        </a-row>
        
        <a-divider style="margin: 16px 0" />
        
        <a-row :gutter="[16, 16]">
          <a-col :span="12">
            <a-statistic 
              title="注释数量"
              :value="annotationCount"
              :value-style="{ color: '#fa8c16' }"
            />
          </a-col>
          <a-col :span="12">
            <a-statistic 
              title="书签数量"
              :value="bookmarkCount"
              :value-style="{ color: '#722ed1' }"
            />
          </a-col>
        </a-row>
      </a-card>

      <!-- 权限信息 -->
      <a-card 
        v-if="documentInfo.permissions"
        size="small" 
        title="文档权限" 
        :bordered="false"
      >
        <a-space direction="vertical" style="width: 100%">
          <div v-for="(permission, key) in permissionList" :key="key">
            <a-space>
              <component 
                :is="permission.allowed ? 'IconCheckCircle' : 'IconCloseCircle'"
                :style="{ color: permission.allowed ? '#52c41a' : '#f5222d' }"
              />
              <span>{{ permission.label }}</span>
            </a-space>
          </div>
        </a-space>
      </a-card>

      <!-- 技术信息 -->
      <a-card size="small" title="技术信息" :bordered="false">
        <a-descriptions size="small" :column="1">
          <a-descriptions-item label="PDF.js版本">
            <a-tag color="geekblue">{{ pdfJsVersion }}</a-tag>
          </a-descriptions-item>
          
          <a-descriptions-item label="加载时间">
            <span>{{ loadTime ? `${loadTime}ms` : '未知' }}</span>
          </a-descriptions-item>
          
          <a-descriptions-item label="渲染时间">
            <span>{{ renderTime ? `${renderTime}ms` : '未知' }}</span>
          </a-descriptions-item>
          
          <a-descriptions-item label="内存使用">
            <span>{{ memoryUsage || '未知' }}</span>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 操作按钮 -->
      <a-card size="small" title="快速操作" :bordered="false">
        <a-space wrap>
          <a-button 
            size="small"
            @click="copyDocumentInfo"
            :icon="h(IconCopy)"
          >
            复制信息
          </a-button>
          
          <a-button 
            size="small"
            @click="exportDocumentInfo"
            :icon="h(IconDownload)"
          >
            导出信息
          </a-button>
          
          <a-button 
            size="small"
            @click="refreshInfo"
            :loading="refreshing"
            :icon="h(IconRefresh)"
          >
            刷新信息
          </a-button>
          
          <a-button 
            size="small"
            @click="showDetailedInfo"
            :icon="h(InfoCircleOutlined)"
          >
            详细信息
          </a-button>
        </a-space>
      </a-card>
    </a-space>

    <!-- 详细信息模态框 -->
    <a-modal
      v-model:visible="detailModalVisible"
      title="详细文档信息"
      :width="800"
      :footer="null"
    >
      <a-tabs>
        <a-tab-pane key="metadata" tab="元数据">
          <pre class="json-display">{{ JSON.stringify(documentInfo, null, 2) }}</pre>
        </a-tab-pane>
        
        <a-tab-pane key="pages" tab="页面详情">
          <a-table 
            :dataSource="pageDetails"
            :columns="pageColumns"
            size="small"
            :pagination="{ pageSize: 10 }"
          />
        </a-tab-pane>
        
        <a-tab-pane key="fonts" tab="字体信息">
          <a-list
            :dataSource="fontList"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.name"
                  :description="`类型: ${item.type}, 编码: ${item.encoding || '未知'}`"
                />
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script setup>
import { h, ref, computed, watch, onMounted, inject } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  IconCopy,
  IconDownload,
  IconRefresh,
  IconCheckCircle,
  IconCloseCircle
} from '@arco-design/web-vue/es/icon'

const props = defineProps({
  documentInfo: {
    type: Object,
    default: () => ({})
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 0
  },
  zoomLevel: {
    type: [Number, String],
    default: 1
  },
  pdfViewer: Object
})

// 注入上下文
const context = inject('pdfViewerContext', {})

// 响应式数据
const refreshing = ref(false)
const detailModalVisible = ref(false)
const currentPageInfo = ref(null)
const loadTime = ref(null)
const renderTime = ref(null)
const memoryUsage = ref(null)
const pdfJsVersion = ref('5.4.29')

// 模拟数据
const renderMode = ref('Canvas')
const textLayerEnabled = ref(true)
const annotationLayerEnabled = ref(true)
const highlightCount = ref(0)
const annotationCount = ref(0)
const bookmarkCount = ref(0)
const pageDetails = ref([])
const fontList = ref([])

// 计算属性
const pageProgress = computed(() => {
  if (props.totalPages === 0) return 0
  return Math.round((props.currentPage / props.totalPages) * 100)
})

const permissionList = computed(() => {
  const permissions = props.documentInfo.permissions || {}
  return {
    print: {
      label: '打印文档',
      allowed: permissions.print !== false
    },
    printHighRes: {
      label: '高分辨率打印',
      allowed: permissions.printHighRes !== false
    },
    copy: {
      label: '复制内容',
      allowed: permissions.copy !== false
    },
    modify: {
      label: '修改文档',
      allowed: permissions.modify !== false
    },
    modifyAnnotations: {
      label: '修改注释',
      allowed: permissions.modifyAnnotations !== false
    },
    fillInteractiveForm: {
      label: '填写表单',
      allowed: permissions.fillInteractiveForm !== false
    },
    copyAccessible: {
      label: '辅助复制',
      allowed: permissions.copyAccessible !== false
    },
    assembleDocument: {
      label: '组装文档',
      allowed: permissions.assembleDocument !== false
    }
  }
})

const pageColumns = [
  { title: '页码', dataIndex: 'pageNumber', key: 'pageNumber', width: 80 },
  { title: '宽度', dataIndex: 'width', key: 'width', width: 100 },
  { title: '高度', dataIndex: 'height', key: 'height', width: 100 },
  { title: '旋转', dataIndex: 'rotation', key: 'rotation', width: 80 },
  { title: '比例', dataIndex: 'ratio', key: 'ratio' }
]

// 方法
function formatDate(dateString) {
  if (!dateString) return '未知'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '无效日期'
    return date.toLocaleString('zh-CN')
  } catch {
    return '无效日期'
  }
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

function formatZoomLevel(level) {
  if (typeof level === 'number') {
    return `${Math.round(level * 100)}%`
  }
  return level || '自动'
}

function getZoomLevelText(level) {
  const textMap = {
    'auto': '自适应',
    'page-fit': '适合页面',
    'page-width': '适合宽度',
    'page-height': '适合高度'
  }
  return textMap[level] || level
}

function getPageRatio(width, height) {
  if (!width || !height) return '未知'
  
  const ratio = width / height
  
  // 常见比例识别
  if (Math.abs(ratio - 1.414) < 0.01) return 'A4 (1:√2)'
  if (Math.abs(ratio - 1.333) < 0.01) return '4:3'
  if (Math.abs(ratio - 1.778) < 0.01) return '16:9'
  if (Math.abs(ratio - 1) < 0.01) return '1:1'
  
  return `${ratio.toFixed(2)}:1`
}

async function refreshInfo() {
  if (!props.pdfViewer) {
    Message.warning('PDF查看器未准备就绪')
    return
  }

  try {
    refreshing.value = true
    
    // 获取当前页面信息
    if (props.pdfViewer.getCurrentPageInfo) {
      currentPageInfo.value = await props.pdfViewer.getCurrentPageInfo()
    }
    
    // 获取统计信息
    if (props.pdfViewer.getStats) {
      const stats = await props.pdfViewer.getStats()
      highlightCount.value = stats.highlights || 0
      annotationCount.value = stats.annotations || 0
      bookmarkCount.value = stats.bookmarks || 0
    }
    
    // 获取性能信息
    if (props.pdfViewer.getPerformanceInfo) {
      const perf = await props.pdfViewer.getPerformanceInfo()
      loadTime.value = perf.loadTime
      renderTime.value = perf.renderTime
      memoryUsage.value = perf.memoryUsage
    }
    
    Message.success('信息已刷新')
    
  } catch (error) {
    console.error('刷新信息失败:', error)
    Message.error('刷新信息失败')
  } finally {
    refreshing.value = false
  }
}

function copyDocumentInfo() {
  const info = {
    title: props.documentInfo.title,
    author: props.documentInfo.author,
    creator: props.documentInfo.creator,
    producer: props.documentInfo.producer,
    creationDate: props.documentInfo.creationDate,
    modificationDate: props.documentInfo.modificationDate,
    pages: props.totalPages,
    currentPage: props.currentPage,
    version: props.documentInfo.version,
    encrypted: props.documentInfo.isEncrypted,
    fileSize: formatFileSize(props.documentInfo.length)
  }
  
  const text = Object.entries(info)
    .map(([key, value]) => `${key}: ${value || 'Unknown'}`)
    .join('\n')
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => Message.success('文档信息已复制到剪贴板'))
      .catch(() => Message.error('复制失败'))
  } else {
    // 兼容性处理
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    Message.success('文档信息已复制到剪贴板')
  }
}

function exportDocumentInfo() {
  const info = {
    document: props.documentInfo,
    viewer: {
      currentPage: props.currentPage,
      totalPages: props.totalPages,
      zoomLevel: props.zoomLevel,
      renderMode: renderMode.value,
      textLayerEnabled: textLayerEnabled.value,
      annotationLayerEnabled: annotationLayerEnabled.value
    },
    stats: {
      highlights: highlightCount.value,
      annotations: annotationCount.value,
      bookmarks: bookmarkCount.value
    },
    performance: {
      loadTime: loadTime.value,
      renderTime: renderTime.value,
      memoryUsage: memoryUsage.value
    },
    exportedAt: new Date().toISOString()
  }
  
  try {
    const content = JSON.stringify(info, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-info-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    Message.success('文档信息已导出')
    
  } catch (error) {
    console.error('导出失败:', error)
    Message.error('导出失败')
  }
}

async function showDetailedInfo() {
  detailModalVisible.value = true
  
  try {
    // 获取页面详细信息
    if (props.pdfViewer && props.pdfViewer.getAllPageInfo) {
      const allPageInfo = await props.pdfViewer.getAllPageInfo()
      pageDetails.value = allPageInfo.map((page, index) => ({
        key: index + 1,
        pageNumber: index + 1,
        width: Math.round(page.width),
        height: Math.round(page.height),
        rotation: page.rotation || 0,
        ratio: getPageRatio(page.width, page.height)
      }))
    }
    
    // 获取字体信息
    if (props.pdfViewer && props.pdfViewer.getFontList) {
      fontList.value = await props.pdfViewer.getFontList()
    }
    
  } catch (error) {
    console.error('获取详细信息失败:', error)
  }
}

// 监听器
watch(() => props.currentPage, async (newPage) => {
  if (props.pdfViewer && props.pdfViewer.getCurrentPageInfo) {
    try {
      currentPageInfo.value = await props.pdfViewer.getCurrentPageInfo(newPage)
    } catch (error) {
      console.warn('获取页面信息失败:', error)
    }
  }
})

watch(() => props.pdfViewer, (newViewer) => {
  if (newViewer) {
    refreshInfo()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 初始化数据
  if (props.pdfViewer) {
    refreshInfo()
  }
})
</script>

<style scoped>
.pdf-info-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.json-display {
  background-color: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.45;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 滚动条样式 */
.pdf-info-panel::-webkit-scrollbar {
  width: 6px;
}

.pdf-info-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.pdf-info-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.pdf-info-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
