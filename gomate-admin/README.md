# Gomate Admin Dashboard

Admin dashboard for managing the Gomate ride-sharing platform.

## Prerequisites

- Node.js 18+
- Backend API running (see `../gomate-backend`)

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   # Copy the example env file
   cp .env.example .env.local

   # Edit .env.local and set the backend URL
   # Default: NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open the dashboard:**
   - Navigate to http://localhost:3001
   - The app will redirect to `/dashboard`

## Backend Connection

The admin dashboard connects to the backend API at the URL specified in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Important:** The backend must be running before starting the admin dashboard.

### Troubleshooting

**"Failed to fetch" errors:**

1. Ensure backend is running: `cd ../gomate-backend && npm run start:dev`
2. Check backend URL in `.env.local` matches the running backend
3. Verify CORS is enabled in backend (`src/main.ts`)
4. Check browser console for detailed error messages
5. Try opening the API docs: http://localhost:3000/api

**CORS errors:**

- Backend must have CORS enabled for `*` origin in development
- Check `gomate-backend/src/main.ts` has `app.enableCors()` configured

## Features

- **Dashboard Overview**

  - Total users, drivers, rides, and revenue metrics
  - Rides & revenue trend charts
  - Driver status distribution

- **User Management**

  - List, search, view, edit, delete users
  - User activity tracking

- **Driver Management**

  - List, search, view, edit drivers
  - Toggle driver active/inactive status
  - View completed ride counts per driver
  - Delete drivers

- **Driver Registration Requests**

  - Review new driver applications
  - View submitted documents (CNIC, license, selfie, vehicle photos)
  - Approve or reject with reason

- **Ride Management**

  - View all rides with details
  - Search by passenger, driver, or ride ID
  - Filter by status (pending, completed, cancelled, etc.)
  - View route coordinates and fare information

- **Payments & Fees**

  - Monitor driver payment status (paid, pending, overdue)
  - Mark payments as paid
  - Suspend/activate driver accounts
  - View payment statistics

- **Fare Settings**

  - Configure base fare, per km rate, per minute rate
  - Separate settings for bike, auto, and car rides
  - Preview example fare calculations

- **Service Fees**
  - Set weekly service fees per vehicle type
  - View monthly and yearly revenue estimates

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI Components:** Radix UI + Tailwind CSS
- **Charts:** Recharts
- **State Management:** React Hooks
- **API Client:** Fetch API

## Project Structure

```
gomate-admin/
├── app/
│   ├── dashboard/          # Dashboard pages
│   │   ├── page.tsx        # Main dashboard
│   │   ├── users/          # User management
│   │   ├── drivers/        # Driver management
│   │   ├── rides/          # Ride management
│   │   ├── payments/       # Payment tracking
│   │   ├── driver-requests/# Registration requests
│   │   ├── fare-settings/  # Fare configuration
│   │   └── service-fees/   # Service fee settings
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Redirects to /dashboard
├── components/
│   ├── ui/                 # Shadcn UI components
│   ├── dashboard/          # Dashboard-specific components
│   ├── sidebar.tsx         # Navigation sidebar
│   └── header.tsx          # Top header
├── lib/
│   └── api-config.ts       # API configuration
└── .env.local              # Environment variables (create this)
```

## Development

- **Dev server:** `npm run dev` (port 3000)
- **Build:** `npm run build`
- **Start production:** `npm start`
- **Lint:** `npm run lint`

## API Endpoints Used

All endpoints are prefixed with `NEXT_PUBLIC_API_URL` from `.env.local`:

- `GET /passengers` - Fetch all users
- `GET /drivers` - Fetch all drivers
- `GET /statistics/dashboard` - Dashboard stats
- `GET /statistics/rides-revenue-trend` - Revenue trends
- `GET /statistics/driver-status` - Driver status distribution
- `GET /statistics/driver-ride-counts` - Rides per driver
- `GET /statistics/all-rides` - All rides with details
- `GET /payments` - Payment data
- `GET /fare-settings` - Fare configuration
- `GET /service-fees` - Service fee settings
- `PUT /fare-settings/:vehicleType` - Update fare settings
- `PUT /service-fees/:vehicleType` - Update service fees
- `PATCH /passengers/:id` - Update user
- `DELETE /passengers/:id` - Delete user
- `PATCH /drivers/:id` - Update driver
- `DELETE /drivers/:id` - Delete driver

## License

Private - Part of Gomate FYP Project
