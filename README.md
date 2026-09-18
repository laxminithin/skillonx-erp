# SkillonX Survey

Production-oriented College Survey Management System for SkillonX — Faculty portal + public student survey links — structured for later XSUIT integration without a schema rewrite.

## Stack

- **API:** Express + Knex + MySQL + JWT/bcrypt + Zod + rate limiting
- **Web:** Vite + React + React Router + Tailwind + Recharts + QR + drag-and-drop builder

## Quick start

### 1. Start MySQL

```bash
docker compose up -d
```

MySQL listens on `localhost:3307` (user `survey` / password `survey` / db `skillonx_survey`).

### 2. Configure env

```bash
cp .env.example .env
```

### 3. Install, migrate, seed

```bash
npm install
npm run migrate
npm run seed
```

### 4. Run apps

```bash
npm run dev:api
npm run dev:web
```

- Faculty / Admin app: http://localhost:5173  
- API: http://localhost:4000  

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Faculty | `anita@vviet.edu.in` | `Password123` |
| College Admin | `collegeadmin@vviet.edu.in` | `Password123` |
| Platform Admin | `admin@skillonx.com` | `Password123` |

Admins are routed to `/admin`. Faculty are routed to `/dashboard`.

## Product flow

**Admin:** Login → Overview → Faculty / Institutions / Academic Setup → Create Faculty → Surveys / Responses / Analytics / Reports

**Faculty:** Login → Dashboard → Create Survey → Sections & Questions (live preview) → Publish → Share link/QR → Responses → Analytics → Export → Close/Archive/Duplicate

**Student:** Open `/s/{code}` → Welcome → Begin Survey → Name/USN/Email → Section progress → Submit → Success

## Answer types

Star Rating · Smile Rating · Numeric Rating · Likert · Single Choice · Multiple Choice · Yes/No · Short Text · Long Text · Dropdown

## Workspace layout

```
apps/api   Express API + Knex migrations/seeds
apps/web   Faculty + student React app
```

## XSUIT-ready conventions

- Every tenant-owned row includes `college_id`
- JWT claims: `facultyUserId`, `collegeId`, `departmentId`, `role`
- Roles: Faculty, HOD, Principal, IQAC, NBA, College Admin, Super Admin
- Faculty permissions (create/publish/view/export/bank/students) enforced server-side
- Published surveys snapshot structure; edits lock after responses begin
- Anonymous surveys never expose student–response relationships to admin or faculty
