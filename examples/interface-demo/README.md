# PDF.js 接口演示

这个演示页面展示了如何使用 PDF.js 的通信接口（PDFJSInterface）控制嵌入在 iframe 中的 PDF.js 查看器。

## 功能展示

演示页面包含以下功能：

1. **PDF查看器集成** - 展示如何将PDF.js查看器嵌入到页面中
2. **导航控制** - 页面切换、缩放、旋转等操作
3. **搜索与高亮** - 文本搜索和高亮，支持自定义颜色
4. **注释功能** - 添加、获取和删除注释
5. **文档信息** - 获取文档元数据和大纲结构
6. **事件监听** - 监听PDF查看器中的各种事件

## 如何运行

1. 确保已构建PDF.js：
   ```bash
   ./build-integrated-dist.sh
   ```

2. 有两种方式运行演示：

   **方式一：使用浏览器直接打开（使用本地PDF）**
   ```bash
   firefox index.html
   ```
   
   **方式二：使用本地服务器（支持跨域PDF）**
   ```bash
   # 启动一个简单的HTTP服务器
   cd /path/to/pdf.js
   python -m http.server
   
   # 然后在浏览器中访问
   http://localhost:8000/examples/interface-demo/index.html
   ```

3. 演示页面提供了几个PDF文件选项：
   - **示例PDF (本地)**: 位于演示文件夹内的example.pdf（推荐，不会有跨域问题）
   - **测试PDF (服务器)**: 需要从服务器根目录加载，使用方式二运行
   - **自定义URL...**: 可以输入自己的PDF文件路径或URL

## 代码结构

`index.html`文件包含：

- 现代化的UI界面，基于Bootstrap 5
- 导入和使用真实的PDF.js接口 (`PDFJSInterface`) 
- 各种功能的实现代码和事件处理器
- 日志系统，用于跟踪操作和调试

## 自定义与扩展

可以将此演示作为集成PDF.js到自己项目的起点：

1. 复制相关代码到你的项目
2. 导入PDFJSInterface模块 (从 'web/interface/index.js')
3. 根据需要修改UI和功能

示例导入方式：
```javascript
import { PDFJSInterface, MessageType } from 'path/to/pdf.js/web/interface/index.js';
```

## 注意事项

- 演示页面需要与构建好的PDF.js配合使用
- 部分高级功能可能需要在PDF.js查看器中实现相应支持
- 处理跨域PDF时需注意CORS问题

### 关于跨域（CORS）问题

如果遇到"file origin does not match viewer's"错误，这是由于PDF.js的跨域安全限制导致的。解决方法：

1. 使用同源的PDF文件（如演示中默认使用的本地PDF文件）
2. 在URL中添加参数：`disableRange=true`和`enableXfa=true`
3. 在服务器上配置正确的CORS响应头
4. 使用本地服务器提供PDF文件和查看器（如使用`python -m http.server`）

### 关于PDF路径问题

如果遇到"404 Not Found"错误，可能是PDF文件路径不正确。请确保：

1. 运行本地服务器时，从项目根目录（pdf.js目录）启动服务器
   ```bash
   cd /path/to/pdf.js
   python -m http.server 8000
   ```
   
2. 使用正确的PDF文件路径：
   - 正确: `/test/pdfs/tracemonkey.pdf`（从项目根目录开始的绝对路径）
   - 错误: `../../test/pdfs/tracemonkey.pdf`（使用服务器时这种相对路径可能不正确）
   
3. 如果使用自己的PDF文件，可以将其放在项目根目录下的某个位置，并使用对应的路径
