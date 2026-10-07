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
import { User } from "../users/user.entity.js";

@Entity({ name: "returns" })
export class ProductReturn {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "return_number", type: "varchar", length: 50, unique: true })
  returnNumber!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 30 })
  status!: string;

  @Column({ type: "varchar", length: 255 })
  reason!: string;

  @Column({ name: "customer_note", type: "text", nullable: true })
  customerNote!: string | null;

  @Column({ name: "admin_note", type: "text", nullable: true })
  adminNote!: string | null;

  @Column({ name: "requested_at", type: "datetime" })
  requestedAt!: Date;

  @Column({ name: "approved_at", type: "datetime", nullable: true })
  approvedAt!: Date | null;

  @Column({ name: "rejected_at", type: "datetime", nullable: true })
  rejectedAt!: Date | null;

  @Column({ name: "completed_at", type: "datetime", nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
