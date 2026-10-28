# CampusConnect

Smart Campus Complaint & Resource Management System — a full-stack web application built with
Next.js, Prisma ORM, and MySQL.

Students and staff can file and track campus complaints, and book shared resources (rooms,
labs, equipment) with automatic conflict detection. Admins manage users, departments, and
categories through role-based access control.

## Features

- **Complaint management** — create, track, prioritise, assign to departments, add status updates, resolve.
- **Resource booking** — book rooms/labs/equipment with overlap prevention (database trigger).
- **Role-based access control (RBAC)** — Admin / Staff / Student roles from a **single Users table**.
- **Secure authentication** — email + password (bcrypt-hashed) with JWT sessions via NextAuth, optional Google OAuth.
- **Advanced database features** — 9 tables (3NF), 3 views, 2 stored procedures, 3 triggers, transactions, indexes.
- **Search, filtering, pagination** on all listings; form validation with Zod; audit logging.
- **Backup & restore** via `mysqldump` (native MySQL tool).

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (React), TypeScript |
| Backend | Next.js API routes |
| ORM | Prisma |
| Database | MySQL 8.0 |
| Auth | NextAuth (JWT, bcrypt) |
| Validation | Zod |

## Project Structure

```
campusconnect/
├── prisma/
│   ├── schema.prisma          # Database schema (9 tables, 3NF)
│   ├── seed.ts                # Seed data
│   └── sql/advanced.sql       # Views, stored procedures, triggers
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   ├── components/            # Shared UI components
│   ├── lib/                   # Prisma client, auth, RBAC helpers
│   └── types/                 # TypeScript type augmentations
├── scripts/                   # Backup & restore scripts
├── docs/                      # Proposal, ER diagram, data dictionary, design
├── Dockerfile                 # App image (Next.js + Prisma)
├── docker-entrypoint.sh       # Auto migrate / apply SQL / seed / start
├── Caddyfile                  # Reverse proxy config for the domain
└── docker-compose.yml         # MySQL + app containers
```

## 🚀 Quick Start (Local Run)

The application is fully configured and ready to run out of the box with zero external dependencies:

### 1-Click Launch (Windows):
Double-click **`run.bat`** in the project folder.  
It will automatically launch the development server and open `http://localhost:3000` in your browser.

### Or via Terminal:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Demo Accounts (All passwords: `password123`)

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Admin** | `admin@campus.edu` | `password123` | System analytics, users, departments, categories, audit logs |
| **Staff (IT)** | `staff.it@campus.edu` | `password123` | Work queue, status transitions, resolving complaints |
| **Staff (Facilities)** | `staff.facilities@campus.edu` | `password123` | Maintenance work orders, complaints management |
| **Student (1)** | `student1@campus.edu` | `password123` | File complaints, book labs/rooms, track statuses |
| **Student (2)** | `student2@campus.edu` | `password123` | Urgent complaints, facility reservations |

---

## Installation

There are two ways to run the project: **local development** (MySQL in Docker, app via npm) or
**full Docker** (everything containerised — recommended for deployment).

### Option A — Full Docker (recommended)

```bash
cp .env.example .env           # set a strong NEXTAUTH_SECRET
docker compose up -d --build
```

This builds the app image, starts MySQL, applies migrations, creates views / stored procedures
/ triggers, seeds demo data, and starts the app at http://localhost:3000.

### Option B — Local development

### 1. Prerequisites

- Node.js 18+
- Docker (for MySQL), or a running MySQL 8.x server

### 2. Start the database (only MySQL)

```bash
docker compose up -d mysql
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `NEXTAUTH_SECRET` (and Google OAuth credentials if using OAuth).

### 5. Run migrations, advanced SQL, and seed

```bash
npx prisma migrate dev --name init
npm run db:generate
# Apply views / stored procedures / triggers (uses the MySQL client)
docker exec -i campusconnect-mysql mysql -uroot -proot_pass campusconnect < prisma/sql/advanced.sql
npm run db:seed
```

### 6. Run the application

```bash
npm run dev
```

Open http://localhost:3000

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@campus.edu | password123 |
| Staff | staff.it@campus.edu | password123 |
| Student | student1@campus.edu | password123 |

## Execution / Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma studio` | Open Prisma Studio (DB browser) |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:backup` | Backup DB (mysqldump) |
| `npm run db:restore -- backups/file.sql.gz` | Restore DB |

## Database Backup & Restore

```bash
npm run db:backup                       # creates backups/campusconnect_<timestamp>.sql.gz
npm run db:restore -- backups/campusconnect_20261020_120000.sql.gz
```

## Authentication & Authorization

- Single `User` table with a `role` column (`ADMIN`, `STAFF`, `STUDENT`).
- Passwords hashed with **bcrypt**.
- JWT sessions managed by NextAuth.
- Role-based **menu**, **page**, and **API** access control.

## Security

- Passwords hashed with bcrypt (never stored in plain text).
- SQL injection prevented by Prisma ORM (parameterised queries).
- Secrets kept in `.env` (excluded via `.gitignore`).
- Audit logging of sensitive actions.

## Documentation

- [Project Proposal](docs/proposal.md)
- [ER Diagram](docs/ER-diagram.md)
- [Data Dictionary](docs/data-dictionary.md)
- [Database Design & Normalization](docs/database-design.md)

## Deployment (Docker + Caddy on a VPS)

The whole stack (app + MySQL) runs in Docker. A single `docker compose up -d` builds the app
image, starts MySQL, applies migrations, creates the views / stored procedures / triggers, and
seeds demo data automatically via `docker-entrypoint.sh`.

### 1. Deploy the stack

```bash
git clone <your-repo> && cd campusconnect
cp .env.example .env        # set strong NEXTAUTH_SECRET + NEXTAUTH_URL=https://campusconnect.fustin.top
docker compose up -d --build
```

The app is now available at `http://<VPS-IP>:3000`.

### 2. Point the domain at the app

Add these records in your DNS provider:

| Type | Name | Value |
|---|---|---|
| A | campusconnect.fustin.top | `<VPS-IP>` |
| A | www.campusconnect.fustin.top | `<VPS-IP>` |

### 3. Reverse proxy with Caddy

Caddy is already installed natively on the VPS (systemd service). The site block is in
[`Caddyfile`](Caddyfile) and has been added to `/etc/caddy/Caddyfile`:

```caddyfile
campusconnect.fustin.top {
    encode gzip zstd
    reverse_proxy localhost:3000
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
    }
}

www.campusconnect.fustin.top {
    redir https://campusconnect.fustin.top{uri} permanent
}
```

Reload Caddy after editing:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy automatically obtains and renews a Let's Encrypt TLS certificate, so the site is served
over HTTPS at `https://campusconnect.fustin.top`.

### Environment variables (`.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` | MySQL credentials used by docker-compose |
| `NEXTAUTH_URL` | `https://campusconnect.fustin.top` in production |
| `NEXTAUTH_SECRET` | Long random string for signing JWT sessions |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth credentials |
