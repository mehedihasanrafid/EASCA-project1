import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";

import { Product } from "../products/product.entity.js";
import { ProductAttribute } from "./product-attribute.entity.js";

/**
 * Product-level attribute configuration.
 *
 * Product Types provide the starting suggestions, while these rows record what
 * this particular product actually uses. A nullable parent keeps an attribute
 * independent; otherwise the UI treats it as the next child level.
 */
@Entity({ name: "product_attribute_assignments" })
export class ProductAttributeAssignment {
  @PrimaryColumn({ name: "product_id", type: "bigint", unsigned: true })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @PrimaryColumn({ name: "attribute_id", type: "bigint", unsigned: true })
  attributeId!: string;

  @ManyToOne(() => ProductAttribute, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "attribute_id" })
  attribute!: ProductAttribute;

  @Column({ name: "parent_attribute_id", type: "bigint", unsigned: true, nullable: true })
  parentAttributeId!: string | null;

  @ManyToOne(() => ProductAttribute, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "parent_attribute_id" })
  parentAttribute!: ProductAttribute | null;

  @Column({ name: "is_required", type: "boolean", default: false })
  isRequired!: boolean;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;
}
