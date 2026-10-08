import { AppDataSource } from "../../database/data-source.js";
import { Brand } from "./brand.entity.js";

export async function listPublicBrands() {
  const brands = await AppDataSource.getRepository(Brand).find({
    where: { isActive: true },
    order: { name: "ASC" },
  });

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
  }));
}
