# DukaaanOS - Client (Frontend)

DukaaanOS is a modern, mobile-first web application designed for Kirana store owners to manage their inventory, billing, and shop profiles efficiently.

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)
- **Barcode Scanning**: [React Zxing](https://github.com/Sec-ant/react-zxing)
- **Authentication**: Firebase Auth

## Features

- **Dashboard**: View daily revenue, recent bills, and low stock alerts.
- **Products**: Browse inventory with category filters and search.
- **Add Product**: Interactive, step-by-step form to add new products, with barcode scanning support.
- **Billing**: Create new bills, manage cart, apply discounts, and select payment modes (Cash, UPI, Udhaari).
- **History**: View past transactions with expandable bill details.
- **Profile**: View shopkeeper and shop details, and log out.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Ensure you have a `.env.local` file in the root of the `client` directory (if required) to set configurations such as `NEXT_PUBLIC_API_URL` or Firebase credentials.

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

This will run the Next.js app on `http://0.0.0.0:3000` (listening on all network interfaces for local mobile testing).

### Building for Production

To create an optimized production build:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```
