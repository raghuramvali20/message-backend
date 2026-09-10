# Message Backend

Node.js/Express backend for the Message application.

## MVP baseline

This repository contains the first working MVP backend: authentication, user lookup, chat/message APIs, MongoDB persistence, and Socket.IO events.

Known limitations are intentionally left for the next version: production deployment configuration, stronger socket authorization, automated integration tests, rate limiting, restricted CORS, and final encryption decisions.

## Requirements

- Node.js 20 or newer
- MongoDB
- npm

## Local setup

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `.env` with local values:

```text
DB_URI=mongodb://127.0.0.1:27017/message
JWT_SECRET_KEY=<long-random-secret>
PORT=3000
```

Never commit `.env`. The committed `.env.example` contains placeholders only.

## Scripts

- `npm start`: start the server
- `npm run dev`: start with Nodemon

## API entry points

- `GET /`: basic server response
- `/auth`: registration and login
- `/user`: user lookup and block/unblock operations
- `/chats`: chat operations
- `/message`: message operations
- Socket.IO: realtime message, presence, typing, and seen events

## MVP verification

Before tagging a release, verify registration, login, authenticated user lookup, chat creation, message send/receive with two accounts, chat history, and reconnect/disconnect behavior.

## Repository policy

Commit source code, `package.json`, and `package-lock.json`. Do not commit `.env`, credentials, database exports, logs, or generated deployment secrets.
