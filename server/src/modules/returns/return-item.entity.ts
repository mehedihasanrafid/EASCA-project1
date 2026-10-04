import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { OrderItem } from "../orders/order-item.entity.js";
import { ProductReturn } from "./return.entity.js";

@Entity({ name: "return_items" })
export class ReturnItem {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "return_id", type: "bigint", unsigned: true })
  returnId!: string;

  @ManyToOne(() => ProductReturn, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "return_id" })
  productReturn!: ProductReturn;

  @Column({ name: "order_item_id", type: "bigint", unsigned: true })
  orderItemId!: string;

  @ManyToOne(() => OrderItem, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_item_id" })
  orderItem!: OrderItem;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "varchar", length: 255 })
  reason!: string;

  @Column({ name: "item_condition", type: "varchar", length: 100, nullable: true })
  itemCondition!: string | null;

  @Column({ type: "boolean", default: false })
  restock!: boolean;

  @Column({ name: "refund_amount", type: "decimal", precision: 12, scale: 2, default: 0 })
  refundAmount!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
