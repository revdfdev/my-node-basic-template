
---

# 📦 BillEasy Mini Assignment

A robust modular Node.js backend system using Express, RabbitMQ, and PostgreSQL. 
Built to handle secure user authentication and file processing with message queue-based background workers. 
The project uses Neon DB for PostgreSQL and CloudAMQP for RabbitMQ.

---

## 📚 Contents

* [Features](#features)
* [Architecture Overview](#architecture-overview)
* [Getting Started](#getting-started)
* [Environment Setup](#environment-setup)
* [Docker Setup](#docker-setup)
* [Postman Collection](#postman-collection)
* [API Endpoints](#api-endpoints)
* [Scripts](#scripts)
* [Graceful Shutdown](#graceful-shutdown)
* [Tech Stack](#tech-stack)
* [License](#license)

---

## ✨ Features

* 🔐 Secure user authentication (JWT)
* 🗃️ File upload and metadata handling
* 🛠️ Background task queue using RabbitMQ
* 🧵 Retry logic with Dead Letter Queues
* 🧾 Extensive middleware for logging, security, and input validation
* 📈 Request logging & error handling

---

## 🧱 Architecture Overview

```
            ┌───────────────┐
            │  Postman/API  │
            └──────┬────────┘
                   │
                   ▼
            ┌────────────┐
            │ Express.js │◄───── .env.app
            └─────┬──────┘
                  │ REST APIs
     ┌────────────┴─────────────┐
     │                          │
     ▼                          ▼
User Auth                 File Upload API
     │                          │
     ▼                          ▼
Prisma (Postgres)      RabbitMQ Exchange ─────▶ Rabbitmq Worker ─────▶ processFile()
                              ▲                                        ▲
                              │                                        │
                         DLX + Retry                            Prisma DB + Logs

```

---

## 🏁 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd billeasyminiassignment
npm install
```

### 2. Configure Environment Variables

Create three files files:

* `.env.app` for Express API
* `.env.rabbitmq` for the worker
* `./config/mq.yaml` for managing RabbitMQ configuration

Example `.env.app`:

```env
DATABASE_URL=
JWT_SECRET=
```

Example `.env.rabbitmq`:
```env
DATABASE_URL=
```

---

### 3. Prisma Setup

Prisma schemas and models are defined in `./prisma/schema.prisma`.
   
Generate Prisma client:

```bash
npx prisma generate
````
### 4. Run Database Migrations (if applicable)

Deploy migrations:

```bash
npx prisma migrate deploy
```

For development:

```bash
npx prisma migrate dev --name init
```

finally run the seed script:

```bash
npm run seed
```

## 🐳 Docker Setup

### 🔧 Docker Compose

Use the provided `docker-compose.yml` to spin up services:

```bash
docker-compose up --build
```

**Included containers:**

* `appserver` – Express server
* `rabbitmqworker` – RabbitMQ consumer
* `postgres` – PostgreSQL
* `rabbitmq` – RabbitMQ management

### 🐳 Dockerfiles

* `Dockerfile.appserver`: Express server worker setup
* `Dockerfile.rabbitmq`: RabbitMQ consumer worker

Make sure the paths are correct in the `docker-compose.yml`.

---

## 📬 Postman Collection

Use the provided [`BillEasyAssignment.postman_collection.json`](./BillEasyAssignment.postman_collection.json) to test APIs.

### 🔐 Auth Flow

1. **Login**
   `POST /v1/auth/login`
   Use credentials:

   ```json
   {
     "email": "NelsonBighetti@standford.edu",
     "password": "MyyP@s5wordIsP@s5w0rd"
   }
   ```

2. **Set `authToken`** automatically (Postman script does this for you).

---

## 📡 API Endpoints

### Auth

| Method | Endpoint         | Description |
| ------ | ---------------- | ----------- |
| POST   | `/v1/auth/login` | User login  |

### Files

| Method | Endpoint           | Description             |
| ------ | ------------------ | ----------------------- |
| POST   | `/v1/files/upload` | Upload a file           |
| GET    | `/v1/files/:id`    | Fetch file metadata     |
| POST   | `/v1/files`        | Paginate uploaded files |

---

## 📜 Scripts

| Script           | Description                   |
| ---------------- | ----------------------------- |
| `start-app`      | Starts the Express API server |
| `start-rabbitmq` | Starts RabbitMQ worker        |
| `seed`           | Seeds database using Prisma   |

Run with:

```bash
WORKER_TYPE=app npm run start-app
WORKER_TYPE=rabbitmq npm run start-rabbitmq
```

---

## ✅ Graceful Shutdown

Handles:

* `SIGINT` / `SIGTERM`
* `uncaughtException`
* DB & MQ connections close cleanly

---

## ⚙️ Tech Stack

* **Node.js + Express** – API Server
* **RabbitMQ + amqplib** – Messaging
* **PostgreSQL + Prisma** – Database
* **Multer** – File uploads
* **Docker** – Containerization
* **Winston** – Logging
* **YAML** – RabbitMQ configuration

---

## 📄 License

* `uncaughtException`
* DB & MQ connections close cleanly

---

## GNU Affero General Public License

    Copyright 2025 Mohammad Rehan Kodekar

    Licensed under the GNU Affero General Public License, Version 3.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.gnu.org/licenses/agpl-3.0.html

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    If you intend to use this program in any way, you must provide
    attribution, including:

    * A link to the original repository
    * The name of the author (Mohammad Rehan Kodekar)
```