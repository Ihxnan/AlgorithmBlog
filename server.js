const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// avatars目录静态文件服务（用于头像）
app.use('/avatars', express.static(path.join(__dirname, 'avatars')));

// 初始化数据库
const db = new Database(path.join(__dirname, 'database.sqlite'));

// 创建用户表（添加 is_admin 字段）
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// 检查并添加 is_admin 字段（如果表已存在但没有该字段）
try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`);
} catch (e) {
    // 字段已存在，忽略错误
}

// 设置第一个用户为管理员
const firstUser = db.prepare('SELECT id FROM users LIMIT 1').get();
if (firstUser) {
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(firstUser.id);
}

// 创建验证码表
db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// 定期清理过期验证码
setInterval(() => {
    db.prepare("DELETE FROM verification_codes WHERE expires_at < datetime('now')").run();
}, 5 * 60 * 1000); // 每5分钟清理一次

// 邮件发送器配置
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

// 生成6位验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码邮件
async function sendVerificationEmail(email, code) {
    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: '算法日常 - 邮箱验证码',
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #667eea;">算法日常 - 邮箱验证</h2>
                <p>您好，</p>
                <p>您正在注册算法日常账号，您的验证码是：</p>
                <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                    ${code}
                </div>
                <p>验证码有效期为 5 分钟，请尽快使用。</p>
                <p>如果这不是您的操作，请忽略此邮件。</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    此邮件由系统自动发送，请勿回复。<br>
                    Algorithm Blog - 算法日常
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

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

// 管理员验证中间件
const requireAdmin = (req, res, next) => {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.user.id);
    if (!user || !user.is_admin) {
        return res.status(403).json({ message: '需要管理员权限' });
    }
    next();
};

// ==================== 认证相关 API ====================

// 发送验证码
app.post('/api/auth/send-code', async (req, res) => {
    try {
        const { email, type = 'register' } = req.body;

        // 验证邮箱格式
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: '请输入有效的邮箱地址' });
        }

        // 检查邮箱是否已被注册（注册时）
        if (type === 'register') {
            const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
            if (existingUser) {
                return res.status(409).json({ message: '该邮箱已被注册' });
            }
        }

        // 检查是否频繁发送（1分钟内只能发送一次）
        const recentCode = db.prepare(
            "SELECT created_at FROM verification_codes WHERE email = ? AND type = ? AND created_at > datetime('now', '-1 minute')"
        ).get(email, type);

        if (recentCode) {
            return res.status(429).json({ message: '验证码发送过于频繁，请稍后再试' });
        }

        // 生成验证码
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

        // 保存验证码到数据库
        db.prepare(
            'INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
        ).run(email, code, type, expiresAt.toISOString());

        // 发送邮件
        await sendVerificationEmail(email, code);

        res.json({ message: '验证码已发送到您的邮箱，请查收' });
    } catch (error) {
        console.error('发送验证码错误:', error);
        res.status(500).json({ message: '发送验证码失败，请稍后重试' });
    }
});

// 用户注册
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, verificationCode } = req.body;

        // 验证输入
        if (!username || !email || !password || !verificationCode) {
            return res.status(400).json({ message: '请填写所有必填字段' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ message: '用户名长度必须在3-20个字符之间' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: '密码长度至少为6个字符' });
        }

        // 验证邮箱格式
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: '请输入有效的邮箱地址' });
        }

        // 验证验证码
        const validCode = db.prepare(
            "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = 'register' AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
        ).get(email, verificationCode);

        if (!validCode) {
            return res.status(400).json({ message: '验证码无效或已过期' });
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

        // 删除已使用的验证码
        db.prepare('DELETE FROM verification_codes WHERE email = ? AND code = ?').run(email, verificationCode);

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
                email: user.email,
                is_admin: user.is_admin
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
                email: user.email,
                is_admin: user.is_admin
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

// 修改密码
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 验证输入
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: '请填写所有必填字段' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: '新密码长度至少为6个字符' });
        }

        // 获取用户信息
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }

        // 验证当前密码
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '当前密码错误' });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(hashedPassword, req.user.id);

        res.json({ message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
});

// 修改用户名
app.post('/api/auth/change-username', authenticateToken, (req, res) => {
    try {
        const { newUsername } = req.body;

        // 验证输入
        if (!newUsername) {
            return res.status(400).json({ message: '请填写新用户名' });
        }

        if (newUsername.length < 3 || newUsername.length > 20) {
            return res.status(400).json({ message: '用户名长度必须在3-20个字符之间' });
        }

        // 检查新用户名是否已被使用
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?')
            .get(newUsername, req.user.id);
        if (existingUser) {
            return res.status(409).json({ message: '该用户名已被使用' });
        }

        // 更新用户名
        db.prepare('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(newUsername, req.user.id);

        // 生成新的 JWT token
        const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.user.id);
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
            message: '用户名修改成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('修改用户名错误:', error);
        res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
});

// 上传头像
app.post('/api/auth/avatar', authenticateToken, (req, res) => {
    try {
        const { avatar } = req.body;

        // 验证输入
        if (!avatar) {
            return res.status(400).json({ message: '请提供头像数据' });
        }

        // 验证是否是base64图片数据
        if (!avatar.startsWith('data:image/')) {
            return res.status(400).json({ message: '头像格式不正确' });
        }

        // 创建头像目录
        const avatarDir = path.join(__dirname, 'avatars');
        if (!fs.existsSync(avatarDir)) {
            fs.mkdirSync(avatarDir, { recursive: true });
        }

        // 生成文件名（使用用户ID）
        const ext = avatar.split(';')[0].split('/')[1];
        const fileName = `user_${req.user.id}.${ext}`;
        const filePath = path.join(avatarDir, fileName);

        // 保存图片文件
        const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, base64Data, 'base64');

        // 更新用户头像路径
        db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(`avatars/${fileName}`, req.user.id);

        res.json({
            message: '头像上传成功',
            avatar: `avatars/${fileName}`
        });
    } catch (error) {
        console.error('上传头像错误:', error);
        res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
});

// 获取用户头像
app.get('/api/auth/avatar/:userId', (req, res) => {
    try {
        const user = db.prepare('SELECT avatar FROM users WHERE id = ?').get(req.params.userId);

        if (!user || !user.avatar) {
            // 如果没有自定义头像，返回默认头像
            return res.sendFile(path.join(__dirname, 'img', 'head.png'));
        }

        const avatarPath = path.join(__dirname, user.avatar);
        if (!fs.existsSync(avatarPath)) {
            return res.sendFile(path.join(__dirname, 'img', 'head.png'));
        }

        res.sendFile(avatarPath);
    } catch (error) {
        console.error('获取头像错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取所有用户列表（需要认证）
app.get('/api/auth/users', authenticateToken, (req, res) => {
    try {
        const users = db.prepare('SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC').all();
        res.json({ users });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 踢出用户（需要管理员权限）
app.delete('/api/auth/users/:userId', authenticateToken, requireAdmin, (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        // 不能踢出自己
        if (userId === req.user.id) {
            return res.status(400).json({ message: '不能踢出自己' });
        }

        // 不能踢出其他管理员
        const targetUser = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId);
        if (!targetUser) {
            return res.status(404).json({ message: '用户不存在' });
        }
        if (targetUser.is_admin) {
            return res.status(403).json({ message: '不能踢出管理员' });
        }

        // 删除用户
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        res.json({ message: '用户已被踢出' });
    } catch (error) {
        console.error('踢出用户错误:', error);
        res.status(500).json({ message: '服务器错误' });
    }
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
            const nameWithoutExt = fileName.replace(/\.(mp3|wav|ogg|m4a)$/i, '');

            let artist = 'Unknown';
            let title = nameWithoutExt;

            // 优先使用 " - " 分隔（格式：Artist - SongName）
            if (nameWithoutExt.includes(' - ')) {
                const parts = nameWithoutExt.split(' - ');
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
            }
            // 其次使用 "_" 分隔（格式：SongName_Artist_Extra）
            else if (nameWithoutExt.includes('_')) {
                const parts = nameWithoutExt.split('_');
                title = parts[0].trim();

                // 歌手是第二部分，但需要去掉最后的额外信息（如 _320kbps）
                if (parts.length >= 2) {
                    // 提取歌手部分（从第二部分开始，但去掉最后的数字/比特率信息）
                    let artistParts = parts.slice(1);

                    // 移除最后的额外信息（如 "320kbps", "Tunes That Stick Vol 18" 等）
                    // 如果最后一部分包含数字或kbps，则移除
                    const lastPart = artistParts[artistParts.length - 1];
                    if (/\d+kbps/i.test(lastPart) || /^Tunes|^Playlist|^ZUTOMAYO/i.test(lastPart)) {
                        artistParts.pop();
                    }

                    artist = artistParts.join('_').trim();
                }
            }

            return {
                name: fileName,
                path: `music/${fileName}`,
                title: title || 'Unknown',
                artist: artist || 'Unknown'
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

// 提取音乐封面
app.get('/api/music/cover/:filename', (req, res) => {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(__dirname, 'music', filename);

    console.log('提取封面请求:', filename);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.log('文件不存在:', filePath);
        return res.status(404).json({ error: '文件不存在' });
    }

    try {
        const buffer = fs.readFileSync(filePath);

        // 检查是否为 ID3v2 格式
        if (buffer.length < 10 || buffer.toString('ascii', 0, 3) !== 'ID3') {
            console.log('非 ID3v2 格式');
            return res.status(404).json({ error: '无封面信息' });
        }

        // 读取 ID3v2 标签大小
        const id3Size = buffer.readUInt32BE(6);
        const syncedSize = (id3Size & 0x7F) |
                           ((id3Size >> 1) & 0x3F80) |
                           ((id3Size >> 2) & 0x1FC000) |
                           ((id3Size >> 3) & 0x0FE00000);

        console.log('ID3 标签大小:', syncedSize, '文件大小:', buffer.length);

        // 读取 ID3v2 标签数据
        const id3Data = buffer.slice(10, 10 + syncedSize);

        // 查找 APIC 帧（附加图片）
        const apicIndex = id3Data.indexOf('APIC');

        if (apicIndex === -1) {
            console.log('未找到 APIC 帧');
            return res.status(404).json({ error: '无封面信息' });
        }

        console.log('找到 APIC 帧在位置:', apicIndex);

        // 解析 APIC 帧
        let offset = apicIndex + 4; // 跳过 'APIC'

        // 检查是否超出边界
        if (offset + 6 > id3Data.length) {
            console.log('APIC 帧数据不足');
            return res.status(500).json({ error: 'APIC 帧格式错误' });
        }

        // 读取帧大小
        const frameSize = (id3Data[offset] << 24) |
                         (id3Data[offset + 1] << 16) |
                         (id3Data[offset + 2] << 8) |
                         id3Data[offset + 3];
        offset += 4;

        console.log('帧大小:', frameSize);

        // 跳过标志
        offset += 2;

        // 跳过 MIME 类型
        const mimeEnd = id3Data.indexOf(0, offset);
        if (mimeEnd === -1) {
            console.log('未找到 MIME 类型结束符');
            return res.status(500).json({ error: 'MIME 类型格式错误' });
        }
        const mimeType = id3Data.toString('ascii', offset, mimeEnd);
        offset = mimeEnd + 1;

        console.log('MIME 类型:', mimeType);

        // 跳过图片类型
        offset += 1;

        // 跳过描述
        const descEnd = id3Data.indexOf(0, offset);
        if (descEnd === -1) {
            console.log('未找到描述结束符');
            return res.status(500).json({ error: '描述格式错误' });
        }
        offset = descEnd + 1;

        // 计算图片数据大小
        const remainingSize = id3Data.length - offset;
        const imageSize = Math.min(frameSize - (offset - apicIndex - 10), remainingSize);

        console.log('图片数据大小:', imageSize);

        // 读取图片数据
        const imageData = id3Data.slice(offset, offset + imageSize);

        if (imageData.length === 0) {
            console.log('图片数据为空');
            return res.status(500).json({ error: '图片数据为空' });
        }

        // 根据 MIME 类型设置 Content-Type
        let contentType = 'image/jpeg';
        if (mimeType === 'image/png') {
            contentType = 'image/png';
        } else if (mimeType === 'image/gif') {
            contentType = 'image/gif';
        }

        console.log('返回封面图片，大小:', imageData.length, '类型:', contentType);

        // 设置缓存头（24小时）
        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400'
        });

        res.send(imageData);

    } catch (error) {
        console.error('提取封面失败:', error);
        res.status(500).json({ error: '提取封面失败' });
    }
});

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
