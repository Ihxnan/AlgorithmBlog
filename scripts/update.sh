#!/bin/bash

# ===================== 配置项（请根据你的服务器修改） =====================
BLOG_DIR="/home/ihxnan/AlgorithmBlog"         # 你的博客文件夹绝对路径（必填！）
LOG_FILE="/home/ihxnan/AlgorithmBlog/log/log.txt" # 脚本执行日志文件路径
# ==========================================================================

# 1. 校验博客目录是否存在
if [ ! -d "$BLOG_DIR" ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] 错误：博客目录 $BLOG_DIR 不存在！" >>"$LOG_FILE"
    exit 1
fi

# 2. 进入博客目录
cd "$BLOG_DIR" || {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] 错误：无法进入目录 $BLOG_DIR！" >>"$LOG_FILE"
    exit 1
}

# 3. 校验是否为git仓库
if [ ! -d ".git" ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] 错误：$BLOG_DIR 不是git仓库！" >>"$LOG_FILE"
    exit 1
fi

# 4. 执行git pull并记录结果
echo "[$(date +'%Y-%m-%d %H:%M:%S')] 开始执行git pull..." >>"$LOG_FILE"
git pull >>"$LOG_FILE" 2>&1

# 5. 记录执行状态
if [ $? -eq 0 ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] git pull 执行成功！" >>"$LOG_FILE"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] 错误：git pull 执行失败，请查看日志详情！" >>"$LOG_FILE"
fi

# 6. 日志分隔线（方便阅读）
echo "----------------------------------------------------------------------" >>"$LOG_FILE"
