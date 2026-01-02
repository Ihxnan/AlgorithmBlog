#!/bin/bash

# 开发工具脚本 - 自动更新版本号并刷新浏览器缓存

# 获取当前日期作为版本号
VERSION=$(date +%Y%m%d%H%M%S)

echo "更新版本号为: $VERSION"

# 更新HTML文件中的版本号
sed -i "s/css\/styles\.css?v=[0-9]*/css\/styles.css?v=$VERSION/g" index.html
sed -i "s/js\/particles\.js?v=[0-9]*/js\/particles.js?v=$VERSION/g" index.html
sed -i "s/js\/script\.js?v=[0-9]*/js\/script.js?v=$VERSION/g" index.html

echo "版本号更新完成！现在可以正常刷新浏览器查看更改了。"

# 如果提供了--open参数，则尝试打开浏览器
if [ "$1" = "--open" ]; then
    echo "正在打开浏览器..."
    if command -v xdg-open > /dev/null; then
        xdg-open index.html
    elif command -v open > /dev/null; then
        open index.html
    else
        echo "无法自动打开浏览器，请手动打开 index.html"
    fi
fi

echo "提示：以后每次更新CSS或JS文件后，运行此脚本即可自动更新版本号。"