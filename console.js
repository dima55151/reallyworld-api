const https = require('https');

const API_URL = 'https://rw-seho.onrender.com';
const TOKEN = 'RW.RCON912398%#$#';

// ===== COLOR CODES =====
const C = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

function clr(code) { return code + C.reset; }
function err(msg) { console.log(clr(`${C.red}✗ ${C.white}${msg}`)); }
function ok(msg) { console.log(clr(`${C.green}✓ ${C.white}${msg}`)); }
function info(msg) { console.log(clr(`${C.cyan}i ${C.white}${msg}`)); }
function cmd(msg) { console.log(clr(`${C.yellow}> ${C.white}${msg}`)); }

// ===== API REQUEST =====
function apiRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, API_URL);
        const data = body ? JSON.stringify(body) : null;

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: method,
            headers: {
                'Authorization': TOKEN,
                'Content-Type': 'application/json',
                'Content-Length': data ? Buffer.byteLength(data) : 0
            }
        };

        const req = https.request(options, res => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch {
                    resolve(responseData);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// ===== COMMANDS =====
const commands = {
    // --- INFO ---
    help: {
        desc: 'Показать список команд',
        run: () => {
            console.log('');
            console.log(clr(`${C.bold}${C.cyan}══════════════════════════════════════${C.reset}`));
            console.log(clr(`${C.bold}${C.cyan}  RW CONSOLE — Команды${C.reset}`));
            console.log(clr(`${C.bold}${C.cyan}══════════════════════════════════════${C.reset}`));
            console.log('');
            console.log(clr(`${C.bold}Информация:${C.reset}`));
            console.log(`  ${C.green}stats${C.white}              — Статистика сайта`);
            console.log(`  ${C.green}users${C.white}              — Список пользователей`);
            console.log(`  ${C.green}bans${C.white}               — Список банов`);
            console.log('');
            console.log(clr(`${C.bold}Управление пользователями:${C.reset}`));
            console.log(`  ${C.green}ban @user "причина" [1d|7d|30d|forever]${C.white} — Забанить`);
            console.log(`  ${C.green}unban @user${C.white}                          — Разбанить`);
            console.log(`  ${C.green}setrole @user [admin|mod|user]${C.white}         — Сменить роль`);
            console.log(`  ${C.green}delete @user${C.white}                         — Удалить`);
            console.log('');
            console.log(clr(`${C.bold}Чат:${C.reset}`));
            console.log(`  ${C.green}msg #room "текст"${C.white}                    — Написать в чат`);
            console.log(`  ${C.green}msgs #room${C.white}                           — Последние сообщения`);
            console.log(`  ${C.green}clear #room${C.white}                          — Очистить комнату`);
            console.log(`  ${C.green}rooms${C.white}                                — Список комнат`);
            console.log('');
            console.log(clr(`${C.bold}Форум:${C.reset}`));
            console.log(`  ${C.green}topic #section "заголовок" "текст"${C.white}     — Создать тему`);
            console.log('');
            console.log(clr(`${C.bold}Прочее:${C.reset}`));
            console.log(`  ${C.green}clear${C.white}             — Очистить экран`);
            console.log(`  ${C.green}exit${C.white}              — Выйти`);
            console.log('');
        }
    },

    stats: {
        desc: 'Показать статистику',
        run: async () => {
            try {
                const data = await apiRequest('GET', '/api/stats');
                console.log('');
                console.log(clr(`${C.bold}${C.cyan}┌── Статистика RW ──┐${C.reset}`));
                console.log(clr(`${C.cyan}│${C.reset} ${C.bold}Пользователи:${C.white} ${data.users}`));
                console.log(clr(`${C.cyan}│${C.reset} ${C.bold}Сообщения:${C.white} ${data.messages}`));
                console.log(clr(`${C.cyan}│${C.reset} ${C.bold}Темы:${C.white} ${data.topics}`));
                console.log(clr(`${C.cyan}│${C.reset} ${C.bold}Банов:${C.white} ${data.bans}`));
                console.log(clr(`${C.cyan}└────────────────────┘${C.reset}`));
                console.log('');
            } catch { err('Не удалось загрузить статистику'); }
        }
    },

    users: {
        desc: 'Список пользователей',
        run: async () => {
            try {
                const users = await apiRequest('GET', '/api/users');
                console.log('');
                users.forEach(u => {
                    const status = u.banned ? clr(`${C.red}⛔ ЗАБАНЕН`) : clr(`${C.green}✓`);
                    const roleBadge = u.role === 'superadmin' ? clr(`${C.yellow}👑 OWNER`) :
                                      u.role === 'admin' ? clr(`${C.red}ADMIN`) :
                                      u.role === 'moderator' ? clr(`${C.yellow}MOD`) :
                                      clr(`${C.green}USER`);
                    console.log(`  ${C.white}${u.id}${C.gray} │ ${C.bold}${u.username}${C.gray} │ ${roleBadge} │ ${status}`);
                });
                console.log('');
            } catch { err('Не удалось загрузить пользователей'); }
        }
    },

    ban: {
        desc: 'Забанить пользователя',
        run: async (args) => {
            const user = args[0]?.replace('@', '');
            const reason = args[1] || 'Нарушение правил';
            const type = args[2] || 'forever';

            if (!user) return err('Использование: ban @username "причина" [1d|7d|30d|forever]');

            const result = await apiRequest('POST', `/api/users/${user}/ban`, { reason, type });
            if (result?.success) ok(result.message);
            else err(result?.error || 'Ошибка бана');
        }
    },

    unban: {
        desc: 'Разбанить пользователя',
        run: async (args) => {
            const user = args[0]?.replace('@', '');
            if (!user) return err('Использование: unban @username');

            const result = await apiRequest('POST', `/api/users/${user}/unban`);
            if (result?.success) ok(result.message);
            else err(result?.error || 'Ошибка разбана');
        }
    },

    setrole: {
        desc: 'Сменить роль',
        run: async (args) => {
            const user = args[0]?.replace('@', '');
            const role = args[1];

            if (!user || !role) return err('Использование: setrole @username [admin|mod|user]');
            if (!['admin', 'mod', 'user'].includes(role)) return err('Неверная роль');

            const result = await apiRequest('POST', `/api/users/${user}/role`, { role });
            if (result?.success) ok(`Роль ${user} изменена на ${role}`);
            else err(result?.error || 'Ошибка смены роли');
        }
    },

    delete: {
        desc: 'Удалить пользователя',
        run: async (args) => {
            const user = args[0]?.replace('@', '');
            if (!user) return err('Использование: delete @username');

            const result = await apiRequest('DELETE', `/api/users/${user}`);
            if (result?.success) ok(result.message);
            else err(result?.error || 'Ошибка удаления');
        }
    },

    msg: {
        desc: 'Написать в чат',
        run: async (args) => {
            const room = args[0]?.replace('#', '');
            const text = args.slice(1).join(' ');

            if (!room || !text) return err('Использование: msg #room "текст"');

            const result = await apiRequest('POST', '/api/messages', {
                userId: 0, username: 'RW', roomId: room, message: text
            });
            if (result?.success) ok(`Сообщение отправлено в #${room}`);
            else err('Ошибка отправки');
        }
    },

    msgs: {
        desc: 'Последние сообщения',
        run: async (args) => {
            const room = args[0]?.replace('#', '') || 'general';
            try {
                const msgs = await apiRequest('GET', `/api/messages?room=${room}`);
                console.log(clr(`\n${C.bold}Чат #${room}:${C.reset}`));
                msgs.slice(0, 10).reverse().forEach(m => {
                    console.log(clr(`${C.gray}[${new Date(m.timestamp).toLocaleTimeString('ru-RU')}]${C.white} ${C.bold}${m.username}${C.gray}: ${m.message}`));
                });
                console.log('');
            } catch { err('Не удалось загрузить сообщения'); }
        }
    },

    clear: {
        desc: 'Очистить комнату',
        run: async (args) => {
            const room = args[0]?.replace('#', '');
            if (!room) return err('Использование: clear #room');

            const result = await apiRequest('DELETE', `/api/messages/${room}`);
            if (result?.success) ok(result.message);
            else err('Ошибка очистки');
        }
    },

    rooms: {
        desc: 'Список комнат',
        run: async () => {
            try {
                const rooms = await apiRequest('GET', '/api/rooms');
                console.log('');
                rooms.forEach(r => console.log(clr(`${C.cyan}#${C.white} ${r.name} ${C.gray}(${r.id})${C.reset}`)));
                console.log('');
            } catch { err('Не удалось загрузить комнаты'); }
        }
    },

    topic: {
        desc: 'Создать тему на форуме',
        run: async (args) => {
            const section = args[0]?.replace('#', '');
            const title = args[1];
            const content = args[2];

            if (!section || !title || !content) return err('Использование: topic #section "заголовок" "текст"');

            const result = await apiRequest('POST', '/api/forum/topics', {
                sectionId: parseInt(section),
                title,
                userId: 0,
                username: 'RW',
                content
            });
            if (result?.success) ok(`Тема создана (ID: ${result.topicId})`);
            else err('Ошибка создания темы');
        }
    },

    exit: {
        desc: 'Выйти',
        run: () => {
            console.log('');
            console.log(clr(`${C.dim}Выход...${C.reset}`));
            setTimeout(() => process.exit(0), 500);
        }
    }
};

// ===== REPL =====
console.log('');
console.log(clr(`${C.bold}${C.yellow}╔═══════════════════════════════════════════════${C.reset}`));
console.log(clr(`${C.yellow}║${C.white}  ${C.bold}RW CONSOLE${C.white} — Управление сайтом                ${C.yellow}║${C.reset}`));
console.log(clr(`${C.yellow}║${C.white}  https://rw-seho.onrender.com                   ${C.yellow}║${C.reset}`));
console.log(clr(`${C.yellow}╚═══════════════════════════════════════════════${C.reset}`));
console.log('');
console.log(clr(`${C.dim}Введите "help" для списка команд${C.reset}`));
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: clr(`${C.bold}${C.cyan}RW > ${C.reset}`)
});

rl.prompt();

rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return rl.prompt();

    cmd(trimmed);

    // Parse command
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (command === 'cls' || command === 'clear') {
        if (args.length === 0 || args[0] === 'screen') {
            process.stdout.write('\x1b[2J\x1b[0f');
        } else {
            commands.clear.run(args);
        }
    } else if (commands[command]) {
        await commands[command].run(args);
    } else {
        err(`Команда не найдена: ${command}. Введите "help" для справки.`);
    }

    rl.prompt();
});

rl.on('close', () => {
    console.log(clr(`${C.dim}\nДо свидания!${C.reset}`));
    process.exit(0);
});
