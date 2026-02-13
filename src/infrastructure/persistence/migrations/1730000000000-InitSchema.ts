import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1730000000000 implements MigrationInterface {
  name = 'InitSchema1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "articles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "author_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_articles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_articles_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_articles_published_at" ON "articles" ("published_at")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_articles_author_id" ON "articles" ("author_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_articles_author_id"');
    await queryRunner.query('DROP INDEX "public"."IDX_articles_published_at"');
    await queryRunner.query('DROP TABLE "articles"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
