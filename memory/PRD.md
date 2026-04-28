# Personal Finance Tracker — PRD

## Original Problem Statement
Add a **Time Card Pay Calculator** feature inside a button in the Income section.
- Log working hours for each day of the week (Mon–Sun)
- Auto-calculate total hours (decimal) and total earnings based on hourly pay
- Allow user to add the calculated amount as an Income entry

## Tech Stack
- React 18 + TypeScript + Vite 6
- Tailwind CSS v4
- lucide-react icons, recharts
- In-memory state (no backend persistence yet)

## User Personas
- Freelancers, part-time / hourly employees, gig workers (Uber, DoorDash, etc.)

## Core Requirements (static)
1. Mon–Sun start/end time pickers (any day skippable)
2. Per-day hours displayed in decimal
3. Weekly total hours + Total Pay = total_hours × hourly_rate
4. Configurable max shift length (default 24h)
5. Overnight shift auto-handling (end ≤ start treated as next-day end)
6. "Add as Income" CTA creates an Income transaction with description
   "Weekly Pay ({startDate}–{endDate}) • {hours}h @ ${rate}/h"
7. Custom category (free-text)
8. Debounce / single-flight to prevent duplicate income entries

## What's Been Implemented (2026-04-28)
- New component `src/app/components/TimeCardCalculator.tsx` (modal):
  - Week-start (Monday default) date picker
  - Hourly rate, max-shift (configurable) inputs
  - 7 day rows (Mon→Sun) with start/end time inputs
  - Live daily hours, total hours, total pay (rounded to 2 decimals)
  - Overnight shift handling
  - Per-row validation (max shift exceeded)
  - Custom category input (default "Salary")
  - Submit button: disabled until valid (rate>0, hours>0, no errors)
  - Debounced submit + success state
- `TransactionForm.tsx`: "Time Card Pay Calculator" button visible only when
  Type = Income and not editing an existing transaction
- `App.tsx`: passes `onAddIncome` so calculator submissions don't conflict
  with the editing flow
- Verified end-to-end via screenshot test: Mon 9-17 + Tue 9:30-17:15 + Wed
  22:00→06:00 (overnight) = 23.75h × $15.50 = **$368.13** correctly added
  to income; Total Income increased from $3700 → $4068.13.

## Setup notes
- Supervisor `frontend` program updated to run `yarn dev` from `/app`
  (this codebase is a Vite project at `/app`, not `/app/frontend`).
- `react`, `react-dom` (18.3.1) added since they were peer-only.

## Next Action Items / Backlog
- P1: Persist transactions to MongoDB backend (currently in-memory)
- P1: Distinguish income categories in the chart (currently expense-only)
- P2: Save multiple time-card templates (e.g., recurring schedules)
- P2: Export weekly time card to CSV / PDF
- P2: Tax/deduction toggle for net pay preview
- P3: Tip/overtime multipliers (1.5x after N hours)
