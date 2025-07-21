# PDF.js Vue测试应用

这是一个使用Vue.js开发的PDF.js测试应用程序，用于测试和演示PDF.js的增强查看器功能。

## 特性

- ✅ **Vue 3组合式API**: 现代化的Vue.js开发
- ✅ **增强的PDF查看器**: 基于PDF.js的增强功能
- ✅ **npm包模块化**: 使用`pdfjs-editor`包进行模块化开发
- ✅ **完整的PDF功能**: 导航、搜索、高亮、注释等
- ✅ **响应式界面**: Bootstrap 5样式的现代UI
- ✅ **事件系统**: 完整的事件监听和处理
- ✅ **错误处理**: 完善的错误处理和日志记录

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 4.x
- **PDF处理**: pdfjs-editor npm包
- **样式框架**: Bootstrap 5
- **开发语言**: JavaScript (ES2022+)

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```

## npm包集成

本项目使用`pdfjs-editor`包作为PDF.js的模块化解决方案：

```javascript
// 动态导入PDF.js模块
const { EnhancedPDFViewer, MessageType } = await import('pdfjs-editor/interface')
```

### 包结构
```
pdfjs-editor/
├── build/pdf.mjs          # 主PDF.js库
├── interface/
│   ├── index.js           # 接口入口
│   └── interface.mjs      # 编译后的接口模块
├── web/viewer.html        # PDF查看器HTML
└── package.json           # npm包配置
```

## 使用方法
