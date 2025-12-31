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
            // 首先尝试从API获取文件列表
            const response = await fetch('api/files');
            if (response.ok) {
                this.files = await response.json();
                console.log('从API获取文件列表成功');
            } else {
                throw new Error('API不可用');
            }
        } catch (error) {
            console.log('API不可用，尝试动态扫描目录结构');
            try {
                // 尝试动态扫描目录结构
                this.files = await this.scanDirectoryStructure();
                console.log('动态扫描目录成功');
            } catch (scanError) {
                console.log('动态扫描失败，使用静态文件列表:', scanError.message);
                // 如果动态扫描也失败，使用最新的静态文件列表
                this.files = this.getStaticFileList();
            }
        }
        
        // 自动添加标签
        this.addTagsToFiles();
        this.renderFileList();
    }

    // 动态扫描目录结构
    async scanDirectoryStructure() {
        const files = [];
        
        // 添加模板文件
        files.push({
            name: 'template.cpp',
            path: 'template.cpp',
            date: null,
            isTemplate: true,
            category: '火车头'
        });

        try {
            // 获取dp目录下的所有子目录
            const dpResponse = await fetch('dp/');
            if (!dpResponse.ok) {
                throw new Error('无法访问dp目录');
            }

            // 解析dp目录页面获取所有日期目录
            const dpHtmlText = await dpResponse.text();
            const dateDirs = this.parseDateDirectoriesFromHTML(dpHtmlText);
            
            // 如果没有找到日期目录，使用已知的目录作为备选
            const directoriesToScan = dateDirs.length > 0 ? dateDirs : ['2025-12-30', '2025-12-31'];
            
            for (const dateDir of directoriesToScan) {
                try {
                    const dateDirResponse = await fetch(`dp/${dateDir}/`);
                    if (dateDirResponse.ok) {
                        // 解析目录页面获取文件列表
                        const htmlText = await dateDirResponse.text();
                        const cppFiles = this.parseFilesFromDirectoryHTML(htmlText, dateDir);
                        
                        cppFiles.forEach(file => {
                            files.push({
                                name: file,
                                path: `dp/${dateDir}/${file}`,
                                date: dateDir
                            });
                        });
                    }
                } catch (error) {
                    console.warn(`无法扫描目录 dp/${dateDir}:`, error.message);
                }
            }
        } catch (error) {
            console.warn('扫描dp目录失败:', error.message);
        }

        return files;
    }

    // 从dp目录HTML页面解析日期目录
    parseDateDirectoriesFromHTML(htmlText) {
        const dateDirs = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // 查找所有链接，过滤出日期目录（格式：YYYY-MM-DD）
        const links = doc.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.match(/^\d{4}-\d{2}-\d{2}\/?$/)) {
                const dirName = href.replace(/\/$/, '');
                if (!dateDirs.includes(dirName)) {
                    dateDirs.push(dirName);
                }
            }
        });
        
        // 按日期排序（最新的在前）
        dateDirs.sort((a, b) => new Date(b) - new Date(a));
        
        return dateDirs;
    }

    // 从目录HTML页面解析文件列表
    parseFilesFromDirectoryHTML(htmlText, dateDir) {
        const files = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // 查找所有链接，过滤出.cpp文件
        const links = doc.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.endsWith('.cpp') && !href.includes('../')) {
                files.push(href);
            }
        });
        
        return files;
    }

    // 获取最新的静态文件列表（作为备选方案）
    getStaticFileList() {
        return [
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
            { name: 'P2834纸币问题3-优化空间.cpp', path: 'dp/2025-12-31/P2834纸币问题3-优化空间.cpp', date: '2025-12-31' },
            { name: 'P2196挖地雷.cpp', path: 'dp/2025-12-31/P2196挖地雷.cpp', date: '2025-12-31' }
        ];
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

    // 处理文件名显示，去掉"-优化空间"和前面的序号
    getDisplayName(fileName) {
        // 去掉文件扩展名
        let name = fileName.replace(/\.cpp$/, '');
        
        // 去掉"-优化空间"或"-优化"
        name = name.replace(/-优化空间$/, '').replace(/-优化$/, '');
        
        // 去掉前面的序号（如P1048、P2834等）
        name = name.replace(/^[A-Z]+\d+/, '');
        
        return name;
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
                
                // 使用处理后的显示名称
                const displayName = this.getDisplayName(file.name);
                
                fileItem.innerHTML = `
                    <i class="fas ${iconClass} file-icon"></i>
                    ${displayName}
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
        currentFile.textContent = this.getDisplayName(file.name);

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

    displayProblemLink(problemUrl) {
        // 移除已存在的链接区域
        const existingLink = document.querySelector('.problem-link-container');
        if (existingLink) {
            existingLink.remove();
        }
        
        if (!problemUrl) return;
        
        // 创建链接容器
        const linkContainer = document.createElement('div');
        linkContainer.className = 'problem-link-container';
        
        // 提取题目名称
        let problemName = '题目链接';
        try {
            const url = new URL(problemUrl);
            if (url.hostname.includes('luogu.com.cn')) {
                // 洛谷题目格式: /problem/P1216
                problemName = '洛谷';
            } else if (url.hostname.includes('nowcoder.com')) {
                // 牛客题目格式
                problemName = '牛客';
            }
        } catch (e) {
            // URL解析失败，使用默认名称
        }
        
        linkContainer.innerHTML = `
            <div class="problem-link">
                <i class="fas fa-external-link-alt"></i>
                <span class="problem-name">${problemName}</span>
                <a href="${problemUrl}" target="_blank" class="problem-url" rel="noopener noreferrer">
                    ${problemUrl}
                </a>
                <button class="copy-link-btn" title="复制链接">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `;
        
        // 插入到代码容器之前
        const codeContainer = document.querySelector('.code-container');
        codeContainer.parentNode.insertBefore(linkContainer, codeContainer);
        
        // 添加复制链接事件
        const copyBtn = linkContainer.querySelector('.copy-link-btn');
        copyBtn.addEventListener('click', () => {
            this.copyLink(problemUrl);
        });
    }

    async copyLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.showToast('题目链接已复制到剪贴板', 'success');
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('题目链接已复制到剪贴板', 'success');
        }
    }

    displayCode(content) {
        const codeDisplay = document.getElementById('codeDisplay');
        
        // 解析第一行的URL链接
        const lines = content.split('\n');
        let problemUrl = null;
        let codeWithoutUrl = content;
        
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            // 匹配注释中的URL格式: // https://...
            const urlMatch = firstLine.match(/^\/\/\s*(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                problemUrl = urlMatch[1];
                // 移除第一行的URL注释，只显示代码
                codeWithoutUrl = lines.slice(1).join('\n');
            }
        }
        
        // 显示题目链接
        this.displayProblemLink(problemUrl);
        
        codeDisplay.textContent = codeWithoutUrl;
        
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