import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  ariaLabel: string;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}

const buttonClass = "inline-flex cursor-pointer items-center gap-[0.3rem] rounded-[0.55rem] border border-line bg-surface px-[0.8rem] py-[0.55rem] text-[0.85rem] font-bold text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-45";

export const Pagination: React.FC<Props> = ({
  ariaLabel,
  disabled = false,
  onPageChange,
  page,
  totalPages,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-6 flex items-center justify-center gap-4" aria-label={ariaLabel}>
      <button
        className={buttonClass}
        type="button"
        disabled={page <= 1 || disabled}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={17} />
        Previous
      </button>
      <span className="text-[0.85rem] text-muted">Page {page} of {totalPages}</span>
      <button
        className={buttonClass}
        type="button"
        disabled={page >= totalPages || disabled}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight size={17} />
      </button>
    </nav>
  );
};
