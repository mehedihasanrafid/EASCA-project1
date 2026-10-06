# DokanBD Backend

DokanBD is a learning-focused e-commerce backend built with Node.js, Express,
TypeScript, TypeORM, MySQL, Zod, JWT, Nodemailer, and OpenAPI/Swagger UI.

This directory is a separate backend copied from the working foundation in
`/home/mehedi/Desktop/EASCA-project1/server`. The copy lets the complete
backend grow without changing the original learning project.

## Read this status first

The source now contains an implemented internship-MVP backend. It has passed
TypeScript checks, unit tests, compilation, database migrations, seed, and the
main live authentication flow. The remaining business routes still need full
HTTP/database integration testing before it is called deployment-ready.

### Implemented in source

- Express application startup and global middleware
- Environment validation with Zod
- TypeORM connection to MySQL
- Initial migration for the current entity model
- Seed data for roles and starter categories
- Health endpoint
- Registration, login, email verification, password recovery, refresh-token
  rotation, logout, logout-all, and authenticated `/me`
- Password hashing with bcrypt
- JWT access-token authentication
- Central not-found and error middleware
- Nodemailer service functions connected to verification/recovery flows
- Authentication rate limiting and ADMIN/OWNER authorization
- Customer profile and profile-image upload
- Owned address CRUD with one-default-address enforcement
- Category administration and public category tree
- Product/variant administration, public search/filter/sort/pagination, and
  product-image upload
- Active cart and stock-aware cart item management
- Transaction-safe COD checkout, order history, cancellation, stock movement,
  and admin status management
- Structured JSON logging and graceful shutdown
- Swagger/OpenAPI documentation for all 53 connected API operations
- Automated schema, token, and OpenAPI coverage tests

### Present as database design or deferred workflow

Payments and returns currently have entities but not complete workflows.
Vendors, brands, and product types are seeded/reference data but do not yet
have full management APIs.

### Remaining before production/deployment

- Complete HTTP/database integration tests for addresses, catalogue, cart,
  checkout, and administrator order management
- Add dashboard/inventory management endpoints
- Complete payment/return workflows if required by the assignment
- Add audit logs and optional Redis caching
- Add Docker/deployment, monitoring, backup, and CI configuration
- Expand automated tests beyond validation/token utilities

Always check the source and test results before describing a planned feature as
complete.

## Technology stack

| Technology | Responsibility |
| --- | --- |
| Node.js | Runs the compiled JavaScript server |
| Express 5 | HTTP routes and middleware |
| TypeScript | Static checking and clearer contracts |
| TypeORM | Entities, repositories, relationships, and migrations |
| MySQL | Persistent relational database |
| Zod | Environment and request validation |
| bcryptjs | Password hashing and comparison |
| jsonwebtoken | JWT creation and verification |
| Nodemailer | SMTP email delivery |
| Swagger UI/OpenAPI | Interactive API documentation |
| Vitest | Automated tests |

Some packages are installed for planned work. Installation alone does not mean
the feature is already connected to the request flow.

## Project structure

```text
src/
├── app.ts                 # Creates and configures the Express application
├── server.ts              # Connects MySQL and starts the HTTP listener
├── config/                # Validated environment configuration
├── database/              # DataSource, migrations, and seeds
├── docs/                  # OpenAPI document used by Swagger UI
├── middlewares/           # Global error and not-found middleware
├── modules/               # Feature code and database entities
├── routes/                # API version router
├── services/              # Shared services such as email delivery
├── types/                 # TypeScript type augmentation
└── utils/                 # Reusable application utilities
docs/                      # Beginner learning and defence documentation
tests/                     # Cross-module/integration test area
```

## Local setup

### 1. Install packages

```bash
cd "/home/mehedi/Desktop/ DokanBD/ DokanBDbackend"
npm install
```

### 2. Create the environment file

```bash
cp .env.example .env
```

Edit `.env` with your local MySQL credentials and a JWT secret containing at
least 32 characters. Do not commit `.env`.

### 3. Create the MySQL database

Create the database named by `DB_NAME`. The application account needs
permission to use that database. Do not run the application as the MySQL root
user.

### 4. Run migrations and seed data

```bash
npm run migration:show
npm run migration:run
npm run seed
```

The seed is required because registration expects a `CUSTOMER` role.

### 5. Start development mode

```bash
npm run dev
```

With the default port:

- API base: `http://localhost:5000/api/v1`
- Health: `http://localhost:5000/api/v1/health`
- Swagger UI: `http://localhost:5000/api-docs/`
- OpenAPI JSON: `http://localhost:5000/api-docs.json`

`npm run dev` keeps the process running and reloads TypeScript files. Swagger
is a browser page; the terminal only prints its link.

## Important commands

```bash
npm run dev                 # Development server with watch mode
npm run typecheck           # Check TypeScript without creating dist/
npm run build               # Compile TypeScript into dist/
npm start                   # Run compiled dist/server.js
npm test                    # Run tests once
npm run test:watch          # Rerun tests while files change
npm run migration:show      # Show migration state
npm run migration:run       # Apply pending migrations
npm run migration:revert    # Revert the latest applied migration
npm run seed                # Insert/update starter data
npm run check               # Type-check, test, and build
```

For migration generation, provide a descriptive output path after `--` and
review the generated SQL before running it. See
[`docs/08-MIGRATIONS-SEEDS-AND-DATABASE-WORKFLOW.md`](docs/08-MIGRATIONS-SEEDS-AND-DATABASE-WORKFLOW.md).

## Current request flow

```text
HTTP request
  → Express global middleware
  → /api/v1 router
  → feature router
  → optional authentication middleware
  → controller
  → Zod validation
  → service/business rules
  → TypeORM repository
  → MySQL
  → JSON response

Any error
  → global error handler
  → consistent JSON error response
```

## Documentation reading order

For a fast understanding before a defence:

1. [`docs/00-START-HERE.md`](docs/00-START-HERE.md)
2. [`docs/04-PROJECT-STRUCTURE-AND-REQUEST-LIFECYCLE.md`](docs/04-PROJECT-STRUCTURE-AND-REQUEST-LIFECYCLE.md)
3. [`CODE-MAP.md`](CODE-MAP.md)
4. [`PROJECT-DEFENCE.md`](PROJECT-DEFENCE.md)

For a full beginner study path, read the numbered files in `docs/` in order.

Useful quick references:

- [`CHANGE-GUIDE.md`](CHANGE-GUIDE.md): where to edit common features
- [`CODE-MAP.md`](CODE-MAP.md): important functions, imports, and call paths
- [`PROJECT-DEFENCE.md`](PROJECT-DEFENCE.md): short viva preparation
- [`docs/19-RUNBOOK-AND-TROUBLESHOOTING.md`](docs/19-RUNBOOK-AND-TROUBLESHOOTING.md): commands and common errors
- [`docs/20-PHASE-2-DATABASE-RUNTIME-SWAGGER.md`](docs/20-PHASE-2-DATABASE-RUNTIME-SWAGGER.md): exact next database and live-testing steps
- [`docs/21-GMAIL-NODEMAILER-SETUP.md`](docs/21-GMAIL-NODEMAILER-SETUP.md): Gmail App Password and Nodemailer setup

## Rules for changing the project

1. Understand the current request flow before editing.
2. Change one feature at a time.
3. Validate request data at the HTTP boundary.
4. Keep business rules in services rather than routes.
5. Use a TypeORM migration for every database schema change.
6. Keep `synchronize: false`.
7. Never return password hashes or secret tokens.
8. Update tests and OpenAPI when an endpoint changes.
9. Run `npm run check` before considering a change complete.

## Licence and learning purpose

This copy is designed as both a working backend and a study project. The
documentation deliberately explains syntax, imported functions, data flow,
security decisions, and safe extension points.
