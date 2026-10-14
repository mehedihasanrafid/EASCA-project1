import React, { useMemo } from "react";

import type { DailySalesPoint } from "../../../api/adminDashboard";
import styles from "../AdminDashboard.module.css";

interface Props {
  data: DailySalesPoint[];
}

const chartWidth = 720;
const chartHeight = 260;
const padding = { top: 18, right: 16, bottom: 34, left: 54 };
const compactMoney = new Intl.NumberFormat("en-BD", { notation: "compact", maximumFractionDigits: 1 });
const fullMoney = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-BD", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export const SalesTrendChart: React.FC<Props> = ({ data }) => {
  const geometry = useMemo(() => {
    const values = data.map((point) => Number(point.sales));
    const maximum = Math.max(...values, 1);
    const width = chartWidth - padding.left - padding.right;
    const height = chartHeight - padding.top - padding.bottom;
    const points = values.map((value, index) => ({
      x: padding.left + (index / Math.max(values.length - 1, 1)) * width,
      y: padding.top + height - (value / maximum) * height,
      value,
    }));
    const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
    const baseline = padding.top + height;
    const area = points.length
      ? `M ${points[0].x} ${baseline} L ${points.map(({ x, y }) => `${x} ${y}`).join(" L ")} L ${points[points.length - 1].x} ${baseline} Z`
      : "";

    return { area, height, line, maximum, points };
  }, [data]);

  const labelIndexes = [0, 7, 14, 21, data.length - 1]
    .filter((index, position, values) => index >= 0 && values.indexOf(index) === position);
  const hasSales = data.some((point) => Number(point.sales) > 0);

  return (
    <div className={styles.salesChart}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Daily sales for the last 30 days">
        <title>Daily sales for the last 30 days</title>
        <defs>
          <linearGradient id="sales-area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.33, 0.66, 1].map((ratio) => {
          const y = padding.top + geometry.height * ratio;
          const value = geometry.maximum * (1 - ratio);
          return (
            <g key={ratio}>
              <line className={styles.chartGridline} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} />
              <text className={styles.chartAxisLabel} x={padding.left - 8} y={y + 4} textAnchor="end">
                {compactMoney.format(value)}
              </text>
            </g>
          );
        })}

        {geometry.area && <path d={geometry.area} fill="url(#sales-area-gradient)" />}
        {geometry.line && <polyline className={styles.chartLine} points={geometry.line} />}

        {geometry.points.map((point, index) => (
          <circle className={styles.chartPoint} cx={point.x} cy={point.y} r="3.5" key={data[index].date}>
            <title>{dateLabel(data[index].date)}: {fullMoney.format(point.value)} from {data[index].orderCount} order{data[index].orderCount === 1 ? "" : "s"}</title>
          </circle>
        ))}

        {labelIndexes.map((index) => (
          <text
            className={styles.chartAxisLabel}
            x={geometry.points[index]?.x ?? padding.left}
            y={chartHeight - 8}
            textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
            key={data[index]?.date}
          >
            {data[index] ? dateLabel(data[index].date) : ""}
          </text>
        ))}
      </svg>
      {!hasSales && <p className={styles.chartEmpty}>No recognized sales in this period yet.</p>}
    </div>
  );
};
