import bcrypt from "bcryptjs";

import { env } from "../../config/env.js";
import { Brand } from "../../modules/brands/brand.entity.js";
import { Category } from "../../modules/categories/category.entity.js";
import { ProductType } from "../../modules/product-types/product-type.entity.js";
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
        },
        {
          name: "Accessories",
          slug: "accessories",
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Electronics",
          slug: "electronics",
          isActive: true,
          sortOrder: 3,
        },
        {
          name: "Footwear",
          slug: "footwear",
          isActive: true,
          sortOrder: 4,
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
