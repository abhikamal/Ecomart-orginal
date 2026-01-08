# EcoMart - Campus Marketplace Documentation

> A domain-restricted e-commerce platform for educational institutions

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Role Hierarchy & Permissions](#4-role-hierarchy--permissions)
5. [Features](#5-features)
6. [User Instructions](#6-user-instructions)
7. [Security](#7-security)
8. [API Reference](#8-api-reference)
9. [Project Structure](#9-project-structure)
10. [Configuration](#10-configuration)

---

## 1. Project Overview

### 1.1 Introduction

**EcoMart** is a campus marketplace platform designed for educational institutions. It enables students and staff to buy and sell products within a trusted, domain-restricted community.

### 1.2 Key Features

- 🔒 Domain-restricted registration (only approved email domains)
- 🛒 Full e-commerce functionality (browse, cart, wishlist, orders)
- 📦 Single-unit inventory system
- 📞 Executive order confirmation workflow
- 👥 Role-based access control (User, Admin, Super Admin)
- 📊 Admin dashboard with analytics
- 📝 Activity logging for super admins

### 1.3 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui (Radix primitives) |
| **Backend** | Lovable Cloud (Supabase) |
| **State Management** | TanStack Query (React Query) |
| **Routing** | React Router DOM v6 |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REACT FRONTEND (Vite)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │  Contexts & Hooks       │  │
│  │  - Index    │  │  - Layout   │  │  - AuthContext          │  │
│  │  - Products │  │  - Admin    │  │  - useActivityLog       │  │
│  │  - Cart     │  │  - UI       │  │  - useAllowedDomain     │  │
│  │  - Orders   │  │             │  │  - useMobile            │  │
│  │  - Admin    │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LOVABLE CLOUD BACKEND                          │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │      DATABASE           │  │      EDGE FUNCTIONS         │   │
│  │  - profiles             │  │  - validate-order           │   │
│  │  - products             │  │    (server-side validation) │   │
│  │  - orders               │  │                             │   │
│  │  - cart_items           │  └─────────────────────────────┘   │
│  │  - wishlist             │                                    │
│  │  - categories           │  ┌─────────────────────────────┐   │
│  │  - user_roles           │  │      STORAGE                │   │
│  │  - activity_logs        │  │  - product-images bucket    │   │
│  │  - allowed_domains      │  │    (public)                 │   │
│  │  - payments             │  └─────────────────────────────┘   │
│  └─────────────────────────┘                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ROW-LEVEL SECURITY (RLS)                    │    │
│  │  - User-based access control                             │    │
│  │  - Role-based policies via has_role() function           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │────▶│  Add to Cart │────▶│   Checkout   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Delivered  │◀────│   Shipped    │◀────│  Confirmed   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                          ┌──────┴───────┐
                                          │   Pending    │
                                          │ (Executive   │
                                          │  confirms    │
                                          │  via call)   │
                                          └──────────────┘
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │    products     │       │   categories    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │◀──────│ seller_id       │       │ name            │
│ full_name       │       │ category_id (FK)│──────▶│ icon_url        │
│ email           │       │ name            │       │ created_at      │
│ username        │       │ description     │       └─────────────────┘
│ phone_number    │       │ price           │
│ avatar_url      │       │ is_free         │       ┌─────────────────┐
│ is_banned       │       │ is_available    │       │ product_images  │
│ created_at      │       │ image_url       │       ├─────────────────┤
│ updated_at      │       │ created_at      │       │ id (PK)         │
└─────────────────┘       │ updated_at      │◀──────│ product_id (FK) │
        │                 └─────────────────┘       │ image_url       │
        │                         │                 │ display_order   │
        │                         │                 │ created_at      │
        ▼                         ▼                 └─────────────────┘
┌─────────────────┐       ┌─────────────────┐
│   user_roles    │       │     orders      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ buyer_id        │
│ role (enum)     │       │ seller_id       │
└─────────────────┘       │ product_id (FK) │
                          │ status (enum)   │
┌─────────────────┐       │ total_amount    │
│  activity_logs  │       │ shipping_address│
├─────────────────┤       │ buyer_phone     │
│ id (PK)         │       │ payment_method  │
│ user_id         │       │ receipt_number  │
│ activity_type   │       │ tracking_number │
│ activity_desc   │       │ executive_notes │
│ ip_address      │       │ confirmed_at    │
│ user_agent      │       │ confirmed_by    │
│ metadata        │       │ created_at      │
│ created_at      │       │ updated_at      │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   cart_items    │       │    wishlist     │       │    payments     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id         │       │ user_id         │       │ order_id (FK)   │
│ product_id (FK) │       │ product_id (FK) │       │ user_id         │
│ quantity        │       │ created_at      │       │ amount          │
│ created_at      │       └─────────────────┘       │ payment_method  │
└─────────────────┘                                 │ payment_status  │
                          ┌─────────────────┐       │ transaction_id  │
                          │ allowed_domains │       │ created_at      │
                          ├─────────────────┤       └─────────────────┘
                          │ id (PK)         │
                          │ domain          │       ┌─────────────────┐
                          │ created_by      │       │ admin_settings  │
                          │ created_at      │       ├─────────────────┤
                          └─────────────────┘       │ id (PK)         │
                                                    │ setting_key     │
                                                    │ setting_value   │
                                                    │ updated_at      │
                                                    └─────────────────┘
```

### 3.2 Table Details

#### profiles
Stores extended user information linked to auth.users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to auth.users |
| full_name | text | User's full name |
| email | text | User's email |
| username | text | Public display name |
| phone_number | text | Contact number |
| avatar_url | text | Profile picture URL |
| is_banned | boolean | Account ban status |

#### products
Product listings in the marketplace.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| seller_id | uuid | Reference to profiles.user_id |
| category_id | uuid | Reference to categories |
| name | text | Product name |
| description | text | Product description |
| price | numeric | Product price (0 if free) |
| is_free | boolean | Whether product is free |
| is_available | boolean | Availability status |
| image_url | text | Primary image URL |

#### orders
Order records with status tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| buyer_id | uuid | Buyer's user_id |
| seller_id | uuid | Seller's user_id |
| product_id | uuid | Reference to products |
| status | order_status | pending/confirmed/shipped/delivered/cancelled |
| total_amount | numeric | Order total |
| shipping_address | text | Delivery address |
| buyer_phone | text | Contact for confirmation |
| payment_method | text | Payment type (cod) |
| receipt_number | text | Auto-generated receipt ID |
| tracking_number | text | Shipping tracking |
| executive_notes | text | Notes from confirmation call |
| confirmed_at | timestamp | When order was confirmed |
| confirmed_by | uuid | Admin who confirmed |

#### user_roles
Role assignments for access control.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to auth.users |
| role | app_role | user/admin/super_admin |

#### activity_logs
User activity tracking for auditing.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who performed action |
| activity_type | text | Type of activity |
| activity_description | text | Human-readable description |
| ip_address | text | User's IP address |
| user_agent | text | Browser/device info |
| metadata | jsonb | Additional data |
| created_at | timestamp | When activity occurred |

### 3.3 Enums

```sql
-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'super_admin');

-- Order status
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);
```

---

## 4. Role Hierarchy & Permissions

### 4.1 Role Definitions

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                               │
│  - All Admin permissions                                         │
│  - View Activity Logs                                            │
│  - Full audit trail access                                       │
├─────────────────────────────────────────────────────────────────┤
│                          ADMIN                                   │
│  - All User permissions                                          │
│  - Access Admin Panel                                            │
│  - Manage all orders (confirm, update status)                    │
│  - Manage users (ban/unban, change roles)                        │
│  - Manage products (CRUD on all products)                        │
│  - Manage categories                                             │
│  - Manage allowed email domains                                  │
├─────────────────────────────────────────────────────────────────┤
│                           USER                                   │
│  - Register & Login (domain-restricted)                          │
│  - Browse products                                               │
│  - Manage cart & wishlist                                        │
│  - Place orders                                                  │
│  - Sell products                                                 │
│  - View own orders                                               │
│  - Update own profile                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Permission Matrix

| Action | User | Admin | Super Admin |
|--------|:----:|:-----:|:-----------:|
| Browse products | ✅ | ✅ | ✅ |
| Add to cart/wishlist | ✅ | ✅ | ✅ |
| Place orders | ✅ | ✅ | ✅ |
| Sell products | ✅ | ✅ | ✅ |
| View own orders | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Access Admin Panel | ❌ | ✅ | ✅ |
| View all orders | ❌ | ✅ | ✅ |
| Confirm orders | ❌ | ✅ | ✅ |
| Manage all products | ❌ | ✅ | ✅ |
| Manage categories | ❌ | ✅ | ✅ |
| Manage users | ❌ | ✅ | ✅ |
| Manage domains | ❌ | ✅ | ✅ |
| View Activity Logs | ❌ | ❌ | ✅ |

### 4.3 RLS Policy Implementation

```sql
-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Example RLS policy using has_role
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

---

## 5. Features

### 5.1 Authentication System

#### Domain-Restricted Registration
- Only emails from approved domains can register
- Domains managed by admins via Settings tab
- Email verification required

#### Registration Fields
| Field | Required | Public |
|-------|:--------:|:------:|
| Full Name | ✅ | ❌ |
| Username | ✅ | ✅ |
| Phone Number | ✅ | ❌ |
| Email | ✅ | ❌ |
| Password | ✅ | ❌ |

#### Activity Logging
All authentication events are logged:
- `signup` - New user registration
- `login` - User sign-in
- `logout` - User sign-out

### 5.2 Product Management

#### Product Fields
- Name (required)
- Description
- Price (or mark as free)
- Category
- Images (up to 5, with ordering)

#### Single-Unit Inventory
```
Product Created (is_available: true)
         │
         ▼
Order Placed ──────▶ is_available: false
         │
         ▼
Order Delivered ───▶ Product removed/stays unavailable
         │
         ▼
Order Cancelled ───▶ is_available: true
```

### 5.3 Order Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORDER LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────┘

Step 1: PENDING
┌─────────────────────────────────────────────────────────────────┐
│  Customer places order                                           │
│  - Product marked unavailable                                    │
│  - Receipt number generated                                      │
│  - Awaiting executive confirmation                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 2: CONFIRMATION CALL
┌─────────────────────────────────────────────────────────────────┐
│  Executive calls customer at buyer_phone                         │
│  - Verify order details                                          │
│  - Confirm shipping address                                      │
│  - Add executive notes (optional)                                │
│  - Decision: CONFIRM or CANCEL                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
Step 3a: CONFIRMED                    Step 3b: CANCELLED
┌─────────────────────┐               ┌─────────────────────┐
│  Order confirmed     │               │  Order cancelled    │
│  - confirmed_at set  │               │  - Product becomes  │
│  - confirmed_by set  │               │    available again  │
│  - Ready for ship    │               │  - End of flow      │
└─────────────────────┘               └─────────────────────┘
              │
              ▼
Step 4: SHIPPED
┌─────────────────────────────────────────────────────────────────┐
│  Order shipped                                                   │
│  - Tracking number added                                         │
│  - Customer notified                                             │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
Step 5: DELIVERED
┌─────────────────────────────────────────────────────────────────┐
│  Order delivered                                                 │
│  - Cash collected (COD)                                          │
│  - Transaction complete                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Admin Panel

#### Dashboard Tab
- Total Revenue
- Total Orders
- Active Users
- Order Status Chart (Pie)
- Recent Activity

#### Orders Tab
- View all orders
- Search by buyer/product
- Filter by status
- Confirm pending orders (with call workflow)
- Update order status
- Add tracking numbers

#### Users Tab
- View all users
- Search by name/email
- Change user roles
- Ban/unban users

#### Products Tab
- View all products
- Add new products
- Edit existing products
- Delete products
- Multi-image management

#### Categories Tab
- View all categories
- Add new categories
- Edit category names
- Delete categories (if no products)

#### Settings Tab
- Manage allowed email domains
- Add new domains
- Remove domains (minimum 1 required)

#### Activity Logs Tab (Super Admin Only)
- View all user activities
- Simple/Detailed view toggle
- Search by user/email/description
- Filter by activity type
- View IP, user agent, metadata

### 5.5 Payment System

#### Supported Methods
- **Cash on Delivery (COD)** - Currently the only supported method

#### Receipt Generation
```
Receipt Number Format: RCP-YYYYMMDD-XXXXXXXX

Example: RCP-20251221-a1b2c3d4
```

Receipt includes:
- Order ID
- Receipt Number
- Product details
- Shipping address
- Total amount
- Order date
- Status

---

## 6. User Instructions

### 6.1 For Customers

#### Creating an Account

1. Navigate to the **Sign Up** page
2. Enter your details:
   - **Full Name**: Your complete name
   - **Username**: A unique public display name
   - **Phone Number**: For order confirmation calls
   - **Email**: Must be from an approved domain (e.g., @college.edu)
   - **Password**: Minimum 6 characters
3. Accept the Terms and Conditions
4. Click **Sign Up**
5. Check your email for verification link
6. Click the verification link to activate your account

#### Browsing Products

1. Visit the **Products** page
2. Use filters:
   - **Category**: Filter by product category
   - **Price Range**: Set min/max price
   - **Availability**: Show only available items
3. Click on a product for details
4. View multiple images, description, seller info

#### Adding to Cart

1. From product detail page, click **Add to Cart**
2. Navigate to **Cart** to review items
3. Note: You cannot add your own products to cart

#### Placing an Order

1. Go to your **Cart**
2. Click **Proceed to Checkout**
3. Enter:
   - **Shipping Address**: Where to deliver
   - **Phone Number**: For confirmation call
4. Review order details
5. Click **Place Order**
6. Wait for executive confirmation call
7. Pay cash upon delivery

#### Selling a Product

1. Navigate to **Sell**
2. Fill in product details:
   - **Name**: Product title
   - **Description**: Detailed description
   - **Category**: Select from available categories
   - **Price**: Enter price or check "Free"
3. Upload images (up to 5)
4. Click **List Product**
5. Your product is now live!

#### Viewing Orders

1. Go to **My Orders** page
2. View order status:
   - 🟡 **Pending**: Awaiting confirmation call
   - 🟢 **Confirmed**: Order confirmed, preparing to ship
   - 🔵 **Shipped**: On the way
   - ✅ **Delivered**: Completed
   - 🔴 **Cancelled**: Order cancelled
3. Click on an order to view receipt

### 6.2 For Administrators

#### Accessing Admin Panel

1. Log in with admin account
2. Click **Admin Panel** in navigation
3. Navigate between tabs as needed

#### Confirming Orders

1. Go to **Orders** tab
2. Find orders with **Pending** status
3. Click **Confirm** button
4. Call the customer at the displayed phone number
5. Verify order details with customer
6. Add notes from the call (optional)
7. Click **Confirm Order** or **Cancel Order**

#### Managing Users

1. Go to **Users** tab
2. Search for user by name or email
3. To change role:
   - Click role dropdown
   - Select new role (User/Admin)
4. To ban/unban:
   - Click **Ban** or **Unban** button

#### Managing Products

1. Go to **Products** tab
2. To add product:
   - Click **Add Product**
   - Fill in details
   - Upload images
   - Save
3. To edit:
   - Click **Edit** on product row
   - Modify details
   - Save
4. To delete:
   - Click **Delete** on product row
   - Confirm deletion

#### Managing Allowed Domains

1. Go to **Settings** tab
2. View current allowed domains
3. To add domain:
   - Enter new domain (e.g., "newcollege.edu")
   - Click **Add**
4. To remove domain:
   - Click **Remove** next to domain
   - Note: Cannot remove if only one domain remains

### 6.3 For Super Administrators

Super admins have all admin capabilities plus:

#### Viewing Activity Logs

1. Go to **Activity Logs** tab
2. Toggle between **Simple** and **Detailed** view
3. Use search to find specific users/activities
4. Filter by activity type:
   - signup
   - login
   - logout
5. In detailed view, expand rows to see:
   - IP Address
   - User Agent
   - Full Metadata

---

## 7. Security

### 7.1 Authentication Security

| Feature | Implementation |
|---------|---------------|
| Password Hashing | Handled by Supabase Auth (bcrypt) |
| Session Management | JWT tokens with refresh |
| Email Verification | Required before login |
| Domain Restriction | Server-side email domain validation |

### 7.2 Database Security

#### Row-Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data (cart, wishlist, orders)
- Admins have elevated access for management
- Super admins can view activity logs
- Public data (products, categories) is readable by all

#### Role Storage

```
⚠️ IMPORTANT: Roles are stored in a SEPARATE user_roles table

This prevents privilege escalation attacks where users could
modify their own profile to gain admin access.
```

### 7.3 Order Validation

Server-side validation via Edge Function prevents:
- Purchasing own products
- Invalid quantities (enforces qty = 1)
- Purchasing unavailable products
- Multiple active orders for same product
- Price manipulation

### 7.4 Activity Logging

All authentication events are logged with:
- User ID
- Timestamp
- IP Address (best effort)
- User Agent
- Activity Type
- Additional Metadata

---

## 8. API Reference

### 8.1 Edge Function: validate-order

**Endpoint:** `POST /functions/v1/validate-order`

**Purpose:** Server-side order validation and creation

**Authentication:** Required (JWT in Authorization header)

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 1,
  "shipping_address": "123 College St, City",
  "buyer_phone": "+1234567890",
  "payment_method": "cod"
}
```

**Success Response (200):**
```json
{
  "order": {
    "id": "uuid",
    "buyer_id": "uuid",
    "product_id": "uuid",
    "status": "pending",
    "total_amount": 100,
    "receipt_number": "RCP-20251221-a1b2c3d4",
    "created_at": "2025-12-21T12:00:00Z"
  },
  "product_name": "Sample Product",
  "validated_price": 100,
  "validated_total": 100,
  "receipt_number": "RCP-20251221-a1b2c3d4"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Quantity must be exactly 1 | Invalid quantity |
| 400 | Payment method required | Missing payment method |
| 400 | Shipping address required | Missing address |
| 400 | Buyer phone required | Missing phone |
| 404 | Product not found | Invalid product_id |
| 400 | Product is not available | Product already sold |
| 400 | Cannot purchase your own product | Buyer is seller |
| 400 | Product already has an active order | Duplicate order |
| 500 | Failed to create order | Database error |

### 8.2 Database Functions

#### has_role(_user_id uuid, _role app_role)

Checks if a user has a specific role.

```sql
SELECT has_role('user-uuid-here', 'admin');
-- Returns: true or false
```

#### handle_new_user()

Trigger function that creates profile and assigns default role on user signup.

#### generate_receipt_number()

Trigger function that generates receipt numbers for new orders.

#### update_updated_at_column()

Trigger function that updates `updated_at` timestamp on row updates.

---

## 9. Project Structure

```
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── assets/                    # Static assets
│   │
│   ├── components/
│   │   ├── admin/                 # Admin panel components
│   │   │   ├── AdminActivityLogs.tsx
│   │   │   ├── AdminCategories.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminOrders.tsx
│   │   │   ├── AdminProducts.tsx
│   │   │   ├── AdminSettings.tsx
│   │   │   └── AdminUsers.tsx
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (40+ components)
│   │   │
│   │   ├── ImageUpload.tsx        # Single image upload
│   │   ├── MultiImageUpload.tsx   # Multi-image upload
│   │   ├── NavLink.tsx            # Navigation link
│   │   └── TermsDialog.tsx        # Terms modal
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication context
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Mobile detection
│   │   ├── use-toast.ts           # Toast notifications
│   │   ├── useActivityLog.ts      # Activity logging
│   │   └── useAllowedDomain.ts    # Domain validation
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client (auto-generated)
│   │       └── types.ts           # Database types (auto-generated)
│   │
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   │
│   ├── pages/
│   │   ├── Admin.tsx              # Admin panel
│   │   ├── AdminLogin.tsx         # Admin login
│   │   ├── Auth.tsx               # User auth (login/signup)
│   │   ├── Cart.tsx               # Shopping cart
│   │   ├── Index.tsx              # Home page
│   │   ├── NotFound.tsx           # 404 page
│   │   ├── Orders.tsx             # User orders
│   │   ├── ProductDetail.tsx      # Product details
│   │   ├── Products.tsx           # Product listing
│   │   ├── Profile.tsx            # User profile
│   │   ├── Sell.tsx               # Sell product
│   │   └── Wishlist.tsx           # User wishlist
│   │
│   ├── App.css                    # App styles
│   ├── App.tsx                    # Main app component
│   ├── index.css                  # Global styles
│   ├── main.tsx                   # Entry point
│   └── vite-env.d.ts              # Vite types
│
├── supabase/
│   ├── config.toml                # Supabase config (auto-generated)
│   ├── functions/
│   │   └── validate-order/
│   │       └── index.ts           # Order validation edge function
│   └── migrations/                # Database migrations
│
├── .env                           # Environment variables (auto-generated)
├── components.json                # shadcn/ui config
├── DOCS.md                        # This documentation
├── eslint.config.js               # ESLint config
├── index.html                     # HTML entry
├── package.json                   # Dependencies
├── postcss.config.js              # PostCSS config
├── README.md                      # Project readme
├── tailwind.config.ts             # Tailwind config
├── tsconfig.json                  # TypeScript config
└── vite.config.ts                 # Vite config
```

---

## 10. Configuration

### 10.1 Environment Variables

These are auto-generated and should NOT be modified manually:

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Backend API URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | Public API key |
| VITE_SUPABASE_PROJECT_ID | Project identifier |

### 10.2 Tailwind Configuration

Custom design tokens are defined in:
- `src/index.css` - CSS variables
- `tailwind.config.ts` - Tailwind extensions

### 10.3 Supabase Configuration

Located in `supabase/config.toml` (auto-generated):
- Auth settings
- Database settings
- Edge function settings

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **RLS** | Row-Level Security - database access control |
| **Edge Function** | Serverless function running on the edge |
| **COD** | Cash on Delivery |
| **JWT** | JSON Web Token for authentication |
| **Lovable Cloud** | Backend infrastructure powering the app |

---

## Appendix B: Troubleshooting

### Common Issues

**1. "Cannot purchase your own product"**
- You're trying to buy something you listed
- Solution: Use a different account or remove from cart

**2. "Email domain not allowed"**
- Your email domain isn't approved for registration
- Solution: Contact admin to add your domain

**3. "Product not available"**
- Product has already been ordered by someone else
- Solution: Check other listings or wait for cancellation

**4. Order stuck in "Pending"**
- Awaiting executive confirmation call
- Solution: Ensure your phone number is correct and available

---

## Appendix C: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-21 | Initial release |
| 1.1.0 | 2025-12-21 | Added super_admin role and activity logging |

---

*Documentation last updated: January 2026*
