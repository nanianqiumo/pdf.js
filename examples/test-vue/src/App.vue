<template>
  <div id="app">
    <!-- 使用Ant Design的Layout组件 -->
    <a-layout style="min-height: 100vh;">
      <!-- 头部 -->
      <a-layout-header style="background: #001529; padding: 0 24px;">
        <div style="color: white; padding: 16px 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PDF.js Vue测试应用</h1>
          <p style="color: #ccc; margin: 0; font-size: 14px;">使用Vue.js测试增强版PDF查看器的完整功能</p>
        </div>
      </a-layout-header>

      <!-- 内容区域 -->
      <a-layout-content style="padding: 24px;">
        <a-row :gutter="24">
          <!-- PDF 查看器部分 -->
          <a-col :span="16">
            <a-card title="PDF 查看器" style="margin-bottom: 16px;">
              <div ref="pdfContainer" style="height: 400px; border: 1px solid #d9d9d9;">
                <!-- PDF查看器将在这里初始化 -->
                <div v-if="!isViewerLoaded" style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
                  <a-spin size="large" />
                  <p style="margin-top: 16px;">{{ loadingMessage }}</p>
                </div>
              </div>
            </a-card>
            
            <!-- 工具栏 -->
            <a-card title="查看器控件" style="margin-bottom: 16px;">
              <a-row :gutter="16">
                <!-- PDF选择器 -->
                <a-col :span="12">
                  <a-form layout="vertical">
                    <a-form-item label="选择PDF文件">
                      <a-select v-model:model-value="selectedPdf" style="width: 100%;">
                        <a-select-option value="/test/pdfs/tracemonkey.pdf">
                          示例PDF - TracemonKey
                        </a-select-option>
                        <a-select-option value="/test/pdfs/annotation-line.pdf">
                          注释演示PDF
                        </a-select-option>
                        <a-select-option value="../../build/dist/web/compressed.tracemonkey-pldi-09.pdf">
                          内置PDF
                        </a-select-option>
                        <a-select-option value="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf">
                          在线PDF
                        </a-select-option>
                        <a-select-option value="custom">自定义URL...</a-select-option>
                        <a-select-option value="upload">上传本地PDF文件...</a-select-option>
                      </a-select>
                    </a-form-item>
                    
                    <a-form-item v-if="selectedPdf === 'custom'" label="自定义PDF URL">
                      <a-input
                        v-model:model-value="customPdfUrl"
                        placeholder="输入PDF URL"
                      />
                    </a-form-item>
                    
                    <a-form-item v-if="selectedPdf === 'upload'" label="上传PDF文件">
                      <a-upload
                        :before-upload="handleFileUpload"
                        :show-upload-list="false"
                        accept=".pdf"
                      >
                        <a-button>
                          <template #icon><IconUpload /></template>
                          选择文件
                        </a-button>
                      </a-upload>
                    </a-form-item>
                    
                    <a-form-item>
                      <a-button 
                        type="primary" 
                        @click="loadPdf" 
                        :loading="isLoading"
                        style="width: 100%;"
                      >
                        {{ isLoading ? '加载中...' : '加载 PDF' }}
                      </a-button>
                    </a-form-item>
                  </a-form>
                </a-col>
                
                <!-- 配置选项 -->
                <a-col :span="12">
                  <a-form layout="vertical">
                    <a-form-item label="查看器配置">
                      <a-space direction="vertical">
                        <a-checkbox v-model:checked="options.enableDownload">
                          允许下载
                        </a-checkbox>
                        <a-checkbox v-model:checked="options.enablePrint">
                          允许打印
                        </a-checkbox>
                        <a-checkbox v-model:checked="options.debugger">
                          调试模式
                        </a-checkbox>
                      </a-space>
                    </a-form-item>
                    
                    <a-form-item label="初始页码">
                      <a-input-number
                        v-model:model-value="options.initialPage"
                        :min="1"
                        style="width: 100%;"
                      />
                    </a-form-item>
                  </a-form>
                </a-col>
              </a-row>
            </a-card>
            
            <!-- 日志输出 -->
            <a-card title="操作日志">
              <template #extra>
                <a-button size="small" @click="clearLog">清空</a-button>
              </template>
              <div ref="logContainer" style="height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px;">
                <div
                  v-for="entry in logEntries"
                  :key="entry.id"
                  :style="{ color: entry.color, marginBottom: '4px' }"
                >
                  <span style="color: #666; margin-right: 8px;">[{{ entry.time }}]</span>
                  <span>{{ entry.message }}</span>
                </div>
              </div>
            </a-card>
          </a-col>
          
          <!-- 控制面板部分 -->
          <a-col :span="8">
            <a-card>
              <a-tabs v-model:active-tab="activeTab">
                <a-tab-pane key="navigation" tab="导航">
                  <div v-if="pdfViewer" style="padding: 16px;">
                    <p>导航面板 - PDF查看器已加载</p>
                    <!-- NavigationPanel组件将在这里 -->
                  </div>
                  <div v-else style="padding: 16px; text-align: center; color: #999;">
                    请先加载PDF文档
                  </div>
                </a-tab-pane>
                
                <a-tab-pane key="search" tab="搜索">
                  <div v-if="pdfViewer" style="padding: 16px;">
                    <p>搜索面板 - PDF查看器已加载</p>
                    <!-- SearchPanel组件将在这里 -->
                  </div>
                  <div v-else style="padding: 16px; text-align: center; color: #999;">
                    请先加载PDF文档
                  </div>
                </a-tab-pane>
                
                <a-tab-pane key="highlights" tab="高亮">
                  <div v-if="pdfViewer" style="padding: 16px;">
                    <p>高亮面板 - PDF查看器已加载</p>
                    <!-- HighlightsPanel组件将在这里 -->
                  </div>
                  <div v-else style="padding: 16px; text-align: center; color: #999;">
                    请先加载PDF文档
                  </div>
                </a-tab-pane>
                
                <a-tab-pane key="info" tab="信息">
                  <div v-if="pdfViewer" style="padding: 16px;">
                    <p>信息面板 - PDF查看器已加载</p>
                    <!-- InfoPanel组件将在这里 -->
                  </div>
                  <div v-else style="padding: 16px; text-align: center; color: #999;">
                    请先加载PDF文档
                  </div>
                </a-tab-pane>
              </a-tabs>
            </a-card>
          </a-col>
        </a-row>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from "vue";
import { IconUpload } from '@arco-design/web-vue/es/icon';

// 响应式数据
const pdfContainer = ref(null);
const logContainer = ref(null);
const pdfViewer = ref(null);
const isViewerLoaded = ref(false);
const isLoading = ref(false);
const loadingMessage = ref("请选择一个PDF文件进行加载");
const selectedPdf = ref("/test/pdfs/tracemonkey.pdf");
const customPdfUrl = ref("");
const uploadedFile = ref(null);
const activeTab = ref("navigation");

const options = reactive({
  enableDownload: true,
  enablePrint: true,
  debugger: false,
  initialPage: 1,
  // viewerPath: "/build/generic/web/viewer.html", // 使用generic build目录下的viewer.html
});

const logEntries = ref([]);
let logIdCounter = 0;

// 日志相关方法
const addLog = (message, type = "info") => {
  const colors = {
    info: "#333",
    success: "#198754",
    error: "#dc3545",
    warning: "#ffc107",
  };

  const entry = {
    id: ++logIdCounter,
    time: new Date().toLocaleTimeString(),
    message,
    color: colors[type] || colors.info,
  };

  logEntries.value.push(entry);

  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

const clearLog = () => {
  logEntries.value = [];
};

// PDF相关方法
const handleFileUpload = (file) => {
  if (file && file.type === "application/pdf") {
    uploadedFile.value = file;
    addLog(`已选择文件: ${file.name}`);
  } else {
    addLog("请选择有效的PDF文件", "error");
  }
  return false; // 阻止默认上传
};

const loadPdf = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = "正在初始化PDF查看器...";

    let pdfUrl = "";

    // 确定PDF URL
    if (selectedPdf.value === "custom") {
      if (!customPdfUrl.value) {
        addLog("请输入有效的PDF URL", "error");
        isLoading.value = false;
        return;
      }
      pdfUrl = customPdfUrl.value;
    } else if (selectedPdf.value === "upload") {
      if (!uploadedFile.value) {
        addLog("请选择一个PDF文件上传", "error");
        isLoading.value = false;
        return;
      }
      pdfUrl = URL.createObjectURL(uploadedFile.value);
      addLog(`正在加载上传的文件: ${uploadedFile.value.name}`);
    } else {
      pdfUrl = selectedPdf.value;
    }

    addLog(`正在加载PDF: ${pdfUrl}`);

    try {
      // 动态导入PDF.js模块 - 使用npm包
      const { EnhancedPDFViewer, MessageType } = await import("pdfjs-editor/interface");

      // 创建配置选项
      const viewerOptions = {
        ...options,
        timeout: 15000, // 15秒超时
      };

      addLog("正在创建PDF查看器实例...");

      // 创建查看器实例
      pdfViewer.value = EnhancedPDFViewer.getInstance(
        pdfContainer.value,
        viewerOptions
      );

      // 注册事件监听器
      pdfViewer.value.on(MessageType.PDFJS_INTERFACE_READY, () => {
        addLog("PDF查看器已准备就绪", "success");
        isViewerLoaded.value = true;
        isLoading.value = false;
      });

      pdfViewer.value.on(MessageType.PAGE_CHANGED, (page) => {
        addLog(`页面已更改: ${page}`);
      });

      pdfViewer.value.on(MessageType.DOCUMENT_LOADED, (info) => {
        addLog(`文档已加载: ${info.title || "无标题"}`, "success");
      });

      pdfViewer.value.on(MessageType.HIGHLIGHT_CREATED, (highlight) => {
        addLog(`创建了高亮: ${highlight.text}`, "success");
      });

      pdfViewer.value.on(MessageType.HIGHLIGHT_REMOVED, (highlight) => {
        addLog(`移除了高亮: ID ${highlight.id}`);
      });

      // 加载PDF
      loadingMessage.value = "正在加载PDF文档...";
      await pdfViewer.value.loadPDF(pdfUrl);

      addLog("PDF加载完成", "success");
    } catch (importError) {
      addLog(`无法加载PDF.js模块: ${importError.message}`, "error");
      console.error("模块导入错误:", importError);
      
      // 尝试使用iframe方式作为后备
      addLog("尝试使用iframe方式加载PDF...", "warning");
      const iframe = document.createElement('iframe');
      iframe.src = `/build/generic/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      
      pdfContainer.value.innerHTML = '';
      pdfContainer.value.appendChild(iframe);
      
      isViewerLoaded.value = true;
      isLoading.value = false;
      addLog("已使用iframe方式加载PDF", "success");
    }

  } catch (error) {
    addLog(`加载PDF失败: ${error.message}`, "error");
    console.error("PDF加载错误:", error);
    isLoading.value = false;
    isViewerLoaded.value = false;
  }
};

// 生命周期
onMounted(() => {
  addLog("Vue应用已启动", "success");
  addLog("准备加载PDF.js模块...");

  // 自动加载默认PDF
  setTimeout(() => {
    loadPdf();
  }, 1000);
});

onUnmounted(() => {
  // 清理资源
  if (pdfViewer.value && pdfViewer.value.destroy) {
    pdfViewer.value.destroy();
  }

  // 清理上传的文件URL
  if (uploadedFile.value) {
    URL.revokeObjectURL(uploadedFile.value);
  }
});
</script>
