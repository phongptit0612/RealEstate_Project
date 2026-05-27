# 🏡 LuxEstates — Premium Real Estate Marketplace

A full-stack, luxury real estate platform for buying, selling, and renting properties, built with a professional developer experience and a premium, multilingual user interface.

---

## 📌 About The Project

LuxEstates is a full-featured real estate web application that allows users to browse, list, and manage properties. It features a professional Admin panel for content moderation, a real-time Inbox for buyer-seller communication, a VIP boost system powered by Stripe, and multilingual/multi-currency support.

---

## ✨ Full Feature List

### 🔐 Authentication & Security
- **User Registration** with mandatory **Email OTP Verification** before account activation
- **JWT-based Authentication** stored in secure HTTP-only cookies
- **Login / Logout** with rate limiting (8 attempts per 15 min)
- **Forgot Password** flow with email-based token + **Reset Password**
- **Change Password** from user profile
- **Avatar Upload** with Cloudinary hosting
- **Role-based Access Control**: `user` and `admin` roles with route guards

### 🏠 Property Listings
- **Multi-step Listing Creation** (4 steps: Basics → Metrics → Location → Media)
  - Step 1: Title, Description, Property Type, Listing Type (Sale/Rent)
  - Step 2: Price (native currency input with auto USD conversion), Area, Bedrooms, Bathrooms, Facing Direction
  - Step 3: City, District (cascading dropdowns), Street Address, Video Tour URL, Interactive Map Pin
  - Step 4: Multi-file Photo Upload via Cloudinary
- **Listing Confirmation Modal** with links to platform Guidelines before submission
- **Edit Listing** — full form pre-filled from existing data; triggers admin re-review
- **Delete Listing** — with confirmation guard
- **Listing Status Management** — Mark listings as Active / Sold / Rented
- **Listing Renewal** — extend listing expiry
- **Admin Approval Gate** — all listings are "Pending" until reviewed by admin
- **Property Detail Page** — full details, image gallery, map, agent contact, mortgage calculator, similar listings, feature tags, report button

### 🔍 Search & Discovery
- **Advanced Search Page** with filters: keyword, city, property type, listing type, price range, bedrooms, bathrooms, area, VIP status
- **Sorting** by: Newest, Price (High/Low), Most Viewed, Area
- **URL-based Filter Persistence** — shareable search links
- **Clickable Feature Tags** on the detail page — click a tag to search by it
- **Weighted Similarity Engine** — similar properties scored by City + Type match, with fallback logic ensuring results always appear

### 💳 VIP Boost & Subscriptions
- **Two VIP Tiers:**
  - 🥈 **Silver**: Priority placement, highlighted card border, Silver badge
  - 🥇 **Gold**: Pinned to TOP of results, Home page feature, animated glow, Gold badge
- **Stripe Checkout** integration for real payment processing
- **Stripe Webhook** listener for payment confirmation
- **Dev Simulation Mode** (`/simulate` endpoint) for testing without Stripe
- **VIP Boost Guard**: Cannot boost unapproved listings — shows notification
- **My Subscriptions Page** — view all active and past subscriptions

### 💬 Real-time Inbox (Messaging)
- **Buyer-Seller Conversations** linked to specific property listings
- **Paginated Message History** (load older messages on scroll)
- **Unread Message Badge** in dashboard sidebar
- **Real-time Delivery** via Socket.io
- **"Contact Agent" button** on property detail page to start a conversation

### 🗺️ Maps & Location
- **Interactive LocationPicker** — user pins exact property location on a Leaflet map
- **Auto-fill Address** from map pin using Reverse Geocoding
- **MapView Component** — embedded read-only map on property detail page
- **OpenStreetMap** tiles (no API key required)

### 📸 Media & Gallery
- **Multi-file Image Upload** (up to 10 photos) via Multer + Cloudinary
- **Interactive Tech Bar Lightbox** — click any image to enlarge with:
  - 🔍 Zoom In / Out controls (25% steps, up to 400%)
  - Live zoom percentage display
  - Click-to-toggle zoom (1x ↔ 2x)
  - Pan/scroll support when zoomed in
  - Frosted-glass UI with Lucide icons
- **Thumbnail Strip** — click active thumbnail to also open lightbox
- **Prev/Next Arrows** for browsing gallery slides

### 📐 Mortgage Calculator
- Embedded on every property detail page
- Adjustable **Down Payment %**, **Annual Interest Rate**, **Loan Term** (years) via sliders
- Live calculation of **Monthly Payment** and **Principal Loan Amount**
- All values displayed in user's **preferred currency** (real-time converted)
- Fully translated (EN / VI)

### 🌍 Localization & Currency
- **Languages Supported:** English 🇺🇸, Vietnamese 🇻🇳
- **Auto Language Switch**: Selecting VND currency automatically switches to Vietnamese; all others switch to English
- **Currencies Supported:** USD, VND, EUR, GBP, JPY, KRW, CNY, SGD, THB, AUD, CAD
- **Live Exchange Rates** fetched from Frankfurter API on load
- **Fallback Rates** for currencies not supported by Frankfurter (VND, KRW, THB)
- **Native Currency Input** in Create Listing: type in VND, auto-converts to USD for storage; shows "Saved as $X USD" hint
- **Smart Price Formatting**: Live dot separators for VND (e.g., `2.500.000.000`), commas for USD
- **Persistent Preferences**: Language + currency saved to `localStorage` via Zustand persist

### ❤️ Favorites
- Save/unsave properties with a heart icon (requires login)
- **Favorites Dashboard** — view all saved properties
- Favorites persist in database, not just local state

### 📋 Activity History
- Log of user actions: property views, saves, messages sent

### 👤 User Profile
- Edit Name, Phone, Bio
- Upload/change Avatar
- Change Password

### 📢 Notifications
- In-app notification system for listing approvals, messages, etc.
- REST endpoint for fetching unread notifications

### 🏢 Agencies / Agents Directory
- Public directory of all registered agents/sellers
- Search agents by name or area
- "View Listings" link per agent

### 📜 Platform Guidelines Page
- Professional, structured guidelines page for listing standards
- Linked from the listing creation confirmation modal

---

## 🛡️ Admin Panel (`/admin`)

Full role-protected admin dashboard with:

| Feature | Description |
|---|---|
| **Dashboard Stats** | Total users, listings, revenue, pending items |
| **Audit Log** | Admin action history |
| **Listings Moderation** | View all listings, Approve / Reject / Edit / Delete |
| **User Management** | View all users, Enable / Disable accounts, Delete users |
| **Reports Management** | View user-submitted reports, update status (open/resolved) |
| **Category Management** | CRUD for Cities, Districts, Property Types, Features/Amenities |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** (Vite) | UI Framework |
| **React Router DOM v7** | Client-side routing & route guards |
| **Tailwind CSS v4** | Utility-first styling |
| **Zustand v5** | Global state management (with `persist` middleware) |
| **Axios** | HTTP client for API calls |
| **Leaflet + React-Leaflet** | Interactive maps |
| **Lucide React** | Icon library |
| **Socket.io-client** | Real-time messaging |
| **Decimal.js** | Precision arithmetic for currency conversion |
| **tailwindcss-animate** | Smooth entry animations |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express v5** | REST API Server |
| **MySQL2** | Relational database driver |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **Bcrypt** | Password hashing |
| **Joi** | Request validation |
| **Multer** | Multipart form / file upload handling |
| **Multer-Storage-Cloudinary** | Direct stream upload to Cloudinary |
| **Nodemailer** | Transactional email (OTP, password reset) |
| **Stripe SDK** | Payment processing + webhooks |
| **Socket.io** | Real-time bidirectional messaging |
| **node-cron** | Scheduled jobs (e.g., expiring VIP listings) |
| **express-rate-limit** | Brute-force protection on auth routes |
| **compression** | Gzip response compression |
| **cookie-parser** | HTTP-only cookie handling |
| **dotenv** | Environment variable management |

### Database
- **MySQL** — fully relational schema
- Key tables: `users`, `properties`, `property_images`, `property_features`, `cities`, `districts`, `property_types`, `features`, `favorites`, `conversations`, `messages`, `subscriptions`, `reports`, `notifications`, `exchange_rates`

---

## 🔌 External APIs & Services

| API / Service | Used For |
|---|---|
| **Frankfurter API** (`api.frankfurter.app`) | Live currency exchange rates |
| **Cloudinary** | Image & avatar storage, CDN delivery |
| **Stripe** | Payment checkout sessions + webhook verification |
| **Nodemailer + SMTP** | OTP verification emails, password reset emails |
| **OpenStreetMap / Leaflet** | Map tiles & geocoding |

---

## 📁 Project Structure

```
Real_Estate_Project/
├── backend/
│   └── src/
│       ├── controllers/       # Business logic (auth, property, admin, etc.)
│       ├── routes/            # Express route definitions
│       ├── middlewares/       # JWT protect, adminOnly guards
│       ├── config/            # DB pool, Cloudinary config
│       ├── services/          # Email, scheduled tasks
│       ├── sockets/           # Socket.io event handlers
│       └── utils/             # Helper functions
├── frontend/
│   └── src/
│       ├── components/        # Reusable UI (Navbar, Footer, MapView, MortgageCalculator, PropertyCard...)
│       ├── pages/
│       │   ├── Admin/         # Admin dashboard pages
│       │   ├── Auth/          # Login, Register, OTP, ForgotPassword, ResetPassword
│       │   ├── Dashboard/     # User dashboard (Listings, Create, Edit, Inbox, Profile...)
│       │   └── Subscription/  # Pricing, Success, Cancel pages
│       ├── store/             # Zustand stores (userStore, currencyStore, languageStore, favoriteStore)
│       └── i18n/              # Translation files (English + Vietnamese)
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+
- MySQL v8+
- A Cloudinary account (free tier works)
- A Stripe account (test mode keys)

### 1. Database Setup
```sql
-- Create the database and import the schema
mysql -u root -p < backend/database.sql
```

### 2. Backend
```bash
cd backend
npm install
```
Create a `.env` file in `/backend`:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=real_estate_db

# JWT
JWT_SECRET=your_super_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer (Gmail example)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
```bash
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
The app will be available at **http://localhost:5173**

---

## 🗺️ Application Routes

### Public Pages
| Route | Page |
|---|---|
| `/` | Homepage — featured listings, VIP properties |
| `/properties` | Search & browse all listings |
| `/properties/:id` | Property detail page |
| `/agencies` | Agent directory |
| `/pricing` | VIP boost pricing page |
| `/guidelines` | Platform listing guidelines |
| `/login` | Login |
| `/register` | Register + OTP verification |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password |

### User Dashboard (Login Required)
| Route | Page |
|---|---|
| `/dashboard/properties` | Manage my listings |
| `/dashboard/create` | Create new listing |
| `/dashboard/edit/:id` | Edit a listing |
| `/dashboard/favorites` | Saved properties |
| `/dashboard/inbox` | Real-time messages |
| `/dashboard/subscriptions` | My VIP subscriptions |
| `/dashboard/activity` | Activity history |
| `/dashboard/profile` | Profile & settings |

### Admin Panel (Admin Role Required)
| Route | Page |
|---|---|
| `/admin` | Dashboard & stats |
| `/admin/listings` | Moderate all listings |
| `/admin/users` | Manage users |
| `/admin/reports` | Handle user reports |
| `/admin/categories` | Manage cities, types, features |
