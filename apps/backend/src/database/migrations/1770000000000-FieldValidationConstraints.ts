import { MigrationInterface, QueryRunner } from 'typeorm';

export class FieldValidationConstraints1770000000000 implements MigrationInterface {
  name = 'FieldValidationConstraints1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Restricciones en users ─────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "chk_users_full_name_length"
        CHECK (char_length("full_name") >= 2 AND char_length("full_name") <= 100)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "chk_users_full_name_chars"
        CHECK ("full_name" ~* '^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜçÇàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕāēīōūĀĒĪŌŪ ''\\.\\-]+$')
    `);

    // ── Restricciones en shopping_lists ────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD CONSTRAINT "chk_shopping_lists_name_length"
        CHECK (char_length("name") >= 2 AND char_length("name") <= 120)
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD CONSTRAINT "chk_shopping_lists_desc_length"
        CHECK ("description" IS NULL OR char_length("description") <= 400)
    `);

    // ── Restricciones en list_items ────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD CONSTRAINT "chk_list_items_name_length"
        CHECK (char_length("name") >= 1 AND char_length("name") <= 140)
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD CONSTRAINT "chk_list_items_note_length"
        CHECK ("note" IS NULL OR char_length("note") <= 300)
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD CONSTRAINT "chk_list_items_unit_length"
        CHECK (char_length("unit") >= 1 AND char_length("unit") <= 20)
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD CONSTRAINT "chk_list_items_category_length"
        CHECK (char_length("category") >= 1 AND char_length("category") <= 40)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "chk_list_items_category_length"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "chk_list_items_unit_length"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "chk_list_items_note_length"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "chk_list_items_name_length"`);
    await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT IF EXISTS "chk_shopping_lists_desc_length"`);
    await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT IF EXISTS "chk_shopping_lists_name_length"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_full_name_chars"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_full_name_length"`);
  }
}
