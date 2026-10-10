import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductAttributesAndVariants1791620000000 implements MigrationInterface {
  name = "ProductAttributesAndVariants1791620000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`catalog_attributes\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`code\` varchar(120) NOT NULL,
        \`input_type\` varchar(20) NOT NULL DEFAULT 'SELECT',
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime NULL,
        UNIQUE INDEX \`UQ_catalog_attributes_code\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`catalog_attribute_values\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`attribute_id\` bigint UNSIGNED NOT NULL,
        \`label\` varchar(100) NOT NULL,
        \`code\` varchar(120) NOT NULL,
        \`color_hex\` varchar(7) NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime NULL,
        UNIQUE INDEX \`UQ_catalog_attribute_value_code\` (\`attribute_id\`, \`code\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_attribute_value_attribute\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`catalog_attributes\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`product_type_attributes\` (
        \`product_type_id\` bigint UNSIGNED NOT NULL,
        \`attribute_id\` bigint UNSIGNED NOT NULL,
        \`is_required\` tinyint NOT NULL DEFAULT 0,
        \`sort_order\` int NOT NULL DEFAULT 0,
        PRIMARY KEY (\`product_type_id\`, \`attribute_id\`),
        CONSTRAINT \`FK_type_attribute_type\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_type_attribute_attribute\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`catalog_attributes\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`product_variant_attribute_values\` (
        \`product_variant_id\` bigint UNSIGNED NOT NULL,
        \`attribute_value_id\` bigint UNSIGNED NOT NULL,
        PRIMARY KEY (\`product_variant_id\`, \`attribute_value_id\`),
        CONSTRAINT \`FK_variant_attribute_variant\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_variant_attribute_value\` FOREIGN KEY (\`attribute_value_id\`) REFERENCES \`catalog_attribute_values\`(\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`INSERT INTO \`catalog_attributes\` (\`name\`, \`code\`, \`input_type\`) SELECT 'Color', 'color', 'COLOR' WHERE EXISTS (SELECT 1 FROM \`product_variants\` WHERE \`color\` IS NOT NULL AND TRIM(\`color\`) != '')`);
    await queryRunner.query(`INSERT INTO \`catalog_attributes\` (\`name\`, \`code\`, \`input_type\`) SELECT 'Size', 'size', 'SELECT' WHERE EXISTS (SELECT 1 FROM \`product_variants\` WHERE \`size\` IS NOT NULL AND TRIM(\`size\`) != '')`);
    await queryRunner.query(`
      INSERT IGNORE INTO \`catalog_attribute_values\` (\`attribute_id\`, \`label\`, \`code\`)
      SELECT a.id, MIN(TRIM(v.color)), LOWER(REPLACE(TRIM(v.color), ' ', '-'))
      FROM \`product_variants\` v JOIN \`catalog_attributes\` a ON a.code = 'color'
      WHERE v.color IS NOT NULL AND TRIM(v.color) != ''
      GROUP BY a.id, LOWER(REPLACE(TRIM(v.color), ' ', '-'))
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`catalog_attribute_values\` (\`attribute_id\`, \`label\`, \`code\`)
      SELECT a.id, MIN(TRIM(v.size)), LOWER(REPLACE(TRIM(v.size), ' ', '-'))
      FROM \`product_variants\` v JOIN \`catalog_attributes\` a ON a.code = 'size'
      WHERE v.size IS NOT NULL AND TRIM(v.size) != ''
      GROUP BY a.id, LOWER(REPLACE(TRIM(v.size), ' ', '-'))
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`product_type_attributes\` (\`product_type_id\`, \`attribute_id\`, \`is_required\`, \`sort_order\`)
      SELECT DISTINCT p.product_type_id, a.id, 0, CASE WHEN a.code = 'color' THEN 0 ELSE 1 END
      FROM \`products\` p JOIN \`product_variants\` v ON v.product_id = p.id
      JOIN \`catalog_attributes\` a ON (a.code = 'color' AND v.color IS NOT NULL AND TRIM(v.color) != '') OR (a.code = 'size' AND v.size IS NOT NULL AND TRIM(v.size) != '')
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`product_variant_attribute_values\` (\`product_variant_id\`, \`attribute_value_id\`)
      SELECT v.id, av.id FROM \`product_variants\` v
      JOIN \`catalog_attributes\` a ON a.code = 'color'
      JOIN \`catalog_attribute_values\` av ON av.attribute_id = a.id AND LOWER(av.label) = LOWER(TRIM(v.color))
      WHERE v.color IS NOT NULL AND TRIM(v.color) != ''
    `);
    await queryRunner.query(`
      INSERT IGNORE INTO \`product_variant_attribute_values\` (\`product_variant_id\`, \`attribute_value_id\`)
      SELECT v.id, av.id FROM \`product_variants\` v
      JOIN \`catalog_attributes\` a ON a.code = 'size'
      JOIN \`catalog_attribute_values\` av ON av.attribute_id = a.id AND LOWER(av.label) = LOWER(TRIM(v.size))
      WHERE v.size IS NOT NULL AND TRIM(v.size) != ''
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `product_variant_attribute_values`");
    await queryRunner.query("DROP TABLE `product_type_attributes`");
    await queryRunner.query("DROP TABLE `catalog_attribute_values`");
    await queryRunner.query("DROP TABLE `catalog_attributes`");
  }
}
