import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductTypeManagement1791271000000 implements MigrationInterface {
  name = "ProductTypeManagement1791271000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `product_types` ADD `deleted_at` datetime NULL AFTER `updated_at`");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `product_types` DROP COLUMN `deleted_at`");
  }
}
