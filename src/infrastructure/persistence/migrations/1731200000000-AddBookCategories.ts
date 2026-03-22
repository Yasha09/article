import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookCategories1731200000000 implements MigrationInterface {
  name = 'AddBookCategories1731200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "books_categories" (
        "book_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_books_categories" PRIMARY KEY ("book_id", "category_id"),
        CONSTRAINT "FK_books_categories_book_id" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_books_categories_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_books_categories_book_id" ON "books_categories" ("book_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_books_categories_category_id" ON "books_categories" ("category_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_categories_name" ON "categories" ("name")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."IDX_categories_name"');
    await queryRunner.query(
      'DROP INDEX "public"."IDX_books_categories_category_id"',
    );
    await queryRunner.query(
      'DROP INDEX "public"."IDX_books_categories_book_id"',
    );
    await queryRunner.query('DROP TABLE "books_categories"');
    await queryRunner.query('DROP TABLE "categories"');
  }
}
