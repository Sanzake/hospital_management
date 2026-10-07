# Hospital Manager PRO 🏥

A modern full-stack hospital & clinical operations management platform built with React 19, Express 5, TypeScript, Tailwind CSS v4, and Supabase (PostgreSQL).

---

## ✨ Features

- **📊 Centralized Clinical Dashboard**: Real-time stats on patients admitted, active visitors on site, scheduled shifts, and team members.
- **👥 Patient Directory**: Full medical records management with priority categorization (`High`, `Medium`, `Low`), medical notes, and live search.
- **🚶 Visitor Tracking & Automated Emailing**:
  - Check in visitors and link them to patients.
  - Live on-site duration tracker.
  - Checkout summary report automatically emailed to patients/families upon visit closure.
- **📅 Shift Rostering**: Schedule staff duty hours with automatic shift duration calculation, time validation, and staff filters.
- **🛡️ Role-Based Access Control (RBAC)**: Distinct permissions for `admin` and `staff` with JWT authentication and rate-limiting brute force protection.
- **✉️ Email Audit Trail**: Complete log of all outgoing clinical emails and delivery statuses.
- **💎 Modern UX**: Built with Lucide icons, toast feedback notifications, custom confirmation modals, and responsive layout.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7, Zustand, Lucide Icons.
- **Backend**: Node.js (ESM), Express 5, Helmet, CORS, Express Rate Limit, Zod, bcrypt, JSON Web Tokens (JWT), Nodemailer.
- **Database**: PostgreSQL on Supabase with pgcrypto.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- npm or pnpm

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone git@github.com:Sanzake/hospital_management.git
cd hospital_management

# Install root dependencies
npm install

# Install client & server dependencies
npm install --prefix server
npm install --prefix client
```

### 3. Environment Variables
Copy the example environment configuration in `server/`:
```bash
cp server/.env.example server/.env
```
Update `server/.env` with your Supabase credentials, JWT secret, and SMTP settings:
```ini
PORT=4000
JWT_SECRET=your-secure-jwt-secret
CLIENT_ORIGIN=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@example.com
SMTP_PASS=your-app-password
MAIL_FROM="Hospital Manager <you@example.com>"

ADMIN_EMAIL=admin@hospital.local
ADMIN_PASSWORD=admin123
ADMIN_NAME=Hospital Admin
```

### 4. Database Setup
Run the SQL schema located at `server/sql/schema.sql` in your Supabase SQL editor to create the required tables (`users`, `patients`, `shifts`, `visitors`, `emails`).

Seed the initial administrator account:
```bash
npm run seed
```

### 5. Running the Application
Start both the backend API and frontend development server with a single command:
```bash
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend and frontend concurrently with live-reload |
| `npm run dev:server` | Starts Express server with `node --watch` |
| `npm run dev:client` | Starts Vite client dev server |
| `npm run seed` | Seeds or updates the default admin account |
| `npm run build` | Compiles frontend for production (`tsc -b && vite build`) |
| `npm run lint` | Runs oxlint across the frontend codebase |

---

## 🔒 Security

- Rate limiting on `/api/auth/login` to prevent brute force.
- Password hashing with bcrypt.
- Strict input validation on all routes via Zod.
- Sensitive environment files are excluded via `.gitignore`.
