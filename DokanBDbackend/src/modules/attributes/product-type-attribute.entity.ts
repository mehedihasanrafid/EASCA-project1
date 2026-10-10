import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ProductType } from "../product-types/product-type.entity.js";
import { ProductAttribute } from "./product-attribute.entity.js";

@Entity({ name: "product_type_attributes" })
export class ProductTypeAttribute {
  @PrimaryColumn({ name: "product_type_id", type: "bigint", unsigned: true })
  productTypeId!: string;

  @PrimaryColumn({ name: "attribute_id", type: "bigint", unsigned: true })
  attributeId!: string;

  @ManyToOne(() => ProductType, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_type_id" })
  productType!: ProductType;

  @ManyToOne(() => ProductAttribute, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "attribute_id" })
  attribute!: ProductAttribute;

  @Column({ name: "is_required", type: "boolean", default: false })
  isRequired!: boolean;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;
}
