import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductVariantDimensions1791791000000 implements MigrationInterface {
  name = "ProductVariantDimensions1791791000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_variants` ADD `length_cm` decimal(10,2) NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` ADD `width_cm` decimal(10,2) NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` ADD `height_cm` decimal(10,2) NULL",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_variants` DROP COLUMN `height_cm`",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` DROP COLUMN `width_cm`",
    );
    await queryRunner.query(
      "ALTER TABLE `product_variants` DROP COLUMN `length_cm`",
    );
  }
}
