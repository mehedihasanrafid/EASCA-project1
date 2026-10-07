import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791108013191 implements MigrationInterface {
    name = 'InitialSchema1791108013191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`brands\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(100) NOT NULL,
                \`slug\` varchar(120) NOT NULL,
                \`logo_url\` varchar(500) NULL,
                \`description\` text NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_b15428f362be2200922952dc26\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`vendors\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(150) NOT NULL,
                \`company_name\` varchar(150) NULL,
                \`contact_person\` varchar(100) NULL,
                \`phone\` varchar(20) NULL,
                \`email\` varchar(255) NULL,
                \`address\` text NULL,
                \`notes\` text NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`categories\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`parent_id\` bigint UNSIGNED NULL,
                \`name\` varchar(100) NOT NULL,
                \`slug\` varchar(120) NOT NULL,
                \`description\` text NULL,
                \`image_url\` varchar(500) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`sort_order\` int NOT NULL DEFAULT '0',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_420d9f679d41281f282f5bc7d0\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`product_types\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(100) NOT NULL,
                \`slug\` varchar(120) NOT NULL,
                \`description\` text NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_3e8267a546afc4ce1967ba0ab9\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`products\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_type_id\` bigint UNSIGNED NOT NULL,
                \`category_id\` bigint UNSIGNED NOT NULL,
                \`brand_id\` bigint UNSIGNED NULL,
                \`name\` varchar(200) NOT NULL,
                \`slug\` varchar(220) NOT NULL,
                \`short_description\` varchar(500) NULL,
                \`description\` text NOT NULL,
                \`default_price\` decimal(12, 2) NOT NULL,
                \`default_cost_price\` decimal(12, 2) NULL,
                \`discount_price\` decimal(12, 2) NULL,
                \`status\` varchar(30) NOT NULL,
                \`is_featured\` tinyint NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_464f927ae360106b783ed0b410\` (\`slug\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`product_variants\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_id\` bigint UNSIGNED NOT NULL,
                \`vendor_id\` bigint UNSIGNED NULL,
                \`sku\` varchar(100) NOT NULL,
                \`barcode\` varchar(100) NULL,
                \`variant_name\` varchar(150) NULL,
                \`color\` varchar(100) NULL,
                \`size\` varchar(100) NULL,
                \`price\` decimal(12, 2) NOT NULL,
                \`cost_price\` decimal(12, 2) NULL,
                \`stock_quantity\` int NOT NULL DEFAULT '0',
                \`low_stock_level\` int NOT NULL DEFAULT '5',
                \`weight\` decimal(10, 2) NULL,
                \`is_default\` tinyint NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_46f236f21640f9da218a063a86\` (\`sku\`),
                UNIQUE INDEX \`IDX_62124a7ca2686cbaed42f0d3a2\` (\`barcode\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`roles\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`name\` varchar(50) NOT NULL,
                \`code\` varchar(50) NOT NULL,
                \`description\` varchar(255) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` (\`code\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`role_id\` bigint UNSIGNED NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`email\` varchar(255) NULL,
                \`phone\` varchar(20) NOT NULL,
                \`password_hash\` varchar(255) NOT NULL,
                \`profile_image_url\` varchar(500) NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`last_login_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
                UNIQUE INDEX \`IDX_a000cca60bcf04454e72769949\` (\`phone\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`carts\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`status\` varchar(30) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`cart_items\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`cart_id\` bigint UNSIGNED NOT NULL,
                \`product_variant_id\` bigint UNSIGNED NOT NULL,
                \`quantity\` int NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`UQ_cart_items_cart_variant\` (\`cart_id\`, \`product_variant_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`addresses\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`label\` varchar(50) NULL,
                \`recipient_name\` varchar(100) NOT NULL,
                \`phone\` varchar(20) NOT NULL,
                \`address_line_1\` varchar(255) NOT NULL,
                \`address_line_2\` varchar(255) NULL,
                \`area\` varchar(100) NOT NULL,
                \`city\` varchar(100) NOT NULL,
                \`district\` varchar(100) NOT NULL,
                \`division\` varchar(100) NOT NULL,
                \`postal_code\` varchar(20) NULL,
                \`country\` varchar(100) NOT NULL DEFAULT 'Bangladesh',
                \`is_inside_dhaka\` tinyint NOT NULL,
                \`is_default\` tinyint NOT NULL DEFAULT 0,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`inventory_movements\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_variant_id\` bigint UNSIGNED NOT NULL,
                \`movement_type\` varchar(30) NOT NULL,
                \`quantity\` int NOT NULL,
                \`quantity_before\` int NULL,
                \`quantity_after\` int NULL,
                \`reference_type\` varchar(50) NULL,
                \`reference_id\` bigint UNSIGNED NULL,
                \`note\` varchar(500) NULL,
                \`created_by\` bigint UNSIGNED NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`orders\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_number\` varchar(50) NOT NULL,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`order_status\` varchar(30) NOT NULL,
                \`payment_method\` varchar(30) NOT NULL DEFAULT 'COD',
                \`payment_status\` varchar(30) NOT NULL DEFAULT 'PENDING',
                \`subtotal\` decimal(12, 2) NOT NULL,
                \`discount_total\` decimal(12, 2) NOT NULL DEFAULT '0.00',
                \`delivery_charge\` decimal(12, 2) NOT NULL,
                \`grand_total\` decimal(12, 2) NOT NULL,
                \`currency\` varchar(10) NOT NULL DEFAULT 'BDT',
                \`recipient_name\` varchar(100) NOT NULL,
                \`recipient_phone\` varchar(20) NOT NULL,
                \`address_line_1\` varchar(255) NOT NULL,
                \`address_line_2\` varchar(255) NULL,
                \`area\` varchar(100) NOT NULL,
                \`city\` varchar(100) NOT NULL,
                \`district\` varchar(100) NOT NULL,
                \`division\` varchar(100) NOT NULL,
                \`postal_code\` varchar(20) NULL,
                \`country\` varchar(100) NOT NULL DEFAULT 'Bangladesh',
                \`is_inside_dhaka\` tinyint NOT NULL,
                \`customer_note\` text NULL,
                \`admin_note\` text NULL,
                \`placed_at\` datetime NOT NULL,
                \`confirmed_at\` datetime NULL,
                \`shipped_at\` datetime NULL,
                \`delivered_at\` datetime NULL,
                \`cancelled_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_75eba1c6b1a66b09f2a97e6927\` (\`order_number\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`order_items\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`product_id\` bigint UNSIGNED NULL,
                \`product_variant_id\` bigint UNSIGNED NULL,
                \`product_name\` varchar(200) NOT NULL,
                \`variant_name\` varchar(150) NULL,
                \`sku\` varchar(100) NULL,
                \`barcode\` varchar(100) NULL,
                \`quantity\` int NOT NULL,
                \`unit_price\` decimal(12, 2) NOT NULL,
                \`unit_cost\` decimal(12, 2) NULL,
                \`discount_amount\` decimal(12, 2) NOT NULL DEFAULT '0.00',
                \`line_total\` decimal(12, 2) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`order_status_history\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`old_status\` varchar(30) NULL,
                \`new_status\` varchar(30) NOT NULL,
                \`changed_by\` bigint UNSIGNED NULL,
                \`note\` varchar(500) NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`payments\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`payment_method\` varchar(30) NOT NULL,
                \`amount\` decimal(12, 2) NOT NULL,
                \`currency\` varchar(10) NOT NULL DEFAULT 'BDT',
                \`status\` varchar(30) NOT NULL,
                \`paid_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`product_media\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`product_id\` bigint UNSIGNED NOT NULL,
                \`variant_id\` bigint UNSIGNED NULL,
                \`media_type\` varchar(20) NOT NULL,
                \`url\` varchar(500) NOT NULL,
                \`thumbnail_url\` varchar(500) NULL,
                \`alt_text\` varchar(255) NULL,
                \`sort_order\` int NOT NULL DEFAULT '0',
                \`is_primary\` tinyint NOT NULL DEFAULT 0,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`returns\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`return_number\` varchar(50) NOT NULL,
                \`order_id\` bigint UNSIGNED NOT NULL,
                \`user_id\` bigint UNSIGNED NOT NULL,
                \`status\` varchar(30) NOT NULL,
                \`reason\` varchar(255) NOT NULL,
                \`customer_note\` text NULL,
                \`admin_note\` text NULL,
                \`requested_at\` datetime NOT NULL,
                \`approved_at\` datetime NULL,
                \`rejected_at\` datetime NULL,
                \`completed_at\` datetime NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_df468a204fb304989cea982f20\` (\`return_number\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`return_items\` (
                \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
                \`return_id\` bigint UNSIGNED NOT NULL,
                \`order_item_id\` bigint UNSIGNED NOT NULL,
                \`quantity\` int NOT NULL,
                \`reason\` varchar(255) NOT NULL,
                \`item_condition\` varchar(100) NULL,
                \`restock\` tinyint NOT NULL DEFAULT 0,
                \`refund_amount\` decimal(12, 2) NOT NULL DEFAULT '0.00',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`categories\`
            ADD CONSTRAINT \`FK_88cea2dc9c31951d06437879b40\` FOREIGN KEY (\`parent_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\`
            ADD CONSTRAINT \`FK_9adb63f24f86528856373f0ab9a\` FOREIGN KEY (\`product_type_id\`) REFERENCES \`product_types\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\`
            ADD CONSTRAINT \`FK_9a5f6868c96e0069e699f33e124\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\`
            ADD CONSTRAINT \`FK_1530a6f15d3c79d1b70be98f2be\` FOREIGN KEY (\`brand_id\`) REFERENCES \`brands\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\`
            ADD CONSTRAINT \`FK_6343513e20e2deab45edfce1316\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\`
            ADD CONSTRAINT \`FK_1a3f5b3fdcea288c7410726c7d3\` FOREIGN KEY (\`vendor_id\`) REFERENCES \`vendors\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\`
            ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`carts\`
            ADD CONSTRAINT \`FK_2ec1c94a977b940d85a4f498aea\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\`
            ADD CONSTRAINT \`FK_6385a745d9e12a89b859bb25623\` FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\`
            ADD CONSTRAINT \`FK_de29bab7b2bb3b49c07253275f1\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`addresses\`
            ADD CONSTRAINT \`FK_16aac8a9f6f9c1dd6bcb75ec023\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\`
            ADD CONSTRAINT \`FK_53f466e8e8bee109aea4cefddf5\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\`
            ADD CONSTRAINT \`FK_4a137ccc372acb73821c4dd3991\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`orders\`
            ADD CONSTRAINT \`FK_a922b820eeef29ac1c6800e826a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\`
            ADD CONSTRAINT \`FK_145532db85752b29c57d2b7b1f1\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\`
            ADD CONSTRAINT \`FK_9263386c35b6b242540f9493b00\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\`
            ADD CONSTRAINT \`FK_11836543386b9135a47d54cab70\` FOREIGN KEY (\`product_variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\`
            ADD CONSTRAINT \`FK_1ca7d5228cf9dc589b60243933c\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\`
            ADD CONSTRAINT \`FK_de5bb51ff61072261b6b3419f83\` FOREIGN KEY (\`changed_by\`) REFERENCES \`users\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`payments\`
            ADD CONSTRAINT \`FK_b2f7b823a21562eeca20e72b006\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\`
            ADD CONSTRAINT \`FK_e6bb4a69096db4f6a1f5bada151\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\`
            ADD CONSTRAINT \`FK_b38718bc6a3891beb6e620be706\` FOREIGN KEY (\`variant_id\`) REFERENCES \`product_variants\`(\`id\`) ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\`
            ADD CONSTRAINT \`FK_7c0b171a97595625487728ddb3e\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\`
            ADD CONSTRAINT \`FK_e7a28fbb9eb438bc99e7326fc30\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`return_items\`
            ADD CONSTRAINT \`FK_afc80619fe38ae5911b464af463\` FOREIGN KEY (\`return_id\`) REFERENCES \`returns\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`return_items\`
            ADD CONSTRAINT \`FK_c57d201363c110de07d1fd32027\` FOREIGN KEY (\`order_item_id\`) REFERENCES \`order_items\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`return_items\` DROP FOREIGN KEY \`FK_c57d201363c110de07d1fd32027\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`return_items\` DROP FOREIGN KEY \`FK_afc80619fe38ae5911b464af463\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\` DROP FOREIGN KEY \`FK_e7a28fbb9eb438bc99e7326fc30\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`returns\` DROP FOREIGN KEY \`FK_7c0b171a97595625487728ddb3e\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\` DROP FOREIGN KEY \`FK_b38718bc6a3891beb6e620be706\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_media\` DROP FOREIGN KEY \`FK_e6bb4a69096db4f6a1f5bada151\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_b2f7b823a21562eeca20e72b006\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_de5bb51ff61072261b6b3419f83\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_status_history\` DROP FOREIGN KEY \`FK_1ca7d5228cf9dc589b60243933c\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_11836543386b9135a47d54cab70\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_9263386c35b6b242540f9493b00\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_145532db85752b29c57d2b7b1f1\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_a922b820eeef29ac1c6800e826a\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\` DROP FOREIGN KEY \`FK_4a137ccc372acb73821c4dd3991\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`inventory_movements\` DROP FOREIGN KEY \`FK_53f466e8e8bee109aea4cefddf5\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`addresses\` DROP FOREIGN KEY \`FK_16aac8a9f6f9c1dd6bcb75ec023\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_de29bab7b2bb3b49c07253275f1\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`cart_items\` DROP FOREIGN KEY \`FK_6385a745d9e12a89b859bb25623\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`carts\` DROP FOREIGN KEY \`FK_2ec1c94a977b940d85a4f498aea\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\` DROP FOREIGN KEY \`FK_1a3f5b3fdcea288c7410726c7d3\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`product_variants\` DROP FOREIGN KEY \`FK_6343513e20e2deab45edfce1316\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_1530a6f15d3c79d1b70be98f2be\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_9a5f6868c96e0069e699f33e124\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_9adb63f24f86528856373f0ab9a\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`categories\` DROP FOREIGN KEY \`FK_88cea2dc9c31951d06437879b40\`
        `);
        await queryRunner.query(`
            DROP TABLE \`return_items\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_df468a204fb304989cea982f20\` ON \`returns\`
        `);
        await queryRunner.query(`
            DROP TABLE \`returns\`
        `);
        await queryRunner.query(`
            DROP TABLE \`product_media\`
        `);
        await queryRunner.query(`
            DROP TABLE \`payments\`
        `);
        await queryRunner.query(`
            DROP TABLE \`order_status_history\`
        `);
        await queryRunner.query(`
            DROP TABLE \`order_items\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_75eba1c6b1a66b09f2a97e6927\` ON \`orders\`
        `);
        await queryRunner.query(`
            DROP TABLE \`orders\`
        `);
        await queryRunner.query(`
            DROP TABLE \`inventory_movements\`
        `);
        await queryRunner.query(`
            DROP TABLE \`addresses\`
        `);
        await queryRunner.query(`
            DROP INDEX \`UQ_cart_items_cart_variant\` ON \`cart_items\`
        `);
        await queryRunner.query(`
            DROP TABLE \`cart_items\`
        `);
        await queryRunner.query(`
            DROP TABLE \`carts\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_a000cca60bcf04454e72769949\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP TABLE \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_f6d54f95c31b73fb1bdd8e91d0\` ON \`roles\`
        `);
        await queryRunner.query(`
            DROP TABLE \`roles\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_62124a7ca2686cbaed42f0d3a2\` ON \`product_variants\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_46f236f21640f9da218a063a86\` ON \`product_variants\`
        `);
        await queryRunner.query(`
            DROP TABLE \`product_variants\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_464f927ae360106b783ed0b410\` ON \`products\`
        `);
        await queryRunner.query(`
            DROP TABLE \`products\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_3e8267a546afc4ce1967ba0ab9\` ON \`product_types\`
        `);
        await queryRunner.query(`
            DROP TABLE \`product_types\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_420d9f679d41281f282f5bc7d0\` ON \`categories\`
        `);
        await queryRunner.query(`
            DROP TABLE \`categories\`
        `);
        await queryRunner.query(`
            DROP TABLE \`vendors\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_b15428f362be2200922952dc26\` ON \`brands\`
        `);
        await queryRunner.query(`
            DROP TABLE \`brands\`
        `);
    }

}
