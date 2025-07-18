#!/bin/bash

# 构建集成了interface和viewer.html的PDF.js分发版本
echo "构建带有通信接口和PDF查看器的PDF.js分发版本..."

# 确保gulp可用
if ! command -v gulp &> /dev/null; then
    echo "未找到gulp命令，正在安装..."
    npm install -g gulp-cli
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 输出版本信息
VERSION=$(node -e "console.log(require('./package.json').version)")
echo "构建版本 $VERSION..."

# 清理之前的构建
rm -rf build/dist

# 运行构建
echo "执行dist构建..."
gulp dist

echo "构建完成! 你的整合版本位于 build/dist/ 目录"
echo "可以通过以下命令进行测试和发布:"
echo ""
echo "测试包:"
echo "  cd build/dist && npm link"
echo "  然后在测试项目中: npm link pdfjs-dist"
echo ""
echo "测试集成功能:"
echo "  使用interface演示页面进行测试"
echo "  firefox examples/interface-demo/index.html"
echo ""
echo "使用方法:"
echo "1. 嵌入PDF查看器到iframe:"
echo "   <iframe src=\"./node_modules/pdfjs-dist/web/viewer.html?file=your-pdf-url.pdf\" id=\"pdf-viewer\"></iframe>"
echo ""
echo "2. 使用通信接口与PDF查看器交互:"
echo "   import { PDFJSInterface } from 'pdfjs-dist/interface';"
echo "   const iframe = document.getElementById('pdf-viewer');"
echo "   const pdfInterface = new PDFJSInterface(iframe);"
echo ""
echo "3. 更多集成示例请参考文档:"
echo "   web/interface/README.md"
echo ""
echo "发布到NPM (需要更改package.json中的名称以避免与官方包冲突):"
echo "  cd build/dist"
echo "  # 编辑package.json中的name字段，例如改为 nanianqiumo-pdfjs-dist"
echo "  npm publish"
