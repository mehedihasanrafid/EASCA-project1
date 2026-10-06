import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Order } from "../orders/order.entity.js";

@Entity({ name: "payments" })
export class Payment {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "payment_method", type: "varchar", length: 30 })
  paymentMethod!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: "varchar", length: 10, default: "BDT" })
  currency!: string;

  @Column({ type: "varchar", length: 30 })
  status!: string;

  @Column({ name: "paid_at", type: "datetime", nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
