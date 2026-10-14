import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { ProductVariant } from "./product-variant.entity.js";
import { Product } from "./product.entity.js";

@Entity({ name: "product_price_tiers" })
export class ProductPriceTier {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_id", type: "bigint", unsigned: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "variant_id", type: "bigint", unsigned: true, nullable: true })
  variantId!: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "variant_id" })
  variant!: ProductVariant | null;

  @Column({ name: "minimum_quantity", type: "int", unsigned: true })
  minimumQuantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "is_promotion", type: "boolean", default: false })
  isPromotion!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
