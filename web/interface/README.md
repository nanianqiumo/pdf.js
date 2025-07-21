# PDF.js 接口与集成指南

这个指南将帮助你在应用中集成 PDF.js 查看器并使用通信接口控制查看器行为。通过这个接口，你可以从父页面控制 PDF.js 查看器、响应各种事件以及获取 PDF 文档数据。

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [核心组件](#核心组件)
  - [EnhancedPDFViewer](#enhancedpdfviewer)
  - [PDFJSInterface](#pdfjsinterface)
  - [MessageType](#messagetype)
  - [EventEmitter](#eventemitter)
- [API 参考](#api-参考)
  - [EnhancedPDFViewer API](#enhancedpdfviewer-api)
  - [PDFJSInterface API](#pdfjsinterface-api)
  - [消息类型参考](#消息类型参考)
  - [事件系统](#事件系统)
- [集成方案](#集成方案)
  - [基本 HTML 集成](#基本-html-集成)
  - [React 集成](#react-集成)
  - [Vue 集成](#vue-集成)
  - [自定义配置](#自定义配置)
- [高级功能](#高级功能)
  - [文档操作](#文档操作)
  - [注释管理](#注释管理)
  - [文本搜索和高亮](#文本搜索和高亮)
  - [视图控制](#视图控制)
- [构建与开发](#构建与开发)
  - [构建自定义版本](#构建自定义版本)
  - [测试集成](#测试集成)
- [故障排除](#故障排除)
- [许可证](#许可证)

## 安装

```bash
# 通过 npm 安装
npm install pdfjs-dist

# 或者直接使用本地构建
./build-integrated-dist.sh
```

## 快速开始

### 方式一：使用 EnhancedPDFViewer（推荐）

```javascript
import { EnhancedPDFViewer } from './web/interface/enhanced_viewer.js';

// 创建增强型查看器实例
const viewer = new EnhancedPDFViewer('pdf-container', {
  width: '100%',
  height: '800px',
  enableDownload: true,
  enablePrint: true
});

// 加载 PDF 文件
viewer.loadPDF('path/to/your/document.pdf').then(() => {
  console.log('PDF 加载完成');
  
  // 使用高级 API
  viewer.goToPage(5);
  viewer.highlightText('重要内容', { color: '#FFFF00' });
}).catch(error => {
  console.error('PDF 加载失败:', error);
});

// 监听事件
viewer.on('PAGE_CHANGED', (page) => {
  console.log('页面切换到:', page);
});
```

### 方式二：使用 PDFJSInterface（低级接口）

```javascript
import { PDFJSInterface } from './web/interface/pdf_js_interface.js';

// 创建 iframe
const iframe = document.createElement('iframe');
iframe.src = './web/viewer.html?file=path/to/your/document.pdf';
document.getElementById('pdf-container').appendChild(iframe);

// 创建通信接口
const pdfInterface = PDFJSInterface.getInstance(iframe);

// 等待加载完成
pdfInterface.ready().then(() => {
  console.log('PDF 查看器准备就绪');
  
  // 使用底层 API
  pdfInterface.goToPage(5);
  pdfInterface.setTextHighlight('重要内容', { color: '#FFFF00' });
});
```

## 核心组件

### EnhancedPDFViewer

`EnhancedPDFViewer` 是高级封装类，提供了最简单易用的 API 来集成 PDF.js 查看器。

**特点：**
- 🎯 简化的 API，无需手动管理 iframe
- 🔄 自动处理查看器初始化和通信
- 🎨 支持丰富的配置选项
- 📡 完整的事件系统
- 🔧 单例模式，避免重复创建
- 💾 自动资源清理

**核心方法：**
```javascript
// 单例模式获取实例
const viewer = EnhancedPDFViewer.getInstance('container', options);

// 加载 PDF
viewer.loadPDF(url);

// 页面导航
viewer.goToPage(5);
viewer.nextPage();
viewer.prevPage();

// 视图控制
viewer.setZoom(1.5);
viewer.zoomIn();
viewer.zoomOut();
viewer.rotateCW();
viewer.rotateCCW();

// 文本操作
viewer.highlightText('文本', { color: '#FFFF00' });
viewer.findText('搜索词', { direction: 'forward' });
viewer.clearTextHighlight();

// 高亮管理
viewer.getHighlights();
viewer.clearAllHighlights();
viewer.clearHighlightById('highlight-id');

// 文档信息
viewer.getDocumentInfo();
viewer.getDocumentOutline();
viewer.getAllText();
viewer.getPageText(1);

// 文件操作
viewer.downloadPdf();
viewer.printPdf();
```

### PDFJSInterface

`PDFJSInterface` 是底层通信接口，处理与 PDF.js 查看器的直接通信。

**特点：**
- 🔌 直接的 postMessage 通信
- ⚡ 高性能的消息传递
- 🔄 自动重连机制
- ⏱️ 请求超时处理
- 🎯 单例模式管理
- 🛡️ 错误处理和恢复

**通信流程：**
```
父页面 → PDFJSInterface → PostMessage → PDF.js查看器
父页面 ← PDFJSInterface ← PostMessage ← PDF.js查看器
```

### MessageType

`MessageType` 枚举定义了所有的通信消息类型，确保类型安全和一致性。

**消息分类：**

```javascript
import { MessageType } from './web/interface/message_type.js';

// 系统控制消息
MessageType.PDFJS_INTERFACE_READY  // PDF.js 查看器准备就绪
MessageType.CHECK_READY            // 检查就绪状态
MessageType.PING                   // 连接测试

// 文档信息和导航
MessageType.GET_DOCUMENT_INFO      // 获取文档信息
MessageType.GET_DOCUMENT_OUTLINE   // 获取文档大纲
MessageType.GET_CURRENT_PAGE       // 获取当前页码
MessageType.GET_PAGE_COUNT         // 获取总页数
MessageType.GO_TO_PAGE             // 跳转到指定页面
MessageType.NAVIGATE_TO            // 导航到指定位置

// 文本操作
MessageType.GET_TEXT               // 获取所有文本
MessageType.GET_PAGE_TEXT          // 获取指定页面文本
MessageType.FIND_TEXT              // 查找文本
MessageType.SET_TEXT_HIGHLIGHT     // 设置文本高亮
MessageType.CLEAR_TEXT_HIGHLIGHT   // 清除文本高亮

// 高亮管理
MessageType.GET_HIGHLIGHTS         // 获取所有高亮
MessageType.CLEAR_HIGHLIGHTS       // 清除所有高亮
MessageType.CLEAR_HIGHLIGHT        // 清除指定高亮

// 注释操作
MessageType.GET_ANNOTATIONS        // 获取注释
MessageType.ADD_ANNOTATION         // 添加注释
MessageType.UPDATE_ANNOTATION      // 更新注释
MessageType.DELETE_ANNOTATION      // 删除注释

// 视图操作
MessageType.SET_ZOOM               // 设置缩放
MessageType.ROTATE_PAGES           // 旋转页面

// 文件操作
MessageType.DOWNLOAD_PDF           // 下载 PDF
MessageType.PRINT_PDF              // 打印 PDF

// 事件通知（PDF.js → 父页面）
MessageType.HIGHLIGHT_CREATED      // 高亮已创建
MessageType.HIGHLIGHT_REMOVED      // 高亮已移除
MessageType.PAGE_RENDERED          // 页面已渲染
MessageType.PAGE_CHANGED           // 页面已切换
MessageType.ANNOTATION_ADDED       // 注释已添加
MessageType.ANNOTATION_UPDATED     // 注释已更新
MessageType.ANNOTATION_DELETED     // 注释已删除
```

### EventEmitter

`EventEmitter` 是事件系统的基础类，提供了完整的事件处理机制。

**功能：**
- 📡 事件注册和移除
- 🔥 事件触发机制
- 🛡️ 错误处理
- 🧹 自动资源清理

```javascript
// 注册事件监听器
viewer.on('PAGE_CHANGED', (page) => {
  console.log('页面切换:', page);
});

// 移除事件监听器
viewer.off('PAGE_CHANGED', callback);

// 移除所有监听器
viewer.off('PAGE_CHANGED');
```

## API 参考

### EnhancedPDFViewer API

#### 构造函数选项

```javascript
const options = {
  // iframe 属性
  width: '100%',                    // 宽度
  height: '100%',                   // 高度
  style: 'border: none;',           // 样式
  allowfullscreen: true,            // 允许全屏
  
  // 查看器参数
  enableDownload: true,             // 启用下载
  enablePrint: true,                // 启用打印
  enableAnnotations: true,          // 启用注释
  enableTextSelection: true,        // 启用文本选择
  
  // 高级选项
  viewerPath: '../../web/viewer.html',  // 查看器路径
  enableXfa: true,                  // 启用 XFA 支持
  disableRange: true,               // 禁用范围请求
  postMessageTransfers: true,       // 启用消息传输
  debugger: false,                  // 调试模式
  
  // 初始设置
  initialPage: 1,                   // 初始页码
  initialZoom: 'page-fit',          // 初始缩放
  locale: 'zh-CN',                  // 语言设置
  timeout: 10000                    // 加载超时时间
};
```

#### 静态方法

```javascript
// 获取或创建实例（单例模式）
EnhancedPDFViewer.getInstance(container, options)
```

#### 实例方法

##### 基本操作
```javascript
// 加载 PDF
loadPDF(pdfUrl: string): Promise<void>

// 重新加载当前 PDF
reload(): Promise<void>

// 更新配置选项
updateOptions(newOptions: Object): EnhancedPDFViewer

// 获取当前配置
getOptions(): Object

// 销毁查看器
destroy(removeFromSingleton?: boolean): void
```

##### 导航操作
```javascript
// 获取当前页码
getCurrentPage(): Promise<number>

// 获取总页数
getPageCount(): Promise<number>

// 跳转到指定页面
goToPage(pageNumber: number): Promise<Object>

// 下一页
nextPage(): Promise<Object>

// 上一页
prevPage(): Promise<Object>

// 导航到指定位置
navigateTo(dest: Object|string|Array): Promise<Object>
```

##### 视图控制
```javascript
// 设置缩放
setZoom(scale: string|number): Promise<Object>

// 放大
zoomIn(): Promise<Object>

// 缩小
zoomOut(): Promise<Object>

// 旋转页面
rotatePages(rotation: number): Promise<Object>

// 顺时针旋转
rotateCW(): Promise<Object>

// 逆时针旋转
rotateCCW(): Promise<Object>
```

##### 文本操作
```javascript
// 查找文本
findText(text: string, options?: Object): Promise<Object>

// 获取所有文本
getAllText(): Promise<Array>

// 获取指定页面文本
getPageText(page: number): Promise<Object>

// 设置文本高亮
highlightText(text: string, options?: Object): Promise<Object>

// 清除文本高亮
clearTextHighlight(): Promise<Object>
```

##### 高亮管理
```javascript
// 获取所有高亮
getHighlights(): Promise<Array>

// 清除所有高亮
clearAllHighlights(): Promise<Object>

// 清除指定 ID 的高亮
clearHighlightById(id: string): Promise<Object>
```

##### 注释操作
```javascript
// 获取注释
getAnnotations(pageNumber: number): Promise<Array>

// 添加注释
addAnnotation(annotation: Object): Promise<Object>

// 更新注释
updateAnnotation(annotation: Object): Promise<Object>

// 删除注释
deleteAnnotation(annotationId: string): Promise<Object>
```

##### 文档信息
```javascript
// 获取文档信息
getDocumentInfo(): Promise<Object>

// 获取文档大纲
getDocumentOutline(): Promise<Array>
```

##### 文件操作
```javascript
// 下载 PDF
downloadPdf(): Promise<Object>

// 打印 PDF
printPdf(): Promise<Object>
```

##### 接口访问
```javascript
// 获取 iframe 元素
getIframe(): HTMLIFrameElement

// 获取底层通信接口
getInterface(): PDFJSInterface

// 获取增强接口（自动处理 ready 状态）
getEnhancedInterface(): Proxy<PDFJSInterface>
```

### PDFJSInterface API

#### 静态方法

```javascript
// 获取或创建实例（单例模式）
PDFJSInterface.getInstance(iframe: HTMLIFrameElement|string): PDFJSInterface
```

#### 实例方法

##### 连接管理
```javascript
// 等待查看器准备就绪
ready(timeout?: number): Promise<void>

// 检测连接状态
ping(): Promise<Object>

// 手动重新连接
reconnect(): Promise<boolean>

// 兼容方法（等同于 ready）
onViewerReady(): Promise<void>
```

##### 基本操作
```javascript
// 获取当前页码
getCurrentPage(): Promise<number>

// 获取总页数
getPageCount(): Promise<number>

// 跳转到指定页面
goToPage(pageNumber: number): Promise<Object>

// 设置缩放
setZoom(scale: string|number): Promise<Object>

// 旋转页面
rotatePages(rotation: number): Promise<Object>
```

##### 文本和搜索
```javascript
// 获取所有页面文本
getAllText(): Promise<Array>

// 获取指定页面文本
getPageText(page: number): Promise<Object>

// 查找文本
findText(text: string, options?: Object): Promise<Object>

// 设置文本高亮
setTextHighlight(text: string, options?: Object): Promise<Object>

// 清除文本高亮
clearTextHighlight(): Promise<Object>
```

##### 高亮管理
```javascript
// 获取所有高亮
getHighlights(): Promise<Array>

// 清除所有高亮
clearHighlights(): Promise<Object>

// 清除指定高亮
clearHighlight(id: string): Promise<Object>
```

##### 注释操作
```javascript
// 获取注释
getAnnotations(pageNumber: number): Promise<Array>

// 添加注释
addAnnotation(annotation: Object): Promise<Object>

// 更新注释
updateAnnotation(annotation: Object): Promise<Object>

// 删除注释
deleteAnnotation(annotationId: string): Promise<Object>
```

##### 文档操作
```javascript
// 获取文档信息
getDocumentInfo(): Promise<Object>

// 获取文档大纲
getDocumentOutline(): Promise<Array>

// 导航到指定位置
navigateTo(dest: Object|string|Array): Promise<Object>

// 下载 PDF
downloadPdf(): Promise<Object>

// 打印 PDF
printPdf(): Promise<Object>
```

##### 资源管理
```javascript
// 重置接口状态
reset(): void

// 销毁接口实例
destroy(removeFromSingleton?: boolean): void
```

### 消息类型参考

所有的消息类型都定义在 `MessageType` 枚举中，按功能分类：

#### 系统控制类

| 消息类型 | 描述 | 方向 |
|---------|------|------|
| `PDFJS_INTERFACE_READY` | PDF.js 查看器准备就绪 | PDF.js → 父页面 |
| `CHECK_READY` | 检查准备状态 | 父页面 → PDF.js |
| `PING` | 连接测试 | 双向 |

#### 文档信息类

| 消息类型 | 描述 | 参数 |
|---------|------|------|
| `GET_DOCUMENT_INFO` | 获取文档信息 | 无 |
| `GET_DOCUMENT_OUTLINE` | 获取文档大纲 | 无 |
| `GET_CURRENT_PAGE` | 获取当前页码 | 无 |
| `GET_PAGE_COUNT` | 获取总页数 | 无 |

#### 导航控制类

| 消息类型 | 描述 | 参数 |
|---------|------|------|
| `GO_TO_PAGE` | 跳转到指定页面 | `{ pageNumber: number }` |
| `NAVIGATE_TO` | 导航到指定位置 | `{ dest: Object\|string\|Array }` |

#### 文本操作类

| 消息类型 | 描述 | 参数 |
|---------|------|------|
| `GET_TEXT` | 获取所有文本 | 无 |
| `GET_PAGE_TEXT` | 获取页面文本 | `{ page: number }` |
| `FIND_TEXT` | 查找文本 | `{ text: string, options: Object }` |
| `SET_TEXT_HIGHLIGHT` | 设置文本高亮 | `{ text: string, options: Object }` |
| `CLEAR_TEXT_HIGHLIGHT` | 清除文本高亮 | 无 |

#### 高亮管理类

| 消息类型 | 描述 | 参数 |
|---------|------|------|
| `GET_HIGHLIGHTS` | 获取所有高亮 | 无 |
| `CLEAR_HIGHLIGHTS` | 清除所有高亮 | 无 |
| `CLEAR_HIGHLIGHT` | 清除指定高亮 | `{ id: string }` |

#### 注释操作类

| 消息类型 | 描述 | 参数 |
|---------|------|------|
| `GET_ANNOTATIONS` | 获取注释 | `{ pageNumber: number }` |
| `ADD_ANNOTATION` | 添加注释 | `{ annotation: Object }` |
| `UPDATE_ANNOTATION` | 更新注释 | `{ annotation: Object }` |
| `DELETE_ANNOTATION` | 删除注释 | `{ annotationId: string }` |

#### 视图控制类

| 消息类型 | 描述 | 参数 |
|---------|------|------|
| `SET_ZOOM` | 设置缩放 | `{ scale: string\|number }` |
| `ROTATE_PAGES` | 旋转页面 | `{ rotation: number }` |

#### 文件操作类

| 消息类型 | 描述 | 参数 |
|---------|------|------|
| `DOWNLOAD_PDF` | 下载 PDF | 无 |
| `PRINT_PDF` | 打印 PDF | 无 |

#### 事件通知类

这些事件由 PDF.js 查看器主动发送给父页面：

| 事件类型 | 描述 | 数据 |
|---------|------|------|
| `HIGHLIGHT_CREATED` | 高亮已创建 | `{ id, text, page, color }` |
| `HIGHLIGHT_REMOVED` | 高亮已移除 | `{ id }` |
| `PAGE_RENDERED` | 页面已渲染 | `{ pageNumber }` |
| `PAGE_CHANGED` | 页面已切换 | `{ pageNumber }` |
| `ANNOTATION_ADDED` | 注释已添加 | `{ annotation }` |
| `ANNOTATION_UPDATED` | 注释已更新 | `{ annotation }` |
| `ANNOTATION_DELETED` | 注释已删除 | `{ annotationId }` |

### 事件系统

#### EnhancedPDFViewer 事件

EnhancedPDFViewer 会自动转发所有来自 PDF.js 的事件：

```javascript
viewer.on('PAGE_CHANGED', (pageNumber) => {
  console.log('当前页面:', pageNumber);
});

viewer.on('HIGHLIGHT_CREATED', (highlight) => {
  console.log('创建了高亮:', highlight);
});

viewer.on('ANNOTATION_ADDED', (annotation) => {
  console.log('添加了注释:', annotation);
});

viewer.on('PDFJS_INTERFACE_READY', () => {
  console.log('PDF.js 查看器已准备就绪');
});
```

#### PDFJSInterface 事件

PDFJSInterface 提供了相同的事件系统：

```javascript
pdfInterface.on('PAGE_CHANGED', (pageNumber) => {
  console.log('页面切换到:', pageNumber);
});
```

#### 事件处理最佳实践

```javascript
// 1. 使用一次性监听器（适用于初始化）
viewer.on('PDFJS_INTERFACE_READY', function readyHandler() {
  console.log('PDF 已准备就绪');
  viewer.off('PDFJS_INTERFACE_READY', readyHandler); // 手动移除
});

// 2. 批量移除事件监听器
viewer.off('PAGE_CHANGED'); // 移除所有 PAGE_CHANGED 监听器

// 3. 在组件销毁时清理事件
// React 示例
useEffect(() => {
  const handlePageChange = (page) => console.log('页面:', page);
  viewer.on('PAGE_CHANGED', handlePageChange);
  
  return () => {
    viewer.off('PAGE_CHANGED', handlePageChange);
  };
}, []);
```

## 集成方案

### 基本 HTML 集成

#### 使用 EnhancedPDFViewer（推荐）

```html
<!DOCTYPE html>
<html>
<head>
  <title>PDF 查看器集成示例</title>
  <style>
    #pdf-container {
      width: 100%;
      height: 800px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    
    .controls {
      margin: 10px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .controls button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .controls button:hover {
      background: #e9e9e9;
    }
    
    .controls input {
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="controls">
    <input type="file" id="pdf-file" accept=".pdf" style="display: none;">
    <button onclick="document.getElementById('pdf-file').click()">选择 PDF 文件</button>
    <button id="prev-page">上一页</button>
    <button id="next-page">下一页</button>
    <input type="number" id="page-input" min="1" placeholder="页码" style="width: 80px;">
    <button id="go-to-page">跳转</button>
    <input type="text" id="search-text" placeholder="搜索文本">
    <button id="highlight-text">高亮文本</button>
    <button id="clear-highlight">清除高亮</button>
    <button id="zoom-in">放大</button>
    <button id="zoom-out">缩小</button>
    <button id="rotate-cw">顺时针旋转</button>
    <button id="download">下载</button>
    <button id="print">打印</button>
  </div>
  
  <div id="pdf-container"></div>
  
  <div class="info-panel" style="margin-top: 10px; padding: 10px; background: #f9f9f9;">
    <h3>文档信息</h3>
    <div id="doc-info"></div>
  </div>

  <script type="module">
    import { EnhancedPDFViewer, MessageType } from './web/interface/enhanced_viewer.js';
    
    let viewer = null;
    
    // 创建增强型 PDF 查看器
    function createViewer(pdfUrl) {
      viewer = EnhancedPDFViewer.getInstance('pdf-container', {
        width: '100%',
        height: '100%',
        enableDownload: true,
        enablePrint: true,
        debugger: false
      });
      
      // 注册事件监听器
      viewer.on(MessageType.PDFJS_INTERFACE_READY, () => {
        console.log('PDF 查看器已准备就绪');
        updateDocumentInfo();
      });
      
      viewer.on(MessageType.PAGE_CHANGED, (page) => {
        console.log('页面切换到:', page);
        document.getElementById('page-input').value = page;
      });
      
      viewer.on(MessageType.HIGHLIGHT_CREATED, (highlight) => {
        console.log('创建了高亮:', highlight);
      });
      
      // 加载 PDF
      return viewer.loadPDF(pdfUrl);
    }
    
    // 更新文档信息
    async function updateDocumentInfo() {
      if (!viewer) return;
      
      try {
        const info = await viewer.getDocumentInfo();
        const pageCount = await viewer.getPageCount();
        
        document.getElementById('doc-info').innerHTML = `
          <p><strong>标题:</strong> ${info.title || '无'}</p>
          <p><strong>作者:</strong> ${info.author || '无'}</p>
          <p><strong>页数:</strong> ${pageCount}</p>
          <p><strong>创建时间:</strong> ${info.creationDate || '无'}</p>
        `;
        
        // 设置页码输入框的最大值
        document.getElementById('page-input').max = pageCount;
      } catch (error) {
        console.error('获取文档信息失败:', error);
      }
    }
    
    // 文件选择处理
    document.getElementById('pdf-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        createViewer(url).catch(error => {
          console.error('加载 PDF 失败:', error);
          alert('加载 PDF 失败: ' + error.message);
        });
      }
    });
    
    // 页面导航控制
    document.getElementById('prev-page').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        const result = await viewer.prevPage();
        if (!result.success) {
          alert(result.message);
        }
      } catch (error) {
        console.error('上一页失败:', error);
      }
    });
    
    document.getElementById('next-page').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        const result = await viewer.nextPage();
        if (!result.success) {
          alert(result.message);
        }
      } catch (error) {
        console.error('下一页失败:', error);
      }
    });
    
    document.getElementById('go-to-page').addEventListener('click', async () => {
      if (!viewer) return;
      const pageNumber = parseInt(document.getElementById('page-input').value);
      if (isNaN(pageNumber) || pageNumber < 1) {
        alert('请输入有效的页码');
        return;
      }
      
      try {
        await viewer.goToPage(pageNumber);
      } catch (error) {
        console.error('跳转页面失败:', error);
      }
    });
    
    // 文本搜索和高亮
    document.getElementById('highlight-text').addEventListener('click', async () => {
      if (!viewer) return;
      const text = document.getElementById('search-text').value;
      if (!text) {
        alert('请输入要高亮的文本');
        return;
      }
      
      try {
        await viewer.highlightText(text, { color: '#FFFF00' });
        console.log('文本已高亮:', text);
      } catch (error) {
        console.error('高亮文本失败:', error);
      }
    });
    
    document.getElementById('clear-highlight').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        await viewer.clearTextHighlight();
        console.log('已清除文本高亮');
      } catch (error) {
        console.error('清除高亮失败:', error);
      }
    });
    
    // 视图控制
    document.getElementById('zoom-in').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        await viewer.zoomIn();
      } catch (error) {
        console.error('放大失败:', error);
      }
    });
    
    document.getElementById('zoom-out').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        await viewer.zoomOut();
      } catch (error) {
        console.error('缩小失败:', error);
      }
    });
    
    document.getElementById('rotate-cw').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        await viewer.rotateCW();
      } catch (error) {
        console.error('旋转失败:', error);
      }
    });
    
    // 文件操作
    document.getElementById('download').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        await viewer.downloadPdf();
      } catch (error) {
        console.error('下载失败:', error);
      }
    });
    
    document.getElementById('print').addEventListener('click', async () => {
      if (!viewer) return;
      try {
        await viewer.printPdf();
      } catch (error) {
        console.error('打印失败:', error);
      }
    });
    
    // 回车键支持
    document.getElementById('page-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('go-to-page').click();
      }
    });
    
    document.getElementById('search-text').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('highlight-text').click();
      }
    });
    
    // 默认加载示例 PDF
    createViewer('./test/pdfs/tracemonkey.pdf').catch(error => {
      console.log('默认 PDF 加载失败，请手动选择文件');
    });
  </script>
</body>
</html>
```

#### 使用 PDFJSInterface（低级接口）

```html
<!DOCTYPE html>
<html>
<head>
  <title>PDFJSInterface 集成示例</title>
</head>
<body>
  <div id="pdf-container" style="width: 100%; height: 800px; border: 1px solid #ccc;">
    <iframe 
      id="pdf-viewer" 
      src="./web/viewer.html" 
      width="100%" 
      height="100%" 
      style="border: none;">
    </iframe>
  </div>

  <div class="controls">
    <button id="load-pdf">加载示例 PDF</button>
    <button id="prev-page">上一页</button>
    <button id="next-page">下一页</button>
    <input type="text" id="search-text" placeholder="搜索文本">
    <button id="highlight-text">高亮文本</button>
    <button id="clear-highlight">清除高亮</button>
  </div>

  <script type="module">
    import { PDFJSInterface, MessageType } from './web/interface/pdf_js_interface.js';
    
    // 获取 iframe 引用
    const iframe = document.getElementById('pdf-viewer');
    
    // 创建接口实例（使用单例模式）
    const pdfInterface = PDFJSInterface.getInstance(iframe);
    
    // 注册事件监听器
    pdfInterface.on(MessageType.PAGE_CHANGED, (page) => {
      console.log('页面切换到:', page);
    });
    
    pdfInterface.on(MessageType.HIGHLIGHT_CREATED, (highlight) => {
      console.log('创建了高亮:', highlight);
    });
    
    // 加载 PDF 文件
    async function loadPdf(url) {
      // 更新 iframe 的 src
      iframe.src = `./web/viewer.html?file=${encodeURIComponent(url)}`;
      
      // 等待查看器准备就绪
      try {
        await pdfInterface.ready();
        console.log('PDF 查看器已准备就绪');
      } catch (error) {
        console.error('PDF 加载超时:', error);
      }
    }
    
    // 事件处理器
    document.getElementById('load-pdf').addEventListener('click', () => {
      loadPdf('./test/pdfs/tracemonkey.pdf');
    });
    
    document.getElementById('prev-page').addEventListener('click', async () => {
      try {
        const currentPage = await pdfInterface.getCurrentPage();
        if (currentPage > 1) {
          await pdfInterface.goToPage(currentPage - 1);
        }
      } catch (error) {
        console.error('导航失败:', error);
      }
    });
    
    document.getElementById('next-page').addEventListener('click', async () => {
      try {
        const currentPage = await pdfInterface.getCurrentPage();
        const pageCount = await pdfInterface.getPageCount();
        if (currentPage < pageCount) {
          await pdfInterface.goToPage(currentPage + 1);
        }
      } catch (error) {
        console.error('导航失败:', error);
      }
    });
    
    document.getElementById('highlight-text').addEventListener('click', async () => {
      const text = document.getElementById('search-text').value;
      if (!text) return;
      
      try {
        await pdfInterface.setTextHighlight(text, { color: '#FFFF00' });
      } catch (error) {
        console.error('高亮失败:', error);
      }
    });
    
    document.getElementById('clear-highlight').addEventListener('click', async () => {
      try {
        await pdfInterface.clearTextHighlight();
      } catch (error) {
        console.error('清除高亮失败:', error);
      }
    });
  </script>
</body>
</html>
```

### React 集成

#### 使用 React Hook

```jsx
// hooks/usePDFViewer.js
import { useEffect, useRef, useState } from 'react';
import { EnhancedPDFViewer, MessageType } from '../web/interface/enhanced_viewer.js';

export function usePDFViewer(containerId, options = {}) {
  const viewerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 创建查看器实例
    try {
      viewerRef.current = EnhancedPDFViewer.getInstance(containerId, options);
      
      // 注册事件监听器
      const viewer = viewerRef.current;
      
      const handleReady = () => {
        setIsReady(true);
        setError(null);
        
        // 获取页面信息
        viewer.getPageCount().then(count => {
          setPageCount(count);
        });
      };
      
      const handlePageChanged = (page) => {
        setCurrentPage(page);
      };
      
      const handleError = (error) => {
        setError(error);
        setIsReady(false);
      };
      
      viewer.on(MessageType.PDFJS_INTERFACE_READY, handleReady);
      viewer.on(MessageType.PAGE_CHANGED, handlePageChanged);
      
      return () => {
        // 清理事件监听器
        viewer.off(MessageType.PDFJS_INTERFACE_READY, handleReady);
        viewer.off(MessageType.PAGE_CHANGED, handlePageChanged);
        
        // 如果需要完全销毁查看器，取消注释下面的代码
        // viewer.destroy();
      };
    } catch (error) {
      setError(error);
    }
  }, [containerId, options]);

  const loadPDF = async (url) => {
    if (!viewerRef.current) return;
    
    try {
      setError(null);
      setIsReady(false);
      await viewerRef.current.loadPDF(url);
    } catch (error) {
      setError(error);
    }
  };

  return {
    viewer: viewerRef.current,
    isReady,
    currentPage,
    pageCount,
    error,
    loadPDF
  };
}
```

#### React 组件示例

```jsx
// components/PDFViewer.jsx
import React, { useState, useRef } from 'react';
import { usePDFViewer } from '../hooks/usePDFViewer';

function PDFViewer({ pdfUrl, onPageChange, onError }) {
  const containerRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  const [isHighlighting, setIsHighlighting] = useState(false);
  
  const { viewer, isReady, currentPage, pageCount, error, loadPDF } = usePDFViewer(
    containerRef.current,
    {
      width: '100%',
      height: '100%',
      enableDownload: true,
      enablePrint: true
    }
  );

  // 监听页面变化
  React.useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  // 监听错误
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // 加载 PDF
  React.useEffect(() => {
    if (pdfUrl) {
      loadPDF(pdfUrl);
    }
  }, [pdfUrl, loadPDF]);

  // 页面导航
  const goToPrevPage = async () => {
    if (!viewer || !isReady) return;
    try {
      await viewer.prevPage();
    } catch (error) {
      console.error('导航失败:', error);
    }
  };

  const goToNextPage = async () => {
    if (!viewer || !isReady) return;
    try {
      await viewer.nextPage();
    } catch (error) {
      console.error('导航失败:', error);
    }
  };

  // 文本高亮
  const highlightText = async () => {
    if (!viewer || !isReady || !searchText) return;
    
    setIsHighlighting(true);
    try {
      await viewer.highlightText(searchText, { color: '#FFFF00' });
    } catch (error) {
      console.error('高亮失败:', error);
    } finally {
      setIsHighlighting(false);
    }
  };

  // 清除高亮
  const clearHighlight = async () => {
    if (!viewer || !isReady) return;
    try {
      await viewer.clearTextHighlight();
    } catch (error) {
      console.error('清除高亮失败:', error);
    }
  };

  return (
    <div className="pdf-viewer">
      {/* 控制栏 */}
      <div className="controls">
        <button onClick={goToPrevPage} disabled={!isReady || currentPage <= 1}>
          上一页
        </button>
        <span>{isReady ? `${currentPage} / ${pageCount}` : '加载中...'}</span>
        <button onClick={goToNextPage} disabled={!isReady || currentPage >= pageCount}>
          下一页
        </button>
        
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="搜索文本"
          disabled={!isReady}
        />
        <button 
          onClick={highlightText} 
          disabled={!isReady || !searchText || isHighlighting}
        >
          {isHighlighting ? '高亮中...' : '高亮文本'}
        </button>
        <button onClick={clearHighlight} disabled={!isReady}>
          清除高亮
        </button>
      </div>

      {/* PDF 查看器容器 */}
      <div 
        ref={containerRef}
        className="pdf-container"
        style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
      >
        {!isReady && !error && (
          <div className="loading">
            <p>正在加载 PDF...</p>
          </div>
        )}
        
        {error && (
          <div className="error">
            <p>加载失败: {error.message}</p>
            <button onClick={() => pdfUrl && loadPDF(pdfUrl)}>
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFViewer;
```

#### 在 React 应用中使用

```jsx
// App.jsx
import React, { useState } from 'react';
import PDFViewer from './components/PDFViewer';

function App() {
  const [pdfUrl, setPdfUrl] = useState('./test/pdfs/tracemonkey.pdf');
  const [currentPage, setCurrentPage] = useState(1);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    console.log('当前页面:', page);
  };

  const handleError = (error) => {
    console.error('PDF 查看器错误:', error);
    alert('PDF 加载失败: ' + error.message);
  };

  return (
    <div className="App">
      <h1>PDF 查看器应用</h1>
      
      <div className="file-controls">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
        <span>当前页面: {currentPage}</span>
      </div>

      <PDFViewer
        pdfUrl={pdfUrl}
        onPageChange={handlePageChange}
        onError={handleError}
      />
    </div>
  );
}

export default App;
```

### Vue 集成

#### Vue 3 组合式 API

```vue
<!-- components/PDFViewer.vue -->
<template>
  <div class="pdf-viewer">
    <!-- 控制栏 -->
    <div class="controls">
      <button @click="goToPrevPage" :disabled="!isReady || currentPage <= 1">
        上一页
      </button>
      <span>{{ isReady ? `${currentPage} / ${pageCount}` : '加载中...' }}</span>
      <button @click="goToNextPage" :disabled="!isReady || currentPage >= pageCount">
        下一页
      </button>
      
      <input
        v-model="searchText"
        @keypress.enter="highlightText"
        placeholder="搜索文本"
        :disabled="!isReady"
      />
      <button 
        @click="highlightText" 
        :disabled="!isReady || !searchText || isHighlighting"
      >
        {{ isHighlighting ? '高亮中...' : '高亮文本' }}
      </button>
      <button @click="clearHighlight" :disabled="!isReady">
        清除高亮
      </button>
      
      <button @click="zoomIn" :disabled="!isReady">放大</button>
      <button @click="zoomOut" :disabled="!isReady">缩小</button>
      <button @click="rotateCW" :disabled="!isReady">旋转</button>
    </div>

    <!-- PDF 查看器容器 -->
    <div 
      ref="pdfContainer"
      class="pdf-container"
      :class="{ 'loading': !isReady && !error }"
    >
      <div v-if="!isReady && !error" class="loading-indicator">
        <p>正在加载 PDF...</p>
      </div>
      
      <div v-if="error" class="error-indicator">
        <p>加载失败: {{ error.message }}</p>
        <button @click="retryLoad">重试</button>
      </div>
    </div>

    <!-- 文档信息面板 -->
    <div v-if="documentInfo" class="document-info">
      <h3>文档信息</h3>
      <p><strong>标题:</strong> {{ documentInfo.title || '无' }}</p>
      <p><strong>作者:</strong> {{ documentInfo.author || '无' }}</p>
      <p><strong>页数:</strong> {{ pageCount }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { EnhancedPDFViewer, MessageType } from '../web/interface/enhanced_viewer.js';

// Props
const props = defineProps({
  pdfUrl: {
    type: String,
    required: true
  },
  options: {
    type: Object,
    default: () => ({
      width: '100%',
      height: '100%',
      enableDownload: true,
      enablePrint: true
    })
  }
});

// Emits
const emit = defineEmits(['page-change', 'error', 'ready', 'highlight-created']);

// 响应式数据
const pdfContainer = ref(null);
const viewer = ref(null);
const isReady = ref(false);
const currentPage = ref(1);
const pageCount = ref(0);
const error = ref(null);
const searchText = ref('');
const isHighlighting = ref(false);
const documentInfo = ref(null);

// 生命周期
onMounted(() => {
  initViewer();
});

onUnmounted(() => {
  if (viewer.value) {
    // 清理事件监听器
    viewer.value.off(MessageType.PDFJS_INTERFACE_READY);
    viewer.value.off(MessageType.PAGE_CHANGED);
    viewer.value.off(MessageType.HIGHLIGHT_CREATED);
    // 如果需要完全销毁查看器，取消注释下面的代码
    // viewer.value.destroy();
  }
});

// 监听 pdfUrl 变化
watch(() => props.pdfUrl, (newUrl) => {
  if (newUrl && viewer.value) {
    loadPDF(newUrl);
  }
});

// 初始化查看器
const initViewer = async () => {
  await nextTick(); // 确保 DOM 已挂载
  
  try {
    viewer.value = EnhancedPDFViewer.getInstance(pdfContainer.value, props.options);
    
    // 注册事件监听器
    viewer.value.on(MessageType.PDFJS_INTERFACE_READY, handleReady);
    viewer.value.on(MessageType.PAGE_CHANGED, handlePageChanged);
    viewer.value.on(MessageType.HIGHLIGHT_CREATED, handleHighlightCreated);
    
    // 如果有初始 URL，加载它
    if (props.pdfUrl) {
      await loadPDF(props.pdfUrl);
    }
  } catch (err) {
    error.value = err;
    emit('error', err);
  }
};

// 加载 PDF
const loadPDF = async (url) => {
  if (!viewer.value) return;
  
  try {
    error.value = null;
    isReady.value = false;
    await viewer.value.loadPDF(url);
  } catch (err) {
    error.value = err;
    emit('error', err);
  }
};

// 事件处理器
const handleReady = async () => {
  isReady.value = true;
  emit('ready');
  
  try {
    // 获取页面信息
    pageCount.value = await viewer.value.getPageCount();
    currentPage.value = await viewer.value.getCurrentPage();
    
    // 获取文档信息
    documentInfo.value = await viewer.value.getDocumentInfo();
  } catch (err) {
    console.error('获取文档信息失败:', err);
  }
};

const handlePageChanged = (page) => {
  currentPage.value = page;
  emit('page-change', page);
};

const handleHighlightCreated = (highlight) => {
  emit('highlight-created', highlight);
};

// 页面导航
const goToPrevPage = async () => {
  if (!viewer.value || !isReady.value) return;
  try {
    await viewer.value.prevPage();
  } catch (err) {
    console.error('导航失败:', err);
  }
};

const goToNextPage = async () => {
  if (!viewer.value || !isReady.value) return;
  try {
    await viewer.value.nextPage();
  } catch (err) {
    console.error('导航失败:', err);
  }
};

// 文本高亮
const highlightText = async () => {
  if (!viewer.value || !isReady.value || !searchText.value) return;
  
  isHighlighting.value = true;
  try {
    await viewer.value.highlightText(searchText.value, { color: '#FFFF00' });
  } catch (err) {
    console.error('高亮失败:', err);
  } finally {
    isHighlighting.value = false;
  }
};

const clearHighlight = async () => {
  if (!viewer.value || !isReady.value) return;
  try {
    await viewer.value.clearTextHighlight();
  } catch (err) {
    console.error('清除高亮失败:', err);
  }
};

// 视图控制
const zoomIn = async () => {
  if (!viewer.value || !isReady.value) return;
  try {
    await viewer.value.zoomIn();
  } catch (err) {
    console.error('放大失败:', err);
  }
};

const zoomOut = async () => {
  if (!viewer.value || !isReady.value) return;
  try {
    await viewer.value.zoomOut();
  } catch (err) {
    console.error('缩小失败:', err);
  }
};

const rotateCW = async () => {
  if (!viewer.value || !isReady.value) return;
  try {
    await viewer.value.rotateCW();
  } catch (err) {
    console.error('旋转失败:', err);
  }
};

// 重试加载
const retryLoad = () => {
  if (props.pdfUrl) {
    loadPDF(props.pdfUrl);
  }
};
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
  flex-wrap: wrap;
}

.controls button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.controls button:hover:not(:disabled) {
  background: #e9e9e9;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controls input {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.pdf-container {
  width: 100%;
  height: 600px;
  border: 1px solid #ccc;
  border-radius: 4px;
  position: relative;
}

.loading-indicator,
.error-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.error-indicator {
  color: #dc3545;
}

.error-indicator button {
  margin-top: 10px;
  padding: 8px 16px;
  border: 1px solid #dc3545;
  background: white;
  color: #dc3545;
  border-radius: 4px;
  cursor: pointer;
}

.error-indicator button:hover {
  background: #dc3545;
  color: white;
}

.document-info {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
}

.document-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.document-info p {
  margin: 5px 0;
  color: #666;
}
</style>
```

#### 在 Vue 应用中使用

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <h1>Vue PDF 查看器应用</h1>
    
    <div class="file-controls">
      <input
        type="file"
        accept=".pdf"
        @change="handleFileChange"
      />
      <span v-if="currentPage">当前页面: {{ currentPage }}</span>
    </div>

    <PDFViewer
      :pdf-url="pdfUrl"
      :options="viewerOptions"
      @page-change="handlePageChange"
      @error="handleError"
      @ready="handleReady"
      @highlight-created="handleHighlightCreated"
    />
    
    <!-- 消息提示 -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PDFViewer from './components/PDFViewer.vue';

// 响应式数据
const pdfUrl = ref('./test/pdfs/tracemonkey.pdf');
const currentPage = ref(1);
const message = ref('');
const messageType = ref('info');

const viewerOptions = {
  width: '100%',
  height: '100%',
  enableDownload: true,
  enablePrint: true,
  debugger: false
};

// 事件处理器
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    const url = URL.createObjectURL(file);
    pdfUrl.value = url;
    showMessage(`已选择文件: ${file.name}`, 'success');
  } else {
    showMessage('请选择有效的 PDF 文件', 'error');
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  console.log('页面切换到:', page);
};

const handleError = (error) => {
  console.error('PDF 查看器错误:', error);
  showMessage(`错误: ${error.message}`, 'error');
};

const handleReady = () => {
  console.log('PDF 查看器已准备就绪');
  showMessage('PDF 加载成功', 'success');
};

const handleHighlightCreated = (highlight) => {
  console.log('创建了高亮:', highlight);
  showMessage(`已高亮文本: "${highlight.text}"`, 'info');
};

// 消息提示
const showMessage = (msg, type = 'info') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
};
</script>

<style>
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.file-controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  z-index: 1000;
}

.message.info {
  background-color: #17a2b8;
}

.message.success {
  background-color: #28a745;
}

.message.error {
  background-color: #dc3545;
}
</style>
```

### 自定义配置

#### URL 参数配置

你可以通过 URL 参数自定义 PDF 查看器的行为：

```javascript
// 构建查看器 URL，包含自定义设置
const buildViewerUrl = (pdfUrl, options = {}) => {
  const viewerUrl = new URL('./web/viewer.html', window.location.origin);
  
  // 基本参数
  if (pdfUrl) {
    viewerUrl.searchParams.set('file', encodeURIComponent(pdfUrl));
  }
  
  // 功能控制
  if (options.enableDownload === false) {
    viewerUrl.searchParams.set('download', 'false');
  }
  
  if (options.enablePrint === false) {
    viewerUrl.searchParams.set('print', 'false');
  }
  
  // 视图设置
  if (options.initialPage) {
    viewerUrl.searchParams.set('page', options.initialPage);
  }
  
  if (options.initialZoom) {
    viewerUrl.searchParams.set('zoom', options.initialZoom);
  }
  
  // 消息处理器控制
  if (options.enableMessageHandler !== undefined) {
    viewerUrl.searchParams.set('enableMessageHandler', options.enableMessageHandler);
  }
  
  if (options.messageOriginWhitelist) {
    viewerUrl.searchParams.set('messageOriginWhitelist', options.messageOriginWhitelist);
  }
  
  // 语言设置
  if (options.locale) {
    viewerUrl.searchParams.set('locale', options.locale);
  }
  
  return viewerUrl.toString();
};

// 使用示例
const viewerUrl = buildViewerUrl('document.pdf', {
  enableDownload: false,    // 禁用下载
  enablePrint: false,       // 禁用打印
  initialPage: 5,           // 初始页面
  initialZoom: 'page-fit',  // 初始缩放
  locale: 'zh-CN',          // 中文界面
  enableMessageHandler: true, // 启用消息处理器
});

document.getElementById('pdf-viewer').src = viewerUrl;
```

#### EnhancedPDFViewer 选项

```javascript
const options = {
  // iframe 基本属性
  width: '100%',                    // iframe 宽度
  height: '100%',                   // iframe 高度
  style: 'border: none;',           // iframe 样式
  allowfullscreen: true,            // 允许全屏
  id: 'custom-pdf-viewer',          // 自定义 iframe ID
  
  // 查看器路径和功能
  viewerPath: '../../web/viewer.html',  // 查看器路径
  enableDownload: true,             // 启用下载功能
  enablePrint: true,                // 启用打印功能
  enableAnnotations: true,          // 启用注释功能
  enableTextSelection: true,        // 启用文本选择
  
  // 初始设置
  initialPage: 1,                   // 初始页码
  initialZoom: 'page-fit',          // 初始缩放
  locale: 'zh-CN',                  // 界面语言
  
  // 高级选项
  enableXfa: true,                  // 启用 XFA 表单支持
  disableRange: true,               // 禁用范围请求
  postMessageTransfers: true,       // 启用消息传输优化
  debugger: false,                  // 启用调试模式
  
  // 性能和超时
  timeout: 10000,                   // 加载超时时间（毫秒）
};

const viewer = new EnhancedPDFViewer('container', options);
```

#### 主题和样式定制

```css
/* 自定义 PDF 查看器容器样式 */
.pdf-viewer-container {
  width: 100%;
  height: 800px;
  border: 2px solid #007bff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 加载状态样式 */
.pdf-viewer-container.loading {
  background: 
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  animation: loading-animation 1s linear infinite;
}

@keyframes loading-animation {
  0% { background-position: 0 0, 0 10px, 10px -10px, -10px 0px; }
  100% { background-position: 20px 20px, 20px 30px, 30px 10px, 10px 20px; }
}

/* 控制按钮样式 */
.pdf-controls {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px 8px 0 0;
}

.pdf-controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pdf-controls button:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.pdf-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pdf-controls input {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.pdf-controls input:focus {
  outline: none;
  background: white;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.5);
}
```

## 构建与开发

### 构建自定义版本

项目中提供了`build-integrated-dist.sh`脚本，可以快速构建一个包含PDF查看器和通信接口的集成版本：

```bash
# 克隆仓库（如果你还没有）
git clone https://github.com/yourusername/pdf.js.git
cd pdf.js

# 运行构建脚本
./build-integrated-dist.sh
```

该脚本会执行以下操作：
1. 安装必要的依赖
2. 构建完整的PDF.js查看器
3. 将通信接口集成到构建中
4. 在`build/dist`目录创建一个可发布的包

### 测试集成

项目提供了两个完整的演示页面来测试不同层级的接口功能：

#### 增强版查看器演示

演示页面：`examples/enhanced-viewer-demo/index.html`

这个演示页面展示了如何使用 `EnhancedPDFViewer` 高级接口：

```bash
# 构建项目
./build-integrated-dist.sh

# 在浏览器中打开演示页面
firefox examples/enhanced-viewer-demo/index.html
```

**功能特点：**
- 🚀 **简化集成** - 使用最少的代码实现 PDF 查看功能
- 🎮 **交互友好** - 提供直观的控制面板和操作界面
- 📊 **实时反馈** - 显示实时状态、页面信息和操作日志
- 🎨 **美观界面** - 采用 Bootstrap 响应式设计
- 🔧 **功能全面** - 涵盖所有核心功能：页面导航、文本搜索、高亮管理、缩放旋转等

**测试步骤：**
1. 从下拉列表选择示例 PDF 或输入自定义 URL
2. 点击"加载 PDF"按钮
3. 使用控制面板测试各种功能：
   - **基本操作**：页面导航、跳转到指定页面
   - **视图控制**：缩放、旋转、全屏模式
   - **文本功能**：搜索文本、创建高亮、清除高亮
   - **文档信息**：查看 PDF 元数据、页数等信息
   - **文件操作**：下载、打印功能
4. 观察右侧的事件日志和状态面板

#### 底层接口演示

演示页面：`examples/interface-demo/index.html`

这个演示页面展示了如何使用 `PDFJSInterface` 底层通信接口：

```bash
# 构建项目
./build-integrated-dist.sh

# 在浏览器中打开演示页面
firefox examples/interface-demo/index.html
```

**功能特点：**
- 🔌 **底层控制** - 直接访问 PDF.js 的核心通信接口
- 🛠️ **高级定制** - 适合需要精细控制的场景
- 📡 **消息通信** - 展示完整的 postMessage 通信流程
- 🎯 **API 测试** - 测试所有可用的消息类型和参数

**测试步骤：**
1. 输入 PDF 文件的 URL 或使用示例文件
2. 点击"加载"按钮启动查看器
3. 使用各个选项卡测试不同类别的功能：
   - **导航控制**：页面跳转、获取页面信息
   - **文本操作**：搜索、高亮、获取文本内容
   - **注释管理**：添加、更新、删除注释
   - **视图控制**：缩放、旋转设置
   - **文档信息**：获取元数据、大纲结构
4. 观察控制台输出和实际效果

#### 演示对比

| 特性 | EnhancedPDFViewer | PDFJSInterface |
|------|------------------|----------------|
| **使用难度** | 简单易用 | 需要一定技术基础 |
| **代码量** | 最少 | 较多 |
| **自动化程度** | 高度自动化 | 手动控制 |
| **适用场景** | 快速集成、标准需求 | 高度定制、特殊需求 |
| **iframe管理** | 自动管理 | 手动创建和管理 |
| **事件处理** | 自动转发 | 手动注册 |
| **错误处理** | 内置处理 | 需要手动处理 |

选择适合你项目需求的演示页面进行测试和参考。

## 故障排除

### 跨域问题

如果你遇到跨域问题：

1. 确保你的服务器配置了正确的CORS头部
2. PDF文件必须可以被你的用户访问（同源或设置了正确的CORS头部）

### viewer.html不加载

检查路径是否正确，确保web目录中的所有文件都已正确复制到你的发布目录。

### 通信接口没有响应

确保PDF查看器和父页面之间没有跨域限制，以及确保使用了`onViewerReady()`来等待查看器初始化完成。

## 许可证

Apache License 2.0
