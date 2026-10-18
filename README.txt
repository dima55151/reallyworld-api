================================================================
          RW — Веб-консоль управления сайтом
================================================================

Установка:

1. Создай репозиторий на GitHub с именем "reallyworld-api"
2. Загрузи ВСЕ файлы из этой папки в репозиторий
3. Зайди на render.com → New → Web Service
4. Выбери свой репозиторий
5. Настройки:
   - Name: rw-api
   - Runtime: Node
   - Build Command: npm install
   - Start Command: node server.js
   - Instance Type: Free
6. Нажми Create

После деплоя получишь URL вида:
https://rw-api-xxxx.onrender.com

Используй его как API для сайта:
- Добавь в site/server.js:
  const API_URL = 'https://rw-api-xxxx.onrender.com';

================================================================
