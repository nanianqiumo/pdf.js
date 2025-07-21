<template>
  <div class="pdf-search-panel">
    <a-space direction="vertical" style="width: 100%" size="middle">
      <!-- 搜索输入 -->
      <a-card size="small" title="文本搜索" :bordered="false">
        <a-space direction="vertical" style="width: 100%">
          <a-input-search
            v-model:value="searchText"
            placeholder="输入要搜索的文本"
            allow-clear
            @search="handleSearch"
            @pressEnter="handleSearch"
            :loading="searching"
            :disabled="!pdfViewer"
          >
            <template #addonAfter>
              <a-button-group>
                <a-button 
                  :disabled="!hasResults || currentResultIndex <= 0"
                  @click="previousResult"
                  size="small"
                >
                  <template #icon><LeftOutlined /></template>
                </a-button>
                <a-button 
                  :disabled="!hasResults || currentResultIndex >= searchResults.length - 1"
                  @click="nextResult"
                  size="small"
                >
                  <template #icon><RightOutlined /></template>
                </a-button>
              </a-button-group>
            </template>
          </a-input-search>

          <!-- 搜索选项 -->
          <a-space wrap>
            <a-checkbox v-model:checked="searchOptions.caseSensitive">
              区分大小写
            </a-checkbox>
            <a-checkbox v-model:checked="searchOptions.wholeWords">
              完整单词
            </a-checkbox>
            <a-checkbox v-model:checked="searchOptions.regex">
              正则表达式
            </a-checkbox>
          </a-space>

          <!-- 搜索统计 -->
          <div v-if="hasResults" class="search-stats">
            <a-typography-text type="secondary">
              找到 {{ searchResults.length }} 个结果
              <span v-if="currentResultIndex >= 0">
                ，当前第 {{ currentResultIndex + 1 }} 个
              </span>
            </a-typography-text>
          </div>

          <!-- 无结果提示 -->
          <a-alert
            v-if="searchCompleted && !hasResults && searchText"
            message="未找到匹配结果"
            :description="`未找到包含 '${searchText}' 的内容`"
            type="info"
            show-icon
            closable
          />
        </a-space>
      </a-card>

      <!-- 搜索结果列表 -->
      <a-card 
        v-if="hasResults" 
        size="small" 
        title="搜索结果" 
        :bordered="false"
      >
        <template #extra>
          <a-space>
            <a-button 
              size="small" 
              type="link" 
              @click="highlightAllResults"
              :disabled="!pdfViewer"
            >
              全部高亮
            </a-button>
            <a-button 
              size="small" 
              type="link" 
              @click="clearSearch"
            >
              清空搜索
            </a-button>
          </a-space>
        </template>

        <div class="search-results-list">
          <a-list
            :dataSource="searchResults"
            size="small"
            :pagination="{
              current: Math.floor(currentResultIndex / 10) + 1,
              pageSize: 10,
              total: searchResults.length,
              size: 'small',
              showSizeChanger: false,
              showQuickJumper: true
            }"
          >
            <template #renderItem="{ item, index }">
              <a-list-item
                :class="{ 'result-item-active': index === currentResultIndex }"
                class="search-result-item"
                @click="goToResult(index)"
              >
                <a-list-item-meta>
                  <template #title>
                    <a-space>
                      <a-tag size="small" color="blue">
                        第 {{ item.page }} 页
                      </a-tag>
                      <a-typography-text 
                        :type="index === currentResultIndex ? 'warning' : 'secondary'"
                        style="font-size: 12px"
                      >
                        结果 {{ index + 1 }}
                      </a-typography-text>
                    </a-space>
                  </template>
                  
                  <template #description>
                    <div class="result-context">
                      <a-typography-text 
                        :ellipsis="{ rows: 2, tooltip: item.context }"
                        class="context-text"
                      >
                        <!-- 高亮匹配文本 -->
                        <span v-html="highlightMatchText(item.context, searchText)"></span>
                      </a-typography-text>
                    </div>
                  </template>
                </a-list-item-meta>

                <template #actions>
                  <a-space>
                    <a-button 
                      size="small" 
                      type="link" 
                      @click.stop="highlightResult(item)"
                      :disabled="!pdfViewer"
                    >
                      高亮
                    </a-button>
                    <a-button 
                      size="small" 
                      type="link" 
                      @click.stop="copyResultText(item)"
                    >
                      复制
                    </a-button>
                  </a-space>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </a-card>

      <!-- 高级搜索 -->
      <a-card size="small" :bordered="false">
        <template #title>
          <a-space>
            高级搜索
            <a-switch 
              v-model:checked="showAdvancedSearch" 
              size="small"
            />
          </a-space>
        </template>

        <div v-if="showAdvancedSearch">
          <a-space direction="vertical" style="width: 100%">
            <a-form layout="vertical" size="small">
              <a-form-item label="搜索范围">
                <a-select 
                  v-model:value="advancedOptions.searchRange"
                  style="width: 100%"
                >
                  <a-select-option value="all">整个文档</a-select-option>
                  <a-select-option value="current">当前页面</a-select-option>
                  <a-select-option value="range">指定范围</a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item 
                v-if="advancedOptions.searchRange === 'range'"
                label="页面范围"
              >
                <a-space>
                  <a-input-number 
                    v-model:value="advancedOptions.rangeStart"
                    :min="1"
                    :max="totalPages"
                    placeholder="开始页"
                    style="width: 80px"
                  />
                  <span>至</span>
                  <a-input-number 
                    v-model:value="advancedOptions.rangeEnd"
                    :min="advancedOptions.rangeStart || 1"
                    :max="totalPages"
                    placeholder="结束页"
                    style="width: 80px"
                  />
                </a-space>
              </a-form-item>

              <a-form-item label="搜索类型">
                <a-radio-group v-model:value="advancedOptions.searchType">
                  <a-radio value="contains">包含</a-radio>
                  <a-radio value="startsWith">开头</a-radio>
                  <a-radio value="endsWith">结尾</a-radio>
                  <a-radio value="exact">精确匹配</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-form>
          </a-space>
        </div>
      </a-card>
    </a-space>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { message } from 'ant-design-vue'
import { 
  LeftOutlined, 
  RightOutlined 
} from '@ant-design/icons-vue'

const props = defineProps({
  pdfViewer: Object,
  totalPages: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['search-result', 'search-started', 'search-completed'])

// 注入上下文
const context = inject('pdfViewerContext', {})

// 响应式数据
const searchText = ref('')
const searching = ref(false)
const searchCompleted = ref(false)
const searchResults = ref([])
const currentResultIndex = ref(-1)
const showAdvancedSearch = ref(false)

const searchOptions = ref({
  caseSensitive: false,
  wholeWords: false,
  regex: false
})

const advancedOptions = ref({
  searchRange: 'all', // 'all' | 'current' | 'range'
  rangeStart: 1,
  rangeEnd: 1,
  searchType: 'contains' // 'contains' | 'startsWith' | 'endsWith' | 'exact'
})

// 计算属性
const hasResults = computed(() => searchResults.value.length > 0)

// 方法
async function handleSearch() {
  if (!searchText.value.trim()) {
    message.warning('请输入搜索内容')
    return
  }

  if (!props.pdfViewer) {
    message.error('PDF查看器未准备就绪')
    return
  }

  try {
    searching.value = true
    searchCompleted.value = false
    currentResultIndex.value = -1
    
    emit('search-started', { query: searchText.value, options: searchOptions.value })

    // 执行搜索 - 这里需要根据实际的PDF.js API来实现
    const results = await performSearch()
    
    searchResults.value = results
    searchCompleted.value = true
    
    if (results.length > 0) {
      currentResultIndex.value = 0
      goToResult(0)
      emit('search-result', {
        query: searchText.value,
        results,
        total: results.length
      })
      message.success(`找到 ${results.length} 个搜索结果`)
    } else {
      message.info('未找到匹配的内容')
    }

  } catch (error) {
    console.error('搜索失败:', error)
    message.error('搜索过程中出现错误')
  } finally {
    searching.value = false
  }
}

async function performSearch() {
  // 模拟搜索结果 - 实际实现需要调用PDF.js的搜索API
  const mockResults = []
  
  // 这里应该调用实际的PDF搜索API
  if (props.pdfViewer && props.pdfViewer.search) {
    return await props.pdfViewer.search(searchText.value, {
      ...searchOptions.value,
      ...getSearchRange()
    })
  }
  
  // 临时模拟数据
  const query = searchText.value.toLowerCase()
  for (let page = 1; page <= Math.min(props.totalPages, 5); page++) {
    if (Math.random() > 0.3) { // 模拟某些页面有搜索结果
      mockResults.push({
        page,
        position: { x: 100, y: 200 },
        context: `这是第${page}页的内容，包含了搜索词"${searchText.value}"的相关文本内容。这段文字用于展示搜索结果的上下文信息。`,
        matchText: searchText.value,
        boundingBox: { x: 100, y: 200, width: 150, height: 20 }
      })
    }
  }
  
  return mockResults
}

function getSearchRange() {
  const range = advancedOptions.value
  switch (range.searchRange) {
    case 'current':
      return { pages: [context.currentPage?.value || 1] }
    case 'range':
      const start = range.rangeStart || 1
      const end = Math.min(range.rangeEnd || props.totalPages, props.totalPages)
      const pages = []
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return { pages }
    default:
      return { pages: 'all' }
  }
}

function previousResult() {
  if (currentResultIndex.value > 0) {
    goToResult(currentResultIndex.value - 1)
  }
}

function nextResult() {
  if (currentResultIndex.value < searchResults.value.length - 1) {
    goToResult(currentResultIndex.value + 1)
  }
}

function goToResult(index) {
  if (index >= 0 && index < searchResults.value.length) {
    currentResultIndex.value = index
    const result = searchResults.value[index]
    
    // 跳转到对应页面
    if (context.emitEvent) {
      context.emitEvent('page-changed', result.page)
    }
    
    // 如果有位置信息，滚动到对应位置
    if (props.pdfViewer && props.pdfViewer.scrollToPosition && result.position) {
      props.pdfViewer.scrollToPosition(result.page, result.position)
    }
  }
}

function highlightResult(result) {
  if (props.pdfViewer && props.pdfViewer.createHighlight) {
    props.pdfViewer.createHighlight({
      page: result.page,
      boundingBox: result.boundingBox,
      text: result.matchText,
      color: '#ffeb3b',
      type: 'search-highlight'
    })
    message.success('已添加高亮')
  }
}

function highlightAllResults() {
  if (!props.pdfViewer) return
  
  let count = 0
  searchResults.value.forEach(result => {
    try {
      highlightResult(result)
      count++
    } catch (error) {
      console.warn('高亮失败:', error)
    }
  })
  
  message.success(`已为 ${count} 个搜索结果添加高亮`)
}

function copyResultText(result) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(result.context)
      .then(() => message.success('已复制到剪贴板'))
      .catch(() => message.error('复制失败'))
  } else {
    // 兼容老版本浏览器
    const textArea = document.createElement('textarea')
    textArea.value = result.context
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    message.success('已复制到剪贴板')
  }
}

function clearSearch() {
  searchText.value = ''
  searchResults.value = []
  currentResultIndex.value = -1
  searchCompleted.value = false
  
  // 清除PDF中的搜索高亮
  if (props.pdfViewer && props.pdfViewer.clearSearch) {
    props.pdfViewer.clearSearch()
  }
}

function highlightMatchText(text, query) {
  if (!query || !text) return text
  
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    searchOptions.value.caseSensitive ? 'g' : 'gi'
  )
  
  return text.replace(regex, '<mark>$1</mark>')
}

// 监听器
watch(() => advancedOptions.value.rangeStart, (newStart) => {
  if (newStart > advancedOptions.value.rangeEnd) {
    advancedOptions.value.rangeEnd = newStart
  }
})

watch(() => props.totalPages, (newTotal) => {
  if (newTotal > 0) {
    advancedOptions.value.rangeEnd = newTotal
  }
})
</script>

<style scoped>
.pdf-search-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.search-stats {
  text-align: center;
  padding: 8px 0;
}

.search-results-list {
  max-height: 400px;
  overflow-y: auto;
}

.search-result-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  margin-bottom: 4px;
}

.search-result-item:hover {
  background-color: #f0f8ff;
}

.result-item-active {
  background-color: #e6f7ff;
  border: 1px solid #1890ff;
}

.result-context {
  margin-top: 4px;
}

.context-text :deep(mark) {
  background-color: #fff3cd;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 500;
}

/* 滚动条样式 */
.search-results-list::-webkit-scrollbar {
  width: 6px;
}

.search-results-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.search-results-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.search-results-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
