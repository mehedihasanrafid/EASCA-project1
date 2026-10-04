import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Role } from "../role/role.entity.js";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: string;

  @Column({
    name: "role_id",
    type: "bigint",
    unsigned: true,
  })
  roleId!: string;

  @ManyToOne(() => Role, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({
    type: "varchar",
    length: 100,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true,
    nullable: true,
  })
  email!: string | null;

  @Column({
    type: "varchar",
    length: 20,
    unique: true,
  })
  phone!: string;

  @Column({
    name: "password_hash",
    type: "varchar",
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({
    name: "profile_image_url",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  profileImageUrl!: string | null;

  @Column({
    name: "is_active",
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: "last_login_at",
    type: "datetime",
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @CreateDateColumn({
    name: "created_at",
    type: "datetime",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "datetime",
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "datetime",
    nullable: true,
  })
  deletedAt!: Date | null;
}