# InspecTech — Inspection Management Dashboard (Next.js 16 + Tailwind CSS v4)

InspecTech is a modern admin dashboard for inspection operations: capturing aligned media, managing inspections, tracking reviews, and generating reports. It builds on TailAdmin’s UI foundation and adds domain logic for vendors, departments, and inspection workflows.

## Overview

- Global vendor/department state via cookies (selectedVendor/selectedVendorId, selectedDepartment/selectedDepartmentId) with change events (selectedVendorChanged, selectedDepartmentChanged).
- Image Alignment Guide uses segmentation masks and IoU scoring against tab-specific silhouettes; a 70% pass threshold enables “Send to Upload Area”.
- Camera/preview overlays use an enlarged silhouette (scale 1.12) for clearer guidance; camera modal dimensions sync to the target upload area for consistent alignment.
- Filters architecture persists in sessionStorage (inspectionFilters, trackingFilters); date ranges use DatePickerDropdown with friendly chip formatting.

## Tech Stack

- Next.js 16.x, React 19, TypeScript
- Tailwind CSS v4
- MongoDB + Mongoose
- Firebase (Realtime DB + Admin)
- SWR, ApexCharts, js-cookie, react-toastify

## Getting Started

Prerequisites
- Node.js 20.x recommended

Install & run
```bash
npm install
npm run dev
```

Build & start
```bash
npm run build
npm run start
```

## Environment Variables

Create a .env.local and provide the following (placeholders shown):
```env
MONGO_URI=...
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_LIVE_URL=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=...
CRON_SECRET=...
```

Do not commit secrets; .env files are gitignored.

## Development

- Node.js 20.x recommended
- Install dependencies and run the dev server in this project directory:

```bash
npm install
npm run dev
```

Build production and start:
```bash
npm run build
npm run start
```

## Key Features

- Vendor/Department selection via cookies and window events keeps the app in sync across pages (selectedVendor/selectedVendorId, selectedDepartment/selectedDepartmentId; events: selectedVendorChanged, selectedDepartmentChanged).
- Image Alignment Guide uses segmentation masks and IoU scoring against tab-specific silhouettes; a 70% pass threshold enables “Send to Upload Area”.
- Camera and preview overlays use an enlarged silhouette (scale 1.12) for clearer guidance; camera modal dimensions sync to the target upload area for consistent alignment.
- Persistent filters for inspections and tracking stored in sessionStorage (inspectionFilters, trackingFilters); date ranges presented via DatePickerDropdown with friendly chip formatting.
- Dashboards and reporting with server-side aggregation to produce vendor/department summaries.
- Built on TailAdmin’s UI foundation for sidebar, tables, charts, and dark mode.


Markdown previews:

![Dashboard](./public/screenshots/dashboard.png)
![Inspections Table](./public/screenshots/inspections-table.png)
![Camera Overlay](./public/screenshots/camera-overlay.png)
![Reports](./public/screenshots/reports.png)
![Vendor & Department Selection](./public/screenshots/vendor-department.png)


