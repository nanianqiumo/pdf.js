# 增强版 PDF.js 查看器

这个项目提供了一个增强版的 PDF.js 查看器封装，简化了 PDF 查看器的集成与使用流程。通过高级抽象，用户无需直接接触 PDF.js 的内部 API，只需使用简单的接口即可实现全功能 PDF 查看。

## 功能特点

- **简化的 API** - 无需直接与 PDF.js API 交互
- **自动创建 iframe** - 不再需要手动添加 iframe 标签
- **配置灵活** - 通过选项参数控制查看器行为
- **事件系统** - 内置事件转发，方便监听各种操作
- **增强功能** - 添加了常用操作的便捷方法
- **跨域支持** - 自动处理跨域问题

## 快速开始

### 基本用法

```html
<div id="pdf-container" style="width: 100%; height: 600px;"></div>

<script type="module">
  import { EnhancedPDFViewer } from "../../web/interface/enhanced_viewer.js";
  
  document.addEventListener("DOMContentLoaded", () => {
    // 创建查看器
    const pdfViewer = new EnhancedPDFViewer("pdf-container", {
      enableDownload: true,
      enablePrint: true
    });
    
    // 加载PDF文件
    pdfViewer.loadPDF("path/to/your/document.pdf")
      .then(() => {
        console.log("PDF加载成功");
      })
      .catch(error => {
        console.error("PDF加载失败:", error);
      });
      
    // 注册事件监听
    pdfViewer.on("ready", () => {
      console.log("PDF查看器已准备就绪");
    });
    
    pdfViewer.on("pdfjs.pageChanged", page => {
      console.log(`当前页面: ${page}`);
    });
  });
</script>
```

### 完整示例

参考 `examples/enhanced-viewer-demo/index.html` 获取完整的使用示例，包括：
- 页面导航
- 缩放控制
- 文本搜索与高亮
- 文档信息获取
- 事件监听与处理
- 高亮管理等

## API 文档

### 构造函数

```javascript
/**
 * 创建一个新的增强版PDF查看器
 * @param {HTMLElement|string} container - 容器元素或其ID
 * @param {Object} options - 配置选项
 */
const pdfViewer = new EnhancedPDFViewer(container, options);
```

### 选项参数

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | String | '100%' | iframe 的宽度 |
| `height` | String | '100%' | iframe 的高度 |
| `style` | String | 'border: none;' | iframe 的样式 |
| `enableDownload` | Boolean | true | 是否允许下载PDF |
| `enablePrint` | Boolean | true | 是否允许打印PDF |
| `enableAnnotations` | Boolean | true | 是否允许注释功能 |
| `enableTextSelection` | Boolean | true | 是否允许文本选择 |
| `viewerPath` | String | '../../web/viewer.html' | PDF.js 查看器HTML路径 |
| `enableXfa` | Boolean | true | 是否启用XFA支持 |
| `disableRange` | Boolean | true | 是否禁用范围请求 |
| `postMessageTransfers` | Boolean | true | 是否使用postMessage传输 |
| `debugger` | Boolean | false | 是否启用调试模式 |
| `initialPage` | Number | undefined | 初始页码 |
| `initialZoom` | String/Number | undefined | 初始缩放级别 |
| `locale` | String | undefined | 本地化语言 |

### 方法

#### 基础功能

- `loadPDF(pdfUrl)` - 加载PDF文件
- `reload()` - 重新加载当前PDF
- `destroy()` - 销毁查看器，清理资源

#### 导航控制

- `getCurrentPage()` - 获取当前页码
- `getPageCount()` - 获取总页数
- `goToPage(pageNumber)` - 跳转到指定页面
- `nextPage()` - 下一页
- `prevPage()` - 上一页

#### 缩放与旋转

- `setZoom(scale)` - 设置缩放级别
- `zoomIn()` - 放大
- `zoomOut()` - 缩小
- `rotatePages(rotation)` - 旋转页面
- `rotateCW()` - 顺时针旋转
- `rotateCCW()` - 逆时针旋转

#### 搜索与高亮

- `findText(text, options)` - 搜索文本
- `highlightText(text, options)` - 高亮文本
- `clearHighlight()` - 清除高亮
- `getHighlights()` - 获取所有高亮
- `clearHighlightById(id)` - 清除指定高亮
- `clearAllHighlights()` - 清除所有高亮

#### 注释功能

- `getAnnotations(pageNumber)` - 获取注释
- `addAnnotation(annotation)` - 添加注释
- `updateAnnotation(annotation)` - 更新注释
- `deleteAnnotation(annotationId)` - 删除注释

#### 文档信息

- `getDocumentInfo()` - 获取文档信息
- `getDocumentOutline()` - 获取文档大纲

#### 其他功能

- `downloadPdf()` - 下载PDF
- `printPdf()` - 打印PDF

### 事件

使用 `on()` 方法注册事件监听器：

```javascript
pdfViewer.on("pdfjs.highlightCreated", highlight => {
  console.log("创建了高亮:", highlight);
});
```

主要事件类型：

- `ready` - 查看器准备就绪
- `pdfjs.documentLoaded` - 文档加载完成
- `pdfjs.pageChanged` - 页面变更
- `pdfjs.pageRendered` - 页面渲染完成
- `pdfjs.highlightCreated` - 创建高亮
- `pdfjs.highlightRemoved` - 删除高亮
- `pdfjs.annotationAdded` - 添加注释
- `pdfjs.annotationUpdated` - 更新注释
- `pdfjs.annotationDeleted` - 删除注释

## 跨域支持

增强版查看器默认启用了以下参数以支持跨域PDF：

- `enableXfa: true`
- `disableRange: true`
- `postMessageTransfers: true`

这些参数有助于解决从不同域加载PDF时可能出现的问题。

## 浏览器兼容性

支持所有现代浏览器：
- Chrome
- Firefox
- Safari
- Edge (Chromium)

## 许可证

与 PDF.js 相同，本项目使用 Apache License 2.0 许可证。
