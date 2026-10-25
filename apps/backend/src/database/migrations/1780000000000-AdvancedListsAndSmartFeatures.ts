import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdvancedListsAndSmartFeatures1780000000000 implements MigrationInterface {
  name = 'AdvancedListsAndSmartFeatures1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD COLUMN IF NOT EXISTS "list_type" varchar(16) NOT NULL DEFAULT 'normal',
        ADD COLUMN IF NOT EXISTS "budget" numeric(10,2) NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'MXN',
        ADD COLUMN IF NOT EXISTS "auto_sort_aisles" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD CONSTRAINT "chk_shopping_lists_type"
        CHECK ("list_type" IN ('normal', 'advanced'))
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD CONSTRAINT "chk_shopping_lists_budget"
        CHECK ("budget" IS NULL OR ("budget" >= 0 AND "budget" <= 9999999.99))
    `);

    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        ADD CONSTRAINT "chk_shopping_lists_currency"
        CHECK (char_length("currency") = 3)
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD COLUMN IF NOT EXISTS "estimated_price" numeric(10,2) NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "last_paid_price" numeric(10,2) NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "store_name" varchar(80) NULL DEFAULT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD CONSTRAINT "chk_list_items_estimated_price"
        CHECK ("estimated_price" IS NULL OR ("estimated_price" >= 0 AND "estimated_price" <= 999999.99))
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD CONSTRAINT "chk_list_items_last_paid_price"
        CHECK ("last_paid_price" IS NULL OR ("last_paid_price" >= 0 AND "last_paid_price" <= 999999.99))
    `);

    await queryRunner.query(`
      ALTER TABLE "list_items"
        ADD CONSTRAINT "chk_list_items_store_name_length"
        CHECK ("store_name" IS NULL OR char_length("store_name") <= 80)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "chk_list_items_store_name_length"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "chk_list_items_last_paid_price"`);
    await queryRunner.query(`ALTER TABLE "list_items" DROP CONSTRAINT IF EXISTS "chk_list_items_estimated_price"`);
    await queryRunner.query(`
      ALTER TABLE "list_items"
        DROP COLUMN IF EXISTS "store_name",
        DROP COLUMN IF EXISTS "last_paid_price",
        DROP COLUMN IF EXISTS "estimated_price"
    `);

    await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT IF EXISTS "chk_shopping_lists_currency"`);
    await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT IF EXISTS "chk_shopping_lists_budget"`);
    await queryRunner.query(`ALTER TABLE "shopping_lists" DROP CONSTRAINT IF EXISTS "chk_shopping_lists_type"`);
    await queryRunner.query(`
      ALTER TABLE "shopping_lists"
        DROP COLUMN IF EXISTS "auto_sort_aisles",
        DROP COLUMN IF EXISTS "currency",
        DROP COLUMN IF EXISTS "budget",
        DROP COLUMN IF EXISTS "list_type"
    `);
  }
}
