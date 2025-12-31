class AlgorithmBlog {
    constructor() {
        this.currentFile = null;
        this.files = [];
        this.init();
    }

    async init() {
        await this.loadFileList();
        this.setupEventListeners();
    }

    async loadFileList() {
        try {
            // 获取dp目录下的所有.cpp文件
            const response = await fetch('api/files');
            if (response.ok) {
                this.files = await response.json();
                // 自动添加标签
                this.addTagsToFiles();
                this.renderFileList();
            } else {
                // 如果API不可用，使用静态文件列表
                this.files = [
                                // 模板文件
                                { name: 'template.cpp', path: 'template.cpp', date: null, isTemplate: true, category: '火车头' },
                                // 2025-12-30 的题目
                                { name: 'P1216数字三角形.cpp', path: 'dp/2025-12-30/P1216数字三角形.cpp', date: '2025-12-30' },
                                { name: 'P2842纸币问题1.cpp', path: 'dp/2025-12-30/P2842纸币问题1.cpp', date: '2025-12-30' },
                                { name: 'P2840纸币问题2.cpp', path: 'dp/2025-12-30/P2840纸币问题2.cpp', date: '2025-12-30' },
                                { name: '竹摇清风拂面.cpp', path: 'dp/2025-12-30/竹摇清风拂面.cpp', date: '2025-12-30' },
                                // 2025-12-31 的题目
                                { name: 'P1048采药.cpp', path: 'dp/2025-12-31/P1048采药.cpp', date: '2025-12-31' },
                                { name: 'P1048采药-优化空间.cpp', path: 'dp/2025-12-31/P1048采药-优化空间.cpp', date: '2025-12-31' },
                                { name: 'P2834纸币问题3.cpp', path: 'dp/2025-12-31/P2834纸币问题3.cpp', date: '2025-12-31' },
                                { name: 'P2834纸币问题3-优化空间.cpp', path: 'dp/2025-12-31/P2834纸币问题3-优化空间.cpp', date: '2025-12-31' }
                            ];
                // 自动添加标签
                this.addTagsToFiles();
                this.renderFileList();
            }
        } catch (error) {
            console.log('使用静态文件列表');
            this.files = [
                // 模板文件
                { name: 'template.cpp', path: 'template.cpp', date: null, isTemplate: true, category: '火车头' },
                // 2025-12-30 的题目
                { name: 'P1216数字三角形.cpp', path: 'dp/2025-12-30/P1216数字三角形.cpp', date: '2025-12-30' },
                { name: 'P2842纸币问题1.cpp', path: 'dp/2025-12-30/P2842纸币问题1.cpp', date: '2025-12-30' },
                { name: 'P2840纸币问题2.cpp', path: 'dp/2025-12-30/P2840纸币问题2.cpp', date: '2025-12-30' },
                { name: '竹摇清风拂面.cpp', path: 'dp/2025-12-30/竹摇清风拂面.cpp', date: '2025-12-30' },
                // 2025-12-31 的题目
                { name: 'P1048采药.cpp', path: 'dp/2025-12-31/P1048采药.cpp', date: '2025-12-31' },
                { name: 'P1048采药-优化空间.cpp', path: 'dp/2025-12-31/P1048采药-优化空间.cpp', date: '2025-12-31' },
                { name: 'P2834纸币问题3.cpp', path: 'dp/2025-12-31/P2834纸币问题3.cpp', date: '2025-12-31' },
                { name: 'P2834纸币问题3-优化空间.cpp', path: 'dp/2025-12-31/P2834纸币问题3-优化空间.cpp', date: '2025-12-31' }
            ];
            // 自动添加标签
            this.addTagsToFiles();
            this.renderFileList();
        }
    }

    // 自动为文件添加标签
    addTagsToFiles() {
        this.files.forEach(file => {
            // 如果不是模板文件，且路径包含dp目录，自动添加dp标签
            if (!file.isTemplate && file.path && file.path.includes('dp/')) {
                file.tag = 'dp';
            }
            
            // 如果文件名包含"-优化"，添加plus标签
            if (file.name && file.name.includes('-优化')) {
                file.plus = true;
            }
        });
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        // 分离模板文件和普通文件
        const templateFiles = [];
        const regularFiles = {};
        
        this.files.forEach(file => {
            if (file.isTemplate) {
                templateFiles.push(file);
            } else {
                const date = file.date || '未知日期';
                if (!regularFiles[date]) {
                    regularFiles[date] = [];
                }
                regularFiles[date].push(file);
            }
        });

        // 渲染火车头header和文件
        if (templateFiles.length > 0) {
            // 创建火车头标题
            const templateHeader = document.createElement('div');
            templateHeader.className = 'date-header template-header';
            templateHeader.innerHTML = `
                <i class="fas fa-train"></i>
                header
            `;
            fileList.appendChild(templateHeader);

            // 创建火车头文件列表
            const templateFilesContainer = document.createElement('div');
            templateFilesContainer.className = 'date-files';
            
            templateFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item template-file';
                
                fileItem.innerHTML = `
                    <i class="fas fa-layer-group file-icon"></i>
                    ${file.name}
                    <span class="template-badge">火车头</span>
                `;
                fileItem.addEventListener('click', () => this.loadFile(file));
                templateFilesContainer.appendChild(fileItem);
            });
            
            fileList.appendChild(templateFilesContainer);
        }

        // 按日期排序普通文件
        const sortedDates = Object.keys(regularFiles).sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        // 渲染每个日期组
        sortedDates.forEach(date => {
            // 创建日期标题
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.innerHTML = `
                <i class="fas fa-calendar-day"></i>
                ${date}
            `;
            fileList.appendChild(dateHeader);

            // 创建该日期下的文件列表
            const dateFiles = document.createElement('div');
            dateFiles.className = 'date-files';
            
            regularFiles[date].forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                // 检查文件类型和标签
                const hasDpTag = file.tag === 'dp';
                const hasPlusTag = file.plus === true;
                
                let iconClass = 'fa-file-code';
                let specialBadges = [];
                
                if (hasDpTag) {
                    specialBadges.push('<span class="dp-badge">DP</span>');
                }
                
                if (hasPlusTag) {
                    iconClass = 'fa-rocket';
                    specialBadges.push('<span class="optimized-badge">plus</span>');
                }
                
                fileItem.innerHTML = `
                    <i class="fas ${iconClass} file-icon"></i>
                    ${file.name}
                    ${specialBadges.join('')}
                `;
                fileItem.addEventListener('click', () => this.loadFile(file));
                dateFiles.appendChild(fileItem);
            });
            
            fileList.appendChild(dateFiles);
        });
    }

    async loadFile(file) {
        // 更新活动状态
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.file-item').classList.add('active');

        // 显示加载状态
        const codeDisplay = document.getElementById('codeDisplay');
        const currentFile = document.getElementById('currentFile');
        codeDisplay.textContent = '加载中...';
        currentFile.textContent = file.name;

        try {
            // 尝试从API获取文件内容
            const response = await fetch(`api/file?path=${encodeURIComponent(file.path)}`);
            let content;
            
            if (response.ok) {
                const data = await response.json();
                content = data.content;
                this.updateFileInfo(data);
            } else {
                // 如果API不可用，直接读取文件
                const fileResponse = await fetch(file.path);
                if (fileResponse.ok) {
                    content = await fileResponse.text();
                    this.updateFileInfo({
                        path: file.path,
                        size: new Blob([content]).size,
                        modified: new Date().toISOString()
                    });
                } else {
                    throw new Error('文件加载失败');
                }
            }

            this.currentFile = file;
            this.displayCode(content);
            this.showToast(`已加载 ${file.name}`, 'success');
        } catch (error) {
            console.error('加载文件失败:', error);
            codeDisplay.textContent = `// 加载文件失败: ${error.message}`;
            this.showToast('文件加载失败', 'error');
        }
    }

    displayCode(content) {
        const codeDisplay = document.getElementById('codeDisplay');
        codeDisplay.textContent = content;
        
        // 重新高亮代码
        if (typeof Prism !== 'undefined') {
            Prism.highlightElement(codeDisplay);
        }
    }

    updateFileInfo(fileInfo) {
        const fileInfoDiv = document.getElementById('fileInfo');
        const filePath = document.getElementById('filePath');
        const fileSize = document.getElementById('fileSize');
        const fileModified = document.getElementById('fileModified');

        filePath.textContent = fileInfo.path;
        fileSize.textContent = this.formatFileSize(fileInfo.size);
        fileModified.textContent = new Date(fileInfo.modified).toLocaleString('zh-CN');
        
        fileInfoDiv.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupEventListeners() {
        // 复制代码
        document.getElementById('copyCode').addEventListener('click', () => {
            this.copyCode();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'c':
                        if (window.getSelection().toString() === '') {
                            e.preventDefault();
                            this.copyCode();
                        }
                        break;
                    case 'd':
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                }
            }
        });
    }

    

    async copyCode() {
        const codeDisplay = document.getElementById('codeDisplay');
        const code = codeDisplay.textContent;
        
        try {
            await navigator.clipboard.writeText(code);
            this.showToast('代码已复制到剪贴板', 'success');
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('代码已复制到剪贴板', 'success');
        }
    }

    showToast(message, type = 'info') {
        // 移除现有的toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // 显示toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 创建简单的API服务端点（如果需要的话）
function createAPIEndpoints() {
    // 这个函数会在需要时创建一个简单的API来服务文件
    // 在实际部署中，你可能需要后端服务器来处理这些请求
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new AlgorithmBlog();
});

// 添加一些实用工具函数
window.AlgorithmBlogUtils = {
    // 格式化日期
    formatDate: (date) => {
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 获取文件扩展名
    getFileExtension: (filename) => {
        return filename.split('.').pop().toLowerCase();
    },
    
    // 生成文件图标
    getFileIcon: (filename) => {
        const extension = this.getFileExtension(filename);
        const icons = {
            'cpp': 'fa-file-code',
            'h': 'fa-file-code',
            'hpp': 'fa-file-code',
            'c': 'fa-file-code',
            'cc': 'fa-file-code',
            'txt': 'fa-file-alt',
            'md': 'fa-file-alt',
            'json': 'fa-file-code'
        };
        return icons[extension] || 'fa-file';
    }
};

// 添加搜索功能（可选）
function addSearchFunctionality() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索文件...';
    searchInput.className = 'search-input';
    
    const sidebarHeader = document.querySelector('.sidebar-header');
    sidebarHeader.appendChild(searchInput);
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const fileItems = document.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            const fileName = item.textContent.toLowerCase();
            if (fileName.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// 添加键盘导航
function addKeyboardNavigation() {
    let currentIndex = -1;
    const fileItems = document.querySelectorAll('.file-item');
    
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = Math.min(currentIndex + 1, fileItems.length - 1);
            fileItems[currentIndex]?.click();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = Math.max(currentIndex - 1, 0);
            fileItems[currentIndex]?.click();
        }
    });
}

// 性能优化：代码高亮的防抖处理
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 添加代码行号功能
function addLineNumbers() {
    const codeDisplay = document.getElementById('codeDisplay');
    const lines = codeDisplay.textContent.split('\n');
    const numberedLines = lines.map((line, index) => {
        return `<span class="line-number">${index + 1}</span>${line}`;
    }).join('\n');
    codeDisplay.innerHTML = numberedLines;
}