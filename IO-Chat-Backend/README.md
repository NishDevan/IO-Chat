# Telegram Clone Backend

Built with Node.js, Express, PostgreSQL, Redis, and Socket.IO.

## Tech Stack
- **Web Framework:** Express.js
- **Database:** PostgreSQL (with `pg` driver, no ORM)
- **Real-time:** Socket.IO
- **Cache/Session:** Redis (`ioredis`)
- **Authentication:** JWT & bcrypt

## Project Structure
- `src/database/`: `pg` connection pooling and raw SQL schemas.
- `src/controllers/` & `src/routes/`: Express endpoint handling for Auth and Chats.
- `src/middleware/`: JWT verification and Rate-limiting.
- `src/sockets/`: Socket.IO real-time event handlers, integrated with Redis for online presence.
- `src/services/` & `src/utils/`: Shared utilities (JWT generator, Redis client config).

## How to run locally (Without Docker)
1. Provide a local PostgreSQL & Redis instance.
2. Prepare your `.env` file according to `.env.example`.
3. Run the schema creation query (`src/database/schema.sql`) against your postgres database to create tables.
4. Run:
   ```bash
   npm install
   npm run dev
   ```

## Socket.IO Events
**Emits provided by Server:**
- `user_online`: broadcasted when a user connects.
- `user_offline`: broadcasted when a user disconnects.
- `receive_message`: in-chat message payload.
- `user_typing` / `user_stop_typing`: indicator.

**Server listens securely for:**
- `join_room` `(chatId)`
- `leave_room` `(chatId)`
- `send_message` `({ chatId, content })`
- `typing` / `stop_typing` `({ chatId })`
