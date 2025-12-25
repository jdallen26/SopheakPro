# Sopheak Web Application

## Overview
A full-stack web application with a Next.js frontend and Django backend. The frontend features a Color Admin-style dashboard with ApexCharts for data visualization. The application is a building maintenance management system with modules for Accounting, Payroll, HR, Routing, Customers, Invoicing, and Reports.

## Project Structure
```
├── frontend/                    # Next.js 16 frontend application
│   ├── app/                     # Next.js app router pages
│   │   ├── components/          # Shared React components
│   │   │   ├── ApexChart.tsx    # Dynamic ApexCharts wrapper
│   │   │   ├── ClientVendors.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── shared/              # Layout components
│   │   │   ├── Sidebar.tsx      # Dark sidebar navigation (220px)
│   │   │   ├── Header.tsx       # Header with search (50px height)
│   │   │   └── Footer.tsx       # Page footer
│   │   ├── accounting/          # Accounting module
│   │   ├── payroll/             # Payroll module (processor preserved)
│   │   ├── hr/                  # HR module
│   │   ├── routing/             # Routing module
│   │   ├── customers/           # Customers module
│   │   ├── invoicing/           # Invoicing module
│   │   ├── reports/             # Reports module
│   │   ├── calendar/            # Calendar with FullCalendar
│   │   ├── scrum-board/         # Kanban board with drag-and-drop
│   │   ├── settings/            # Settings with tabbed navigation
│   │   ├── auth/login/          # Login page with Google OAuth
│   │   ├── api/auth/            # NextAuth API routes
│   │   ├── page.tsx             # Dashboard with ApexCharts
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles with theme variables
│   ├── assets/                  # Static assets
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
├── backend/                     # Django backend (MS SQL Server)
│   ├── base/                    # Django project settings
│   ├── accounting/              # Accounting app
│   ├── payroll/                 # Payroll app
│   ├── hr/                      # HR app
│   ├── customers/               # Customers app
│   └── routing/                 # Routing app
```

## Tech Stack
- **Frontend**: Next.js 16 with React 19, TypeScript, TailwindCSS
- **Charts**: ApexCharts (react-apexcharts)
- **Calendar**: FullCalendar (@fullcalendar/react)
- **Drag & Drop**: @hello-pangea/dnd for Scrum Board
- **Authentication**: NextAuth.js with Google OAuth
- **Icons**: Lucide React for consistent iconography
- **Theming**: next-themes for light/dark mode support
- **Backend**: Django 5.2 with Django REST Framework
- **Database**: MS SQL Server (backend - requires external configuration)

## Design System
The application follows a Color Admin-style design language:
- Dark sidebar (#2d353c) with 220px width
- Teal primary accent color (#00acac)
- Light grey background (#d9e0e7 light / #1a1e22 dark)
- Header height 50px with centered search bar
- Bootstrap-style DataTables for all table components
- Widget cards with colored backgrounds (bg-teal, bg-blue, bg-orange, bg-red)
- Panel components with panel-heading and panel-body

### CSS Variables
Theme colors are defined in globals.css:
- `--sidebar-bg`: Sidebar background (#2d353c)
- `--teal`, `--teal-dark`: Primary accent colors
- `--panel`: Panel/card background
- `--background`, `--background-secondary`: Page backgrounds
- `--foreground`, `--foreground-muted`: Text colors
- `--border-color`: Border and divider colors

### Component Classes
- `.panel`: Card container with heading and body
- `.panel-heading`: Card header with title
- `.panel-body`: Card content area
- `.data-table`: Bootstrap-style data table
- `.widget`, `.bg-teal`, `.bg-blue`, etc.: Stat widget cards
- `.btn`, `.btn-primary`: Button styles
- `.badge`, `.badge-teal`, etc.: Status badges

## Running Locally
- **Frontend**: The Next.js frontend runs on port 5000
- **Backend**: The Django backend requires MS SQL Server connection

## Configuration
- Next.js configured for Replit environment (port 5000, host 0.0.0.0)
- Theme switcher in header settings dropdown
- Autoscale deployment configured
- Google OAuth restricted to organization domain (configurable in NextAuth)

## Recent Changes
- December 22, 2025: Color Admin UI Redesign
  - Implemented Color Admin-style theme with dark sidebar
  - Replaced all Tremor charts with ApexCharts
  - Added Bootstrap DataTables styling for all tables
  - Created Calendar page with FullCalendar
  - Built Scrum Board with drag-and-drop kanban
  - Developed Settings page with tabbed navigation
  - Created Login page with Google OAuth integration
  - Updated all module pages with new panel/widget styling
  - Preserved payroll processor table structure and endpoint code
