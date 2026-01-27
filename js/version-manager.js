// 版本管理工具
class VersionManager {
    constructor() {
        this.currentVersion = this.getVersionFromHTML();
        this.init();
    }

    // 从HTML获取当前版本号
    getVersionFromHTML() {
        const scripts = document.querySelectorAll('script[src*="script.js"]');
        if (scripts.length > 0) {
            const src = scripts[0].getAttribute('src');
            const match = src.match(/v=(\d+)/);
            return match ? match[1] : null;
        }
        return null;
    }

    init() {
        // 开发模式检测
        this.isDevelopmentMode = this.detectDevelopmentMode();

        if (this.isDevelopmentMode) {
            this.setupAutoVersioning();
        }
    }

    // 检测是否为开发模式
    detectDevelopmentMode() {
        // 检测是否通过file://协议访问
        const isFileProtocol = window.location.protocol === 'file:';
        
        // 检测是否为localhost
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        // 检测URL中是否有dev参数
        const urlParams = new URLSearchParams(window.location.search);
        const hasDevParam = urlParams.get('dev') === 'true';
        
        return isFileProtocol || isLocalhost || hasDevParam;
    }

    // 设置自动版本更新
    setupAutoVersioning() {
        // 每次页面加载时检查是否有新版本
        this.checkForUpdates();
        
        // 添加快捷键 Ctrl+Shift+U 强制更新版本
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'U') {
                e.preventDefault();
                this.forceUpdateVersion();
            }
        });
        
        // 在控制台添加版本更新命令
        window.updateVersion = () => this.forceUpdateVersion();
    }

    // 检查更新
    async checkForUpdates() {
        try {
            // 获取当前script.js的最后修改时间
            const scriptResponse = await fetch('js/script.js', { method: 'HEAD' });
            const lastModified = scriptResponse.headers.get('last-modified');
            
            if (lastModified) {
                const modifiedTime = new Date(lastModified).getTime();
                const versionTime = parseInt(this.currentVersion.substring(0, 8)); // 取前8位作为日期
                
                // 如果文件修改时间晚于版本号日期，提示更新
                if (modifiedTime > versionTime * 1000000) { // 粗略比较
                    // 文件已更新
                }
            }
        } catch (error) {
            console.warn('检查更新失败:', error);
        }
    }

    // 强制更新版本号
    forceUpdateVersion() {
        const newVersion = this.generateNewVersion();
        this.updateVersionInHTML(newVersion);
        
        // 显示提示
        this.showUpdateNotification();
        
        // 延迟刷新页面
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    // 生成新版本号
    generateNewVersion() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    // 更新HTML中的版本号
    updateVersionInHTML(newVersion) {
        // 注意：在浏览器环境中无法直接修改文件系统
        // 这个方法主要用于演示，实际需要后端支持
    }

    // 显示更新通知
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-sync-alt fa-spin"></i>
                <div>
                    <strong>版本更新中</strong>
                    <div style="font-size: 12px; opacity: 0.9;">页面即将刷新...</div>
                </div>
            </div>
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // 3秒后移除通知
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// 初始化版本管理器
document.addEventListener('DOMContentLoaded', () => {
    new VersionManager();
});