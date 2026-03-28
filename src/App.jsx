import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://otvvfifeifuirewagxia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dnZmaWZlaWZ1aXJld2FneGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzE4MTksImV4cCI6MjA5MDIwNzgxOX0.5e8ALgMws7exCYrckxctFtgZh5cq7hjNJa8HZmEQDNw";

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
const pad = (n) => String(n).padStart(2, "0");
const CUP_SIZES = [200, 230, 250, 330, 500, 600];
const GOAL_OPTIONS = [1500, 2000, 2500, 3000, 3500, 4000];
const NOTIF_INTERVALS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hrs", value: 90 },
  { label: "2 hours", value: 120 },
];
const HOURS = [
  ...Array.from({ length: 24 }, (_, i) => {
    const ampm = i < 12 ? "AM" : "PM";
    const h = i === 0 ? 12 : i > 12 ? i - 12 : i;
    return { label: `${h}:00 ${ampm}`, value: i };
  }),
  { label: "11:59 PM", value: 23.99 },
];

// Default settings stored in localStorage
const DEFAULT_SETTINGS = {
  notifInterval: 30,   // minutes
  notifStart: 8,       // hour (8am)
  notifEnd: 21,        // hour (9:00 PM)
  notifEnabled: false,
};
const loadSettings = () => { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("hydro_settings") || "{}") }; } catch { return DEFAULT_SETTINGS; } };
const saveSettings = (s) => localStorage.setItem("hydro_settings", JSON.stringify(s));

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
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=DM+Serif+Display&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#060d1a;--card:rgba(255,255,255,0.04);--card-b:rgba(255,255,255,0.08);
      --blue:#4fa3e8;--blue-d:#1a6bb5;--cyan:#5ecfda;
      --text:#f0f4ff;--t2:rgba(240,244,255,0.55);--t3:rgba(240,244,255,0.3);
      --success:#4ecb8d;--danger:#ff6b6b;
      --fn:'Outfit',sans-serif;--fd:'DM Serif Display',serif;
      --nav:72px;--safe:env(safe-area-inset-bottom,0px);
    }
    html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:var(--fn)}
    input,select{font-family:var(--fn);font-size:15px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;color:var(--text);padding:14px 16px;width:100%;outline:none;transition:border-color .2s;-webkit-appearance:none;appearance:none}
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
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(5px);z-index:300;display:flex;align-items:flex-end;justify-content:center;padding:0 0 0}
    .sheet{background:#0c1829;border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:24px 20px calc(28px + var(--safe));width:100%;max-width:520px;animation:slideUp .3s cubic-bezier(.4,0,.2,1)}
    .handle{width:36px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 22px}
    .row{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05)}
    .row:last-child{border-bottom:none}
    .sel-wrap{position:relative}
    .sel-wrap::after{content:"▾";position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--t3);font-size:12px;pointer-events:none}
  `}</style>
);

// ── SHARED UI ─────────────────────────────────────────────────────────────────
function Drop({ size = 24, color = "#4fa3e8" }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2Z" fill={color} /></svg>;
}

function WaterBlob({ pct }) {
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", marginTop: 4, letterSpacing: ".06em" }}>of daily goal</div>
        </div>
      </div>
    </div>
  );
}

function Nav({ tab, setTab }) {
  const btn = (id, label, icon) => (
    <button onClick={() => setTab(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", color: tab === id ? "var(--blue)" : "var(--t3)", fontSize: 11, fontWeight: 500, padding: "10px 0" }}>
      {icon(tab === id)}{label}
    </button>
  );
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "calc(var(--nav) + var(--safe))", paddingBottom: "var(--safe)", background: "rgba(6,13,26,.95)", borderTop: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", zIndex: 100 }}>
      {btn("home", "Home", a => <svg viewBox="0 0 24 24" width="22" height="22" fill={a ? "rgba(79,163,232,.2)" : "none"} stroke={a ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /></svg>)}
      {btn("stats", "Stats", a => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={a ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8"><rect x="3" y="12" width="4" height="9" rx="1" fill={a ? "rgba(79,163,232,.25)" : "none"} /><rect x="10" y="7" width="4" height="14" rx="1" fill={a ? "rgba(79,163,232,.25)" : "none"} /><rect x="17" y="3" width="4" height="18" rx="1" fill={a ? "rgba(79,163,232,.25)" : "none"} /></svg>)}
      {btn("settings", "Settings", a => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={a ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>)}
    </nav>
  );
}

function LogBtn({ onLog, loading }) {
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
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 500 }}>{loading ? "..." : "Log"}</span>
      </button>
    </div>
  );
}

// ── AMOUNT SHEET (shared for Add & Edit) ──────────────────────────────────────
function AmountSheet({ title, subtitle, initial = "", confirmLabel, onConfirm, onClose }) {
  const [val, setVal] = useState(String(initial || ""));
  const submit = () => {
    const n = parseInt(val);
    if (!n || n < 1 || n > 5000) return;
    onConfirm(n);
    onClose();
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="handle" />
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 20 }}>{subtitle}</div>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input type="number" placeholder="e.g. 400" value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} autoFocus min="1" max="5000" style={{ paddingRight: 52 }} />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--t3)" }}>ml</span>
        </div>
        <button className="btn-p" onClick={submit} disabled={!val || parseInt(val) < 1}>
          {confirmLabel || "Confirm"} {val && parseInt(val) > 0 ? `· ${val} ml` : ""}
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "14px", marginTop: 10, background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, color: "var(--t2)", fontSize: 15 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── GOAL SHEET ────────────────────────────────────────────────────────────────
function GoalSheet({ current, onSave, onClose }) {
  const [goal, setGoal] = useState(current);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState("preset"); // "preset" | "custom"
  const confirm = () => {
    if (mode === "custom") {
      const n = parseInt(custom);
      if (!n || n < 500 || n > 10000) return;
      onSave(n); onClose();
    } else {
      onSave(goal); onClose();
    }
  };
  const active = mode === "custom" ? parseInt(custom) || 0 : goal;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="handle" />
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 5 }}>Set today's goal</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 20 }}>Choose a preset or enter a custom amount</div>

        {/* Preset grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {GOAL_OPTIONS.map(g => (
            <button key={g} onClick={() => { setGoal(g); setMode("preset"); }}
              style={{ padding: "13px 4px", borderRadius: 14, border: mode === "preset" && goal === g ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: mode === "preset" && goal === g ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: mode === "preset" && goal === g ? "var(--blue)" : "var(--t2)", fontWeight: mode === "preset" && goal === g ? 600 : 400, fontSize: 14, fontFamily: "var(--fn)", transition: "all .2s" }}>
              {toL(g)} L
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <input type="number" placeholder="Custom amount (ml)" value={custom}
            onChange={e => { setCustom(e.target.value); setMode("custom"); }}
            min="500" max="10000" style={{ paddingRight: 52 }} />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--t3)" }}>ml</span>
        </div>

        <button className="btn-p" onClick={confirm} disabled={active < 500}>
          Set {active >= 500 ? `${toL(active)} L` : ""} as today's goal
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "14px", marginTop: 10, background: "none", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, color: "var(--t2)", fontSize: 15 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────────────────────────────────
function HomeTab({ token, userId, goal, onGoalChange, logs, onLogged, onSignOut }) {
  const [cup, setCup] = useState(250);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [editEntry, setEditEntry] = useState(null); // { id, amount_ml }

  const todayTotal = sum(logs, "amount_ml");
  const pct = Math.min(100, (todayTotal / goal) * 100);
  const remaining = Math.max(0, goal - todayTotal);
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const msgs = ["Great sip! 💧", "Stay fresh! 🌊", "Body thanks you! ✨", "Keep it up! 🚀", "Hydration win! 💎"];

  const logWater = async (ml) => {
    setLoading(true);
    await sb.logIntake(token, userId, ml);
    await onLogged();
    setToast(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setToast(""), 2500);
    setLoading(false);
  };

  const editLog = async (id, ml) => {
    await sb.updateLog(token, id, ml);
    await onLogged();
  };

  const deleteEntry = async (id) => {
    await sb.deleteLog(token, id);
    await onLogged();
  };

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      {showManual && <AmountSheet title="Custom amount" subtitle="Type any amount between 1 – 5000 ml" confirmLabel="Log" onConfirm={logWater} onClose={() => setShowManual(false)} />}
      {showGoal && <GoalSheet current={goal} onSave={onGoalChange} onClose={() => setShowGoal(false)} />}
      {editEntry && <AmountSheet title="Edit entry" subtitle={`Current: ${editEntry.amount_ml} ml — enter the correct amount`} initial={editEntry.amount_ml} confirmLabel="Save" onConfirm={(ml) => editLog(editEntry.id, ml)} onClose={() => setEditEntry(null)} />}

      {/* Header */}
      <div className="fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 52, paddingBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".08em", textTransform: "uppercase" }}>{greeting}</div>
          <div style={{ fontSize: 28, fontFamily: "var(--fd)", lineHeight: 1.15, marginTop: 2 }}>Stay Hydrated</div>
        </div>
        <button onClick={onSignOut} style={{ marginTop: 4, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "8px 14px", color: "var(--t2)", fontSize: 13 }}>Sign out</button>
      </div>

      {/* Water blob */}
      <div style={{ marginTop: 28, marginBottom: 6 }}><WaterBlob pct={pct} /></div>

      {/* Amount row */}
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 600 }}>{toL(todayTotal)}</span>
        <span style={{ fontSize: 15, color: "var(--t2)", margin: "0 6px" }}>of</span>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{toL(goal)} L</span>
        {/* Inline edit goal button */}
        <button onClick={() => setShowGoal(true)} style={{ marginLeft: 8, background: "rgba(79,163,232,.12)", border: "1px solid rgba(79,163,232,.25)", borderRadius: 8, padding: "3px 9px", color: "var(--blue)", fontSize: 11, fontWeight: 500, verticalAlign: "middle" }}>
          Edit goal
        </button>
      </div>
      <div style={{ textAlign: "center", fontSize: 13, color: remaining > 0 ? "var(--t3)" : "var(--success)", marginBottom: 2 }}>
        {remaining > 0 ? `${toL(remaining)} L remaining today` : "Daily goal reached! 🎉"}
      </div>
      {toast && <div style={{ textAlign: "center", fontSize: 14, color: "var(--cyan)", marginTop: 6, animation: "fadeUp .3s ease" }}>{toast}</div>}

      {/* Cup sizes */}
      <div className="fu3" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Select amount</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {CUP_SIZES.map(s => (
            <button key={s} onClick={() => setCup(s)} style={{ padding: "14px 4px", borderRadius: 16, border: cup === s ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: cup === s ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: cup === s ? "var(--blue)" : "var(--t2)", fontWeight: cup === s ? 600 : 400, fontSize: 15, fontFamily: "var(--fn)", transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <Drop size={15} color={cup === s ? "#4fa3e8" : "rgba(240,244,255,.25)"} />
              {s} ml
            </button>
          ))}
        </div>
        <button onClick={() => setShowManual(true)} style={{ width: "100%", marginTop: 10, padding: "13px", borderRadius: 16, border: "1px dashed rgba(79,163,232,.35)", background: "rgba(79,163,232,.06)", color: "var(--blue)", fontSize: 14, fontFamily: "var(--fn)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Enter custom amount
        </button>
      </div>

      {/* Log button */}
      <div className="fu4">
        <LogBtn onLog={() => logWater(cup)} loading={loading} />
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--t3)" }}>Tap to log {cup} ml</div>
      </div>

      {/* Today's log */}
      {logs.length > 0 && (
        <div className="fu5 glass" style={{ marginTop: 28, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>Today's intake</div>
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {[...logs].reverse().map((l, i, arr) => (
              <div key={l.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(79,163,232,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Drop size={14} color="#4fa3e8" />
                  </div>
                  <span style={{ fontSize: 14, color: "var(--t2)" }}>{new Date(l.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--blue)" }}>{l.amount_ml} ml</span>
                  {/* Edit button */}
                  <button onClick={() => setEditEntry(l)} title="Edit"
                    style={{ background: "rgba(79,163,232,.1)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  {/* Delete button */}
                  <button onClick={() => deleteEntry(l.id)} title="Delete"
                    style={{ background: "rgba(255,90,90,.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}>
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
function StatsTab({ allLogs, goal }) {
  const [view, setView] = useState("week");
  const now = new Date();
  const todayStr = today();
  const weekData = () => { const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]; return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const ds = d.toISOString().split("T")[0]; return { label: days[d.getDay()], value: sum(allLogs.filter(l => l.logged_at?.startsWith(ds)), "amount_ml") }; }); };
  const monthData = () => Array.from({ length: 4 }, (_, i) => { const s = new Date(); s.setDate(s.getDate() - (27 - i * 7)); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(e.getDate() + 6); return { label: `W${i+1}`, value: sum(allLogs.filter(l => { const d = new Date(l.logged_at); return d >= s && d <= e; }), "amount_ml") }; });
  const yearData = () => { const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return Array.from({ length: 12 }, (_, i) => ({ label: mo[i], value: sum(allLogs.filter(l => new Date(l.logged_at).getMonth() === i), "amount_ml") })); };
  const data = view === "week" ? weekData() : view === "month" ? monthData() : yearData();
  const maxV = Math.max(...data.map(d => d.value), 1);
  const todayTotal = sum(allLogs.filter(l => l.logged_at?.startsWith(todayStr)), "amount_ml");
  const weekTotal = sum(weekData(), "value");
  const monthTotal = sum(allLogs.filter(l => { const d = new Date(l.logged_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }), "amount_ml");
  const yearTotal = sum(allLogs.filter(l => new Date(l.logged_at).getFullYear() === now.getFullYear()), "amount_ml");
  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div className="fu" style={{ paddingTop: 52, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".08em", textTransform: "uppercase" }}>Overview</div>
        <div style={{ fontSize: 28, fontFamily: "var(--fd)", marginTop: 2 }}>Your stats</div>
      </div>
      <div className="fu1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
        {[{ label: "Today", v: toL(todayTotal), color: "#4fa3e8" }, { label: "This week", v: toL(weekTotal), color: "#5ecfda" }, { label: "This month", v: toL(monthTotal), color: "#4ecb8d" }, { label: "This year", v: toL(yearTotal), color: "#f5a623" }].map((c, i) => (
          <div key={i} className="glass" style={{ padding: "18px 16px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, marginBottom: 10 }} />
            <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{c.v}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--t2)", marginLeft: 2 }}>L</span></div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 5 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div className="fu2 glass" style={{ marginTop: 18, padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["week","month","year"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: view === v ? "1px solid rgba(79,163,232,.3)" : "1px solid transparent", background: view === v ? "rgba(79,163,232,.18)" : "rgba(255,255,255,.04)", color: view === v ? "var(--blue)" : "var(--t3)", fontSize: 13, fontWeight: 500, fontFamily: "var(--fn)" }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 8 }}>Goal: {toL(goal)} L/day</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: "100%", height: Math.max(3, (d.value / maxV) * 112), background: d.value >= goal ? "linear-gradient(to top,#4ecb8d,rgba(78,203,141,.4))" : "linear-gradient(to top,#4fa3e8,rgba(79,163,232,.3))", borderRadius: "6px 6px 0 0", transition: "height .5s cubic-bezier(.4,0,.2,1)" }} />
              <span style={{ fontSize: 10, color: "var(--t3)", whiteSpace: "nowrap" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS TAB ──────────────────────────────────────────────────────────────
function SettingsTab({ token, userId, goal, onGoalChange, onSignOut }) {
  const [settings, setSettings] = useState(loadSettings);
  const [savedGoal, setSavedGoal] = useState(false);
  const [notifStatus, setNotifStatus] = useState(() => (typeof Notification !== "undefined" ? Notification.permission : "default"));
  const intervalRef = useRef(null);

  // Persist settings whenever they change
  useEffect(() => { saveSettings(settings); }, [settings]);

  // Restart reminder interval when settings change
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!settings.notifEnabled) return;
    intervalRef.current = setInterval(() => {
      const h = new Date().getHours();
      if (h >= settings.notifStart && h <= settings.notifEnd) {
        pushNotif("Time to drink water! 💧", `Stay on track with your daily hydration goal.`);
      }
    }, settings.notifInterval * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [settings.notifEnabled, settings.notifInterval, settings.notifStart, settings.notifEnd]);

  const enableNotif = async () => {
    const ok = await requestNotifPermission();
    setNotifStatus(ok ? "granted" : "denied");
    if (ok) {
      updateSettings({ notifEnabled: true });
      pushNotif("HydroTrack 💧", "Reminders are now enabled!");
    }
  };

  const updateSettings = (patch) => setSettings(s => ({ ...s, ...patch }));

  const changeGoal = async (g) => {
    await sb.upsertProfile(token, userId, { daily_goal_ml: g });
    onGoalChange(g);
    setSavedGoal(true);
    setTimeout(() => setSavedGoal(false), 2000);
  };

  const labelFor = (arr, val) => arr.find(x => x.value === val)?.label || val;

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div className="fu" style={{ paddingTop: 52, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".08em", textTransform: "uppercase" }}>Preferences</div>
        <div style={{ fontSize: 28, fontFamily: "var(--fd)", marginTop: 2 }}>Settings</div>
      </div>

      {/* ── NOTIFICATIONS ── */}
      <div className="fu1 glass" style={{ marginTop: 24, padding: "20px" }}>
        <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16 }}>🔔 Notifications</div>

        {/* Enable toggle row */}
        <div className="row">
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Reminders</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>
              {notifStatus === "granted" ? (settings.notifEnabled ? "Active" : "Paused") : notifStatus === "denied" ? "Blocked — check Safari settings" : "Tap Enable to turn on"}
            </div>
          </div>
          {notifStatus === "granted" ? (
            <button onClick={() => updateSettings({ notifEnabled: !settings.notifEnabled })}
              style={{ flexShrink: 0, width: 50, height: 28, borderRadius: 14, border: "none", background: settings.notifEnabled ? "var(--blue)" : "rgba(255,255,255,.12)", position: "relative", transition: "background .3s", cursor: "pointer" }}>
              <span style={{ position: "absolute", top: 3, left: settings.notifEnabled ? 25 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .3s" }} />
            </button>
          ) : notifStatus !== "denied" ? (
            <button onClick={enableNotif} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 12, background: "rgba(79,163,232,.2)", border: "1px solid rgba(79,163,232,.3)", color: "var(--blue)", fontSize: 13, fontWeight: 500, fontFamily: "var(--fn)" }}>Enable</button>
          ) : null}
        </div>

        {/* Frequency */}
        <div className="row">
          <div>
            <div style={{ fontSize: 15 }}>Remind every</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>How often to send a reminder</div>
          </div>
          <div className="sel-wrap" style={{ width: 120 }}>
            <select value={settings.notifInterval} onChange={e => updateSettings({ notifInterval: parseInt(e.target.value) })}
              style={{ padding: "10px 36px 10px 14px", fontSize: 14, borderRadius: 12 }}>
              {NOTIF_INTERVALS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Start time */}
        <div className="row">
          <div>
            <div style={{ fontSize: 15 }}>Start reminders at</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>First reminder of the day</div>
          </div>
          <div className="sel-wrap" style={{ width: 120 }}>
            <select value={settings.notifStart} onChange={e => updateSettings({ notifStart: parseInt(e.target.value) })}
              style={{ padding: "10px 36px 10px 14px", fontSize: 14, borderRadius: 12 }}>
              {HOURS.filter(h => h.value < settings.notifEnd).map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>

        {/* End time */}
        <div className="row" style={{ borderBottom: "none" }}>
          <div>
            <div style={{ fontSize: 15 }}>Stop reminders at</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Last reminder of the day</div>
          </div>
          <div className="sel-wrap" style={{ width: 120 }}>
            <select value={settings.notifEnd} onChange={e => updateSettings({ notifEnd: parseFloat(e.target.value) })}
              style={{ padding: "10px 36px 10px 14px", fontSize: 14, borderRadius: 12 }}>
              {HOURS.filter(h => h.value > settings.notifStart).map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>

        {/* Summary */}
        {settings.notifEnabled && notifStatus === "granted" && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(79,163,232,.08)", borderRadius: 12, fontSize: 13, color: "var(--blue)" }}>
            Every {labelFor(NOTIF_INTERVALS, settings.notifInterval)} · {labelFor(HOURS, settings.notifStart)} – {labelFor(HOURS, settings.notifEnd)}
          </div>
        )}
      </div>

      {/* ── DAILY GOAL ── */}
      <div className="fu2 glass" style={{ marginTop: 16, padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".1em", textTransform: "uppercase" }}>🎯 Default daily goal</div>
          <div style={{ fontSize: 13, color: "var(--blue)", fontWeight: 500 }}>Current: {toL(goal)} L</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--t3)", marginBottom: 14, lineHeight: 1.5 }}>
          This is your default goal. You can also change it per-day using the <strong style={{ color: "var(--t2)" }}>Edit goal</strong> button on the home screen.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GOAL_OPTIONS.map(g => (
            <button key={g} onClick={() => changeGoal(g)}
              style={{ padding: "15px", borderRadius: 16, border: goal === g ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: goal === g ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: goal === g ? "var(--blue)" : "var(--t2)", fontWeight: goal === g ? 600 : 400, fontSize: 16, fontFamily: "var(--fn)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{toL(g)} L</span>
              {goal === g && <span style={{ fontSize: 10, background: "rgba(79,163,232,.2)", color: "var(--blue)", padding: "3px 8px", borderRadius: 8 }}>active</span>}
            </button>
          ))}
        </div>
        {savedGoal && <div style={{ marginTop: 12, fontSize: 13, color: "var(--success)", textAlign: "center" }}>Default goal saved!</div>}
      </div>

      {/* ── INSTALL PWA ── */}
      <div className="fu3 glass" style={{ marginTop: 16, padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>📲</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Add to Home Screen</div>
            <div style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.6 }}>
              In Safari tap <strong style={{ color: "var(--t2)" }}>Share</strong> → <strong style={{ color: "var(--t2)" }}>Add to Home Screen</strong> for the best experience and full notification support on iPhone.
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="fu3" style={{ marginTop: 16 }}>
        <button onClick={onSignOut} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "1px solid rgba(255,90,90,.2)", background: "rgba(255,90,90,.06)", color: "var(--danger)", fontSize: 15, fontWeight: 500, fontFamily: "var(--fn)" }}>Sign out</button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function MainApp({ token, userId, goal, onGoalChange, onSignOut }) {
  const [tab, setTab] = useState("home");
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);

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

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", overflowY: "auto" }}>
      <G />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: "20%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,163,232,.09) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 60, right: "-10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(94,207,218,.06) 0%,transparent 70%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        {tab === "home" && <HomeTab token={token} userId={userId} goal={goal} onGoalChange={onGoalChange} logs={logs} onLogged={refresh} onSignOut={onSignOut} />}
        {tab === "stats" && <StatsTab allLogs={allLogs} goal={goal} />}
        {tab === "settings" && <SettingsTab token={token} userId={userId} goal={goal} onGoalChange={onGoalChange} onSignOut={onSignOut} />}
      </div>
      <Nav tab={tab} setTab={setTab} />
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
  const submit = async () => {
    if (!email || !password) { setMsg("Please fill in all fields."); return; }
    setLoading(true); setMsg("");
    if (mode === "signup") { const d = await sb.signUp(email, password); setMsg(d.error ? d.error.message : "Check your email to confirm!"); setLoading(false); return; }
    const d = await sb.signIn(email, password);
    if (d.error) { setMsg(d.error.message); setLoading(false); return; }
    localStorage.setItem("hydro_token", d.access_token);
    localStorage.setItem("hydro_uid", d.user.id);
    onAuth(d.access_token, d.user.id);
    setLoading(false);
  };
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)", fontFamily: "var(--fn)", position: "relative", overflow: "hidden" }}>
      <G />
      <div style={{ position: "absolute", top: "-15%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,163,232,.13) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div className="fu" style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg,rgba(79,163,232,.2),rgba(26,107,181,.3))", border: "1px solid rgba(79,163,232,.3)", alignItems: "center", justifyContent: "center", marginBottom: 16, animation: "float 4s ease-in-out infinite" }}>
            <Drop size={36} color="#4fa3e8" />
          </div>
          <div style={{ fontSize: 34, fontFamily: "var(--fd)", letterSpacing: "-.5px" }}>HydroTrack</div>
          <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 6 }}>Your daily hydration companion</div>
        </div>
        <div className="fu1 glass" style={{ padding: "26px 22px 22px" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,.04)", borderRadius: 14, padding: 4, marginBottom: 22 }}>
            {["signin","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setMsg(""); }} style={{ flex: 1, padding: "10px", borderRadius: 11, background: mode === m ? "rgba(79,163,232,.2)" : "transparent", border: mode === m ? "1px solid rgba(79,163,232,.3)" : "1px solid transparent", color: mode === m ? "var(--blue)" : "var(--t3)", fontWeight: mode === m ? 600 : 400, fontSize: 14, fontFamily: "var(--fn)", transition: "all .2s" }}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
          <button className="btn-p" onClick={submit} disabled={loading}>{loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
            <span style={{ fontSize: 12, color: "var(--t3)" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
          </div>
          <button onClick={() => sb.signInGoogle()} style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text)", fontSize: 15, fontFamily: "var(--fn)" }}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          {msg && <div style={{ marginTop: 14, fontSize: 13, textAlign: "center", padding: "10px 14px", borderRadius: 12, background: msg.includes("Check") ? "rgba(78,203,141,.1)" : "rgba(255,90,90,.1)", color: msg.includes("Check") ? "var(--success)" : "var(--danger)" }}>{msg}</div>}
        </div>
        <div className="fu2" style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--t3)" }}>By signing in you agree to drink more water 💧</div>
      </div>
    </div>
  );
}

// ── SETUP SCREEN ──────────────────────────────────────────────────────────────
function SetupScreen({ token, userId, onDone }) {
  const [goal, setGoal] = useState(2000);
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); await sb.upsertProfile(token, userId, { daily_goal_ml: goal }); onDone(goal); setSaving(false); };
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)", fontFamily: "var(--fn)", position: "relative", overflow: "hidden" }}>
      <G />
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,163,232,.1) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div className="fu" style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 34, fontFamily: "var(--fd)" }}>Set your goal</div>
          <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 8 }}>How much water do you aim to drink daily?</div>
        </div>
        <div className="fu1" style={{ textAlign: "center", marginBottom: 26 }}>
          <span style={{ fontSize: 64, fontWeight: 600, color: "var(--blue)" }}>{toL(goal)}</span>
          <span style={{ fontSize: 24, fontWeight: 400, color: "var(--t2)" }}> L / day</span>
        </div>
        <div className="fu2 glass" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {GOAL_OPTIONS.map(g => (
              <button key={g} onClick={() => setGoal(g)} style={{ padding: "15px", borderRadius: 16, border: goal === g ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: goal === g ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: goal === g ? "var(--blue)" : "var(--t2)", fontWeight: goal === g ? 600 : 400, fontSize: 16, fontFamily: "var(--fn)", transition: "all .2s" }}>
                {toL(g)} L
              </button>
            ))}
          </div>
        </div>
        <div className="fu3"><button className="btn-p" onClick={save} disabled={saving}>{saving ? "Saving..." : "Start tracking →"}</button></div>
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

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const t = params.get("access_token");
      if (t) sb.getUser(t).then(u => {
        if (u?.id) {
          localStorage.setItem("hydro_token", t);
          localStorage.setItem("hydro_uid", u.id);
          setToken(t); setUserId(u.id);
          window.history.replaceState({}, "", window.location.pathname);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!token || !userId) { setChecking(false); return; }
    sb.getProfile(token, userId)
      .then(p => { if (p?.daily_goal_ml) setGoal(p.daily_goal_ml); setChecking(false); })
      .catch(() => setChecking(false));
  }, [token, userId]);

  const handleAuth = (t, uid) => { setToken(t); setUserId(uid); };
  const handleSignOut = async () => {
    if (token) await sb.signOut(token);
    localStorage.removeItem("hydro_token"); localStorage.removeItem("hydro_uid");
    setToken(null); setUserId(null); setGoal(null);
  };

  if (checking) return (
    <><G />
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--fn)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ animation: "float 2s ease-in-out infinite" }}><Drop size={38} color="#4fa3e8" /></div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>Loading...</div>
        </div>
      </div>
    </>
  );

  if (!token || !userId) return <AuthScreen onAuth={handleAuth} />;
  if (!goal) return <SetupScreen token={token} userId={userId} onDone={g => setGoal(g)} />;
  return <MainApp token={token} userId={userId} goal={goal} onGoalChange={setGoal} onSignOut={handleSignOut} />;
}
