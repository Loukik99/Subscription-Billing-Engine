# Deployment Guide

The "Could not connect to server" error happens because your Frontend (on Vercel) is trying to talk to `localhost` (your computer). You need to deploy the Backend to the public internet so Vercel can access it.

## The Best Free Stack (Recommended)
**Database**: Supabase (Best free PostgreSQL)
**Backend Hosting**: Render (Free Node.js hosting)
**Frontend**: Vercel (Already done)

---

## Step 1: Get a Free Database (Supabase)
Supabase is excellent because its free tier is very generous and doesn't expire like others.

1.  Go to [supabase.com](https://supabase.com) and sign up.
2.  **Create New Project**.
    *   Give it a name (e.g., `billing-engine`).
    *   Set a strong **Database Password** (Save this! You need it later).
    *   Region: Choose one close to you.
3.  **Get Connection String**:
    *   Once the project is created, go to **Project Settings** (cog icon) -> **Database**.
    *   Scroll down to **Connection String** -> **URI** tab.
    *   Copy the string. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xyz.supabase.co:5432/postgres`
    *   *Replace `[YOUR-PASSWORD]` with the real password you set in step 2.*

---

## Step 2: Deploy Backend Code (Render)
Render will run your Node.js/Express code.

1.  Push your latest code to **GitHub**.
2.  Go to [dashboard.render.com](https://dashboard.render.com).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Configure Service**:
    *   **Name**: `billing-backend`
    *   **Runtime**: Node
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
    *   **Plan**: Free
6.  **Environment Variables** (Scroll down):
    *   Add `DATABASE_URL` -> Paste your **Supabase Connection String** from Step 1.
    *   Add `JWT_SECRET` -> A random secret key (e.g., `super-secret-key-123`).
    *   Add `NODE_ENV` -> `production`.
7.  Click **Deploy Web Service**.
8.  **Wait**: It might take a few minutes. Once green, copy the URL (e.g., `https://billing-backend.onrender.com`).

---

## Step 3: Connect Frontend (Vercel)
Now tell your Vercel frontend where the backend is.

1.  Go to your **Vercel Dashboard**.
2.  Select your project -> **Settings** -> **Environment Variables**.
3.  Add/Update:
    *   **Key**: `NEXT_PUBLIC_API_URL`
    *   **Value**: `YOUR_RENDER_URL/api`
        *   Example: `https://billing-backend.onrender.com/api`
        *   **IMPORTANT**: Do not forget the `/api` at the end!
4.  **Redeploy**:
    *   Go to **Deployments** tab.
    *   Click the three dots (`...`) on your latest deployment -> **Redeploy**.

---

## Other Options

### Option B: Railway (Easiest All-in-One)
Railway is easier but the free trial is limited.
1.  [railway.app](https://railway.app) -> New Project -> Deploy from GitHub.
2.  Right-click canvas -> Add **Database (PostgreSQL)**.
3.  Railway automatically links them. Just add `JWT_SECRET`.

### Option C: DigitalOcean ($5/mo)
Best for production scaling.
1.  Create App -> Select GitHub Repo.
2.  Add Database component.
3.  Set environment variables.
