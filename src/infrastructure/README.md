# Infrastructure

External services and technical implementations used by the application.

## Structure

```
infrastructure/
├── persistence/     # PostgreSQL via TypeORM
│   ├── entities/    # Database entities (users, books, authors)
│   ├── migrations/  # TypeORM migrations
│   ├── repositories/ # Data access layer
│   ├── data-source.ts   # CLI migrations (yarn typeorm)
│   └── typeorm.config.ts # Nest + TypeORM connection config
├── cache/           # Redis caching
│   ├── redis.service.ts
│   └── redis.module.ts
```

## Persistence

- **entities/** — TypeORM entity definitions
- **migrations/** — Database migration files
- **repositories/** — Repository classes wrapping TypeORM queries
- **data-source.ts** — Used by TypeORM CLI for migrations
- **typeorm.config.ts** — Connection factory for NestJS

## Cache

- **redis.service.ts** — Redis client (get, set, del, delByPrefix)
- **redis.module.ts** — Global Nest module exposing RedisService
