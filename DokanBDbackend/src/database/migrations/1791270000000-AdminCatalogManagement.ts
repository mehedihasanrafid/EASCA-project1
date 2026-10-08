import type { MigrationInterface, QueryRunner } from "typeorm";

export class AdminCatalogManagement1791270000000 implements MigrationInterface {
  name = "AdminCatalogManagement1791270000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `categories` ADD `show_on_homepage` tinyint NOT NULL DEFAULT 0 AFTER `sort_order`",
    );
    await queryRunner.query(
      "UPDATE `categories` SET `show_on_homepage` = 1 WHERE `is_active` = 1 AND `deleted_at` IS NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `brands` ADD `deleted_at` datetime NULL AFTER `updated_at`",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `brands` DROP COLUMN `deleted_at`");
    await queryRunner.query(
      "ALTER TABLE `categories` DROP COLUMN `show_on_homepage`",
    );
  }
}
