import bcrypt from "bcryptjs";
import { In } from "typeorm";

import { env } from "../../config/env.js";
import { Brand } from "../../modules/brands/brand.entity.js";
import { Category } from "../../modules/categories/category.entity.js";
import { ProductType } from "../../modules/product-types/product-type.entity.js";
import { Product } from "../../modules/products/product.entity.js";
import { ProductVariant } from "../../modules/products/product-variant.entity.js";
import { Role } from "../../modules/role/role.entity.js";
import { User } from "../../modules/users/user.entity.js";
import { AppDataSource } from "../data-source.js";

async function seed() {
  await AppDataSource.initialize();

  await AppDataSource.transaction(async (manager) => {
    const roleRepository = manager.getRepository(Role);
    const categoryRepository = manager.getRepository(Category);
    const productTypeRepository = manager.getRepository(ProductType);
    const brandRepository = manager.getRepository(Brand);
    const productRepository = manager.getRepository(Product);
    const productVariantRepository = manager.getRepository(ProductVariant);

    await roleRepository.upsert(
      [
        {
          name: "Customer",
          code: "CUSTOMER",
          description: "Regular DokanBD customer",
        },
        {
          name: "Administrator",
          code: "ADMIN",
          description: "Manages the DokanBD platform",
        },
        {
          name: "Owner",
          code: "OWNER",
          description: "Business owner with full access",
        },
      ],
      ["code"],
    );

    await categoryRepository.upsert(
      [
        {
          name: "Clothing",
          slug: "clothing",
          isActive: true,
          sortOrder: 1,
          showOnHomepage: true,
        },
        {
          name: "Accessories",
          slug: "accessories",
          isActive: true,
          sortOrder: 2,
          showOnHomepage: true,
        },
        {
          name: "Electronics",
          slug: "electronics",
          isActive: true,
          sortOrder: 3,
          showOnHomepage: true,
        },
        {
          name: "Footwear",
          slug: "footwear",
          isActive: true,
          sortOrder: 4,
          showOnHomepage: true,
        },
      ],
      ["slug"],
    );

    await productTypeRepository.upsert(
      [
        { name: "Clothing", slug: "clothing", isActive: true },
        { name: "Accessories", slug: "accessories", isActive: true },
        { name: "Electronics", slug: "electronics", isActive: true },
        { name: "Footwear", slug: "footwear", isActive: true },
      ],
      ["slug"],
    );

    await brandRepository.upsert(
      [
        { name: "DokanBD", slug: "dokanbd", isActive: true },
        { name: "Generic", slug: "generic", isActive: true },
      ],
      ["slug"],
    );

    const [clothingCategory, accessoriesCategory, electronicsCategory, footwearCategory] =
      await Promise.all([
        categoryRepository.findOneByOrFail({ slug: "clothing" }),
        categoryRepository.findOneByOrFail({ slug: "accessories" }),
        categoryRepository.findOneByOrFail({ slug: "electronics" }),
        categoryRepository.findOneByOrFail({ slug: "footwear" }),
      ]);
    const [clothingType, accessoriesType, electronicsType, footwearType] =
      await Promise.all([
        productTypeRepository.findOneByOrFail({ slug: "clothing" }),
        productTypeRepository.findOneByOrFail({ slug: "accessories" }),
        productTypeRepository.findOneByOrFail({ slug: "electronics" }),
        productTypeRepository.findOneByOrFail({ slug: "footwear" }),
      ]);
    const [dokanBdBrand, genericBrand] = await Promise.all([
      brandRepository.findOneByOrFail({ slug: "dokanbd" }),
      brandRepository.findOneByOrFail({ slug: "generic" }),
    ]);

    await productRepository.upsert(
      [
        {
          productTypeId: clothingType.id,
          categoryId: clothingCategory.id,
          brandId: dokanBdBrand.id,
          name: "Classic Cotton T-Shirt",
          slug: "classic-cotton-t-shirt",
          shortDescription: "A soft everyday cotton T-shirt with a comfortable regular fit.",
          description:
            "Made for everyday comfort, this breathable cotton T-shirt has a clean silhouette that works on its own or as a base layer.",
          defaultPrice: "899.00",
          defaultCostPrice: "500.00",
          discountPrice: "749.00",
          status: "ACTIVE",
          isFeatured: true,
          isActive: true,
        },
        {
          productTypeId: accessoriesType.id,
          categoryId: accessoriesCategory.id,
          brandId: dokanBdBrand.id,
          name: "Everyday Backpack",
          slug: "everyday-backpack",
          shortDescription: "A practical backpack with room for work, study, and daily essentials.",
          description:
            "A durable, lightweight backpack with a padded main compartment, front organizer pocket, and adjustable shoulder straps.",
          defaultPrice: "1499.00",
          defaultCostPrice: "900.00",
          discountPrice: null,
          status: "ACTIVE",
          isFeatured: false,
          isActive: true,
        },
        {
          productTypeId: electronicsType.id,
          categoryId: electronicsCategory.id,
          brandId: genericBrand.id,
          name: "Wireless Earbuds",
          slug: "wireless-earbuds",
          shortDescription: "Compact wireless earbuds with a pocket-sized charging case.",
          description:
            "Enjoy clear everyday audio, touch controls, and a comfortable in-ear fit with a compact USB-C charging case.",
          defaultPrice: "2499.00",
          defaultCostPrice: "1600.00",
          discountPrice: "2199.00",
          status: "ACTIVE",
          isFeatured: true,
          isActive: true,
        },
        {
          productTypeId: footwearType.id,
          categoryId: footwearCategory.id,
          brandId: dokanBdBrand.id,
          name: "Running Sneakers",
          slug: "running-sneakers",
          shortDescription: "Lightweight sneakers designed for daily walks and casual runs.",
          description:
            "A breathable mesh upper, cushioned footbed, and flexible outsole make these sneakers a dependable daily pair.",
          defaultPrice: "2899.00",
          defaultCostPrice: "1800.00",
          discountPrice: "2599.00",
          status: "ACTIVE",
          isFeatured: true,
          isActive: true,
        },
        {
          productTypeId: accessoriesType.id,
          categoryId: accessoriesCategory.id,
          brandId: genericBrand.id,
          name: "Minimalist Wristwatch",
          slug: "minimalist-wristwatch",
          shortDescription: "A clean, versatile wristwatch for workdays and weekends.",
          description:
            "A simple dial, comfortable adjustable strap, and understated finish make this watch easy to wear with almost anything.",
          defaultPrice: "1899.00",
          defaultCostPrice: "1100.00",
          discountPrice: null,
          status: "ACTIVE",
          isFeatured: false,
          isActive: true,
        },
        {
          productTypeId: electronicsType.id,
          categoryId: electronicsCategory.id,
          brandId: genericBrand.id,
          name: "Portable Bluetooth Speaker",
          slug: "portable-bluetooth-speaker",
          shortDescription: "A compact rechargeable speaker for music at home or on the go.",
          description:
            "This portable speaker delivers balanced sound in a travel-friendly body with straightforward controls and USB-C charging.",
          defaultPrice: "1999.00",
          defaultCostPrice: "1250.00",
          discountPrice: null,
          status: "ACTIVE",
          isFeatured: false,
          isActive: true,
        },
      ],
      ["slug"],
    );

    const seededProducts = await productRepository.findBy({
      slug: In([
        "classic-cotton-t-shirt",
        "everyday-backpack",
        "wireless-earbuds",
        "running-sneakers",
        "minimalist-wristwatch",
        "portable-bluetooth-speaker",
      ]),
    });
    const productIdBySlug = new Map(
      seededProducts.map((product) => [product.slug, product.id]),
    );
    const productId = (slug: string) => {
      const id = productIdBySlug.get(slug);
      if (!id) throw new Error(`Seeded product was not found: ${slug}`);
      return id;
    };

    await productVariantRepository.upsert(
      [
        {
          productId: productId("classic-cotton-t-shirt"),
          vendorId: null,
          sku: "DB-TSHIRT-BLK-M",
          barcode: null,
          variantName: "Black / Medium",
          color: "Black",
          size: "M",
          price: "749.00",
          costPrice: "500.00",
          stockQuantity: 30,
          lowStockLevel: 5,
          weight: "0.25",
          isDefault: true,
          isActive: true,
        },
        {
          productId: productId("classic-cotton-t-shirt"),
          vendorId: null,
          sku: "DB-TSHIRT-NVY-L",
          barcode: null,
          variantName: "Navy / Large",
          color: "Navy",
          size: "L",
          price: "749.00",
          costPrice: "500.00",
          stockQuantity: 20,
          lowStockLevel: 5,
          weight: "0.27",
          isDefault: false,
          isActive: true,
        },
        {
          productId: productId("everyday-backpack"),
          vendorId: null,
          sku: "DB-BACKPACK-BLK",
          barcode: null,
          variantName: "Black",
          color: "Black",
          size: null,
          price: "1499.00",
          costPrice: "900.00",
          stockQuantity: 18,
          lowStockLevel: 4,
          weight: "0.65",
          isDefault: true,
          isActive: true,
        },
        {
          productId: productId("wireless-earbuds"),
          vendorId: null,
          sku: "GEN-EARBUDS-WHT",
          barcode: null,
          variantName: "White",
          color: "White",
          size: null,
          price: "2199.00",
          costPrice: "1600.00",
          stockQuantity: 25,
          lowStockLevel: 5,
          weight: "0.12",
          isDefault: true,
          isActive: true,
        },
        {
          productId: productId("running-sneakers"),
          vendorId: null,
          sku: "DB-SNEAKER-GRY-42",
          barcode: null,
          variantName: "Grey / 42",
          color: "Grey",
          size: "42",
          price: "2599.00",
          costPrice: "1800.00",
          stockQuantity: 14,
          lowStockLevel: 3,
          weight: "0.70",
          isDefault: true,
          isActive: true,
        },
        {
          productId: productId("minimalist-wristwatch"),
          vendorId: null,
          sku: "GEN-WATCH-BRN",
          barcode: null,
          variantName: "Brown strap",
          color: "Brown",
          size: null,
          price: "1899.00",
          costPrice: "1100.00",
          stockQuantity: 12,
          lowStockLevel: 3,
          weight: "0.15",
          isDefault: true,
          isActive: true,
        },
        {
          productId: productId("portable-bluetooth-speaker"),
          vendorId: null,
          sku: "GEN-SPEAKER-BLU",
          barcode: null,
          variantName: "Blue",
          color: "Blue",
          size: null,
          price: "1999.00",
          costPrice: "1250.00",
          stockQuantity: 16,
          lowStockLevel: 4,
          weight: "0.45",
          isDefault: true,
          isActive: true,
        },
      ],
      ["sku"],
    );

    if (
      env.SEED_ADMIN_NAME &&
      env.SEED_ADMIN_EMAIL &&
      env.SEED_ADMIN_PHONE &&
      env.SEED_ADMIN_PASSWORD
    ) {
      const adminRole = await roleRepository.findOneByOrFail({ code: "ADMIN" });
      const userRepository = manager.getRepository(User);
      const existingAdmin = await userRepository.findOne({
        where: [
          { email: env.SEED_ADMIN_EMAIL },
          { phone: env.SEED_ADMIN_PHONE },
        ],
        withDeleted: true,
      });
      const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);

      if (existingAdmin) {
        existingAdmin.roleId = adminRole.id;
        existingAdmin.name = env.SEED_ADMIN_NAME;
        existingAdmin.email = env.SEED_ADMIN_EMAIL;
        existingAdmin.emailVerifiedAt = new Date();
        existingAdmin.phone = env.SEED_ADMIN_PHONE;
        existingAdmin.passwordHash = passwordHash;
        existingAdmin.isActive = true;
        existingAdmin.deletedAt = null;
        await userRepository.save(existingAdmin);
      } else {
        await userRepository.save(
          userRepository.create({
            roleId: adminRole.id,
            name: env.SEED_ADMIN_NAME,
            email: env.SEED_ADMIN_EMAIL,
            emailVerifiedAt: new Date(),
            phone: env.SEED_ADMIN_PHONE,
            passwordHash,
            profileImageUrl: null,
            isActive: true,
            lastLoginAt: null,
          }),
        );
      }
    }
  });

  console.log("Seed completed successfully");
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
