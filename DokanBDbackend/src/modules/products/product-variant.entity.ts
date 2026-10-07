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

import { Vendor } from "../vendors/vendor.entity.js";
import { Product } from "./product.entity.js";

@Entity({ name: "product_variants" })
export class ProductVariant {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_id", type: "bigint", unsigned: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "vendor_id", type: "bigint", unsigned: true, nullable: true })
  vendorId!: string | null;

  @ManyToOne(() => Vendor, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "vendor_id" })
  vendor!: Vendor | null;

  @Column({ type: "varchar", length: 100, unique: true })
  sku!: string;

  @Column({ type: "varchar", length: 100, unique: true, nullable: true })
  barcode!: string | null;

  @Column({ name: "variant_name", type: "varchar", length: 150, nullable: true })
  variantName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  color!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  size!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price!: string;

  @Column({ name: "cost_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  costPrice!: string | null;

  @Column({ name: "stock_quantity", type: "int", default: 0 })
  stockQuantity!: number;

  @Column({ name: "low_stock_level", type: "int", default: 5 })
  lowStockLevel!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  weight!: string | null;

  @Column({ name: "is_default", type: "boolean", default: false })
  isDefault!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
