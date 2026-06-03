# LuxEstates — Premium Real Estate Marketplace

A full-stack, luxury real estate platform for buying, selling, and renting properties, built with a professional developer experience and a premium, multilingual user interface.

---

## About The Project

LuxEstates is a full-featured real estate web application that allows users to browse, list, and manage properties. It features a professional Admin panel for content moderation, a real-time Inbox for buyer-seller communication, a VIP boost system powered by Stripe, and multilingual/multi-currency support.

---

## Full Feature List

### Authentication & Security
- **User Registration** with mandatory **Email OTP Verification** (sent via Brevo API) before account activation.
- **JWT-based Authentication** stored in secure, HTTP-only cookies.
- **Fail-Safe JWT Verification**: The API fails fast if critical environment keys (`JWT_SECRET`) are missing.
- **Tightened Rate Limiting**:
  - Global authentication API route rate limiting (max 30 requests per 15 minutes).
  - Strict login rate limiting (max 8 attempts per 15 minutes) applied directly to the login handler.
- **Forgot Password** flow with email-based token + **Reset Password**.
- **Change Password** directly from the user profile dashboard.
- **Secure Image Uploads**: Upload validation via Multer, strictly enforcing a **10MB maximum file size** and MIME-type verification (only JPEG, PNG, WebP, and GIF are allowed).
- **Role-based Access Control (RBAC)**: `user` and `admin` roles with robust router & server-side middleware guards.

### Property Listings
- **Multi-step Listing Creation** (4 steps: Basics → Metrics → Location → Media):
  - Step 1: Title, Description, Property Type, Listing Type (Sale/Rent).
  - Step 2: Price (native currency input with auto USD conversion), Area, Bedrooms, Bathrooms, Facing Direction.
  - Step 3: City, District (cascading dropdowns), Street Address, Video Tour URL, Interactive Map Pin.
  - Step 4: Multi-file Photo Upload via Cloudinary.
- **Listing Confirmation Modal** with links to platform Guidelines before submission.
- **Edit Listing** — full form pre-filled from existing data; updates trigger admin re-review.
- **Delete Listing** — protected by a confirmation guard.
- **Listing Status Management** — Mark listings as Active / Sold / Rented.
- **Listing Renewal** — extend listing expiry time.
- **Admin Approval Gate** — all listings remain "Pending" and hidden from search until approved by an admin.
- **Property Detail Page** — full details, image gallery, map, agent contact, mortgage calculator, similar listings, feature tags, report button.

### Search & Discovery
- **Advanced Search Page** with filters: keyword, city, property type, listing type, price range, bedrooms, bathrooms, area, VIP status.
- **Sorting** by: Newest, Price (High/Low), Most Viewed, Area.
- **URL-based Filter Persistence** — shareable search links that restore search state.
- **Clickable Feature Tags** on the detail page — click a tag to search by it.
- **Weighted Similarity Engine** — similar properties scored by City + Type match, with fallback logic ensuring results always appear.

### VIP Boost & Subscriptions
- **Two VIP Tiers:**
  - **Silver**: Priority placement, highlighted card border, Silver badge.
  - **Gold**: Pinned to TOP of results, Home page feature, animated glow, Gold badge.
- **Stripe Checkout** integration for real payment processing.
- **Stripe Webhook** listener for secure payment confirmation.
- **Dev Simulation Mode** (`/simulate` endpoint) for testing subscription payments without Stripe.
- **VIP Boost Guard**: Cannot boost unapproved/pending listings — triggers user notifications.
- **My Subscriptions Page** — view all active and past subscriptions.
- **Automated VIP Expiration Cron**: Hourly scheduled background worker that resets expired VIP listings (`vip_tier = 'none'`) and marks outdated subscriptions as inactive.

### Real-time Inbox (Messaging)
- **Buyer-Seller Conversations** linked to specific property listings.
- **Secure Socket.io Authentication**: Socket connections are validated directly against secure HTTP-only JWT cookies (does not trust client-sent `userId`).
- **Paginated Message History** (loads older messages dynamically on scroll).
- **Unread Message Badge** in dashboard sidebar and navbar.
- **"Contact Agent" button** on property detail page to start a conversation instantly.

### Maps & Location
- **Interactive LocationPicker** — user pins exact property location on a Leaflet map.
- **Auto-fill Address** from map pin using Reverse Geocoding.
- **MapView Component** — embedded read-only map on property detail page.
- **OpenStreetMap** tiles (no API key required).

### Media & Gallery
- **Multi-file Image Upload** (up to 10 photos) via Multer + Cloudinary.
- **Interactive Lightbox** — click any image to enlarge with:
  - Zoom In / Out controls (25% steps, up to 400%).
  - Live zoom percentage display.
  - Click-to-toggle zoom (1x ↔ 2x).
  - Pan/scroll support when zoomed in.
  - Frosted-glass UI with Lucide icons.
- **Thumbnail Strip** — click active thumbnail to view, syncs with lightbox.
- **Prev/Next Arrows** for browsing gallery slides.

### Mortgage Calculator
- Embedded on every property detail page.
- Adjustable **Down Payment %**, **Annual Interest Rate**, **Loan Term** (years) via sliders.
- Live calculation of **Monthly Payment** and **Principal Loan Amount**.
- All values displayed in user's **preferred currency** (real-time converted).
- Fully translated (EN / VI).

### Localization & Currency
- **Languages Supported:** English 🇺🇸, Vietnamese 🇻🇳.
- **Auto Language-Currency Sync**: Selecting VND currency automatically switches the interface to Vietnamese; all other currencies switch the interface to English.
- **Currencies Supported:** USD, VND, EUR, GBP, JPY, KRW, CNY, SGD, THB, AUD, CAD.
- **Live Exchange Rates** fetched from Frankfurter API on load.
- **Fallback Rates** for currencies not supported by Frankfurter (VND, KRW, THB).
- **Native Currency Input** in Create Listing: type in VND, auto-converts to USD for storage; shows "Saved as $X USD" hint.
- **Smart Price Formatting**: Live dot separators for VND (e.g., `2.500.000.000`), commas for USD.
- **Persistent Preferences**: Language + currency saved to `localStorage` via Zustand persist.

### Premium UX & Accessibility
- **Modern Responsive Design**: Clean layouts using Tailwind CSS v4.
- **Mobile Navigation Menu**: Full-featured hamburger menu in the navbar including nav links, language/currency selectors, and authorization status.
- **SEO Optimization**: Fully updated `index.html` with title, descriptions, open graph tags, and Google Fonts.
- **Accessibility (a11y)**: `aria-label` tags added on all icon-only interactive elements.

### Favorites & Activity
- Save/unsave properties with a heart icon (requires login).
- **Favorites Dashboard** — view all saved properties.
- **Activity History** — log of user actions (property views, saves, messages).

### Profile & Admin
- **User Profile**: Edit Name, Phone, Bio, and upload/change Avatar.
- **Notifications**: In-app notifications for listing approvals, messages, and subscriptions.
- **Agencies Directory**: Public directory of all registered agents/sellers.
- **Guidelines Page**: Rules and guidelines for submitting listings.

---

## Admin Panel (`/admin`)

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

## Tech Stack

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
| **Nodemailer** | SMTP transporter for transaction routing |
| **Stripe SDK** | Payment processing + webhooks |
| **Socket.io** | Real-time bidirectional messaging |
| **node-cron** | Scheduled jobs (expiring VIP listings hourly) |
| **express-rate-limit** | Brute-force protection on auth & login routes |
| **compression** | Gzip response compression |
| **cookie-parser** | HTTP-only cookie handling |
| **dotenv** | Environment variable management |

### Database
- **MySQL** — fully relational schema.
- Key tables: `users`, `properties`, `property_images`, `property_features`, `cities`, `districts`, `property_types`, `features`, `favorites`, `conversations`, `messages`, `subscriptions`, `reports`, `notifications`, `exchange_rates`.

---

## External APIs & Services

| API / Service | Used For |
|---|---|
| **Frankfurter API** (`api.frankfurter.app`) | Live currency exchange rates |
| **Cloudinary** | Image & avatar storage, CDN delivery |
| **Stripe** | Payment checkout sessions + webhook verification |
| **Brevo** | OTP verification emails, password reset emails (Transactional API) |
| **OpenStreetMap / Leaflet** | Map tiles & geocoding |

---

## Project Structure

```
Real_Estate_Project/
├── backend/
│   ├── check_db.js            # Column description validator
│   ├── upgrade.js             # User promotion helper script (Admin role)
│   └── src/
│       ├── controllers/       # Business logic (auth, property, admin, etc.)
│       ├── routes/            # Express route definitions
│       ├── middlewares/       # JWT protect, adminOnly guards
│       ├── config/            # DB pool, Cloudinary config
│       ├── services/          # Email, scheduled tasks
│       ├── sockets/           # Socket.io event handlers
│       └── utils/             # Helper functions (emailService, etc.)
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

## Local Development Setup

### Prerequisites
- Node.js v18+
- MySQL v8+
- A Cloudinary account (free tier works)
- A Stripe account (test mode keys)
- A Brevo account (free tier works for Transactional emails)

### 1. Database Setup
Create your local MySQL database, then run the SQL file to initialize tables and relationships:
```sql
-- Create the database and import the schema
mysql -u root -p < backend/database.sql
```

### 2. Backend Config
Create a `.env` file in the `/backend` folder:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# MySQL Connection Details
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=real_estate_db
DB_SSL=false # Set to true if using cloud hosting (e.g. Aiven)

# JWT Secret Keys
JWT_SECRET=your_super_secret_key

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Brevo Transactional Email API Setup
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=your_verified_sender_email
BREVO_SENDER_NAME=LuxEstates

# Stripe Payment Config
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Now launch the backend API:
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Config
Create a `.env` file in the `/frontend` folder:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Now launch the frontend client:
```bash
cd frontend
npm install
npm run dev
```
The application will be running at **http://localhost:5173**.

### Setting up an Admin User
To access the Admin dashboard (`/admin`), you can promote any registered user account:
1. Register a new account on the frontend.
2. In `backend/upgrade.js`, change the email address in `['ptran4109@gmail.com']` on line 13 to match your registered user email.
3. Run the helper script from the `backend` folder:
   ```bash
   node upgrade.js
   ```
4. Log out and log back in on the frontend to refresh your session cookie.

---

## Application Routes

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
