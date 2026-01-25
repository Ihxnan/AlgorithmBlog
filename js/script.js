class AlgorithmBlog {
    constructor() {
        this.currentFile = null;
        this.files = [];
        this.init();
    }

    // 安全的fetch方法，确保正确的UTF-8编码
    async safeFetch(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Accept': 'text/plain;charset=utf-8,application/json;charset=utf-8,*/*',
                'Accept-Charset': 'utf-8',
                ...options.headers
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 确保正确处理文本编码
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            return response.json();
        } else {
            // 对于文本内容，确保UTF-8解码
            const text = await response.text();
            
            // 检测并修复编码问题
            if (this.containsGarbledText(text)) {
                console.warn('检测到可能的编码问题，尝试修复...');
                return this.fixEncoding(text);
            }
            
            return text;
        }
    }

    async init() {
        await this.loadFileList();
        this.setupEventListeners();
        this.restoreUserPreferences();
        this.updateStats();
        this.setupMobileOptimizations();
    }

    // 移动端优化设置
    setupMobileOptimizations() {
        // 防止双击缩放
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // 优化触摸响应
        const touchElements = document.querySelectorAll('.file-item, .action-btn, .btn, .control-btn');
        touchElements.forEach(el => {
            el.addEventListener('touchstart', () => {
                el.style.opacity = '0.7';
            }, { passive: true });

            el.addEventListener('touchend', () => {
                el.style.opacity = '1';
            }, { passive: true });
        });

        // 检测移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            document.body.classList.add('mobile-device');
        }
    }

    async loadFileList() {
        try {
            // 首先尝试从API获取文件列表
            try {
                const apiFiles = await this.safeFetch('api/files');
                // 转换 API 返回的格式为内部格式
                this.files = apiFiles.map(file => ({
                    name: file.name,
                    path: file.path,
                    date: file.date,
                    category: file.type,
                    isTemplate: file.type === 'template' && file.date === 'root',
                    isTemplateFile: file.type === 'template' && file.date === 'template',
                    isMarkdown: file.path.endsWith('.md')
                }));
                console.log('从API获取文件列表成功，共', this.files.length, '个文件');
            } catch (apiError) {
                throw new Error('API不可用');
            }
        } catch (error) {
            console.log('API不可用，尝试动态扫描目录结构');
            try {
                // 尝试动态扫描目录结构
                this.files = await this.scanDirectoryStructure();
                console.log('动态扫描目录成功，共', this.files.length, '个文件');
            } catch (scanError) {
                console.log('动态扫描失败，使用静态文件列表:', scanError.message);
                // 如果动态扫描也失败，使用最新的静态文件列表
                this.files = this.getStaticFileList();
            }
        }

        // 自动添加标签
        this.addTagsToFiles();
        this.renderFileList();

        // 默认加载template.cpp文件
        this.loadDefaultFile();
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

        // 扫描template目录
        try {
            await this.scanTemplateDirectory(files);
        } catch (error) {
            console.warn('扫描template目录失败:', error.message);
        }

        // 扫描dp目录
        try {
            await this.scanAlgorithmDirectory('dp', files);
        } catch (error) {
            console.warn('扫描dp目录失败:', error.message);
        }

        // 扫描str目录
        try {
            await this.scanAlgorithmDirectory('str', files);
        } catch (error) {
            console.warn('扫描str目录失败:', error.message);
        }

        // 扫描ccpc目录
        try {
            await this.scanAlgorithmDirectory('ccpc', files);
        } catch (error) {
            console.warn('扫描ccpc目录失败:', error.message);
        }

        // 扫描trie目录
        try {
            await this.scanAlgorithmDirectory('trie', files);
        } catch (error) {
            console.warn('扫描trie目录失败:', error.message);
        }

        return files;
    }

    // 扫描template目录
    async scanTemplateDirectory(files) {
        try {
            const htmlText = await this.safeFetch('template/');
            const templateFiles = this.parseFilesFromDirectoryHTML(htmlText, 'template');
            
            templateFiles.forEach(file => {
                const isMarkdown = file.endsWith('.md');
                files.push({
                    name: file,
                    path: `template/${file}`,
                    date: null,
                    isTemplateFile: true,
                    category: 'template',
                    isMarkdown: isMarkdown
                });
            });
        } catch (error) {
            console.warn('扫描template目录失败:', error.message);
            throw error;
        }
    }

    // 扫描算法目录的通用方法
    async scanAlgorithmDirectory(dirName, files) {
        try {
            // 获取目录下的所有子目录
            const dirHtmlText = await this.safeFetch(`${dirName}/`);
            const dateDirs = this.parseDateDirectoriesFromHTML(dirHtmlText);
            
            // 如果没有找到日期目录，根据目录类型使用已知的目录作为备选
            let directoriesToScan = dateDirs;
            if (dateDirs.length === 0) {
                if (dirName === 'dp') {
                    directoriesToScan = ['2025-12-30', '2025-12-31'];
                } else if (dirName === 'str') {
                    directoriesToScan = ['2026-01-01'];
                } else if (dirName === 'ccpc') {
                    directoriesToScan = ['2026-01-13'];
                } else if (dirName === 'trie') {
                    directoriesToScan = ['2026-01-14'];
                }
            }
            
            for (const dateDir of directoriesToScan) {
                try {
                    const htmlText = await this.safeFetch(`${dirName}/${dateDir}/`);
                    const cppFiles = this.parseFilesFromDirectoryHTML(htmlText, dateDir);
                    
                    cppFiles.forEach(file => {
                        files.push({
                            name: file,
                            path: `${dirName}/${dateDir}/${file}`,
                            date: dateDir,
                            category: dirName // 记录文件所属类别
                        });
                    });
                } catch (error) {
                    console.warn(`无法扫描目录 ${dirName}/${dateDir}:`, error.message);
                }
            }
        } catch (error) {
            console.warn(`扫描${dirName}目录失败:`, error.message);
            throw error;
        }
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
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            
            // 查找所有链接，过滤出.cpp和.md文件
            const links = doc.querySelectorAll('a[href]');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.endsWith('.cpp') || href.endsWith('.md')) && !href.includes('../')) {
                    // 确保文件名正确编码
                    let fileName = href;
                    try {
                        // 尝试解码URL编码的文件名
                        fileName = decodeURIComponent(href);
                    } catch (e) {
                        // 如果解码失败，使用原始文件名
                        console.warn('文件名解码失败:', href);
                    }
                    files.push(fileName);
                }
            });
        } catch (error) {
            console.error('解析目录HTML失败:', error);
        }
        
        return files;
    }

    // 获取最新的静态文件列表（作为备选方案）
    getStaticFileList() {
        return [
            // 模板文件
            { name: 'template.cpp', path: 'template.cpp', date: null, isTemplate: true, category: '火车头' },
            // 2025-12-30 的题目
            { name: 'P1216数字三角形.cpp', path: 'dp/2025-12-30/P1216数字三角形.cpp', date: '2025-12-30', category: 'dp' },
            { name: 'P2842纸币问题1.cpp', path: 'dp/2025-12-30/P2842纸币问题1.cpp', date: '2025-12-30', category: 'dp' },
            { name: 'P2840纸币问题2.cpp', path: 'dp/2025-12-30/P2840纸币问题2.cpp', date: '2025-12-30', category: 'dp' },
            { name: '竹摇清风拂面.cpp', path: 'dp/2025-12-30/竹摇清风拂面.cpp', date: '2025-12-30', category: 'dp' },
            // 2025-12-31 的题目
            { name: 'P1048采药.cpp', path: 'dp/2025-12-31/P1048采药.cpp', date: '2025-12-31', category: 'dp' },
            { name: 'P1048采药-优化空间.cpp', path: 'dp/2025-12-31/P1048采药-优化空间.cpp', date: '2025-12-31', category: 'dp' },
            { name: 'P2834纸币问题3.cpp', path: 'dp/2025-12-31/P2834纸币问题3.cpp', date: '2025-12-31', category: 'dp' },
            { name: 'P2834纸币问题3-优化空间.cpp', path: 'dp/2025-12-31/P2834纸币问题3-优化空间.cpp', date: '2025-12-31', category: 'dp' },
            { name: 'P2196挖地雷.cpp', path: 'dp/2025-12-31/P2196挖地雷.cpp', date: '2025-12-31', category: 'dp' },
            { name: 'P1434滑雪.cpp', path: 'dp/2025-12-31/P1434滑雪.cpp', date: '2025-12-31', category: 'dp' },
            // 2026-01-01 的题目
            { name: '迎新字符串.cpp', path: 'str/2026-01-01/迎新字符串.cpp', date: '2026-01-01', category: 'str' },
            // 2026-01-13 的题目
            { name: 'L1-001.cpp', path: 'ccpc/2026-01-13/L1-001.cpp', date: '2026-01-13', category: 'ccpc' },
            // 2026-01-14 的题目
            { name: '字典树的实现.cpp', path: 'trie/2026-01-14/字典树的实现.cpp', date: '2026-01-14', category: 'trie' }
        ];
    }

    // 自动为文件添加标签
    addTagsToFiles() {
        this.files.forEach(file => {
            // 如果不是模板文件，根据路径添加相应的标签
            if (!file.isTemplate && !file.isTemplateFile && file.path) {
                if (file.path.includes('dp/')) {
                    file.tag = 'dp';
                } else if (file.path.includes('str/')) {
                    file.tag = 'str';
                } else if (file.path.includes('ccpc/')) {
                    file.tag = 'ccpc';
                } else if (file.path.includes('trie/')) {
                    file.tag = 'trie';
                }
            }

            // 为template目录下的文件添加tmpl标签
            if (file.isTemplateFile) {
                file.tag = 'tmpl';
            }

            // 如果文件名包含"-优化"，添加plus标签
            if (file.name && file.name.includes('-优化')) {
                file.plus = true;
            }
        });

        console.log('添加标签后的文件列表:', this.files.map(f => ({ name: f.name, tag: f.tag, path: f.path })));
    }

    

    // 处理文件名显示，去掉"-优化空间"和前面的序号
    getDisplayName(fileName, isTemplateFile = false) {
        // 去掉文件扩展名
        let name = fileName.replace(/\.cpp$/, '').replace(/\.md$/, '');

        // 如果是template目录下的文件，只返回去掉扩展名的文件名
        if (isTemplateFile) {
            return name;
        }

        // 去掉"-优化空间"或"-优化"
        name = name.replace(/-优化空间$/, '').replace(/-优化$/, '');

        // 去掉前面的洛谷题目编号（如P1048、P2834等）
        name = name.replace(/^P\d+/, '');

        return name;
    }

    renderFileList() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        console.log('renderFileList 调用，文件总数:', this.files.length);

        // 分离模板文件、template目录文件和普通文件
        const templateFiles = [];
        const templateDirFiles = [];
        const regularFiles = {};
        
        this.files.forEach(file => {
            if (file.isTemplate) {
                templateFiles.push(file);
            } else if (file.isTemplateFile) {
                templateDirFiles.push(file);
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
                <i class="fas fa-layer-group"></i>
                头文件
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

        // 渲染template目录（默认不展开）
        if (templateDirFiles.length > 0) {
            const templateDirHeader = document.createElement('div');
            templateDirHeader.className = 'date-header template-dir-header';
            templateDirHeader.innerHTML = `
                <i class="fas fa-chevron-right"></i>
                <i class="fas fa-folder"></i>
                template
            `;

            const templateDirContainer = document.createElement('div');
            templateDirContainer.className = 'date-files';
            templateDirContainer.style.display = 'none'; // 默认不展开
            templateDirHeader.classList.add('collapsed');

            // 添加点击事件
            templateDirHeader.style.cursor = 'pointer';
            templateDirHeader.addEventListener('click', () => {
                const isCollapsed = templateDirHeader.classList.contains('collapsed');
                const icon = templateDirHeader.querySelector('.fa-chevron-right, .fa-chevron-down');

                if (isCollapsed) {
                    templateDirContainer.style.display = 'block';
                    templateDirHeader.classList.remove('collapsed');
                    icon.className = 'fas fa-chevron-down';
                } else {
                    templateDirContainer.style.display = 'none';
                    templateDirHeader.classList.add('collapsed');
                    icon.className = 'fas fa-chevron-right';
                }
            });

            fileList.appendChild(templateDirHeader);

            // 渲染template目录下的文件
            templateDirFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item template-dir-file';

                const displayName = this.getDisplayName(file.name, true);
                const isMarkdown = file.isMarkdown || file.name.endsWith('.md');
                const iconClass = isMarkdown ? 'fa-file-alt' : 'fa-file-code';

                fileItem.innerHTML = `
                    <i class="fas ${iconClass} file-icon"></i>
                    ${displayName}
                    <span class="tmpl-badge">tmpl</span>
                `;
                fileItem.addEventListener('click', () => this.loadFile(file));
                templateDirContainer.appendChild(fileItem);
            });

            fileList.appendChild(templateDirContainer);
        }

        // 按日期排序普通文件（最新的在前）
        const sortedDates = Object.keys(regularFiles).sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        // 如果没有日期数据，直接返回
        if (sortedDates.length === 0) {
            console.log('没有日期数据');
            return;
        }

        console.log('日期数据:', sortedDates);

        // 获取最新一天的日期
        const latestDate = sortedDates[0];
        const latestDateObj = new Date(latestDate);
        const latestYear = latestDateObj.getFullYear();
        const latestMonth = latestDateObj.getMonth();

        // 分组逻辑：
        // 1. 最新一天：完全展开
        // 2. 最新月的其他日期：显示到日，默认收起
        // 3. 同年其他月份：显示到月，默认收起
        // 4. 其他年份：显示到年，默认收起

        const latestDayFiles = regularFiles[latestDate];
        const currentMonthOtherDays = [];
        const sameYearOtherMonths = {};
        const otherYears = {};

        sortedDates.slice(1).forEach(date => {
            const dateObj = new Date(date);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth();

            if (year === latestYear && month === latestMonth) {
                // 最新月的其他日期
                currentMonthOtherDays.push(date);
            } else if (year === latestYear) {
                // 同年其他月份：按月份分组
                const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                if (!sameYearOtherMonths[monthKey]) {
                    sameYearOtherMonths[monthKey] = [];
                }
                sameYearOtherMonths[monthKey].push(date);
            } else {
                // 其他年份：按年份分组
                const yearKey = `${year}`;
                if (!otherYears[yearKey]) {
                    otherYears[yearKey] = [];
                }
                otherYears[yearKey].push(date);
            }
        });

        // 渲染最新一天（完全展开）
        this.renderDateGroup(fileList, latestDate, latestDayFiles, true, true);

        // 渲染最新月的其他日期（显示到日，默认收起）
        currentMonthOtherDays.forEach(date => {
            this.renderDateGroup(fileList, date, regularFiles[date], false, false);
        });

        // 渲染同年其他月份（显示到月，默认收起）
        const sortedSameYearMonths = Object.keys(sameYearOtherMonths).sort((a, b) => new Date(b) - new Date(a));
        sortedSameYearMonths.forEach(month => {
            this.renderMonthGroup(fileList, month, sameYearOtherMonths[month], regularFiles);
        });

        // 渲染其他年份（显示到年，默认收起）
        const sortedOtherYears = Object.keys(otherYears).sort((a, b) => new Date(b) - new Date(a));
        sortedOtherYears.forEach(year => {
            this.renderYearGroup(fileList, year, otherYears[year], regularFiles);
        });
    }

    // 渲染单个日期组
    renderDateGroup(container, date, files, expanded, isLatest) {
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.innerHTML = `
            <i class="fas fa-chevron-right"></i>
            ${date}
        `;
        
        const dateFiles = document.createElement('div');
        dateFiles.className = 'date-files';
        
        // 设置展开/收起状态
        if (expanded) {
            dateFiles.style.display = 'block';
            dateHeader.classList.remove('collapsed');
            const icon = dateHeader.querySelector('i');
            icon.className = 'fas fa-chevron-down';
        } else {
            dateFiles.style.display = 'none';
            dateHeader.classList.add('collapsed');
        }

        // 添加点击事件
        dateHeader.style.cursor = 'pointer';
        dateHeader.addEventListener('click', () => {
            const isCollapsed = dateHeader.classList.contains('collapsed');
            const icon = dateHeader.querySelector('i');
            
            if (isCollapsed) {
                dateFiles.style.display = 'block';
                dateHeader.classList.remove('collapsed');
                icon.className = 'fas fa-chevron-down';
            } else {
                dateFiles.style.display = 'none';
                dateHeader.classList.add('collapsed');
                icon.className = 'fas fa-chevron-right';
            }
        });

        container.appendChild(dateHeader);
        
        // 渲染文件
        this.renderFilesInGroup(dateFiles, files);
        container.appendChild(dateFiles);
    }

    // 渲染月份分组
    renderMonthGroup(container, month, dates, regularFiles) {
        const monthHeader = document.createElement('div');
        monthHeader.className = 'date-header month-group';
        monthHeader.innerHTML = `
            <i class="fas fa-chevron-right"></i>
            ${month}
        `;

        const monthFiles = document.createElement('div');
        monthFiles.className = 'date-files';
        monthFiles.style.display = 'none';
        monthHeader.classList.add('collapsed');

        // 添加点击事件
        monthHeader.style.cursor = 'pointer';
        monthHeader.addEventListener('click', () => {
            const isCollapsed = monthHeader.classList.contains('collapsed');
            const icon = monthHeader.querySelector('i');

            if (isCollapsed) {
                monthFiles.style.display = 'block';
                monthHeader.classList.remove('collapsed');
                icon.className = 'fas fa-chevron-down';
            } else {
                monthFiles.style.display = 'none';
                monthHeader.classList.add('collapsed');
                icon.className = 'fas fa-chevron-right';
            }
        });

        container.appendChild(monthHeader);

        // 按日期排序（最新的在前）
        const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));

        // 渲染该月份下的所有日期
        sortedDates.forEach(date => {
            const files = regularFiles[date] || [];
            if (files.length > 0) {
                this.renderDateGroup(monthFiles, date, files, false, false);
            }
        });

        container.appendChild(monthFiles);
    }

    // 渲染年份分组
    renderYearGroup(container, year, dates, regularFiles) {
        const yearHeader = document.createElement('div');
        yearHeader.className = 'date-header year-group';
        yearHeader.innerHTML = `
            <i class="fas fa-chevron-right"></i>
            ${year}
        `;

        const yearFiles = document.createElement('div');
        yearFiles.className = 'date-files';
        yearFiles.style.display = 'none';
        yearHeader.classList.add('collapsed');

        // 添加点击事件
        yearHeader.style.cursor = 'pointer';
        yearHeader.addEventListener('click', () => {
            const isCollapsed = yearHeader.classList.contains('collapsed');
            const icon = yearHeader.querySelector('i');

            if (isCollapsed) {
                yearFiles.style.display = 'block';
                yearHeader.classList.remove('collapsed');
                icon.className = 'fas fa-chevron-down';
            } else {
                yearFiles.style.display = 'none';
                yearHeader.classList.add('collapsed');
                icon.className = 'fas fa-chevron-right';
            }
        });

        container.appendChild(yearHeader);

        // 按月份分组该年份下的日期
        const monthGroups = {};
        dates.forEach(date => {
            const dateObj = new Date(date);
            const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = [];
            }
            monthGroups[monthKey].push(date);
        });

        // 渲染该年份下的月份组
        const sortedMonths = Object.keys(monthGroups).sort((a, b) => new Date(b) - new Date(a));
        sortedMonths.forEach(month => {
            this.renderMonthGroup(yearFiles, month, monthGroups[month], regularFiles);
        });

        container.appendChild(yearFiles);
    }

    // 获取指定日期的文件
    getFilesForDate(date) {
        return this.files.filter(file => file.date === date);
    }

    // 在分组中渲染文件
    renderFilesInGroup(container, files) {
        console.log('renderFilesInGroup 调用，文件数量:', files.length);

        // 按文件名分组，让PLUS版本排在后面
        const fileGroups = {};
        files.forEach(file => {
            const baseName = this.getDisplayName(file.name);
            if (!fileGroups[baseName]) {
                fileGroups[baseName] = [];
            }
            fileGroups[baseName].push(file);
        });
        
        // 对每个分组内的文件进行排序，PLUS版本排在后面
        Object.keys(fileGroups).forEach(baseName => {
            const group = fileGroups[baseName];
            group.sort((a, b) => {
                // 确保PLUS标签正确识别
                const aIsPlus = a.name.includes('-优化空间') || a.name.includes('-优化');
                const bIsPlus = b.name.includes('-优化空间') || b.name.includes('-优化');
                
                // PLUS版本排在后面
                if (aIsPlus && !bIsPlus) return 1;
                if (!aIsPlus && bIsPlus) return -1;
                return 0;
            });
            
            // 渲染分组内的文件
            group.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                // 检查文件类型和标签
                const hasDpTag = file.tag === 'dp';
                const hasStrTag = file.tag === 'str';
                const hasCcpcTag = file.tag === 'ccpc';
                const hasTrieTag = file.tag === 'trie';
                // 统一使用文件名判断PLUS标签
                const hasPlusTag = file.name.includes('-优化空间') || file.name.includes('-优化');

                let iconClass = 'fa-file-code';
                let specialBadges = [];

                if (hasDpTag) {
                    specialBadges.push('<span class="dp-badge">DP</span>');
                }

                if (hasStrTag) {
                    specialBadges.push('<span class="str-badge">STR</span>');
                }

                if (hasCcpcTag) {
                    specialBadges.push('<span class="ccpc-badge">CCPC</span>');
                }

                if (hasTrieTag) {
                    specialBadges.push('<span class="trie-badge">TRIE</span>');
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
                container.appendChild(fileItem);
            });
        });
    }

    async loadFile(file) {
        // 更新活动状态
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
        });

        // 如果是通过点击事件触发的，设置活动状态
        if (event && event.target && event.target.closest('.file-item')) {
            event.target.closest('.file-item').classList.add('active');
        } else {
            // 如果是直接调用的，根据文件路径查找对应的 DOM 元素
            const fileItems = document.querySelectorAll('.file-item');
            fileItems.forEach(item => {
                const itemName = item.textContent.trim();
                const displayName = this.getDisplayName(file.name);
                if (itemName.includes(displayName)) {
                    item.classList.add('active');
                }
            });
        }

        // 显示加载状态
        const codeDisplay = document.getElementById('codeDisplay');
        const currentFile = document.getElementById('currentFile');
        codeDisplay.textContent = '加载中...';
        currentFile.textContent = this.getDisplayName(file.name);

        try {
            let content;

            try {
                // 尝试从API获取文件内容
                const data = await this.safeFetch(`api/files/${file.path}`);
                content = data.content;
                this.updateFileInfo(data);
            } catch (apiError) {
                // 如果API不可用，直接读取文件
                content = await this.safeFetch(file.path);
                this.updateFileInfo({
                    path: file.path,
                    size: new Blob([content]).size,
                    modified: new Date().toISOString()
                });
            }

            this.currentFile = file;

            // 检测是否为 Markdown 文件
            const isMarkdown = file.isMarkdown || file.name.endsWith('.md');
            if (isMarkdown) {
                this.displayMarkdown(content);
            } else {
                this.displayCode(content);
            }

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
            } else if (url.hostname.includes('pintia.cn')) {
                // PTA题目格式
                problemName = 'pta';
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
        const copyBtn = document.querySelector('.copy-link-btn');
        const originalIcon = copyBtn.innerHTML;
        
        try {
            await navigator.clipboard.writeText(url);
            
            // 添加成功样式
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            
            this.showToast('题目链接已复制到剪贴板', 'success');
            
            // 2秒后恢复原始样式
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalIcon;
            }, 2000);
            
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // 添加成功样式
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            
            this.showToast('题目链接已复制到剪贴板', 'success');
            
            // 2秒后恢复原始样式
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        }
    }

    displayCode(content) {
        const codeDisplay = document.getElementById('codeDisplay');
        const codeContainer = document.querySelector('.code-container');

        // 移除已存在的 Markdown 容器
        const existingMarkdown = codeContainer.querySelector('.markdown-body');
        if (existingMarkdown) {
            existingMarkdown.remove();
        }

        // 恢复 codeDisplay 的显示
        codeDisplay.parentElement.style.display = 'block';

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

    displayMarkdown(content) {
        const codeDisplay = document.getElementById('codeDisplay');
        const codeContainer = document.querySelector('.code-container');

        // 移除题目链接区域（Markdown 文件不需要）
        const existingLink = document.querySelector('.problem-link-container');
        if (existingLink) {
            existingLink.remove();
        }

        // 使用 marked.js 渲染 Markdown
        if (typeof marked !== 'undefined') {
            const htmlContent = marked.parse(content);

            // 隐藏原有的 codeDisplay
            codeDisplay.parentElement.style.display = 'none';

            // 移除已存在的 Markdown 容器
            const existingMarkdown = codeContainer.querySelector('.markdown-body');
            if (existingMarkdown) {
                existingMarkdown.remove();
            }

            // 创建新的 Markdown 容器
            const markdownDiv = document.createElement('div');
            markdownDiv.className = 'markdown-body';
            markdownDiv.innerHTML = htmlContent;
            codeContainer.appendChild(markdownDiv);
        } else {
            // 如果 marked.js 不可用，显示原始内容
            codeDisplay.textContent = content;
            console.warn('marked.js 不可用，无法渲染 Markdown');
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

    // 默认加载template.cpp文件
    async loadDefaultFile() {
        console.log('loadDefaultFile 开始执行');
        console.log('当前文件列表:', this.files);

        // 查找template.cpp文件（注意：API返回的name属性不包含.cpp扩展名）
        // 所以我们需要查找name为'template'或者path为'template.cpp'的文件
        const templateFile = this.files.find(file =>
            file.name === 'template' || file.path === 'template.cpp'
        );

        if (templateFile) {
            console.log('找到 template 文件:', templateFile);

            // 等待 DOM 完全渲染
            await new Promise(resolve => setTimeout(resolve, 200));

            console.log('开始加载 template.cpp');

            // 直接调用 loadFile 方法，而不是模拟点击
            // 这样更可靠，不依赖于 DOM 元素的存在
            await this.loadFile(templateFile);

            console.log('template.cpp 加载完成');

            // 设置文件列表中的活动状态
            const templateFileElement = document.querySelector('.file-item.template-file');
            if (templateFileElement) {
                templateFileElement.classList.add('active');
                console.log('已设置活动状态');
            }
        } else {
            console.warn('未找到 template 文件');
        }
    }

    setupEventListeners() {
        // 复制代码
        document.getElementById('copyCode').addEventListener('click', (e) => {
            this.addButtonClickEffect(e.target);
            this.copyCode();
        });

        // 刷新文件列表
        document.getElementById('refreshFiles').addEventListener('click', () => {
            this.refreshFileList();
        });

        // 切换主题
        document.getElementById('toggleTheme').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 打开不务正业笔记
        document.getElementById('openMemo').addEventListener('click', () => {
            this.openMemoPanel();
        });

        // 点击活跃天数显示热度图
        document.getElementById('activeDaysStat').addEventListener('click', () => {
            this.showHeatmap();
        });

        // 点击题目总数显示标签统计
        document.getElementById('totalProblemsStat').addEventListener('click', () => {
            this.showStatsPanel();
        });

        // 点击代码行数显示行数统计
        document.getElementById('totalLinesStat').addEventListener('click', () => {
            this.showLinesPanel();
        });

        // 关闭热度图
        document.getElementById('closeHeatmap').addEventListener('click', () => {
            this.hideHeatmap();
        });

        // 点击遮罩层关闭热度图
        document.getElementById('heatmapOverlay').addEventListener('click', () => {
            this.hideHeatmap();
        });

        // 关闭标签统计面板
        document.getElementById('closeStats').addEventListener('click', () => {
            this.hideStatsPanel();
        });

        // 点击遮罩层关闭标签统计面板
        document.getElementById('statsOverlay').addEventListener('click', () => {
            this.hideStatsPanel();
        });

        // 关闭代码行数面板
        document.getElementById('closeLines').addEventListener('click', () => {
            this.hideLinesPanel();
        });

        // 点击遮罩层关闭代码行数面板
        document.getElementById('linesOverlay').addEventListener('click', () => {
            this.hideLinesPanel();
        });

        // 切换侧边栏
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // 下载代码
        document.getElementById('downloadCode').addEventListener('click', (e) => {
            this.addButtonClickEffect(e.target);
            this.downloadCurrentCode();
        });

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            this.filterFiles();
        });

        // 清除搜索
        document.getElementById('clearSearch').addEventListener('click', () => {
            searchInput.value = '';
            this.filterFiles();
        });

        // 筛选功能
        document.getElementById('typeFilter').addEventListener('change', () => {
            this.filterFiles();
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
                    case 'r':
                        e.preventDefault();
                        this.refreshFileList();
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadCurrentCode();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('searchInput').focus();
                        break;
                }
            } else if (e.key === 'Escape') {
                // ESC键清除搜索
                document.getElementById('searchInput').value = '';
                this.filterFiles();
                document.getElementById('searchInput').blur();
            }
        });
    }

    

    async copyCode() {
        const codeDisplay = document.getElementById('codeDisplay');
        const code = codeDisplay.textContent;
        const copyBtn = document.getElementById('copyCode');
        const originalIcon = copyBtn.innerHTML;
        
        try {
            await navigator.clipboard.writeText(code);
            // 改变按钮图标为成功状态
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.color = '#4ade80';
            this.showToast('代码已复制到剪贴板', 'success');
            
            // 1秒后恢复原始图标
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                copyBtn.style.color = '';
            }, 1000);
        } catch (error) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // 改变按钮图标为成功状态
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.color = '#4ade80';
            this.showToast('代码已复制到剪贴板', 'success');
            
            // 1秒后恢复原始图标
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                copyBtn.style.color = '';
            }, 1000);
        }
    }

    // 检测文本是否包含乱码
    containsGarbledText(text) {
        // 检测常见的乱码字符模式
        const garbledPatterns = [
            /[Â£Ã§Â¨Â¦ÂºÃ³ÃÃÃÃÃÃÃ]/g,  // 常见的UTF-8编码错误
            /[ï¿½]/g,  // 替换字符
            /[\uFFFD]/g  // Unicode替换字符
        ];
        
        return garbledPatterns.some(pattern => pattern.test(text));
    }

    // 修复文本编码
    fixEncoding(text) {
        try {
            // 方法1: 尝试将文本作为Latin-1编码的字节序列，然后重新解码为UTF-8
            const bytes = [];
            for (let i = 0; i < text.length; i++) {
                const code = text.charCodeAt(i);
                if (code <= 0xFF) {
                    bytes.push(code);
                } else {
                    // 对于超出Latin-1范围的字符，使用替换字符
                    bytes.push(0x3F); // '?'
                }
            }
            
            // 创建TextDecoder来正确解码UTF-8
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const fixedText = decoder.decode(new Uint8Array(bytes));
            
            // 检查修复后的文本是否仍然包含乱码
            if (!this.containsGarbledText(fixedText)) {
                return fixedText;
            }
            
            // 方法2: 尝试其他常见的编码修复
            return this.advancedEncodingFix(text);
        } catch (error) {
            console.warn('编码修复失败:', error);
            return text; // 如果修复失败，返回原始文本
        }
    }

    // 高级编码修复方法
    advancedEncodingFix(text) {
        // 常见的编码错误模式及其修复
        const fixes = [
            // UTF-8 被错误解释为 Latin-1
            { pattern: /Ã§/g, replacement: 'ç' },
            { pattern: /Ã¨/g, replacement: 'è' },
            { pattern: /Ã©/g, replacement: 'é' },
            { pattern: /Ãª/g, replacement: 'ê' },
            { pattern: /Ã«/g, replacement: 'ë' },
            { pattern: /Ã¬/g, replacement: 'ì' },
            { pattern: /Ã­/g, replacement: 'í' },
            { pattern: /Ã®/g, replacement: 'î' },
            { pattern: /Ã¯/g, replacement: 'ï' },
            { pattern: /Ã²/g, replacement: 'ò' },
            { pattern: /Ã³/g, replacement: 'ó' },
            { pattern: /Ã´/g, replacement: 'ô' },
            { pattern: /Ãµ/g, replacement: 'õ' },
            { pattern: /Ã¶/g, replacement: 'ö' },
            { pattern: /Ã¹/g, replacement: 'ù' },
            { pattern: /Ãº/g, replacement: 'ú' },
            { pattern: /Ã»/g, replacement: 'û' },
            { pattern: /Ã¼/g, replacement: 'ü' },
            { pattern: /Ã¿/g, replacement: 'ÿ' },
            { pattern: /Ã/g, replacement: 'à' },
            { pattern: /Ã/g, replacement: 'á' },
            { pattern: /Ã/g, replacement: 'â' },
            { pattern: /Ã/g, replacement: 'ä' },
            { pattern: /Ã/g, replacement: 'ã' },
            { pattern: /Ã/g, replacement: 'å' },
            // 中文字符的常见编码错误
            { pattern: /Â£/g, replacement: '汉' },
            { pattern: /Â¥/g, replacement: '字' },
            { pattern: /Â§/g, replacement: '题' },
            { pattern: /Â¨/g, replacement: '目' },
            { pattern: /Âª/g, replacement: '算' },
            { pattern: /Â¬/g, replacement: '法' },
            { pattern: /Â®/g, replacement: '动' },
            { pattern: /Â°/g, replacement: '态' },
            { pattern: /Â²/g, replacement: '规' },
            { pattern: /Â³/g, replacement: '划' },
            { pattern: /Â´/g, replacement: '纸' },
            { pattern: /Â¶/g, replacement: '币' },
            { pattern: /Â¸/g, replacement: '问' },
            { pattern: /Âº/g, replacement: '数' },
            { pattern: /Â¼/g, replacement: '字' },
            { pattern: /Â½/g, replacement: '三' },
            { pattern: /Â¾/g, replacement: '角' },
            { pattern: /Â¿/g, replacement: '形' },
            { pattern: /Ã/g, replacement: '挖' },
            { pattern: /Ã/g, replacement: '地' },
            { pattern: /Ã/g, replacement: '雷' },
            { pattern: /Ã/g, replacement: '采' },
            { pattern: /Ã/g, replacement: '药' },
            { pattern: /Ã/g, replacement: '竹' },
            { pattern: /Ã/g, replacement: '摇' },
            { pattern: /Ã/g, replacement: '清' },
            { pattern: /Ã/g, replacement: '风' },
            { pattern: /Ã/g, replacement: '拂' },
            { pattern: /Ã/g, replacement: '面' }
        ];

        let fixedText = text;
        fixes.forEach(fix => {
            fixedText = fixedText.replace(fix.pattern, fix.replacement);
        });

        return fixedText;
    }

    // 刷新文件列表
    async refreshFileList() {
        const refreshBtn = document.getElementById('refreshFiles');
        refreshBtn.querySelector('i').classList.add('fa-spin');
        
        try {
            await this.loadFileList();
            this.showToast('文件列表已刷新', 'success');
        } catch (error) {
            this.showToast('刷新失败', 'error');
        } finally {
            refreshBtn.querySelector('i').classList.remove('fa-spin');
        }
    }

    // 切换主题
    toggleTheme() {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        root.setAttribute('data-theme', newTheme);
        
        // 更新按钮状态
        const themeBtn = document.getElementById('toggleTheme');
        themeBtn.classList.toggle('active', newTheme === 'light');
        
        // 保存主题偏好
        localStorage.setItem('theme', newTheme);
        
        this.showToast(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}主题`, 'info');
    }

    

    // 切换侧边栏
    toggleSidebar() {
        const layout = document.querySelector('.layout');
        const sidebarBtn = document.getElementById('toggleSidebar');
        const isHidden = layout.classList.contains('sidebar-hidden');
        
        if (isHidden) {
            layout.classList.remove('sidebar-hidden');
            sidebarBtn.classList.remove('active');
            localStorage.setItem('sidebarVisible', 'true');
            this.showToast('侧边栏已显示', 'info');
        } else {
            layout.classList.add('sidebar-hidden');
            sidebarBtn.classList.add('active');
            localStorage.setItem('sidebarVisible', 'false');
            this.showToast('侧边栏已隐藏，代码区域已扩大', 'info');
        }
    }

    // 下载当前代码
    downloadCurrentCode() {
        if (!this.currentFile) {
            this.showToast('请先选择一个文件', 'warning');
            return;
        }

        const codeDisplay = document.getElementById('codeDisplay');
        const code = codeDisplay.textContent;
        const fileName = this.currentFile.name;
        const downloadBtn = document.getElementById('downloadCode');
        const originalIcon = downloadBtn.innerHTML;
        
        // 创建下载链接
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // 改变按钮图标为成功状态
        downloadBtn.innerHTML = '<i class="fas fa-check"></i>';
        downloadBtn.style.color = '#4ade80';
        this.showToast(`已下载 ${fileName}`, 'success');
        
        // 1秒后恢复原始图标
        setTimeout(() => {
            downloadBtn.innerHTML = originalIcon;
            downloadBtn.style.color = '';
        }, 1000);
    }

    // 恢复用户偏好设置
    restoreUserPreferences() {
        // 恢复主题设置
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeBtn = document.getElementById('toggleTheme');
        if (themeBtn) {
            themeBtn.classList.toggle('active', savedTheme === 'light');
        }
        
        
        
        // 恢复侧边栏设置
        const sidebarVisible = localStorage.getItem('sidebarVisible') !== 'false';
        const layout = document.querySelector('.layout');
        const sidebarBtn = document.getElementById('toggleSidebar');
        
        if (layout) {
            if (!sidebarVisible) {
                layout.classList.add('sidebar-hidden');
            }
        }
        
        if (sidebarBtn) {
            sidebarBtn.classList.toggle('active', !sidebarVisible);
        }
    }

    // 更新统计信息
    updateStats() {
        // 计算题目总数（统计所有有 tag 的题目）
        const totalProblems = this.files.filter(file =>
            !file.isTemplate &&
            !file.isTemplateFile &&
            file.path &&
            file.path.endsWith('.cpp') &&
            file.tag && file.tag !== 'tmpl'
        ).length;

        // 计算活跃天数（基于题目列表中的不同日期数量）
        const uniqueDates = new Set();
        this.files.forEach(file => {
            if (file.date && !file.isTemplate && !file.isTemplateFile && file.tag && file.tag !== 'tmpl') {
                uniqueDates.add(file.date);
            }
        });
        const activeDays = uniqueDates.size;

        // 动态获取代码行数
        this.updateTotalLines();

        // 更新DOM
        document.getElementById('totalProblems').textContent = totalProblems;
        document.getElementById('activeDays').textContent = activeDays;
    }

    // 搜索和筛选文件
    filterFiles() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;
        
        // 筛选文件
        const filteredFiles = this.files.filter(file => {
            // 搜索过滤
            if (searchTerm && !file.name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // 算法类型过滤（使用原有的tag属性）
            if (typeFilter && file.tag !== typeFilter) {
                return false;
            }
            
            return true;
        });
        
        // 重新渲染文件列表
        this.renderFilteredList(filteredFiles);
    }

    // 渲染筛选后的文件列表
    renderFilteredList(filteredFiles) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        // 分离模板文件、template目录文件和普通文件
        const templateFiles = [];
        const templateDirFiles = [];
        const regularFiles = {};
        
        filteredFiles.forEach(file => {
            if (file.isTemplate) {
                templateFiles.push(file);
            } else if (file.isTemplateFile) {
                templateDirFiles.push(file);
            } else {
                const date = file.date || '未知日期';
                if (!regularFiles[date]) {
                    regularFiles[date] = [];
                }
                regularFiles[date].push(file);
            }
        });

        // 创建火车头文件列表
        if (templateFiles.length > 0) {
            const templateHeader = document.createElement('div');
            templateHeader.className = 'template-header';
            templateHeader.innerHTML = '<i class="fas fa-layer-group"></i> 头文件';
            fileList.appendChild(templateHeader);

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

        // 创建template目录文件列表
        if (templateDirFiles.length > 0) {
            const templateDirHeader = document.createElement('div');
            templateDirHeader.className = 'date-header template-dir-header';
            templateDirHeader.innerHTML = `
                <i class="fas fa-chevron-right"></i>
                <i class="fas fa-folder"></i>
                template
            `;
            
            const templateDirFilesContainer = document.createElement('div');
            templateDirFilesContainer.className = 'date-files';
            templateDirFilesContainer.style.display = 'none'; // 默认收起
            templateDirHeader.classList.add('collapsed');

            // 添加点击事件
            templateDirHeader.style.cursor = 'pointer';
            templateDirHeader.addEventListener('click', () => {
                const isCollapsed = templateDirHeader.classList.contains('collapsed');
                const icon = templateDirHeader.querySelector('.fa-chevron-right, .fa-chevron-down');
                
                if (isCollapsed) {
                    templateDirFilesContainer.style.display = 'block';
                    templateDirHeader.classList.remove('collapsed');
                    icon.className = 'fas fa-chevron-down';
                } else {
                    templateDirFilesContainer.style.display = 'none';
                    templateDirHeader.classList.add('collapsed');
                    icon.className = 'fas fa-chevron-right';
                }
            });

            fileList.appendChild(templateDirHeader);
            
            templateDirFiles.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item template-dir-file';
                
                const displayName = this.getDisplayName(file.name, true);
                
                fileItem.innerHTML = `
                    <i class="fas fa-file-code file-icon"></i>
                    ${displayName}
                    <span class="tmpl-badge">tmpl</span>
                `;
                fileItem.addEventListener('click', () => this.loadFile(file));
                templateDirFilesContainer.appendChild(fileItem);
            });
            
            fileList.appendChild(templateDirFilesContainer);
        }

        // 按日期排序普通文件
        const sortedDates = Object.keys(regularFiles).sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        // 如果有普通文件，使用年份和月份分组逻辑
        if (sortedDates.length > 0) {
            const latestDate = sortedDates[0];
            const latestDateObj = new Date(latestDate);
            const latestYear = latestDateObj.getFullYear();
            const latestMonth = latestDateObj.getMonth();

            // 分组逻辑：
            // 1. 最新一天：完全展开
            // 2. 最新月的其他日期：显示到日，默认收起
            // 3. 同年其他月份：显示到月，默认收起
            // 4. 其他年份：显示到年，默认收起

            const latestDayFiles = regularFiles[latestDate];
            const currentMonthOtherDays = [];
            const sameYearOtherMonths = {};
            const otherYears = {};

            sortedDates.slice(1).forEach(date => {
                const dateObj = new Date(date);
                const year = dateObj.getFullYear();
                const month = dateObj.getMonth();

                if (year === latestYear && month === latestMonth) {
                    // 最新月的其他日期
                    currentMonthOtherDays.push(date);
                } else if (year === latestYear) {
                    // 同年其他月份：按月份分组
                    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
                    if (!sameYearOtherMonths[monthKey]) {
                        sameYearOtherMonths[monthKey] = [];
                    }
                    sameYearOtherMonths[monthKey].push(date);
                } else {
                    // 其他年份：按年份分组
                    const yearKey = `${year}`;
                    if (!otherYears[yearKey]) {
                        otherYears[yearKey] = [];
                    }
                    otherYears[yearKey].push(date);
                }
            });

            // 渲染最新一天（完全展开）
            this.renderDateGroup(fileList, latestDate, latestDayFiles, true, true);

            // 渲染最新月的其他日期（显示到日，默认收起）
            currentMonthOtherDays.forEach(date => {
                this.renderDateGroup(fileList, date, regularFiles[date], false, false);
            });

            // 渲染同年其他月份（显示到月，默认收起）
            const sortedSameYearMonths = Object.keys(sameYearOtherMonths).sort((a, b) => new Date(b) - new Date(a));
            sortedSameYearMonths.forEach(month => {
                this.renderMonthGroup(fileList, month, sameYearOtherMonths[month], regularFiles);
            });

            // 渲染其他年份（显示到年，默认收起）
            const sortedOtherYears = Object.keys(otherYears).sort((a, b) => new Date(b) - new Date(a));
            sortedOtherYears.forEach(year => {
                this.renderYearGroup(fileList, year, otherYears[year], regularFiles);
            });
        }

        // 如果没有筛选结果，显示提示
        if (filteredFiles.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <i class="fas fa-search"></i>
                <p>没有找到匹配的题目</p>
                <p>请尝试调整搜索条件或筛选器</p>
            `;
            fileList.appendChild(noResults);
        }
    }

    // 动态获取代码行数
    async updateTotalLines() {
        try {
            let totalLines = 0;

            // 统计模板文件行数
            try {
                const templateContent = await this.safeFetch('template.cpp');
                const templateLines = templateContent.split('\n').length;
                totalLines += templateLines;
                console.log('模板文件行数:', templateLines);
            } catch (error) {
                console.warn('无法读取模板文件:', error);
            }

            // 统计所有 cpp 文件（排除模板文件）
            console.log('所有文件列表:', this.files.map(f => ({
                name: f.name,
                path: f.path,
                isTemplate: f.isTemplate,
                isTemplateFile: f.isTemplateFile,
                tag: f.tag
            })));

            const cppFiles = this.files.filter(file => {
                const isCpp = file.path && file.path.endsWith('.cpp');
                const isNotTemplate = !file.isTemplate;
                const isNotTemplateFile = !file.isTemplateFile;
                const hasTag = file.tag && file.tag !== 'tmpl';

                console.log(`文件 ${file.name}: isCpp=${isCpp}, isNotTemplate=${isNotTemplate}, isNotTemplateFile=${isNotTemplateFile}, hasTag=${hasTag}`);

                return isCpp && isNotTemplate && isNotTemplateFile && hasTag;
            });

            console.log('找到的题目文件数量:', cppFiles.length);
            console.log('题目文件列表:', cppFiles.map(f => ({ name: f.name, tag: f.tag, path: f.path })));

            for (const file of cppFiles) {
                try {
                    const content = await this.safeFetch(file.path);
                    const lines = content.split('\n').length;
                    totalLines += lines;
                    console.log(`${file.name}: ${lines} 行`);
                } catch (error) {
                    console.warn(`无法读取文件 ${file.name}:`, error);
                }
            }

            console.log('总行数:', totalLines);

            // 更新DOM
            document.getElementById('totalLines').textContent = totalLines;
        } catch (error) {
            console.error('获取代码行数失败:', error);
            // 如果失败，显示默认值
            document.getElementById('totalLines').textContent = '600';
        }
    }

    // 添加按钮点击效果
    addButtonClickEffect(button) {
        // 添加点击动画类
        button.classList.add('clicked');
        
        // 创建涟漪效果
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        button.appendChild(ripple);
        
        // 获取按钮位置和大小
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        // 设置涟漪样式
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        // 移除动画类和涟漪元素
        setTimeout(() => {
            button.classList.remove('clicked');
            if (button.contains(ripple)) {
                button.removeChild(ripple);
            }
        }, 600);
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
    window.blog = new AlgorithmBlog();
    window.musicPlayer = new MusicPlayer();
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

// ========== Markdown 相关功能 ==========

// 打开不务正业笔记面板
AlgorithmBlog.prototype.openMemoPanel = async function() {
    try {
        // 扫描不务正业目录下的 Markdown 文件
        const memoFiles = await this.scanMemoDirectory();
        
        if (memoFiles.length === 0) {
            this.showToast('不务正业目录中没有 Markdown 文件', 'warning');
            return;
        }
        
        // 如果只有一个文件，直接打开
        if (memoFiles.length === 1) {
            await this.loadAndRenderMarkdown(memoFiles[0]);
            return;
        }
        
        // 如果有多个文件，显示文件列表让用户选择
        this.showMemoFileList(memoFiles);
    } catch (error) {
        console.error('打开笔记面板失败:', error);
        this.showToast('加载笔记失败', 'error');
    }
};

// 扫描不务正业目录
AlgorithmBlog.prototype.scanMemoDirectory = async function() {
    const memoFiles = [];
    
    try {
        // 优先尝试从 API 获取文件列表
        const response = await this.safeFetch('api/memos');
        if (response && response.files) {
            response.files.forEach(file => {
                memoFiles.push({
                    name: file.name,
                    path: file.path
                });
            });
            console.log('从API获取不务正业文件列表成功，共', memoFiles.length, '个文件');
        } else {
            throw new Error('API 返回数据格式不正确');
        }
    } catch (apiError) {
        console.warn('API获取失败，尝试直接访问目录:', apiError.message);
        
        // 如果 API 不可用，尝试直接访问目录
        try {
            const memoDir = '不务正业/';
            const response = await fetch(memoDir);
            
            if (!response.ok) {
                throw new Error('无法访问不务正业目录');
            }
            
            const html = await response.text();
            
            // 检查是否返回的是 index.html（说明目录列表不可用）
            if (html.includes('<!DOCTYPE html>') && html.includes('算法日常')) {
                throw new Error('目录列表不可用，返回了 index.html');
            }
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a[href]');
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('.md') && !href.startsWith('../')) {
                    // 解码 URL 编码的文件名用于显示
                    let fileName = href;
                    try {
                        fileName = decodeURIComponent(href);
                    } catch (e) {
                        console.warn('文件名解码失败:', href);
                    }
                    memoFiles.push({
                        name: fileName,
                        path: memoDir + href  // 使用原始的 href 构建路径
                    });
                }
            });
        } catch (dirError) {
            console.warn('扫描不务正业目录失败，使用静态列表:', dirError.message);
            // 使用静态列表作为后备
            memoFiles.push({
                name: 'ArchMemo.md',
                path: '不务正业/ArchMemo.md'
            });
            memoFiles.push({
                name: 'Navigation.md',
                path: '不务正业/Navigation.md'
            });
        }
    }
    
    return memoFiles;
};

// 显示笔记文件列表
AlgorithmBlog.prototype.showMemoFileList = function(memoFiles) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'memo-modal';

    // 使用 document.createElement 和 appendChild 来安全地构建 DOM
    const contentDiv = document.createElement('div');
    contentDiv.className = 'memo-modal-content';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'memo-modal-header';
    headerDiv.innerHTML = `
        <h3><i class="fas fa-book-open"></i> 选择笔记文件</h3>
        <button class="memo-modal-close"><i class="fas fa-times"></i></button>
    `;

    const fileListDiv = document.createElement('div');
    fileListDiv.className = 'memo-file-list';

    memoFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'memo-file-item';
        fileItem.dataset.path = file.path;  // 使用 dataset 安全地设置路径

        const icon = document.createElement('i');
        icon.className = 'fas fa-file-alt';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = file.name;

        fileItem.appendChild(icon);
        fileItem.appendChild(nameSpan);
        fileListDiv.appendChild(fileItem);
    });

    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(fileListDiv);
    modal.appendChild(contentDiv);

    document.body.appendChild(modal);

    // 添加关闭按钮事件
    headerDiv.querySelector('.memo-modal-close').addEventListener('click', () => {
        modal.remove();
    });

    // 添加点击事件
    modal.querySelectorAll('.memo-file-item').forEach(item => {
        item.addEventListener('click', async () => {
            const path = item.dataset.path;
            modal.remove();
            await this.loadAndRenderMarkdown({ path, name: item.querySelector('span').textContent });
        });
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// 加载并渲染 Markdown 文件
AlgorithmBlog.prototype.loadAndRenderMarkdown = async function(file) {
    try {
        // 加载 Markdown 文件内容
        const content = await this.safeFetch(file.path);
        
        // 渲染 Markdown
        const html = marked.parse(content);
        
        // 创建或更新 Markdown 显示面板
        this.showMarkdownPanel(file.name, html);
        
        this.showToast(`已加载: ${file.name}`, 'success');
    } catch (error) {
        console.error('加载 Markdown 文件失败:', error);
        this.showToast('加载 Markdown 文件失败', 'error');
    }
};

// 显示 Markdown 面板
AlgorithmBlog.prototype.showMarkdownPanel = function(title, content) {
    // 移除已存在的面板
    const existingPanel = document.querySelector('.markdown-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // 创建 Markdown 面板
    const panel = document.createElement('div');
    panel.className = 'markdown-panel';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'markdown-panel-content';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'markdown-panel-header';

    const titleH3 = document.createElement('h3');
    titleH3.innerHTML = '<i class="fas fa-book-open"></i> ';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    titleH3.appendChild(titleSpan);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'markdown-panel-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', () => {
        panel.remove();
    });

    headerDiv.appendChild(titleH3);
    headerDiv.appendChild(closeBtn);

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'markdown-body markdown-body-light';
    bodyDiv.innerHTML = content;

    contentDiv.appendChild(headerDiv);
    contentDiv.appendChild(bodyDiv);
    panel.appendChild(contentDiv);

    document.body.appendChild(panel);

    // 根据当前主题设置样式
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    bodyDiv.className = `markdown-body ${isDark ? 'markdown-body-dark' : 'markdown-body-light'}`;

    // 点击背景关闭
    panel.addEventListener('click', (e) => {
        if (e.target === panel) {
            panel.remove();
        }
    });
};

// ===================== 完整的音乐播放器 =====================
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.playerVisible = false;
        this.hideTimeout = null;
        this.playHistory = []; // 播放历史记录

        this.init();
    }

    async init() {
        await this.loadPlaylist();
        this.setupEventListeners();
        this.setupPlayerVisibility();
    }

    async loadPlaylist() {
        try {
            // 尝试从 API 获取音乐列表
            try {
                const response = await fetch('/api/music');
                if (response.ok) {
                    const data = await response.json();
                    this.playlist = data.files || [];
                    console.log('从API加载音乐列表成功，找到', this.playlist.length, '首歌曲');
                    return;
                }
            } catch (apiError) {
                console.log('API不可用，尝试扫描music目录');
            }

            // 动态扫描 music 目录
            try {
                const htmlText = await fetch('music/').then(r => r.text());
                this.playlist = this.parseMusicFiles(htmlText);
                console.log('扫描music目录成功，找到', this.playlist.length, '首歌曲');
            } catch (scanError) {
                console.warn('扫描music目录失败，使用静态列表:', scanError.message);
                this.playlist = this.getStaticPlaylist();
            }
        } catch (error) {
            console.error('加载播放列表失败:', error);
            this.playlist = this.getStaticPlaylist();
        }
    }

    parseMusicFiles(htmlText) {
        const files = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const links = doc.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.match(/\.(mp3|wav|ogg|m4a)$/i) && !href.includes('../')) {
                const fileName = href;
                const songInfo = this.parseFileName(fileName);
                files.push({
                    name: fileName,
                    path: `music/${fileName}`,
                    title: songInfo.title,
                    artist: songInfo.artist
                });
            }
        });

        return files;
    }

    parseFileName(fileName) {
        // 先尝试解码 URL 编码的文件名
        let decodedName;
        try {
            decodedName = decodeURIComponent(fileName);
        } catch (e) {
            decodedName = fileName;
        }

        // 移除扩展名
        const nameWithoutExt = decodedName.replace(/\.(mp3|wav|ogg|m4a)$/i, '');

        // 按下划线分割文件名
        const parts = nameWithoutExt.split('_');

        // 歌曲名是第一部分
        let title = parts[0] || 'Unknown';

        // 歌手是第二部分（如果存在）
        let artist = parts.length > 1 ? parts[1] : 'Unknown';

        return { title, artist };
    }

    getStaticPlaylist() {
        return [
            {
                name: 'Dear Mr 「F」_ずっと真夜中でいいのに。_潜潜話_320kbps.mp3',
                path: 'music/Dear Mr 「F」_ずっと真夜中でいいのに。_潜潜話_320kbps.mp3',
                title: 'Dear Mr 「F」',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: 'あいつら全員同窓会_ずっと真夜中でいいのに。_Tunes That Stick Vol 18_320kbps.mp3',
                path: 'music/あいつら全員同窓会_ずっと真夜中でいいのに。_Tunes That Stick Vol 18_320kbps.mp3',
                title: 'あいつら全員同窓会',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: 'マイノリティ脈絡_ずっと真夜中でいいのに。_今は今で誓いは笑みで_320kbps.mp3',
                path: 'music/マイノリティ脈絡_ずっと真夜中でいいのに。_今は今で誓いは笑みで_320kbps.mp3',
                title: 'マイノリティ脈絡',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: 'またね幻_ずっと真夜中でいいのに。_今は今で誓いは笑みで_320kbps.mp3',
                path: 'music/またね幻_ずっと真夜中でいいのに。_今は今で誓いは笑みで_320kbps.mp3',
                title: 'またね幻',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: '勘ぐれい_ずっと真夜中でいいのに。_ZUTOMAYO\'s Playlist for Mainland China_320kbps.mp3',
                path: 'music/勘ぐれい_ずっと真夜中でいいのに。_ZUTOMAYO\'s Playlist for Mainland China_320kbps.mp3',
                title: '勘ぐれい',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: '暗く黒く_ずっと真夜中でいいのに。_ZUTOMAYO - 2024 中国特别版_320kbps.mp3',
                path: 'music/暗く黒く_ずっと真夜中でいいのに。_ZUTOMAYO - 2024 中国特别版_320kbps.mp3',
                title: '暗く黒く',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: '正義_ずっと真夜中でいいのに。_今は今で誓いは笑みで_320kbps.mp3',
                path: 'music/正義_ずっと真夜中でいいのに。_今は今で誓いは笑みで_320kbps.mp3',
                title: '正義',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: '残機_ずっと真夜中でいいのに。_TOKYO - VIRAL 2023 -_320kbps.mp3',
                path: 'music/残機_ずっと真夜中でいいのに。_TOKYO - VIRAL 2023 -_320kbps.mp3',
                title: '残機',
                artist: 'ずっと真夜中でいいのに。'
            },
            {
                name: '海馬成長痛_ずっと真夜中でいいのに。_海馬成長痛_320kbps.mp3',
                path: 'music/海馬成長痛_ずっと真夜中でいいのに。_海馬成長痛_320kbps.mp3',
                title: '海馬成長痛',
                artist: 'ずっと真夜中でいいのに。'
            }
        ];
    }

    setupEventListeners() {
        // 顶部播放按钮
        document.getElementById('musicPlayPause').addEventListener('click', () => {
            this.togglePlay();
        });

        // 底部播放器控制按钮
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlay();
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            this.playPrevious();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.playNext();
        });

        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.toggleShuffle();
        });

        document.getElementById('playlistBtn').addEventListener('click', () => {
            this.togglePlaylist();
        });

        document.getElementById('closePlaylist').addEventListener('click', () => {
            this.hidePlaylist();
        });

        // 播放列表面板鼠标事件
        const playlistPanel = document.getElementById('playlistPanel');
        playlistPanel.addEventListener('mouseenter', () => {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
        });

        // 音量滑块
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        // 进度条滑块
        document.getElementById('progressSlider').addEventListener('input', (e) => {
            this.seek(e.target.value);
        });

        // 音频事件
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            this.onSongEnded();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('音频加载错误:', e);
        });
    }

    setupPlayerVisibility() {
        const player = document.getElementById('musicPlayer');
        const playlistPanel = document.getElementById('playlistPanel');

        // 监听鼠标移动到页面底部
        document.addEventListener('mousemove', (e) => {
            if (!this.isPlaying) return;

            // 检查播放列表是否打开
            const isPlaylistOpen = playlistPanel.classList.contains('show');

            // 如果播放列表打开，不隐藏播放器
            if (isPlaylistOpen) {
                return;
            }

            const windowHeight = window.innerHeight;
            const mouseY = e.clientY;

            // 当鼠标接近底部 100px 时显示播放器
            if (mouseY > windowHeight - 100) {
                this.showPlayer();
            } else {
                // 检查鼠标是否在播放器区域
                const playerRect = player.getBoundingClientRect();
                const inPlayer = mouseY >= playerRect.top && mouseY <= playerRect.bottom &&
                                 e.clientX >= playerRect.left && e.clientX <= playerRect.right;

                if (!inPlayer) {
                    this.scheduleHidePlayer();
                }
            }
        });

        // 鼠标进入播放器区域时保持显示
        player.addEventListener('mouseenter', () => {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
        });

        // 鼠标离开播放器区域时，检查播放列表是否打开
        player.addEventListener('mouseleave', () => {
            this.checkShouldHide();
        });
    }

    checkShouldHide() {
        const playlistPanel = document.getElementById('playlistPanel');
        const isPlaylistVisible = playlistPanel.classList.contains('show');

        if (isPlaylistVisible) {
            // 播放列表显示时，不隐藏播放器
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
        } else {
            // 播放列表未显示，可以隐藏播放器
            this.scheduleHidePlayer();
        }
    }

    showPlayer() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        const player = document.getElementById('musicPlayer');
        player.classList.add('visible');
        this.playerVisible = true;
    }

    scheduleHidePlayer() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.hideTimeout = setTimeout(() => {
            this.hidePlayer();
        }, 100);
    }

    hidePlayer() {
        const player = document.getElementById('musicPlayer');
        player.classList.remove('visible');
        this.playerVisible = false;
    }

    togglePlay() {
        if (this.playlist.length === 0) return;

        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.hidePlayer();
        } else {
            if (!this.audio.src) {
                // 第一次播放，随机选择一首歌曲
                const randomIndex = Math.floor(Math.random() * this.playlist.length);
                this.playSong(randomIndex);
            } else {
                this.audio.play();
                this.isPlaying = true;
                this.showPlayer();
            }
        }

        this.updateUI();
    }

    playSong(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentIndex = index;
        const song = this.playlist[index];

        // 添加到播放历史
        this.addToHistory(song);

        this.audio.src = song.path;
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.showPlayer();
            this.updateUI();
        }).catch(error => {
            console.error('播放失败:', error);
        });

        // 更新歌曲信息
        document.getElementById('songTitle').textContent = song.title;
        document.getElementById('songArtist').textContent = song.artist;
    }

    addToHistory(song) {
        // 检查是否已经在历史记录中
        const existingIndex = this.playHistory.findIndex(h => h.path === song.path);
        if (existingIndex !== -1) {
            // 如果已存在，移到最前面
            this.playHistory.splice(existingIndex, 1);
        }
        // 添加到历史记录开头
        this.playHistory.unshift(song);
        // 限制历史记录数量为 20 首
        if (this.playHistory.length > 20) {
            this.playHistory.pop();
        }
        this.renderPlaylist();
    }

    togglePlaylist() {
        const panel = document.getElementById('playlistPanel');
        const isShowing = !panel.classList.contains('show');

        panel.classList.toggle('show');

        if (isShowing) {
            // 打开播放列表时，保持播放器显示
            this.showPlayer();
        }
    }

    hidePlaylist() {
        const panel = document.getElementById('playlistPanel');
        panel.classList.remove('show');
    }

    renderPlaylist() {
        const playlistContent = document.getElementById('playlistContent');
        if (!playlistContent) return;

        if (this.playHistory.length === 0) {
            playlistContent.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">暂无播放记录</div>';
            return;
        }

        playlistContent.innerHTML = '';

        this.playHistory.forEach((song, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';

            // 检查是否是当前播放的歌曲
            // 使用当前播放索引来判断，而不是通过 audio.src 匹配
            const currentSong = this.playlist[this.currentIndex];
            const isCurrentPlaying = currentSong && currentSong.path === song.path;

            if (isCurrentPlaying) {
                item.classList.add('active');
                if (this.isPlaying) {
                    item.classList.add('playing');
                }
            }

            item.innerHTML = `
                <div class="playlist-item-index">${index + 1}</div>
                <div class="playlist-item-icon">
                    <i class="fas ${isCurrentPlaying && this.isPlaying ? 'fa-volume-up' : 'fa-music'}"></i>
                </div>
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${song.title}</div>
                    <div class="playlist-item-artist">${song.artist}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                // 在原始播放列表中找到这首歌的索引
                const originalIndex = this.playlist.findIndex(p => p.path === song.path);
                if (originalIndex !== -1) {
                    this.playSong(originalIndex);
                    // 隐藏播放列表
                    this.hidePlaylist();
                }
            });

            playlistContent.appendChild(item);
        });
    }

    playPrevious() {
        if (this.playlist.length === 0) return;

        let newIndex = this.currentIndex - 1;
        if (newIndex < 0) {
            newIndex = this.playlist.length - 1;
        }

        this.playSong(newIndex);
    }

    playNext() {
        if (this.playlist.length === 0) return;

        let newIndex;
        if (this.isShuffle) {
            do {
                newIndex = Math.floor(Math.random() * this.playlist.length);
            } while (newIndex === this.currentIndex && this.playlist.length > 1);
        } else {
            newIndex = this.currentIndex + 1;
            if (newIndex >= this.playlist.length) {
                newIndex = 0;
            }
        }

        this.playSong(newIndex);
    }

    onSongEnded() {
        this.playNext();
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        const btn = document.getElementById('shuffleBtn');
        btn.classList.toggle('active', this.isShuffle);
    }

    setVolume(value) {
        this.audio.volume = value / 100;
    }

    seek(value) {
        const time = (value / 100) * this.audio.duration;
        this.audio.currentTime = time;
    }

    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressSlider').value = progress;
        document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
    }

    updateTotalTime() {
        document.getElementById('totalTime').textContent = this.formatTime(this.audio.duration);
    }

    updateUI() {
        const topBtn = document.getElementById('musicPlayPause');
        const bottomBtn = document.getElementById('playPauseBtn');

        const icon = this.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        topBtn.innerHTML = icon;
        bottomBtn.innerHTML = icon;
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// 显示热度图面板
AlgorithmBlog.prototype.showHeatmap = function() {
    const heatmapPanel = document.getElementById('heatmapPanel');
    const heatmapOverlay = document.getElementById('heatmapOverlay');
    heatmapPanel.style.display = 'block';
    heatmapOverlay.style.display = 'block';
    this.renderHeatmap();
};

// 隐藏热度图面板
AlgorithmBlog.prototype.hideHeatmap = function() {
    const heatmapPanel = document.getElementById('heatmapPanel');
    const heatmapOverlay = document.getElementById('heatmapOverlay');
    heatmapPanel.style.display = 'none';
    heatmapOverlay.style.display = 'none';
};

// 渲染热度图
AlgorithmBlog.prototype.renderHeatmap = function() {
    const heatmapContent = document.getElementById('heatmapContent');
    heatmapContent.innerHTML = '';

    // 统计每天提交的文件数量
    const dateStats = {};
    this.files.forEach(file => {
        if (file.date && !file.isTemplate && !file.isTemplateFile) {
            if (!dateStats[file.date]) {
                dateStats[file.date] = 0;
            }
            dateStats[file.date]++;
        }
    });

    // 获取所有日期并排序
    const sortedDates = Object.keys(dateStats).sort((a, b) => new Date(a) - new Date(b));

    if (sortedDates.length === 0) {
        heatmapContent.innerHTML = '<div class="no-heatmap-data">暂无活跃数据</div>';
        return;
    }

    // 计算最大文件数量用于热度颜色映射
    const maxFiles = Math.max(...Object.values(dateStats));

    // 获取最早的日期和今天的日期
    const earliestDate = new Date(sortedDates[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 计算显示的日期范围（最近6个月）
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    // 确保起始日期不早于最早的活跃日期
    const startDate = earliestDate < sixMonthsAgo ? sixMonthsAgo : earliestDate;
    startDate.setHours(0, 0, 0, 0);

    // 创建日历网格容器
    const calendarDiv = document.createElement('div');
    calendarDiv.className = 'heatmap-calendar';

    // 添加星期标签
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekLabelsDiv = document.createElement('div');
    weekLabelsDiv.className = 'heatmap-week-labels';
    weekDays.forEach((day, index) => {
        const label = document.createElement('div');
        label.className = 'heatmap-week-label';
        label.textContent = day;
        if (index === 0 || index === 6) {
            label.classList.add('weekend');
        }
        weekLabelsDiv.appendChild(label);
    });
    calendarDiv.appendChild(weekLabelsDiv);

    // 按周分组数据
    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);

    // 找到第一个周日
    const dayOfWeek = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - dayOfWeek);

    // 生成所有周的数据
    while (currentDate <= today || currentWeek.length > 0) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dateStats[dateStr] || 0;
        const level = this.getHeatmapLevel(count, maxFiles);

        currentWeek.push({
            date: dateStr,
            count: count,
            level: level
        });

        // 如果是一周的最后一天，或者已经超过今天，则保存这一周
        if (currentDate.getDay() === 6 || currentDate > today) {
            weeks.push([...currentWeek]);
            currentWeek = [];
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 渲染周网格
    const weeksDiv = document.createElement('div');
    weeksDiv.className = 'heatmap-weeks';

    weeks.forEach(week => {
        const weekDiv = document.createElement('div');
        weekDiv.className = 'heatmap-week';

        week.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'heatmap-day-cell';
            dayDiv.classList.add(`level-${day.level}`);

            if (day.count > 0) {
                dayDiv.title = `${day.date}: ${day.count} 个文件`;
            } else {
                dayDiv.title = `${day.date}: 无活跃`;
            }

            weekDiv.appendChild(dayDiv);
        });

        weeksDiv.appendChild(weekDiv);
    });

    calendarDiv.appendChild(weeksDiv);
    heatmapContent.appendChild(calendarDiv);
};
// 根据文件数量获取热度等级 (0-4)
AlgorithmBlog.prototype.getHeatmapLevel = function(count, maxFiles) {
    if (count === 0) return 0;
    if (maxFiles <= 1) return 1;
    const ratio = count / maxFiles;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
};

// 显示标签统计面板
AlgorithmBlog.prototype.showStatsPanel = function() {
    const statsPanel = document.getElementById('statsPanel');
    const statsOverlay = document.getElementById('statsOverlay');
    statsPanel.style.display = 'block';
    statsOverlay.style.display = 'block';
    this.renderStatsPanel();
};

// 隐藏标签统计面板
AlgorithmBlog.prototype.hideStatsPanel = function() {
    const statsPanel = document.getElementById('statsPanel');
    const statsOverlay = document.getElementById('statsOverlay');
    statsPanel.style.display = 'none';
    statsOverlay.style.display = 'none';
};

// 渲染标签统计面板
AlgorithmBlog.prototype.renderStatsPanel = function() {
    const statsContent = document.getElementById('statsContent');
    statsContent.innerHTML = '';

    // 统计各标签的题目数量
    const tagStats = {
        'dp': { name: '动态规划', count: 0, color: '#48bb78', icon: 'fa-project-diagram' },
        'str': { name: '字符串', count: 0, color: '#ed8936', icon: 'fa-font' },
        'ccpc': { name: 'CCPC竞赛', count: 0, color: '#e53e3e', icon: 'fa-trophy' },
        'trie': { name: '字典树', count: 0, color: '#9f7aea', icon: 'fa-code-branch' }
    };

    // 统计各类型题目数量
    this.files.forEach(file => {
        if (file.tag && tagStats[file.tag]) {
            tagStats[file.tag].count++;
        }
    });

    // 创建统计卡片
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';

    let totalCount = 0;

    Object.keys(tagStats).forEach(tag => {
        const stat = tagStats[tag];
        totalCount += stat.count;

        const statCard = document.createElement('div');
        statCard.className = 'stat-card';
        statCard.style.borderLeft = `4px solid ${stat.color}`;

        statCard.innerHTML = `
            <div class="stat-card-header">
                <i class="fas ${stat.icon}" style="color: ${stat.color}"></i>
                <span class="stat-card-name">${stat.name}</span>
            </div>
            <div class="stat-card-count" style="color: ${stat.color}">${stat.count}</div>
            <div class="stat-card-label">道题目</div>
        `;

        // 点击卡片筛选对应类型的题目
        statCard.addEventListener('click', () => {
            const typeFilter = document.getElementById('typeFilter');
            typeFilter.value = tag;
            this.filterFiles();
            this.hideStatsPanel();
            this.showToast(`已筛选 ${stat.name} 题目`, 'info');
        });

        statsGrid.appendChild(statCard);
    });

    // 添加总览卡片
    const totalCard = document.createElement('div');
    totalCard.className = 'stat-card total-card';
    totalCard.style.borderLeft = '4px solid #667eea';

    totalCard.innerHTML = `
        <div class="stat-card-header">
            <i class="fas fa-tasks" style="color: #667eea"></i>
            <span class="stat-card-name">总计</span>
        </div>
        <div class="stat-card-count" style="color: #667eea">${totalCount}</div>
        <div class="stat-card-label">道题目</div>
    `;

    // 点击总览卡片重置筛选为全部
    totalCard.addEventListener('click', () => {
        const typeFilter = document.getElementById('typeFilter');
        typeFilter.value = '';
        this.filterFiles();
        this.hideStatsPanel();
        this.showToast('已显示全部题目', 'info');
    });

    statsGrid.appendChild(totalCard);

    statsContent.appendChild(statsGrid);
};

// 显示代码行数统计面板
AlgorithmBlog.prototype.showLinesPanel = function() {
    const linesPanel = document.getElementById('linesPanel');
    const linesOverlay = document.getElementById('linesOverlay');
    linesPanel.style.display = 'block';
    linesOverlay.style.display = 'block';
    this.renderLinesPanel();
};

// 隐藏代码行数统计面板
AlgorithmBlog.prototype.hideLinesPanel = function() {
    const linesPanel = document.getElementById('linesPanel');
    const linesOverlay = document.getElementById('linesOverlay');
    linesPanel.style.display = 'none';
    linesOverlay.style.display = 'none';
};

// 渲染代码行数统计面板
AlgorithmBlog.prototype.renderLinesPanel = function() {
    const linesContent = document.getElementById('linesContent');
    linesContent.innerHTML = '<div class="loading">正在统计代码行数...</div>';

    // 按算法类型统计行数
    const lineStats = {
        'dp': { name: '动态规划', count: 0, files: 0, color: '#48bb78', icon: 'fa-project-diagram' },
        'str': { name: '字符串', count: 0, files: 0, color: '#ed8936', icon: 'fa-font' },
        'ccpc': { name: 'CCPC竞赛', count: 0, files: 0, color: '#e53e3e', icon: 'fa-trophy' },
        'trie': { name: '字典树', count: 0, files: 0, color: '#9f7aea', icon: 'fa-code-branch' },
        'template': { name: '模板文件', count: 0, files: 0, color: '#667eea', icon: 'fa-layer-group' }
    };

    // 异步统计行数
    (async () => {
        let totalLines = 0;
        let totalFiles = 0;

        // 统计模板文件行数
        try {
            const templateContent = await this.safeFetch('template.cpp');
            const templateLines = templateContent.split('\n').length;
            lineStats['template'].count = templateLines;
            lineStats['template'].files = 1;
            totalLines += templateLines;
            totalFiles += 1;
        } catch (error) {
            console.warn('无法读取模板文件:', error);
        }

        // 统计各类型题目行数
        const cppFiles = this.files.filter(file =>
            file.path.endsWith('.cpp') &&
            !file.isTemplate &&
            !file.isTemplateFile &&
            file.tag
        );

        for (const file of cppFiles) {
            try {
                const content = await this.safeFetch(file.path);
                const lines = content.split('\n').length;

                if (file.tag && lineStats[file.tag]) {
                    lineStats[file.tag].count += lines;
                    lineStats[file.tag].files += 1;
                }

                totalLines += lines;
                totalFiles += 1;
            } catch (error) {
                console.warn(`无法读取文件 ${file.name}:`, error);
            }
        }

        // 创建统计卡片
        const linesGrid = document.createElement('div');
        linesGrid.className = 'lines-grid';

        Object.keys(lineStats).forEach(key => {
            const stat = lineStats[key];
            if (stat.files > 0) {
                const lineCard = document.createElement('div');
                lineCard.className = 'line-card';
                lineCard.style.borderLeft = `4px solid ${stat.color}`;

                lineCard.innerHTML = `
                    <div class="line-card-header">
                        <i class="fas ${stat.icon}" style="color: ${stat.color}"></i>
                        <span class="line-card-name">${stat.name}</span>
                    </div>
                    <div class="line-card-stats">
                        <div class="line-card-count" style="color: ${stat.color}">${stat.count}</div>
                        <div class="line-card-files">${stat.files} 个文件</div>
                    </div>
                    <div class="line-card-label">代码行数</div>
                `;

                linesGrid.appendChild(lineCard);
            }
        });

        // 添加总览卡片
        const totalCard = document.createElement('div');
        totalCard.className = 'line-card total-line-card';
        totalCard.style.borderLeft = '4px solid #667eea';

        totalCard.innerHTML = `
            <div class="line-card-header">
                <i class="fas fa-chart-line" style="color: #667eea"></i>
                <span class="line-card-name">总计</span>
            </div>
            <div class="line-card-stats">
                <div class="line-card-count" style="color: #667eea">${totalLines}</div>
                <div class="line-card-files">${totalFiles} 个文件</div>
            </div>
            <div class="line-card-label">代码行数</div>
        `;

        linesGrid.appendChild(totalCard);

        linesContent.innerHTML = '';
        linesContent.appendChild(linesGrid);
    })();
};

// ==================== 登录注册功能 ====================

class AuthManager {
    constructor() {
        this.loginModal = document.getElementById('loginModal');
        this.registerModal = document.getElementById('registerModal');
        this.authOverlay = document.getElementById('authOverlay');
        this.loginBtn = document.getElementById('loginBtn');
        this.registerBtn = document.getElementById('registerBtn');
        this.init();
    }

    init() {
        // 绑定打开模态框按钮
        this.loginBtn.addEventListener('click', () => this.openModal('login'));
        this.registerBtn.addEventListener('click', () => this.openModal('register'));

        // 绑定关闭按钮
        document.getElementById('closeLoginModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeRegisterModal').addEventListener('click', () => this.closeModal());
        this.authOverlay.addEventListener('click', () => this.closeModal());

        // 绑定用户菜单模态框
        document.getElementById('closeUserMenuModal').addEventListener('click', () => this.closeUserMenuModal());
        document.getElementById('userMenuOverlay').addEventListener('click', () => this.closeUserMenuModal());

        // 绑定修改用户名模态框
        document.getElementById('closeChangeUsernameModal').addEventListener('click', () => this.closeChangeUsernameModal());
        document.getElementById('changeUsernameOverlay').addEventListener('click', () => this.closeChangeUsernameModal());

        // 绑定修改密码模态框
        document.getElementById('closeChangePasswordModal').addEventListener('click', () => this.closeChangePasswordModal());
        document.getElementById('changePasswordOverlay').addEventListener('click', () => this.closeChangePasswordModal());

        // 绑定用户列表模态框
        const viewUsersBtn = document.getElementById('viewUsers');
        if (viewUsersBtn) {
            viewUsersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openUsersListModal();
            });
        }
        document.getElementById('closeUsersListModal').addEventListener('click', () => this.closeUsersListModal());
        document.getElementById('usersListOverlay').addEventListener('click', () => this.closeUsersListModal());

        // 绑定用户菜单操作按钮
        document.getElementById('changeUsernameBtn').addEventListener('click', () => this.openChangeUsernameModal());
        document.getElementById('changePasswordBtn').addEventListener('click', () => this.openChangePasswordModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // 绑定头像上传
        document.getElementById('avatarUpload').addEventListener('change', (e) => this.handleAvatarUpload(e));

        // 绑定修改用户名表单
        document.getElementById('changeUsernameForm').addEventListener('submit', (e) => this.handleChangeUsername(e));

        // 绑定修改密码表单
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => this.handleChangePassword(e));

        // 绑定切换按钮
        document.querySelector('.switch-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchModal('register');
        });
        document.querySelector('.switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchModal('login');
        });

        // 绑定密码显示/隐藏
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                const icon = btn.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // 绑定登录表单提交
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // 绑定注册表单提交
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));

        // ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // 检查是否已登录
        this.checkLoginStatus();
    }

    openModal(type) {
        this.closeModal();
        setTimeout(() => {
            if (type === 'login') {
                this.loginModal.classList.add('active');
            } else {
                this.registerModal.classList.add('active');
            }
            this.authOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 100);
    }

    closeModal() {
        this.loginModal.classList.remove('active');
        this.registerModal.classList.remove('active');
        this.authOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    switchModal(type) {
        this.loginModal.classList.remove('active');
        this.registerModal.classList.remove('active');
        setTimeout(() => {
            if (type === 'login') {
                this.loginModal.classList.add('active');
            } else {
                this.registerModal.classList.add('active');
            }
        }, 100);
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            rememberMe: document.getElementById('rememberMe').checked
        };

        const submitBtn = form.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // 保存 token
                if (data.rememberMe) {
                    localStorage.setItem('token', result.token);
                } else {
                    sessionStorage.setItem('token', result.token);
                }
                localStorage.setItem('user', JSON.stringify(result.user));

                this.showNotification('登录成功！', 'success');
                this.closeModal();
                this.updateAuthUI(result.user);
            } else {
                this.showNotification(result.message || '登录失败，请检查用户名和密码', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showNotification('登录失败，请稍后重试', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            this.showNotification('两次输入的密码不一致', 'error');
            return;
        }

        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: password
        };

        const submitBtn = form.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('注册成功！请登录', 'success');
                form.reset();
                this.switchModal('login');
            } else {
                this.showNotification(result.message || '注册失败，请稍后重试', 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showNotification('注册失败，请稍后重试', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> 注册';
        }
    }

    checkLoginStatus() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                this.updateAuthUI(user);
            } catch (error) {
                console.error('解析用户信息失败:', error);
            }
        }
    }

    updateAuthUI(user) {
        console.log('updateAuthUI 被调用，用户:', user);
        const authSection = document.querySelector('.auth-section');
        const savedAvatar = localStorage.getItem('userAvatar') || `/api/auth/avatar/${user.id}?t=${Date.now()}`;

        authSection.innerHTML = `
            <div class="user-info clickable" id="userProfileBtn" title="点击查看用户设置">
                <img src="${savedAvatar}" alt="${user.username}" class="user-avatar">
                <span class="user-name">${user.username}</span>
                <i class="fas fa-chevron-down user-dropdown-icon"></i>
            </div>
        `;

        document.getElementById('userProfileBtn').addEventListener('click', () => this.openUserMenu());

        // 显示"查看用户"按钮并绑定事件
        const usersStatItem = document.getElementById('usersStatItem');
        if (usersStatItem) {
            usersStatItem.style.display = 'flex';
            const viewUsersBtn = document.getElementById('viewUsers');
            if (viewUsersBtn) {
                // 移除所有旧的监听器（通过克隆节点）
                const newBtn = viewUsersBtn.cloneNode(true);
                viewUsersBtn.parentNode.replaceChild(newBtn, viewUsersBtn);
                // 添加新的监听器
                newBtn.addEventListener('click', (e) => {
                    console.log('viewUsersBtn 被点击', e);
                    e.preventDefault();
                    e.stopPropagation();
                    this.openUsersListModal();
                });
            }
        }
    }

    openUserMenu() {
        this.showUserMenuModal();
    }

    showUserMenuModal() {
        const userStr = localStorage.getItem('user');

        if (userStr) {
            const user = JSON.parse(userStr);
            const savedAvatar = localStorage.getItem('userAvatar') || `/api/auth/avatar/${user.id}?t=${Date.now()}`;

            document.getElementById('currentUsername').textContent = user.username;
            document.getElementById('currentEmail').textContent = user.email;
            document.getElementById('currentAvatar').src = savedAvatar;
        }

        document.getElementById('userMenuModal').classList.add('active');
        document.getElementById('userMenuOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeUserMenuModal() {
        document.getElementById('userMenuModal').classList.remove('active');
        document.getElementById('userMenuOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    openChangeUsernameModal() {
        this.closeUserMenuModal();
        setTimeout(() => {
            document.getElementById('changeUsernameModal').classList.add('active');
            document.getElementById('changeUsernameOverlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 100);
    }

    closeChangeUsernameModal() {
        document.getElementById('changeUsernameModal').classList.remove('active');
        document.getElementById('changeUsernameOverlay').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('changeUsernameForm').reset();
    }

    openChangePasswordModal() {
        this.closeUserMenuModal();
        setTimeout(() => {
            document.getElementById('changePasswordModal').classList.add('active');
            document.getElementById('changePasswordOverlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 100);
    }

    closeChangePasswordModal() {
        document.getElementById('changePasswordModal').classList.remove('active');
        document.getElementById('changePasswordOverlay').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('changePasswordForm').reset();
    }

    openUsersListModal() {
        console.log('openUsersListModal 被调用');
        const modal = document.getElementById('usersListModal');
        const overlay = document.getElementById('usersListOverlay');
        console.log('模态框元素:', modal, overlay);
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.loadUsersList();
        } else {
            console.error('找不到模态框元素');
        }
    }

    closeUsersListModal() {
        document.getElementById('usersListModal').classList.remove('active');
        document.getElementById('usersListOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    async loadUsersList() {
        console.log('loadUsersList 被调用');
        const container = document.getElementById('usersListContainer');
        console.log('容器元素:', container);
        if (!container) {
            console.error('找不到容器元素');
            return;
        }
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            console.log('Token:', token ? '存在' : '不存在');
            const response = await fetch('/api/auth/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('响应状态:', response.status);
            const result = await response.json();
            console.log('响应数据:', result);

            if (response.ok) {
                this.renderUsersList(result.users);
            } else {
                container.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> ${result.message || '加载失败'}</div>`;
            }
        } catch (error) {
            console.error('加载用户列表错误:', error);
            container.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i> 加载失败，请稍后重试</div>';
        }
    }

    renderUsersList(users) {
        const container = document.getElementById('usersListContainer');

        if (users.length === 0) {
            container.innerHTML = '<div class="empty"><i class="fas fa-user-slash"></i> 暂无注册用户</div>';
            return;
        }

        // 获取当前用户信息，判断是否是管理员
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = currentUser.is_admin === 1;

        const usersListHtml = users.map(user => {
            const createdAt = new Date(user.created_at).toLocaleString('zh-CN');
            const avatarUrl = `/api/auth/avatar/${user.id}?t=${Date.now()}`;
            const isCurrentUser = user.id === currentUser.id;
            const isUserAdmin = user.is_admin === 1;

            // 管理员标识
            const adminBadge = isUserAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> 管理员</span>' : '';

            // 踢出按钮（仅管理员可见，且不能踢出自己和其他管理员）
            const kickButton = isAdmin && !isCurrentUser && !isUserAdmin
                ? `<button class="kick-user-btn" data-user-id="${user.id}" data-username="${user.username}" title="踢出用户">
                        <i class="fas fa-user-minus"></i> 踢出
                   </button>`
                : '';

            return `
                <div class="user-card" data-user-id="${user.id}">
                    <img src="${avatarUrl}" alt="${user.username}" class="user-card-avatar" onerror="this.src='img/head.png'">
                    <div class="user-card-info">
                        <div class="user-card-name">
                            ${user.username}
                            ${adminBadge}
                        </div>
                        <div class="user-card-email">${user.email}</div>
                        <div class="user-card-date"><i class="fas fa-calendar-alt"></i> 注册时间: ${createdAt}</div>
                    </div>
                    ${kickButton}
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="users-count">
                <i class="fas fa-users"></i>
                共 ${users.length} 位注册用户
                ${isAdmin ? '<span class="admin-indicator"><i class="fas fa-shield-alt"></i> 管理员模式</span>' : ''}
            </div>
            <div class="users-list">
                ${usersListHtml}
            </div>
        `;

        // 绑定踢出按钮事件
        if (isAdmin) {
            container.querySelectorAll('.kick-user-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const userId = btn.dataset.userId;
                    const username = btn.dataset.username;
                    this.kickUser(userId, username);
                });
            });
        }
    }

    async kickUser(userId, username) {
        if (!confirm(`确定要踢出用户 "${username}" 吗？此操作不可撤销。`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification(`用户 "${username}" 已被踢出`, 'success');
                // 重新加载用户列表
                this.loadUsersList();
            } else {
                this.showNotification(result.message || '踢出用户失败', 'error');
            }
        } catch (error) {
            console.error('踢出用户错误:', error);
            this.showNotification('踢出用户失败，请稍后重试', 'error');
        }
    }

    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            this.showNotification('请选择图片文件', 'error');
            return;
        }

        // 验证文件大小（最大 2MB）
        if (file.size > 2 * 1024 * 1024) {
            this.showNotification('图片大小不能超过 2MB', 'error');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const avatarData = event.target.result;

                // 先在本地显示预览
                document.getElementById('currentAvatar').src = avatarData;

                // 上传到服务器
                try {
                    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                    const response = await fetch('/api/auth/avatar', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ avatar: avatarData })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // 更新顶部导航栏的头像
                        const userAvatar = document.querySelector('.user-avatar');
                        if (userAvatar) {
                            userAvatar.src = avatarData;
                        }

                        // 保存头像到localStorage作为缓存
                        localStorage.setItem('userAvatar', avatarData);

                        this.showNotification('头像已更新', 'success');
                    } else {
                        this.showNotification(result.message || '头像上传失败', 'error');
                    }
                } catch (uploadError) {
                    console.error('上传头像到服务器失败:', uploadError);
                    this.showNotification('头像上传失败', 'error');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('上传头像失败:', error);
            this.showNotification('上传头像失败', 'error');
        }
    }

    async handleChangeUsername(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const newUsername = formData.get('newUsername');
        const confirmNewUsername = formData.get('confirmNewUsername');

        if (newUsername !== confirmNewUsername) {
            this.showNotification('两次输入的用户名不一致', 'error');
            return;
        }

        const submitBtn = form.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 修改中...';

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('/api/auth/change-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newUsername })
            });

            const result = await response.json();

            if (response.ok) {
                // 更新本地用户信息
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.username = newUsername;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                this.showNotification('用户名修改成功！', 'success');
                this.closeChangeUsernameModal();
                this.updateAuthUI(JSON.parse(localStorage.getItem('user')));
            } else {
                this.showNotification(result.message || '修改用户名失败', 'error');
            }
        } catch (error) {
            console.error('修改用户名错误:', error);
            this.showNotification('修改用户名失败，请稍后重试', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> 保存';
        }
    }

    async handleChangePassword(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmNewPassword = formData.get('confirmNewPassword');

        if (newPassword !== confirmNewPassword) {
            this.showNotification('两次输入的新密码不一致', 'error');
            return;
        }

        if (currentPassword === newPassword) {
            this.showNotification('新密码不能与当前密码相同', 'error');
            return;
        }

        const submitBtn = form.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 修改中...';

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('密码修改成功！', 'success');
                this.closeChangePasswordModal();
            } else {
                this.showNotification(result.message || '修改密码失败', 'error');
            }
        } catch (error) {
            console.error('修改密码错误:', error);
            this.showNotification('修改密码失败，请稍后重试', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> 保存';
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');

        const authSection = document.querySelector('.auth-section');
        authSection.innerHTML = `
            <button class="auth-btn" id="loginBtn">
                <i class="fas fa-sign-in-alt"></i>
                <span>登录</span>
            </button>
            <button class="auth-btn auth-btn-primary" id="registerBtn">
                <i class="fas fa-user-plus"></i>
                <span>注册</span>
            </button>
        `;

        // 重新绑定事件
        document.getElementById('loginBtn').addEventListener('click', () => this.openModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => this.openModal('register'));

        // 隐藏"查看用户"按钮
        const usersStatItem = document.getElementById('usersStatItem');
        if (usersStatItem) {
            usersStatItem.style.display = 'none';
        }

        this.showNotification('已退出登录', 'success');
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            animation: slideIn 0.3s ease;
        `;

        // 添加动画样式
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// 初始化认证管理器
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});