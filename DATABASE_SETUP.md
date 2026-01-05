# Database Setup Guide

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for MariaDB)

### Step 1: Start MariaDB

```bash
docker-compose up -d
```

This starts a MariaDB container on `localhost:3306` with:
- User: `pmp_user`
- Password: `pmp_password`
- Database: `pmp_db`

### Step 2: Initialize the Database

```bash
npx prisma migrate dev --name init
```

This creates all tables based on the schema in `prisma/schema.prisma`.

### Step 3: Verify Connection

```bash
npx prisma db push
```

### Step 4: (Optional) Open Prisma Studio

```bash
npx prisma studio
```

This opens a web UI to view and manage your database at `http://localhost:5555`.

## Production (Docker)

Set the `DATABASE_URL` environment variable in your Docker container:

```bash
DATABASE_URL=mysql://username:password@mariadb-service:3306/pmp_db
```

Run migrations in production:

```bash
npx prisma migrate deploy
```

## Schema Overview

### Registration Model
- Stores pilot registration data for the mentoring program
- Links to VATSIM account via `cid` (VATSIM ID)
- Tracks registration status: `pending`, `approved`, `rejected`, `completed`
- Automatically timestamps creation and updates

### User Model
- Manages user profiles (optional, for future extensions)
- Can store multiple VATSIM accounts
- Role-based access: `user`, `mentor`, `admin`

### Account & Session Models
- Support NextAuth.js integration
- Handle OAuth provider connections
- Manage user sessions

## Common Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset the database (dev only!)
npx prisma migrate reset

# Check database status
npx prisma db execute --stdin < query.sql
```
