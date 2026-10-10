import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ProductVariant } from "../products/product-variant.entity.js";
import { ProductAttributeValue } from "./product-attribute-value.entity.js";

@Entity({ name: "product_variant_attribute_values" })
export class ProductVariantAttributeValue {
  @PrimaryColumn({ name: "product_variant_id", type: "bigint", unsigned: true })
  productVariantId!: string;

  @PrimaryColumn({ name: "attribute_value_id", type: "bigint", unsigned: true })
  attributeValueId!: string;

  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_variant_id" })
  productVariant!: ProductVariant;

  @ManyToOne(() => ProductAttributeValue, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "attribute_value_id" })
  attributeValue!: ProductAttributeValue;
}
