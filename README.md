# StatioPoint
## Point-of-Sale System for Retail Stationery

StatioPoint is a web-based Point-of-Sale (POS) system designed for small to medium-sized retail stationery shops in Pakistan. It enables shop owners and cashiers to manage day-to-day sales operations, track inventory, monitor business performance through analytics, and maintain employee records — all from a single, intuitive web interface.

---

## Team Members

- Hanan Ishaq — 24L-2537
- Mohid Israr — 24L-2510

---

## Tech Stack

- **Backend:** Node.js (Express.js)
- **Frontend:** HTML, CSS, JavaScript
- **Database:** Microsoft SQL Server

---

## Project Structure

```
StatioPoint/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── admin.html
│   ├── cashier.html
│   ├── login.html
│   └── signup.html
├── database/
│   └── schema.sql
├── docs/
│   └── StatioPoint_Iteration1_Report.docx
└── README.md
```

---

## How to Run

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- Microsoft SQL Server installed and running
- A tool like [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) to set up the database

### 1. Database Setup

1. Open SSMS and connect to your SQL Server instance.
2. Run the script located at `database/schema.sql` to create the required tables.

### 2. Backend Setup

```bash
cd backend
npm install
```

- Create a `.env` file in the `backend/` folder based on `.env.example` and fill in your database credentials.

```bash
node server.js
```

The backend server will start on `http://localhost:3000` (or the port specified in your `.env`).

### 3. Frontend Setup

Open any of the HTML files in your browser directly, or serve them using a local server:

```bash
# Using VS Code Live Server extension, or simply open:
frontend/login.html
```

---

## Features (Iteration 1)

- Secure user login with JWT-based authentication
- Role-based access control (Admin & Cashier roles)
- Admin dashboard with business overview
- Cashier checkout panel
- User profile management

---

## Environment Variables

Create a `.env` file in the `backend/` directory. See `.env.example` for the required variables. **Never commit your real `.env` file to GitHub.**

---

## Notes

- All API keys and passwords must be stored in `.env` only — never hardcoded.
- The `.env` file is listed in `.gitignore` and will not be uploaded to GitHub.
