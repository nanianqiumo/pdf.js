#!/bin/bash

# PDF.js Vue测试应用启动脚本

echo "=== PDF.js Vue测试应用 ==="
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 需要安装Node.js才能运行此应用"
    echo "请访问 https://nodejs.org/ 下载并安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 需要安装npm才能运行此应用"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"
echo "✅ npm版本: $(npm --version)"
echo ""

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 在当前目录找不到package.json文件"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

echo ""
echo "🚀 启动开发服务器..."
echo "服务器将在 http://localhost:3000 启动"
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm run dev
