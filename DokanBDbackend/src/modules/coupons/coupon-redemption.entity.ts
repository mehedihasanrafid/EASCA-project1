import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Order } from "../orders/order.entity.js";
import { User } from "../users/user.entity.js";
import { Coupon } from "./coupon.entity.js";

@Entity({ name: "coupon_redemptions" })
export class CouponRedemption {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "coupon_id", type: "bigint", unsigned: true })
  couponId!: string;

  @ManyToOne(() => Coupon, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "coupon_id" })
  coupon!: Coupon;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "order_id", type: "bigint", unsigned: true, unique: true })
  orderId!: string;

  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  @Column({ name: "code_snapshot", type: "varchar", length: 40 })
  codeSnapshot!: string;

  @Column({ name: "discount_amount", type: "decimal", precision: 12, scale: 2 })
  discountAmount!: string;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
