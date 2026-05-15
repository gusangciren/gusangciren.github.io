#!/bin/bash
# 一键部署脚本：构建 → 推送到 GitHub Pages
# 用法：./deploy.sh

set -e
cd "$(dirname "$0")"

echo "🔨 构建中..."
npm run build

echo "📦 部署到 GitHub Pages..."
cd dist

# 初始化 git（如果需要）
if [ ! -d .git ]; then
  git init
  git remote add origin https://github.com/gusangciren/gusangciren.github.io.git
fi

git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" --allow-empty
git -c http.proxy=http://127.0.0.1:9674 -c https.proxy=http://127.0.0.1:9674 push --force origin main

echo "✅ 部署完成！https://gusangciren.com"
