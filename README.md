# I/O Chat — Real-time Chat (Frontend + Backend)

Simple real-time chat application (Next.js frontend + Express + PostgreSQL + Redis backend). Repo ini berisi dua bagian utama: IO-Chat-Frontend dan IO-Chat-Backend.

---

## Project description
I/O Chat is a small real-time chat system that supports:
- Private and group chats
- Real-time messaging via Socket.IO
- File sharing (small files, client-enforced 2MB limit)
- Authentication using JWT
- PostgreSQL as primary DB; Redis for presence

This repository is used as a student final project for the Database Systems practicum.

---

## Tech stack
- Frontend: Next.js (React), Tailwind CSS, `socket.io-client`, `axios`
- Backend: Node.js, Express, Socket.IO
- Database: PostgreSQL
- Cache/presence: Redis (ioredis)
- Auth: JWT, password hashing with `bcrypt`

---

## Quick setup (local)

Prerequisites:
- Node.js (v18+ recommended)
- PostgreSQL
- Redis

1) Clone repo (skip if already in web)
```bash
git clone https://github.com/NishDevan/IO-Chat-Frontend my-project
cd "SBD Modul Final Project"
```

2) Backend setup (IO-Chat-Backend)
```bash
cd IO-Chat-Backend
npm install
```
Create `.env` in IO-Chat-Backend and set:
```
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
PORT=4000
```
Create DB and run schema (use database_dump.sql or `src/database/schema.sql` if present):
```bash
psql <database-connection-string> -f IO-Chat-Backend/database_dump.sql
# or: psql -U <user> -d <db> -f IO-Chat-Backend/database_dump.sql
```

Start backend:
```bash
cd IO-Chat-Backend
npm run dev
# (server runs, default port 4000)
```

3) Frontend setup (IO-Chat-Frontend)
```bash
cd ../IO-Chat-Frontend
npm install
# copy .env if needed; config points to BACKEND_URL in code (default 'http://localhost:4000')
npm run dev
# open http://localhost:3000
```

Notes:
- Backend uses `express.json({ limit: '5mb' })` and Socket.IO `maxHttpBufferSize = 5e6` to allow base64 payloads.
- Frontend expects backend at `http://localhost:4000` by default (see `src/app/page.js`).

---

## Environment variables (summary)
- .env
  - `DATABASE_URL` — postgres connection string
  - `REDIS_URL` — redis connection string
  - `JWT_SECRET` — secret for signing JWT
  - `PORT` — server port (default 4000)
- Frontend: uses `BACKEND_URL` constant inside `src/app/page.js` (edit there or provide a `.env` and update code to read it).

---

## Database
A SQL dump is available: database_dump.sql. Use it to create the tables. The dump includes tables:
- `users`, `chats`, `chat_members`, `messages`, `attachments`, `read_receipts`

(Do not edit the dump directly; instead apply migrations or alter table statements if needed.)

---

## Diagrams
- ERD (entity relationship diagram)
  <img width="1150" height="817" alt="ERD SBD" src="https://github.com/user-attachments/assets/8938c30f-bee6-4fca-8a7b-f769873d2536" />

- UML (application layer)
  <img width="6289" height="4005" alt="UML SBD FINAL" src="https://github.com/user-attachments/assets/893dbe4a-e75e-48d8-b2b8-6cbe0d01ffc5" />
 
- Flowchart (user flow)
  <img width="4476" height="3046" alt="FLOWCHART SBD" src="https://github.com/user-attachments/assets/aa991db4-623e-42cd-a110-f6f4a504fe94" />

---

## Contact / Authors
- Project: IO-Chat (contributors listed in repo)
- For practicum questions: contact project mentor / aslab as per course instructions.

---
