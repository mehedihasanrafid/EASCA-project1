import { Category } from "../../modules/categories/category.entity.js";
import { Role } from "../../modules/role/role.entity.js";
import { AppDataSource } from "../data-source.js";

async function seed() {
  await AppDataSource.initialize();

  await AppDataSource.transaction(async (manager) => {
    const roleRepository = manager.getRepository(Role);
    const categoryRepository = manager.getRepository(Category);

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
