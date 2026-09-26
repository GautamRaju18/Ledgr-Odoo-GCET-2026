# StockSense

Modular Inventory Management System: FastAPI + React + PostgreSQL.

## Features

- Sign up, log in, OTP password reset
- Dashboard: products in stock, low / out of stock, pending receipts, deliveries and transfers; late, waiting and upcoming operations; filters by operation type, status, warehouse, location and category
- Products with categories, SKU search, per-location stock, reordering rules, optional initial stock
- Receipts, delivery orders (with availability check) and internal transfers: Draft → (Waiting) → Ready → Done, list and kanban views, print
- Stock page with free-to-use quantities and inline stock adjustment
- Inventory adjustments: count any product at any location; the difference is logged as `WH/ADJ/xxxx`
- Move history (stock ledger): incoming green, outgoing red
- Multi-warehouse settings: warehouses, locations, categories, contacts
- Low stock alerts on the dashboard, product and stock pages, and after login

## Setup

Requirements: Docker, Python 3.11+, Node 20+. On Windows, run the commands below inside WSL.

```bash
git config core.hooksPath .githooks
docker compose up -d                      # PostgreSQL 16 on localhost:5432
```

Backend (`backend/`):

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                      # then set JWT_SECRET (and SMTP_* to email OTPs)
alembic upgrade head
python -m app.seed                        # demo data; login demo01 / Demo@1234
uvicorn app.main:app --reload             # API on :8000, docs at /docs
```

Frontend (`frontend/`):

```bash
npm install
npm run dev                               # http://localhost:5173 (proxies /api to :8000)
```

Without SMTP settings, password reset OTPs are printed in the backend console.

## Checks

```bash
cd backend && ruff check app && python acceptance_check.py   # on a freshly seeded DB
cd frontend && npm run lint && npm run build
```

## Team

| Member | Role |
|---|---|
| GautamRaju18 | Backend: stock engine, operations API, move history, team lead |
| aneeshpen | Backend: auth, master data, products, stock, dashboard |
| Srikar7362 | Frontend: receipts, deliveries, transfers |
| PMS-Srikanth | Frontend: app shell, auth, dashboard, products, stock, move history, settings, profile |
