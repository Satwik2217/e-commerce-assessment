# ShopMyUniform | Premium Fashion E-Commerce Storefront

A production-ready fashion e-commerce storefront and admin dashboard application built using **Next.js 16** (App Router & Turbopack), **React 19**, **Prisma ORM**, **NextAuth.js v5**, and **PostgreSQL**.

---

## 🎯 Internship Assessment Deliverables

This repository implements the core security, authentication, and state persistence requirements for the internship assessment:

1. **Auth-Gated Shopping Cart**: Unauthenticated guest users are prevented from adding items to the cart. Both the database state and client-side context block modifications until logged in.
2. **Protected Client Routes**: Enforced route protection on key customer paths:
   - `/cart` (Shopping Cart)
   - `/checkout` (Checkout Invoice & Address form)
   - `/orders` (Order History)
   - If an unauthenticated user attempts to visit these paths, they are redirected to `/login`.
3. **Smooth Session Redirection**:
   - When a guest clicks "Add to Cart", they receive an info toast notification asking them to sign in, and they are redirected to `/login`.
   - After a successful login, they are **automatically redirected back** to the same product details page (or original destination) they came from so they can proceed with their purchase.
4. **Server-Side Verification**: Gated the `/api/cart` endpoint. Unauthorized API requests receive a secure **HTTP 401 Unauthorized** response, protecting against client-side bypasses.
5. **No Browser Alerts**: Replaced all native browser alerts with a custom, glassmorphic toast notification system with entrance and exit micro-animations built using `framer-motion`.
6. **Cart State Persistence**: Carts are fully persisted in the PostgreSQL database per user. Cart items survive browser refreshes, logouts, and logging back in.

---

## ⚙️ Step-by-Step Setup Guide

Follow these steps to clone, configure, and run this project from scratch on your local system:

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.x or later recommended)
- **Git**
- **Docker Desktop** (optional, recommended for database setup) OR a local **PostgreSQL** server.

---

### 2. Clone the Repository
Clone the project to your local machine and navigate into the root directory:
```bash
git clone https://github.com/Satwik2217/e-commerce-assessment.git
cd e-commerce-assessment
```

---

### 3. Configure Environment Variables
Create a `.env` file in the root folder by copying the provided template:
```bash
# On Linux/macOS
cp .env.example .env

# On Windows (PowerShell)
copy .env.example .env
```

Open the newly created `.env` file and review the variables:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fashion_ecommerce"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"
```
*Note: If you run a local PostgreSQL server manually, update the `DATABASE_URL` string with your username, password, host, port, and database name.*

---

### 4. Start the PostgreSQL Database

#### Option A: Using Docker (Recommended)
If you have Docker installed, you can spin up the PostgreSQL database container with one command:
```bash
docker compose up -d postgres
```

#### Option B: Using a Local PostgreSQL Installation
If you prefer running PostgreSQL natively on your machine:
1. Start your local PostgreSQL service.
2. Create an empty database named `fashion_ecommerce`.
3. Verify your `.env` file's `DATABASE_URL` matches your local credentials.

---

### 5. Install Dependencies & Seed Database
With your database running, install Node modules, sync the Prisma schemas, and run the database seeder to populate products, categories, coupons, and test user accounts:

```bash
# Install node modules
npm install

# Push the schema and apply indexes
npm run db:push

# Seed categories, products, coupons, and users
npm run db:seed
```

---

### 6. Start the Development Server
Launch the development server using Next.js Turbopack:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application!

---

## 🔑 Demo Credentials

The seeder populates default user accounts to test the application flows:

*   **Shopper Customer Account:**
    *   **Email:** `user@shop.com`
    *   **Password:** `user123`
    *   *Permissions: Use this account to test cart persistence, protected routes, checkout, review submissions, and order history.*

*   **Administrator Account:**
    *   **Email:** `admin@shop.com`
    *   **Password:** `admin123`
    *   *Permissions: Access the `/admin` dashboard KPIs, Category CRUD, Product CRUD, and Order Shipment status controls.*

---

## 🧪 Running Automated Tests
A comprehensive test suite validates the registration schema constraints, checkout forms, and stock boundary controls. To execute the tests, run:

```bash
npm run test
```

---

## 🏗️ Folder Structure

```text
fashion-ecommerce/
├── prisma/                 # Database Schema, Migrations, and Seed script
├── public/                 # Static images, assets, and SVG icons
├── src/
│   ├── app/                # App Router Page tree & API endpoints
│   │   ├── admin/          # Admin Dashboard (Category & Product CRUD)
│   │   ├── api/            # API Routes (Cart, Wishlist, Checkout, Validation)
│   │   ├── products/       # Store Catalog, Search, Filters, Details Page
│   │   ├── wishlist/       # User Wishlist page
│   │   ├── cart/           # Shopping Cart page
│   │   ├── checkout/       # Address validation & checkout invoice page
│   │   └── orders/         # Order History & status tracking timelines
│   ├── components/         # Reusable UI component libraries
│   │   ├── ui/             # Dialog, Select, Sheet, Button primitives
│   │   ├── layout/         # Header Navigation & Footer menus
│   │   ├── products/       # Review forms, filters, catalogs, product actions
│   │   └── admin/          # KPI dashboards and order status controllers
│   ├── context/            # Context providers (CartProvider, ToastProvider)
│   ├── lib/                # Database clients, utilities, and validations
│   ├── types/              # TS definitions
│   └── proxy.ts            # Next.js 16 route proxy (gating, rate-limiting)
├── package.json            # Scripts & project dependencies
└── tsconfig.json           # TS configurations
```
