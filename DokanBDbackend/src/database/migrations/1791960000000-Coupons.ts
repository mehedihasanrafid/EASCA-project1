import type { MigrationInterface, QueryRunner } from "typeorm";

export class Coupons1791960000000 implements MigrationInterface {
  name = "Coupons1791960000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`coupons\` (
      \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`code\` varchar(40) NOT NULL, \`name\` varchar(120) NOT NULL,
      \`discount_type\` varchar(20) NOT NULL, \`value\` decimal(12,2) NOT NULL, \`minimum_subtotal\` decimal(12,2) NOT NULL DEFAULT 0,
      \`maximum_discount\` decimal(12,2) NULL, \`starts_at\` datetime NULL, \`ends_at\` datetime NULL,
      \`usage_limit\` int UNSIGNED NULL, \`per_customer_limit\` int UNSIGNED NOT NULL DEFAULT 1, \`used_count\` int UNSIGNED NOT NULL DEFAULT 0,
      \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL,
      UNIQUE INDEX \`UQ_coupon_code\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query("ALTER TABLE `orders` ADD `product_discount_total` decimal(12,2) NOT NULL DEFAULT 0, ADD `coupon_discount_total` decimal(12,2) NOT NULL DEFAULT 0, ADD `coupon_code` varchar(40) NULL");
    await queryRunner.query("UPDATE `orders` SET `product_discount_total` = `discount_total`");
    await queryRunner.query(`CREATE TABLE \`coupon_redemptions\` (
      \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`coupon_id\` bigint UNSIGNED NOT NULL, \`user_id\` bigint UNSIGNED NOT NULL,
      \`order_id\` bigint UNSIGNED NOT NULL, \`code_snapshot\` varchar(40) NOT NULL, \`discount_amount\` decimal(12,2) NOT NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`UQ_coupon_redemption_order\` (\`order_id\`),
      INDEX \`IDX_coupon_redemption_coupon_user\` (\`coupon_id\`, \`user_id\`), PRIMARY KEY (\`id\`),
      CONSTRAINT \`FK_coupon_redemption_coupon\` FOREIGN KEY (\`coupon_id\`) REFERENCES \`coupons\`(\`id\`) ON DELETE RESTRICT,
      CONSTRAINT \`FK_coupon_redemption_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
      CONSTRAINT \`FK_coupon_redemption_order\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE) ENGINE=InnoDB`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `coupon_redemptions`");
    await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `coupon_code`, DROP COLUMN `coupon_discount_total`, DROP COLUMN `product_discount_total`");
    await queryRunner.query("DROP TABLE `coupons`");
  }
}
