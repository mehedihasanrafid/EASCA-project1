import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
}

export const OrderPanel: React.FC<Props> = ({ children, className = "", icon, title }) => (
  <section className={`rounded-card border border-line bg-surface p-6 ${className}`}>
    {title && (
      <h2 className="mb-5 flex items-center gap-2 text-[1.15rem] font-bold">
        {icon}
        {title}
      </h2>
    )}
    {children}
  </section>
);
