# StockSense: Master Prompt for Claude Code

You are the coding assistant for a 4-person team building **StockSense**, a modular Inventory Management System, in an **8-hour hackathon**. This file is the single source of truth. Read it fully at the start of every session and follow it exactly.

---

## 0. Session start protocol (do this every session, before any code)

1. Ask: **"Which team member are you? (P1, P2, P3 or P4)"** unless the user already said so.
2. Run `git config user.name` and `git config user.email`. They must match that member's row in Section 2. If they don't, stop and tell the user the exact commands to fix it. Do not commit until they match.
3. Run `git config core.hooksPath` and confirm it prints `.githooks`. If not, run `git config core.hooksPath .githooks`.
4. Check out `main` and run `git pull --rebase` (Section 3).
5. Tell the user which phase (Section 9) they are in and list their tasks for that phase.
6. Work only on files that member owns (Section 2). If a change is needed in another member's area, stop and tell the user what to ask that teammate for. Never edit another member's files.

---

## 1. Scope lock

Build **only** the features in the StockSense problem statement and the screens in the mockup it links to. Nothing else.

**Out of scope, never add:** AI/LLM features, charts or graphs, purchasing or sales modules, barcode scanning, user roles or permissions beyond logged-in/logged-out, multi-company, file uploads, real-time websockets, backend-as-a-service (Firebase, Supabase), MongoDB, static JSON data, dark mode, internationalisation.

If the user asks for something outside scope, point to this section and ask them to confirm before building it.

---

## 2. Team, roles and git identities

| ID | GitHub username | Git email | Role | Owns |
|---|---|---|---|---|
| **P1** | GautamRaju18 | gautamraju2004@gmail.com | Backend: stock engine, team lead, repo owner | `backend/app/services/stock_engine.py`, `backend/app/services/sequence.py`, `backend/app/routers/pickings.py`, `backend/app/routers/moves.py`, `backend/app/models/picking.py`, `backend/app/models/move.py`, `backend/app/models/quant.py`, `backend/app/models/sequence.py`, root config files |
| **P2** | aneeshpen | aneesh2665@gmail.com | Backend: auth, master data, stock adjustments, dashboard | `backend/app/main.py`, `config.py`, `database.py`, `deps.py`, `seed.py`, `alembic/`, all other `models/`, `schemas/`, `routers/` (auth, users, warehouses, locations, categories, products, partners, reorder_rules, stock, dashboard), `services/auth_service.py`, `services/otp_service.py` |
| **P3** | Srikar7362 | pspsrikar@gmail.com | Frontend: operations | `frontend/src/pages/operations/**`, `frontend/src/components/operations/**` (StatusBar, ProductLinesTable, KanbanBoard, OperationList), `frontend/src/api/pickings.js` |
| **P4** | PMS-Srikanth | pmssrikanth1710@gmail.com | Frontend: shell, auth, dashboard, products, stock, move history, settings, profile | `frontend/` setup files, `frontend/src/App.jsx`, `main.jsx`, `frontend/src/api/client.js` and all other `api/*.js`, `frontend/src/components/layout/**`, `frontend/src/components/common/**`, all other `frontend/src/pages/**` |

Shared files (`backend/app/models/__init__.py`, `schemas/__init__.py`, `frontend/src/api/client.js` exports): the owner edits; others ask.

---

## 3. Git and commit rules (strict)

**Branches:** `main` is the only branch. Never create other branches, locally or on GitHub. Everyone commits to `main`.

**Identity:** every commit must be authored and committed by the member running the session, using their own `git config` identity from Section 2. Never use `--author`, `-c user.name`, `-c user.email`, or environment variables to commit as anyone else.

**No AI attribution in history:**
- Never add `Co-Authored-By` lines of any kind.
- Never add "Generated with Claude Code", robot emojis, links to claude.ai, or any mention of Claude/Anthropic/AI in commit messages, PR titles, PR descriptions, branch names, code comments or the README.
- Never add Claude as a collaborator, reviewer or contributor anywhere.
- `.claude/settings.json` disables attribution, and `.githooks/commit-msg` strips any trailer that slips through. Do not modify or bypass either (never use `--no-verify`).

**Commit style:**
- Small commits, one per completed task (aim for 1 every 20–40 minutes).
- Conventional Commits: `feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`, `refactor(scope): ...`. Example: `feat(receipts): validate receipt and increase stock`.
- Imperative mood, under 72 characters, no trailers, no body unless needed to explain a decision.
- Before each commit: run the formatter/linter for that side and make sure the app still starts.

**Syncing:** before each commit run `git pull --rebase`; push to `main` right after each commit. Never force-push. Because members only touch files they own, rebases should be conflict-free; on conflicts in files you don't own, stop and ask the user to coordinate with the owner.

---

## 4. Tech stack (use exactly this)

**Backend (`backend/`)**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.0 (sync, typed `Mapped[]` models), Alembic, psycopg 3, Pydantic v2, pydantic-settings, PyJWT, bcrypt (directly, not passlib), fastapi-mail, python-multipart. Lint/format: Ruff.

**Database**: PostgreSQL 16 via `docker-compose.yml` at repo root.

**Frontend (`frontend/`)**: React + Vite (JavaScript), React Router, Tailwind CSS, TanStack Query, Axios, React Hook Form + Zod, Sonner (toasts), lucide-react (icons). Lint/format: ESLint + Prettier.

Do not add any dependency not listed here without asking the user.

---

## 5. Repository layout

```
stocksense/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── .gitignore
├── .claude/settings.json
├── .githooks/commit-msg
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py  config.py  database.py  deps.py  seed.py
│       ├── models/   user.py otp.py warehouse.py location.py category.py product.py
│       │             reorder_rule.py partner.py picking.py move.py quant.py sequence.py
│       ├── schemas/
│       ├── routers/  auth.py users.py warehouses.py locations.py categories.py products.py
│       │             partners.py reorder_rules.py stock.py pickings.py moves.py dashboard.py
│       └── services/ stock_engine.py sequence.py auth_service.py otp_service.py
└── frontend/
    ├── .env.example
    └── src/
        ├── api/  components/layout/  components/common/  components/operations/
        └── pages/  auth/ dashboard/ products/ stock/ operations/ moves/ settings/ profile/
```

### Files P1 creates in Phase 0

`.claude/settings.json`:
```json
{
  "attribution": { "commit": "", "pr": "" }
}
```

`.githooks/commit-msg` (make executable with `chmod +x`):
```bash
#!/usr/bin/env bash
# Strip any AI attribution lines from commit messages.
msg_file="$1"
grep -viE '^(co-authored-by:.*(claude|anthropic)|.*generated with.*claude)' "$msg_file" > "$msg_file.tmp"
mv "$msg_file.tmp" "$msg_file"
```

---

## 6. Data model

All tables have `id` (integer PK) and `created_at` unless noted.

| Table | Columns |
|---|---|
| `users` | login_id (unique, 6–12 chars), name, email (unique), password_hash |
| `password_reset_otps` | user_id FK, otp_hash, expires_at, used (bool) |
| `warehouses` | name, short_code (unique, e.g. `WH`), address |
| `locations` | name, short_code, warehouse_id FK (nullable for virtual), type enum: `internal`, `vendor`, `customer`, `inventory_loss` |
| `categories` | name (unique) |
| `products` | name, sku (unique), category_id FK, uom (e.g. Units, kg), per_unit_cost (numeric, default 0) |
| `reorder_rules` | product_id FK, warehouse_id FK, min_qty, max_qty; unique (product_id, warehouse_id) |
| `partners` | name, type enum `vendor`/`customer`, address |
| `pickings` | reference (unique), type enum `receipt`/`delivery`/`internal`/`adjustment`, status enum `draft`/`waiting`/`ready`/`done`/`canceled`, partner_id FK nullable, source_location_id FK, dest_location_id FK, schedule_date, responsible_id FK users, delivery_address nullable, done_at nullable |
| `picking_lines` | picking_id FK, product_id FK, quantity (numeric > 0) |
| `stock_moves` | picking_id FK, product_id FK, quantity, source_location_id FK, dest_location_id FK, date |
| `stock_quants` | product_id FK, location_id FK, quantity; unique (product_id, location_id); no `created_at` |
| `sequences` | warehouse_id FK, picking_type, next_number; unique (warehouse_id, picking_type) |

Seed on first run: one virtual location each for `vendor`, `customer`, `inventory_loss`; demo warehouse `WH` "Main Warehouse" with locations `Stock` and `Production Rack`; a second warehouse `WH2`; categories; ~6 products incl. Steel (kg), Steel Rods, Chairs, Desk (`DESK001`); a vendor and a customer; reorder rules; one demo user.

---

## 7. Business rules

**Stock engine (P1, `services/stock_engine.py`)** is the only code allowed to change `stock_quants`. Every change is a `stock_moves` row between two locations. Everything happens inside one DB transaction with `SELECT ... FOR UPDATE` on affected quants.

**References**: `<warehouse.short_code>/<IN|OUT|INT|ADJ>/<4-digit number>`, e.g. `WH/IN/0001`. Generated from `sequences` inside the same transaction as picking creation. For delivery and internal pickings the warehouse is the source location's; for receipts and adjustments, the destination's.

**Receipts (F10)**: source = vendor location, dest = chosen internal location. Status flow `draft → ready → done`.
- "To Do" button (visible in draft) moves to ready.
- "Validate" button (visible in ready) writes moves and increases quants; status → done; done_at set.

**Delivery orders (F11)**: source = chosen internal location, dest = customer location. Status flow `draft → waiting → ready → done`.
- "To Do" runs an availability check: if free-to-use quantity at the source covers every line → ready, otherwise → waiting.
- "Check Availability" (in waiting) reruns the check.
- Lines without enough stock are returned with `available: false`; the UI marks them red and shows a toast.
- "Validate" (in ready) re-checks, writes moves, decreases quants; status → done.
- The pick and pack steps of the document are the To Do → Ready stages.

**Internal transfers (F12)**: both locations internal and different. Flow `draft → ready → done`. Validation fails if the source lacks stock. Total stock across locations stays the same.

**Adjustments (F13)**: from the Stock page, the user picks a product and location and enters the counted quantity. The engine computes `diff = counted − current`. If `diff > 0`: move inventory_loss → location. If `diff < 0`: move location → inventory_loss. A picking of type adjustment is created directly in `done` with an `ADJ` reference. `diff = 0` does nothing.

**Initial stock (F6)**: if given on product creation, record it as an adjustment into the chosen location.

**General rules**:
- Quantities must be > 0. Stock can never go negative; reject with a clear error.
- `done` and `canceled` pickings are read-only. Cancel is allowed from any other status.
- Lines can be edited only in draft.
- `responsible_id` is always the logged-in user.

**Derived values**:
- On hand (product, location) = `stock_quants.quantity`.
- Free to use (product, location) = on hand − sum of line quantities in delivery/internal pickings in `ready` from that location.
- Low stock: product's on-hand total in a warehouse ≤ that warehouse's reorder rule `min_qty`. Out of stock: total = 0.

**Dashboard KPIs (F4)**:
- Total Products in Stock: count of products with on hand > 0 across internal locations.
- Low Stock / Out of Stock Items: two counts per the rules above.
- Pending Receipts / Pending Deliveries / Internal Transfers Scheduled: count of pickings of that type not in `done`/`canceled`.
- Receipt and delivery cards also show: **Late** = schedule_date < today and not done/canceled; **Waiting** (delivery) = status waiting; **Operations** = schedule_date > today.

**Filters (F5)**: operations lists and dashboard accept `type`, `status`, `warehouse_id`, `location_id`, `category_id` (matches pickings containing a product of that category), `search` (reference or partner name).

**Low stock alerts (F17)**: dashboard KPI, a red badge on low/out rows in Stock and Products pages, and a toast after login listing count of low-stock items.

**SKU search (F18)**: products and stock lists accept `search` matching SKU or name (case-insensitive).

---

## 8. API contract (prefix `/api`, JSON, JWT bearer auth except auth routes)

| Method & path | Owner | Purpose |
|---|---|---|
| POST `/auth/signup`, `/auth/login` | P2 | Account creation, returns `{access_token, user}` |
| POST `/auth/forgot-password`, `/auth/reset-password` | P2 | OTP request / verify + new password |
| GET, PUT `/users/me` | P2 | My Profile |
| CRUD `/warehouses`, `/locations`, `/categories`, `/partners`, `/reorder-rules` | P2 | Master data |
| GET, POST `/products`; GET, PUT `/products/{id}` | P2 | Product list (search, category filter) and form |
| GET `/stock` | P2 | Per product per location: on hand, free to use, per unit cost, low-stock flag; filters `search`, `warehouse_id`, `location_id`, `category_id` |
| POST `/stock/adjust` | P2 (calls P1 engine) | Body `{product_id, location_id, counted_quantity}` |
| GET `/dashboard/kpis` | P2 | All KPI and card counts; accepts filters |
| GET, POST `/pickings`; GET, PUT `/pickings/{id}` | P1 | List with filters; create/update draft with lines |
| POST `/pickings/{id}/todo`, `/check-availability`, `/validate`, `/cancel` | P1 | Status transitions |
| GET `/moves` | P1 | Ledger: one row per move with reference, date, partner, from, to, product, quantity, direction (`in`/`out`/`internal`); filters + search |

Errors: `{"detail": "<human-readable message>"}` with proper status codes (400, 401, 404, 409, 422).

Until an endpoint exists, frontend members build against mock data in `src/api/*.js` matching these shapes, then switch to real calls.

---

## 9. Pages (routes)

| Route | Owner | Content |
|---|---|---|
| `/login`, `/signup`, `/forgot-password` | P4 | Forms with Zod validation; OTP entry step; redirect to `/dashboard` on login |
| `/dashboard` | P4 | KPI cards, Receipt card ("N to receive", late, operations), Delivery card ("N to deliver", late, waiting, operations), filters |
| `/products`, `/products/new`, `/products/:id` | P4 | List with SKU search/category filter, form with all product fields, initial stock + location, reorder rules, stock per location |
| `/stock` | P4 | Product, per unit cost, on hand, free to use, location; search; inline "update stock" (adjustment) |
| `/operations/receipts`, `/operations/receipts/:id` | P3 | List (NEW, search, list/kanban toggle by status; columns Reference, From, To, Contact, Schedule Date, Status); form (status bar, To Do/Validate/Print/Cancel, Receive From, Schedule Date, Responsible, product lines) |
| `/operations/deliveries`, `/operations/deliveries/:id` | P3 | Same pattern; Delivery Address, Operation Type; red out-of-stock lines + toast |
| `/operations/transfers`, `/operations/transfers/:id` | P3 | Same pattern for internal transfers (source and destination location) |
| `/move-history` | P4 | List (default) and kanban; columns Reference, Date, Contact, From, To, Quantity, Status; incoming rows green, outgoing red |
| `/settings/warehouses`, `/settings/locations` | P4 | Warehouse: Name, Short Code, Address. Location: Name, Short Code, Warehouse |
| `/profile` | P4 | My Profile view/edit |

Layout (P4): left sidebar with Dashboard, Products, Stock, Operations (Receipts, Deliveries, Transfers), Move History, Settings (Warehouses, Locations), and a profile menu (My Profile, Logout). Protected routes redirect to `/login` without a token. Print uses `window.print()` with a print stylesheet, shown only when status is done.

---

## 10. Phase plan (8 hours)

Commit and push to `main` after every task. At each ✅ checkpoint, everyone pulls and checks the app still runs.

### Phase 0 — 0:00–0:30 · Setup (all together)
- **P1:** create repo, `main` branch, root files (`docker-compose.yml`, `.gitignore`, `.claude/settings.json`, `.githooks/commit-msg`, `README.md`, this `CLAUDE.md`), backend skeleton folders; add P2–P4 as collaborators.
- **P2:** backend `requirements.txt`, `config.py`, `database.py`, Alembic init.
- **P3:** review Sections 7–9 and draft mock data for pickings in `api/pickings.js`.
- **P4:** Vite + Tailwind + Router + TanStack Query setup, `api/client.js` with JWT interceptor.
- ✅ Checkpoint: everyone pulls `main`; all four machines run Postgres, backend and frontend.

### Phase 1 — 0:30–2:00 · Foundations
- **P1:** picking, picking_line, move, quant, sequence models; reference generator; migration.
- **P2:** user, OTP, warehouse, location, category, product, partner, reorder_rule models; migration; signup/login with JWT; `deps.py` current-user dependency; seed script.
- **P3:** Receipts list page (mock data): table, search, list/kanban toggle, NEW button.
- **P4:** app layout with sidebar and profile menu; Login and Signup pages; protected routes.
- ✅ Checkpoint at 2:00.

### Phase 2 — 2:00–3:30 · Receipts end to end + master data
- **P1:** picking CRUD with lines; `todo`, `validate`, `cancel` for receipts; stock engine increase path.
- **P2:** CRUD routers for warehouses, locations, categories, partners, products (with initial stock via engine), reorder rules.
- **P3:** Receipt form: status bar, buttons per status, fields, product lines, connect to real API.
- **P4:** Settings pages (warehouses, locations); Products list and form.
- ✅ Checkpoint at 3:30. Test: create receipt for 100 kg Steel, validate, stock = 100.

### Phase 3 — 3:30–5:00 · Deliveries, transfers, adjustments
- **P1:** delivery availability check (waiting/ready), validate decrease path, internal transfer path, free-to-use calculation, `/moves` endpoint.
- **P2:** OTP forgot/reset password with email; `/stock` and `/stock/adjust`; `/users/me`.
- **P3:** Deliveries list + form with red out-of-stock lines and toast; Transfers list + form.
- **P4:** Stock page with inline adjustment; Forgot Password flow; Profile page.
- ✅ Checkpoint at 5:00.

### Phase 4 — 5:00–6:30 · Dashboard, history, filters, alerts
- **P1:** filters on `/pickings` and `/moves` (type, status, warehouse, location, category, search); edge cases (negative stock, editing done pickings, cancel).
- **P2:** `/dashboard/kpis` with all counts and filters; low-stock logic; input validation on every endpoint.
- **P3:** kanban views grouped by status for all three operation types; Print view; filter controls on lists.
- **P4:** Dashboard page with KPI cards, operation cards and filters; Move History with green/red rows; low-stock badges and login toast.
- ✅ Checkpoint at 6:30.

### Phase 5 — 6:30–7:30 · Integration and polish
- Everyone: fix bugs in their own area only; consistent error toasts; loading and empty states; responsive layout.
- Run the acceptance scenario (Section 11) together on P1's machine.
- ✅ Checkpoint at 7:30.

### Phase 6 — 7:30–8:00 · Freeze
- **P1:** README (setup steps, features, team roles), tag `v1.0`.
- **Others:** final small fixes only; rehearse demo.
- No new features after 7:30.

**Cut order if behind schedule:** kanban views → Print → OTP by email (fall back to showing OTP in the backend console). Never cut receipts, deliveries, transfers, adjustments, move history, or dashboard KPIs.

---

## 11. Acceptance scenario (must pass before 7:30)

1. Sign up, log out, reset password with OTP, log in → lands on Dashboard.
2. Receipt `WH/IN/0001`: 100 kg Steel from vendor into WH/Stock → To Do → Validate. Stock: 100.
3. Transfer `WH/INT/0001`: 100 kg WH/Stock → WH/Production Rack → Validate. Totals unchanged; per-location stock updated.
4. Delivery `WH/OUT/0001`: 20 kg from Production Rack → To Do → Ready → Validate. Stock: 80.
5. Adjustment: count 77 at Production Rack → Stock: 77, `WH/ADJ/0001` logged.
6. Delivery for 500 kg → goes to Waiting, line red, toast shown.
7. Move History shows all moves, incoming green, outgoing red; search by reference works.
8. Dashboard counts match; low-stock alert appears for a product under its reorder minimum.
9. `git log --format='%an <%ae>%n%B'` shows commits from all four members and no AI attribution lines.

---

## 12. Code standards

- Backend: routers stay thin; logic lives in `services/`. Type hints everywhere. Pydantic schemas for every request and response. Never return password or OTP hashes.
- Frontend: one API module per resource; TanStack Query for all server data; invalidate queries after mutations; Zod schemas for every form; no hardcoded data after Phase 2.
- Secrets only in `.env` (git-ignored); keep `.env.example` updated.
- No commented-out code or TODOs left at freeze.
