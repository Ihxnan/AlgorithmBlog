const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 初始化数据库
const db = new Database(path.join(__dirname, 'database.sqlite'));

// 创建用户表
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// JWT 验证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '无效的认证令牌' });
        }
        req.user = user;
        next();
    });
};

// ==================== 认证相关 API ====================

// 用户注册
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({ message: '请填写所有必填字段' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ message: '用户名长度必须在3-20个字符之间' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: '密码长度至少为6个字符' });
        }

        // 检查用户名是否已存在
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existingUser) {
            return res.status(409).json({ message: '用户名或邮箱已被注册' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 插入用户
        const result = db.prepare(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
        ).run(username, email, hashedPassword);

        res.status(201).json({
            message: '注册成功',
            user: {
                id: result.lastInsertRowid,
                username,
                email
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({ message: '请填写用户名和密码' });
        }

        // 查找用户
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 生成 JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
        return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ user });
});

// ==================== 文件相关 API ====================

// 获取文件列表
app.get('/api/files', (req, res) => {
    try {
        const algorithmTypes = ['dp', 'str', 'ccpc', 'trie'];
        const files = [];

        // 扫描根目录的 cpp 文件（如 template.cpp）
        const rootFiles = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.cpp') && !file.startsWith('.'))
            .sort();

        for (const file of rootFiles) {
            const filePath = path.join(__dirname, file);
            const stats = fs.statSync(filePath);

            files.push({
                name: file.replace('.cpp', ''),
                path: file,
                type: 'template',
                date: 'root',
                size: stats.size,
                modified: stats.mtime
            });
        }

        // 扫描 template 目录
        const templatePath = path.join(__dirname, 'template');
        if (fs.existsSync(templatePath)) {
            const templateFiles = fs.readdirSync(templatePath)
                .filter(file => file.endsWith('.cpp') || file.endsWith('.md'))
                .sort();

            for (const file of templateFiles) {
                const filePath = path.join(templatePath, file);
                const stats = fs.statSync(filePath);

                files.push({
                    name: file.replace(/\.(cpp|md)$/, ''),
                    path: `template/${file}`,
                    type: 'template',
                    date: 'template',
                    size: stats.size,
                    modified: stats.mtime
                });
            }
        }

        // 扫描算法类型目录
        for (const type of algorithmTypes) {
            const typePath = path.join(__dirname, type);
            if (!fs.existsSync(typePath)) continue;

            const dateDirs = fs.readdirSync(typePath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .sort((a, b) => b.name.localeCompare(a.name));

            for (const dateDir of dateDirs) {
                const datePath = path.join(typePath, dateDir.name);
                const cppFiles = fs.readdirSync(datePath)
                    .filter(file => file.endsWith('.cpp'))
                    .sort();

                for (const file of cppFiles) {
                    const filePath = path.join(datePath, file);
                    const stats = fs.statSync(filePath);

                    files.push({
                        name: file.replace('.cpp', ''),
                        path: `${type}/${dateDir.name}/${file}`,
                        type: type,
                        date: dateDir.name,
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            }
        }

        res.json(files);
    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({ message: '获取文件列表失败' });
    }
});

// 获取文件内容
app.get('/api/files/*', (req, res) => {
    try {
        const filePath = req.params[0];
        const fullPath = path.join(__dirname, filePath);

        // 安全检查：确保文件在项目目录内
        const normalizedPath = path.normalize(fullPath);
        if (!normalizedPath.startsWith(path.normalize(__dirname))) {
            return res.status(403).json({ message: '无权访问该文件' });
        }

        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: '文件不存在' });
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        const stats = fs.statSync(fullPath);

        res.json({
            content,
            size: stats.size,
            modified: stats.mtime
        });
    } catch (error) {
        console.error('读取文件错误:', error);
        res.status(500).json({ message: '读取文件失败' });
    }
});

// 获取音乐列表
app.get('/api/music', (req, res) => {
    try {
        const musicPath = path.join(__dirname, 'music');
        if (!fs.existsSync(musicPath)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(musicPath)
            .filter(file => /\.(mp3|wav|ogg|m4a)$/i.test(file))
            .sort();

        const musicFiles = files.map(file => {
            const fileName = file;
            return {
                name: fileName,
                path: `music/${fileName}`,
                title: fileName.replace(/\.(mp3|wav|ogg|m4a)$/i, '')
            };
        });

        res.json({ files: musicFiles });
    } catch (error) {
        console.error('获取音乐列表错误:', error);
        res.status(500).json({ message: '获取音乐列表失败' });
    }
});

// 获取不务正业目录下的 Markdown 文件列表
app.get('/api/memos', (req, res) => {
    try {
        const memoPath = path.join(__dirname, '不务正业');
        if (!fs.existsSync(memoPath)) {
            return res.json({ files: [] });
        }

        const files = fs.readdirSync(memoPath)
            .filter(file => file.endsWith('.md'))
            .sort();

        const memoFiles = files.map(file => {
            const filePath = path.join(memoPath, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                path: `不务正业/${file}`,
                size: stats.size,
                modified: stats.mtime
            };
        });

        res.json({ files: memoFiles });
    } catch (error) {
        console.error('获取笔记列表错误:', error);
        res.status(500).json({ message: '获取笔记列表失败' });
    }
});

// ==================== 其他路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ message: 'API 端点不存在' });
    } else {
        // 对于非 API 请求，返回 index.html（支持前端路由）
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Algorithm Blog 服务器已启动`);
    console.log(`📝 端口: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`========================================\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n正在关闭服务器...');
    db.close();
    process.exit(0);
});
