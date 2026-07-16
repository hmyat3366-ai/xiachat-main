# XiaChat

A modern customer support application with a chat widget, agent dashboard, and AI capabilities.

## Setup Instructions

This project requires both a backend server and a frontend dashboard to run.

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

**Edit `backend/.env`:**
Fill in `MONGODB_URI` and any other required credentials. 
*(Note: If `JWT_SECRET` is left blank, a fallback will be used for local development, but you MUST set it in production).*

Start the backend:
```bash
npm start
```
*The backend will run on `http://localhost:5005`*

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Start the frontend:
```bash
npm run dev
```
*The frontend dashboard will run on `http://localhost:3000`*

### 3. Testing the Widget Locally

You can test the widget without deploying by using the `test_widget.html` or `local_test_widget.html` files. Open them directly in your browser.
