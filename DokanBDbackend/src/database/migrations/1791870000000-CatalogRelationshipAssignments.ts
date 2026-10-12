import type { MigrationInterface, QueryRunner } from "typeorm";

export class CatalogRelationshipAssignments1791870000000 implements MigrationInterface {
  name = "CatalogRelationshipAssignments1791870000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_types` ADD `brand_mode` varchar(20) NOT NULL DEFAULT 'ALL'",
    );
    await queryRunner.query(`
      CREATE TABLE \`category_product_types\` (
        \`category_id\` bigint UNSIGNED NOT NULL,
        \`product_type_id\` bigint UNSIGNED NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        INDEX \`IDX_category_product_types_type\` (\`product_type_id\`),
        PRIMARY KEY (\`category_id\`, \`product_type_id\`),
        CONSTRAINT \`FK_category_product_types_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_category_product_types_type\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`product_type_brands\` (
        \`product_type_id\` bigint UNSIGNED NOT NULL,
        \`brand_id\` bigint UNSIGNED NOT NULL,
        INDEX \`IDX_product_type_brands_brand\` (\`brand_id\`),
        PRIMARY KEY (\`product_type_id\`, \`brand_id\`),
        CONSTRAINT \`FK_product_type_brands_type\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_product_type_brands_brand\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Preserve every category/type pair already used by a product.
    await queryRunner.query(`
      INSERT IGNORE INTO \`category_product_types\` (\`category_id\`, \`product_type_id\`, \`sort_order\`)
      SELECT DISTINCT \`category_id\`, \`product_type_id\`, 0
      FROM \`products\`
    `);

    // Categories without products start permissively so existing admin flows do not become empty.
    await queryRunner.query(`
      INSERT IGNORE INTO \`category_product_types\` (\`category_id\`, \`product_type_id\`, \`sort_order\`)
      SELECT category_row.id, type_row.id, 0
      FROM \`categories\` category_row
      CROSS JOIN \`product_types\` type_row
      WHERE category_row.deleted_at IS NULL
        AND type_row.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM \`category_product_types\` existing
          WHERE existing.category_id = category_row.id
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `product_type_brands`");
    await queryRunner.query("DROP TABLE `category_product_types`");
    await queryRunner.query("ALTER TABLE `product_types` DROP COLUMN `brand_mode`");
  }
}
