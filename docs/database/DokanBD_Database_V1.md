# DokanBD Database Design — Version 1

This document contains the **Version 1 database design** for the DokanBD e-commerce project.

The goal is to keep the first version simple enough to build within the internship timeline while keeping the structure clean enough to extend later.

---

# 1. Users

## Entity: `users`

```text
id                  BIGINT PK
role_id             BIGINT FK -> roles.id
name                VARCHAR(100)
email               VARCHAR(255) UNIQUE NULL
phone               VARCHAR(20) UNIQUE
password_hash       VARCHAR(255)
profile_image_url   VARCHAR(500) NULL
is_active           BOOLEAN DEFAULT TRUE
last_login_at       DATETIME NULL
created_at          DATETIME
updated_at          DATETIME
deleted_at          DATETIME NULL
```

### Relationships

- One role can have many users.
- One user can have many addresses.
- One user can have carts.
- One user can have many orders.

---

# 2. Roles

## Entity: `roles`

```text
id            BIGINT PK
name          VARCHAR(50)
code          VARCHAR(50) UNIQUE
description   VARCHAR(255) NULL
created_at    DATETIME
updated_at    DATETIME
```

### Initial Role Values

```text
CUSTOMER
ADMIN
OWNER
```

### Notes

Guest users are not stored as users unless guest checkout is added later.

---

# 3. Addresses

## Entity: `addresses`

```text
id                BIGINT PK
user_id           BIGINT FK -> users.id
label             VARCHAR(50) NULL
recipient_name    VARCHAR(100)
phone             VARCHAR(20)
address_line_1    VARCHAR(255)
address_line_2    VARCHAR(255) NULL
area              VARCHAR(100)
city              VARCHAR(100)
district          VARCHAR(100)
division          VARCHAR(100)
postal_code       VARCHAR(20) NULL
country           VARCHAR(100) DEFAULT 'Bangladesh'
is_inside_dhaka   BOOLEAN
is_default        BOOLEAN DEFAULT FALSE
created_at        DATETIME
updated_at        DATETIME
deleted_at        DATETIME NULL
```

### Relationships

- One user can have many addresses.

---

# 4. Product Types

## Entity: `product_types`

```text
id            BIGINT PK
name          VARCHAR(100)
slug          VARCHAR(120) UNIQUE
description   TEXT NULL
is_active     BOOLEAN DEFAULT TRUE
created_at    DATETIME
updated_at    DATETIME
```

### Example Values

```text
Clothing
Accessories
Electronics
Footwear
```

---

# 5. Categories

## Entity: `categories`

```text
id            BIGINT PK
parent_id     BIGINT FK -> categories.id NULL
name          VARCHAR(100)
slug          VARCHAR(120) UNIQUE
description   TEXT NULL
image_url     VARCHAR(500) NULL
is_active     BOOLEAN DEFAULT TRUE
sort_order    INT DEFAULT 0
created_at    DATETIME
updated_at    DATETIME
deleted_at    DATETIME NULL
```

### Relationships

- One category can have many child categories.
- One category can contain many products.

---

# 6. Brands

## Entity: `brands`

```text
id            BIGINT PK
name          VARCHAR(100)
slug          VARCHAR(120) UNIQUE
logo_url      VARCHAR(500) NULL
description   TEXT NULL
is_active     BOOLEAN DEFAULT TRUE
created_at    DATETIME
updated_at    DATETIME
```

### Relationships

- One brand can have many products.

---

# 7. Products

## Entity: `products`

```text
id                    BIGINT PK
product_type_id       BIGINT FK -> product_types.id
category_id           BIGINT FK -> categories.id
brand_id              BIGINT FK -> brands.id NULL
name                  VARCHAR(200)
slug                  VARCHAR(220) UNIQUE
short_description     VARCHAR(500) NULL
description           TEXT
default_price         DECIMAL(12,2)
default_cost_price    DECIMAL(12,2) NULL
discount_price        DECIMAL(12,2) NULL
status                VARCHAR(30)
is_featured           BOOLEAN DEFAULT FALSE
is_active             BOOLEAN DEFAULT TRUE
created_at            DATETIME
updated_at            DATETIME
deleted_at            DATETIME NULL
```

### Suggested Status Values

```text
DRAFT
ACTIVE
INACTIVE
DISCONTINUED
```

### Relationships

- One product belongs to one product type.
- One product belongs to one category.
- One product may belong to one brand.
- One product can have many variants.
- One product can have many media files.

---

# 8. Product Variants

## Entity: `product_variants`

```text
id               BIGINT PK
product_id       BIGINT FK -> products.id
vendor_id        BIGINT FK -> vendors.id NULL
sku              VARCHAR(100) UNIQUE
barcode          VARCHAR(100) UNIQUE NULL
variant_name     VARCHAR(150) NULL
color            VARCHAR(100) NULL
size             VARCHAR(100) NULL
price            DECIMAL(12,2)
cost_price       DECIMAL(12,2) NULL
stock_quantity   INT DEFAULT 0
low_stock_level  INT DEFAULT 5
weight           DECIMAL(10,2) NULL
is_default       BOOLEAN DEFAULT FALSE
is_active        BOOLEAN DEFAULT TRUE
created_at       DATETIME
updated_at       DATETIME
deleted_at       DATETIME NULL
```

### Example

```text
Product:
Premium T-Shirt

Variants:
Black / M
Black / L
White / M
White / L
```

### Relationships

- One product can have many variants.
- One vendor can supply many variants.
- One variant can appear in many cart items.
- One variant can appear in many order items.
- One variant can have stock movement records.

---

# 9. Product Media

## Entity: `product_media`

```text
id               BIGINT PK
product_id       BIGINT FK -> products.id
variant_id       BIGINT FK -> product_variants.id NULL
media_type       VARCHAR(20)
url              VARCHAR(500)
thumbnail_url    VARCHAR(500) NULL
alt_text         VARCHAR(255) NULL
sort_order       INT DEFAULT 0
is_primary       BOOLEAN DEFAULT FALSE
created_at       DATETIME
```

### Media Type Values

```text
IMAGE
GIF
VIDEO
```

### Version 1 Rules

```text
Maximum image count: 4
Allowed image formats: jpg, jpeg, png, webp
Maximum image size: 2 MB
```

---

# 10. Vendors

## Entity: `vendors`

```text
id              BIGINT PK
name            VARCHAR(150)
company_name    VARCHAR(150) NULL
contact_person  VARCHAR(100) NULL
phone           VARCHAR(20) NULL
email           VARCHAR(255) NULL
address         TEXT NULL
notes           TEXT NULL
is_active       BOOLEAN DEFAULT TRUE
created_at      DATETIME
updated_at      DATETIME
```

### Relationships

- One vendor can supply many product variants.

---

# 11. Inventory Movements

## Entity: `inventory_movements`

```text
id                   BIGINT PK
product_variant_id   BIGINT FK -> product_variants.id
movement_type        VARCHAR(30)
quantity             INT
quantity_before      INT NULL
quantity_after       INT NULL
reference_type       VARCHAR(50) NULL
reference_id         BIGINT NULL
note                 VARCHAR(500) NULL
created_by           BIGINT FK -> users.id NULL
created_at           DATETIME
```

### Movement Types

```text
PURCHASE
SALE
RETURN
CANCELLATION
ADJUSTMENT
DAMAGED
```

### Notes

Current stock is stored in:

```text
product_variants.stock_quantity
```

`inventory_movements` keeps the history of why stock changed.

---

# 12. Carts

## Entity: `carts`

```text
id           BIGINT PK
user_id      BIGINT FK -> users.id
status       VARCHAR(30)
created_at   DATETIME
updated_at   DATETIME
```

### Status Values

```text
ACTIVE
CONVERTED
ABANDONED
```

### Relationships

- One user can have carts.
- One cart can contain many cart items.

---

# 13. Cart Items

## Entity: `cart_items`

```text
id                   BIGINT PK
cart_id              BIGINT FK -> carts.id
product_variant_id   BIGINT FK -> product_variants.id
quantity             INT
created_at           DATETIME
updated_at           DATETIME
```

### Constraint

```text
UNIQUE(cart_id, product_variant_id)
```

### Relationships

- One cart can contain many cart items.
- One product variant can appear in many carts.

---

# 14. Orders

## Entity: `orders`

```text
id                 BIGINT PK
order_number       VARCHAR(50) UNIQUE
user_id            BIGINT FK -> users.id

order_status       VARCHAR(30)
payment_method     VARCHAR(30) DEFAULT 'COD'
payment_status     VARCHAR(30) DEFAULT 'PENDING'

subtotal           DECIMAL(12,2)
discount_total     DECIMAL(12,2) DEFAULT 0
delivery_charge    DECIMAL(12,2)
grand_total        DECIMAL(12,2)
currency           VARCHAR(10) DEFAULT 'BDT'

recipient_name     VARCHAR(100)
recipient_phone    VARCHAR(20)

address_line_1     VARCHAR(255)
address_line_2     VARCHAR(255) NULL
area               VARCHAR(100)
city               VARCHAR(100)
district           VARCHAR(100)
division           VARCHAR(100)
postal_code        VARCHAR(20) NULL
country            VARCHAR(100) DEFAULT 'Bangladesh'
is_inside_dhaka    BOOLEAN

customer_note      TEXT NULL
admin_note         TEXT NULL

placed_at          DATETIME
confirmed_at       DATETIME NULL
shipped_at         DATETIME NULL
delivered_at       DATETIME NULL
cancelled_at       DATETIME NULL

created_at         DATETIME
updated_at         DATETIME
```

### Order Status Values

```text
PENDING
CONFIRMED
SHIPPED
DELIVERED
CANCELLED
```

### Payment Method

```text
COD
```

### Payment Status Values

```text
PENDING
PAID
FAILED
REFUNDED
```

### Delivery Charge Rule

```text
Inside Dhaka   = 60 BDT
Outside Dhaka  = 120 BDT
```

### Relationships

- One user can have many orders.
- One order can have many order items.
- One order can have many status-history records.

---

# 15. Order Items

## Entity: `order_items`

```text
id                   BIGINT PK
order_id             BIGINT FK -> orders.id
product_id           BIGINT FK -> products.id NULL
product_variant_id   BIGINT FK -> product_variants.id NULL

product_name         VARCHAR(200)
variant_name         VARCHAR(150) NULL
sku                  VARCHAR(100) NULL
barcode              VARCHAR(100) NULL

quantity             INT
unit_price           DECIMAL(12,2)
unit_cost            DECIMAL(12,2) NULL
discount_amount      DECIMAL(12,2) DEFAULT 0
line_total           DECIMAL(12,2)

created_at           DATETIME
```

### Important Rule

The order item stores the purchase-time product data.

Example:

```text
Product current price = 1200 BDT

Old order item:
unit_price = 900 BDT
```

Old orders must not change when the product price changes later.

---

# 16. Order Status History

## Entity: `order_status_history`

```text
id            BIGINT PK
order_id      BIGINT FK -> orders.id
old_status    VARCHAR(30) NULL
new_status    VARCHAR(30)
changed_by    BIGINT FK -> users.id NULL
note          VARCHAR(500) NULL
created_at    DATETIME
```

### Example

```text
PENDING -> CONFIRMED
CONFIRMED -> SHIPPED
SHIPPED -> DELIVERED
PENDING -> CANCELLED
```

---

# 17. Returns

## Entity: `returns`

```text
id              BIGINT PK
return_number   VARCHAR(50) UNIQUE
order_id        BIGINT FK -> orders.id
user_id         BIGINT FK -> users.id
status          VARCHAR(30)
reason          VARCHAR(255)
customer_note   TEXT NULL
admin_note      TEXT NULL
requested_at    DATETIME
approved_at     DATETIME NULL
rejected_at     DATETIME NULL
completed_at    DATETIME NULL
created_at      DATETIME
updated_at      DATETIME
```

### Return Status Values

```text
REQUESTED
APPROVED
REJECTED
COMPLETED
CANCELLED
```

### Note

Returns are optional for the initial client requirement but included in Version 1 database planning because you requested them.

---

# 18. Return Items

## Entity: `return_items`

```text
id              BIGINT PK
return_id       BIGINT FK -> returns.id
order_item_id   BIGINT FK -> order_items.id
quantity        INT
reason          VARCHAR(255)
item_condition  VARCHAR(100) NULL
restock         BOOLEAN DEFAULT FALSE
refund_amount   DECIMAL(12,2) DEFAULT 0
created_at      DATETIME
```

### Relationships

- One return can contain many return items.
- A return item refers to an original order item.

---

# 19. Optional Payment Table

For Version 1, COD can be stored directly in `orders`.

If you want separate payment records from the beginning, use this table.

## Entity: `payments`

```text
id               BIGINT PK
order_id         BIGINT FK -> orders.id
payment_method   VARCHAR(30)
amount           DECIMAL(12,2)
currency         VARCHAR(10) DEFAULT 'BDT'
status           VARCHAR(30)
paid_at          DATETIME NULL
created_at       DATETIME
updated_at       DATETIME
```

### Payment Method Values

```text
COD
```

### Future Values

```text
BKASH
NAGAD
SSLCOMMERZ
CARD
BANK_TRANSFER
```

### Payment Status Values

```text
PENDING
PAID
FAILED
CANCELLED
REFUNDED
```

---

# Version 1 Relationship Map

```text
Role
  |
  | 1
  |
  N
User
├── Address
├── Cart
│   └── CartItem
│       └── ProductVariant
│
├── Order
│   ├── OrderItem
│   │   └── ProductVariant
│   ├── OrderStatusHistory
│   └── Return
│       └── ReturnItem
│
└── InventoryMovement (created_by)


ProductType
    |
    N
Product
├── Category
├── Brand
├── ProductMedia
└── ProductVariant
    ├── Vendor
    ├── CartItem
    ├── OrderItem
    └── InventoryMovement
```

---

# Version 1 Entity List

## Core

- `users`
- `roles`
- `addresses`
- `product_types`
- `categories`
- `brands`
- `products`
- `product_variants`
- `product_media`
- `vendors`
- `inventory_movements`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `order_status_history`

## Included Because You Requested Them

- `returns`
- `return_items`

## Optional for Version 1

- `payments`

---

# Not Included in Version 1

These can be added later without blocking the first project:

- `user_roles`
- generic `attributes`
- `attribute_values`
- `variant_attribute_values`
- `vendor_products`
- `warehouses`
- `inventories`
- `purchase_batches`
- `purchase_items`
- `delivery_methods`
- `couriers`
- `shipments`
- `payment_methods`
- `payment_transactions`
- `refunds`
- `promotions`
- `product_promotions`
- `coupons`
- `wishlists`
- `reviews`
- `notifications`
- `audit_logs`
- `settings`
- `support_tickets`
- `search_history`
- `product_view_history`

---

# Important Version 1 Constraints

```text
1. User phone number must be a valid Bangladesh mobile number.

2. Email should be unique when provided.

3. Product images:
   - jpg / jpeg / png / webp
   - maximum 2 MB each
   - maximum 4 images

4. Product stock must never become negative.

5. Checkout must use a database transaction.

6. Customer cannot order more than available stock.

7. Order item must store purchase-time price.

8. Customer can access only their own:
   - addresses
   - cart
   - orders
   - returns

9. Customer can cancel only:
   PENDING -> CANCELLED

10. Cancellation must restore stock.

11. Valid order flow:
   PENDING
      ->
   CONFIRMED
      ->
   SHIPPED
      ->
   DELIVERED

12. Delivery:
   Inside Dhaka  = 60 BDT
   Outside Dhaka = 120 BDT

13. Passwords must never be stored as plain text.
```

---

# Version 1 Recommended Final Tables

```text
1. users
2. roles
3. addresses
4. product_types
5. categories
6. brands
7. products
8. product_variants
9. product_media
10. vendors
11. inventory_movements
12. carts
13. cart_items
14. orders
15. order_items
16. order_status_history
17. returns
18. return_items
19. payments (optional)
```
