# Caryo — Frontend

> React-based frontend for **Karyo**, a full-featured e-commerce platform for bags and accessories.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Pages & Routing](#-pages--routing)
- [State Management](#-state-management)
- [Deployment](#-deployment)

---

## 🌐 Overview

Caryo's frontend is a single-page application (SPA) built with **React 18**, **Vite**, and **TypeScript**. It provides a seamless shopping experience for customers and a powerful management suite for admins — all in one codebase with role-based routing.

The backend API repository (Node.js + Express) can be found separately.

---

## ✨ Features

### Customer-Facing

- **Landing Page** with featured products and category highlights
- **Product Listing** with pagination, search, price/category/rating filters and sorting
- **Product Detail Page** with multi-variant selection (size, color), image gallery, and stock status
- **Cart** with real-time stock validation, quantity updates, and coupon application
- **Wishlist** — save items for later
- **Multi-step Checkout** with saved addresses, payment method selection, and order summary
- **Razorpay Payment** gateway integration with order verification
- **Order Confirmation** with downloadable PDF invoice
- **User Profile** — edit info, change password, manage multiple shipping addresses
- **Wallet** — view balance, transaction history; usable at checkout
- **Referral Program** — generate & share unique referral codes; earn credits
- **Offers Page** — view active offers and deals
- **Contact Page**
- **Google OAuth** login with seamless redirect flow

### Admin Panel

- **Dashboard** with Recharts-powered analytics (revenue, orders, user growth, top products)
- **Product Management** — add/edit products with multi-image upload and crop (react-easy-crop)
- **Category Management** — add/edit/list/unlist categories
- **User Management** — view all users, block/unblock
- **Order Management** — update order status, approve/reject return requests
- **Order Details** — full order view with status timeline
- **Coupon Management** — create/edit/deactivate coupons
- **Discount Management** — create category and product-level discount offers
- **Offer Management** — manage promotional offers
- **Sales Report** — filter by date range, download as PDF
- **Referral Overview** — view referral activity and usage
- **Discount Usage** — audit who used which discounts

### UX & DX

- **Dark / Light mode** via `next-themes`
- Fully responsive design (mobile-first)
- Toast notifications via `react-toastify` and `sonner`
- Alert dialogs via **SweetAlert2**
- Form validation with **React Hook Form + Zod**
- Lazy loading & debounced search for performance

---

## 🛠 Tech Stack

| Category         | Technology                             |
| ---------------- | -------------------------------------- |
| Framework        | React 18, Vite 5                       |
| Language         | TypeScript 5                           |
| Styling          | Tailwind CSS 3, shadcn/ui, Radix UI    |
| State Management | Redux Toolkit, Redux Persist           |
| Data Fetching    | TanStack Query (React Query) v5, Axios |
| Routing          | React Router DOM v6                    |
| Forms            | React Hook Form, Zod                   |
| Charts           | Recharts                               |
| Payment          | Razorpay Checkout.js                   |
| Image Handling   | react-easy-crop                        |
| PDF Export       | jsPDF, jsPDF-autotable                 |
| UI Primitives    | Shadcn/ui (Radix UI based)             |
| Notifications    | react-toastify, sonner, SweetAlert2    |
| Auth             | Google OAuth (via backend redirect)    |

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── logo.png
├── src/
│   ├── App.jsx                 # Route definitions & role guards
│   ├── main.jsx                # App entry point
│   ├── components/             # Reusable UI components
│   ├── constants/              # API base URLs, route paths, etc.
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.jsx           # Home / Landing page
│   │   ├── About.jsx
│   │   ├── NotFound.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminOrders.jsx
│   │   │   ├── AdminOrderDetails.jsx
│   │   │   ├── AdminCoupons.jsx
│   │   │   ├── AdminDiscounts.jsx
│   │   │   ├── AdminDiscountUsage.jsx
│   │   │   ├── AdminOffers.jsx
│   │   │   ├── AdminReferrals.jsx
│   │   │   ├── AdminSalesReport.jsx
│   │   │   ├── AdminUserForm.jsx
│   │   │   ├── CategoryManagement.jsx
│   │   │   ├── ProductManagement.jsx
│   │   │   └── UserManagement.jsx
│   │   └── user/
│   │       ├── UserLogin.jsx
│   │       ├── UserSignup.jsx
│   │       ├── ForgotPassword.jsx
│   │       ├── GoogleAuthSuccess.jsx
│   │       ├── ProductListing.jsx
│   │       ├── ProductDetails.jsx
│   │       ├── Cart.jsx
│   │       ├── Wishlist.jsx
│   │       ├── Checkout.jsx
│   │       ├── OrderConfirmation.jsx
│   │       ├── OrderSuccess.jsx
│   │       ├── OrderFailure.jsx
│   │       ├── UserProfile.jsx
│   │       ├── Wallet.jsx
│   │       ├── ReferralProgram.jsx
│   │       ├── Offers.jsx
│   │       └── Contact.jsx
│   ├── redux/                  # Redux store, slices, reducers
│   ├── services/               # Axios API service functions
│   └── utils/                  # Frontend utilities
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ and npm
- The [Karyo backend](https://github.com/your-username/karyo-backend) running locally or deployed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ashok4822/karyoFrontend.git
cd karyo-frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000

# Razorpay (public key only — safe to expose on frontend)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> ⚠️ Only `VITE_` prefixed variables are exposed to the browser by Vite. Never put secret keys here.

---

## 🗺 Pages & Routing

### Public Routes

| Path                   | Page                          |
| ---------------------- | ----------------------------- |
| `/`                    | Home / Landing                |
| `/products`            | Product Listing               |
| `/products/:id`        | Product Details               |
| `/login`               | User Login                    |
| `/signup`              | User Signup                   |
| `/forgot-password`     | Forgot Password               |
| `/google-auth-success` | Google OAuth Callback Handler |
| `/offers`              | Offers                        |
| `/contact`             | Contact                       |
| `/about`               | About                         |

### Protected User Routes

| Path                  | Page               |
| --------------------- | ------------------ |
| `/cart`               | Cart               |
| `/wishlist`           | Wishlist           |
| `/checkout`           | Checkout           |
| `/order-confirmation` | Order Confirmation |
| `/profile`            | User Profile       |
| `/wallet`             | Wallet             |
| `/referral`           | Referral Program   |

### Admin Routes (Protected)

| Path                  | Page                |
| --------------------- | ------------------- |
| `/admin/login`        | Admin Login         |
| `/admin/dashboard`    | Analytics Dashboard |
| `/admin/products`     | Product Management  |
| `/admin/categories`   | Category Management |
| `/admin/users`        | User Management     |
| `/admin/orders`       | Order Management    |
| `/admin/coupons`      | Coupon Management   |
| `/admin/discounts`    | Discount Management |
| `/admin/offers`       | Offer Management    |
| `/admin/sales-report` | Sales Report        |
| `/admin/referrals`    | Referral Overview   |

---

## 🗂 State Management

Global state is managed with **Redux Toolkit** and persisted across sessions using **Redux Persist**.

| Slice           | Manages                    |
| --------------- | -------------------------- |
| `authSlice`     | User session, tokens, role |
| `cartSlice`     | Cart items, count          |
| `wishlistSlice` | Wishlist items             |

Server state (API data) is managed by **TanStack Query** for caching, refetching, and loading states.

---

## ☁️ Deployment

The frontend is built for deployment on **[Vercel](https://vercel.com)**.

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Vercel Deployment Steps

1. Push the repository to GitHub.
2. Import the project on [Vercel Dashboard](https://vercel.com/dashboard).
3. Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Add environment variables (`VITE_API_BASE_URL`, `VITE_RAZORPAY_KEY_ID`) in **Project Settings → Environment Variables**.
5. Deploy.

> 💡 Make sure to add your Vercel deployment URL to the backend's `ALLOWED_ORIGINS` environment variable for CORS.

---

## 📄 License

ISC © 2025 Karyo
