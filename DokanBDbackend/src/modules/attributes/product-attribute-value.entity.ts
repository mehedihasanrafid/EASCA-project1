import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { ProductAttribute } from "./product-attribute.entity.js";

@Entity({ name: "catalog_attribute_values" })
@Index("UQ_catalog_attribute_value_code", ["attributeId", "code"], { unique: true })
export class ProductAttributeValue {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "attribute_id", type: "bigint", unsigned: true })
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "attribute_id" })
  attribute!: ProductAttribute;

  @Column({ type: "varchar", length: 100 })
  label!: string;

  @Column({ type: "varchar", length: 120 })
  code!: string;

  @Column({ name: "color_hex", type: "varchar", length: 7, nullable: true })
  colorHex!: string | null;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
