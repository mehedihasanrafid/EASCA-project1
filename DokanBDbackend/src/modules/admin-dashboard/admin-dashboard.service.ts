import { AppDataSource } from "../../database/data-source.js";
import { OrderItem } from "../orders/order-item.entity.js";
import { Order } from "../orders/order.entity.js";
import { ProductVariant } from "../products/product-variant.entity.js";

const RECOGNIZED_SALE_CONDITION =
  "order.order_status <> 'CANCELLED' AND order.payment_status NOT IN ('FAILED', 'REFUNDED')";

interface DailySalesRow {
  date: string;
  sales: string | null;
  orderCount: string;
}

export interface DailySalesPoint {
  date: string;
  sales: string;
  orderCount: number;
}

function money(value: string | number | null | undefined) {
  return Number(value ?? 0).toFixed(2);
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fillDailySales(
  rows: DailySalesRow[],
  today = new Date(),
  numberOfDays = 30,
): DailySalesPoint[] {
  const rowsByDate = new Map(rows.map((row) => [row.date, row]));
  const result: DailySalesPoint[] = [];

  for (let offset = numberOfDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    date.setDate(date.getDate() - offset);
    const dateKey = localDateKey(date);
    const row = rowsByDate.get(dateKey);
    result.push({
      date: dateKey,
      sales: money(row?.sales),
      orderCount: Number(row?.orderCount ?? 0),
    });
  }

  return result;
}

export async function getAdminDashboard() {
  const orderRepository = AppDataSource.getRepository(Order);
  const itemRepository = AppDataSource.getRepository(OrderItem);
  const variantRepository = AppDataSource.getRepository(ProductVariant);

  const lowStockBase = variantRepository
    .createQueryBuilder("variant")
    .innerJoin("variant.product", "product")
    .where("variant.deleted_at IS NULL")
    .andWhere("variant.is_active = :variantActive", { variantActive: true })
    .andWhere("product.deleted_at IS NULL")
    .andWhere("product.is_active = :productActive", { productActive: true })
    .andWhere("product.status = :productStatus", { productStatus: "ACTIVE" })
    .andWhere("variant.stock_quantity <= variant.low_stock_level");

  const [totals, todayOrders, dailyRows, bestSellingRows, lowStockCount, lowStockRows] =
    await Promise.all([
      orderRepository
        .createQueryBuilder("order")
        .select("COUNT(order.id)", "totalOrders")
        .addSelect(
          `COALESCE(SUM(CASE WHEN ${RECOGNIZED_SALE_CONDITION} THEN order.grand_total ELSE 0 END), 0)`,
          "totalSales",
        )
        .getRawOne<{ totalOrders: string; totalSales: string }>(),
      orderRepository
        .createQueryBuilder("order")
        .where("order.placed_at >= CURRENT_DATE()")
        .andWhere("order.placed_at < CURRENT_DATE() + INTERVAL 1 DAY")
        .getCount(),
      orderRepository
        .createQueryBuilder("order")
        .select("DATE_FORMAT(order.placed_at, '%Y-%m-%d')", "date")
        .addSelect("COALESCE(SUM(order.grand_total), 0)", "sales")
        .addSelect("COUNT(order.id)", "orderCount")
        .where("order.placed_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 29 DAY)")
        .andWhere("order.placed_at < CURRENT_DATE() + INTERVAL 1 DAY")
        .andWhere(RECOGNIZED_SALE_CONDITION)
        .groupBy("DATE_FORMAT(order.placed_at, '%Y-%m-%d')")
        .orderBy("DATE_FORMAT(order.placed_at, '%Y-%m-%d')", "ASC")
        .getRawMany<DailySalesRow>(),
      itemRepository
        .createQueryBuilder("item")
        .innerJoin("item.order", "order")
        .select("item.product_id", "productId")
        .addSelect("item.product_name", "productName")
        .addSelect("SUM(item.quantity)", "quantitySold")
        .addSelect("COALESCE(SUM(item.line_total), 0)", "sales")
        .where(RECOGNIZED_SALE_CONDITION)
        .groupBy("item.product_id")
        .addGroupBy("item.product_name")
        .orderBy("quantitySold", "DESC")
        .addOrderBy("sales", "DESC")
        .limit(6)
        .getRawMany<{
          productId: string | null;
          productName: string;
          quantitySold: string;
          sales: string;
        }>(),
      lowStockBase.clone().getCount(),
      lowStockBase
        .clone()
        .select("product.id", "productId")
        .addSelect("product.name", "productName")
        .addSelect("variant.id", "variantId")
        .addSelect("variant.variant_name", "variantName")
        .addSelect("variant.sku", "sku")
        .addSelect("variant.stock_quantity", "stockQuantity")
        .addSelect("variant.low_stock_level", "lowStockLevel")
        .orderBy("variant.stock_quantity", "ASC")
        .addOrderBy("product.name", "ASC")
        .limit(8)
        .getRawMany<{
          productId: string;
          productName: string;
          variantId: string;
          variantName: string | null;
          sku: string;
          stockQuantity: string;
          lowStockLevel: string;
        }>(),
    ]);

  return {
    summary: {
      totalSales: money(totals?.totalSales),
      totalOrders: Number(totals?.totalOrders ?? 0),
      todayOrders,
      lowStockCount,
      currency: "BDT",
    },
    dailySales: fillDailySales(dailyRows),
    bestSellingProducts: bestSellingRows.map((row) => ({
      productId: row.productId === null ? null : String(row.productId),
      productName: row.productName,
      quantitySold: Number(row.quantitySold),
      sales: money(row.sales),
    })),
    lowStockProducts: lowStockRows.map((row) => ({
      productId: String(row.productId),
      productName: row.productName,
      variantId: String(row.variantId),
      variantName: row.variantName || "Default",
      sku: row.sku,
      stockQuantity: Number(row.stockQuantity),
      lowStockLevel: Number(row.lowStockLevel),
    })),
    generatedAt: new Date().toISOString(),
  };
}
