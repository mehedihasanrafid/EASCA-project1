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

import { Brand } from "../brands/brand.entity.js";
import { Category } from "../categories/category.entity.js";
import { ProductType } from "../product-types/product-type.entity.js";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_type_id", type: "bigint", unsigned: true })
  productTypeId!: string;

  @ManyToOne(() => ProductType, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_type_id" })
  productType!: ProductType;

  @Column({ name: "category_id", type: "bigint", unsigned: true })
  categoryId!: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @Column({ name: "brand_id", type: "bigint", unsigned: true, nullable: true })
  brandId!: string | null;

  @ManyToOne(() => Brand, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "brand_id" })
  brand!: Brand | null;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "varchar", length: 220, unique: true })
  slug!: string;

  @Column({ name: "short_description", type: "varchar", length: 500, nullable: true })
  shortDescription!: string | null;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "default_price", type: "decimal", precision: 12, scale: 2 })
  defaultPrice!: string;

  @Column({ name: "default_cost_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  defaultCostPrice!: string | null;

  @Column({ name: "discount_price", type: "decimal", precision: 12, scale: 2, nullable: true })
  discountPrice!: string | null;

  @Column({ type: "varchar", length: 30 })
  status!: string;

  @Column({ name: "is_featured", type: "boolean", default: false })
  isFeatured!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
