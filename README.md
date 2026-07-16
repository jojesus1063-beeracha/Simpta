# Task Manager — Deployment Guide

A MERN task management app: admins add teammates and assign tasks, assignees get
email notifications, and the admin dashboard shows analytics on task status,
priority, and workload.

This guide takes you from this zip file to a live, publicly accessible app.
Recommended stack (all have free tiers):

- **Database:** MongoDB Atlas
- **Backend:** Render
- **Frontend:** Vercel
- **Email:** Gmail SMTP (app password)

---

## 1. Set up MongoDB Atlas (free database)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free **M0 cluster** (pick any region close to you).
3. Under **Database Access**, create a database user with a username/password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — fine for
   getting started; you can restrict this later.
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/task-manager?retryWrites=true&w=majority`
   Replace `<user>` and `<password>` with your database user's credentials, and
   make sure the path after `.net/` is `task-manager` (the database name).

Keep this string — it's your `MONGO_URI`.

## 2. Set up a Gmail App Password (for sending emails)

1. On the Gmail account you want to send from, turn on **2-Step Verification**:
   https://myaccount.google.com/security
2. Then create an app password: https://myaccount.google.com/apppasswords
   - App: "Mail", Device: "Other" (name it "Task Manager").
3. Copy the 16-character password. This is your `GMAIL_APP_PASSWORD`
   (used with your normal Gmail address as `GMAIL_USER`).

## 3. Deploy the backend to Render

1. Push this project to a GitHub repository (see "Push to GitHub" below if
   you haven't done this before).
2. Go to https://render.com, sign up, click **New > Web Service**.
3. Connect your GitHub repo. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
4. Add these environment variables in Render's dashboard:
   - `MONGO_URI` — from step 1
   - `JWT_SECRET` — any long random string (e.g. generate one at
     https://generate-secret.vercel.app/32)
   - `GMAIL_USER` — your Gmail address
   - `GMAIL_APP_PASSWORD` — from step 2
   - `FRONTEND_URL` — you'll fill this in after step 4 (use a placeholder like
     `https://placeholder.com` for now, update it once you have the Vercel URL)
   - `PORT` — `5000` (Render sets its own PORT automatically; this is a fallback)
5. Click **Create Web Service**. After it builds, you'll get a URL like
   `https://task-manager-backend.onrender.com`. Test it by visiting
   `https://task-manager-backend.onrender.com/api/health` — you should see `{"status":"ok"}`.

> Free Render services sleep after inactivity and take ~30s to wake on the
> first request. That's normal on the free tier.

## 4. Deploy the frontend to Vercel

1. Before deploying, point the frontend at your live backend instead of the
   local proxy. Open `frontend/vite.config.js` — the `/api` proxy only works
   for local development, so instead create a file `frontend/.env.production`
   with:
   ```
   VITE_API_URL=https://task-manager-backend.onrender.com/api
   ```
   Then update `frontend/src/api/axios.js` to use it:
   ```js
   const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });
   ```
2. Push the updated code to GitHub.
3. Go to https://vercel.com, sign up, click **Add New > Project**, import your repo.
4. Set **Root Directory** to `frontend`. Vercel auto-detects the Vite build
   settings (`npm run build`, output `dist`) — leave those as-is.
5. Deploy. You'll get a URL like `https://task-manager.vercel.app`.

## 5. Connect the two

1. Go back to Render, update the `FRONTEND_URL` environment variable to your
   real Vercel URL (`https://task-manager.vercel.app`), and redeploy.
2. Visit your Vercel URL. Register the first account — it automatically
   becomes the admin.

## 6. Push to GitHub (if you haven't already)

From inside the `task-manager` folder:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/task-manager.git
git push -u origin main
```
(Create the empty repo on GitHub first at https://github.com/new.)

---

## Local development (optional, before deploying)

**Backend:**
```bash
cd backend
cp .env.example .env   # then fill in your real values
npm install
npm run dev
```

**Frontend** (in a second terminal):
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173. The Vite dev server proxies `/api` calls to
`http://localhost:5000` automatically (see `vite.config.js`), so you don't
need the `VITE_API_URL` override locally.

---

## Notes & next steps

- The first person to register becomes `admin`; everyone else an admin adds
  via the Team page is a `member`.
- Free-tier Mongo/Render/Vercel are fine for testing and small teams. For
  real production use, consider a paid Render instance (no sleep/cold start)
  and setting stricter MongoDB network access rules.
- Consider adding: password reset flow, task comments, file attachments, and
  a custom domain (both Render and Vercel support custom domains for free).
