# GymOS Backend — Complete Progress Log

> Last updated: 2026-03-14
> All 66 tests passing · Coverage: 75% lines / 75% statements / 55% branches / 61% functions

---

## Table of Contents
1. [Project Stack](#1-project-stack)
2. [File Structure](#2-file-structure)
3. [Models (15)](#3-models)
4. [Services (4)](#4-services)
5. [Controllers (9)](#5-controllers)
6. [API Routes — All Endpoints](#6-api-routes)
7. [Middleware (5)](#7-middleware)
8. [Cron Jobs (2)](#8-cron-jobs)
9. [Validation Schemas (3)](#9-validation-schemas)
10. [Utilities (2)](#10-utilities)
11. [Testing (66 tests)](#11-testing)
12. [API Documentation](#12-api-documentation)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Docker & Deployment](#14-docker--deployment)
15. [Cross-cutting Concerns](#15-cross-cutting-concerns)
16. [Bugs Fixed](#16-bugs-fixed)
17. [Dependencies](#17-dependencies)

---

## 1. Project Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 (CommonJS) |
| Framework | Express 5 |
| Database | MongoDB 7 via Mongoose 9 |
| Authentication | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validation | Zod v4 |
| Cron Jobs | `node-cron` |
| Rate Limiting | `express-rate-limit` |
| Logging | `winston` (structured) + `morgan` (HTTP request logs) |
| File Uploads | `multer` |
| API Docs | `swagger-ui-express` (OpenAPI 3.0.3) |
| Testing | Jest + Supertest + `mongodb-memory-server` |
| CI/CD | GitHub Actions |
| Container | Docker (Node 20 Alpine) + Docker Compose |

---

## 2. File Structure

```
GymOS/
├── app.js                        # Express app (no DB/cron/listen — used by tests)
├── server.js                     # Production entry: connectDB + cron + listen
├── jest.config.js                # Test runner config + coverage thresholds
├── Dockerfile                    # Node 20 Alpine production image
├── docker-compose.yml            # api + mongo:7 with replica set (--replSet rs0)
├── .dockerignore
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI pipeline
├── src/
│   ├── config/
│   │   ├── db.js                 # Mongoose connection with winston logging
│   │   └── swagger.js            # OpenAPI 3.0.3 full spec
│   ├── controllers/              # 9 controllers
│   ├── jobs/                     # 2 cron jobs
│   ├── middleware/               # 5 middleware modules
│   ├── models/                   # 15 Mongoose models
│   ├── routes/                   # 11 route files
│   ├── services/                 # 4 service modules
│   ├── utils/
│   │   ├── generateToken.js      # JWT signing helper
│   │   └── logger.js             # Winston logger (dev: colorise, prod: JSON)
│   └── validations/
│       ├── auth.schemas.js       # Zod schemas for register/login
│       ├── plan.schemas.js       # Zod schema for plan creation
│       └── workout.schemas.js    # Zod schema for workout entries
└── tests/
    ├── db.js                     # MongoMemoryReplSet connect/clearDB/disconnect
    ├── helpers/
    │   └── seed.js               # seedAll, seedActiveMembership, bearerToken
    ├── auth.test.js              # 11 tests
    ├── billing.test.js           # 7 tests
    ├── attendance.test.js        # 5 tests
    ├── cron.test.js              # 5 tests
    ├── membership.test.js        # 12 tests
    ├── analytics.test.js         # 13 tests
    └── plans_notifications_auditlogs.test.js  # 13 tests
```

---

## 3. Models

All models use `mongoose.models.X || mongoose.model(...)` guard to prevent re-registration.
All have timestamps (`{ timestamps: true }`).

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `email` | String | required, unique, lowercase |
| `password` | String | hashed via pre-save bcrypt hook |
| `role` | String | enum: `admin`, `trainer`, `member` |
| `gym` | ObjectId → Gym | required |
| `profilePhoto` | String | optional URL |
**Indexes:** `email` unique

### Gym
| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `location` | String | required |
| `owner` | ObjectId → User | required |
| `logo` | String | optional URL |

### MembershipPlan
| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `durationDays` | Number | required |
| `price` | Number | required |
| `description` | String | optional |
| `gym` | ObjectId → Gym | required |
| `createdBy` | ObjectId → User | required |
**Indexes:** `gym`

### Membership
| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId → User | required |
| `plan` | ObjectId → MembershipPlan | required |
| `gym` | ObjectId → Gym | required |
| `startDate` | Date | defaults to now |
| `endDate` | Date | required |
| `status` | String | enum: `active`, `grace`, `expired`, `cancelled`, `pending` |
| `graceUntil` | Date | set when transitioning active → grace |
| `createdBy` | ObjectId → User | required |
**Indexes:** `{ member, status }`, `{ gym, status }`, `{ gym, endDate }`

### Payment
| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId → User | required |
| `amount` | Number | required |
| `currency` | String | default: `INR` |
| `method` | String | enum: `cash`, `upi`, `card`, `bank_transfer` |
| `status` | String | enum: `pending`, `completed`, `refunded` |
| `gym` | ObjectId → Gym | required |
| `membership` | ObjectId → Membership | optional (linked on subscription) |
| `notes` | String | optional |
| `createdBy` | ObjectId → User | required |
**Indexes:** `{ gym, createdAt }`, `{ member }`

### Attendance
| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId → User | required |
| `gym` | ObjectId → Gym | required |
| `membership` | ObjectId → Membership | required |
| `checkInTime` | Date | defaults to now |
| `checkOutTime` | Date | optional |
| `method` | String | enum: `manual`, `qr`, `biometric` |
**Indexes:** `{ gym, checkInTime }`, `{ member, checkInTime }`

### Notification
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → User | required |
| `title` | String | required |
| `message` | String | required |
| `read` | Boolean | default: `false` |
**Indexes:** `{ userId, read }`

### AuditLog
| Field | Type | Notes |
|---|---|---|
| `actor` | ObjectId → User | required |
| `action` | String | required (e.g. `payment.created`) |
| `entityType` | String | required (e.g. `Payment`) |
| `entityId` | ObjectId | required |
| `gym` | ObjectId → Gym | required |
| `metadata` | Mixed | optional extra info |
**Indexes:** `{ gym, createdAt }`, `{ actor }`, `{ entityType, entityId }`

### TrainerAssignment
| Field | Type | Notes |
|---|---|---|
| `trainer` | ObjectId → User | required |
| `member` | ObjectId → User | required |
| `gym` | ObjectId → Gym | required |
| `status` | String | enum: `active`, `completed`, `cancelled` |
| `assignedBy` | ObjectId → User | required |

### Biometric
| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId → User | required |
| `gym` | ObjectId → Gym | required |
| `recordedBy` | ObjectId → User | required |
| `date` | Date | required |
| `weight` | Number | kg, optional |
| `bodyFat` | Number | %, optional |
| `bmi` | Number | optional |
| `notes` | String | optional |

### Measurement
| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId → User | required |
| `gym` | ObjectId → Gym | required |
| `recordedBy` | ObjectId → User | required |
| `date` | Date | required |
| `chest`, `waist`, `hips`, `arms`, `thighs` | Number | cm, optional |

### WorkoutProgram
| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `description` | String | optional |
| `createdBy` | ObjectId → User | required |
| `gym` | ObjectId → Gym | required |
| `assignedTo` | [ObjectId → User] | array |

### WorkoutSession
| Field | Type | Notes |
|---|---|---|
| `member` | ObjectId → User | required |
| `program` | ObjectId → WorkoutProgram | optional |
| `gym` | ObjectId → Gym | required |
| `date` | Date | required |
| `notes` | String | optional |

### WorkoutSet
| Field | Type | Notes |
|---|---|---|
| `session` | ObjectId → WorkoutSession | required |
| `exercise` | ObjectId → Exercise | required |
| `sets` | Number | required |
| `reps` | Number | required |
| `weight` | Number | kg, optional |
| `duration` | Number | seconds, optional |

### Exercise
| Field | Type | Notes |
|---|---|---|
| `name` | String | required, unique |
| `category` | String | e.g. `strength`, `cardio` |
| `muscleGroup` | String | optional |
| `instructions` | String | optional |

---

## 4. Services

### membershipService (`src/services/membershipService.js`)

| Function | Signature | Description |
|---|---|---|
| `createMembershipFromPlan` | `(memberId, planId, gymId, createdById, session?)` | Creates a Membership from a plan; accepts optional Mongoose session for transactions. Returns `{ membership, plan }`. No side effects — caller handles audit/notify. |
| `expireMemberships` | `()` → `Number` | Finds all `active` memberships whose `endDate` has passed; sets them to `grace` with a 3-day `graceUntil`. Returns count of documents modified. |
| `markGraceExpired` | `()` → `Number` | Finds all `grace` memberships whose `graceUntil` has passed; marks them `expired`. Returns count modified. |

### paymentService (`src/services/paymentService.js`)

| Function | Signature | Description |
|---|---|---|
| `processPaymentAndSubscribe` | `(memberId, planId, amount, currency, method, gymId, createdById)` | Wraps `Payment.create` + `createMembershipFromPlan` in a **MongoDB transaction** (`session.withTransaction`). Side effects (audit log + notification) fire **after commit**, never inside the transaction. Returns the saved payment document. |

### auditService (`src/services/auditService.js`)

| Function | Signature | Description |
|---|---|---|
| `logAction` | `({ actor, action, entityType, entityId, gym, metadata })` | Fire-and-forget. Creates an AuditLog document. Swallows errors — never throws. |

### notificationService (`src/services/notificationService.js`)

| Function | Signature | Description |
|---|---|---|
| `notify` | `({ userId, title, message })` | Fire-and-forget. Creates a Notification document. Swallows errors — never throws. |

---

## 5. Controllers

### authController (`src/controllers/authController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `registerUser` | `POST /api/auth/register` | Public | Register a member under a gym |
| `registerAdmin` | `POST /api/auth/register/admin` | Public | Register a gym admin (creates Gym + User atomically) |
| `registerTenant` | `POST /api/auth/register/tenant` | Public | Register a new gym tenant (owner) |
| `loginUser` | `POST /api/auth/login` | Public | Authenticate and return JWT |
| `getProfile` | `GET /api/auth/profile` | Protected | Return authenticated user's profile |
| `updateProfile` | `PUT /api/auth/profile` | Protected | Update name / profilePhoto |

### membershipController (`src/controllers/membershipController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `getPlans` | `GET /api/plans` | Public | List all plans for the gym |
| `createPlan` | `POST /api/plans` | Admin | Create a new plan; emits `plan.created` audit log |
| `updatePlan` | internal | Admin | Update plan fields; emits `plan.updated` audit log |
| `deletePlan` | internal | Admin | Delete a plan |
| `purchaseMembership` | `POST /api/memberships/purchase` | Admin | Cancels prior active/grace memberships, issues new one via `createMembershipFromPlan`, emits audit + notification |
| `getMemberMembership` | `GET /api/memberships/member/:memberId` | Protected | Member can see own history; admin can see any |
| `getAllMemberships` | `GET /api/memberships` | Admin | Paginated list of all memberships for the gym |
| `cancelMembership` | `PATCH /api/memberships/:id/cancel` | Admin | Marks membership as `cancelled`; emits `membership.cancelled` audit log |

### paymentController (`src/controllers/paymentController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `createPayment` | `POST /api/payments` | Admin | Calls `processPaymentAndSubscribe`; handles optional `planId` |
| `getAllPayments` | `GET /api/payments` | Admin | Paginated `?page&limit` list of all gym payments |
| `getPaymentById` | `GET /api/payments/:id` | Admin | Single payment detail |
| `refundPayment` | `POST /api/payments/:id/refund` | Admin | Sets status to `refunded`; emits `payment.refunded` audit log |

### attendanceController (`src/controllers/attendanceController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `checkIn` | `POST /api/attendance/checkin` | Member | Requires active membership; blocks double check-in; creates Attendance record |
| `checkOut` | `POST /api/attendance/checkout` | Member | Closes open session; sets `checkOutTime` |
| `getMemberAttendance` | `GET /api/attendance/member/:memberId` | Protected | Paginated attendance history for a member |
| `getAllAttendance` | `GET /api/attendance` | Admin | Full gym attendance list |
| `getTodayAttendance` | `GET /api/attendance/today` | Admin | Today's check-ins |

### analyticsController (`src/controllers/analyticsController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `getRevenueMetrics` | `GET /api/admin/metrics/revenue` | Admin | Today / month / total revenue + `revenueByDay` array (last 30 days, for chart) + `averagePlanValue` |
| `getAttendanceMetrics` | `GET /api/admin/metrics/attendance` | Admin | `todayTotal`, `activeNow`, `peakHours` array (check-ins by hour 0–23, last 30 days) |
| `getMembershipMetrics` | `GET /api/admin/metrics/memberships` | Admin | Count by status: `{ active, grace, expired, cancelled, pending }` |
| `getTrainerMetrics` | `GET /api/admin/metrics/trainers` | Admin | `byStatus` map + `topTrainers` (top 10 by active client count, with `$lookup`) |

### notificationController (`src/controllers/notificationController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `getMyNotifications` | `GET /api/notifications` | Protected | Paginated; supports `?unread=true` filter |
| `markAsRead` | `PATCH /api/notifications/:id/read` | Protected | Marks a single notification read; 404 if not owned by user |
| `markAllAsRead` | `PATCH /api/notifications/read-all` | Protected | Bulk-marks all unread notifications for user |

### workoutController (`src/controllers/workoutController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `createSession` | `POST /api/workout/sessions` | Member | Create a workout session |
| `getSessions` | `GET /api/workout/sessions` | Member | List member's sessions |
| `addSet` | `POST /api/workout/sessions/:id/sets` | Member | Add a set to a session |
| `getSets` | `GET /api/workout/sessions/:id/sets` | Member | List sets for a session |

### programController (`src/controllers/programController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `createProgram` | `POST /api/programs` | Admin/Trainer | Create a workout program |
| `getPrograms` | `GET /api/programs` | Protected | List programs for the gym |
| `getProgramById` | `GET /api/programs/:id` | Protected | Single program detail |
| `updateProgram` | `PUT /api/programs/:id` | Admin/Trainer | Update program |
| `deleteProgram` | `DELETE /api/programs/:id` | Admin/Trainer | Delete program |
| `assignProgram` | `POST /api/programs/:id/assign` | Admin/Trainer | Assign program to a member |

### biometricController (`src/controllers/biometricController.js`)

| Function | Route | Access | Description |
|---|---|---|---|
| `recordBiometric` | `POST /api/biometrics` | Admin/Trainer | Record weight, body fat, BMI |
| `getBiometrics` | `GET /api/biometrics/:memberId` | Protected | Get member's biometric history |
| `recordMeasurement` | `POST /api/biometrics/measurements` | Admin/Trainer | Record body measurements |
| `getMeasurements` | `GET /api/biometrics/measurements/:memberId` | Protected | Get measurement history |

---

## 6. API Routes

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register member |
| POST | `/api/auth/register/admin` | Public | Register gym admin |
| POST | `/api/auth/register/tenant` | Public | Register gym tenant/owner |
| POST | `/api/auth/login` | Public | Login → returns JWT |
| GET | `/api/auth/profile` | JWT | Get own profile |
| PUT | `/api/auth/profile` | JWT | Update profile |

### Membership Plans (`/api/plans`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/plans` | Public | List plans for gym |
| POST | `/api/plans` | Admin | Create plan (validates via Zod) |

### Memberships (`/api/memberships`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/memberships` | Admin | Paginated list |
| POST | `/api/memberships/purchase` | Admin | Issue/renew subscription |
| GET | `/api/memberships/member/:memberId` | JWT | Member history |
| PATCH | `/api/memberships/:id/cancel` | Admin | Cancel subscription |

### Payments (`/api/payments`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments` | Admin | Create payment + optional membership (transactional) |
| GET | `/api/payments` | Admin | Paginated list (`?page&limit`) |
| GET | `/api/payments/:id` | Admin | Single payment |
| POST | `/api/payments/:id/refund` | Admin | Refund a payment |

### Attendance (`/api/attendance`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/attendance/checkin` | Member | Check in (requires active membership) |
| POST | `/api/attendance/checkout` | Member | Check out |
| GET | `/api/attendance/member/:memberId` | JWT | Paginated attendance history |
| GET | `/api/attendance` | Admin | All gym attendance |
| GET | `/api/attendance/today` | Admin | Today's check-ins |

### Workout (`/api/workout`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/workout/sessions` | Member | Create session |
| GET | `/api/workout/sessions` | Member | List sessions |
| POST | `/api/workout/sessions/:id/sets` | Member | Log a set |
| GET | `/api/workout/sessions/:id/sets` | Member | List sets |

### Programs (`/api/programs`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/programs` | Admin/Trainer | Create program |
| GET | `/api/programs` | JWT | List programs |
| GET | `/api/programs/:id` | JWT | Get by ID |
| PUT | `/api/programs/:id` | Admin/Trainer | Update |
| DELETE | `/api/programs/:id` | Admin/Trainer | Delete |
| POST | `/api/programs/:id/assign` | Admin/Trainer | Assign to member |

### Biometrics (`/api/biometrics`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/biometrics` | Admin/Trainer | Record biometric |
| GET | `/api/biometrics/:memberId` | JWT | Member history |
| POST | `/api/biometrics/measurements` | Admin/Trainer | Record measurements |
| GET | `/api/biometrics/measurements/:memberId` | JWT | Measurement history |

### Analytics (`/api/admin/metrics`) — Admin only
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/metrics/revenue` | Revenue: today, month, total, avg, revenueByDay[] |
| GET | `/api/admin/metrics/attendance` | todayTotal, activeNow, peakHours[] |
| GET | `/api/admin/metrics/memberships` | Status counts |
| GET | `/api/admin/metrics/trainers` | byStatus + topTrainers[] |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | JWT | Paginated list; `?unread=true` filter |
| PATCH | `/api/notifications/read-all` | JWT | Mark all as read |
| PATCH | `/api/notifications/:id/read` | JWT | Mark one as read |

### Audit Logs (`/api/audit-logs`) — Admin only
| Method | Path | Description |
|---|---|---|
| GET | `/api/audit-logs` | Paginated; filterable by `?action=` and `?entityType=` |

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/docs` | Public | Swagger UI — interactive API docs |
| GET | `/health` | Public | `{ status, database, uptime }` |

---

## 7. Middleware

### authMiddleware (`src/middleware/authMiddleware.js`)
- **`protect`** — Verifies Bearer JWT; attaches `req.user`; returns 401 if missing/invalid
- **`admin`** — Must follow `protect`; returns 403 if `req.user.role !== "admin"`

### roleMiddleware (`src/middleware/roleMiddleware.js`)
- **`admin`** — 403 if not admin
- **`trainer`** — 403 if not trainer or admin

### permissionMiddleware (`src/middleware/permissionMiddleware.js`)
- **`PERMISSIONS`** map — keyed by role (`admin`, `trainer`, `member`), lists allowed permission strings
- **`requirePermission(permission)`** — factory; returns middleware that 403s if user's role doesn't have the permission

### validateRequest (`src/middleware/validateRequest.js`)
- **`validateRequest(schema)`** — factory; parses `{ body, query, params }` against a Zod schema; returns `400 { message, errors[] }` on failure
- Uses `e.issues ?? e.errors ?? []` for Zod v4 compatibility

### errorMiddleware (`src/middleware/errorMiddleware.js`)
- **`errorHandler`** — global Express error handler; returns JSON `{ message }` with proper status code

---

## 8. Cron Jobs

### membershipExpirationJob (`src/jobs/membershipExpirationJob.js`)
Runs **every hour** (`0 * * * *`).
1. Calls `expireMemberships()` — transitions `active` → `grace` for past-endDate memberships; sets a 3-day `graceUntil`
2. Calls `markGraceExpired()` — transitions `grace` → `expired` for past-graceUntil memberships

### renewalReminderJob (`src/jobs/renewalReminderJob.js`)
Runs **daily at 8:00 AM** (`0 8 * * *`).
- Finds all `active` memberships expiring within 3 days
- For each, calls `notify({ userId, title: "Membership Expiring Soon", message })` — fire-and-forget

---

## 9. Validation Schemas

### auth.schemas.js
- **`registerSchema`** — `body.{ name, email, password (min 6), role?, gymId? }`
- **`loginSchema`** — `body.{ email, password }`

### plan.schemas.js
- **`createPlanSchema`** — `body.{ name, durationDays (int, min 1), price (min 0), description? }`

### workout.schemas.js
- **`createSessionSchema`** — `body.{ programId?, date, notes? }`
- **`addSetSchema`** — `body.{ exerciseId, sets, reps, weight?, duration? }`

---

## 10. Utilities

### generateToken.js
- **`generateToken(userId)`** — signs a JWT with `process.env.JWT_SECRET`, expires in `30d`

### logger.js
- Winston instance exported as `logger`
- Dev: colourised + timestamp format
- Prod: JSON format
- Exports `logger.stream` for morgan HTTP request logging
- Silenced in `NODE_ENV=test` (morgan disabled in `app.js`)

---

## 11. Testing

### Infrastructure
| File | Purpose |
|---|---|
| `tests/db.js` | `connect()` / `clearDB()` / `disconnect()` — `MongoMemoryReplSet` |
| `tests/helpers/seed.js` | `seedGym`, `seedAdmin`, `seedMember`, `seedPlan`, `seedActiveMembership`, `seedAll`, `bearerToken` |

> `MongoMemoryReplSet` (not standalone) is required because `paymentService` uses MongoDB transactions which require a replica set.

### Test Files & Coverage

| File | Tests | Features Covered |
|---|---|---|
| `auth.test.js` | 11 | Register (3 cases), login (3 cases), JWT profile (3 cases), invalid token |
| `billing.test.js` | 7 | Payment + membership creation (transactional), no-plan payment, 401/403 access, refund, refund duplicate, paginated list |
| `attendance.test.js` | 5 | No-membership 403 check-in, successful check-in, duplicate check-in 400, checkout, checkout-without-checkin 400 |
| `cron.test.js` | 5 | `expireMemberships`: active→grace, future unaffected, already-grace unaffected; `markGraceExpired`: grace→expired, future unaffected |
| `membership.test.js` | 12 | Purchase (4), member history (3), paginated list (2), cancel (3) |
| `analytics.test.js` | 13 | Revenue (4), attendance (3), memberships (3), trainers (2) — includes 401/403 guards |
| `plans_notifications_auditlogs.test.js` | 13 | Plans GET/POST (4), notifications list+filter (3), mark-read (2), mark-all-read (1), audit logs list+filter (3) |
| **TOTAL** | **66** | |

### Coverage Report (after infrastructure excluded)
| Metric | Threshold | Actual |
|---|---|---|
| Statements | 70% | **74.89%** ✅ |
| Lines | 70% | **75.79%** ✅ |
| Branches | 50% | **55.33%** ✅ |
| Functions | 55% | **60.60%** ✅ |

### NPM Scripts
```
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with istanbul coverage report
```

---

## 12. API Documentation

- **Tool:** `swagger-ui-express`
- **Spec file:** `src/config/swagger.js` — OpenAPI 3.0.3
- **URL:** `GET /api/docs`

### Spec Contents
| Section | Details |
|---|---|
| Security | `bearerAuth` (HTTP Bearer JWT) — global on all protected routes |
| Tags | Auth, Plans, Memberships, Payments, Attendance, Notifications, Audit Logs, Analytics, Health |
| Schemas | UserResponse, Gym, MembershipPlan, Membership, Payment, Attendance, Notification, AuditLog, Pagination, Error, ValidationError |
| Paths | All endpoints documented with request bodies, query params, and response shapes |

---

## 13. CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

**Triggers:** Push or PR to `main` or `develop`

```
Job 1: test
  → actions/checkout@v4
  → actions/setup-node@v4 (Node 20, npm cache)
  → npm ci
  → npm run test:coverage (NODE_ENV=test, JWT_SECRET=ci_test_secret)
  → Upload coverage/ as artifact (7-day retention)

Job 2: docker  (runs after test job passes)
  → actions/checkout@v4
  → docker build -t gymos:ci .
```

---

## 14. Docker & Deployment

### Dockerfile
- Base: `node:20-alpine`
- Copies `package*.json`, runs `npm ci --omit=dev`
- Copies application source
- Exposes port `5000`
- CMD: `node server.js`

### docker-compose.yml
```yaml
services:
  mongo:
    image: mongo:7
    command: mongod --replSet rs0 --bind_ip_all
    healthcheck: mongosh rs.status() / rs.initiate()  # auto-initiates replica set

  api:
    build: .
    depends_on:
      mongo:
        condition: service_healthy  # waits for RS election before starting
    environment:
      MONGO_URI: mongodb://mongo:27017/gymos?replicaSet=rs0
      JWT_SECRET: ...
      NODE_ENV: production
    ports: "5000:5000"
```

### .dockerignore
Excludes: `node_modules/`, `.env`, `logs/`, `.git`, `coverage/`

---

## 15. Cross-cutting Concerns

### Authentication & RBAC
- All protected routes require `Authorization: Bearer <jwt>`
- Roles: `admin`, `trainer`, `member`
- `authMiddleware.protect` verifies token and attaches full user object
- `authMiddleware.admin` enforces admin-only routes
- `roleMiddleware.trainer` allows trainer + admin
- `permissionMiddleware.requirePermission(perm)` — granular permission checks (defined but available for future route hardening)

### Multi-tenancy
- Every model has a `gym` field
- All queries are scoped to `req.user.gym`
- No cross-gym data leakage by design

### Pagination
All list endpoints support `?page=1&limit=20` and return:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
}
```
Applies to: `/api/payments`, `/api/memberships`, `/api/attendance/member/:id`, `/api/notifications`, `/api/audit-logs`

### Rate Limiting
| Scope | Window | Max Requests |
|---|---|---|
| Auth routes | 15 min | 10 (1000 in test) |
| Check-in | 1 min | 3 (1000 in test) |
| All `/api/*` | 1 min | 100 (10000 in test) |

### Audit Logging
Fire-and-forget `logAction()` calls in controllers/services.
| Event | Triggered By |
|---|---|
| `payment.created` | `paymentService` (post-commit) |
| `payment.refunded` | `paymentController.refundPayment` |
| `membership.created` | `paymentService` (post-commit) OR `membershipController.purchaseMembership` |
| `membership.cancelled` | `membershipController.cancelMembership` |
| `plan.created` | `membershipController.createPlan` |
| `plan.updated` | `membershipController.updatePlan` |

### In-App Notifications
Fire-and-forget `notify()` calls.
| Event | Triggered By |
|---|---|
| Payment received | `paymentService` (post-commit) |
| Membership activated | `paymentService` (post-commit) OR `membershipController.purchaseMembership` |
| Membership expiring in 3 days | `renewalReminderJob` (8 AM daily) |

### MongoDB Transactions
`processPaymentAndSubscribe` wraps two writes atomically:
```
session.withTransaction(async () => {
  Payment.create([...], { session })
  createMembershipFromPlan(..., session)
})
// side effects run HERE — after commit
logAction(...)
notify(...)
```
Requires replica set — handled by docker-compose `--replSet rs0` and `MongoMemoryReplSet` in tests.

### Structured Logging
- `logger.info/error/warn` throughout the app
- HTTP requests logged via morgan → winston stream
- Format: colourised in dev, JSON in production
- Morgan disabled in `NODE_ENV=test` to keep test output clean

---

## 16. Bugs Fixed

| Bug | File | Fix |
|---|---|---|
| `membershipRoutes.js` was completely empty — no route bindings despite importing 4 controllers | `src/routes/membershipRoutes.js` | Added `router.get("/")`, `.post("/purchase")`, `.get("/member/:memberId")`, `.patch("/:id/cancel")` |
| `authController.js` used `mongoose.Types.ObjectId()` in `registerTenant` without importing mongoose | `src/controllers/authController.js` | Added `const mongoose = require("mongoose")` |
| `validateRequest.js` called `e.errors.map(...)` but Zod v4 renamed the property to `.issues` — caused `Cannot read properties of undefined (reading 'map')` | `src/middleware/validateRequest.js` | Changed to `(e.issues ?? e.errors ?? []).map(...)` |

---

## 17. Dependencies

### Production
| Package | Version | Purpose |
|---|---|---|
| `express` | ^5 | Web framework |
| `mongoose` | ^9 | MongoDB ODM |
| `jsonwebtoken` | latest | JWT signing/verification |
| `bcryptjs` | latest | Password hashing |
| `zod` | ^4 | Schema validation |
| `node-cron` | latest | Cron job scheduler |
| `express-rate-limit` | latest | Rate limiting |
| `cors` | latest | CORS headers |
| `dotenv` | latest | Env var loading |
| `morgan` | latest | HTTP request logging |
| `winston` | latest | Structured logging |
| `multer` | latest | Multipart file upload |
| `express-async-handler` | latest | Async error forwarding |
| `swagger-ui-express` | latest | Swagger UI hosting |

### Development
| Package | Version | Purpose |
|---|---|---|
| `jest` | latest | Test runner |
| `supertest` | latest | HTTP integration testing |
| `mongodb-memory-server` | latest | In-memory MongoDB (`MongoMemoryReplSet`) |
| `nodemon` | latest | Dev auto-restart |
