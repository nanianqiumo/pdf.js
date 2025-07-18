# PDF.js接口与集成指南

这个指南将帮助你在应用中集成PDF.js查看器并使用通信接口控制查看器行为。通过这个接口，你可以从父页面控制PDF.js查看器、响应各种事件以及获取PDF文档数据。

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [API参考](#api参考)
  - [构造函数](#构造函数)
  - [方法](#方法)
  - [事件](#事件)
- [集成方案](#集成方案)
  - [基本HTML集成](#基本html集成)
  - [React集成](#react集成)
  - [Vue集成](#vue集成)
  - [自定义配置](#自定义配置)
- [构建与开发](#构建与开发)
  - [构建自定义版本](#构建自定义版本)
  - [测试集成](#测试集成)
- [故障排除](#故障排除)
- [许可证](#许可证)

## 安装

```bash
# 安装发布的npm包
npm install your-name-pdfjs-dist
```

## 快速开始

### 1. 嵌入PDF查看器

在你的HTML中添加一个iframe元素：

```html
<iframe 
  id="pdf-viewer" 
  src="./node_modules/your-name-pdfjs-dist/web/viewer.html?file=URL_TO_YOUR_PDF" 
  width="100%" 
  height="700px">
</iframe>
```

### 2. 使用通信接口控制PDF查看器

```javascript
import { PDFJSInterface } from 'your-name-pdfjs-dist/interface';

// 获取iframe引用
const iframe = document.getElementById('pdf-viewer');

// 创建通信接口实例
const pdfInterface = new PDFJSInterface(iframe);

// 等待PDF查看器加载完成
pdfInterface.onViewerReady().then(() => {
  console.log('PDF查看器已准备就绪');
  
  // 跳转到特定页面
  pdfInterface.goToPage(3);
  
  // 设置文本高亮
  pdfInterface.setTextHighlight('关键词', { color: '#FFFF00' });
});
```

## API参考

### 构造函数

```javascript
/**
 * 创建一个新的PDFJSInterface实例
 * @param {HTMLIFrameElement} iframe - 包含PDF.js查看器的iframe元素
 * @param {Object} options - 可选配置选项
 */
const interface = new PDFJSInterface(iframe, options);
```

### 方法

| 方法 | 描述 |
|------|------|
| `onViewerReady()` | 返回一个Promise，当查看器加载完成时解析 |
| `getCurrentPage()` | 获取当前页码 |
| `goToPage(pageNumber)` | 跳转到指定页码 |
| `setTextHighlight(text, options)` | 高亮文本 |
| `clearTextHighlight()` | 清除所有高亮 |
| `getDocumentOutline()` | 获取文档大纲 |
| `getAnnotations(pageNumber)` | 获取特定页面的注释 |
| `addAnnotation(annotation)` | 添加注释 |
| `deleteAnnotation(annotationId)` | 删除注释 |
| `updateAnnotation(annotation)` | 更新注释 |
| `downloadPdf()` | 触发PDF下载 |
| `printPdf()` | 触发PDF打印 |
| `setScale(scale)` | 设置查看器缩放级别 |

### 事件

你可以注册以下事件的监听器：

```javascript
// 当添加注释时触发
pdfInterface.onAnnotationAdded((annotation) => {
  console.log('添加了新的注释:', annotation);
});

// 当更新注释时触发
pdfInterface.onAnnotationUpdated((annotation) => {
  console.log('更新了注释:', annotation);
});

// 当删除注释时触发
pdfInterface.onAnnotationDeleted((annotationId) => {
  console.log('删除了注释:', annotationId);
});

// 当页面改变时触发
pdfInterface.onPageChanged((pageNumber) => {
  console.log('当前页面:', pageNumber);
});

// 当文档加载完成时触发
pdfInterface.onDocumentLoaded((metadata) => {
  console.log('文档已加载:', metadata);
});
```

## 集成方案

### 基本HTML集成

```html
<!DOCTYPE html>
<html>
<head>
  <title>PDF查看器集成示例</title>
  <style>
    #pdf-container {
      width: 100%;
      height: 800px;
      border: 1px solid #ccc;
    }
  </style>
</head>
<body>
  <!-- PDF查看器容器 -->
  <div id="pdf-container">
    <iframe 
      id="pdf-viewer" 
      src="./node_modules/your-name-pdfjs-dist/web/viewer.html" 
      width="100%" 
      height="100%" 
      style="border: none;">
    </iframe>
  </div>

  <div class="controls">
    <button id="prev-page">上一页</button>
    <button id="next-page">下一页</button>
    <input type="text" id="search-text" placeholder="搜索文本">
    <button id="highlight-text">高亮文本</button>
    <button id="clear-highlight">清除高亮</button>
  </div>

  <script type="module">
    import { PDFJSInterface } from './node_modules/your-name-pdfjs-dist/interface/pdf_js_interface.js';
    
    // 获取iframe引用
    const iframe = document.getElementById('pdf-viewer');
    
    // 创建接口实例
    const pdfInterface = new PDFJSInterface(iframe);
    
    // 加载PDF文件
    function loadPdf(url) {
      iframe.src = `./node_modules/your-name-pdfjs-dist/web/viewer.html?file=${encodeURIComponent(url)}`;
      
      // 等待查看器准备就绪
      pdfInterface.onViewerReady().then(() => {
        console.log('PDF查看器已准备就绪');
      });
    }
    
    // 初始加载PDF
    loadPdf('https://example.com/sample.pdf');
    
    // 页面导航
    document.getElementById('prev-page').addEventListener('click', () => {
      pdfInterface.getCurrentPage().then(page => {
        if (page > 1) pdfInterface.goToPage(page - 1);
      });
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
      pdfInterface.getCurrentPage().then(page => {
        pdfInterface.goToPage(page + 1);
      });
    });
    
    // 文本高亮
    document.getElementById('highlight-text').addEventListener('click', () => {
      const text = document.getElementById('search-text').value;
      pdfInterface.setTextHighlight(text, { color: '#FFFF00' });
    });
    
    document.getElementById('clear-highlight').addEventListener('click', () => {
      pdfInterface.clearTextHighlight();
    });
  </script>
</body>
</html>
```

### React集成

```jsx
import React, { useEffect, useRef } from 'react';
import { PDFJSInterface } from 'your-name-pdfjs-dist/interface';

function PDFViewer({ pdfUrl }) {
  const iframeRef = useRef(null);
  const interfaceRef = useRef(null);
  
  useEffect(() => {
    if (iframeRef.current) {
      // 构建查看器URL
      const viewerUrl = new URL('./node_modules/your-name-pdfjs-dist/web/viewer.html', window.location.origin);
      viewerUrl.searchParams.set('file', encodeURIComponent(pdfUrl));
      iframeRef.current.src = viewerUrl.toString();
      
      // 创建通信接口
      interfaceRef.current = new PDFJSInterface(iframeRef.current);
      
      // 等待查看器准备就绪
      interfaceRef.current.onViewerReady().then(() => {
        console.log('PDF查看器已准备就绪');
      });
    }
    
    return () => {
      // 清理代码
      interfaceRef.current = null;
    };
  }, [pdfUrl]);
  
  const goToPrevPage = () => {
    if (interfaceRef.current) {
      interfaceRef.current.getCurrentPage().then(page => {
        if (page > 1) interfaceRef.current.goToPage(page - 1);
      });
    }
  };
  
  const goToNextPage = () => {
    if (interfaceRef.current) {
      interfaceRef.current.getCurrentPage().then(page => {
        interfaceRef.current.goToPage(page + 1);
      });
    }
  };
  
  return (
    <div className="pdf-container">
      <div className="controls">
        <button onClick={goToPrevPage}>上一页</button>
        <button onClick={goToNextPage}>下一页</button>
      </div>
      
      <iframe
        ref={iframeRef}
        style={{ width: '100%', height: '800px', border: 'none' }}
        title="PDF查看器"
      />
    </div>
  );
}

export default PDFViewer;
```

### Vue集成

```vue
<template>
  <div class="pdf-container">
    <div class="controls">
      <button @click="goToPrevPage">上一页</button>
      <button @click="goToNextPage">下一页</button>
      <input v-model="searchText" placeholder="搜索文本" />
      <button @click="highlightText">高亮文本</button>
      <button @click="clearHighlight">清除高亮</button>
    </div>
    
    <iframe
      ref="pdfViewer"
      :src="viewerUrl"
      style="width: 100%; height: 800px; border: none;"
      title="PDF查看器"
    />
  </div>
</template>

<script>
import { PDFJSInterface } from 'your-name-pdfjs-dist/interface';

export default {
  name: 'PDFViewer',
  
  props: {
    pdfUrl: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      pdfInterface: null,
      searchText: '',
      viewerUrl: ''
    };
  },
  
  watch: {
    pdfUrl: {
      immediate: true,
      handler(newUrl) {
        this.updateViewerUrl(newUrl);
      }
    }
  },
  
  methods: {
    updateViewerUrl(url) {
      const viewerUrl = new URL('./node_modules/your-name-pdfjs-dist/web/viewer.html', window.location.origin);
      viewerUrl.searchParams.set('file', encodeURIComponent(url));
      this.viewerUrl = viewerUrl.toString();
      
      // 在下一个 tick 初始化接口，确保 iframe 已加载
      this.$nextTick(() => {
        this.initInterface();
      });
    },
    
    initInterface() {
      if (this.$refs.pdfViewer) {
        // 创建通信接口
        this.pdfInterface = new PDFJSInterface(this.$refs.pdfViewer);
        
        // 等待查看器准备就绪
        this.pdfInterface.onViewerReady().then(() => {
          console.log('PDF查看器已准备就绪');
        });
      }
    },
    
    goToPrevPage() {
      if (this.pdfInterface) {
        this.pdfInterface.getCurrentPage().then(page => {
          if (page > 1) this.pdfInterface.goToPage(page - 1);
        });
      }
    },
    
    goToNextPage() {
      if (this.pdfInterface) {
        this.pdfInterface.getCurrentPage().then(page => {
          this.pdfInterface.goToPage(page + 1);
        });
      }
    },
    
    highlightText() {
      if (this.pdfInterface && this.searchText) {
        this.pdfInterface.setTextHighlight(this.searchText, { color: '#FFFF00' });
      }
    },
    
    clearHighlight() {
      if (this.pdfInterface) {
        this.pdfInterface.clearTextHighlight();
      }
    }
  },
  
  beforeUnmount() {
    // 清理代码
    this.pdfInterface = null;
  }
};
</script>

<style scoped>
.pdf-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 10px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 4px;
}

button {
  margin-right: 5px;
  padding: 5px 10px;
}

input {
  padding: 5px;
  margin-right: 5px;
}
</style>
```

### 自定义配置

你可以通过URL参数自定义PDF查看器的行为：

```javascript
// 构建查看器URL，包含自定义设置
const viewerUrl = new URL('./node_modules/your-name-pdfjs-dist/web/viewer.html', window.location.origin);

// 设置要加载的PDF
viewerUrl.searchParams.set('file', encodeURIComponent('https://example.com/your-document.pdf'));

// 禁用下载按钮
viewerUrl.searchParams.set('download', 'false');

// 禁用打印功能
viewerUrl.searchParams.set('print', 'false');

// 设置初始页面
viewerUrl.searchParams.set('page', '5');

// 设置初始缩放
viewerUrl.searchParams.set('zoom', 'page-fit');

// 应用到iframe
document.getElementById('pdf-viewer').src = viewerUrl.toString();
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

项目提供了一个完整的演示页面`examples/interface-demo/index.html`，你可以用它来测试通信接口的所有功能：

1. 构建项目：`./build-integrated-dist.sh`
2. 在浏览器中打开演示页面：`firefox examples/interface-demo/index.html`
3. 输入一个PDF的URL并点击"加载"按钮
4. 使用界面上的各个选项卡和控件来测试所有功能，包括导航、搜索、注释等

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
