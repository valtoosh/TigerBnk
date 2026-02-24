# TigerBnk Web

## Overview
Premium fintech web application (Revolut-style) branded as TigerBnk, with JWT authentication, digital wallet, money transfers, and currency exchange. Dark theme (#0B0B0B bg, #FF4D00 orange accent) throughout. Two account types: Individual (full platform access) and Merchant (coming soon page). Integrated with real payment providers: BurjX (UAE/AED) and OnMeta (India/Philippines/Indonesia). Built with React + Vite + Express.js + PostgreSQL.

## Tech Stack
- Frontend: React 18, Vite, TailwindCSS, Framer Motion, TanStack React Query, Wouter
- Backend: Express.js with TypeScript, JWT auth with bcrypt
- Database: PostgreSQL with Drizzle ORM
- Payment Providers: BurjX (WebSocket APEX protocol), OnMeta (REST API)
- Proxy: QuotaGuard for IP-whitelisted API access
- UI: Shadcn components, Lucide icons

## Project Structure
- `client/src/pages/` - Landing, Auth, Dashboard, SendMoney, Activity, AddMoney, Cards, Profile, MerchantComingSoon
- `client/src/components/` - AppSidebar, MobileNav, ThemeProvider, UI components
- `client/src/lib/` - Auth context, query client utils
- `server/` - Express routes, DB storage, seed data
- `server/services/` - Payment provider integrations
  - `exchangeRateService.ts` - Live exchange rates from open.er-api.com with caching
  - `burjxApexClient.ts` - WebSocket APEX protocol client (JSON frame handling, auth, reconnection with backoff)
  - `burjxService.ts` - BurjX KYC and account management via kyc.burjx.com
  - `burjxOnrampService.ts` - AED deposits (CreateDepositTicket), withdrawals, status polling
  - `onmetaService.ts` - OnMeta customer login, KYC, deposit/withdrawal for INR/PHP/IDR
- `shared/schema.ts` - Drizzle schema, Zod validators, shared types

## Key Features
- JWT-based auth with httpOnly cookies
- Dashboard with balance display, quick actions, Roar Score
- Send money with live currency conversion (AED, INR, PHP, USD, GBP, IDR)
- Add money with auto-provider detection by country (BurjX for UAE, OnMeta for IN/PH/ID)
- Transaction history with filters
- Dark/light theme toggle
- Responsive sidebar (desktop) + bottom nav (mobile)
- No crypto terminology - all presented as traditional banking

## Payment Provider Routing
- AE (UAE) -> BurjX (WebSocket APEX) -> Bank Transfer (AED), Product ID 104
- IN (India) -> OnMeta -> UPI, Bank Transfer, IMPS, NEFT
- PH (Philippines) -> OnMeta -> GCash, PayMaya, GrabPay, Bank Transfer
- ID (Indonesia) -> OnMeta -> Bank Transfer
- Other -> Manual deposit flow

## API Endpoints

### Auth
- POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout

### User
- GET /api/user/profile, PUT /api/user/profile, POST /api/user/deposit

### Transactions
- GET /api/transactions, POST /api/transactions/send

### Exchange Rates
- GET /api/exchange-rate?from=X&to=Y&amount=Z
- GET /api/supported-currencies

### Payment Provider
- GET /api/payment-provider - Auto-detect provider based on user country

### BurjX (UAE/AED)
- GET /api/burjx/status - Connection status
- POST /api/burjx/connect - Initiate WebSocket connection
- GET /api/burjx/account - Account balance
- POST /api/burjx/deposit - Create deposit ticket (bank transfer details)
- GET /api/burjx/deposits - List deposit tickets
- GET /api/burjx/deposit/:ticketId/status - Check deposit status
- POST /api/burjx/withdraw - Initiate AED withdrawal
- GET /api/burjx/kyc/status, POST /api/burjx/kyc/submit

### OnMeta (IN/PH/ID)
- POST /api/onmeta/login - Customer login
- GET /api/onmeta/kyc/status, POST /api/onmeta/kyc/submit (x-onmeta-token header)
- GET /api/onmeta/payment-methods
- POST /api/onmeta/quotation
- POST /api/onmeta/deposit (x-onmeta-token header)
- POST /api/onmeta/withdraw (x-onmeta-token header)
- GET /api/onmeta/orders, GET /api/onmeta/order/:orderId/status
- POST /api/onmeta/bank-account, GET /api/onmeta/bank-accounts

### Other
- GET /api/roar-score

## Environment Secrets
- BURJX_API_KEY, BURJX_API_SECRET - BurjX API credentials
- BURJX_TEST_EMAIL, BURJX_TEST_PASSWORD - BurjX test account
- ONMETA_API_KEY, ONMETA_CLIENT_ID - OnMeta API credentials
- QUOTAGUARD_URL, QUOTAGUARD_USER, QUOTAGUARD_PASS - QuotaGuard proxy for IP whitelisting
- SESSION_SECRET - JWT signing secret

## Demo Account
- Email: demo@tigerpay.com, Password: demo123

## Design
- Dark theme globally (#0B0B0B bg, #FF4D00 orange accent)
- Inter font family
- Card-based layout with subtle elevation
- Smooth animations via Framer Motion
- Logo: tgbnk.png (tiger emblem), Hero image: hero1.png

## Routing
- `/` - Landing page (public, no auth required)
- `/auth` - Sign In / Sign Up page (supports ?mode=login or ?mode=register)
- `/dashboard` - Main dashboard (Individual users, auth required)
- `/dashboard/send` - Send money
- `/dashboard/activity` - Transaction history
- `/dashboard/add-money` - Add money
- `/dashboard/cards` - Cards
- `/dashboard/profile` - Profile
- `/merchant` - Merchant coming soon page

## Account Types
- Individual: Full platform access (dashboard, wallet, transfers)
- Merchant: Shows "Coming Soon" page after signup; role saved as 'merchant' in users table

## Landing Page (TigerBnk)
- Route: / (public, no auth required)
- 7 sections: Hero (with hero1.png), Problem, Solution, Roar Score, How It Works, Social Proof, Final CTA
- Early access form saves to `early_access_submissions` table via POST /api/early-access
- Sign In / Sign Up buttons in navbar link to /auth
- Uses react-hook-form + zod validation, Framer Motion animations

## Recent Changes
- 2026-02-24: Made landing page the root route (/), added Sign In/Sign Up to navbar
- 2026-02-24: Added account type selector (Individual/Merchant) to registration
- 2026-02-24: Applied dark theme (#0B0B0B/#FF4D00) globally to entire platform
- 2026-02-24: Added hero1.png and tgbnk.png logo throughout
- 2026-02-24: Created MerchantComingSoon page for merchant users
- 2026-02-24: Moved dashboard routes under /dashboard prefix
- 2026-02-24: Added TigerBnk landing page with all 7 sections and early access form
- 2026-02-18: Initial MVP build with all core features
- 2026-02-18: Integrated BurjX APEX WebSocket client for UAE/AED deposits/withdrawals
- 2026-02-18: Integrated OnMeta REST API for India/Philippines/Indonesia payments
- 2026-02-18: Added exchange rate service with live rates from open.er-api.com
- 2026-02-18: Updated Add Money page with auto-provider detection and country-specific payment methods
- 2026-02-18: Added reconnection with exponential backoff to BurjX WebSocket client
- 2026-02-18: Removed all crypto terminology from OnMeta service (banking-only presentation)
