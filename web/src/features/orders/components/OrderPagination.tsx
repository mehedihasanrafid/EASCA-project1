import React from "react";

import { Pagination } from "../../../components/ui/Pagination";

interface Props {
  loading: boolean;
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}

export const OrderPagination: React.FC<Props> = ({
  loading,
  onPageChange,
  page,
  totalPages,
}) => {
  return (
    <Pagination
      ariaLabel="Order pages"
      disabled={loading}
      onPageChange={onPageChange}
      page={page}
      totalPages={totalPages}
    />
  );
};
