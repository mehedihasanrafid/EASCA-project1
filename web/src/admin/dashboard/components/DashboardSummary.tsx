import React from "react";
import { Banknote, CalendarDays, ShoppingBag, TriangleAlert } from "lucide-react";

import type { AdminDashboardSummary } from "../../../api/adminDashboard";
import styles from "../AdminDashboard.module.css";
import { formatInteger, formatMoney } from "../utils/formatters";

interface Props {
  summary: AdminDashboardSummary;
}

export const DashboardSummary: React.FC<Props> = ({ summary }) => {
  const cards = [
    {
      label: "Total sales",
      value: formatMoney(summary.totalSales),
      note: "Excludes cancelled, failed and refunded orders",
      icon: Banknote,
      tone: "",
    },
    {
      label: "Total orders",
      value: formatInteger(summary.totalOrders),
      note: "All orders placed since launch",
      icon: ShoppingBag,
      tone: "",
    },
    {
      label: "Today's orders",
      value: formatInteger(summary.todayOrders),
      note: "Orders placed today",
      icon: CalendarDays,
      tone: styles.today,
    },
    {
      label: "Low stock",
      value: formatInteger(summary.lowStockCount),
      note: "Active variants at or below their limit",
      icon: TriangleAlert,
      tone: styles.stock,
    },
  ];

  return (
    <section className={styles.metricGrid} aria-label="Store summary">
      {cards.map(({ label, value, note, icon: Icon, tone }) => (
        <article className={`${styles.metricCard} ${tone}`.trim()} key={label}>
          <div>
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{note}</span>
          </div>
          <i><Icon size={22} aria-hidden="true" /></i>
        </article>
      ))}
    </section>
  );
};
