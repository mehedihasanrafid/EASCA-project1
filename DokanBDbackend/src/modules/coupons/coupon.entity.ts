import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "coupons" })
export class Coupon {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ type: "varchar", length: 40, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ name: "discount_type", type: "varchar", length: 20 })
  discountType!: "PERCENTAGE" | "FIXED";

  @Column({ type: "decimal", precision: 12, scale: 2 })
  value!: string;

  @Column({ name: "minimum_subtotal", type: "decimal", precision: 12, scale: 2, default: 0 })
  minimumSubtotal!: string;

  @Column({ name: "maximum_discount", type: "decimal", precision: 12, scale: 2, nullable: true })
  maximumDiscount!: string | null;

  @Column({ name: "starts_at", type: "datetime", nullable: true })
  startsAt!: Date | null;

  @Column({ name: "ends_at", type: "datetime", nullable: true })
  endsAt!: Date | null;

  @Column({ name: "usage_limit", type: "int", unsigned: true, nullable: true })
  usageLimit!: number | null;

  @Column({ name: "per_customer_limit", type: "int", unsigned: true, default: 1 })
  perCustomerLimit!: number;

  @Column({ name: "used_count", type: "int", unsigned: true, default: 0 })
  usedCount!: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deletedAt!: Date | null;
}
