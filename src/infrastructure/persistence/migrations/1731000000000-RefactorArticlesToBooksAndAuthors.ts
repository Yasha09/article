import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorArticlesToBooksAndAuthors1731000000000
  implements MigrationInterface
{
  name = 'RefactorArticlesToBooksAndAuthors1731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

    await queryRunner.query(
      'ALTER TABLE "articles" RENAME TO "books"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME CONSTRAINT "PK_articles_id" TO "PK_books_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME CONSTRAINT "FK_articles_author_id" TO "FK_books_created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER INDEX "IDX_articles_published_at" RENAME TO "IDX_books_published_at"',
    );
    await queryRunner.query(
      'ALTER INDEX "IDX_articles_author_id" RENAME TO "IDX_books_created_by_user_id"',
    );

    await queryRunner.query(
      'ALTER TABLE "books" RENAME COLUMN "description" TO "summary"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME COLUMN "author_id" TO "created_by_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" ADD COLUMN "cover_image_path" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "books" ADD COLUMN "author_id" uuid',
    );

    await queryRunner.query(`
      CREATE TABLE "authors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(200) NOT NULL,
        "bio" text,
        "avatar_image_path" character varying,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_authors_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_authors_created_by_user_id" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "authors" ("name", "bio", "avatar_image_path", "created_by_user_id")
      SELECT DISTINCT "users"."email", NULL, NULL, "users"."id"
      FROM "users"
      INNER JOIN "books" ON "books"."created_by_user_id" = "users"."id"
    `);

    await queryRunner.query(`
      UPDATE "books"
      SET "author_id" = "authors"."id"
      FROM "authors"
      WHERE "authors"."created_by_user_id" = "books"."created_by_user_id"
    `);

    await queryRunner.query(
      'ALTER TABLE "books" ALTER COLUMN "author_id" SET NOT NULL',
    );
    await queryRunner.query(`
      ALTER TABLE "books"
      ADD CONSTRAINT "FK_books_author_id"
      FOREIGN KEY ("author_id") REFERENCES "authors"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_books_author_id" ON "books" ("author_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_authors_created_by_user_id" ON "authors" ("created_by_user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_books_title_trgm" ON "books" USING GIN ("title" gin_trgm_ops)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_books_summary_trgm" ON "books" USING GIN ("summary" gin_trgm_ops)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_authors_name_trgm" ON "authors" USING GIN ("name" gin_trgm_ops)',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_authors_bio_trgm" ON "authors" USING GIN ("bio" gin_trgm_ops)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_authors_bio_trgm"');
    await queryRunner.query('DROP INDEX "public"."IDX_authors_name_trgm"');
    await queryRunner.query('DROP INDEX "public"."IDX_books_summary_trgm"');
    await queryRunner.query('DROP INDEX "public"."IDX_books_title_trgm"');
    await queryRunner.query(
      'DROP INDEX "public"."IDX_authors_created_by_user_id"',
    );
    await queryRunner.query('DROP INDEX "public"."IDX_books_author_id"');
    await queryRunner.query(
      'ALTER TABLE "books" DROP CONSTRAINT "FK_books_author_id"',
    );
    await queryRunner.query('DROP TABLE "authors"');
    await queryRunner.query('ALTER TABLE "books" DROP COLUMN "author_id"');
    await queryRunner.query(
      'ALTER TABLE "books" DROP COLUMN "cover_image_path"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME COLUMN "created_by_user_id" TO "author_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME COLUMN "summary" TO "description"',
    );
    await queryRunner.query(
      'ALTER INDEX "IDX_books_created_by_user_id" RENAME TO "IDX_articles_author_id"',
    );
    await queryRunner.query(
      'ALTER INDEX "IDX_books_published_at" RENAME TO "IDX_articles_published_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME CONSTRAINT "FK_books_created_by_user_id" TO "FK_articles_author_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME CONSTRAINT "PK_books_id" TO "PK_articles_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "books" RENAME TO "articles"',
    );
  }
}
