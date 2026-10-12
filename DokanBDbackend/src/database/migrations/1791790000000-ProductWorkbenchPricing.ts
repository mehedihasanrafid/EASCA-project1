import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductWorkbenchPricing1791790000000 implements MigrationInterface {
  name = "ProductWorkbenchPricing1791790000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `products` ADD `discount_starts_at` datetime NULL");
    await queryRunner.query("ALTER TABLE `products` ADD `discount_ends_at` datetime NULL");
    await queryRunner.query("ALTER TABLE `product_variants` ADD `discount_price` decimal(12,2) NULL");
    await queryRunner.query("ALTER TABLE `product_variants` ADD `discount_starts_at` datetime NULL");
    await queryRunner.query("ALTER TABLE `product_variants` ADD `discount_ends_at` datetime NULL");
    await queryRunner.query(`
      CREATE TABLE \`product_price_tiers\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`product_id\` bigint UNSIGNED NOT NULL,
        \`variant_id\` bigint UNSIGNED NULL,
        \`minimum_quantity\` int UNSIGNED NOT NULL,
        \`unit_price\` decimal(12,2) NOT NULL,
        \`is_promotion\` tinyint NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_price_tier_product\` (\`product_id\`),
        INDEX \`IDX_price_tier_variant\` (\`variant_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_price_tier_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_price_tier_variant\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `product_price_tiers`");
    await queryRunner.query("ALTER TABLE `product_variants` DROP COLUMN `discount_ends_at`");
    await queryRunner.query("ALTER TABLE `product_variants` DROP COLUMN `discount_starts_at`");
    await queryRunner.query("ALTER TABLE `product_variants` DROP COLUMN `discount_price`");
    await queryRunner.query("ALTER TABLE `products` DROP COLUMN `discount_ends_at`");
    await queryRunner.query("ALTER TABLE `products` DROP COLUMN `discount_starts_at`");
  }
}
