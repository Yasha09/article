# NestJS CRUD API

Production-style NestJS REST API with JWT auth, PostgreSQL migrations, Redis caching, and local Multer uploads for books and authors.

## Features

- JWT authentication (`/api/auth/register`, `/api/auth/login`)
- Users module (`GET /api/users/me`)
- Public read access for books and authors
- Owner-protected create/update/delete flows
- PostgreSQL via TypeORM with migrations (`synchronize: false`)
- Redis caching for public book and author reads
- Local file uploads exposed over `/uploads/*`
- Swagger docs at `/docs`

## Setup

1. Install dependencies:

```bash
yarn install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Start infrastructure:

```bash
docker compose up -d
```

4. Run migrations:

```bash
yarn migration:run
```

5. Start the API:

```bash
yarn start:dev
```

API: `http://localhost:3000`
Swagger: `http://localhost:3000/docs`
Uploads: `http://localhost:3000/uploads/...`

## API Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create author with avatar

```bash
curl -X POST http://localhost:3000/api/authors \
  -H "Authorization: Bearer <TOKEN>" \
  -F "name=Author Name" \
  -F "bio=Short author biography for the profile" \
  -F "avatar=@/absolute/path/avatar.png"
```

### Create book with cover

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Book title" \
  -F "summary=A sufficiently long summary for the book resource" \
  -F "publishedAt=2026-02-12T10:00:00.000Z" \
  -F "authorId=<AUTHOR_UUID>" \
  -F "cover=@/absolute/path/cover.png"
```

### List books with search/filtering

```bash
curl "http://localhost:3000/api/books?page=1&limit=10&search=story&authorId=<AUTHOR_UUID>&publishedFrom=2026-01-01T00:00:00.000Z&publishedTo=2026-12-31T23:59:59.999Z"
```

### List authors with search

```bash
curl "http://localhost:3000/api/authors?page=1&limit=10&search=doe"
```

## Cache Rules

- Cached endpoints:
  - `GET /api/books`
  - `GET /api/books/:id`
  - `GET /api/authors`
  - `GET /api/authors/:id`
- TTL is `CACHE_TTL_SECONDS` (default 60)
