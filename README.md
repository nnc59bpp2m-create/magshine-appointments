# MagShine Appointment Booking System

A lightweight, mobile-first appointment booking system for magshine.com.my.

Customers pick a time, book in seconds, and confirm on screen. The business owner logs into a password-protected dashboard, manages appointments, and can sync future appointments into Google Calendar.

Stack: vanilla **HTML/CSS/JS**, static assets, **Node.js** server with REST routes. No framework-heavy build layer — deployable anywhere Node.js runs.

---

## ✨ Features

### Customers
- Visual date + time slot selection
- Prevents double-booking the same slot
- PWA install prompt support on iOS / Android
- Booking confirmation and optional notes field

### Owner
- Owner login with `OWNER_PASSWORD`
- Appointments list sorted by date/time
- Cancel / restore bookings as needed
- One-click Google Calendar sync workflow

### Technical
- Minimal JS/CSS footprint, no build step required
- localStorage-backed inventory for fast slot lookups
- Clean `/api/*` REST endpoints
- Service worker for PWA asset caching
- Environment-based credentials, no secrets committed in source code

---

## 🚀 Deployment

Recommended paths are Railway, Render, VPS + Nginx + PM2, and other common Node hosts.

Minimum requirements: Node.js, `PORT`, `OWNER_PASSWORD`.

Google Calendar sync adds optional OAuth environment variables.

---

## 🧪 Local Checks

Example endpoints and asssumed test flows are left to the deployer. Nothing here hard-codes credentials.

Existing sample checks:
- root health page
- POST booking after selecting an available slot
- duplicate POST booking returning a conflict state
- owner login POST returning success on valid password

---

## 🔧 Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `PORT` | No | Server port |
| `OWNER_PASSWORD` | Yes | Owner dashboard password |

Google Calendar is optional and requires additional OAuth envs if enabled.

---

## 📁 Project Layout

- `index.html` full PWA booking + owner dashboard UI
- `server.js` Node server, API routes, static file serving
- `sw.js` service worker cache controls
- `manifest.json` PWA manifest
- `package.json` project metadata
- `README.md` project overview

---

## 🔐 Security Notes

- Password is provided at runtime via environment variable
- Owner auth is checked server-side
- Data is in-memory/local by design for simplicity; production should idealy add a durable volume or database
- SSL is assumed when deployed behind a reverse proxy

---

## 🛠 Extending

- Time slots and slot duration are editable, typed in code
- Branding lives in `index.html` markup and the manifest
- For production, add TLS termination via Nginx/Caddy/Certbot

---

## 📄 License

Proprietary — MagShine. All rights reserved.

---

## 🆘 Support

For technical issues, contact the system administrator or open a ticket in the repo.
