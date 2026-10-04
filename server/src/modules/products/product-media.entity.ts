import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Product } from "./product.entity.js";
import { ProductVariant } from "./product-variant.entity.js";

@Entity({ name: "product_media" })
export class ProductMedia {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_id", type: "bigint", unsigned: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Column({ name: "variant_id", type: "bigint", unsigned: true, nullable: true })
  variantId!: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "variant_id" })
  variant!: ProductVariant | null;

  @Column({ name: "media_type", type: "varchar", length: 20 })
  mediaType!: string;

  @Column({ type: "varchar", length: 500 })
  url!: string;

  @Column({ name: "thumbnail_url", type: "varchar", length: 500, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ name: "alt_text", type: "varchar", length: 255, nullable: true })
  altText!: string | null;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
