import type { MigrationInterface, QueryRunner } from "typeorm";

export class AuthSecurity1791190000000 implements MigrationInterface {
  name = "AuthSecurity1791190000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `users` ADD `email_verified_at` datetime NULL AFTER `email`",
    );

    await queryRunner.query(`
      CREATE TABLE \`auth_tokens\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint UNSIGNED NOT NULL,
        \`type\` varchar(30) NOT NULL,
        \`token_hash\` char(64) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`used_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_auth_tokens_hash\` (\`token_hash\`),
        INDEX \`IDX_auth_tokens_user_type\` (\`user_id\`, \`type\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_auth_tokens_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`refresh_sessions\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint UNSIGNED NOT NULL,
        \`token_hash\` char(64) NOT NULL,
        \`expires_at\` datetime NOT NULL,
        \`revoked_at\` datetime NULL,
        \`ip_address\` varchar(64) NULL,
        \`user_agent\` varchar(500) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_refresh_sessions_hash\` (\`token_hash\`),
        INDEX \`IDX_refresh_sessions_user\` (\`user_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_refresh_sessions_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `refresh_sessions`");
    await queryRunner.query("DROP TABLE `auth_tokens`");
    await queryRunner.query("ALTER TABLE `users` DROP COLUMN `email_verified_at`");
  }
}
