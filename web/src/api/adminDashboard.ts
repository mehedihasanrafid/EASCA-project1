import { apiClient } from "./client";

export interface AdminDashboardSummary {
  totalSales: string;
  totalOrders: number;
  todayOrders: number;
  lowStockCount: number;
  currency: "BDT";
}

export interface DailySalesPoint {
  date: string;
  sales: string;
  orderCount: number;
}

export interface BestSellingProduct {
  productId: string | null;
  productName: string;
  quantitySold: number;
  sales: string;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  sku: string;
  stockQuantity: number;
  lowStockLevel: number;
}

export interface AdminDashboardData {
  summary: AdminDashboardSummary;
  dailySales: DailySalesPoint[];
  bestSellingProducts: BestSellingProduct[];
  lowStockProducts: LowStockProduct[];
  generatedAt: string;
}

export const adminDashboardApi = {
  get: () =>
    apiClient<{ dashboard: AdminDashboardData }>("/admin/dashboard", {
      method: "GET",
    }).then(({ dashboard }) => dashboard),
};
