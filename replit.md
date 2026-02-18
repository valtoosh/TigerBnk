# TigerPayX Web

## Overview
Premium fintech web application (Revolut-style) with JWT authentication, digital wallet, money transfers, and currency exchange. Built with React + Vite + Express.js + PostgreSQL.

## Tech Stack
- Frontend: React 18, Vite, TailwindCSS, Framer Motion, TanStack React Query, Wouter
- Backend: Express.js with TypeScript, JWT auth with bcrypt
- Database: PostgreSQL with Drizzle ORM
- UI: Shadcn components, Lucide icons

## Project Structure
- `client/src/pages/` - Auth, Dashboard, SendMoney, Activity, AddMoney, Cards, Profile
- `client/src/components/` - AppSidebar, MobileNav, ThemeProvider, UI components
- `client/src/lib/` - Auth context, query client utils
- `server/` - Express routes, DB storage, seed data
- `shared/schema.ts` - Drizzle schema, Zod validators, shared types

## Key Features
- JWT-based auth with httpOnly cookies
- Dashboard with balance display, quick actions, Roar Score
- Send money with live currency conversion (AED, INR, PHP, USD, GBP, IDR)
- Add money (deposit) with bank transfer / card
- Transaction history with filters
- Dark/light theme toggle
- Responsive sidebar (desktop) + bottom nav (mobile)

## API Endpoints
- POST /api/auth/register, /api/auth/login, GET /api/auth/me, POST /api/auth/logout
- GET /api/user/profile, PUT /api/user/profile, POST /api/user/deposit
- GET /api/transactions, POST /api/transactions/send
- GET /api/exchange-rate?from=X&to=Y&amount=Z
- GET /api/roar-score

## Demo Account
- Email: demo@tigerpay.com, Password: demo123

## Design
- Premium indigo/slate color palette with light backgrounds
- Inter font family
- Card-based layout with subtle elevation
- Smooth animations via Framer Motion

## Recent Changes
- 2026-02-18: Initial MVP build with all core features
