import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://otvvfifeifuirewagxia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dnZmaWZlaWZ1aXJld2FneGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzE4MTksImV4cCI6MjA5MDIwNzgxOX0.5e8ALgMws7exCYrckxctFtgZh5cq7hjNJa8HZmEQDNw";

// ── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: "HydroTrack",
    appSub: "Your daily hydration companion",
    signIn: "Sign in",
    createAccount: "Create account",
    emailPlaceholder: "Email address",
    passwordPlaceholder: "Password",
    pleaseWait: "Please wait...",
    orContinueWith: "or continue with",
    continueGoogle: "Continue with Google",
    agreeText: "By signing in you agree to drink more water 💧",
    checkEmail: "Check your email to confirm!",
    fillFields: "Please fill in all fields.",
    setGoal: "Set your goal",
    setGoalSub: "How much water do you aim to drink daily?",
    lPerDay: "L / day",
    startTracking: "Start tracking →",
    saving: "Saving...",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    stayHydrated: "Stay Hydrated",
    signOut: "Sign out",
    of: "of",
    remaining: "L remaining today",
    goalReached: "Daily goal reached! 🎉",
    editGoal: "Edit goal",
    selectAmount: "Select amount",
    enterCustom: "Enter custom amount",
    tapToLog: "Tap to log",
    ml: "ml",
    todayIntake: "Today's intake",
    logWater: "Log",
    logging: "...",
    customAmount: "Custom amount",
    customAmountSub: "Type any amount between 1 – 5000 ml",
    log: "Log",
    confirm: "Confirm",
    cancel: "Cancel",
    setTodayGoal: "Set today's goal",
    setTodayGoalSub: "Choose a preset or enter a custom amount",
    setAsGoal: "Set",
    asGoal: "as today's goal",
    customAmountMl: "Custom amount (ml)",
    editEntry: "Edit entry",
    editEntrySub: "enter the correct amount",
    save: "Save",
    overview: "Overview",
    yourStats: "Your stats",
    today: "Today",
    thisWeek: "This week",
    thisMonth: "This month",
    thisYear: "This year",
    week: "Week",
    month: "Month",
    year: "Year",
    goalPerDay: "Goal",
    preferences: "Preferences",
    settings: "Settings",
    notifications: "Notifications",
    reminders: "Reminders",
    active: "Active",
    paused: "Paused",
    blockedNotif: "Blocked — check Safari settings",
    tapEnable: "Tap Enable to turn on",
    enable: "Enable",
    remindEvery: "Remind every",
    remindEveryDesc: "How often to send a reminder",
    startAt: "Start reminders at",
    startAtDesc: "First reminder of the day",
    stopAt: "Stop reminders at",
    stopAtDesc: "Last reminder of the day",
    defaultGoal: "🎯 Default daily goal",
    currentGoal: "Current:",
    defaultGoalNote: "This is your default goal. You can also change it per-day using the",
    defaultGoalNote2: "button on the home screen.",
    goalSaved: "Goal saved!",
    addToHome: "Add to Home Screen",
    addToHomeSub: 'In Safari tap Share → Add to Home Screen for the best experience and full notification support on iPhone.',
    notifEnabled: "Enabled",
    notifSummary: "Every",
    loading: "Loading...",
    ofDailyGoal: "of daily goal",
    min15: "15 min",
    min30: "30 min",
    min45: "45 min",
    hr1: "1 hour",
    hr15: "1.5 hrs",
    hr2: "2 hours",
    notifTitle: "Time to drink water! 💧",
    notifBody: "Stay on track with your daily hydration goal.",
    notifEnabled2: "HydroTrack 💧",
    notifEnabled3: "Reminders are now enabled!",
    language: "Language",
  },
  ar: {
    appName: "هيدروتراك",
    appSub: "رفيقك اليومي للترطيب",
    signIn: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    emailPlaceholder: "البريد الإلكتروني",
    passwordPlaceholder: "كلمة المرور",
    pleaseWait: "جارٍ التحميل...",
    orContinueWith: "أو تابع بـ",
    continueGoogle: "المتابعة بجوجل",
    agreeText: "بتسجيل دخولك توافق على شرب المزيد من الماء 💧",
    checkEmail: "تحقق من بريدك الإلكتروني للتأكيد!",
    fillFields: "يرجى ملء جميع الحقول.",
    setGoal: "حدد هدفك",
    setGoalSub: "كم لتراً تهدف لشربه يومياً؟",
    lPerDay: "لتر / يوم",
    startTracking: "ابدأ التتبع ←",
    saving: "جارٍ الحفظ...",
    goodMorning: "صباح الخير",
    goodAfternoon: "مساء الخير",
    goodEvening: "مساء النور",
    stayHydrated: "ابقَ مرطّباً",
    signOut: "تسجيل الخروج",
    of: "من",
    remaining: "لتر متبقٍ اليوم",
    goalReached: "تم تحقيق الهدف اليومي! 🎉",
    editGoal: "تعديل الهدف",
    selectAmount: "اختر الكمية",
    enterCustom: "إدخال كمية مخصصة",
    tapToLog: "اضغط لتسجيل",
    ml: "مل",
    todayIntake: "كميات اليوم",
    logWater: "تسجيل",
    logging: "...",
    customAmount: "كمية مخصصة",
    customAmountSub: "اكتب أي كمية بين 1 – 5000 مل",
    log: "تسجيل",
    confirm: "تأكيد",
    cancel: "إلغاء",
    setTodayGoal: "تحديد هدف اليوم",
    setTodayGoalSub: "اختر من القائمة أو أدخل كمية مخصصة",
    setAsGoal: "تعيين",
    asGoal: "كهدف اليوم",
    customAmountMl: "كمية مخصصة (مل)",
    editEntry: "تعديل السجل",
    editEntrySub: "أدخل الكمية الصحيحة",
    save: "حفظ",
    overview: "نظرة عامة",
    yourStats: "إحصائياتك",
    today: "اليوم",
    thisWeek: "هذا الأسبوع",
    thisMonth: "هذا الشهر",
    thisYear: "هذا العام",
    week: "أسبوع",
    month: "شهر",
    year: "سنة",
    goalPerDay: "الهدف",
    preferences: "التفضيلات",
    settings: "الإعدادات",
    notifications: "الإشعارات",
    reminders: "التذكيرات",
    active: "مفعّلة",
    paused: "متوقفة",
    blockedNotif: "محظورة — تحقق من إعدادات Safari",
    tapEnable: "اضغط تفعيل لتشغيلها",
    enable: "تفعيل",
    remindEvery: "تذكير كل",
    remindEveryDesc: "عدد مرات إرسال التذكير",
    startAt: "بدء التذكيرات من",
    startAtDesc: "أول تذكير في اليوم",
    stopAt: "إيقاف التذكيرات عند",
    stopAtDesc: "آخر تذكير في اليوم",
    defaultGoal: "🎯 الهدف اليومي الافتراضي",
    currentGoal: "الحالي:",
    defaultGoalNote: "هذا هو هدفك الافتراضي. يمكنك تغييره يومياً من خلال زر",
    defaultGoalNote2: "في الصفحة الرئيسية.",
    goalSaved: "تم حفظ الهدف!",
    addToHome: "إضافة للشاشة الرئيسية",
    addToHomeSub: "في Safari اضغط مشاركة ← أضف إلى الشاشة الرئيسية للحصول على أفضل تجربة ودعم كامل للإشعارات على iPhone.",
    notifEnabled: "مفعّل",
    notifSummary: "كل",
    loading: "جارٍ التحميل...",
    ofDailyGoal: "من الهدف اليومي",
    min15: "١٥ دقيقة",
    min30: "٣٠ دقيقة",
    min45: "٤٥ دقيقة",
    hr1: "ساعة",
    hr15: "ساعة ونصف",
    hr2: "ساعتان",
    notifTitle: "حان وقت شرب الماء! 💧",
    notifBody: "حافظ على مسارك نحو هدف الترطيب اليومي.",
    notifEnabled2: "هيدروتراك 💧",
    notifEnabled3: "تم تفعيل التذكيرات!",
    language: "اللغة",
  },
};

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const sb = {
  h: (t) => ({ "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, ...(t ? { Authorization: `Bearer ${t}` } : {}) }),
  async signUp(e, p) { const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: this.h(), body: JSON.stringify({ email: e, password: p }) }); return r.json(); },
  async signIn(e, p) { const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: this.h(), body: JSON.stringify({ email: e, password: p }) }); return r.json(); },
  async signInGoogle() { window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}/hydrotrack/`; },
  async getUser(t) { const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: this.h(t) }); return r.json(); },
  async signOut(t) { await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: this.h(t) }); },
  async logIntake(t, uid, ml) { const r = await fetch(`${SUPABASE_URL}/rest/v1/water_logs`, { method: "POST", headers: { ...this.h(t), Prefer: "return=representation" }, body: JSON.stringify({ user_id: uid, amount_ml: ml, logged_at: new Date().toISOString() }) }); return r.json(); },
  async updateLog(t, id, ml) { await fetch(`${SUPABASE_URL}/rest/v1/water_logs?id=eq.${id}`, { method: "PATCH", headers: { ...this.h(t), Prefer: "return=representation" }, body: JSON.stringify({ amount_ml: ml }) }); },
  async deleteLog(t, id) { await fetch(`${SUPABASE_URL}/rest/v1/water_logs?id=eq.${id}`, { method: "DELETE", headers: this.h(t) }); },
  async getLogs(t, uid, from, to) { const r = await fetch(`${SUPABASE_URL}/rest/v1/water_logs?user_id=eq.${uid}&logged_at=gte.${from}&logged_at=lte.${to}&order=logged_at.asc`, { headers: this.h(t) }); return r.json(); },
  async getProfile(t, uid) { const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, { headers: this.h(t) }); const rows = await r.json(); return rows[0]; },
  async upsertProfile(t, uid, data) { const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, { method: "POST", headers: { ...this.h(t), Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ id: uid, ...data }) }); return r.json(); },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
const toL = (ml) => (ml / 1000).toFixed(2);
const today = () => new Date().toISOString().split("T")[0];
const sum = (arr, key) => arr.reduce((a, b) => a + (b[key] || 0), 0);
const CUP_SIZES = [200, 230, 250, 330, 500, 600];
const GOAL_OPTIONS = [1500, 2000, 2500, 3000, 3500, 4000];

const getNotifIntervals = (t) => [
  { label: t.min15, value: 15 },
  { label: t.min30, value: 30 },
  { label: t.min45, value: 45 },
  { label: t.hr1,  value: 60 },
  { label: t.hr15, value: 90 },
  { label: t.hr2,  value: 120 },
];

const HOURS = [
  ...Array.from({ length: 24 }, (_, i) => {
    const ampm = i < 12 ? "AM" : "PM";
    const h = i === 0 ? 12 : i > 12 ? i - 12 : i;
    return { label: `${h}:00 ${ampm}`, value: i };
  }),
  { label: "11:59 PM", value: 23.99 },
];

const DEFAULT_SETTINGS = { notifInterval: 30, notifStart: 8, notifEnd: 21, notifEnabled: false };
const loadSettings = () => { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("hydro_settings") || "{}") }; } catch { return DEFAULT_SETTINGS; } };
const saveSettings = (s) => localStorage.setItem("hydro_settings", JSON.stringify(s));
const loadLang = () => localStorage.getItem("hydro_lang") || "en";
const saveLang = (l) => localStorage.setItem("hydro_lang", l);

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
async function requestNotifPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
function pushNotif(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { new Notification(title, { body, icon: "/hydrotrack/drop.svg", tag: "hydrotrack", renotify: true }); }
  catch { navigator.serviceWorker?.ready.then(r => r.showNotification(title, { body, icon: "/hydrotrack/drop.svg", tag: "hydrotrack", renotify: true })).catch(() => {}); }
}

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const G = ({ rtl }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=DM+Serif+Display&family=Tajawal:wght@300;400;500;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#060d1a;--card:rgba(255,255,255,0.04);--card-b:rgba(255,255,255,0.08);
      --blue:#4fa3e8;--blue-d:#1a6bb5;--cyan:#5ecfda;
      --text:#f0f4ff;--t2:rgba(240,244,255,0.55);--t3:rgba(240,244,255,0.3);
      --success:#4ecb8d;--danger:#ff6b6b;
      --fn:${rtl ? "'Tajawal'" : "'Outfit'"}, sans-serif;
      --fd:${rtl ? "'Tajawal'" : "'DM Serif Display'"}, serif;
      --nav:72px;--safe:env(safe-area-inset-bottom,0px);
    }
    html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:var(--fn);direction:${rtl ? "rtl" : "ltr"}}
    input,select{font-family:var(--fn);font-size:15px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;color:var(--text);padding:14px 16px;width:100%;outline:none;transition:border-color .2s;-webkit-appearance:none;appearance:none;direction:${rtl ? "rtl" : "ltr"}}
    input::placeholder{color:var(--t3)}
    input:focus,select:focus{border-color:var(--blue)}
    input[type=number]::-webkit-inner-spin-button{opacity:1}
    button{font-family:var(--fn);cursor:pointer}
    ::-webkit-scrollbar{width:0}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes ripple{0%{transform:scale(.8);opacity:1}100%{transform:scale(2.4);opacity:0}}
    @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
    .fu{animation:fadeUp .45s ease both}
    .fu1{animation:fadeUp .45s .06s ease both}
    .fu2{animation:fadeUp .45s .12s ease both}
    .fu3{animation:fadeUp .45s .18s ease both}
    .fu4{animation:fadeUp .45s .24s ease both}
    .fu5{animation:fadeUp .45s .30s ease both}
    .glass{background:var(--card);border:1px solid var(--card-b);border-radius:20px;backdrop-filter:blur(12px)}
    .btn-p{background:linear-gradient(135deg,#4fa3e8,#1a6bb5);color:#fff;border:none;border-radius:16px;font-size:16px;font-weight:500;padding:16px;width:100%;transition:opacity .2s,transform .1s;font-family:var(--fn)}
    .btn-p:active{transform:scale(.98);opacity:.9}
    .btn-p:disabled{opacity:.5;cursor:not-allowed}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);z-index:300;display:flex;align-items:flex-end;justify-content:center}
    .sheet{background:#0c1829;border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:24px 20px calc(28px + var(--safe));width:100%;max-width:520px;animation:slideUp .3s cubic-bezier(.4,0,.2,1);direction:${rtl ? "rtl" : "ltr"}}
    .handle{width:36px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 22px}
    .row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05)}
    .row:last-child{border-bottom:none}
    .sel-wrap{position:relative}
    .sel-wrap::after{content:"▾";position:absolute;${rtl ? "left:14px;right:auto" : "right:14px"};top:50%;transform:translateY(-50%);color:var(--t3);font-size:12px;pointer-events:none}
  `}</style>
);

// ── SHARED UI ─────────────────────────────────────────────────────────────────
function Drop({ size = 24, color = "#4fa3e8" }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2Z" fill={color} /></svg>;
}

function WaterBlob({ pct, t }) {
  const f = Math.min(100, Math.max(0, pct));
  const r = 90, c = 2 * Math.PI * r;
  const col = f >= 100 ? "#4ecb8d" : "#4fa3e8";
  return (
    <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto" }}>
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(79,163,232,0.07)" strokeWidth="12" />
        <circle cx="100" cy="100" r="90" fill="none" stroke={col} strokeWidth="6"
          strokeDasharray={`${(f / 100) * c} ${c}`} strokeDashoffset={c * 0.25} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1),stroke .5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 14, borderRadius: "50%", overflow: "hidden", background: "#060d1a" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${f}%`, background: "linear-gradient(to top,rgba(26,107,181,.9),rgba(79,163,232,.6))", transition: "height .8s cubic-bezier(.4,0,.2,1)" }}>
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ position: "absolute", top: -20, left: 0, width: "200%", height: 40, animation: "wave 3s linear infinite" }}>
            <path d="M0,20 Q50,5 100,20 Q150,35 200,20 Q250,5 300,20 Q350,35 400,20 L400,40 L0,40Z" fill="rgba(79,163,232,.8)" />
          </svg>
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ position: "absolute", top: -14, left: 0, width: "200%", height: 40, animation: "wave 4.5s linear infinite reverse", opacity: .5 }}>
            <path d="M0,20 Q50,5 100,20 Q150,35 200,20 Q250,5 300,20 Q350,35 400,20 L400,40 L0,40Z" fill="rgba(94,207,218,.7)" />
          </svg>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <div style={{ fontSize: 44, fontWeight: 600, color: "#fff", lineHeight: 1 }}>{Math.round(f)}<span style={{ fontSize: 20, fontWeight: 400 }}>%</span></div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", marginTop: 4, letterSpacing: ".04em" }}>{t.ofDailyGoal}</div>
        </div>
      </div>
    </div>
  );
}

// ── LANGUAGE TOGGLE ───────────────────────────────────────────────────────────
function LangToggle({ lang, onToggle }) {
  return (
    <button onClick={onToggle} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "6px 12px", color: "var(--text)", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 15 }}>🌐</span>
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}

function Nav({ tab, setTab, t }) {
  const btn = (id, label, icon) => (
    <button onClick={() => setTab(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", color: tab === id ? "var(--blue)" : "var(--t3)", fontSize: 11, fontWeight: 500, padding: "10px 0" }}>
      {icon(tab === id)}{label}
    </button>
  );
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "calc(var(--nav) + var(--safe))", paddingBottom: "var(--safe)", background: "rgba(6,13,26,.95)", borderTop: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", zIndex: 100 }}>
      {btn("home", t.signIn === "Sign in" ? "Home" : "الرئيسية", a => <svg viewBox="0 0 24 24" width="22" height="22" fill={a ? "rgba(79,163,232,.2)" : "none"} stroke={a ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /></svg>)}
      {btn("stats", t.yourStats === "Your stats" ? "Stats" : "إحصاء", a => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={a ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8"><rect x="3" y="12" width="4" height="9" rx="1" fill={a ? "rgba(79,163,232,.25)" : "none"} /><rect x="10" y="7" width="4" height="14" rx="1" fill={a ? "rgba(79,163,232,.25)" : "none"} /><rect x="17" y="3" width="4" height="18" rx="1" fill={a ? "rgba(79,163,232,.25)" : "none"} /></svg>)}
      {btn("settings", t.settings, a => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={a ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>)}
    </nav>
  );
}

function LogBtn({ onLog, loading, t }) {
  const [ripples, setRipples] = useState([]);
  const fire = () => {
    if (loading) return;
    const id = Date.now();
    setRipples(r => [...r, id]);
    setTimeout(() => setRipples(r => r.filter(x => x !== id)), 700);
    onLog();
  };
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "20px 0 10px" }}>
      <button onClick={fire} disabled={loading} style={{ position: "relative", overflow: "hidden", width: 84, height: 84, borderRadius: "50%", background: "linear-gradient(135deg,#4fa3e8,#1a6bb5)", border: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, boxShadow: "0 0 32px rgba(79,163,232,.4)", opacity: loading ? .6 : 1 }}>
        {ripples.map(id => <span key={id} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,.6)", animation: "ripple .7s ease-out forwards" }} />)}
        <Drop size={30} color="#fff" />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 500 }}>{loading ? t.logging : t.logWater}</span>
      </button>
    </div>
  );
}

// ── AMOUNT SHEET ──────────────────────────────────────────────────────────────
function AmountSheet({ title, subtitle, initial = "", confirmLabel, onConfirm, onClose }) {
  const [val, setVal] = useState(String(initial || ""));
  const submit = () => {
    const n = parseInt(val);
    if (!n || n < 1 || n > 5000) return;
    onConfirm(n); onClose();
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="handle" />
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 20 }}>{subtitle}</div>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input type="number" placeholder="e.g. 400" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} autoFocus min="1" max="5000" style={{ paddingRight: 52 }} />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--t3)" }}>ml</span>
        </div>
        <button className="btn-p" onClick={submit} disabled={!val || parseInt(val) < 1}>{confirmLabel} {val && parseInt(val) > 0 ? `· ${val} ml` : ""}</button>
        <button onClick={onClose} style={{ width: "100%", padding: "14px", marginTop: 10, background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, color: "var(--t2)", fontSize: 15 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── GOAL SHEET ────────────────────────────────────────────────────────────────
function GoalSheet({ current, onSave, onClose, t }) {
  const [goal, setGoal] = useState(current);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState("preset");
  const confirm = () => {
    if (mode === "custom") { const n = parseInt(custom); if (!n || n < 500 || n > 10000) return; onSave(n); onClose(); }
    else { onSave(goal); onClose(); }
  };
  const active = mode === "custom" ? parseInt(custom) || 0 : goal;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="handle" />
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 5 }}>{t.setTodayGoal}</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 20 }}>{t.setTodayGoalSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {GOAL_OPTIONS.map(g => (
            <button key={g} onClick={() => { setGoal(g); setMode("preset"); }}
              style={{ padding: "13px 4px", borderRadius: 14, border: mode === "preset" && goal === g ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: mode === "preset" && goal === g ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: mode === "preset" && goal === g ? "var(--blue)" : "var(--t2)", fontWeight: mode === "preset" && goal === g ? 600 : 400, fontSize: 14, fontFamily: "var(--fn)", transition: "all .2s" }}>
              {toL(g)} L
            </button>
          ))}
        </div>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input type="number" placeholder={t.customAmountMl} value={custom} onChange={e => { setCustom(e.target.value); setMode("custom"); }} min="500" max="10000" style={{ paddingRight: 52 }} />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--t3)" }}>ml</span>
        </div>
        <button className="btn-p" onClick={confirm} disabled={active < 500}>{t.setAsGoal} {active >= 500 ? `${toL(active)} L` : ""} {t.asGoal}</button>
        <button onClick={onClose} style={{ width: "100%", padding: "14px", marginTop: 10, background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, color: "var(--t2)", fontSize: 15 }}>{t.cancel}</button>
      </div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────────────────────────────────
function HomeTab({ token, userId, goal, onGoalChange, logs, onLogged, onSignOut, t, lang, onLangToggle }) {
  const [cup, setCup] = useState(250);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const todayTotal = sum(logs, "amount_ml");
  const pct = Math.min(100, (todayTotal / goal) * 100);
  const remaining = Math.max(0, goal - todayTotal);
  const h = new Date().getHours();
  const greeting = h < 12 ? t.goodMorning : h < 17 ? t.goodAfternoon : t.goodEvening;
  const msgs = lang === "ar"
    ? ["رشفة رائعة! 💧", "ابقَ منتعشاً! 🌊", "جسمك يشكرك! ✨", "واصل! 🚀", "انتصار للترطيب! 💎"]
    : ["Great sip! 💧", "Stay fresh! 🌊", "Body thanks you! ✨", "Keep it up! 🚀", "Hydration win! 💎"];

  const logWater = async (ml) => {
    setLoading(true);
    await sb.logIntake(token, userId, ml);
    await onLogged();
    setToast(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setToast(""), 2500);
    setLoading(false);
  };
  const editLog = async (id, ml) => { await sb.updateLog(token, id, ml); await onLogged(); };
  const deleteEntry = async (id) => { await sb.deleteLog(token, id); await onLogged(); };

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      {showManual && <AmountSheet title={t.customAmount} subtitle={t.customAmountSub} confirmLabel={t.log} onConfirm={logWater} onClose={() => setShowManual(false)} />}
      {showGoal && <GoalSheet current={goal} onSave={async (g) => { await sb.upsertProfile(token, userId, { daily_goal_ml: g }); onGoalChange(g); }} onClose={() => setShowGoal(false)} t={t} />}
      {editEntry && <AmountSheet title={t.editEntry} subtitle={`${editEntry.amount_ml} ml — ${t.editEntrySub}`} initial={editEntry.amount_ml} confirmLabel={t.save} onConfirm={(ml) => editLog(editEntry.id, ml)} onClose={() => setEditEntry(null)} />}

      <div className="fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 52, paddingBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".06em", textTransform: "uppercase" }}>{greeting}</div>
          <div style={{ fontSize: 28, fontFamily: "var(--fd)", lineHeight: 1.15, marginTop: 2 }}>{t.stayHydrated}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <button onClick={onSignOut} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "8px 14px", color: "var(--t2)", fontSize: 13 }}>{t.signOut}</button>
          <LangToggle lang={lang} onToggle={onLangToggle} />
        </div>
      </div>

      <div style={{ marginTop: 28, marginBottom: 6 }}><WaterBlob pct={pct} t={t} /></div>

      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 600 }}>{toL(todayTotal)}</span>
        <span style={{ fontSize: 15, color: "var(--t2)", margin: "0 6px" }}>{t.of}</span>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{toL(goal)} L</span>
        <button onClick={() => setShowGoal(true)} style={{ marginInlineStart: 8, background: "rgba(79,163,232,.12)", border: "1px solid rgba(79,163,232,.25)", borderRadius: 8, padding: "3px 9px", color: "var(--blue)", fontSize: 11, fontWeight: 500, verticalAlign: "middle" }}>
          {t.editGoal}
        </button>
      </div>
      <div style={{ textAlign: "center", fontSize: 13, color: remaining > 0 ? "var(--t3)" : "var(--success)", marginBottom: 2 }}>
        {remaining > 0 ? `${toL(remaining)} ${t.remaining}` : t.goalReached}
      </div>
      {toast && <div style={{ textAlign: "center", fontSize: 14, color: "var(--cyan)", marginTop: 6, animation: "fadeUp .3s ease" }}>{toast}</div>}

      <div className="fu3" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>{t.selectAmount}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {CUP_SIZES.map(s => (
            <button key={s} onClick={() => setCup(s)} style={{ padding: "14px 4px", borderRadius: 16, border: cup === s ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: cup === s ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: cup === s ? "var(--blue)" : "var(--t2)", fontWeight: cup === s ? 600 : 400, fontSize: 15, fontFamily: "var(--fn)", transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <Drop size={15} color={cup === s ? "#4fa3e8" : "rgba(240,244,255,.25)"} />
              {s} {t.ml}
            </button>
          ))}
        </div>
        <button onClick={() => setShowManual(true)} style={{ width: "100%", marginTop: 10, padding: "13px", borderRadius: 16, border: "1px dashed rgba(79,163,232,.35)", background: "rgba(79,163,232,.06)", color: "var(--blue)", fontSize: 14, fontFamily: "var(--fn)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t.enterCustom}
        </button>
      </div>

      <div className="fu4">
        <LogBtn onLog={() => logWater(cup)} loading={loading} t={t} />
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--t3)" }}>{t.tapToLog} {cup} {t.ml}</div>
      </div>

      {logs.length > 0 && (
        <div className="fu5 glass" style={{ marginTop: 28, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>{t.todayIntake}</div>
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {[...logs].reverse().map((l, i, arr) => (
              <div key={l.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(79,163,232,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Drop size={14} color="#4fa3e8" />
                  </div>
                  <span style={{ fontSize: 14, color: "var(--t2)" }}>{new Date(l.logged_at).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--blue)" }}>{l.amount_ml} {t.ml}</span>
                  <button onClick={() => setEditEntry(l)} style={{ background: "rgba(79,163,232,.1)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button onClick={() => deleteEntry(l.id)} style={{ background: "rgba(255,90,90,.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STATS TAB ─────────────────────────────────────────────────────────────────
function StatsTab({ allLogs, goal, t }) {
  const [view, setView] = useState("week");
  const now = new Date();
  const todayStr = today();
  const weekData = () => {
    const days = t.week === "Week"
      ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      : ["أحد","إثن","ثلا","أرب","خمس","جمع","سبت"];
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const ds = d.toISOString().split("T")[0]; return { label: days[d.getDay()], value: sum(allLogs.filter(l => l.logged_at?.startsWith(ds)), "amount_ml") }; });
  };
  const monthData = () => Array.from({ length: 4 }, (_, i) => { const s = new Date(); s.setDate(s.getDate() - (27 - i * 7)); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(e.getDate() + 6); return { label: `${t.week === "Week" ? "W" : "أ"}${i+1}`, value: sum(allLogs.filter(l => { const d = new Date(l.logged_at); return d >= s && d <= e; }), "amount_ml") }; });
  const yearData = () => {
    const mo = t.week === "Week"
      ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      : ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    return Array.from({ length: 12 }, (_, i) => ({ label: mo[i], value: sum(allLogs.filter(l => new Date(l.logged_at).getMonth() === i), "amount_ml") }));
  };
  const data = view === "week" ? weekData() : view === "month" ? monthData() : yearData();
  const maxV = Math.max(...data.map(d => d.value), 1);
  const todayTotal = sum(allLogs.filter(l => l.logged_at?.startsWith(todayStr)), "amount_ml");
  const weekTotal = sum(weekData(), "value");
  const monthTotal = sum(allLogs.filter(l => { const d = new Date(l.logged_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }), "amount_ml");
  const yearTotal = sum(allLogs.filter(l => new Date(l.logged_at).getFullYear() === now.getFullYear()), "amount_ml");

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div className="fu" style={{ paddingTop: 52, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".06em", textTransform: "uppercase" }}>{t.overview}</div>
        <div style={{ fontSize: 28, fontFamily: "var(--fd)", marginTop: 2 }}>{t.yourStats}</div>
      </div>
      <div className="fu1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
        {[{ label: t.today, v: toL(todayTotal), color: "#4fa3e8" }, { label: t.thisWeek, v: toL(weekTotal), color: "#5ecfda" }, { label: t.thisMonth, v: toL(monthTotal), color: "#4ecb8d" }, { label: t.thisYear, v: toL(yearTotal), color: "#f5a623" }].map((c, i) => (
          <div key={i} className="glass" style={{ padding: "18px 16px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, marginBottom: 10 }} />
            <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{c.v}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--t2)", marginInlineStart: 2 }}>L</span></div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 5 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div className="fu2 glass" style={{ marginTop: 18, padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {[["week", t.week], ["month", t.month], ["year", t.year]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: view === v ? "1px solid rgba(79,163,232,.3)" : "1px solid transparent", background: view === v ? "rgba(79,163,232,.18)" : "rgba(255,255,255,.04)", color: view === v ? "var(--blue)" : "var(--t3)", fontSize: 13, fontWeight: 500, fontFamily: "var(--fn)" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 8 }}>{t.goalPerDay}: {toL(goal)} L</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: "100%", height: Math.max(3, (d.value / maxV) * 112), background: d.value >= goal ? "linear-gradient(to top,#4ecb8d,rgba(78,203,141,.4))" : "linear-gradient(to top,#4fa3e8,rgba(79,163,232,.3))", borderRadius: "6px 6px 0 0", transition: "height .5s cubic-bezier(.4,0,.2,1)" }} />
              <span style={{ fontSize: 9, color: "var(--t3)", whiteSpace: "nowrap", textAlign: "center" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS TAB ──────────────────────────────────────────────────────────────
function SettingsTab({ token, userId, goal, onGoalChange, onSignOut, t, lang, onLangToggle }) {
  const [settings, setSettings] = useState(loadSettings);
  const [savedGoal, setSavedGoal] = useState(false);
  const [notifStatus, setNotifStatus] = useState(() => (typeof Notification !== "undefined" ? Notification.permission : "default"));
  const intervalRef = useRef(null);
  const NOTIF_INTERVALS = getNotifIntervals(t);

  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!settings.notifEnabled) return;
    intervalRef.current = setInterval(() => {
      const h = new Date().getHours();
      if (h >= settings.notifStart && h <= settings.notifEnd) pushNotif(t.notifTitle, t.notifBody);
    }, settings.notifInterval * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [settings.notifEnabled, settings.notifInterval, settings.notifStart, settings.notifEnd, t]);

  const enableNotif = async () => {
    const ok = await requestNotifPermission();
    setNotifStatus(ok ? "granted" : "denied");
    if (ok) { updateSettings({ notifEnabled: true }); pushNotif(t.notifEnabled2, t.notifEnabled3); }
  };
  const updateSettings = (patch) => setSettings(s => ({ ...s, ...patch }));
  const changeGoal = async (g) => { await sb.upsertProfile(token, userId, { daily_goal_ml: g }); onGoalChange(g); setSavedGoal(true); setTimeout(() => setSavedGoal(false), 2000); };
  const labelFor = (arr, val) => arr.find(x => x.value === val)?.label || val;

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div className="fu" style={{ paddingTop: 52, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".06em", textTransform: "uppercase" }}>{t.preferences}</div>
        <div style={{ fontSize: 28, fontFamily: "var(--fd)", marginTop: 2 }}>{t.settings}</div>
      </div>

      {/* Language */}
      <div className="fu1 glass" style={{ marginTop: 24, padding: "16px 20px" }}>
        <div className="row" style={{ borderBottom: "none" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>🌐 {t.language}</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{lang === "en" ? "English" : "العربية"}</div>
          </div>
          <LangToggle lang={lang} onToggle={onLangToggle} />
        </div>
      </div>

      {/* Notifications */}
      <div className="fu1 glass" style={{ marginTop: 14, padding: "20px" }}>
        <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>🔔 {t.notifications}</div>
        <div className="row">
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{t.reminders}</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>
              {notifStatus === "granted" ? (settings.notifEnabled ? t.active : t.paused) : notifStatus === "denied" ? t.blockedNotif : t.tapEnable}
            </div>
          </div>
          {notifStatus === "granted" ? (
            <button onClick={() => updateSettings({ notifEnabled: !settings.notifEnabled })} style={{ flexShrink: 0, width: 50, height: 28, borderRadius: 14, border: "none", background: settings.notifEnabled ? "var(--blue)" : "rgba(255,255,255,.12)", position: "relative", transition: "background .3s", cursor: "pointer" }}>
              <span style={{ position: "absolute", top: 3, left: settings.notifEnabled ? 25 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .3s" }} />
            </button>
          ) : notifStatus !== "denied" ? (
            <button onClick={enableNotif} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 12, background: "rgba(79,163,232,.2)", border: "1px solid rgba(79,163,232,.3)", color: "var(--blue)", fontSize: 13, fontWeight: 500, fontFamily: "var(--fn)" }}>{t.enable}</button>
          ) : null}
        </div>
        <div className="row">
          <div>
            <div style={{ fontSize: 15 }}>{t.remindEvery}</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{t.remindEveryDesc}</div>
          </div>
          <div className="sel-wrap" style={{ width: 130 }}>
            <select value={settings.notifInterval} onChange={e => updateSettings({ notifInterval: parseInt(e.target.value) })} style={{ padding: "10px 36px 10px 14px", fontSize: 14, borderRadius: 12 }}>
              {NOTIF_INTERVALS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <div style={{ fontSize: 15 }}>{t.startAt}</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{t.startAtDesc}</div>
          </div>
          <div className="sel-wrap" style={{ width: 130 }}>
            <select value={settings.notifStart} onChange={e => updateSettings({ notifStart: parseInt(e.target.value) })} style={{ padding: "10px 36px 10px 14px", fontSize: 14, borderRadius: 12 }}>
              {HOURS.filter(h => h.value < settings.notifEnd).map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>
        <div className="row" style={{ borderBottom: "none" }}>
          <div>
            <div style={{ fontSize: 15 }}>{t.stopAt}</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{t.stopAtDesc}</div>
          </div>
          <div className="sel-wrap" style={{ width: 130 }}>
            <select value={settings.notifEnd} onChange={e => updateSettings({ notifEnd: parseFloat(e.target.value) })} style={{ padding: "10px 36px 10px 14px", fontSize: 14, borderRadius: 12 }}>
              {HOURS.filter(h => h.value > settings.notifStart).map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>
        {settings.notifEnabled && notifStatus === "granted" && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(79,163,232,.08)", borderRadius: 12, fontSize: 13, color: "var(--blue)" }}>
            {t.notifSummary} {labelFor(NOTIF_INTERVALS, settings.notifInterval)} · {labelFor(HOURS, settings.notifStart)} – {labelFor(HOURS, settings.notifEnd)}
          </div>
        )}
      </div>

      {/* Daily goal */}
      <div className="fu2 glass" style={{ marginTop: 14, padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".08em", textTransform: "uppercase" }}>{t.defaultGoal}</div>
          <div style={{ fontSize: 13, color: "var(--blue)", fontWeight: 500 }}>{t.currentGoal} {toL(goal)} L</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 14, lineHeight: 1.6 }}>
          {t.defaultGoalNote} <strong style={{ color: "var(--t2)" }}>{t.editGoal}</strong> {t.defaultGoalNote2}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GOAL_OPTIONS.map(g => (
            <button key={g} onClick={() => changeGoal(g)} style={{ padding: "15px", borderRadius: 16, border: goal === g ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: goal === g ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: goal === g ? "var(--blue)" : "var(--t2)", fontWeight: goal === g ? 600 : 400, fontSize: 16, fontFamily: "var(--fn)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{toL(g)} L</span>
              {goal === g && <span style={{ fontSize: 10, background: "rgba(79,163,232,.2)", color: "var(--blue)", padding: "3px 8px", borderRadius: 8 }}>{t.active}</span>}
            </button>
          ))}
        </div>
        {savedGoal && <div style={{ marginTop: 12, fontSize: 13, color: "var(--success)", textAlign: "center" }}>{t.goalSaved}</div>}
      </div>

      {/* Add to home */}
      <div className="fu3 glass" style={{ marginTop: 14, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>📲</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{t.addToHome}</div>
            <div style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.6 }}>{t.addToHomeSub}</div>
          </div>
        </div>
      </div>

      <div className="fu3" style={{ marginTop: 14 }}>
        <button onClick={onSignOut} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "1px solid rgba(255,90,90,.2)", background: "rgba(255,90,90,.06)", color: "var(--danger)", fontSize: 15, fontWeight: 500, fontFamily: "var(--fn)" }}>{t.signOut}</button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function MainApp({ token, userId, goal, onGoalChange, onSignOut }) {
  const [tab, setTab] = useState("home");
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [lang, setLang] = useState(loadLang);
  const t = T[lang];
  const rtl = lang === "ar";

  const fetchToday = useCallback(async () => {
    const data = await sb.getLogs(token, userId, `${today()}T00:00:00Z`, `${today()}T23:59:59Z`);
    if (Array.isArray(data)) setLogs(data);
  }, [token, userId]);
  const fetchAll = useCallback(async () => {
    const from = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const data = await sb.getLogs(token, userId, from, new Date().toISOString());
    if (Array.isArray(data)) setAllLogs(data);
  }, [token, userId]);

  useEffect(() => { fetchToday(); fetchAll(); }, [fetchToday, fetchAll]);

  const refresh = async () => { await fetchToday(); fetchAll(); };
  const toggleLang = () => { const nl = lang === "en" ? "ar" : "en"; saveLang(nl); setLang(nl); };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", overflowY: "auto" }} dir={rtl ? "rtl" : "ltr"}>
      <G rtl={rtl} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: "20%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,163,232,.09) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 60, right: "-10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(94,207,218,.06) 0%,transparent 70%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        {tab === "home" && <HomeTab token={token} userId={userId} goal={goal} onGoalChange={onGoalChange} logs={logs} onLogged={refresh} onSignOut={onSignOut} t={t} lang={lang} onLangToggle={toggleLang} />}
        {tab === "stats" && <StatsTab allLogs={allLogs} goal={goal} t={t} />}
        {tab === "settings" && <SettingsTab token={token} userId={userId} goal={goal} onGoalChange={onGoalChange} onSignOut={onSignOut} t={t} lang={lang} onLangToggle={toggleLang} />}
      </div>
      <Nav tab={tab} setTab={setTab} t={t} />
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [lang, setLang] = useState(loadLang);
  const t = T[lang];
  const rtl = lang === "ar";
  const toggleLang = () => { const nl = lang === "en" ? "ar" : "en"; saveLang(nl); setLang(nl); };

  const submit = async () => {
    if (!email || !password) { setMsg(t.fillFields); return; }
    setLoading(true); setMsg("");
    if (mode === "signup") { const d = await sb.signUp(email, password); setMsg(d.error ? d.error.message : t.checkEmail); setLoading(false); return; }
    const d = await sb.signIn(email, password);
    if (d.error) { setMsg(d.error.message); setLoading(false); return; }
    localStorage.setItem("hydro_token", d.access_token);
    localStorage.setItem("hydro_uid", d.user.id);
    onAuth(d.access_token, d.user.id);
    setLoading(false);
  };

  return (
    <div dir={rtl ? "rtl" : "ltr"} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)", fontFamily: t === T.ar ? "'Tajawal',sans-serif" : "'Outfit',sans-serif", position: "relative", overflow: "hidden" }}>
      <G rtl={rtl} />
      <div style={{ position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,163,232,.13) 0%,transparent 65%)", pointerEvents: "none" }} />

      {/* Language toggle top right */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <LangToggle lang={lang} onToggle={toggleLang} />
      </div>

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div className="fu" style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg,rgba(79,163,232,.2),rgba(26,107,181,.3))", border: "1px solid rgba(79,163,232,.3)", alignItems: "center", justifyContent: "center", marginBottom: 16, animation: "float 4s ease-in-out infinite" }}>
            <Drop size={36} color="#4fa3e8" />
          </div>
          <div style={{ fontSize: 34, fontFamily: rtl ? "'Tajawal',sans-serif" : "'DM Serif Display',serif", letterSpacing: rtl ? "0" : "-.5px" }}>{t.appName}</div>
          <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 6 }}>{t.appSub}</div>
        </div>

        <div className="fu1 glass" style={{ padding: "26px 22px 22px" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,.04)", borderRadius: 14, padding: 4, marginBottom: 22 }}>
            {["signin","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setMsg(""); }} style={{ flex: 1, padding: "10px", borderRadius: 11, background: mode === m ? "rgba(79,163,232,.2)" : "transparent", border: mode === m ? "1px solid rgba(79,163,232,.3)" : "1px solid transparent", color: mode === m ? "var(--blue)" : "var(--t3)", fontWeight: mode === m ? 600 : 400, fontSize: 14, fontFamily: "inherit", transition: "all .2s" }}>
                {m === "signin" ? t.signIn : t.createAccount}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
            <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <button className="btn-p" onClick={submit} disabled={loading}>{loading ? t.pleaseWait : mode === "signin" ? t.signIn : t.createAccount}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
            <span style={{ fontSize: 12, color: "var(--t3)" }}>{t.orContinueWith}</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
          </div>
          <button onClick={() => sb.signInGoogle()} style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text)", fontSize: 15, fontFamily: "inherit" }}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t.continueGoogle}
          </button>
          {msg && <div style={{ marginTop: 14, fontSize: 13, textAlign: "center", padding: "10px 14px", borderRadius: 12, background: msg.includes("Check") || msg.includes("تحقق") ? "rgba(78,203,141,.1)" : "rgba(255,90,90,.1)", color: msg.includes("Check") || msg.includes("تحقق") ? "var(--success)" : "var(--danger)" }}>{msg}</div>}
        </div>
        <div className="fu2" style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--t3)" }}>{t.agreeText}</div>
      </div>
    </div>
  );
}

// ── SETUP SCREEN ──────────────────────────────────────────────────────────────
function SetupScreen({ token, userId, onDone }) {
  const [goal, setGoal] = useState(2000);
  const [saving, setSaving] = useState(false);
  const lang = loadLang();
  const t = T[lang];
  const rtl = lang === "ar";
  const save = async () => { setSaving(true); await sb.upsertProfile(token, userId, { daily_goal_ml: goal }); onDone(goal); setSaving(false); };

  return (
    <div dir={rtl ? "rtl" : "ltr"} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)", fontFamily: rtl ? "'Tajawal',sans-serif" : "'Outfit',sans-serif", position: "relative", overflow: "hidden" }}>
      <G rtl={rtl} />
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,163,232,.1) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div className="fu" style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 34, fontFamily: rtl ? "'Tajawal',sans-serif" : "'DM Serif Display',serif" }}>{t.setGoal}</div>
          <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 8 }}>{t.setGoalSub}</div>
        </div>
        <div className="fu1" style={{ textAlign: "center", marginBottom: 26 }}>
          <span style={{ fontSize: 64, fontWeight: 600, color: "var(--blue)" }}>{toL(goal)}</span>
          <span style={{ fontSize: 24, fontWeight: 400, color: "var(--t2)" }}> {t.lPerDay}</span>
        </div>
        <div className="fu2 glass" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {GOAL_OPTIONS.map(g => (
              <button key={g} onClick={() => setGoal(g)} style={{ padding: "15px", borderRadius: 16, border: goal === g ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: goal === g ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: goal === g ? "var(--blue)" : "var(--t2)", fontWeight: goal === g ? 600 : 400, fontSize: 16, fontFamily: "inherit", transition: "all .2s" }}>
                {toL(g)} L
              </button>
            ))}
          </div>
        </div>
        <div className="fu3"><button className="btn-p" onClick={save} disabled={saving}>{saving ? t.saving : t.startTracking}</button></div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("hydro_token"));
  const [userId, setUserId] = useState(() => localStorage.getItem("hydro_uid"));
  const [goal, setGoal] = useState(null);
  const [checking, setChecking] = useState(true);
  const lang = loadLang();
  const t = T[lang];
  const rtl = lang === "ar";

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const t = params.get("access_token");
      if (t) sb.getUser(t).then(u => {
        if (u?.id) { localStorage.setItem("hydro_token", t); localStorage.setItem("hydro_uid", u.id); setToken(t); setUserId(u.id); window.history.replaceState({}, "", window.location.pathname); }
      });
    }
  }, []);

  useEffect(() => {
    if (!token || !userId) { setChecking(false); return; }
    sb.getProfile(token, userId).then(p => { if (p?.daily_goal_ml) setGoal(p.daily_goal_ml); setChecking(false); }).catch(() => setChecking(false));
  }, [token, userId]);

  const handleAuth = (t, uid) => { setToken(t); setUserId(uid); };
  const handleSignOut = async () => {
    if (token) await sb.signOut(token);
    localStorage.removeItem("hydro_token"); localStorage.removeItem("hydro_uid");
    setToken(null); setUserId(null); setGoal(null);
  };

  if (checking) return (
    <><G rtl={rtl} />
      <div dir={rtl ? "rtl" : "ltr"} style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: rtl ? "'Tajawal',sans-serif" : "'Outfit',sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ animation: "float 2s ease-in-out infinite" }}><Drop size={38} color="#4fa3e8" /></div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>{t.loading}</div>
        </div>
      </div>
    </>
  );

  if (!token || !userId) return <AuthScreen onAuth={handleAuth} />;
  if (!goal) return <SetupScreen token={token} userId={userId} onDone={g => setGoal(g)} />;
  return <MainApp token={token} userId={userId} goal={goal} onGoalChange={setGoal} onSignOut={handleSignOut} />;
}
