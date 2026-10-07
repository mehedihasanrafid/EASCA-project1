import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { Cart } from "./cart.entity.js";

@Entity({ name: "cart_items" })
@Unique("UQ_cart_items_cart_variant", ["cartId", "productVariantId"])
export class CartItem {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "cart_id", type: "bigint", unsigned: true })
  cartId!: string;

  @ManyToOne(() => Cart, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "cart_id" })
  cart!: Cart;

  @Column({ name: "product_variant_id", type: "bigint", unsigned: true })
  productVariantId!: string;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant;

  @Column({ type: "int" })
  quantity!: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
