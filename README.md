# SmartBiz AI — Setup Guide

A full-stack business management app for small shop owners: products, sales,
expenses, analytics, AI insights, and sales prediction.

**Stack:** React + Tailwind (frontend) · Node/Express + SQLite (backend)
No external database server or Python service required — SQLite is a file,
so there's nothing to install or configure beyond Node itself.

---

## 1. Install Node.js

You need Node.js 18 or newer.

- Check if you already have it: open a terminal and run `node -v`
- If you don't have it: download from https://nodejs.org (choose the "LTS" version) and install it like any normal program.
- After installing, close and reopen your terminal, then confirm with `node -v` and `npm -v`.

---

## 2. Unzip the project

Unzip `SmartBiz-AI.zip` anywhere on your computer, e.g. your Desktop.
You'll get a folder `SmartBiz-AI/` with two subfolders: `backend/` and `frontend/`.

---

## 3. Run the backend

Open a terminal **in the `backend` folder**:

```bash
cd SmartBiz-AI/backend
npm install
npm start
```

You should see:

```
SmartBiz AI backend running on http://localhost:5000
```

Leave this terminal window open — this is your server. The first time it
runs, it automatically creates a `smartbiz.db` file (your database) in that
folder. Nothing else to configure.

**Optional:** open `backend/.env` in any text editor and change `JWT_SECRET`
to a random long string before using this for anything real — this is what
keeps login sessions secure.

---

## 4. Run the frontend

Open a **second, separate terminal window**, this time in the `frontend` folder:

```bash
cd SmartBiz-AI/frontend
npm install
npm run dev
```

You should see something like:

```
VITE ready
Local:   http://localhost:5173/
```

Open that address (`http://localhost:5173`) in your browser.

You now have two terminals running at once — one for the backend (port 5000),
one for the frontend (port 5173). Keep both open while you use the app.

---

## 5. Use the app

1. On the landing page, click **"Get started"**.
2. Register with your name, email, password, and business name.
3. You'll land on the Dashboard (empty at first).
4. Go to **Products** → add a product (e.g. Milk, cost ₹40, price ₹60, stock 20).
5. Go to **Sales** → record a sale. Stock and totals update automatically.
6. Go to **Expenses** → log an expense (e.g. Rent, ₹5000).
7. Check **Dashboard** and **Analytics** — your numbers now populate.
8. Check **AI Insights** — plain-language notes on your data, plus a sales
   prediction once you have a few days of sales history.

---

## How it works (short version)

- **Auth:** passwords are hashed with bcrypt; sessions use JWTs stored in
  your browser's localStorage.
- **Data isolation:** every table is scoped to a `business_id` tied to your
  logged-in user — you only ever see your own data.
- **Sales:** selecting a product and quantity automatically computes the
  total (`quantity × selling price`) and reduces stock. Overselling past
  available stock is blocked.
- **Analytics:** revenue, cost of goods sold, expenses, and profit are
  computed directly from your sales and expense records, grouped by month.
- **AI Insights:** a set of rule-based checks (month-over-month sales change,
  best seller, declining products, low stock, top expense category) — no
  external AI API calls, so it works fully offline and instantly.
- **Sales Prediction:** a simple linear regression fitted to your daily
  revenue history, projected forward 7 and 30 days. Needs at least 3 days
  of sales data to activate; accuracy improves with more history.

---

## Next steps if you want to extend this

- **Deploy it:** the backend can run on Render/Railway/Fly.io; SQLite works
  fine for a single-shop deployment. For multiple concurrent businesses at
  scale, swap SQLite for PostgreSQL (the schema in `backend/db.js` maps
  directly).
- **Real ML:** the current prediction is a simple trend line by design (per
  the original roadmap: "start simple"). If you outgrow it, a Python
  FastAPI microservice with scikit-learn (Random Forest / more features:
  day-of-week, seasonality) can sit alongside this backend and be called
  from `routes/predict.js`.
- **Mobile:** the UI is responsive down to phone width already (sidebar
  collapses to a hamburger menu).

---

## Hosting it online (so it's available 24/7, even when your PC is off)

This uses **Render** (a free hosting service) and **GitHub** (to hold your
code so Render can find it). Both are free for this.

**Important limitation on the free tier:** Render's free web services use
temporary storage. Your saved data (`smartbiz-data.json`) can be wiped
whenever the free service restarts — which happens periodically and after
15 minutes of no visitors. This is fine for showing people a working demo,
but don't rely on it for real business records long-term. Render's paid
tier ($7/month Starter plan) adds a persistent disk that fixes this.

### Step 1: Put your project on GitHub

1. Go to https://github.com and create a free account if you don't have one.
2. Click the **"+"** icon top right → **"New repository"**.
3. Name it `smartbiz-ai`, keep it Public, click **"Create repository"**.
4. On the next page, click **"uploading an existing file"**.
5. Drag your whole `SmartBiz-AI` folder's contents (backend, frontend,
   render.yaml, README.md) into the browser window.
6. Scroll down, click **"Commit changes"**.

### Step 2: Deploy on Render

1. Go to https://render.com and sign up (you can sign up with your GitHub
   account — this also connects them automatically).
2. Click **"New +"** → **"Blueprint"**.
3. Select the `smartbiz-ai` repository you just created.
4. Render will detect the `render.yaml` file in the project and set
   everything up automatically — build command, start command, and a secure
   random `JWT_SECRET`.
5. Click **"Apply"**. Wait a few minutes while it builds (you'll see logs
   scrolling — this is normal).
6. When it's done, Render gives you a public web address, something like:
   `https://smartbiz-ai.onrender.com`

That address works from any device, anywhere, with your PC completely off.

### Updating it later

Any time you want to change the app, upload your changed files to the same
GitHub repository (drag files in the same way, or use GitHub Desktop for
easier updates) — Render automatically rebuilds and redeploys within a
few minutes.

---

## Troubleshooting

- **"Cannot find module" errors:** you forgot `npm install` in that folder.
- **Frontend loads but data won't save:** make sure the backend terminal is
  still running and shows no errors.
- **"Port already in use":** something else is using port 5000 or 5173.
  Close other terminals running Node, or change the port in `backend/.env`
  (backend) or `frontend/vite.config.js` (frontend).
- **Forgot your password:** there's no password reset flow in this MVP —
  simplest fix is deleting `backend/smartbiz.db` and registering again
  (this wipes all data, so only do this in testing).
