import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { Product } from "../products/product.entity.js";
import { Order } from "./order.entity.js";

@Entity({ name: "order_items" })
export class OrderItem {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "product_id", type: "bigint", unsigned: true, nullable: true })
  productId!: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "product_id" })
  product!: Product | null;

  @Column({ name: "product_variant_id", type: "bigint", unsigned: true, nullable: true })
  productVariantId!: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant | null;

  @Column({ name: "product_name", type: "varchar", length: 200 })
  productName!: string;

  @Column({ name: "variant_name", type: "varchar", length: 150, nullable: true })
  variantName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  sku!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  barcode!: string | null;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: "unit_cost", type: "decimal", precision: 12, scale: 2, nullable: true })
  unitCost!: string | null;

  @Column({ name: "discount_amount", type: "decimal", precision: 12, scale: 2, default: 0 })
  discountAmount!: string;

  @Column({ name: "line_total", type: "decimal", precision: 12, scale: 2 })
  lineTotal!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
