<template>
  <div class="pdf-navigation-panel">
    <!-- 页面导航 -->
    <a-space direction="vertical" style="width: 100%" size="middle">
      <!-- 当前页面信息 -->
      <a-card size="small" title="页面导航" :bordered="false">
        <a-space direction="vertical" style="width: 100%">
          <a-row :gutter="[16, 16]" align="middle">
            <a-col :span="8">
              <a-button 
                size="small"
                :disabled="currentPage <= 1"
                @click="goToPrevious"
              >
                <icon-left />
                上一页
              </a-button>
            </a-col>
            <a-col :span="8">
              <a-input-number
                v-model:model-value="pageInput"
                :min="1"
                :max="totalPages"
                @press-enter="goToInputPage"
                @change="goToInputPage"
                size="small"
                :disabled="!pdfViewer"
              />
            </a-col>
            <a-col :span="8">
              <a-button 
                size="small"
                :disabled="currentPage >= totalPages"
                @click="goToNext"
              >
                下一页
                <icon-right />
              </a-button>
            </a-col>
          </a-row>
          
          <div style="text-align: center">
            <a-typography-text type="secondary">
              第 {{ currentPage }} 页，共 {{ totalPages }} 页
            </a-typography-text>
          </div>
          
          <!-- 页面进度条 -->
          <a-progress 
            :percent="pageProgress" 
            :show-text="false"
            size="small"
          />
        </a-space>
      </a-card>

      <!-- 快速跳转 -->
      <a-card size="small" title="快速跳转" :bordered="false">
        <a-space wrap>
          <a-button 
            size="small" 
            @click="goToPage(1)"
            :disabled="currentPage === 1"
          >
            首页
          </a-button>
          <a-button 
            size="small" 
            @click="goToPage(Math.ceil(totalPages / 4))"
            :disabled="totalPages < 4"
          >
            25%
          </a-button>
          <a-button 
            size="small" 
            @click="goToPage(Math.ceil(totalPages / 2))"
            :disabled="totalPages < 2"
          >
            50%
          </a-button>
          <a-button 
            size="small" 
            @click="goToPage(Math.ceil(totalPages * 3 / 4))"
            :disabled="totalPages < 4"
          >
            75%
          </a-button>
          <a-button 
            size="small" 
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
          >
            末页
          </a-button>
        </a-space>
      </a-card>

      <!-- 页面缩略图列表 -->
      <a-card size="small" title="页面预览" :bordered="false">
        <div class="thumbnail-list" v-if="thumbnails.length > 0">
          <div 
            v-for="(thumbnail, index) in visibleThumbnails" 
            :key="index + 1"
            class="thumbnail-item"
            :class="{ active: currentPage === index + 1 }"
            @click="goToPage(index + 1)"
          >
            <div class="thumbnail-image">
              <img 
                v-if="thumbnail"
                :src="thumbnail" 
                :alt="`页面 ${index + 1}`"
                loading="lazy"
              />
              <div v-else class="thumbnail-placeholder">
                <file-text-outlined />
              </div>
            </div>
            <div class="thumbnail-label">
              {{ index + 1 }}
            </div>
          </div>
        </div>
        
        <!-- 无缩略图时的占位符 -->
        <a-empty 
          v-else
          description="暂无页面预览"
          size="small"
        />
        
        <!-- 加载更多按钮 -->
        <div v-if="hasMoreThumbnails" style="text-align: center; margin-top: 16px">
          <a-button 
            size="small" 
            type="link"
            @click="loadMoreThumbnails"
            :loading="loadingThumbnails"
          >
            加载更多预览
          </a-button>
        </div>
      </a-card>
    </a-space>
  </div>
</template>

<script setup>
import { h, ref, computed, watch, onMounted, inject } from 'vue'
import { 
  IconLeft, 
  IconRight, 
} from '@arco-design/web-vue/es/icon'

const props = defineProps({
  pdfViewer: Object,
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['page-change'])

// 注入上下文
const context = inject('pdfViewerContext', {})

// 响应式数据
const pageInput = ref(props.currentPage)
const thumbnails = ref([])
const visibleThumbnails = ref([])
const loadingThumbnails = ref(false)
const thumbnailBatchSize = 10
const loadedThumbnailCount = ref(0)

// 计算属性
const pageProgress = computed(() => {
  if (props.totalPages === 0) return 0
  return Math.round((props.currentPage / props.totalPages) * 100)
})

const hasMoreThumbnails = computed(() => {
  return loadedThumbnailCount.value < props.totalPages
})

// 方法
function goToPage(page) {
  if (page >= 1 && page <= props.totalPages) {
    emit('page-change', page)
  }
}

function goToPrevious() {
  if (props.currentPage > 1) {
    goToPage(props.currentPage - 1)
  }
}

function goToNext() {
  if (props.currentPage < props.totalPages) {
    goToPage(props.currentPage + 1)
  }
}

function goToInputPage() {
  if (pageInput.value && pageInput.value !== props.currentPage) {
    goToPage(pageInput.value)
  }
}

async function generateThumbnails() {
  if (!props.pdfViewer || props.totalPages === 0) return
  
  try {
    loadingThumbnails.value = true
    
    // 初始加载前几页的缩略图
    const startIndex = loadedThumbnailCount.value
    const endIndex = Math.min(startIndex + thumbnailBatchSize, props.totalPages)
    
    for (let i = startIndex; i < endIndex; i++) {
      try {
        const thumbnail = await generatePageThumbnail(i + 1)
        thumbnails.value[i] = thumbnail
        visibleThumbnails.value[i] = thumbnail
      } catch (error) {
        console.warn(`生成第 ${i + 1} 页缩略图失败:`, error)
        thumbnails.value[i] = null
      }
    }
    
    loadedThumbnailCount.value = endIndex
    
  } catch (error) {
    console.error('生成缩略图失败:', error)
  } finally {
    loadingThumbnails.value = false
  }
}

async function generatePageThumbnail(pageNumber) {
  // 这里需要实现从PDF.js获取页面缩略图的逻辑
  // 由于具体实现依赖于PDF.js的API，这里提供一个示例结构
  if (props.pdfViewer && props.pdfViewer.getThumbnail) {
    return await props.pdfViewer.getThumbnail(pageNumber, { width: 120, height: 160 })
  }
  return null
}

function loadMoreThumbnails() {
  generateThumbnails()
}

// 监听器
watch(() => props.currentPage, (newPage) => {
  pageInput.value = newPage
})

watch(() => props.pdfViewer, (newViewer) => {
  if (newViewer && props.totalPages > 0) {
    // 重置并重新生成缩略图
    thumbnails.value = []
    visibleThumbnails.value = []
    loadedThumbnailCount.value = 0
    generateThumbnails()
  }
})

watch(() => props.totalPages, (newTotal) => {
  if (newTotal > 0 && props.pdfViewer) {
    generateThumbnails()
  }
})

// 生命周期
onMounted(() => {
  if (props.pdfViewer && props.totalPages > 0) {
    generateThumbnails()
  }
})
</script>

<style scoped>
.pdf-navigation-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.thumbnail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.thumbnail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.thumbnail-item:hover {
  border-color: #1890ff;
  background-color: #f0f8ff;
}

.thumbnail-item.active {
  border-color: #1890ff;
  background-color: #e6f7ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

.thumbnail-image {
  flex-shrink: 0;
  width: 48px;
  height: 64px;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.thumbnail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  color: #bfbfbf;
  font-size: 24px;
}

.thumbnail-label {
  flex: 1;
  text-align: center;
  font-weight: 500;
}

/* 滚动条样式 */
.thumbnail-list::-webkit-scrollbar {
  width: 6px;
}

.thumbnail-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.thumbnail-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.thumbnail-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
