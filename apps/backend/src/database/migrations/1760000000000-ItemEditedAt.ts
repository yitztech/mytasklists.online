import { MigrationInterface, QueryRunner } from 'typeorm';

/** Fecha de la última edición hecha por una persona (no cambia al comprar ni al reordenar) */
export class ItemEditedAt1760000000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE list_items ADD COLUMN IF NOT EXISTS edited_at timestamptz');
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('ALTER TABLE list_items DROP COLUMN IF EXISTS edited_at');
  }
}
