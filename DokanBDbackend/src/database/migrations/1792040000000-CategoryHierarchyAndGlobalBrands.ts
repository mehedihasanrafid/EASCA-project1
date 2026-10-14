import type { MigrationInterface, QueryRunner } from "typeorm";

export class CategoryHierarchyAndGlobalBrands1792040000000
  implements MigrationInterface
{
  name = "CategoryHierarchyAndGlobalBrands1792040000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `categories` ADD `allow_products` tinyint NOT NULL DEFAULT 1",
    );

    // Existing parent-only categories become grouping nodes, while categories
    // that already own products remain assignable and keep working unchanged.
    await queryRunner.query(`
      UPDATE categories category_row
      INNER JOIN (
        SELECT DISTINCT parent_id
        FROM categories
        WHERE parent_id IS NOT NULL AND deleted_at IS NULL
      ) child_rows ON child_rows.parent_id = category_row.id
      LEFT JOIN (
        SELECT DISTINCT category_id
        FROM products
      ) product_rows ON product_rows.category_id = category_row.id
      SET category_row.allow_products = 0
      WHERE product_rows.category_id IS NULL
    `);

    await queryRunner.query("DROP TABLE `product_type_brands`");
    await queryRunner.query("ALTER TABLE `product_types` DROP COLUMN `brand_mode`");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `product_types` ADD `brand_mode` varchar(20) NOT NULL DEFAULT 'ALL'",
    );
    await queryRunner.query(`
      CREATE TABLE product_type_brands (
        product_type_id bigint UNSIGNED NOT NULL,
        brand_id bigint UNSIGNED NOT NULL,
        INDEX IDX_product_type_brands_brand (brand_id),
        PRIMARY KEY (product_type_id, brand_id),
        CONSTRAINT FK_product_type_brands_type FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE CASCADE,
        CONSTRAINT FK_product_type_brands_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    await queryRunner.query("ALTER TABLE `categories` DROP COLUMN `allow_products`");
  }
}
