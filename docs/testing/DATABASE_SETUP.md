# DokanBD Local Database Setup and Testing Guide

**Purpose:** Local development and testing only  
**Operating system:** Linux Mint 22.3  
**Database server:** MySQL Community Server 8.0.46  
**Last verified:** 3 October 2026

## 1. Current database details

| Setting | Local testing value |
|---|---|
| Database type | MySQL |
| Host | `127.0.0.1` |
| Port | `3306` |
| Database name | `dokanbd` |
| Application user | `dokanbd` |
| Application password | `Test@1234` |
| Administrator login | `sudo mysql` |
| MySQL service | `mysql` |

> These credentials are intentionally simple for local testing. Never use them in staging or production.

## 2. Installation completed

MySQL was installed with:

```bash
sudo apt update
sudo apt install mysql-server
```

The service was enabled and started with:

```bash
sudo systemctl enable --now mysql
```

The installation was secured with:

```bash
sudo mysql_secure_installation
```

The selected password-validation level is `MEDIUM`. A valid password must contain at least eight characters, uppercase and lowercase letters, a number, and a special character.

The MySQL root account uses `auth_socket`. This is normal on Ubuntu-based systems. Use `sudo mysql` for local database administration instead of assigning the root account a password.

## 3. Database and application user created

The following SQL created the development database and user:

```sql
CREATE DATABASE IF NOT EXISTS dokanbd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'dokanbd'@'localhost'
  IDENTIFIED BY 'Test@1234';

ALTER USER 'dokanbd'@'localhost'
  IDENTIFIED WITH caching_sha2_password BY 'Test@1234'
  ACCOUNT UNLOCK;

GRANT ALL PRIVILEGES ON dokanbd.*
  TO 'dokanbd'@'localhost';

FLUSH PRIVILEGES;
```

The application user was verified as:

```text
User: dokanbd
Host: localhost
Authentication plugin: caching_sha2_password
Account locked: No
```

## 4. Confirmed working login

Connect as the DokanBD application user:

```bash
mysql -u dokanbd -p dokanbd
```

When prompted, type:

```text
Test@1234
```

Linux terminals do not display password characters, dots, or asterisks. Type the password normally and press Enter.

Successful login displays:

```text
Welcome to the MySQL monitor
mysql>
```

Exit the MySQL monitor with:

```sql
EXIT;
```

## 5. Server `.env` configuration

When the Express server is created, place its local environment file at:

```text
server/.env
```

Use:

```env
NODE_ENV=development
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dokanbd
DB_USER=dokanbd
DB_PASSWORD=Test@1234
```

Environment-file rules:

- Write one `NAME=value` entry per line.
- Do not add spaces around `=`.
- Do not commit `server/.env` to Git.
- Add `.env` and `.env.*` to `.gitignore`.
- Keep a safe `.env.example` later, but leave its password blank or use a placeholder.
- Restart the server after changing environment variables.

A safe future `.env.example` should look like:

```env
NODE_ENV=development
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dokanbd
DB_USER=dokanbd
DB_PASSWORD=replace_with_local_password
```

## 6. MySQL service commands

Check whether MySQL is running:

```bash
sudo systemctl status mysql
```

Start MySQL:

```bash
sudo systemctl start mysql
```

Stop MySQL:

```bash
sudo systemctl stop mysql
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

Confirm the installed version:

```bash
mysql --version
```

View recent service logs when MySQL does not start:

```bash
sudo journalctl -u mysql --since today
```

## 7. Login commands

Open the administrative MySQL session:

```bash
sudo mysql
```

Open the DokanBD database with the application user:

```bash
mysql -u dokanbd -p dokanbd
```

Test a TCP connection like the future Node.js server will use:

```bash
mysql -h 127.0.0.1 -P 3306 -u dokanbd -p dokanbd
```

## 8. Essential MySQL commands

Every SQL statement should end with a semicolon.

### Database navigation

List databases:

```sql
SHOW DATABASES;
```

Select DokanBD:

```sql
USE dokanbd;
```

Show the currently selected database and logged-in account:

```sql
SELECT DATABASE(), CURRENT_USER();
```

List tables:

```sql
SHOW TABLES;
```

### Table inspection

Show a table structure:

```sql
DESCRIBE users;
```

Show the SQL used to create a table:

```sql
SHOW CREATE TABLE users;
```

### Reading data

Read all rows from a table:

```sql
SELECT * FROM users;
```

Read only selected columns:

```sql
SELECT id, name, email FROM users;
```

Limit the number of results:

```sql
SELECT * FROM users LIMIT 20;
```

Count rows:

```sql
SELECT COUNT(*) FROM users;
```

### Adding test data

Example only—run it after the `users` table exists:

```sql
INSERT INTO users (name, email)
VALUES ('Test User', 'test@example.com');
```

### Updating data

Always check the `WHERE` condition before running an update:

```sql
UPDATE users
SET name = 'Updated Test User'
WHERE id = 1;
```

### Deleting data

Always include and verify the `WHERE` condition:

```sql
DELETE FROM users
WHERE id = 1;
```

Running `UPDATE` or `DELETE` without `WHERE` may affect every row in the table.

## 9. User and permission commands

Open an administrator session first:

```bash
sudo mysql
```

Show the application user's permissions:

```sql
SHOW GRANTS FOR 'dokanbd'@'localhost';
```

Show its authentication configuration:

```sql
SELECT user, host, plugin, account_locked
FROM mysql.user
WHERE user = 'dokanbd';
```

Reset the local testing password if necessary:

```sql
ALTER USER 'dokanbd'@'localhost'
  IDENTIFIED WITH caching_sha2_password BY 'Test@1234'
  ACCOUNT UNLOCK;

FLUSH PRIVILEGES;
```

## 10. Backup and restore

Create a backup from the normal terminal, not from inside `mysql>`:

```bash
mysqldump -u dokanbd -p dokanbd > dokanbd-backup.sql
```

Restore that backup:

```bash
mysql -u dokanbd -p dokanbd < dokanbd-backup.sql
```

Keep production backups outside the Git repository and protect them because they may contain private customer data.

## 11. Common troubleshooting

### `Access denied for user`

1. Check capitalization—the password is case-sensitive.
2. Remember that the password is invisible while typing.
3. Confirm the account is unlocked and uses `caching_sha2_password`.
4. Reset the password through `sudo mysql` if needed.

### Cannot connect to MySQL

Check the service:

```bash
sudo systemctl status mysql
```

Restart it if necessary:

```bash
sudo systemctl restart mysql
```

### Unknown database

Open the administrator session and check:

```sql
SHOW DATABASES LIKE 'dokanbd';
```

### Application connects through the wrong address

Use these local values consistently:

```text
Host: 127.0.0.1
Port: 3306
```

Do not configure MySQL for public network access during local development.

## 12. Next database steps for DokanBD

Complete these steps when server development begins:

1. Create `server/.env` with the local values shown above.
2. Add `.env` rules to the root `.gitignore` before committing any configuration.
3. Initialize the Node.js and TypeScript server project.
4. Choose a database approach: direct `mysql2` queries or a migration-capable ORM/query builder.
5. Create and test a reusable database connection or connection pool.
6. Add a `/api/v1/health` endpoint that checks both the API and database.
7. Design the first migration instead of manually creating application tables.
8. Start with roles, users, addresses, categories, brands, vendors, products, and inventory.
9. Add carts, orders, payments, and returns only after the catalog foundation is tested.
10. Create repeatable seed data for local development and automated tests.
11. Add separate development and test databases before automated integration tests.
12. Document the schema and migrations under `docs/database/`.

## 13. Recommended test database later

Automated tests should not modify the development database. A separate database can later be created as administrator:

```sql
CREATE DATABASE IF NOT EXISTS dokanbd_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

GRANT ALL PRIVILEGES ON dokanbd_test.*
  TO 'dokanbd'@'localhost';

FLUSH PRIVILEGES;
```

The automated-test environment can then use:

```env
NODE_ENV=test
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dokanbd_test
DB_USER=dokanbd
DB_PASSWORD=Test@1234
```

Never point destructive automated tests at the development or production database.

