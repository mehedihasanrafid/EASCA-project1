import { In, type EntityManager } from "typeorm";

import { AppDataSource } from "../../database/data-source.js";
import { AppError } from "../../utils/app-error.js";
import { ProductType } from "../product-types/product-type.entity.js";
import { Product } from "../products/product.entity.js";
import { ProductVariant } from "../products/product-variant.entity.js";
import type {
  CreateProductAttributeInput,
  CreateProductAttributeValueInput,
  SetProductAttributesInput,
  SetProductTypeAttributesInput,
  UpdateProductAttributeInput,
  UpdateProductAttributeValueInput,
} from "./product-attribute.schema.js";
import { ProductAttributeValue } from "./product-attribute-value.entity.js";
import { ProductAttributeAssignment } from "./product-attribute-assignment.entity.js";
import { ProductAttribute } from "./product-attribute.entity.js";
import { ProductTypeAttribute } from "./product-type-attribute.entity.js";
import { ProductVariantAttributeValue } from "./product-variant-attribute-value.entity.js";

export interface VariantAttributeSelection {
  id: string;
  label: string;
  code: string;
  colorHex: string | null;
  attribute: {
    id: string;
    name: string;
    code: string;
    inputType: string;
  };
}

interface AttributeSkuUsage {
  count: number;
  examples: string[];
}

/** Build the administrator-facing reason used when a SKU protects an attribute or value. */
export function attributeSkuUsageMessage(kind: "attribute" | "value", name: string, usage: AttributeSkuUsage) {
  const exampleText = usage.examples.length ? ` (${usage.examples.join(", ")}${usage.count > usage.examples.length ? ", …" : ""})` : "";
  const subject = kind === "attribute" ? `the “${name}” attribute` : `the “${name}” value`;
  return `Cannot delete ${subject} because ${usage.count} SKU${usage.count === 1 ? "" : "s"} use${usage.count === 1 ? "s" : ""} it${exampleText}. Reassign or delete the affected SKU variants first.`;
}

/** Explain why an attribute cannot be detached from a Product Type template. */
export function productTypeAttributeRemovalMessage(productTypeName: string, attributeName: string, usage: AttributeSkuUsage) {
  const exampleText = usage.examples.length ? ` (${usage.examples.join(", ")}${usage.count > usage.examples.length ? ", …" : ""})` : "";
  return `Cannot remove “${attributeName}” from ${productTypeName} because ${usage.count} existing SKU${usage.count === 1 ? " uses" : "s use"} it${exampleText}. Reassign or delete the affected SKU variants first.`;
}

/** Explain why an optional/new attribute cannot yet become required. */
export function productTypeAttributeRequiredMessage(productTypeName: string, attributeName: string, usage: AttributeSkuUsage) {
  const exampleText = usage.examples.length ? ` (${usage.examples.join(", ")}${usage.count > usage.examples.length ? ", …" : ""})` : "";
  return `Cannot require “${attributeName}” for ${productTypeName} because ${usage.count} existing SKU${usage.count === 1 ? " has" : "s have"} no value${exampleText}. Add a value to every affected SKU first.`;
}

function slug(value: string) {
  const code = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120).replace(/-+$/g, "");
  if (!code) throw new AppError(400, "ATTRIBUTE_CODE_REQUIRED", "Provide an English code when the name cannot form one.");
  return code;
}

function valueResponse(value: ProductAttributeValue) {
  return {
    id: value.id,
    attributeId: value.attributeId,
    label: value.label,
    code: value.code,
    colorHex: value.colorHex,
    sortOrder: value.sortOrder,
    isActive: value.isActive,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    deletedAt: value.deletedAt,
  };
}

function attributeResponse(attribute: ProductAttribute, values: ProductAttributeValue[] = []) {
  return {
    id: attribute.id,
    name: attribute.name,
    code: attribute.code,
    inputType: attribute.inputType,
    isActive: attribute.isActive,
    values: values.map(valueResponse),
    createdAt: attribute.createdAt,
    updatedAt: attribute.updatedAt,
    deletedAt: attribute.deletedAt,
  };
}

async function assertAttributeCodeAvailable(code: string, ignoredId?: string) {
  const query = AppDataSource.getRepository(ProductAttribute).createQueryBuilder("attribute").withDeleted().where("LOWER(attribute.code) = :code", { code: code.toLowerCase() });
  if (ignoredId) query.andWhere("attribute.id != :ignoredId", { ignoredId });
  if (await query.getOne()) throw new AppError(409, "ATTRIBUTE_CODE_EXISTS", "An attribute with this code already exists.");
}

async function assertValueCodeAvailable(attributeId: string, code: string, ignoredId?: string) {
  const query = AppDataSource.getRepository(ProductAttributeValue).createQueryBuilder("value").withDeleted().where("value.attributeId = :attributeId", { attributeId }).andWhere("LOWER(value.code) = :code", { code: code.toLowerCase() });
  if (ignoredId) query.andWhere("value.id != :ignoredId", { ignoredId });
  if (await query.getOne()) throw new AppError(409, "ATTRIBUTE_VALUE_CODE_EXISTS", "This attribute already has a value with that code.");
}

async function findAttributeSkuUsage(
  manager: EntityManager,
  filter: { attributeId: string } | { valueId: string },
): Promise<AttributeSkuUsage> {
  const baseQuery = manager
    .getRepository(ProductVariantAttributeValue)
    .createQueryBuilder("selection")
    .withDeleted()
    .innerJoin(ProductAttributeValue, "attributeValue", "attributeValue.id = selection.attributeValueId")
    .innerJoin(ProductVariant, "variant", "variant.id = selection.productVariantId");

  if ("valueId" in filter) {
    baseQuery.where("selection.attributeValueId = :valueId", { valueId: filter.valueId });
  } else {
    baseQuery.where("attributeValue.attributeId = :attributeId", { attributeId: filter.attributeId });
  }

  const [{ count = "0" } = {}, examples] = await Promise.all([
    baseQuery.clone().select("COUNT(DISTINCT selection.productVariantId)", "count").getRawOne<{ count: string }>(),
    baseQuery.clone().select("DISTINCT variant.sku", "sku").orderBy("variant.sku", "ASC").limit(3).getRawMany<{ sku: string }>(),
  ]);

  return { count: Number(count), examples: examples.map(({ sku }) => sku) };
}

/** Count only SKUs belonging to products that use the selected Product Type. */
async function findProductTypeAttributeSkuUsage(
  manager: EntityManager,
  productTypeId: string,
  attributeId: string,
): Promise<AttributeSkuUsage> {
  const baseQuery = manager
    .getRepository(ProductVariantAttributeValue)
    .createQueryBuilder("selection")
    .innerJoin(ProductAttributeValue, "attributeValue", "attributeValue.id = selection.attributeValueId")
    .innerJoin(ProductVariant, "variant", "variant.id = selection.productVariantId")
    .innerJoin(Product, "product", "product.id = variant.productId")
    .where("product.productTypeId = :productTypeId", { productTypeId })
    .andWhere("attributeValue.attributeId = :attributeId", { attributeId });

  const [{ count = "0" } = {}, examples] = await Promise.all([
    baseQuery.clone().select("COUNT(DISTINCT selection.productVariantId)", "count").getRawOne<{ count: string }>(),
    baseQuery.clone().select("DISTINCT variant.sku", "sku").orderBy("variant.sku", "ASC").limit(3).getRawMany<{ sku: string }>(),
  ]);

  return { count: Number(count), examples: examples.map(({ sku }) => sku) };
}

/** Find active SKUs that would violate a newly required attribute assignment. */
async function findProductTypeSkusMissingAttribute(
  manager: EntityManager,
  productTypeId: string,
  attributeId: string,
): Promise<AttributeSkuUsage> {
  const baseQuery = manager
    .getRepository(ProductVariant)
    .createQueryBuilder("variant")
    .innerJoin(Product, "product", "product.id = variant.productId")
    .where("product.productTypeId = :productTypeId", { productTypeId })
    .andWhere((query) => {
      const selectedVariantIds = query.subQuery()
        .select("selection.productVariantId")
        .from(ProductVariantAttributeValue, "selection")
        .innerJoin(ProductAttributeValue, "attributeValue", "attributeValue.id = selection.attributeValueId")
        .where("attributeValue.attributeId = :attributeId")
        .getQuery();
      return `variant.id NOT IN ${selectedVariantIds}`;
    })
    .setParameter("attributeId", attributeId);

  const [count, examples] = await Promise.all([
    baseQuery.clone().getCount(),
    baseQuery.clone().select("variant.sku", "sku").orderBy("variant.sku", "ASC").limit(3).getRawMany<{ sku: string }>(),
  ]);

  return { count, examples: examples.map(({ sku }) => sku) };
}

/** Count SKU selections for one product, used before changing its private setup. */
async function findProductAttributeSkuUsage(
  manager: EntityManager,
  productId: string,
  attributeId: string,
): Promise<AttributeSkuUsage> {
  const baseQuery = manager
    .getRepository(ProductVariantAttributeValue)
    .createQueryBuilder("selection")
    .innerJoin(ProductAttributeValue, "attributeValue", "attributeValue.id = selection.attributeValueId")
    .innerJoin(ProductVariant, "variant", "variant.id = selection.productVariantId")
    .where("variant.productId = :productId", { productId })
    .andWhere("attributeValue.attributeId = :attributeId", { attributeId });
  const [{ count = "0" } = {}, examples] = await Promise.all([
    baseQuery.clone().select("COUNT(DISTINCT selection.productVariantId)", "count").getRawOne<{ count: string }>(),
    baseQuery.clone().select("DISTINCT variant.sku", "sku").orderBy("variant.sku", "ASC").limit(3).getRawMany<{ sku: string }>(),
  ]);
  return { count: Number(count), examples: examples.map(({ sku }) => sku) };
}

async function findProductSkusMissingAttribute(
  manager: EntityManager,
  productId: string,
  attributeId: string,
): Promise<AttributeSkuUsage> {
  const baseQuery = manager
    .getRepository(ProductVariant)
    .createQueryBuilder("variant")
    .where("variant.productId = :productId", { productId })
    .andWhere((query) => {
      const selectedVariantIds = query.subQuery()
        .select("selection.productVariantId")
        .from(ProductVariantAttributeValue, "selection")
        .innerJoin(ProductAttributeValue, "attributeValue", "attributeValue.id = selection.attributeValueId")
        .where("attributeValue.attributeId = :attributeId")
        .getQuery();
      return `variant.id NOT IN ${selectedVariantIds}`;
    })
    .setParameter("attributeId", attributeId);
  const [count, examples] = await Promise.all([
    baseQuery.clone().getCount(),
    baseQuery.clone().select("variant.sku", "sku").orderBy("variant.sku", "ASC").limit(3).getRawMany<{ sku: string }>(),
  ]);
  return { count, examples: examples.map(({ sku }) => sku) };
}

export async function listProductAttributes(includeDeleted: boolean) {
  const [attributes, values] = await Promise.all([
    AppDataSource.getRepository(ProductAttribute).find({ withDeleted: includeDeleted, order: { name: "ASC" } }),
    AppDataSource.getRepository(ProductAttributeValue).find({ withDeleted: includeDeleted, order: { sortOrder: "ASC", label: "ASC" } }),
  ]);
  return attributes.map((attribute) => attributeResponse(attribute, values.filter((value) => value.attributeId === attribute.id)));
}

export async function createProductAttribute(input: CreateProductAttributeInput) {
  const code = input.code ?? slug(input.name);
  await assertAttributeCodeAvailable(code);
  const preparedValues = (input.values ?? []).map((label, sortOrder) => ({ label, code: slug(label), sortOrder }));
  const valueCodes = new Set<string>();
  for (const value of preparedValues) {
    if (valueCodes.has(value.code)) {
      throw new AppError(409, "ATTRIBUTE_VALUE_CODE_EXISTS", "Two values produce the same attribute code.");
    }
    valueCodes.add(value.code);
  }

  return AppDataSource.transaction(async (manager) => {
    const attributeRepository = manager.getRepository(ProductAttribute);
    const attribute = await attributeRepository.save(attributeRepository.create({
      name: input.name,
      code,
      inputType: input.inputType,
      isActive: input.isActive ?? true,
    }));
    const valueRepository = manager.getRepository(ProductAttributeValue);
    const values = preparedValues.length
      ? await valueRepository.save(preparedValues.map((value) => valueRepository.create({
        attributeId: attribute.id,
        label: value.label,
        code: value.code,
        colorHex: null,
        sortOrder: value.sortOrder,
        isActive: true,
      })))
      : [];
    return attributeResponse(attribute, values);
  });
}

export async function updateProductAttribute(id: string, input: UpdateProductAttributeInput) {
  const repository = AppDataSource.getRepository(ProductAttribute);
  const attribute = await repository.findOneBy({ id });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  if (input.code !== undefined) { await assertAttributeCodeAvailable(input.code, id); attribute.code = input.code; }
  if (input.name !== undefined) attribute.name = input.name;
  if (input.inputType !== undefined) attribute.inputType = input.inputType;
  if (input.isActive !== undefined) attribute.isActive = input.isActive;
  await repository.save(attribute);
  const values = await AppDataSource.getRepository(ProductAttributeValue).find({ where: { attributeId: id }, order: { sortOrder: "ASC", label: "ASC" } });
  return attributeResponse(attribute, values);
}

export async function deleteProductAttribute(id: string) {
  const repository = AppDataSource.getRepository(ProductAttribute);
  const attribute = await repository.findOneBy({ id });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  await AppDataSource.transaction(async (manager) => {
    const usage = await findAttributeSkuUsage(manager, { attributeId: id });
    if (usage.count > 0) {
      throw new AppError(409, "ATTRIBUTE_IN_USE", attributeSkuUsageMessage("attribute", attribute.name, usage));
    }
    await manager.getRepository(ProductTypeAttribute).delete({ attributeId: id });
    await manager.getRepository(ProductAttributeAssignment).delete({ attributeId: id });
    await manager.getRepository(ProductAttribute).softRemove(attribute);
  });
}

export async function restoreProductAttribute(id: string) {
  const repository = AppDataSource.getRepository(ProductAttribute);
  const attribute = await repository.findOne({ where: { id }, withDeleted: true });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  if (!attribute.deletedAt) throw new AppError(409, "ATTRIBUTE_NOT_DELETED", "This attribute is not deleted.");
  await repository.restore(id);
  attribute.deletedAt = null;
  return attributeResponse(attribute);
}

export async function createProductAttributeValue(attributeId: string, input: CreateProductAttributeValueInput) {
  const attribute = await AppDataSource.getRepository(ProductAttribute).findOneBy({ id: attributeId });
  if (!attribute) throw new AppError(404, "ATTRIBUTE_NOT_FOUND", "Product attribute not found.");
  const code = input.code ?? slug(input.label);
  await assertValueCodeAvailable(attributeId, code);
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.save(repository.create({ attributeId, label: input.label, code, colorHex: input.colorHex ?? null, sortOrder: input.sortOrder ?? 0, isActive: input.isActive ?? true }));
  return valueResponse(value);
}

export async function updateProductAttributeValue(attributeId: string, valueId: string, input: UpdateProductAttributeValueInput) {
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.findOneBy({ id: valueId, attributeId });
  if (!value) throw new AppError(404, "ATTRIBUTE_VALUE_NOT_FOUND", "Attribute value not found.");
  if (input.code !== undefined) { await assertValueCodeAvailable(attributeId, input.code, valueId); value.code = input.code; }
  if (input.label !== undefined) value.label = input.label;
  if (input.colorHex !== undefined) value.colorHex = input.colorHex;
  if (input.sortOrder !== undefined) value.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) value.isActive = input.isActive;
  await repository.save(value);
  return valueResponse(value);
}

export async function deleteProductAttributeValue(attributeId: string, valueId: string) {
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.findOneBy({ id: valueId, attributeId });
  if (!value) throw new AppError(404, "ATTRIBUTE_VALUE_NOT_FOUND", "Attribute value not found.");
  await AppDataSource.transaction(async (manager) => {
    const usage = await findAttributeSkuUsage(manager, { valueId });
    if (usage.count > 0) {
      throw new AppError(409, "ATTRIBUTE_VALUE_IN_USE", attributeSkuUsageMessage("value", value.label, usage));
    }
    await manager.getRepository(ProductAttributeValue).softRemove(value);
  });
}

export async function restoreProductAttributeValue(attributeId: string, valueId: string) {
  const repository = AppDataSource.getRepository(ProductAttributeValue);
  const value = await repository.findOne({ where: { id: valueId, attributeId }, withDeleted: true });
  if (!value) throw new AppError(404, "ATTRIBUTE_VALUE_NOT_FOUND", "Attribute value not found.");
  if (!value.deletedAt) throw new AppError(409, "ATTRIBUTE_VALUE_NOT_DELETED", "This attribute value is not deleted.");
  await repository.restore(valueId);
  value.deletedAt = null;
  return valueResponse(value);
}

export async function getProductTypeAttributes(productTypeId: string) {
  const productType = await AppDataSource.getRepository(ProductType).findOneBy({ id: productTypeId });
  if (!productType) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  const assignments = await AppDataSource.getRepository(ProductTypeAttribute).find({ where: { productTypeId }, relations: { attribute: true }, order: { sortOrder: "ASC" } });
  const valueRows = assignments.length ? await AppDataSource.getRepository(ProductAttributeValue).find({ where: { attributeId: In(assignments.map((item) => item.attributeId)), isActive: true }, order: { sortOrder: "ASC", label: "ASC" } }) : [];
  return assignments.map((assignment) => ({
    attributeId: assignment.attributeId,
    isRequired: assignment.isRequired,
    sortOrder: assignment.sortOrder,
    attribute: attributeResponse(assignment.attribute, valueRows.filter((value) => value.attributeId === assignment.attributeId)),
  }));
}

function productAssignmentResponse(
  assignment: ProductAttributeAssignment,
  values: ProductAttributeValue[],
) {
  return {
    attributeId: assignment.attributeId,
    parentAttributeId: assignment.parentAttributeId,
    isRequired: assignment.isRequired,
    sortOrder: assignment.sortOrder,
    attribute: attributeResponse(
      assignment.attribute,
      values.filter((value) => value.attributeId === assignment.attributeId),
    ),
  };
}

/** Copy a Product Type template once; later edits are private to the product. */
export async function seedProductAttributesFromType(
  manager: EntityManager,
  productId: string,
  productTypeId: string,
) {
  const templates = await manager.getRepository(ProductTypeAttribute).find({
    where: { productTypeId },
    order: { sortOrder: "ASC" },
  });
  if (!templates.length) return;
  const repository = manager.getRepository(ProductAttributeAssignment);
  await repository.save(templates.map((template, index) => repository.create({
    productId,
    attributeId: template.attributeId,
    parentAttributeId: index === 0 ? null : templates[index - 1]!.attributeId,
    isRequired: template.isRequired,
    sortOrder: template.sortOrder,
  })));
}

export async function getProductAttributes(productId: string) {
  const product = await AppDataSource.getRepository(Product).findOneBy({ id: productId });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  const assignments = await AppDataSource.getRepository(ProductAttributeAssignment).find({
    where: { productId },
    relations: { attribute: true },
    order: { sortOrder: "ASC" },
  });
  const values = assignments.length
    ? await AppDataSource.getRepository(ProductAttributeValue).find({
        where: { attributeId: In(assignments.map((item) => item.attributeId)), isActive: true },
        order: { sortOrder: "ASC", label: "ASC" },
      })
    : [];
  return assignments.map((assignment) => productAssignmentResponse(assignment, values));
}

function assertProductAttributeGraph(input: SetProductAttributesInput) {
  const parentById = new Map(input.attributes.map((item) => [
    item.attributeId,
    item.parentAttributeId ?? null,
  ]));
  for (const item of input.attributes) {
    const visited = new Set<string>([item.attributeId]);
    let parentId = item.parentAttributeId ?? null;
    while (parentId) {
      if (visited.has(parentId)) {
        throw new AppError(400, "PRODUCT_ATTRIBUTE_CYCLE", "An attribute parent relationship cannot contain a cycle.");
      }
      visited.add(parentId);
      parentId = parentById.get(parentId) ?? null;
    }
  }
}

export async function setProductAttributes(productId: string, input: SetProductAttributesInput) {
  const product = await AppDataSource.getRepository(Product).findOneBy({ id: productId });
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  assertProductAttributeGraph(input);
  const attributes = input.attributes.length
    ? await AppDataSource.getRepository(ProductAttribute).findBy({
        id: In(input.attributes.map((item) => item.attributeId)),
        isActive: true,
      })
    : [];
  if (attributes.length !== input.attributes.length) {
    throw new AppError(400, "ATTRIBUTE_INVALID", "One or more selected attributes do not exist or are inactive.");
  }

  await AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductAttributeAssignment);
    const current = await repository.find({ where: { productId }, relations: { attribute: true } });
    const requestedIds = new Set(input.attributes.map((item) => item.attributeId));
    const currentById = new Map(current.map((item) => [item.attributeId, item]));
    const nameById = new Map(attributes.map((attribute) => [attribute.id, attribute.name]));

    for (const assignment of current) {
      if (requestedIds.has(assignment.attributeId)) continue;
      const usage = await findProductAttributeSkuUsage(manager, productId, assignment.attributeId);
      if (usage.count > 0) {
        throw new AppError(
          409,
          "PRODUCT_ATTRIBUTE_IN_USE",
          attributeSkuUsageMessage("attribute", assignment.attribute.name, usage),
        );
      }
    }

    for (const requested of input.attributes) {
      if (!requested.isRequired || currentById.get(requested.attributeId)?.isRequired) continue;
      const usage = await findProductSkusMissingAttribute(manager, productId, requested.attributeId);
      if (usage.count > 0) {
        throw new AppError(
          409,
          "PRODUCT_ATTRIBUTE_REQUIRED_CONFLICT",
          `Cannot require “${nameById.get(requested.attributeId) ?? "Attribute"}” because ${usage.count} existing SKU${usage.count === 1 ? " has" : "s have"} no value. Add a value to every affected SKU first.`,
        );
      }
    }

    await repository.delete({ productId });
    if (input.attributes.length) {
      await repository.save(input.attributes.map((item, index) => repository.create({
        productId,
        attributeId: item.attributeId,
        parentAttributeId: item.parentAttributeId ?? null,
        isRequired: item.isRequired ?? false,
        sortOrder: item.sortOrder ?? index,
      })));
    }
  });
  return getProductAttributes(productId);
}

export async function setProductTypeAttributes(productTypeId: string, input: SetProductTypeAttributesInput) {
  const productType = await AppDataSource.getRepository(ProductType).findOneBy({ id: productTypeId });
  if (!productType) throw new AppError(404, "PRODUCT_TYPE_NOT_FOUND", "Product type not found.");
  const attributes = input.attributes.length
    ? await AppDataSource.getRepository(ProductAttribute).findBy({ id: In(input.attributes.map((item) => item.attributeId)) })
    : [];
  if (attributes.length !== input.attributes.length) throw new AppError(400, "ATTRIBUTE_INVALID", "One or more selected attributes do not exist or are deleted.");
  await AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(ProductTypeAttribute);
    const currentAssignments = await repository.find({ where: { productTypeId }, relations: { attribute: true } });
    const currentByAttributeId = new Map(currentAssignments.map((assignment) => [assignment.attributeId, assignment]));
    const requestedAttributeIds = new Set(input.attributes.map((item) => item.attributeId));
    const attributeNameById = new Map(attributes.map((attribute) => [attribute.id, attribute.name]));

    // Removing a template attribute is safe only when no SKU of this type stores
    // a value for it. Otherwise the saved SKU path would become an orphan.
    for (const current of currentAssignments) {
      if (requestedAttributeIds.has(current.attributeId)) continue;
      const usage = await findProductTypeAttributeSkuUsage(manager, productTypeId, current.attributeId);
      if (usage.count > 0) {
        throw new AppError(
          409,
          "PRODUCT_TYPE_ATTRIBUTE_IN_USE",
          productTypeAttributeRemovalMessage(productType.name, current.attribute.name, usage),
        );
      }
    }

    // A required assignment promises that every SKU has a value. Enforce that
    // promise when adding a required attribute or changing optional to required.
    for (const requested of input.attributes) {
      if (!requested.isRequired || currentByAttributeId.get(requested.attributeId)?.isRequired) continue;
      const usage = await findProductTypeSkusMissingAttribute(manager, productTypeId, requested.attributeId);
      if (usage.count > 0) {
        throw new AppError(
          409,
          "PRODUCT_TYPE_ATTRIBUTE_REQUIRED_CONFLICT",
          productTypeAttributeRequiredMessage(productType.name, attributeNameById.get(requested.attributeId) ?? "Attribute", usage),
        );
      }
    }

    await repository.delete({ productTypeId });
    if (input.attributes.length) await repository.save(input.attributes.map((item, index) => repository.create({ productTypeId, attributeId: item.attributeId, isRequired: item.isRequired ?? false, sortOrder: item.sortOrder ?? index })));
  });
  return getProductTypeAttributes(productTypeId);
}

export async function loadVariantAttributeSelections(variantIds: string[], manager: EntityManager = AppDataSource.manager) {
  const result = new Map<string, VariantAttributeSelection[]>();
  if (!variantIds.length) return result;
  const rows = await manager
    .getRepository(ProductVariantAttributeValue)
    .createQueryBuilder("selection")
    .innerJoinAndSelect("selection.attributeValue", "attributeValue")
    .innerJoinAndSelect("attributeValue.attribute", "attribute")
    .innerJoin("selection.productVariant", "variant")
    .innerJoin("variant.product", "product")
    .leftJoin(
      ProductAttributeAssignment,
      "productAssignment",
      "productAssignment.productId = product.id AND productAssignment.attributeId = attribute.id",
    )
    .leftJoin(
      ProductTypeAttribute,
      "assignment",
      "assignment.productTypeId = product.productTypeId AND assignment.attributeId = attribute.id",
    )
    .where("selection.productVariantId IN (:...variantIds)", { variantIds })
    .withDeleted()
    .orderBy("variant.id", "ASC")
    .addOrderBy("COALESCE(productAssignment.sortOrder, assignment.sortOrder)", "ASC")
    .addOrderBy("attribute.id", "ASC")
    .addOrderBy("attributeValue.sortOrder", "ASC")
    .getMany();
  for (const row of rows) {
    const value = row.attributeValue;
    const group = result.get(row.productVariantId) ?? [];
    group.push({ id: value.id, label: value.label, code: value.code, colorHex: value.colorHex, attribute: { id: value.attribute.id, name: value.attribute.name, code: value.attribute.code, inputType: value.attribute.inputType } });
    result.set(row.productVariantId, group);
  }
  return result;
}

export async function validateVariantOptionValues(
  manager: EntityManager,
  productId: string,
  productTypeId: string,
  valueIds: string[],
) {
  const distinctIds = [...new Set(valueIds)];
  if (distinctIds.length !== valueIds.length) throw new AppError(400, "VARIANT_OPTION_DUPLICATE", "A variant cannot contain the same option value more than once.");
  let assignments: Array<{ attributeId: string; isRequired: boolean }> =
    await manager.getRepository(ProductAttributeAssignment).find({ where: { productId } });
  // Legacy fallback keeps products created before the migration usable.
  if (!assignments.length) {
    assignments = await manager.getRepository(ProductTypeAttribute).find({ where: { productTypeId } });
  }
  const values = distinctIds.length ? await manager.getRepository(ProductAttributeValue).find({ where: { id: In(distinctIds), isActive: true }, relations: { attribute: true } }) : [];
  if (values.length !== distinctIds.length) throw new AppError(400, "VARIANT_OPTION_INVALID", "One or more option values do not exist or are inactive.");
  const allowed = new Set(assignments.map((item) => item.attributeId));
  const chosen = new Set<string>();
  for (const value of values) {
    if (!allowed.has(value.attributeId)) throw new AppError(400, "VARIANT_OPTION_NOT_ASSIGNED", `${value.attribute.name} is not selected for this product.`);
    if (chosen.has(value.attributeId)) throw new AppError(400, "VARIANT_OPTION_ATTRIBUTE_DUPLICATE", `Choose only one ${value.attribute.name} value per variant.`);
    chosen.add(value.attributeId);
  }
  const missing = assignments.find((item) => item.isRequired && !chosen.has(item.attributeId));
  if (missing) throw new AppError(400, "VARIANT_REQUIRED_OPTION_MISSING", "A required product option is missing.");
  return values.map((value) => ({ id: value.id, label: value.label, code: value.code, colorHex: value.colorHex, attribute: { id: value.attribute.id, name: value.attribute.name, code: value.attribute.code, inputType: value.attribute.inputType } }));
}

export async function assertVariantCombinationAvailable(manager: EntityManager, productId: string, valueIds: string[], ignoredVariantId?: string) {
  if (!valueIds.length) return;
  const variants = await manager.getRepository(ProductVariant).find({ where: { productId } });
  const candidates = variants.filter((variant) => variant.id !== ignoredVariantId);
  const selections = await loadVariantAttributeSelections(candidates.map((variant) => variant.id), manager);
  const signature = [...valueIds].sort().join(":");
  if (candidates.some((variant) => (selections.get(variant.id) ?? []).map((value) => value.id).sort().join(":") === signature)) {
    throw new AppError(409, "VARIANT_COMBINATION_EXISTS", "This product already has a variant with the same option combination.");
  }
}

export async function replaceVariantAttributeValues(manager: EntityManager, variantId: string, valueIds: string[]) {
  const repository = manager.getRepository(ProductVariantAttributeValue);
  await repository.delete({ productVariantId: variantId });
  if (valueIds.length) await repository.save(valueIds.map((attributeValueId) => repository.create({ productVariantId: variantId, attributeValueId })));
}
