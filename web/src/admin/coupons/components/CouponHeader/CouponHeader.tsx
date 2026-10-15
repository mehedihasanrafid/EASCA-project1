import styles from "./CouponHeader.module.css";

/** Page identity kept separate from the page coordinator. */
export const CouponHeader = () => (
  <header className={`${styles.root} admin-page-header`}>
    <div>
      <p className="eyebrow">Marketing</p>
      <h1>Coupons</h1>
      <p>Create secure order discounts with schedules and usage limits.</p>
    </div>
  </header>
);
