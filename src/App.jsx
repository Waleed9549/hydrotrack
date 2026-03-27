import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://otvvfifeifuirewagxia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dnZmaWZlaWZ1aXJld2FneGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzE4MTksImV4cCI6MjA5MDIwNzgxOX0.5e8ALgMws7exCYrckxctFtgZh5cq7hjNJa8HZmEQDNw";

const supabase = {
  headers: (token) => ({
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }),
  async signUp(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, { method: "POST", headers: this.headers(), body: JSON.stringify({ email, password }) });
    return r.json();
  },
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: this.headers(), body: JSON.stringify({ email, password }) });
    return r.json();
  },
  async signInWithGoogle() {
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}`;
  },
  async getUser(token) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: this.headers(token) });
    return r.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: this.headers(token) });
  },
  async logIntake(token, userId, amount_ml) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/water_logs`, { method: "POST", headers: { ...this.headers(token), Prefer: "return=representation" }, body: JSON.stringify({ user_id: userId, amount_ml, logged_at: new Date().toISOString() }) });
    return r.json();
  },
  async getLogs(token, userId, from, to) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/water_logs?user_id=eq.${userId}&logged_at=gte.${from}&logged_at=lte.${to}&order=logged_at.asc`, { headers: this.headers(token) });
    return r.json();
  },
  async getProfile(token, userId) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, { headers: this.headers(token) });
    const rows = await r.json();
    return rows[0];
  },
  async upsertProfile(token, userId, daily_goal_ml) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, { method: "POST", headers: { ...this.headers(token), Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ id: userId, daily_goal_ml }) });
    return r.json();
  },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const toL = (ml) => (ml / 1000).toFixed(2);
const today = () => new Date().toISOString().split("T")[0];
const sum = (arr, key) => arr.reduce((a, b) => a + (b[key] || 0), 0);
const CUP_SIZES = [200, 230, 250, 330, 500, 600];
const GOAL_OPTIONS = [1500, 2000, 2500, 3000, 3500, 4000];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#060d1a;--bg2:#0b1628;--bg3:#0f1e35;
      --card:rgba(255,255,255,0.04);--card-b:rgba(255,255,255,0.08);
      --blue:#4fa3e8;--blue-d:#1a6bb5;--cyan:#5ecfda;
      --text:#f0f4ff;--t2:rgba(240,244,255,0.55);--t3:rgba(240,244,255,0.3);
      --success:#4ecb8d;--warn:#f5a623;
      --fn:'Outfit',sans-serif;--fd:'DM Serif Display',serif;
      --nav:72px;--safe:env(safe-area-inset-bottom,0px);
    }
    html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:var(--fn)}
    input{font-family:var(--fn);font-size:15px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;color:var(--text);padding:14px 16px;width:100%;outline:none;transition:border-color .2s}
    input::placeholder{color:var(--t3)}
    input:focus{border-color:var(--blue)}
    button{font-family:var(--fn);cursor:pointer}
    ::-webkit-scrollbar{width:0}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes ripple{0%{transform:scale(.8);opacity:1}100%{transform:scale(2.4);opacity:0}}
    @keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
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
  `}</style>
);

// ─── DROP ICON ────────────────────────────────────────────────────────────────
function Drop({ size = 24, color = "#4fa3e8" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2Z" fill={color} />
    </svg>
  );
}

// ─── ANIMATED WATER CIRCLE ────────────────────────────────────────────────────
function WaterBlob({ pct }) {
  const filled = Math.min(100, Math.max(0, pct));
  const r = 90, c = 2 * Math.PI * r;
  const dash = (filled / 100) * c;
  const col = filled >= 100 ? "#4ecb8d" : "#4fa3e8";

  return (
    <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto" }}>
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(79,163,232,0.07)" strokeWidth="12" />
        <circle cx="100" cy="100" r="90" fill="none" stroke={col} strokeWidth="6"
          strokeDasharray={`${dash} ${c}`} strokeDashoffset={c * 0.25} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1), stroke .5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 14, borderRadius: "50%", overflow: "hidden", background: "#060d1a" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${filled}%`, background: "linear-gradient(to top, rgba(26,107,181,.9), rgba(79,163,232,.6))", transition: "height .8s cubic-bezier(.4,0,.2,1)" }}>
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ position: "absolute", top: -20, left: 0, width: "200%", height: 40, animation: "wave 3s linear infinite" }}>
            <path d="M0,20 Q50,5 100,20 Q150,35 200,20 Q250,5 300,20 Q350,35 400,20 L400,40 L0,40Z" fill="rgba(79,163,232,.8)" />
          </svg>
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ position: "absolute", top: -14, left: 0, width: "200%", height: 40, animation: "wave 4.5s linear infinite reverse", opacity: .5 }}>
            <path d="M0,20 Q50,5 100,20 Q150,35 200,20 Q250,5 300,20 Q350,35 400,20 L400,40 L0,40Z" fill="rgba(94,207,218,.7)" />
          </svg>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <div style={{ fontSize: 44, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
            {Math.round(filled)}<span style={{ fontSize: 20, fontWeight: 400 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", marginTop: 4, letterSpacing: ".06em" }}>of daily goal</div>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function Nav({ tab, setTab }) {
  const items = [
    { id: "home", label: "Home", path: "M3 12L12 3l9 9M9 21V12h6v9" },
    { id: "stats", label: "Stats", path: null },
    { id: "settings", label: "Settings", path: null },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "calc(var(--nav) + var(--safe))", paddingBottom: "var(--safe)", background: "rgba(6,13,26,.94)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", zIndex: 100 }}>
      {/* Home */}
      <button onClick={() => setTab("home")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", color: tab === "home" ? "var(--blue)" : "var(--t3)", fontSize: 11, fontWeight: 500, padding: "10px 0" }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill={tab === "home" ? "rgba(79,163,232,.2)" : "none"} stroke={tab === "home" ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>
        </svg>
        Home
      </button>
      {/* Stats */}
      <button onClick={() => setTab("stats")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", color: tab === "stats" ? "var(--blue)" : "var(--t3)", fontSize: 11, fontWeight: 500, padding: "10px 0" }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={tab === "stats" ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8">
          <rect x="3" y="12" width="4" height="9" rx="1" fill={tab === "stats" ? "rgba(79,163,232,.25)" : "none"}/>
          <rect x="10" y="7" width="4" height="14" rx="1" fill={tab === "stats" ? "rgba(79,163,232,.25)" : "none"}/>
          <rect x="17" y="3" width="4" height="18" rx="1" fill={tab === "stats" ? "rgba(79,163,232,.25)" : "none"}/>
        </svg>
        Stats
      </button>
      {/* Settings */}
      <button onClick={() => setTab("settings")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", color: tab === "settings" ? "var(--blue)" : "var(--t3)", fontSize: 11, fontWeight: 500, padding: "10px 0" }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={tab === "settings" ? "var(--blue)" : "var(--t3)"} strokeWidth="1.8">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
        Settings
      </button>
    </nav>
  );
}

// ─── LOG BUTTON ───────────────────────────────────────────────────────────────
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
      <button onClick={fire} disabled={loading} style={{ position: "relative", overflow: "hidden", width: 84, height: 84, borderRadius: "50%", background: "linear-gradient(135deg,#4fa3e8,#1a6bb5)", border: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, boxShadow: "0 0 32px rgba(79,163,232,.4)", opacity: loading ? .6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
        {ripples.map(id => <span key={id} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(255,255,255,.6)", animation: "ripple .7s ease-out forwards" }} />)}
        <Drop size={30} color="#fff" />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.85)", fontWeight: 500 }}>{loading ? "..." : "Log"}</span>
      </button>
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({ token, userId, goal, logs, onLogged, onSignOut }) {
  const [cup, setCup] = useState(250);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const todayTotal = sum(logs, "amount_ml");
  const pct = Math.min(100, (todayTotal / goal) * 100);
  const remaining = Math.max(0, goal - todayTotal);
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const msgs = ["Great sip! 💧","Stay fresh! 🌊","Body thanks you! ✨","Keep it up! 🚀","Hydration win! 💎"];

  const logWater = async () => {
    setLoading(true);
    await supabase.logIntake(token, userId, cup);
    onLogged();
    setToast(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setToast(""), 2500);
    setLoading(false);
  };

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div className="fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 52, paddingBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".08em", textTransform: "uppercase" }}>{greeting}</div>
          <div style={{ fontSize: 28, fontFamily: "var(--fd)", lineHeight: 1.15, marginTop: 2 }}>Stay Hydrated</div>
        </div>
        <button onClick={onSignOut} style={{ marginTop: 4, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "8px 14px", color: "var(--t2)", fontSize: 13 }}>
          Sign out
        </button>
      </div>

      {/* Water blob */}
      <div className="fu1" style={{ marginTop: 28, marginBottom: 6 }}>
        <WaterBlob pct={pct} />
      </div>

      {/* Amount label */}
      <div className="fu2" style={{ textAlign: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 600 }}>{toL(todayTotal)}</span>
        <span style={{ fontSize: 15, color: "var(--t2)", margin: "0 6px" }}>of</span>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{toL(goal)} L</span>
      </div>
      <div style={{ textAlign: "center", fontSize: 13, color: remaining > 0 ? "var(--t3)" : "var(--success)", marginBottom: 2 }}>
        {remaining > 0 ? `${toL(remaining)} L remaining` : "Daily goal reached! 🎉"}
      </div>

      {/* Toast */}
      {toast && <div style={{ textAlign: "center", fontSize: 14, color: "var(--cyan)", marginTop: 6, animation: "fadeUp .3s ease" }}>{toast}</div>}

      {/* Cup sizes */}
      <div className="fu3" style={{ marginTop: 26 }}>
        <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Select amount</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {CUP_SIZES.map(s => (
            <button key={s} onClick={() => setCup(s)} style={{ padding: "14px 4px", borderRadius: 16, border: cup === s ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: cup === s ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: cup === s ? "var(--blue)" : "var(--t2)", fontWeight: cup === s ? 600 : 400, fontSize: 15, fontFamily: "var(--fn)", transition: "all .2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <Drop size={15} color={cup === s ? "#4fa3e8" : "rgba(240,244,255,.25)"} />
              {s} ml
            </button>
          ))}
        </div>
      </div>

      {/* Log button */}
      <div className="fu4">
        <LogBtn onLog={logWater} loading={loading} />
        <div style={{ textAlign: "center", fontSize: 13, color: "var(--t3)" }}>Tap to log {cup} ml</div>
      </div>

      {/* Today's log */}
      {logs.length > 0 && (
        <div className="fu5 glass" style={{ marginTop: 28, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>Today's intake</div>
          <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {[...logs].reverse().map((l, i, arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(79,163,232,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Drop size={14} color="#4fa3e8" />
                  </div>
                  <span style={{ fontSize: 14, color: "var(--t2)" }}>{new Date(l.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--blue)" }}>{l.amount_ml} ml</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STATS TAB ────────────────────────────────────────────────────────────────
function StatsTab({ allLogs, goal }) {
  const [view, setView] = useState("week");
  const now = new Date();
  const todayStr = today();

  const weekData = () => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split("T")[0];
      return { label: days[d.getDay()], value: sum(allLogs.filter(l => l.logged_at?.startsWith(ds)), "amount_ml") };
    });
  };
  const monthData = () => Array.from({ length: 4 }, (_, i) => {
    const s = new Date(); s.setDate(s.getDate() - (27 - i * 7)); s.setHours(0,0,0,0);
    const e = new Date(s); e.setDate(e.getDate() + 6);
    return { label: `W${i+1}`, value: sum(allLogs.filter(l => { const d = new Date(l.logged_at); return d >= s && d <= e; }), "amount_ml") };
  });
  const yearData = () => {
    const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return Array.from({ length: 12 }, (_, i) => ({ label: mo[i], value: sum(allLogs.filter(l => new Date(l.logged_at).getMonth() === i), "amount_ml") }));
  };

  const data = view === "week" ? weekData() : view === "month" ? monthData() : yearData();
  const maxV = Math.max(...data.map(d => d.value), 1);

  const todayTotal = sum(allLogs.filter(l => l.logged_at?.startsWith(todayStr)), "amount_ml");
  const weekTotal = sum(weekData(), "value");
  const monthTotal = sum(allLogs.filter(l => { const d = new Date(l.logged_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }), "amount_ml");
  const yearTotal = sum(allLogs.filter(l => new Date(l.logged_at).getFullYear() === now.getFullYear()), "amount_ml");

  const cards = [
    { label: "Today", v: toL(todayTotal), color: "#4fa3e8" },
    { label: "This week", v: toL(weekTotal), color: "#5ecfda" },
    { label: "This month", v: toL(monthTotal), color: "#4ecb8d" },
    { label: "This year", v: toL(yearTotal), color: "#f5a623" },
  ];

  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div className="fu" style={{ paddingTop: 52, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".08em", textTransform: "uppercase" }}>Overview</div>
        <div style={{ fontSize: 28, fontFamily: "var(--fd)", marginTop: 2 }}>Your stats</div>
      </div>

      <div className="fu1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
        {cards.map((c, i) => (
          <div key={i} className="glass" style={{ padding: "18px 16px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, marginBottom: 10 }} />
            <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{c.v}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--t2)", marginLeft: 2 }}>L</span></div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 5, letterSpacing: ".03em" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="fu2 glass" style={{ marginTop: 18, padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["week","month","year"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "9px 0", borderRadius: 12, border: view === v ? "1px solid rgba(79,163,232,.3)" : "1px solid transparent", background: view === v ? "rgba(79,163,232,.18)" : "rgba(255,255,255,.04)", color: view === v ? "var(--blue)" : "var(--t3)", fontSize: 13, fontWeight: 500, fontFamily: "var(--fn)", transition: "all .2s" }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--t3)", marginBottom: 8 }}>Goal: {toL(goal)} L/day</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
          {data.map((d, i) => {
            const h = maxV > 0 ? Math.max(3, (d.value / maxV) * 112) : 3;
            const ok = d.value >= goal;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ width: "100%", height: h, background: ok ? "linear-gradient(to top,#4ecb8d,rgba(78,203,141,.4))" : "linear-gradient(to top,#4fa3e8,rgba(79,163,232,.3))", borderRadius: "6px 6px 0 0", transition: "height .5s cubic-bezier(.4,0,.2,1)" }} />
                <span style={{ fontSize: 10, color: "var(--t3)", whiteSpace: "nowrap" }}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fu3 glass" style={{ marginTop: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(245,166,35,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔥</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Build your streak</div>
          <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2 }}>Log water daily to build a healthy habit</div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ token, userId, goal, onGoalChange, onSignOut }) {
  const [saved, setSaved] = useState(false);
  const change = async (g) => {
    await supabase.upsertProfile(token, userId, g);
    onGoalChange(g);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div style={{ padding: "0 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div className="fu" style={{ paddingTop: 52, paddingBottom: 4 }}>
        <div style={{ fontSize: 12, color: "var(--t2)", letterSpacing: ".08em", textTransform: "uppercase" }}>Preferences</div>
        <div style={{ fontSize: 28, fontFamily: "var(--fd)", marginTop: 2 }}>Settings</div>
      </div>

      <div className="fu1 glass" style={{ marginTop: 24, padding: "20px" }}>
        <div style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 16 }}>Daily water goal</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {GOAL_OPTIONS.map(g => (
            <button key={g} onClick={() => change(g)} style={{ padding: "15px", borderRadius: 16, border: goal === g ? "1.5px solid var(--blue)" : "1px solid rgba(255,255,255,.08)", background: goal === g ? "rgba(79,163,232,.15)" : "rgba(255,255,255,.03)", color: goal === g ? "var(--blue)" : "var(--t2)", fontWeight: goal === g ? 600 : 400, fontSize: 16, fontFamily: "var(--fn)", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{toL(g)} L</span>
              {goal === g && <span style={{ fontSize: 10, background: "rgba(79,163,232,.2)", color: "var(--blue)", padding: "3px 8px", borderRadius: 8 }}>active</span>}
            </button>
          ))}
        </div>
        {saved && <div style={{ marginTop: 12, fontSize: 13, color: "var(--success)", textAlign: "center" }}>Saved!</div>}
      </div>

      <div className="fu2 glass" style={{ marginTop: 14, overflow: "hidden" }}>
        {[{ icon: "🔔", label: "Reminders", sub: "Every 30 min · 8am – 9pm" }, { icon: "ℹ️", label: "About", sub: "HydroTrack v2.0" }].map((item, i, arr) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{item.sub}</div>
            </div>
            <svg viewBox="0 0 24 24" width="15" height="15" stroke="rgba(240,244,255,.2)" strokeWidth="2" fill="none"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>

      <div className="fu3" style={{ marginTop: 14 }}>
        <button onClick={onSignOut} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "1px solid rgba(255,90,90,.2)", background: "rgba(255,90,90,.06)", color: "#ff6b6b", fontSize: 15, fontWeight: 500, fontFamily: "var(--fn)" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function MainApp({ token, userId, goal, onGoalChange, onSignOut }) {
  const [tab, setTab] = useState("home");
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [reminder, setReminder] = useState(null);

  const fetchToday = useCallback(async () => {
    const data = await supabase.getLogs(token, userId, `${today()}T00:00:00Z`, `${today()}T23:59:59Z`);
    if (Array.isArray(data)) setLogs(data);
  }, [token, userId]);

  const fetchAll = useCallback(async () => {
    const from = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const data = await supabase.getLogs(token, userId, from, new Date().toISOString());
    if (Array.isArray(data)) setAllLogs(data);
  }, [token, userId]);

  useEffect(() => { fetchToday(); fetchAll(); }, [fetchToday, fetchAll]);

  useEffect(() => {
    const id = setInterval(() => {
      const h = new Date().getHours();
      if (h >= 8 && h <= 21 && sum(logs, "amount_ml") < goal) {
        setReminder(`Still need ${toL(goal - sum(logs, "amount_ml"))} L today`);
        setTimeout(() => setReminder(null), 8000);
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [logs, goal]);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", overflowY: "auto" }}>
      <G />
      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: "20%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,163,232,.09) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 60, right: "-10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(94,207,218,.06) 0%,transparent 70%)" }} />
      </div>

      {/* Reminder */}
      {reminder && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: "rgba(79,163,232,.93)", backdropFilter: "blur(10px)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "#fff", fontFamily: "var(--fn)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Drop size={16} color="#fff" />{reminder}</div>
          <button onClick={() => setReminder(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        {tab === "home" && <HomeTab token={token} userId={userId} goal={goal} logs={logs} onLogged={() => { fetchToday(); fetchAll(); }} onSignOut={onSignOut} />}
        {tab === "stats" && <StatsTab allLogs={allLogs} goal={goal} />}
        {tab === "settings" && <SettingsTab token={token} userId={userId} goal={goal} onGoalChange={onGoalChange} onSignOut={onSignOut} />}
      </div>

      <Nav tab={tab} setTab={setTab} />
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    if (!email || !password) { setMsg("Please fill in all fields."); return; }
    setLoading(true); setMsg("");
    if (mode === "signup") {
      const d = await supabase.signUp(email, password);
      setMsg(d.error ? d.error.message : "Check your email to confirm!");
      setLoading(false); return;
    }
    const d = await supabase.signIn(email, password);
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
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(94,207,218,.08) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div className="fu" style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", width: 72, height: 72, borderRadius: 24, background: "linear-gradient(135deg,rgba(79,163,232,.2),rgba(26,107,181,.3))", border: "1px solid rgba(79,163,232,.3)", alignItems: "center", justifyContent: "center", marginBottom: 16, animation: "float 4s ease-in-out infinite" }}>
            <Drop size={36} color="#4fa3e8" />
          </div>
          <div style={{ fontSize: 34, fontFamily: "var(--fd)", letterSpacing: "-.5px" }}>HydroTrack</div>
          <div style={{ fontSize: 15, color: "var(--t2)", marginTop: 6 }}>Your daily hydration companion</div>
        </div>

        {/* Card */}
        <div className="fu1 glass" style={{ padding: "26px 22px 22px" }}>
          {/* Tabs */}
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

          <button className="btn-p" onClick={submit} disabled={loading}>
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
            <span style={{ fontSize: 12, color: "var(--t3)" }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
          </div>

          <button onClick={() => supabase.signInWithGoogle()} style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text)", fontSize: 15, fontFamily: "var(--fn)", transition: "background .2s" }}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {msg && <div style={{ marginTop: 14, fontSize: 13, textAlign: "center", padding: "10px 14px", borderRadius: 12, background: msg.includes("Check") ? "rgba(78,203,141,.1)" : "rgba(255,90,90,.1)", color: msg.includes("Check") ? "var(--success)" : "#ff6b6b" }}>{msg}</div>}
        </div>

        <div className="fu2" style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--t3)" }}>
          By signing in you agree to drink more water 💧
        </div>
      </div>
    </div>
  );
}

// ─── SETUP SCREEN ─────────────────────────────────────────────────────────────
function SetupScreen({ token, userId, onDone }) {
  const [goal, setGoal] = useState(2000);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await supabase.upsertProfile(token, userId, goal);
    onDone(goal);
    setSaving(false);
  };
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
        <div className="fu3">
          <button className="btn-p" onClick={save} disabled={saving}>{saving ? "Saving..." : "Start tracking →"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
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
      if (t) supabase.getUser(t).then(u => {
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
    supabase.getProfile(token, userId)
      .then(p => { if (p?.daily_goal_ml) setGoal(p.daily_goal_ml); setChecking(false); })
      .catch(() => setChecking(false));
  }, [token, userId]);

  const handleAuth = (t, uid) => { setToken(t); setUserId(uid); };
  const handleSignOut = async () => {
    if (token) await supabase.signOut(token);
    localStorage.removeItem("hydro_token"); localStorage.removeItem("hydro_uid");
    setToken(null); setUserId(null); setGoal(null);
  };

  if (checking) return (
    <>
      <G />
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
