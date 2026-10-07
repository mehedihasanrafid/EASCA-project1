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

import { User } from "../users/user.entity.js";

@Entity({ name: "addresses" })
export class Address {
  @PrimaryGeneratedColumn({
    type: "bigint",
    unsigned: true,
  })
  id!: string;

  @Column({
    name: "user_id",
    type: "bigint",
    unsigned: true,
  })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 50, nullable: true })
  label!: string | null;

  @Column({ name: "recipient_name", type: "varchar", length: 100 })
  recipientName!: string;

  @Column({ type: "varchar", length: 20 })
  phone!: string;

  @Column({ name: "address_line_1", type: "varchar", length: 255 })
  addressLine1!: string;

  @Column({
    name: "address_line_2",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  addressLine2!: string | null;

  @Column({ type: "varchar", length: 100 })
  area!: string;

  @Column({ type: "varchar", length: 100 })
  city!: string;

  @Column({ type: "varchar", length: 100 })
  district!: string;

  @Column({ type: "varchar", length: 100 })
  division!: string;

  @Column({
    name: "postal_code",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  postalCode!: string | null;

  @Column({
    type: "varchar",
    length: 100,
    default: "Bangladesh",
  })
  country!: string;

  @Column({ name: "is_inside_dhaka", type: "boolean" })
  isInsideDhaka!: boolean;

  @Column({
    name: "is_default",
    type: "boolean",
    default: false,
  })
  isDefault!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "datetime",
    nullable: true,
  })
  deletedAt!: Date | null;
}