# EchoGPT Server 🚀

> **Production-grade AI SaaS Backend Platform** built with **NestJS**, **PostgreSQL**, **Prisma ORM**, **JWT Security**, and **OpenAPI (Swagger)**.

EchoGPT Server is a multi-provider AI gateway and web search backend supporting OpenAI, Anthropic Claude, and Google Gemini models with encrypted key management, subscription quota enforcement, SSE streaming responses, cached web search, and administrative controls.

---

## 🛠️ Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access Token + Refresh Token Rotation with DB Session tracking), bcryptjs
- **API Documentation**: Swagger (OpenAPI 3.0) with interactive UI
- **Security & Protection**: Helmet, Rate Limiting (`@nestjs/throttler`), AES-256 Key Encryption (`CryptoUtil`)
- **DevOps**: Docker, Multi-Stage `Dockerfile`, `docker-compose.yml`

---

## ✨ Key Features

### 1. 🔐 Authentication & Session Security
- **User Registration**: Password hashing with salt rounds & automatic FREE subscription initialization.
- **JWT Login & Refresh Token Rotation**: Secure session persistence with database tracking in `Session` table.
- **Email Verification**: Token-based email verification flow.
- **Role-Based Authorization**: `ADMIN` and `USER` access controls enforced via `@Roles()` and `RolesGuard`.

### 2. 👤 User Management
- **Profile View & Update**: Retrieve profile details, update names, or change password.
- **Account Deletion**: Complete teardown of user data with cascading delete.

### 3. 💳 Subscription & Usage Quota Management
- **Plans**: `FREE` (50 requests/month) and `PREMIUM` (10,000 requests/month).
- **Quota Guard**: `SubscriptionGuard` automatically blocks API requests when monthly usage limit is exhausted.
- **Remaining Requests API**: Real-time request quota calculation and period reset automation.

### 4. 🤖 AI Provider Management System
- **Supported Providers**: OpenAI (GPT-4o, GPT-3.5), Anthropic Claude (Claude 3.5 Sonnet, Claude 3 Haiku), Google Gemini (Gemini 1.5 Pro, Flash).
- **AES-256 Encryption**: Secure encryption for API Keys stored in PostgreSQL database.
- **Health Check Endpoint**: Diagnostic checks returning status (`HEALTHY`, `DEGRADED`, `UNHEALTHY`) and latency.

### 5. 💬 Chat API & Streaming Response
- **Prompt Completions**: Send prompts to selected provider/model with title auto-generation.
- **Conversation History**: Full conversation and message storage with pagination and deletion.
- **SSE Streaming (Bonus)**: Real-time chunk streaming endpoint (`POST /chat/stream`).

### 6. 🌐 Web Search API with Caching
- **AI-Assisted Web Search**: Search query processing with structured results.
- **MD5 Result Caching (Bonus)**: Hashes query string and caches search results to maximize speed and reduce external calls.
- **Suggestions & History**: Autocomplete suggestions and recent search query tracking.

### 7. 📊 Admin Panel APIs
- **Dashboard Statistics**: Total users, active subscriptions, total messages, token count aggregations.
- **User & Subscription Controls**: User pagination, search, role promotion/demotion, subscription view.
- **Usage Analytics & Logs**: Token consumption per endpoint/user, detailed request logs, system health & memory usage.

---

## 📁 Repository Structure

```
EchoGPT-server/
├── prisma/
│   ├── migrations/               # PostgreSQL Database Migration Files
│   │   └── 20260924000000_init/
│   │       └── migration.sql
│   ├── schema.prisma             # Database Schema Definition
│   └── seed.ts                   # Seed Data (Admin, Standard User, AI Providers)
├── src/
│   ├── common/
│   │   ├── decorators/           # @GetUser, @Roles, @Public
│   │   ├── guards/               # JwtAuthGuard, RolesGuard
│   │   ├── prisma/               # PrismaService & PrismaModule
│   │   └── utils/                # CryptoUtil (AES-256), HashUtil (Bcrypt)
│   ├── modules/
│   │   ├── admin/                # Admin Panel Controller, Service & DTOs
│   │   ├── ai-provider/          # AI Provider Management Controller & Service
│   │   ├── auth/                 # Auth Controller, Service, JwtStrategy & DTOs
│   │   ├── chat/                 # Chat API Controller, Service & SSE Streaming
│   │   ├── subscription/         # Subscription Controller, Service & Guard
│   │   ├── user/                 # User Profile & Settings Controller & Service
│   │   └── web-search/           # Web Search Controller & Service with Caching
│   ├── app.module.ts
│   └── main.ts                   # Bootstrapper with Swagger, Helmet, CORS, Pipes
├── .env.example                  # Environment Variables Template
├── Dockerfile                    # Multi-stage Dockerfile
├── docker-compose.yml            # Container orchestration for Postgres + Server
├── EchoGPT.postman_collection.json # Complete Postman Collection
└── package.json
```

---

## 🚀 Quick Start Guide

### Option 1: Local Execution with Node.js & PostgreSQL

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd EchoGPT-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure PostgreSQL is running and update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://echogpt:echogpt_pass@localhost:5432/echogpt_db?schema=public"
   ```

4. **Run Database Migrations & Seed Data**:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```

5. **Start the Application**:
   ```bash
   # Development mode
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

---

### Option 2: Run via Docker Compose

Run the application and PostgreSQL database with a single command:

```bash
docker-compose up --build -d
```

The server will start at `http://localhost:3000/api/v1`.

---

## 📚 API Documentation (Swagger)

Interactive Swagger / OpenAPI 3.0 documentation is automatically served at:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Default Credentials (from Seed Data)

| Role | Email | Password | Plan |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@echogpt.io` | `Admin@123456` | PREMIUM (10,000 req/mo) |
| **USER** | `user@echogpt.io` | `User@123456` | FREE (50 req/mo) |

---

## 🧪 Testing with Postman

Import the included Postman collection file:
📄 [`EchoGPT.postman_collection.json`](./EchoGPT.postman_collection.json)

Set the collection variable `baseUrl` to `http://localhost:3000/api/v1`.

---

## 📌 Summary of Endpoints

| Category | Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Register new user |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Login & get JWT tokens |
| **Auth** | `POST` | `/api/v1/auth/refresh` | Public | Refresh access token |
| **Auth** | `POST` | `/api/v1/auth/logout` | Bearer | Revoke session refresh token |
| **Auth** | `GET` | `/api/v1/auth/me` | Bearer | Get current user info |
| **Users** | `GET` | `/api/v1/users/profile` | Bearer | Get user profile |
| **Users** | `PATCH` | `/api/v1/users/profile` | Bearer | Update user details |
| **Users** | `POST` | `/api/v1/users/change-password` | Bearer | Change password |
| **Subscriptions** | `GET` | `/api/v1/subscriptions/plans` | Public | List subscription plans |
| **Subscriptions** | `GET` | `/api/v1/subscriptions/status` | Bearer | Get subscription quota |
| **Subscriptions** | `POST` | `/api/v1/subscriptions/upgrade` | Bearer | Upgrade to PREMIUM |
| **AI Providers** | `GET` | `/api/v1/ai-providers/public` | Public | List active AI models |
| **AI Providers** | `GET` | `/api/v1/ai-providers/health-check` | Bearer | AI Providers Health Check |
| **Chat** | `POST` | `/api/v1/chat/completions` | Bearer | Send prompt & receive AI response |
| **Chat** | `POST` | `/api/v1/chat/stream` | Bearer | SSE streaming AI completions |
| **Chat** | `GET` | `/api/v1/chat/conversations` | Bearer | Get conversation list |
| **Web Search** | `POST` | `/api/v1/web-search` | Bearer | Perform web search (Cached) |
| **Web Search** | `GET` | `/api/v1/web-search/suggestions` | Public | Search query suggestions |
| **Admin** | `GET` | `/api/v1/admin/dashboard` | Admin | Dashboard stats |
| **Admin** | `GET` | `/api/v1/admin/system-health` | Admin | System health & memory status |

---

## 📝 License

This project is open-source software licensed under the UNLICENSED / MIT License.
