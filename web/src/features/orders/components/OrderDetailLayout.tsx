import React, { ReactNode } from "react";

interface Props {
  main: ReactNode;
  sidebar: ReactNode;
}

export const OrderDetailLayout: React.FC<Props> = ({ main, sidebar }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,340px)] items-start gap-6 max-[980px]:grid-cols-1">
    <div className="flex min-w-0 flex-col gap-5">{main}</div>
    <aside className="sticky top-24 flex min-w-0 flex-col gap-5 max-[980px]:static">
      {sidebar}
    </aside>
  </div>
);
