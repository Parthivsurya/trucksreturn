# ReturnLoad — Smart Return-Load Platform

**Website:** [trucksreturn.com](https://trucksreturn.com)

A full-stack freight marketplace that connects truck drivers with shippers to **eliminate empty backhauls**. Drivers register a truck, declare a return route (current location → destination), and the platform matches them with loads available *along the entire route* — not just the origin city. Built mobile-first for Indian truck drivers.

---

## Why this exists

A truck dropping a delivery in Kochi and heading back to Bangalore typically returns empty — half the trip's fuel is wasted. ReturnLoad lets the driver claim a partial-cargo return load picked up anywhere along the corridor (Coimbatore, Salem, Hosur), turning the empty leg into revenue while saving the shipper money on a non-dedicated truck.

---

## Tech stack

**Backend** (`server/`)
- Node.js + Express (ESM modules)
- PostgreSQL via `pg` (node-postgres) — no ORM
- JWT access tokens (15 min) + httpOnly refresh-token cookies (30 days, rotating)
- bcrypt for password hashing
- helmet, CORS, `express-rate-limit` for hardening
- Server-Sent Events (SSE) for real-time tracking
- Nodemailer for transactional email + OTP
- Multer for document uploads

**Frontend** (`client/`)
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Leaflet + React-Leaflet (maps)
- Axios for HTTP, custom `useApi` hook with silent token refresh
- `EventSource` (browser-native) for live tracking
- Lucide icons, react-hot-toast

**Routing engine**: OSRM public demo server (`router.project-osrm.org`) for road-aware paths, with straight-line Haversine fallback.

---

## Architecture

```
┌────────────────────┐         ┌─────────────────────┐
│   client (Vite)    │◀────────│   user's browser    │
│   port 5173        │         └─────────────────────┘
│                    │
│   /api/* proxy ────┼────▶┐
└────────────────────┘     │
                           ▼
                  ┌────────────────────┐         ┌──────────────┐
                  │   server (Express) │◀───────▶│  PostgreSQL  │
                  │   port 3001        │         │              │
                  └────────────────────┘         └──────────────┘
```

In **development** the Vite dev server proxies `/api/*` and `/uploads/*` to Express on port 3001 (`client/vite.config.js`). In **production** Express serves the built React bundle from `client/dist/`, so you only run one process.

---

## Repository layout

```
Truck/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── driver/        # Dashboard, LoadFinder, BookingDetail, RegisterTruck, …
│   │   │   ├── shipper/       # PostLoad, MyLoads, Tracking, LoadMatches, …
│   │   │   └── admin/         # AdminDashboard, AdminUsers, AdminSettings, …
│   │   ├── components/        # MapView, Navbar, ProtectedRoute, RatingStars, …
│   │   ├── context/           # AuthContext, SettingsContext
│   │   └── hooks/             # useApi, useAdminApi
│   └── vite.config.js
├── server/
│   ├── controllers/           # auth, booking, driver, load, settings, admin, …
│   ├── routes/
│   ├── services/
│   │   ├── matching.service.js          # core route-corridor matching
│   │   ├── tracking-stream.service.js   # SSE pub/sub
│   │   └── email.service.js
│   ├── middleware/            # auth.middleware.js (JWT verify + role guard)
│   ├── db/
│   │   ├── db.js              # pg pool + runMigrations()
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── uploads/               # user-uploaded images (gitignored)
│   ├── logs/                  # access + error logs
│   ├── server.js              # entrypoint, env validation, middleware wiring
│   └── .env.example
├── CLAUDE.md                  # working notes for the AI assistant
└── README.md                  # you are here
```

---

## Quick start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- `openssl` (for generating secrets)

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```dotenv
NODE_ENV=development
PORT=3001
JWT_SECRET=<generate with: openssl rand -hex 32>
DATABASE_URL=postgresql://user:password@localhost:5432/returnload
ALLOWED_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<generate with: openssl rand -base64 12>
```

The server **refuses to boot** if:
- `NODE_ENV` is unset
- `JWT_SECRET` is unset, a known placeholder, or shorter than 32 characters
- (production only) `ADMIN_PASSWORD` is missing, weak, or shorter than 12 characters

### 3. Create the database

```bash
createdb returnload
```

The server runs `schema.sql` and idempotent migrations (`runMigrations()` in `server/db/db.js`) automatically on startup.

### 4. Run the dev servers (two terminals)

```bash
# terminal 1
cd server && npm run dev      # nodemon, port 3001

# terminal 2
cd client && npm run dev      # vite, port 5173
```

Open http://localhost:5173.

### 5. Production build

```bash
cd client && npm run build    # outputs client/dist/
cd ../server && npm start     # Express serves the bundle and the API
```

---

## How a typical session flows

### Driver journey
1. **Register** → email OTP verification → choose role `driver` → JWT issued.
2. **Register truck** → upload RC, permit, insurance, PUC, licence, three vehicle photos → admin verifies in `/admin/driver-verification`.
3. **Set availability** → enter current city + destination + (optionally) declared free capacity for less-than-truckload (LTL) loads → status `active`.
4. **Find loads** → matching service returns ranked loads along the corridor (see below).
5. **Book a load** → status flips through `confirmed → picked_up → in_transit → delivered`. Driver pushes GPS every 15s while the booking is open.
6. **Rate the shipper** once delivered.

### Shipper journey
1. Register → choose role `shipper`.
2. Post a load (pickup + delivery cities and full addresses, weight, cargo type, offered price, handling instructions).
3. Wait for a driver to book it. Get a notification (in-app bell + email) on every status change.
4. Open the **Tracking** page to watch the truck move on a live map (SSE, sub-second updates).
5. Rate the driver once delivered.

### Admin journey
- `/admin/login` (separate creds from `.env`) → dashboard with bookings, users, loads, driver verification, settings.
- Settings let an operator change site name, logo, **favicon**, theme palette, SMTP credentials, security toggles (rate limiting, OTP enforcement) — no redeploy.

---

## Core algorithms

### 1. Route-corridor load matching

`server/services/matching.service.js` is the central business logic.

```
current_location ──────────────── destination
       │                                │
       ▼                                ▼
   sample 11 points evenly along the straight line,
   then for each open load:
       └── find closest sample point to load.pickup
       └── accept if within 50 km of any sample
       └── direction guard: load.delivery must be ≥ as close
            to destination as load.pickup (+1.5×radius slack)
       └── capacity check (LTL-aware)
       └── detour ≤ 40%   (current → pickup → delivery → destination)
       └── score: 0.3·pickup_dist + 0.4·detour% + 0.3·(1 / price)
```

This is what enables a Bangalore→Kochi truck to match a Coimbatore pickup, even though Coimbatore sits >50 km from Bangalore. Each match returns `route_progress_pct` and `is_intermediate` so the UI can label corridor pickups distinctly.

### 2. Real-time tracking (SSE)

Driver app pushes `POST /api/bookings/:uuid/track` every 15s with `{lat, lng}`. The shipper subscribes via `GET /api/bookings/:uuid/track/stream` (Server-Sent Events).

- `server/services/tracking-stream.service.js` — in-memory pub/sub keyed by booking id.
- The stream emits two event types:
  - `tracking` — new GPS point (the freshly inserted row).
  - `status` — booking state changed (`picked_up`, `in_transit`, `delivered`, `cancelled`).
- Client-side (`shipper/Tracking.jsx`) opens an `EventSource`. On `tracking`, it merges the point into local state. On `status`, it refetches the booking. If the stream errors, it falls back to 15s polling.
- Auth: `EventSource` cannot set custom headers, so the JWT is passed via `?access_token=` query param. The middleware accepts it as a fallback when the `Authorization` header is missing.

> **Note**: the pub/sub is in-memory and single-process. For multi-instance deploys, swap for Redis Pub/Sub.

### 3. Auth flow

- `POST /api/auth/send-otp` → email OTP (10 min expiry).
- `POST /api/auth/register` → verifies OTP, creates user, issues access + refresh tokens.
- `POST /api/auth/login` → password check, issues both tokens.
- `POST /api/auth/refresh` → rotates the refresh-token cookie, returns a fresh access token.
- `POST /api/auth/logout` → invalidates the current refresh token in the DB.
- `POST /api/auth/forgot-password` + `/reset-password` → OTP-gated password reset that also invalidates all existing sessions.

The `useApi` hook in `client/src/hooks/useApi.js` automatically silently refreshes the access token on 401 and retries the failed request once.

---

## API surface

All endpoints are prefixed with `/api`.

| Group | Routes |
| --- | --- |
| Auth | `POST /auth/send-otp`, `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/me` |
| Drivers | `POST /drivers/truck` (register / edit), `POST /drivers/availability`, `GET /drivers/availability`, `GET /drivers/profile`, `GET /drivers/matches` |
| Loads | `POST /loads`, `GET /loads` (filter by city, cargo, status), `GET /loads/:uuid`, `PUT /loads/:uuid`, `DELETE /loads/:uuid` |
| Bookings | `POST /bookings`, `GET /bookings/:uuid`, `PUT /bookings/:uuid/status`, `POST /bookings/:uuid/track`, **`GET /bookings/:uuid/track/stream`** (SSE), `POST /bookings/:uuid/rate`, `GET /bookings/shipper` |
| Documents | `POST /documents` (Multer, 5 MB limit, image-only) |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read` |
| Admin | `/admin/users`, `/admin/loads`, `/admin/bookings`, `/admin/driver-verification`, etc. |
| Settings | `GET /settings` (public-safe keys), `PUT /admin/settings` |
| Health | `GET /health` |

---

## Database

PostgreSQL, accessed via a pooled `pg` client in `server/db/db.js`.

Schema lives in `server/db/schema.sql`; idempotent column-additions and table-additions live in `runMigrations()` and run on every server start.

Key tables:
- `users` (driver / shipper / admin)
- `trucks` (per-driver, with `is_verified`)
- `driver_availability` (`available_capacity_tons` for LTL)
- `loads` (with pickup/delivery coords, addresses, status, uuid)
- `bookings` (status lifecycle, `agreed_price`, uuid)
- `tracking_updates` (one row per GPS push)
- `ratings` (1–5 score, comment, FK'd to booking)
- `notifications`, `documents`, `verification_history`, `refresh_tokens`, `otp_tokens`, `settings`

Indexes exist on `loads(status)`, lat/lng, `driver_availability(status)`, and booking relationships.

---

## Security & operational notes

- **HTTPS**: the server enforces HTTPS via `x-forwarded-proto` redirect when `NODE_ENV=production` (assumes a TLS-terminating proxy in front).
- **HSTS** + a strict CSP are enabled in production.
- **Rate limits**: 200 req / 15 min globally, 30 req / min for write paths (`/loads`, `/bookings`, `/drivers/availability`). Tighter limits on auth (OTP, login, register).
- **Helmet** is configured to allow OSM tiles, OSRM API, and Google Fonts.
- **Logs**: HTTP requests → `server/logs/access-YYYY-MM-DD.log`; errors → `server/logs/error.log` (JSON Lines).
- **Graceful shutdown** on SIGTERM/SIGINT closes the HTTP server, drains the PG pool, then exits.
- **Uploaded files** live in `server/uploads/` (gitignored). Validate ≤ 5 MB and image-only at the controller layer.

---

## License

MIT — see `LICENSE`.
