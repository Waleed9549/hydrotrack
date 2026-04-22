# 💧 HydroTrack - updated

A beautiful, mobile-first hydration tracking web app built with React and Supabase. Install it on your iPhone or iPad home screen for a native app experience with fully customizable push notification reminders.

![HydroTrack](https://img.shields.io/badge/version-3.0-4fa3e8?style=flat-square) ![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react) ![Supabase](https://img.shields.io/badge/Supabase-database-3ecf8e?style=flat-square&logo=supabase) ![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?style=flat-square)

---

## ✨ Features

**Tracking**
- Animated wave-fill circle showing your daily progress percentage
- Quick log buttons — preset cup sizes: 200, 230, 250, 330, 500, 600 ml
- Custom amount entry — log any amount not in the preset list
- Edit any log entry in case of a mistake
- Delete any log entry from today's history

**Goals**
- Set a different daily water goal any day directly from the home screen
- Choose from presets (1.5 L – 4 L) or enter any custom amount
- Default goal saved to your account and synced across devices

**Notifications**
- Fully customizable push reminders — choose your own interval and time window
- Reminder frequency: 15 min / 30 min / 45 min / 1 hour / 1.5 hrs / 2 hours
- Start time: any hour from 12:00 AM to 11:00 PM
- End time: any hour up to 11:59 PM
- Reminders stop automatically once you reach your daily goal

**Stats & Dashboard**
- View your total intake by day, week, month, and year
- Bar chart with week / month / year views
- Green bars on days you hit your goal, blue on days you didn't

**Auth & Account**
- Email / password sign-in and registration
- Google OAuth sign-in
- Data securely stored per user with Row Level Security

**App**
- PWA — installable on iPhone and iPad, works like a native app
- Fully responsive — optimized for iPhone and iPad screens
- Deep ocean dark theme with animated water visuals

---

## 📱 Install on iPhone / iPad

1. Open **Safari** and go to: `https://waleedju88.github.io/hydrotrack/`
2. Tap the **Share** button (box with arrow at the bottom of Safari)
3. Tap **Add to Home Screen**
4. Tap **Add**
5. Open the app from your home screen icon

> Always open HydroTrack from the **home screen icon**, not from a Safari browser tab. Notifications only work in PWA mode.

---

## 🔔 Enable Notifications on iPhone

### Step 1 — Allow in iPhone Settings
1. Open the iPhone **Settings app**
2. Scroll down and tap **Apps**
3. Find and tap **HydroTrack**
4. Tap **Notifications**
5. Toggle **Allow Notifications** ON
6. Enable **Alerts**, **Sounds**, and **Badges**

### Step 2 — Enable inside the app
1. Open HydroTrack from your home screen
2. Go to the **Settings tab** (bottom right)
3. Tap **Enable** next to Reminders
4. Tap **Allow** when the permission prompt appears
5. The toggle will turn on and a confirmation notification will appear

### Customize your reminders
In the Settings tab → Notifications section you can configure:

| Setting | Options |
|---------|---------|
| Reminder frequency | 15 min, 30 min, 45 min, 1 hr, 1.5 hrs, 2 hrs |
| Start time | 12:00 AM → 11:00 PM |
| End time | 1:00 AM → 11:59 PM |

Your schedule summary is shown live, e.g. *"Every 30 min · 8:00 AM – 10:00 PM"*

---

## 🗄️ Database Setup (Supabase)

Run this SQL in your Supabase project's **SQL Editor**:

```sql
-- Profiles table (stores daily goal)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  daily_goal_ml integer not null default 2000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Water logs table
create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml integer not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- Index for fast queries
create index if not exists water_logs_user_date
  on water_logs (user_id, logged_at);

-- Row Level Security
alter table profiles enable row level security;
alter table water_logs enable row level security;

create policy "Users can read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can read own logs"   on water_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on water_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own logs" on water_logs for update using (auth.uid() = user_id);
create policy "Users can delete own logs" on water_logs for delete using (auth.uid() = user_id);
```

---

## 🔐 Authentication Setup

### Email Auth
Enabled by default in Supabase. No extra configuration needed.

### Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add to **Authorized redirect URIs**:
   ```
   https://otvvfifeifuirewagxia.supabase.co/auth/v1/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://waleedju88.github.io
   ```
5. In Supabase → **Authentication → Providers → Google** → paste your Client ID and Secret

### Supabase URL Configuration
In Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://waleedju88.github.io/hydrotrack/`
- **Redirect URLs:** `https://waleedju88.github.io/hydrotrack/`

---

## 🚀 Deployment

This project deploys automatically to **GitHub Pages** via GitHub Actions on every push to `main`.

**Live URL:** `https://waleedju88.github.io/hydrotrack/`

### How it works
1. Edit any file and commit to `main`
2. GitHub Actions runs `.github/workflows/deploy.yml`
3. Vite builds the project into `dist/`
4. GitHub Pages serves the `dist/` folder
5. Live in ~90 seconds ✅

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Pure CSS-in-JS (no libraries) |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Email + Google OAuth |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| PWA | Web App Manifest + Service Worker |
| Notifications | Web Notifications API |

---

## 📁 Project Structure

```
hydrotrack/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Auto-deploy to GitHub Pages
├── public/
│   ├── icons/
│   │   ├── icon-192.png      # PWA icon (home screen)
│   │   └── icon-512.png      # PWA icon (splash screen)
│   ├── drop.svg              # Favicon
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker (offline + notifications)
├── src/
│   ├── App.jsx               # Entire application
│   └── main.jsx              # React entry point
├── .gitignore
├── index.html                # HTML entry with PWA meta tags
├── package.json
└── vite.config.js
```

---

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/waleedju88/hydrotrack.git
cd hydrotrack

# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open `http://localhost:5173/hydrotrack/` in your browser.

---

## 📊 Stats Dashboard

The Stats tab shows your water intake across four time ranges:

| Range | What it shows |
|-------|--------------|
| Today | Total logged today in liters |
| Week | Last 7 days — one bar per day |
| Month | Last 4 weeks — one bar per week |
| Year | All 12 months — one bar per month |

Bars turn **green** on days/periods you hit your goal, **blue** on days you didn't.

---

## 📝 License

Personal project by [@waleedju88](https://github.com/waleedju88). Feel free to fork and adapt for your own use.
