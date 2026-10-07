import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { User } from "../users/user.entity.js";

@Entity({ name: "inventory_movements" })
export class InventoryMovement {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id!: string;

  @Column({ name: "product_variant_id", type: "bigint", unsigned: true })
  productVariantId!: string;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant;

  @Column({ name: "movement_type", type: "varchar", length: 30 })
  movementType!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "quantity_before", type: "int", nullable: true })
  quantityBefore!: number | null;

  @Column({ name: "quantity_after", type: "int", nullable: true })
  quantityAfter!: number | null;

  @Column({ name: "reference_type", type: "varchar", length: 50, nullable: true })
  referenceType!: string | null;

  @Column({ name: "reference_id", type: "bigint", unsigned: true, nullable: true })
  referenceId!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  note!: string | null;

  @Column({ name: "created_by", type: "bigint", unsigned: true, nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  createdBy!: User | null;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  createdAt!: Date;
}
