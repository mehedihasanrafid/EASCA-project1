import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";
import { Order } from "./order.entity.js";

@Entity({ name: "order_status_history" })
export class OrderStatusHistory {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_id", type: "bigint", unsigned: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "old_status", type: "varchar", length: 30, nullable: true })
  oldStatus!: string | null;

  @Column({ name: "new_status", type: "varchar", length: 30 })
  newStatus!: string;

  @Column({ name: "changed_by", type: "bigint", unsigned: true, nullable: true })
  changedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "changed_by" })
  changedBy!: User | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
