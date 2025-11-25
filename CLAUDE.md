# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LNDR Admin Panel - A laundry/dry cleaning order management system with a PHP/MySQL backend and Next.js frontend. Designed for split deployment: frontend on Vercel, backend on Cloudways.

## Common Commands

### Frontend (Next.js)
```bash
cd frontend
npm install        # Install dependencies
npm run dev        # Development server (localhost:3000)
npm run build      # Production build
npm run lint       # Run ESLint
```

### Backend (PHP)
```bash
cd api
php -S localhost:8000   # Start PHP dev server
```

### Database Setup
```bash
mysql -u root -p < database/schema.sql
```

## Architecture

### Backend (`/api`)
- Pure PHP 8+ REST API with PDO/MySQL
- All endpoints include `config/cors.php` for CORS headers and `config/database.php` for DB connection
- Each endpoint is a standalone PHP file (e.g., `/orders/list.php`, `/orders/create.php`)
- API modules: `auth`, `orders`, `riders`, `customers`, `addresses`, `categories`, `subcategories`, `services`, `service-requests`

### Frontend (`/frontend`)
- Next.js 16 with App Router, React 19, TypeScript
- UI: Shadcn UI components (`/components/ui/`), Tailwind CSS v4
- API client in `/src/lib/api.ts` - centralized fetch wrapper
- Auth context in `/src/lib/auth.tsx`
- Notifications system in `/src/lib/notifications.tsx`
- Dashboard routes under `/src/app/dashboard/` (orders, riders, categories, service-types, services, service-requests)

### Data Model
Core entities: `admins`, `customers`, `addresses`, `orders`, `riders`, `categories`, `subcategories`, `services`, `service_requests`
- Orders link to customers, addresses, and riders
- Services belong to categories and subcategories (hierarchical)
- Service requests are scheduling-only (no products/payment)

## Environment Variables

Frontend requires `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`)

## Default Credentials

Admin login: `admin` / `password`
