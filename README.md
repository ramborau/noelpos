# Admin Panel - Order Management System

A clean, minimal admin panel for managing orders and assigning riders. Built with PHP/MySQL backend and Next.js/React/Shadcn UI frontend.

## Admin Credentials

- **Username:** `admin`
- **Password:** `password`

## Project Structure

```
├── api/                    # PHP Backend
│   ├── config/
│   │   ├── database.php    # Database connection
│   │   └── cors.php        # CORS headers
│   ├── auth/
│   │   └── login.php       # Admin authentication
│   ├── orders/
│   │   ├── list.php        # Get all orders
│   │   ├── get.php         # Get single order
│   │   ├── create.php      # Create order (API endpoint)
│   │   ├── assign-rider.php # Assign rider to order
│   │   └── update-status.php # Update order status
│   └── riders/
│       ├── list.php        # Get all riders
│       ├── create.php      # Add new rider
│       └── delete.php      # Deactivate rider
├── database/
│   └── schema.sql          # MySQL database schema
└── frontend/               # Next.js Frontend
    └── src/
        ├── app/
        │   ├── login/      # Login page
        │   └── dashboard/  # Main dashboard
        │       └── riders/ # Riders management
        ├── components/     # UI components
        └── lib/            # API client & auth
```

## Setup Instructions

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
source /path/to/database/schema.sql
```

Or import the schema using a tool like phpMyAdmin.

### 2. Configure Database Connection

Edit `api/config/database.php` and update credentials:

```php
private $host = "localhost";
private $db_name = "admin_panel";
private $username = "root";
private $password = "your_password";
```

### 3. Start PHP Backend

```bash
cd api
php -S localhost:8000
```

### 4. Start Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/login.php` - Admin login

### Orders
- `GET /orders/list.php` - Get all orders
- `GET /orders/get.php?id={id}` - Get single order
- `POST /orders/create.php` - Create new order (for external API integration)
- `POST /orders/assign-rider.php` - Assign rider to order
- `POST /orders/update-status.php` - Update order status

### Riders
- `GET /riders/list.php` - Get all riders
- `POST /riders/create.php` - Add new rider
- `POST /riders/delete.php` - Deactivate rider

## Creating Orders via API

External systems can create orders by posting to `/orders/create.php`:

```bash
curl -X POST http://localhost:8000/orders/create.php \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "customer_address": "123 Main St",
    "items": [
      {"name": "Pizza", "qty": 2, "price": 15.99},
      {"name": "Coke", "qty": 1, "price": 2.50}
    ],
    "total_amount": 34.48,
    "notes": "Extra cheese please"
  }'
```

## Features

- Admin authentication
- View all orders with details
- Assign riders to orders
- Update order status (pending, assigned, picked_up, delivered, cancelled)
- Add and manage riders (name and mobile number)
- Clean, minimal UI with Shadcn components

## Tech Stack

- **Backend:** PHP 8+, MySQL
- **Frontend:** Next.js 15, React 19, TypeScript
- **UI:** Shadcn UI, Tailwind CSS
