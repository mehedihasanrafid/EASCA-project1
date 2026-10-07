import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "../users/user.entity.js";

@Entity({ name: "orders" })
export class Order {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "order_number", type: "varchar", length: 50, unique: true })
  orderNumber!: string;

  @Column({ name: "user_id", type: "bigint", unsigned: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "order_status", type: "varchar", length: 30 })
  orderStatus!: string;

  @Column({ name: "payment_method", type: "varchar", length: 30, default: "COD" })
  paymentMethod!: string;

  @Column({ name: "payment_status", type: "varchar", length: 30, default: "PENDING" })
  paymentStatus!: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal!: string;

  @Column({ name: "discount_total", type: "decimal", precision: 12, scale: 2, default: 0 })
  discountTotal!: string;

  @Column({ name: "delivery_charge", type: "decimal", precision: 12, scale: 2 })
  deliveryCharge!: string;

  @Column({ name: "grand_total", type: "decimal", precision: 12, scale: 2 })
  grandTotal!: string;

  @Column({ type: "varchar", length: 10, default: "BDT" })
  currency!: string;

  @Column({ name: "recipient_name", type: "varchar", length: 100 })
  recipientName!: string;

  @Column({ name: "recipient_phone", type: "varchar", length: 20 })
  recipientPhone!: string;

  @Column({ name: "address_line_1", type: "varchar", length: 255 })
  addressLine1!: string;

  @Column({ name: "address_line_2", type: "varchar", length: 255, nullable: true })
  addressLine2!: string | null;

  @Column({ type: "varchar", length: 100 })
  area!: string;

  @Column({ type: "varchar", length: 100 })
  city!: string;

  @Column({ type: "varchar", length: 100 })
  district!: string;

  @Column({ type: "varchar", length: 100 })
  division!: string;

  @Column({ name: "postal_code", type: "varchar", length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: "varchar", length: 100, default: "Bangladesh" })
  country!: string;

  @Column({ name: "is_inside_dhaka", type: "boolean" })
  isInsideDhaka!: boolean;

  @Column({ name: "customer_note", type: "text", nullable: true })
  customerNote!: string | null;

  @Column({ name: "admin_note", type: "text", nullable: true })
  adminNote!: string | null;

  @Column({ name: "placed_at", type: "datetime" })
  placedAt!: Date;

  @Column({ name: "confirmed_at", type: "datetime", nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: "shipped_at", type: "datetime", nullable: true })
  shippedAt!: Date | null;

  @Column({ name: "delivered_at", type: "datetime", nullable: true })
  deliveredAt!: Date | null;

  @Column({ name: "cancelled_at", type: "datetime", nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;
}
