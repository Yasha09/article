import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookFilePath1731100000000 implements MigrationInterface {
  name = 'AddBookFilePath1731100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "books" ADD COLUMN "book_file_path" character varying',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "books" DROP COLUMN "book_file_path"',
    );
  }
}
