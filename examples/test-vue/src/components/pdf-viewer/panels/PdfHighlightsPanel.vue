<template>
  <div class="pdf-highlights-panel">
    <a-space direction="vertical" style="width: 100%" size="middle">
      <!-- 高亮统计和操作 -->
      <a-card size="small" title="高亮管理" :bordered="false">
        <template #extra>
          <a-space>
            <a-badge :count="highlights.length" />
            <a-button 
              size="small" 
              type="link" 
              @click="clearAllHighlights"
              :disabled="highlights.length === 0"
              danger
            >
              清空全部
            </a-button>
          </a-space>
        </template>

        <a-space wrap>
          <a-select
            v-model:model-value="filterType"
            placeholder="筛选类型"
            style="width: 120px"
            size="small"
            allowClear
          >
            <a-select-option value="">全部类型</a-select-option>
            <a-select-option value="manual">手动高亮</a-select-option>
            <a-select-option value="search">搜索高亮</a-select-option>
            <a-select-option value="annotation">注释高亮</a-select-option>
          </a-select>

          <a-select
            v-model:model-value="filterColor"
            placeholder="筛选颜色"
            style="width: 100px"
            size="small"
            allowClear
          >
            <a-select-option value="">全部颜色</a-select-option>
            <a-select-option value="#ffeb3b">
              <a-tag color="#ffeb3b">黄色</a-tag>
            </a-select-option>
            <a-select-option value="#4caf50">
              <a-tag color="#4caf50">绿色</a-tag>
            </a-select-option>
            <a-select-option value="#2196f3">
              <a-tag color="#2196f3">蓝色</a-tag>
            </a-select-option>
            <a-select-option value="#f44336">
              <a-tag color="#f44336">红色</a-tag>
            </a-select-option>
          </a-select>

          <a-input-search
            v-model:model-value="searchQuery"
            placeholder="搜索高亮内容"
            style="width: 150px"
            size="small"
            allow-clear
          />
        </a-space>
      </a-card>

      <!-- 高亮颜色选择器 -->
      <a-card size="small" title="创建高亮" :bordered="false">
        <a-space direction="vertical" style="width: 100%">
          <div>
            <a-typography-text type="secondary" style="font-size: 12px">
              选中文本后点击颜色创建高亮
            </a-typography-text>
          </div>
          <a-space wrap>
            <a-button
              v-for="color in highlightColors"
              :key="color.value"
              size="small"
              :style="{ 
                backgroundColor: color.value, 
                color: color.textColor,
                border: `1px solid ${color.value}`
              }"
              @click="createHighlightWithColor(color.value)"
              :disabled="!hasSelectedText"
            >
              {{ color.name }}
            </a-button>
          </a-space>
        </a-space>
      </a-card>

      <!-- 高亮列表 -->
      <a-card 
        size="small" 
        :title="`高亮列表 (${filteredHighlights.length})`"
        :bordered="false"
      >
        <div v-if="filteredHighlights.length > 0" class="highlights-list">
          <a-list
            :dataSource="paginatedHighlights"
            size="small"
            :pagination="paginationConfig"
          >
            <template #renderItem="{ item, index }">
              <a-list-item class="highlight-item">
                <a-list-item-meta>
                  <template #title>
                    <a-space>
                      <a-tag 
                        :color="getColorName(item.color)"
                        size="small"
                      >
                        第 {{ item.page }} 页
                      </a-tag>
                      <a-typography-text 
                        type="secondary" 
                        style="font-size: 12px"
                      >
                        {{ formatDate(item.createdAt) }}
                      </a-typography-text>
                    </a-space>
                  </template>
                  
                  <template #description>
                    <div class="highlight-content">
                      <a-typography-paragraph
                        :ellipsis="{ rows: 2, expandable: true }"
                        class="highlight-text"
                        @click="goToHighlight(item)"
                        style="cursor: pointer; margin-bottom: 8px"
                      >
                        {{ item.text }}
                      </a-typography-paragraph>
                      
                      <!-- 高亮注释 -->
                      <div v-if="item.note" class="highlight-note">
                        <a-typography-text type="secondary" style="font-size: 12px">
                          <strong>备注：</strong>{{ item.note }}
                        </a-typography-text>
                      </div>
                    </div>
                  </template>

                  <template #avatar>
                    <div 
                      class="highlight-color-indicator"
                      :style="{ backgroundColor: item.color }"
                    ></div>
                  </template>
                </a-list-item-meta>

                <template #actions>
                  <a-dropdown :trigger="['click']">
                    <a-button size="small" type="text">
                      更多
                      <IconDown />
                    </a-button>
                    <template #overlay>
                      <a-menu @click="(e) => handleMenuAction(e.key, item)">
                        <a-menu-item key="goto">
                          <IconEye />
                          定位到高亮
                        </a-menu-item>
                        <a-menu-item key="edit">
                          <IconEdit />
                          编辑备注
                        </a-menu-item>
                        <a-menu-item key="copy">
                          <IconCopy />
                          复制文本
                        </a-menu-item>
                        <a-menu-item key="color">
                          <IconCopy />
                          更改颜色
                        </a-menu-item>
                        <a-menu-divider />
                        <a-menu-item key="delete" danger>
                          <IconDelete />
                          删除高亮
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </div>

        <!-- 空状态 -->
        <a-empty 
          v-else
          description="暂无高亮内容"
          :image="h(IconHighlight)"
        >
          <template #description>
            <span>暂无高亮内容</span>
            <br>
            <a-typography-text type="secondary" style="font-size: 12px">
              在PDF中选中文本并点击上方颜色按钮创建高亮
            </a-typography-text>
          </template>
        </a-empty>
      </a-card>

      <!-- 导出功能 -->
      <a-card size="small" title="导出高亮" :bordered="false">
        <a-space wrap>
          <a-button 
            size="small"
            @click="exportHighlights('json')"
            :disabled="highlights.length === 0"
          >
            导出JSON
          </a-button>
          <a-button 
            size="small"
            @click="exportHighlights('csv')"
            :disabled="highlights.length === 0"
          >
            导出CSV
          </a-button>
          <a-button 
            size="small"
            @click="exportHighlights('txt')"
            :disabled="highlights.length === 0"
          >
            导出文本
          </a-button>
          
          <a-upload
            :show-upload-list="false"
            accept=".json"
            :before-upload="importHighlights"
          >
            <a-button size="small">
              导入高亮
            </a-button>
          </a-upload>
        </a-space>
      </a-card>
    </a-space>

    <!-- 编辑备注模态框 -->
    <a-modal
      v-model:visible="editNoteModal.visible"
      title="编辑高亮备注"
      @ok="saveHighlightNote"
      @cancel="cancelEditNote"
    >
      <a-form layout="vertical">
        <a-form-item label="高亮文本">
          <a-typography-paragraph disabled>
            {{ editNoteModal.highlight?.text }}
          </a-typography-paragraph>
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:model-value="editNoteModal.note"
            placeholder="为这个高亮添加备注..."
            :rows="4"
            show-count
            :maxlength="500"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 颜色选择器模态框 -->
    <a-modal
      v-model:visible="colorPickerModal.visible"
      title="更改高亮颜色"
      @ok="changeHighlightColor"
      @cancel="cancelColorChange"
    >
      <a-space direction="vertical" style="width: 100%">
        <div>
          <a-typography-text>为高亮选择新颜色：</a-typography-text>
        </div>
        <a-space wrap>
          <a-button
            v-for="color in highlightColors"
            :key="color.value"
            size="large"
            :style="{ 
              backgroundColor: color.value, 
              color: color.textColor,
              border: colorPickerModal.selectedColor === color.value ? '2px solid #1890ff' : `1px solid ${color.value}`
            }"
            @click="colorPickerModal.selectedColor = color.value"
          >
            {{ color.name }}
          </a-button>
        </a-space>
      </a-space>
    </a-modal>
  </div>
</template>

<script setup>
import { h, ref, computed, watch, inject } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconHighlight,
  IconDown,
  IconEye,
  IconEdit,
  IconCopy,
  IconDelete
} from '@arco-design/web-vue/es/icon'

const props = defineProps({
  highlights: {
    type: Array,
    default: () => []
  },
  pdfViewer: Object
})

const emit = defineEmits([
  'highlight-click',
  'highlight-delete',
  'highlight-update',
  'highlights-changed'
])

// 注入上下文
const context = inject('pdfViewerContext', {})

// 响应式数据
const filterType = ref('')
const filterColor = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const hasSelectedText = ref(false)

const editNoteModal = ref({
  visible: false,
  highlight: null,
  note: ''
})

const colorPickerModal = ref({
  visible: false,
  highlight: null,
  selectedColor: ''
})

// 高亮颜色配置
const highlightColors = ref([
  { name: '黄色', value: '#ffeb3b', textColor: '#333' },
  { name: '绿色', value: '#4caf50', textColor: '#fff' },
  { name: '蓝色', value: '#2196f3', textColor: '#fff' },
  { name: '红色', value: '#f44336', textColor: '#fff' },
  { name: '紫色', value: '#9c27b0', textColor: '#fff' },
  { name: '橙色', value: '#ff9800', textColor: '#fff' }
])

// 计算属性
const filteredHighlights = computed(() => {
  let result = [...props.highlights]

  // 按类型筛选
  if (filterType.value) {
    result = result.filter(h => h.type === filterType.value)
  }

  // 按颜色筛选
  if (filterColor.value) {
    result = result.filter(h => h.color === filterColor.value)
  }

  // 按内容搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(h => 
      h.text.toLowerCase().includes(query) ||
      (h.note && h.note.toLowerCase().includes(query))
    )
  }

  // 按创建时间倒序排序
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const paginatedHighlights = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredHighlights.value.slice(start, end)
})

const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: filteredHighlights.value.length,
  size: 'small',
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 个高亮`,
  onChange: (page, size) => {
    currentPage.value = page
    pageSize.value = size
  }
}))

// 方法
function createHighlightWithColor(color) {
  if (!props.pdfViewer || !hasSelectedText.value) {
    Message.warning('请先选中要高亮的文本')
    return
  }

  try {
    // 调用PDF查看器创建高亮
    if (props.pdfViewer.createHighlight) {
      props.pdfViewer.createHighlight({
        color,
        type: 'manual',
        createdAt: new Date().toISOString()
      })
      Message.success('已创建高亮')
    }
  } catch (error) {
    console.error('创建高亮失败:', error)
    Message.error('创建高亮失败')
  }
}

function goToHighlight(highlight) {
  emit('highlight-click', highlight)
  
  // 通过上下文更新页面
  if (context.emitEvent) {
    context.emitEvent('page-changed', highlight.page)
  }
}

function handleMenuAction(action, highlight) {
  switch (action) {
    case 'goto':
      goToHighlight(highlight)
      break
    case 'edit':
      editHighlightNote(highlight)
      break
    case 'copy':
      copyHighlightText(highlight)
      break
    case 'color':
      changeHighlightColorDialog(highlight)
      break
    case 'delete':
      deleteHighlight(highlight)
      break
  }
}

function editHighlightNote(highlight) {
  editNoteModal.value = {
    visible: true,
    highlight,
    note: highlight.note || ''
  }
}

function saveHighlightNote() {
  const { highlight, note } = editNoteModal.value
  
  try {
    // 更新高亮备注
    const updatedHighlight = { ...highlight, note }
    
    if (props.pdfViewer && props.pdfViewer.updateHighlight) {
      props.pdfViewer.updateHighlight(highlight.id, { note })
    }
    
    emit('highlight-update', updatedHighlight)
    editNoteModal.value.visible = false
    Message.success('备注已更新')
    
  } catch (error) {
    console.error('更新备注失败:', error)
    Message.error('更新备注失败')
  }
}

function cancelEditNote() {
  editNoteModal.value = {
    visible: false,
    highlight: null,
    note: ''
  }
}

function changeHighlightColorDialog(highlight) {
  colorPickerModal.value = {
    visible: true,
    highlight,
    selectedColor: highlight.color
  }
}

function changeHighlightColor() {
  const { highlight, selectedColor } = colorPickerModal.value
  
  try {
    if (props.pdfViewer && props.pdfViewer.updateHighlight) {
      props.pdfViewer.updateHighlight(highlight.id, { color: selectedColor })
    }
    
    const updatedHighlight = { ...highlight, color: selectedColor }
    emit('highlight-update', updatedHighlight)
    
    colorPickerModal.value.visible = false
    Message.success('颜色已更改')
    
  } catch (error) {
    console.error('更改颜色失败:', error)
    Message.error('更改颜色失败')
  }
}

function cancelColorChange() {
  colorPickerModal.value = {
    visible: false,
    highlight: null,
    selectedColor: ''
  }
}

function copyHighlightText(highlight) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(highlight.text)
      .then(() => Message.success('已复制到剪贴板'))
      .catch(() => Message.error('复制失败'))
  } else {
    // 兼容老版本浏览器
    const textArea = document.createElement('textarea')
    textArea.value = highlight.text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    Message.success('已复制到剪贴板')
  }
}

function deleteHighlight(highlight) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个高亮吗？此操作不可撤销。',
    okText: '删除',
    okButtonProps: { status: 'danger' },
    cancelText: '取消',
    onOk() {
      try {
        if (props.pdfViewer && props.pdfViewer.removeHighlight) {
          props.pdfViewer.removeHighlight(highlight.id)
        }
        
        emit('highlight-delete', highlight)
        Message.success('高亮已删除')
        
      } catch (error) {
        console.error('删除高亮失败:', error)
        Message.error('删除高亮失败')
      }
    }
  })
}

function clearAllHighlights() {
  if (props.highlights.length === 0) return
  
  Modal.confirm({
    title: '确认清空',
    content: `确定要删除全部 ${props.highlights.length} 个高亮吗？此操作不可撤销。`,
    okText: '清空',
    okButtonProps: { status: 'danger' },
    cancelText: '取消',
    onOk() {
      try {
        props.highlights.forEach(highlight => {
          if (props.pdfViewer && props.pdfViewer.removeHighlight) {
            props.pdfViewer.removeHighlight(highlight.id)
          }
        })
        
        emit('highlights-changed', [])
        Message.success('已清空所有高亮')
        
      } catch (error) {
        console.error('清空高亮失败:', error)
        Message.error('清空高亮失败')
      }
    }
  })
}

function exportHighlights(format) {
  if (props.highlights.length === 0) {
    Message.warning('没有高亮可以导出')
    return
  }

  try {
    let content = ''
    let filename = ''
    let type = ''

    switch (format) {
      case 'json':
        content = JSON.stringify(props.highlights, null, 2)
        filename = `highlights_${Date.now()}.json`
        type = 'application/json'
        break
        
      case 'csv':
        const csvHeaders = ['页面', '文本', '颜色', '备注', '创建时间']
        const csvRows = props.highlights.map(h => [
          h.page,
          `"${h.text.replace(/"/g, '""')}"`,
          h.color,
          `"${(h.note || '').replace(/"/g, '""')}"`,
          formatDate(h.createdAt)
        ])
        content = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n')
        filename = `highlights_${Date.now()}.csv`
        type = 'text/csv'
        break
        
      case 'txt':
        content = props.highlights.map(h => 
          `第${h.page}页:\n${h.text}\n${h.note ? `备注: ${h.note}\n` : ''}创建时间: ${formatDate(h.createdAt)}\n${'-'.repeat(50)}\n`
        ).join('\n')
        filename = `highlights_${Date.now()}.txt`
        type = 'text/plain'
        break
    }

    // 创建下载链接
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    Message.success(`已导出 ${format.toUpperCase()} 文件`)
    
  } catch (error) {
    console.error('导出失败:', error)
    Message.error('导出失败')
  }
}

async function importHighlights(file) {
  try {
    const text = await file.text()
    const importedHighlights = JSON.parse(text)
    
    if (!Array.isArray(importedHighlights)) {
      throw new Error('无效的高亮数据格式')
    }
    
    // 验证高亮数据结构
    for (const highlight of importedHighlights) {
      if (!highlight.text || !highlight.page || !highlight.color) {
        throw new Error('高亮数据结构不完整')
      }
    }
    
    // 导入高亮
    for (const highlight of importedHighlights) {
      if (props.pdfViewer && props.pdfViewer.createHighlight) {
        await props.pdfViewer.createHighlight(highlight)
      }
    }
    
    emit('highlights-changed', [...props.highlights, ...importedHighlights])
    Message.success(`成功导入 ${importedHighlights.length} 个高亮`)
    
  } catch (error) {
    console.error('导入失败:', error)
    Message.error('导入失败: ' + error.message)
  }
  
  return false // 阻止默认上传行为
}

function getColorName(colorValue) {
  const colorConfig = highlightColors.value.find(c => c.value === colorValue)
  return colorConfig ? colorConfig.name : '自定义'
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// 监听文本选择状态 - 这需要与PDF查看器集成
watch(() => props.pdfViewer, (newViewer) => {
  if (newViewer) {
    // 监听文本选择事件
    if (newViewer.on) {
      newViewer.on('text-selected', (selection) => {
        hasSelectedText.value = !!selection && selection.text.length > 0
      })
      
      newViewer.on('selection-cleared', () => {
        hasSelectedText.value = false
      })
    }
  }
}, { immediate: true })
</script>

<style scoped>
.pdf-highlights-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.highlights-list {
  max-height: 500px;
}

.highlight-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 0;
}

.highlight-item:last-child {
  border-bottom: none;
}

.highlight-content {
  width: 100%;
}

.highlight-text {
  margin-bottom: 8px !important;
  transition: color 0.2s ease;
}

.highlight-text:hover {
  color: #1890ff;
}

.highlight-note {
  padding: 8px;
  background-color: #f6f8fa;
  border-left: 3px solid #1890ff;
  border-radius: 2px;
}

.highlight-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #d9d9d9;
  flex-shrink: 0;
}

/* 滚动条样式 */
.highlights-list::-webkit-scrollbar {
  width: 6px;
}

.highlights-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.highlights-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.highlights-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
