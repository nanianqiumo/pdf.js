<template>
  <div class="card border-top-0 rounded-top-0">
    <div class="card-body">
      <div class="mb-3">
        <label class="form-label">页面导航</label>
        <div class="input-group mb-3">
          <button @click="goToFirstPage" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-chevron-bar-left"></i>
          </button>
          <button @click="goToPrevPage" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-chevron-left"></i>
          </button>
          <input 
            type="text" 
            v-model="currentPage" 
            @keyup.enter="goToPage"
            @blur="goToPage"
            class="form-control text-center">
          <span class="input-group-text">/ {{ totalPages }}</span>
          <button @click="goToNextPage" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-chevron-right"></i>
          </button>
          <button @click="goToLastPage" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-chevron-bar-right"></i>
          </button>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">缩放控制</label>
        <div class="d-flex align-items-center">
          <button @click="zoomOut" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-dash-lg"></i>
          </button>
          <select v-model="selectedZoom" @change="setZoom" class="form-select mx-2">
            <option value="auto">自动</option>
            <option value="page-fit">适合页面</option>
            <option value="page-width">适合宽度</option>
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
          </select>
          <button @click="zoomIn" class="btn btn-outline-secondary" type="button">
            <i class="bi bi-plus-lg"></i>
          </button>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">旋转与操作</label>
        <div class="d-grid gap-2">
          <div class="btn-group" role="group">
            <button @click="rotateCCW" class="btn btn-outline-secondary" type="button">
              <i class="bi bi-arrow-counterclockwise"></i> 左转
            </button>
            <button @click="rotateCW" class="btn btn-outline-secondary" type="button">
              <i class="bi bi-arrow-clockwise"></i> 右转
            </button>
          </div>
          <div class="btn-group" role="group">
            <button @click="downloadPdf" class="btn btn-outline-primary" type="button">
              <i class="bi bi-download"></i> 下载
            </button>
            <button @click="printPdf" class="btn btn-outline-primary" type="button">
              <i class="bi bi-printer"></i> 打印
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'

export default {
  name: 'NavigationPanel',
  props: {
    pdfViewer: {
      type: Object,
      default: null
    }
  },
  emits: ['log', 'page-updated'],
  setup(props, { emit }) {
    const currentPage = ref(1)
    const totalPages = ref(1)
    const selectedZoom = ref('1')
    
    // 更新页面显示
    const updatePageDisplay = async () => {
      if (!props.pdfViewer) return
      
      try {
        const [current, total] = await Promise.all([
          props.pdfViewer.getCurrentPage(),
          props.pdfViewer.getPageCount()
        ])
        
        currentPage.value = current
        totalPages.value = total
        emit('page-updated', { current, total })
      } catch (error) {
        emit('log', `获取页码信息失败: ${error.message}`, 'error')
      }
    }
    
    // 页面导航方法
    const goToFirstPage = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.goToPage(1)
        emit('log', '已跳转到第一页')
        updatePageDisplay()
      } catch (error) {
        emit('log', `导航失败: ${error.message}`, 'error')
      }
    }
    
    const goToLastPage = async () => {
      if (!props.pdfViewer) return
      
      try {
        const pageCount = await props.pdfViewer.getPageCount()
        await props.pdfViewer.goToPage(pageCount)
        emit('log', '已跳转到最后一页')
        updatePageDisplay()
      } catch (error) {
        emit('log', `导航失败: ${error.message}`, 'error')
      }
    }
    
    const goToPrevPage = async () => {
      if (!props.pdfViewer) return
      
      try {
        const result = await props.pdfViewer.prevPage()
        if (result.success) {
          emit('log', '已跳转到上一页')
          updatePageDisplay()
        } else {
          emit('log', result.message)
        }
      } catch (error) {
        emit('log', `导航失败: ${error.message}`, 'error')
      }
    }
    
    const goToNextPage = async () => {
      if (!props.pdfViewer) return
      
      try {
        const result = await props.pdfViewer.nextPage()
        if (result.success) {
          emit('log', '已跳转到下一页')
          updatePageDisplay()
        } else {
          emit('log', result.message)
        }
      } catch (error) {
        emit('log', `导航失败: ${error.message}`, 'error')
      }
    }
    
    const goToPage = async () => {
      if (!props.pdfViewer) return
      
      const pageNumber = parseInt(currentPage.value)
      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages.value) {
        emit('log', '请输入有效的页码', 'error')
        updatePageDisplay() // 重置显示
        return
      }
      
      try {
        await props.pdfViewer.goToPage(pageNumber)
        emit('log', `已跳转到第${pageNumber}页`)
        updatePageDisplay()
      } catch (error) {
        emit('log', `导航失败: ${error.message}`, 'error')
        updatePageDisplay()
      }
    }
    
    // 缩放控制
    const setZoom = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.setZoom(selectedZoom.value)
        emit('log', `已设置缩放: ${selectedZoom.value}`)
      } catch (error) {
        emit('log', `设置缩放失败: ${error.message}`, 'error')
      }
    }
    
    const zoomIn = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.zoomIn()
        emit('log', '已放大')
      } catch (error) {
        emit('log', `放大失败: ${error.message}`, 'error')
      }
    }
    
    const zoomOut = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.zoomOut()
        emit('log', '已缩小')
      } catch (error) {
        emit('log', `缩小失败: ${error.message}`, 'error')
      }
    }
    
    // 旋转控制
    const rotateCW = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.rotateCW()
        emit('log', '已顺时针旋转90度')
      } catch (error) {
        emit('log', `旋转失败: ${error.message}`, 'error')
      }
    }
    
    const rotateCCW = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.rotateCCW()
        emit('log', '已逆时针旋转90度')
      } catch (error) {
        emit('log', `旋转失败: ${error.message}`, 'error')
      }
    }
    
    // 下载和打印
    const downloadPdf = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.downloadPdf()
        emit('log', '已触发下载')
      } catch (error) {
        emit('log', `下载失败: ${error.message}`, 'error')
      }
    }
    
    const printPdf = async () => {
      if (!props.pdfViewer) return
      
      try {
        await props.pdfViewer.printPdf()
        emit('log', '已触发打印')
      } catch (error) {
        emit('log', `打印失败: ${error.message}`, 'error')
      }
    }
    
    // 监听pdfViewer变化
    watch(() => props.pdfViewer, (newViewer) => {
      if (newViewer) {
        // PDF查看器就绪后更新页面显示
        setTimeout(updatePageDisplay, 500)
      }
    })
    
    return {
      currentPage,
      totalPages,
      selectedZoom,
      goToFirstPage,
      goToLastPage,
      goToPrevPage,
      goToNextPage,
      goToPage,
      setZoom,
      zoomIn,
      zoomOut,
      rotateCW,
      rotateCCW,
      downloadPdf,
      printPdf,
      updatePageDisplay
    }
  }
}
</script>
