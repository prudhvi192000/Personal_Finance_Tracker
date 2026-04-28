# Personal Finance Tracker — PRD

## Original Problem Statement
Add a **Time Card Pay Calculator** feature inside a button in the Income section.
- Log working hours for each day of the week (Mon–Sun)
- Auto-calculate total hours (decimal) and total earnings based on hourly pay
- Allow user to add the calculated amount as an Income entry

Follow-up: code review/cleanup, show income categories in chart, persist transactions to MongoDB.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite 6, Tailwind v4, lucide-react, recharts
- **Backend**: FastAPI + Motor (async MongoDB), Pydantic v2
- **Database**: MongoDB (`finance_tracker` DB, `transactions` collection)

## User Personas
- Freelancers, part-time / hourly employees, gig workers (Uber, DoorDash, etc.)

## Architecture
```
React (Vite, port 3000) ──VITE_BACKEND_URL──► FastAPI (port 8001, /api/*) ──► MongoDB
```
- `/api/transactions` (GET/POST) — list & create
- `/api/transactions/{id}` (PUT/DELETE) — update & delete
- `/api/transactions/seed` (POST) — bootstrap sample data if empty
- `/api/health` — health probe
- IDs are UUIDv4 (no `_id` exposed); timestamps in ISO + UTC.

## What's Been Implemented
### 2026-04-28 — Time Card Pay Calculator (initial)
- Modal with Mon–Sun start/end inputs, hourly rate, configurable max-shift
- Live decimal hours, total hours, total pay (rounded to 2 decimals)
- Overnight shift auto-handling, per-row max-shift validation
- "Add as Income" CTA — debounced + success state
- Custom category, auto-generated description
  ("Weekly Pay (Apr 27–May 3) • 23.75h @ $15.50/h")

### 2026-04-28 — Backend + Persistence + Chart upgrade
- New `/app/backend/server.py` (FastAPI, Motor, CORS open) with full CRUD
- `/app/backend/.env`: `MONGO_URL`, `DB_NAME`
- `/app/.env`: `VITE_BACKEND_URL` (Vite frontend env)
- New `src/app/api.ts` API client (fetch wrapper)
- `App.tsx`: load on mount, auto-seed on empty, async create/update/delete,
  global error banner, loading state
- `CategoryChart.tsx`: toggle between **Expenses by Category** /
  **Income by Category**, total + count footer, distinct color palettes
  per mode
- `TransactionForm.tsx`: kept Time Card button (income-only, not in edit mode)

## Setup Notes
- Supervisor `frontend` runs `yarn dev` from `/app` (Vite project at root)
- `react`, `react-dom` 18.3.1 installed (were peer-only before)
- All mutations go through the backend; UI optimistically updates on success

## Verified
- Auto-seed populates 5 sample transactions on first run
- Time Card → 8h × $20 → $160 income added → persists across reload
- Chart toggle: Expenses (Rent 90%, Groceries 6%, Transportation 3%) ↔
  Income (Salary 95%, Freelance 5%) plus newly added Gig Work
- Total Income card updates immediately ($3700 → $3860)

## Next Action Items / Backlog
- P1: Add transaction edit-flow polish (currently re-uses the form panel)
- P1: Auth (currently single-tenant, all users share one DB)
- P2: Save multiple time-card templates (recurring schedules)
- P2: Export weekly time card to CSV / PDF
- P2: Tax/deduction toggle for net pay preview
- P2: Overtime multipliers (1.5x after 40h)
- P3: Date-range filter for transactions list / chart
