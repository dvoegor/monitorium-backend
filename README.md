# Monitorium Backend

Express.js + TypeScript + Prisma + PostgreSQL backend для проекта Monitorium.

## 🚀 Технологический стек

- **Express.js** - веб-фреймворк
- **TypeScript** - типизированный JavaScript
- **Prisma** - ORM для работы с базой данных
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Zod** - валидация данных
- **Winston** - логирование
- **node-cache** - кэширование
- **bcryptjs** - хеширование паролей

## 📁 Структура проекта

```
backend/
├── src/
│   ├── controllers/     # Контроллеры (бизнес-логика)
│   ├── routes/         # Маршруты API
│   ├── services/       # Сервисы (работа с данными)
│   ├── middleware/     # Middleware (аутентификация, ошибки)
│   ├── schemas/        # Zod схемы валидации
│   ├── cache/          # Утилиты кэширования
│   ├── logger/         # Конфигурация логирования
│   ├── types/          # TypeScript типы
│   ├── utils/          # Вспомогательные функции
│   └── index.ts        # Точка входа
├── prisma/
│   ├── schema.prisma   # Схема базы данных
│   └── migrations/     # Миграции
├── logs/               # Файлы логов
└── dist/               # Скомпилированный код
```

## 🛠 Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Настройте переменные окружения:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/monitorium?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
LOG_LEVEL="info"
```

### 3. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций
npm run db:migrate

# Или push схемы (для разработки)
npm run db:push
```

### 4. Запуск

```bash
# Разработка (с hot reload)
npm run dev

# Продакшн
npm run build
npm start
```

## 📚 API Документация

### Аутентификация

#### POST `/api/auth/register`

Регистрация нового пользователя

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // опционально
}
```

#### POST `/api/auth/login`

Вход пользователя

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/profile`

Получение профиля текущего пользователя (требует токен)

#### POST `/api/auth/change-password`

Изменение пароля (требует токен)

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Пользователи

#### GET `/api/users`

Получить всех пользователей (только админы)

#### GET `/api/users/:id`

Получить пользователя по ID

#### PUT `/api/users/:id`

Обновить пользователя

```json
{
  "name": "New Name",
  "email": "new@example.com"
}
```

#### DELETE `/api/users/:id`

Удалить пользователя (только админы)

### Заголовки аутентификации

Для защищенных роутов добавляйте заголовок:

```
Authorization: Bearer <your-jwt-token>
```

## 🔧 Скрипты

- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка проекта
- `npm start` - запуск продакшн версии
- `npm run db:generate` - генерация Prisma клиента
- `npm run db:push` - применение схемы к БД
- `npm run db:migrate` - создание и применение миграций
- `npm run db:studio` - запуск Prisma Studio

## 🏗 Архитектурные решения

### Кэширование

- Используется `node-cache` для in-memory кэширования
- Кэшируются данные пользователей на 5 минут
- Автоматическая очистка при обновлении данных

### Логирование

- Winston для структурированного логирования
- Разные уровни логов (error, info, debug)
- Ротация файлов логов (5MB, 5 файлов)
- В development режиме также вывод в консоль

### Безопасность

- JWT токены для аутентификации
- Хеширование паролей с bcrypt (12 раундов)
- Валидация данных с Zod
- CORS настроен для фронтенда

### Обработка ошибок

- Централизованная обработка ошибок
- Специальная обработка Zod и Prisma ошибок
- Логирование всех ошибок
- Разные ответы для development/production

## 🚀 Развертывание

### Docker (опционально)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Переменные окружения для продакшн

```env
NODE_ENV="production"
DATABASE_URL="your-production-db-url"
JWT_SECRET="strong-production-secret"
LOG_LEVEL="warn"
```

## 🤝 Для команды

### Добавление новых роутов

1. Создайте контроллер в `src/controllers/`
2. Добавьте роуты в `src/routes/`
3. Подключите роуты в `src/index.ts`
4. Добавьте Zod схемы в `src/schemas/` если нужно

### Работа с базой данных

1. Измените схему в `prisma/schema.prisma`
2. Создайте миграцию: `npm run db:migrate`
3. Обновите сервисы в `src/services/`

### Добавление middleware

1. Создайте файл в `src/middleware/`
2. Подключите в нужных роутах или глобально

Проект готов к разработке! 🎉
