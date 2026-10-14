import type { MigrationInterface, QueryRunner } from "typeorm";

export class ProductAttributeAssignments1792130000000 implements MigrationInterface {
  name = "ProductAttributeAssignments1792130000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`product_attribute_assignments\` (
        \`product_id\` bigint UNSIGNED NOT NULL,
        \`attribute_id\` bigint UNSIGNED NOT NULL,
        \`parent_attribute_id\` bigint UNSIGNED NULL,
        \`is_required\` tinyint NOT NULL DEFAULT 0,
        \`sort_order\` int NOT NULL DEFAULT 0,
        INDEX \`IDX_product_attribute_parent\` (\`parent_attribute_id\`),
        PRIMARY KEY (\`product_id\`, \`attribute_id\`),
        CONSTRAINT \`FK_product_attribute_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_product_attribute_attribute\` FOREIGN KEY (\`attribute_id\`) REFERENCES \`catalog_attributes\`(\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`FK_product_attribute_parent\` FOREIGN KEY (\`parent_attribute_id\`) REFERENCES \`catalog_attributes\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // Preserve current behaviour: each existing product starts with a private
    // copy of its Product Type template. Later template changes cannot silently
    // rewrite a product that an administrator already configured.
    await queryRunner.query(`
      INSERT INTO \`product_attribute_assignments\`
        (\`product_id\`, \`attribute_id\`, \`parent_attribute_id\`, \`is_required\`, \`sort_order\`)
      SELECT
        product_row.id,
        assignment.attribute_id,
        previous_assignment.attribute_id,
        assignment.is_required,
        assignment.sort_order
      FROM \`products\` product_row
      INNER JOIN \`product_type_attributes\` assignment
        ON assignment.product_type_id = product_row.product_type_id
      LEFT JOIN \`product_type_attributes\` previous_assignment
        ON previous_assignment.product_type_id = assignment.product_type_id
        AND previous_assignment.sort_order = assignment.sort_order - 1
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `product_attribute_assignments`");
  }
}
