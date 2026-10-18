const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(express.json());
app.use(express.static(__dirname));

// ===================== DATABASE =====================
function loadDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initial = {
            users: [
                { id: 0, username: 'RW', password: 'RW.RCON912398%#$#', email: 'rw@reallyworld.com', role: 'superadmin', banned: false, banReason: '', banExpires: null, createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString() },
                { id: 1, username: 'Admin', password: 'admin123', email: 'admin@reallyworld.com', role: 'admin', banned: false, banReason: '', banExpires: null, createdAt: new Date('2026-01-01').toISOString() },
                { id: 2, username: 'Moderator', password: 'mod123', email: 'mod@reallyworld.com', role: 'moderator', banned: false, banReason: '', banExpires: null, createdAt: new Date('2026-02-01').toISOString() },
                { id: 3, username: 'BannedUser', password: 'ban123', email: 'banned@test.com', role: 'user', banned: true, banReason: 'Нарушение правил', banExpires: new Date('2027-01-01').toISOString(), createdAt: new Date('2026-03-01').toISOString() }
            ],
            messages: [],
            rooms: [
                { id: 'general', name: 'Общий', icon: '🌍', createdAt: new Date().toISOString() },
                { id: 'off-topic', name: 'Флудилка', icon: '💭', createdAt: new Date().toISOString() },
                { id: 'memes', name: 'Мемы', icon: '😂', createdAt: new Date().toISOString() },
                { id: 'help', name: 'Помощь', icon: '❓', createdAt: new Date().toISOString() }
            ],
            forumSections: [
                { id: 1, title: 'Новости', description: 'Объявления и новости платформы', icon: '📢' },
                { id: 2, title: 'FAQ', description: 'Часто задаваемые вопросы', icon: '❓' },
                { id: 3, title: 'Общение', description: 'Свободное общение', icon: '💬' },
                { id: 4, title: 'Жалобы', description: 'Жалобы на пользователей', icon: '🛡' },
                { id: 5, title: 'Идеи', description: 'Предложения по развитию', icon: '💡' },
                { id: 6, title: 'Творчество', description: 'Творческие работы и арт', icon: '🎨' }
            ],
            forumTopics: [],
            forumPosts: [],
            bans: [],
            nextId: { user: 4, message: 1, topic: 1, post: 1, ban: 1 }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ===================== AUTH MIDDLEWARE =====================
function requireAuth(req, res, next) {
    const token = req.headers.authorization;
    if (!token || token !== 'RW.RCON912398%#$#') {
        return res.status(401).json({ error: 'Доступ запрещён. Нужен токен RW.' });
    }
    next();
}

// ===================== API ROUTES =====================

// GET /api/stats - Статистика
app.get('/api/stats', (req, res) => {
    const db = loadDB();
    res.json({
        users: db.users.length,
        messages: db.messages.length,
        topics: db.forumTopics.length,
        bans: db.bans.length
    });
});

// GET /api/users - Все пользователи
app.get('/api/users', requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.users);
});

// POST /api/users/:id/role - Сменить роль
app.post('/api/users/:id/role', requireAuth, (req, res) => {
    const db = loadDB();
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.role === 'superadmin') return res.status(403).json({ error: 'Нельзя сменить роль владельца' });
    user.role = role;
    saveDB(db);
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
});

// POST /api/users/:id/ban - Забанить
app.post('/api/users/:id/ban', requireAuth, (req, res) => {
    const db = loadDB();
    const userId = parseInt(req.params.id);
    const { reason, type } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.role === 'superadmin') return res.status(403).json({ error: 'Нельзя забанить владельца' });
    
    user.banned = true;
    user.banReason = reason;
    user.banExpires = type === 'forever' ? null : new Date(Date.now() + (parseInt(type)) * 86400000).toISOString();
    
    const nextId = db.nextId.ban++;
    db.bans.push({
        id: nextId,
        userId: user.id,
        username: user.username,
        reason,
        type,
        createdAt: new Date().toISOString(),
        expires: user.banExpires,
        bannedBy: 'Console'
    });
    saveDB(db);
    res.json({ success: true, message: `${user.username} забанен: ${reason}` });
});

// POST /api/users/:id/unban - Разбанить
app.post('/api/users/:id/unban', requireAuth, (req, res) => {
    const db = loadDB();
    const userId = parseInt(req.params.id);
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    user.banned = false;
    user.banReason = '';
    user.banExpires = null;
    saveDB(db);
    res.json({ success: true, message: `${user.username} разбанен` });
});

// DELETE /api/users/:id - Удалить пользователя
app.delete('/api/users/:id', requireAuth, (req, res) => {
    const db = loadDB();
    const userId = parseInt(req.params.id);
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    if (user.role === 'superadmin') return res.status(403).json({ error: 'Нельзя удалить владельца' });
    
    db.users = db.users.filter(u => u.id !== userId);
    saveDB(db);
    res.json({ success: true, message: `${user.username} удалён` });
});

// GET /api/messages - Сообщения чата
app.get('/api/messages', requireAuth, (req, res) => {
    const db = loadDB();
    const room = req.query.room;
    let msgs = room ? db.messages.filter(m => m.roomId === room) : db.messages;
    msgs = msgs.slice(-200).reverse();
    res.json(msgs);
});

// POST /api/messages - Отправить сообщение
app.post('/api/messages', requireAuth, (req, res) => {
    const db = loadDB();
    const { userId, username, roomId, message } = req.body;
    const nextId = db.nextId.message++;
    db.messages.push({
        id: nextId,
        userId,
        username,
        roomId,
        message,
        role: 'superadmin',
        timestamp: new Date().toISOString()
    });
    saveDB(db);
    res.json({ success: true });
});

// DELETE /api/messages - Удалить сообщения комнаты
app.delete('/api/messages/:room', requireAuth, (req, res) => {
    const db = loadDB();
    const room = req.params.room;
    db.messages = db.messages.filter(m => m.roomId !== room);
    saveDB(db);
    res.json({ success: true, message: `Чат "${room}" очищен` });
});

// GET /api/rooms - Комнаты
app.get('/api/rooms', requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.rooms);
});

// POST /api/rooms - Создать комнату
app.post('/api/rooms', requireAuth, (req, res) => {
    const db = loadDB();
    const { name, icon } = req.body;
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (db.rooms.find(r => r.id === id)) return res.status(400).json({ error: 'Комната уже существует' });
    db.rooms.push({ id, name, icon: icon || '🎮', createdAt: new Date().toISOString() });
    saveDB(db);
    res.json({ success: true });
});

// DELETE /api/rooms/:id - Удалить комнату
app.delete('/api/rooms/:id', requireAuth, (req, res) => {
    const db = loadDB();
    const id = req.params.id;
    if (id === 'general') return res.status(403).json({ error: 'Нельзя удалить общую комнату' });
    db.rooms = db.rooms.filter(r => r.id !== id);
    db.messages = db.messages.filter(m => m.roomId !== id);
    saveDB(db);
    res.json({ success: true });
});

// GET /api/forum/sections - Разделы форума
app.get('/api/forum/sections', requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.forumSections);
});

// GET /api/forum/topics/:sectionId - Темы раздела
app.get('/api/forum/topics/:sectionId', requireAuth, (req, res) => {
    const db = loadDB();
    const sectionId = parseInt(req.params.sectionId);
    const topics = db.forumTopics.filter(t => t.sectionId === sectionId);
    res.json(topics);
});

// POST /api/forum/topics - Создать тему
app.post('/api/forum/topics', requireAuth, (req, res) => {
    const db = loadDB();
    const { sectionId, title, userId, username, content } = req.body;
    const nextTopic = db.nextId.topic++;
    const nextPost = db.nextId.post++;
    
    db.forumTopics.push({
        id: nextTopic,
        sectionId,
        title,
        userId,
        username,
        createdAt: new Date().toISOString(),
        views: 0,
        replies: 0
    });
    
    db.forumPosts.push({
        id: nextPost,
        topicId: nextTopic,
        userId,
        username,
        role: 'superadmin',
        content,
        timestamp: new Date().toISOString()
    });
    
    saveDB(db);
    res.json({ success: true, topicId: nextTopic });
});

// GET /api/forum/posts/:topicId - Сообщения темы
app.get('/api/forum/posts/:topicId', requireAuth, (req, res) => {
    const db = loadDB();
    const topicId = parseInt(req.params.topicId);
    const posts = db.forumPosts.filter(p => p.topicId === topicId);
    res.json(posts);
});

// POST /api/forum/posts/:topicId - Ответ в тему
app.post('/api/forum/posts/:topicId', requireAuth, (req, res) => {
    const db = loadDB();
    const topicId = parseInt(req.params.topicId);
    const { userId, username, content } = req.body;
    const nextPost = db.nextId.post++;
    
    db.forumPosts.push({
        id: nextPost,
        topicId,
        userId,
        username,
        role: 'superadmin',
        content,
        timestamp: new Date().toISOString()
    });
    
    const topic = db.forumTopics.find(t => t.id === topicId);
    if (topic) {
        topic.replies = (topic.replies || 0) + 1;
    }
    
    saveDB(db);
    res.json({ success: true });
});

// GET /api/bans - Все баны
app.get('/api/bans', requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.bans);
});

// DELETE /api/bans/:id - Удалить бан
app.delete('/api/bans/:id', requireAuth, (req, res) => {
    const db = loadDB();
    const banId = parseInt(req.params.id);
    db.bans = db.bans.filter(b => b.id !== banId);
    saveDB(db);
    res.json({ success: true });
});

// ===================== LOGIN =====================
app.post('/api/login', (req, res) => {
    const { token } = req.body;
    if (token === 'RW.RCON912398%#$#') {
        res.json({ success: true, role: 'superadmin' });
    } else {
        res.status(401).json({ error: 'Неверный токен' });
    }
});

// Serve console
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'console.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`  🎮 RW Console API running on port ${PORT}`);
    console.log(`  🌐 Open: http://localhost:${PORT}`);
    console.log(`  🔑 Token: RW.RCON912398%#$#`);
    console.log(`===========================================\n`);
});
