import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import styles from "./AdminProductSearch.module.css";

interface Props {
  value: string;
  onSearch: (value: string) => void;
}

/** Search form for the admin catalog. The parent owns the URL value. */
export const AdminProductSearch: React.FC<Props> = ({ value, onSearch }) => {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const clear = () => {
    setInput("");
    onSearch("");
  };

  return (
    <form
      className={styles.form}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(input);
      }}
    >
      <Search size={18} aria-hidden="true" />
      <label className="sr-only" htmlFor="admin-product-search">Search products</label>
      <input
        id="admin-product-search"
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Search name, SKU, category or brand"
        autoComplete="off"
      />

      {input && (
        <button className={styles.clearButton} type="button" onClick={clear} aria-label="Clear product search">
          <X size={16} aria-hidden="true" />
        </button>
      )}

      <button className={`btn btn-primary ${styles.submitButton}`} type="submit">
        Search
      </button>
    </form>
  );
};
