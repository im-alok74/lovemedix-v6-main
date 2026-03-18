# LoveMedix - Pharmacy & Distributor Management Platform

A modern, full-featured e-commerce platform for managing medicines, connecting distributors with pharmacies, and streamlining the pharmaceutical supply chain.

## 🌟 Features

### For Pharmacies
- **Medicine Catalog Search** - Browse and search from a comprehensive database of medicines
- **Procurement Marketplace** - View available medicines from multiple distributors
- **Shopping Cart** - Build purchase requests with quantity adjustments
- **Order Management** - Track orders and receive status updates
- **Invoice Generation** - Automated invoice creation and management
- **Prescription Upload** - Upload and manage customer prescriptions
- **Dashboard** - Overview of orders, stock, and business metrics

### For Distributors
- **Inventory Management** - Add, edit, and manage medicine inventory with batch details
- **Medicine Batch Tracking** - Track manufacturing and expiry dates
- **Multi-Image Upload** - Upload multiple product images for better visibility
- **Stock Management** - Monitor quantity, reserved stock, and availability
- **Pricing Control** - Set MRP and wholesale prices
- **Procurement Requests** - View and manage requests from pharmacies
- **Profile Management** - Company details and verification status

### For Admins
- **User Management** - Manage pharmacies, distributors, and customers
- **Distributor Verification** - Approve/reject distributor registrations
- **Inventory Oversight** - Monitor all medicines across distributors
- **Medicine Catalog** - Manage the central medicine database
- **Order Monitoring** - Track all orders in the system
- **Prescription Management** - Review and manage prescriptions

## 🏗️ Project Structure

```
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── auth/                # Authentication
│   │   ├── distributor/         # Distributor endpoints
│   │   ├── medicines/           # Medicine endpoints
│   │   ├── orders/              # Order management
│   │   ├── pharmacy/            # Pharmacy endpoints
│   │   ├── procurement/         # Procurement system
│   │   └── prescriptions/       # Prescription endpoints
│   ├── admin/                    # Admin dashboard pages
│   ├── distributor/              # Distributor pages
│   ├── pharmacy/                 # Pharmacy pages
│   ├── cart/                     # Shopping cart
│   ├── checkout/                 # Checkout flow
│   ├── orders/                   # Order pages
│   └── ...other routes
├── components/                   # Reusable React components
│   ├── admin/                   # Admin-specific components
│   ├── auth/                    # Authentication components
│   ├── checkout/                # Checkout components
│   ├── distributor/             # Distributor components
│   ├── medicines/               # Medicine display components
│   ├── pharmacy/                # Pharmacy components
│   ├── invoice/                 # Invoice components
│   └── ui/                      # Base UI components
├── lib/                         # Utility functions and helpers
│   ├── auth-server.ts          # Server-side authentication
│   ├── seller-auth.ts          # Distributor authentication
│   ├── db.ts                   # Database connection
│   └── utils.ts                # Helper functions
├── scripts/                     # Database migration scripts
├── public/                      # Static assets
└── styles/                      # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm package manager
- PostgreSQL database (Neon recommended)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/im-alok74/lovemedix-v6-main.git
cd lovemedix-v6-main
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
Create a `.env.local` file:
```env
DATABASE_URL=your_neon_database_url
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

4. **Run database migrations**
```bash
node run-migrations.js
```

5. **Start the development server**
```bash
npm run dev
# or
pnpm dev
```

Visit http://localhost:3000

## 📚 Database Schema

### Core Tables
- **users** - User accounts with roles (admin, distributor, pharmacy, customer)
- **medicines** - Medicine catalog with details, pricing, and images
- **medicine_images** - Multiple images per medicine for better showcase
- **distributor_profiles** - Distributor company information
- **pharmacy_profiles** - Pharmacy business information
- **distributor_medicines** - Inventory management with batch tracking
- **orders** - Customer orders
- **order_items** - Line items in orders
- **cart_items** - Shopping cart items
- **prescriptions** - Customer prescriptions
- **purchase_requests** - Procurement requests from pharmacies to distributors

## 🔐 Authentication

The platform uses **Clerk** for authentication with role-based access control:
- **Admins** - Full system access
- **Distributors** - Manage inventory, track orders
- **Pharmacies** - Browse medicines, place orders
- **Customers** - View medicines, upload prescriptions

## 📦 API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/search` - Search medicines
- `POST /api/medicines/upload-image` - Upload medicine image

### Distributor Inventory
- `GET /api/distributor/inventory` - Get distributor's inventory
- `POST /api/distributor/inventory` - Add medicine to inventory
- `DELETE /api/distributor/inventory/{id}` - Remove from inventory

### Pharmacy Procurement
- `GET /api/procurement/inventory` - View available medicines
- `POST /api/procurement/purchase-requests` - Create purchase request

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

### Admin
- `GET /api/admin/users` - Manage users
- `GET /api/admin/medicines` - Manage medicines
- `GET /api/admin/distributors` - Manage distributors
- `GET /api/admin/pharmacies` - Manage pharmacies

## 🛠️ Development

### Build for production
```bash
npm run build
```

### Run in production
```bash
npm run start
```

### Linting
```bash
npm run lint
```

## 📝 Features in Detail

### Medicine Batch Details
- Track manufacturing date (Mfg)
- Monitor expiry dates
- Manage batch numbers for recall tracking
- HSN code management for GST compliance
- Multiple images per medicine

### Inventory Management
- Real-time stock tracking
- Reserved quantity management
- Price management (MRP and wholesale)
- Batch history
- Alerts for expiring stock
- Add multiple images to medicines

### Procurement System
- Atomic operations for stock reservation
- Single-distributor purchase requests
- Quantity validation
- Automatic cart management

### Invoice Generation
- Automated invoice creation
- Order-level invoicing
- Professional PDF export
- Tax calculations

## 🎨 UI/UX Components

Built using:
- **React 19** - UI framework
- **Next.js 16** - React framework
- **Shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library

## 🔄 Workflow Examples

### Pharmacy Orders Medicines
1. Pharmacy browses distributor marketplace
2. Adds medicines to cart
3. Submits purchase request
4. Stock is reserved automatically
5. Distributor receives procurement request
6. Order can be fulfilled
7. Automatic invoice generation

### Distributor Adds Inventory
1. Navigate to Inventory Management
2. Select existing medicine or add new
3. Enter batch details (batch number, mfg, expiry)
4. Set pricing (MRP, wholesale)
5. **Upload one or more medicine images**
6. Click "Add to Inventory"
7. Images appear in pharmacy marketplace

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env.local`
- Ensure Neon database is running
- Check network connectivity

### Migration Failures
- Run `node run-migrations.js` with proper database connection
- Check for existing tables using `check-db.js`
- Review migration scripts in `scripts/` directory

### Authentication Issues
- Verify Clerk credentials in environment variables
- Check Clerk dashboard for API keys
- Clear browser cookies if session issues persist

## 📱 Responsive Design
The platform is fully responsive and optimized for:
- Desktop browsers
- Tablets
- Mobile devices

## 🔄 CI/CD

The project includes:
- GitHub Actions integration ready
- Environment-based configuration
- Production deployment checklist

## 📄 License

This project is proprietary. All rights reserved.

## 👥 Community & Support

For issues and feature requests, please use the GitHub issues tracker.

## 🎯 Future Enhancements

- Real-time notifications
- Advanced analytics dashboard
- Prescription image recognition
- Live tracking of orders
- Integration with payment gateways
- Multi-language support
- Mobile app

---

**Version:** 6.0  
**Last Updated:** March 2026

For detailed setup instructions, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
