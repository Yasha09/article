# NestJS CRUD API

Production-style NestJS REST API with JWT auth, PostgreSQL (TypeORM + migrations), Redis caching, and Jest unit tests.

## Features

- JWT authentication (`/auth/register`, `/auth/login`)
- Users module (`GET /users/me`)
- Article CRUD with ownership checks
- PostgreSQL via TypeORM with migrations (`synchronize: false`)
- Redis caching for article read endpoints
- DTO validation with `class-validator` and `class-transformer`
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

3. Start infrastructure (Postgres + Redis):

```bash
docker compose up -d
```

4. Run migrations:

```bash
yarn migration:run
```

5. Start API in dev mode:

```bash
yarn start:dev
```

API runs at `http://localhost:3000`.
Swagger docs: `http://localhost:3000/docs`.

## Migration Commands

```bash
yarn migration:generate
yarn migration:run
yarn migration:revert
```

## Test Commands

```bash
yarn test
yarn test:cov
```

## API Examples (curl)

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create article (auth required)

```bash
curl -X POST http://localhost:3000/articles \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Article title","description":"A sufficiently long article description","publishedAt":"2026-02-12T10:00:00.000Z"}'
```

### Get current user profile (auth required)

```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

### List articles with pagination/filtering

```bash
curl "http://localhost:3000/articles?page=1&limit=10&authorId=<AUTHOR_UUID>&publishedFrom=2026-01-01T00:00:00.000Z&publishedTo=2026-12-31T23:59:59.999Z"
```

### Get article by ID

```bash
curl http://localhost:3000/articles/<ARTICLE_ID>
```

### Update article (author only)

```bash
curl -X PATCH http://localhost:3000/articles/<ARTICLE_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title"}'
```

### Delete article (author only)

```bash
curl -X DELETE http://localhost:3000/articles/<ARTICLE_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

## Cache Rules

- Cached endpoints:
  - `GET /articles` using key `articles:list:<hash>`
  - `GET /articles/:id` using key `articles:byId:<id>`
- TTL is `CACHE_TTL_SECONDS` (default 60)
- Invalidation:
  - `POST /articles`: clear `articles:list:*`
  - `PATCH /articles/:id`, `DELETE /articles/:id`: clear `articles:byId:<id>` and `articles:list:*`
