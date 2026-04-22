# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReturnLoad is a full-stack freight marketplace web app that connects truck drivers with shippers to eliminate empty backhauls. Drivers register trucks, set availability (current location → destination), and get matched with loads along their return route. Shippers post loads; a matching algorithm scores and ranks driver-load compatibility.

## Development Commands

**Backend** (runs on port 3001):
```bash
cd server && npm run dev    # nodemon with auto-reload
cd server && npm start      # production
```

**Frontend** (runs on port 5173, proxies `/api/*` to localhost:3001):
```bash
cd client && npm run dev    # Vite dev server
cd client && npm run build  # production bundle
```

There are no automated tests in this project.

## Architecture

### Two-process dev setup
The client Vite dev server proxies all `/api/*` requests to the Express backend at port 3001. In production, Express would serve the built client. The Vite proxy config is in `client/vite.config.js`.

### Auth flow
JWT tokens are stored in `localStorage` and sent as `Authorization: Bearer <token>` headers. The `AuthContext` (`client/src/context/AuthContext.jsx`) holds global auth state. `ProtectedRoute` and `RequiresTruck` components guard routes client-side; `auth.middleware.js` guards API routes server-side with role checks (`driver` vs `shipper`).

### Core matching algorithm
`server/services/matching.service.js` is the central business logic. It:
1. Filters loads within a configurable radius (default 50 km) of the driver's current location
2. Validates loads are on the driver's return route using Haversine formula, allowing max 40% detour
3. Checks truck capacity against load weight
4. Scores matches: pickup distance (30%), detour % (40%), offered price (30%)

### Database
PostgreSQL, connected via `pg` (node-postgres) Pool in `server/db/db.js` using the `DATABASE_URL` environment variable. Schema is in `server/db/schema.sql`; demo data in `server/db/seed.sql`. Indexes exist on loads status, coordinates, availability status, and booking relationships.

Key tables: `users`, `trucks`, `driver_availability`, `loads`, `bookings`, `ratings`, `tracking_updates`, `documents`.

### API structure
All routes are prefixed with `/api`:
- `/api/auth` — register, login
- `/api/drivers` — truck registration, availability, profile
- `/api/loads` — CRUD for shipper load posts, matching endpoint
- `/api/bookings` — booking lifecycle, tracking updates
- `/api/documents` — file uploads via Multer

### Frontend structure
- `client/src/pages/driver/` — driver-specific pages (dashboard, load finder, bookings, etc.)
- `client/src/pages/shipper/` — shipper-specific pages (post load, my loads, tracking, etc.)
- `client/src/context/AuthContext.jsx` — global auth state
- `client/src/hooks/useApi.js` — centralized API request hook with loading/error state

## Environment

Server requires `server/.env`:
```
PORT=3001
JWT_SECRET=smartreturnload_jwt_secret_change_me
DATABASE_URL=postgresql://user:password@host:5432/dbname
```
