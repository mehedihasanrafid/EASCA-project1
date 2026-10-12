import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { ProductType } from "../product-types/product-type.entity.js";
import { Category } from "./category.entity.js";

@Entity({ name: "category_product_types" })
export class CategoryProductType {
  @PrimaryColumn({ name: "category_id", type: "bigint", unsigned: true })
  categoryId!: string;

  @PrimaryColumn({ name: "product_type_id", type: "bigint", unsigned: true })
  productTypeId!: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: Category;

  @ManyToOne(() => ProductType, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "product_type_id" })
  productType!: ProductType;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;
}
