import { useState, useEffect, useRef } from "react";
import {
  fbGet, fbSet, fbSetFull, fbDelete, fbList,
  fbListen, fbListenCollection
} from "./firebase.js";

// ─── DATA ────────────────────────────────────────────────────────────────────
const GROUPS = {
  A: { teams: ["México","Corea del Sur","Rep. Checa","Sudáfrica"], matches: [["México","Sudáfrica"],["Corea del Sur","Rep. Checa"],["Rep. Checa","Sudáfrica"],["México","Corea del Sur"],["México","Rep. Checa"],["Corea del Sur","Sudáfrica"]] },
  B: { teams: ["Canadá","Qatar","Suiza","Bosnia y Herz."], matches: [["Canadá","Bosnia y Herz."],["Qatar","Suiza"],["Suiza","Bosnia y Herz."],["Canadá","Qatar"],["Canadá","Suiza"],["Qatar","Bosnia y Herz."]] },
  C: { teams: ["Brasil","Marruecos","Haití","Escocia"], matches: [["Brasil","Marruecos"],["Haití","Escocia"],["Escocia","Marruecos"],["Brasil","Haití"],["Brasil","Escocia"],["Marruecos","Haití"]] },
  D: { teams: ["EE.UU.","Paraguay","Australia","Turquía"], matches: [["EE.UU.","Paraguay"],["Australia","Turquía"],["EE.UU.","Australia"],["Turquía","Paraguay"],["EE.UU.","Turquía"],["Australia","Paraguay"]] },
  E: { teams: ["Alemania","C. de Marfil","Ecuador","Curazao"], matches: [["Alemania","Curazao"],["C. de Marfil","Ecuador"],["Alemania","C. de Marfil"],["Ecuador","Curazao"],["Alemania","Ecuador"],["C. de Marfil","Curazao"]] },
  F: { teams: ["P. Bajos","Japón","Suecia","Túnez"], matches: [["P. Bajos","Japón"],["Suecia","Túnez"],["P. Bajos","Suecia"],["Túnez","Japón"],["P. Bajos","Túnez"],["Suecia","Japón"]] },
  G: { teams: ["Bélgica","Egipto","Irán","Nueva Zelanda"], matches: [["Bélgica","Egipto"],["Irán","Nueva Zelanda"],["Bélgica","Irán"],["Nueva Zelanda","Egipto"],["Bélgica","Nueva Zelanda"],["Irán","Egipto"]] },
  H: { teams: ["España","Arabia Saudita","Uruguay","Cabo Verde"], matches: [["España","Cabo Verde"],["Arabia Saudita","Uruguay"],["España","Arabia Saudita"],["Uruguay","Cabo Verde"],["España","Uruguay"],["Arabia Saudita","Cabo Verde"]] },
  I: { teams: ["Francia","Senegal","Irak","Noruega"], matches: [["Francia","Senegal"],["Irak","Noruega"],["Francia","Irak"],["Noruega","Senegal"],["Francia","Noruega"],["Irak","Senegal"]] },
  J: { teams: ["Argentina","Argelia","Austria","Jordania"], matches: [["Argentina","Argelia"],["Austria","Jordania"],["Argentina","Austria"],["Jordania","Argelia"],["Argentina","Jordania"],["Argelia","Austria"]] },
  K: { teams: ["Portugal","RD Congo","Uzbekistán","Colombia"], matches: [["Portugal","RD Congo"],["Uzbekistán","Colombia"],["Portugal","Uzbekistán"],["Colombia","RD Congo"],["Portugal","Colombia"],["Uzbekistán","RD Congo"]] },
  L: { teams: ["Inglaterra","Croacia","Ghana","Panamá"], matches: [["Inglaterra","Croacia"],["Ghana","Panamá"],["Inglaterra","Ghana"],["Panamá","Croacia"],["Inglaterra","Panamá"],["Ghana","Croacia"]] },
};

const KNOCKOUT_ROUNDS = [
  { id: "r32", label: "32avos", matches: 16 },
  { id: "r16", label: "16avos", matches: 8 },
  { id: "qf",  label: "Cuartos", matches: 4 },
  { id: "sf",  label: "Semis", matches: 2 },
  { id: "3rd", label: "3er Puesto", matches: 1 },
  { id: "fin", label: "FINAL", matches: 1 },
];

const FLAGS = {
  "México":"🇲🇽","Corea del Sur":"🇰🇷","Rep. Checa":"🇨🇿","Sudáfrica":"🇿🇦",
  "Canadá":"🇨🇦","Qatar":"🇶🇦","Suiza":"🇨🇭","Bosnia y Herz.":"🇧🇦",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "EE.UU.":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","C. de Marfil":"🇨🇮","Ecuador":"🇪🇨","Curazao":"🇨🇼",
  "P. Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "España":"🇪🇸","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾","Cabo Verde":"🇨🇻",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Irak":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","RD Congo":"🇨🇩","Uzbekistán":"🇺🇿","Colombia":"🇨🇴",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};
const f = t => (FLAGS[t] || "🏳️") + " " + t;

const ADMIN_PIN = "12041925";

// ─── SCORING ─────────────────────────────────────────────────────────────────
function scoreMatch(pred, actual) {
  if (!pred || pred.h === "" || pred.a === "" || !actual || actual.h === "" || actual.a === "") return null;
  const ph = +pred.h, pa = +pred.a, ah = +actual.h, aa = +actual.a;
  if (ph === ah && pa === aa) return 3;
  const pw = ph > pa ? "h" : ph < pa ? "a" : "d";
  const aw = ah > aa ? "h" : ah < aa ? "a" : "d";
  return pw === aw ? 1 : 0;
}

function computePoints(preds, results) {
  let pts = 0;
  Object.entries(preds?.groups || {}).forEach(([g, ms]) =>
    Object.entries(ms).forEach(([i, pred]) => {
      const s = scoreMatch(pred, results?.groups?.[g]?.[i]);
      if (s !== null) pts += s;
    })
  );
  return pts;
}

function hashPass(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0b1623", card: "#111e2f", cardBorder: "#1c2f47",
  gold: "#e2b13c", red: "#c0392b", text: "#dde4f0",
  muted: "#4a6080", dim: "#2d3f5a", green: "#27ae60", orange: "#e67e22",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{min-height:100vh}
  body{background:${C.bg};color:${C.text};font-family:'Barlow',sans-serif}
  input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
  input[type=number]{-moz-appearance:textfield}
  ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0b1623}::-webkit-scrollbar-thumb{background:#1c2f47;border-radius:3px}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

const inp = { background: C.card, border: `1.5px solid ${C.dim}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, fontFamily: "'Barlow',sans-serif", width: "100%", outline: "none" };
const btnS = (v="gold",x={}) => ({ background: v==="gold"?C.gold:v==="red"?C.red:v==="ghost"?"transparent":C.dim, color: v==="gold"?"#0b1623":C.text, border: v==="ghost"?`1.5px solid ${C.dim}`:"none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: .5, transition: "all .15s", ...x });
const cardS = (x={}) => ({ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 20, ...x });

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const Toast = ({ msg, ok }) => (
  <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:ok?C.green:C.red, color:"#fff", padding:"11px 28px", borderRadius:99, fontWeight:700, fontSize:14, zIndex:9999, boxShadow:"0 4px 24px rgba(0,0,0,.5)", whiteSpace:"nowrap", fontFamily:"'Barlow Condensed',sans-serif", animation:"fadeIn .2s ease" }}>
    {msg}
  </div>
);

const Spinner = () => (
  <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
    <div style={{ width:40, height:40, border:`4px solid ${C.dim}`, borderTop:`4px solid ${C.gold}`, borderRadius:"50%", animation:"spin 1s linear infinite" }} />
    <div style={{ color:C.muted, fontFamily:"'Barlow Condensed',sans-serif", fontSize:16 }}>Cargando...</div>
  </div>
);

const ScoreBox = ({ value, onChange }) => (
  <input type="number" min="0" max="99" value={value} onChange={e=>onChange(e.target.value)}
    style={{ width:40, height:40, textAlign:"center", fontSize:17, fontFamily:"'Bebas Neue',cursive", background:"#0b1623", border:`2px solid ${C.dim}`, borderRadius:8, color:C.gold, outline:"none" }} />
);

const PtsBadge = ({ pts }) => {
  if (pts === null || pts === undefined) return null;
  const bg = pts===3?C.green:pts===1?C.orange:C.red;
  return <span style={{ background:bg, color:"#fff", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:99 }}>{pts}pt</span>;
};

const SectionTitle = ({ children }) => (
  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:20, color:C.gold, letterSpacing:2, marginBottom:14 }}>{children}</div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ background:active?C.gold:"#1a2535", color:active?"#0b1623":C.muted, border:"none", borderRadius:8, padding:"6px 13px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'Barlow Condensed',sans-serif", marginRight:6, marginBottom:6, transition:"all .15s" }}>
    {label}
  </button>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");
  const [prodes, setProdes] = useState([]);
  const [activeProde, setActiveProde] = useState(null);
  const [predictions, setPredictions] = useState({ groups:{}, knockout:{}, champion:"", runner:"", third:"" });
  const [adminResults, setAdminResults] = useState({ groups:{}, knockout:{} });
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeGroup, setActiveGroup] = useState("A");
  const [activeKO, setActiveKO] = useState("r32");
  const [adminGroup, setAdminGroup] = useState("A");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPass, setFormPass] = useState("");
  const [formPass2, setFormPass2] = useState("");
  const [formErr, setFormErr] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [newProdeName, setNewProdeName] = useState("");
  const [adminActiveProde, setAdminActiveProde] = useState(null);

  const unsubRefs = useRef([]);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null), 2800); };

  // ── Load prodes list (real-time) ──────────────────────────────────────────
  useEffect(() => {
    const unsub = fbListenCollection("prodes", docs => {
      setProdes(docs.sort((a,b) => a.createdAt - b.createdAt));
    });
    return () => unsub();
  }, []);

  // ── Restore session from localStorage ────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("prode_session");
      if (saved) {
        const u = JSON.parse(saved);
        setUser(u);
        setScreen("prodeList");
      }
    } catch {}
  }, []);

  // ── Subscribe to leaderboard & results when prode active ─────────────────
  useEffect(() => {
    unsubRefs.current.forEach(u => u());
    unsubRefs.current = [];
    if (!activeProde) return;

    // Results
    const u1 = fbListen("results", activeProde.id, data => {
      setAdminResults(data || { groups:{}, knockout:{} });
    });

    // Leaderboard
    const u2 = fbListen("leaderboards", activeProde.id, data => {
      if (!data) return setLeaderboard([]);
      const entries = Object.entries(data).sort((a,b)=>b[1]-a[1]);
      setLeaderboard(entries);
    });

    unsubRefs.current = [u1, u2];
    return () => { u1(); u2(); };
  }, [activeProde?.id]);

  // ── AUTH ──────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setFormErr("");
    if (!formName.trim()) return setFormErr("Ingresá un nombre.");
    if (formPass.length < 4) return setFormErr("La contraseña debe tener al menos 4 caracteres.");
    if (formPass !== formPass2) return setFormErr("Las contraseñas no coinciden.");
    setLoading(true);
    const key = formName.trim().toLowerCase().replace(/\s+/g,"_");
    const existing = await fbGet("users", key);
    if (existing) { setLoading(false); return setFormErr("Ese nombre ya está en uso."); }
    await fbSetFull("users", key, { name: formName.trim(), passHash: hashPass(formPass), createdAt: Date.now() });
    setLoading(false);
    showToast("¡Cuenta creada! Ahora podés entrar.");
    setScreen("login");
    setFormPass(""); setFormPass2("");
  };

  const handleLogin = async () => {
    setFormErr("");
    if (!formName.trim() || !formPass) return setFormErr("Completá los campos.");
    setLoading(true);
    const key = formName.trim().toLowerCase().replace(/\s+/g,"_");
    const userData = await fbGet("users", key);
    setLoading(false);
    if (!userData) return setFormErr("Usuario no encontrado.");
    if (userData.passHash !== hashPass(formPass)) return setFormErr("Contraseña incorrecta.");
    const u = { name: userData.name, key };
    setUser(u);
    try { localStorage.setItem("prode_session", JSON.stringify(u)); } catch {}
    setFormPass(""); setFormErr("");
    setScreen("prodeList");
  };

  const handleLogout = () => {
    setUser(null); setActiveProde(null);
    setScreen("login"); setAdminUnlocked(false);
    try { localStorage.removeItem("prode_session"); } catch {}
  };

  // ── ENTER PRODE ───────────────────────────────────────────────────────────
  const enterProde = async (prode) => {
    setLoading(true);
    setActiveProde(prode);
    const saved = await fbGet("predictions", `${prode.id}__${user.key}`);
    setPredictions(saved || { groups:{}, knockout:{}, champion:"", runner:"", third:"" });
    setLoading(false);
    setScreen("prode");
  };

  // ── SAVE PREDICTIONS ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    await fbSetFull("predictions", `${activeProde.id}__${user.key}`, predictions);
    const pts = computePoints(predictions, adminResults);
    await fbSet("leaderboards", activeProde.id, { [user.name]: pts });
    setSaving(false);
    showToast("¡Pronósticos guardados! ⚽");
  };

  // ── PREDICTION SETTERS ────────────────────────────────────────────────────
  const setGroupScore = (g, i, side, val) =>
    setPredictions(p => ({ ...p, groups: { ...p.groups, [g]: { ...(p.groups[g]||{}), [i]: { ...(p.groups[g]?.[i]||{h:"",a:""}), [side]:val } } } }));

  const setKOWinner = (roundId, idx, val) =>
    setPredictions(p => ({ ...p, knockout: { ...p.knockout, [`${roundId}_${idx}`]: val } }));

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const createProde = async () => {
    if (!newProdeName.trim()) return showToast("Nombre requerido", false);
    const id = `prode_${Date.now()}`;
    await fbSetFull("prodes", id, { id, name: newProdeName.trim(), createdAt: Date.now() });
    setNewProdeName("");
    showToast(`Prode "${newProdeName.trim()}" creado ✅`);
  };

  const deleteProde = async (prodeId) => {
    if (!confirm("¿Seguro que querés eliminar este prode?")) return;
    await fbDelete("prodes", prodeId);
    showToast("Prode eliminado");
  };

  const setAdminGroupScore = (g, i, side, val) =>
    setAdminResults(p => ({ ...p, groups: { ...p.groups, [g]: { ...(p.groups[g]||{}), [i]: { ...(p.groups[g]?.[i]||{h:"",a:""}), [side]:val } } } }));

  const saveAdminResults = async () => {
    if (!adminActiveProde) return showToast("Seleccioná un prode", false);
    setSaving(true);
    await fbSetFull("results", adminActiveProde.id, adminResults);
    // Recompute all leaderboard scores
    const lbSnap = await fbGet("leaderboards", adminActiveProde.id);
    if (lbSnap) {
      const newLb = {};
      for (const playerName of Object.keys(lbSnap)) {
        const playerKey = playerName.toLowerCase().replace(/\s+/g,"_");
        const pred = await fbGet("predictions", `${adminActiveProde.id}__${playerKey}`);
        if (pred) newLb[playerName] = computePoints(pred, adminResults);
      }
      await fbSetFull("leaderboards", adminActiveProde.id, newLb);
    }
    setSaving(false);
    showToast("Resultados actualizados ✅");
  };

  const loadAdminProdeResults = async (prode) => {
    setAdminActiveProde(prode);
    const res = await fbGet("results", prode.id);
    setAdminResults(res || { groups:{}, knockout:{} });
  };

  // ── COMPUTED ──────────────────────────────────────────────────────────────
  const myPoints = activeProde ? computePoints(predictions, adminResults) : 0;
  const myRank = leaderboard.findIndex(([n]) => n === user?.name) + 1;
  const completedCount = Object.values(predictions.groups).flatMap(g=>Object.values(g)).filter(m=>m.h!==""&&m.a!=="").length;
  const totalCount = Object.values(GROUPS).reduce((s,g)=>s+g.matches.length,0);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (loading && screen === "login") return <><style>{css}</style><Spinner /></>;

  // ── LOGIN / REGISTER ──────────────────────────────────────────────────────
  if (screen === "login" || screen === "register") {
    const isReg = screen === "register";
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{css}</style>
        <div style={{ ...cardS(), maxWidth:420, width:"92%", padding:36, animation:"fadeIn .3s ease" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:52 }}>⚽</div>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:36, color:C.gold, letterSpacing:3 }}>PRODE 2026</div>
            <div style={{ color:C.muted, fontSize:13 }}>Copa Mundial FIFA · EE.UU. · México · Canadá</div>
          </div>
          <div style={{ display:"flex", marginBottom:20, background:"#0b1623", borderRadius:10, padding:4 }}>
            {["login","register"].map(s=>(
              <button key={s} onClick={()=>{setScreen(s);setFormErr("");}}
                style={{ flex:1, padding:8, border:"none", borderRadius:8, cursor:"pointer", background:screen===s?C.gold:"transparent", color:screen===s?"#0b1623":C.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, transition:"all .2s" }}>
                {s==="login"?"ENTRAR":"REGISTRARSE"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input style={inp} placeholder="Nombre o apodo" value={formName} onChange={e=>setFormName(e.target.value)} />
            <input style={inp} type="password" placeholder="Contraseña" value={formPass} onChange={e=>setFormPass(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!isReg&&handleLogin()} />
            {isReg && <input style={inp} type="password" placeholder="Repetir contraseña" value={formPass2}
              onChange={e=>setFormPass2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRegister()} />}
          </div>
          {formErr && <div style={{ color:"#e74c3c", fontSize:13, marginTop:10, textAlign:"center" }}>{formErr}</div>}
          <button style={{ ...btnS("gold"), width:"100%", marginTop:20, padding:12, fontSize:16, fontFamily:"'Bebas Neue',cursive", letterSpacing:1 }}
            onClick={isReg?handleRegister:handleLogin} disabled={loading}>
            {loading?"CARGANDO...":(isReg?"CREAR CUENTA →":"ENTRAR →")}
          </button>
        </div>
        {toast && <Toast {...toast} />}
      </div>
    );
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ background:"linear-gradient(90deg,#0d1e36,#162d4a)", padding:"11px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`2px solid ${C.gold}`, position:"sticky", top:0, zIndex:100, flexWrap:"wrap", gap:8 }}>
      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:22, color:C.gold, letterSpacing:2, cursor:"pointer" }} onClick={()=>setScreen("prodeList")}>
        ⚽ PRODE 2026
        {activeProde && <span style={{ color:C.muted, fontSize:14, marginLeft:8 }}>· {activeProde.name}</span>}
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {activeProde && ["prode","leaderboard"].map(s=>(
          <button key={s} onClick={()=>setScreen(s)} style={{ ...btnS(screen===s?"gold":"ghost"), padding:"6px 14px", fontSize:13 }}>
            {s==="prode"?"Mis Pronósticos":"🏆 Tabla"}
          </button>
        ))}
        <button onClick={()=>setScreen("prodeList")} style={{ ...btnS("ghost"), padding:"6px 14px", fontSize:13 }}>📋 Prodes</button>
        <button onClick={()=>setScreen("admin")} style={{ ...btnS("ghost"), padding:"6px 14px", fontSize:13 }}>⚙️ Admin</button>
        <div style={{ color:C.muted, fontSize:12, paddingLeft:4 }}>👤 {user?.name}</div>
        <button onClick={handleLogout} style={{ ...btnS("ghost"), padding:"6px 12px", fontSize:12 }}>Salir</button>
      </div>
    </div>
  );

  // ── PRODE LIST ─────────────────────────────────────────────────────────────
  if (screen === "prodeList") return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <style>{css}</style>
      <Header />
      <div style={{ maxWidth:580, margin:"0 auto", padding:"28px 16px" }}>
        <SectionTitle>ELEGÍ UN PRODE</SectionTitle>
        {prodes.length === 0
          ? <div style={{ ...cardS(), textAlign:"center", color:C.muted, padding:40 }}>
              No hay prodes todavía.<br/>Pedile al admin que cree uno.
            </div>
          : prodes.map(p => (
            <div key={p.id} style={{ ...cardS(), display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, borderColor: activeProde?.id===p.id?C.gold:C.cardBorder }}>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:18 }}>{p.name}</div>
                <div style={{ color:C.muted, fontSize:12 }}>Creado: {new Date(p.createdAt).toLocaleDateString("es-AR")}</div>
              </div>
              <button style={btnS("gold")} onClick={()=>enterProde(p)}>ENTRAR →</button>
            </div>
          ))
        }
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );

  // ── LEADERBOARD ───────────────────────────────────────────────────────────
  if (screen === "leaderboard") {
    const medals = ["🥇","🥈","🥉"];
    return (
      <div style={{ minHeight:"100vh", background:C.bg }}>
        <style>{css}</style>
        <Header />
        <div style={{ maxWidth:580, margin:"0 auto", padding:"28px 16px" }}>
          <SectionTitle>TABLA — {activeProde?.name}</SectionTitle>
          <div style={{ color:C.muted, fontSize:12, marginBottom:16 }}>🟢 Se actualiza en tiempo real</div>
          {leaderboard.length === 0
            ? <div style={{ ...cardS(), textAlign:"center", color:C.muted, padding:40 }}>Nadie cargó pronósticos todavía.</div>
            : leaderboard.map(([name, pts], i) => (
              <div key={name} style={{ ...cardS(), display:"flex", alignItems:"center", gap:14, marginBottom:10, border:`1px solid ${name===user?.name?C.gold:C.cardBorder}`, background:name===user?.name?"#162d4a":C.card }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:26, color:C.dim, width:28 }}>{i+1}</div>
                <div style={{ fontSize:20 }}>{medals[i]||"⚽"}</div>
                <div style={{ flex:1, fontWeight:700 }}>
                  {name} {name===user?.name && <span style={{ background:C.gold, color:"#0b1623", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99 }}>Vos</span>}
                </div>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:28, color:C.gold }}>{pts} <span style={{ fontSize:12, color:C.muted }}>pts</span></div>
              </div>
            ))
          }
        </div>
        {toast && <Toast {...toast} />}
      </div>
    );
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  if (screen === "admin") return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <style>{css}</style>
      <Header />
      <div style={{ maxWidth:720, margin:"0 auto", padding:"24px 16px" }}>
        {!adminUnlocked ? (
          <div style={{ ...cardS(), maxWidth:360, margin:"60px auto", textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:24, color:C.gold, marginBottom:16 }}>🔒 ACCESO ADMIN</div>
            <input style={{ ...inp, textAlign:"center", marginBottom:14 }} type="password"
              placeholder="PIN de administrador" value={adminPin}
              onChange={e=>setAdminPin(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&(adminPin===ADMIN_PIN?setAdminUnlocked(true):showToast("PIN incorrecto",false))} />
            <button style={{ ...btnS("gold"), width:"100%" }}
              onClick={()=>adminPin===ADMIN_PIN?setAdminUnlocked(true):showToast("PIN incorrecto",false)}>
              ENTRAR
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            {/* Create prode */}
            <div style={cardS()}>
              <SectionTitle>CREAR NUEVO PRODE</SectionTitle>
              <div style={{ display:"flex", gap:10 }}>
                <input style={{ ...inp, flex:1 }} placeholder='Ej: "Amigos del trabajo"'
                  value={newProdeName} onChange={e=>setNewProdeName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&createProde()} />
                <button style={btnS("gold")} onClick={createProde}>CREAR</button>
              </div>
            </div>

            {/* Manage prodes */}
            <div style={cardS()}>
              <SectionTitle>PRODES EXISTENTES</SectionTitle>
              {prodes.length===0
                ? <div style={{ color:C.muted }}>No hay prodes todavía.</div>
                : prodes.map(p=>(
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, background:"#0b1623", borderRadius:10, padding:"10px 14px", border:`1px solid ${adminActiveProde?.id===p.id?C.gold:C.dim}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700 }}>{p.name}</div>
                      <div style={{ color:C.muted, fontSize:12 }}>{new Date(p.createdAt).toLocaleDateString("es-AR")}</div>
                    </div>
                    <button style={{ ...btnS("ghost"), fontSize:12, padding:"6px 12px" }} onClick={()=>loadAdminProdeResults(p)}>
                      {adminActiveProde?.id===p.id?"✓ Seleccionado":"Cargar resultados"}
                    </button>
                    <button style={{ ...btnS("red"), fontSize:12, padding:"6px 12px" }} onClick={()=>deleteProde(p.id)}>🗑</button>
                  </div>
                ))
              }
            </div>

            {/* Results entry */}
            {adminActiveProde && (
              <div style={cardS()}>
                <SectionTitle>RESULTADOS — {adminActiveProde.name}</SectionTitle>
                <div style={{ display:"flex", flexWrap:"wrap", marginBottom:14 }}>
                  {Object.keys(GROUPS).map(g=>(
                    <Tab key={g} label={`Grupo ${g}`} active={adminGroup===g} onClick={()=>setAdminGroup(g)} />
                  ))}
                </div>
                <div style={{ fontWeight:700, color:C.gold, marginBottom:12, fontSize:14 }}>GRUPO {adminGroup}</div>
                {GROUPS[adminGroup].matches.map(([h,a],idx)=>(
                  <div key={idx} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, background:"#0b1623", borderRadius:10, padding:"8px 12px" }}>
                    <span style={{ flex:1, textAlign:"right", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f(h)}</span>
                    <ScoreBox value={adminResults.groups?.[adminGroup]?.[idx]?.h??""} onChange={v=>setAdminGroupScore(adminGroup,idx,"h",v)} />
                    <span style={{ color:C.dim, fontWeight:700 }}>-</span>
                    <ScoreBox value={adminResults.groups?.[adminGroup]?.[idx]?.a??""} onChange={v=>setAdminGroupScore(adminGroup,idx,"a",v)} />
                    <span style={{ flex:1, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f(a)}</span>
                  </div>
                ))}
                <button style={{ ...btnS("gold"), marginTop:12 }} onClick={saveAdminResults} disabled={saving}>
                  {saving?"GUARDANDO...":"💾 GUARDAR RESULTADOS"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );

  // ── PRODE MAIN ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <style>{css}</style>
      <Header />
      <div style={{ maxWidth:720, margin:"0 auto", padding:"20px 16px" }}>

        {/* Stats */}
        <div style={{ display:"flex", gap:12, marginBottom:22, flexWrap:"wrap" }}>
          {[
            { icon:"⭐", val:myPoints, label:"Mis puntos" },
            { icon:"✅", val:`${completedCount}/${totalCount}`, label:"Completados" },
            { icon:"🏆", val:myRank?`${myRank}°`:"—", label:"Posición" },
          ].map(({icon,val,label})=>(
            <div key={label} style={{ ...cardS({ padding:"14px 10px", marginBottom:0, flex:1, minWidth:110, textAlign:"center" }) }}>
              <div style={{ fontSize:20 }}>{icon}</div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:26, color:C.gold }}>{val}</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Groups */}
        <SectionTitle>FASE DE GRUPOS</SectionTitle>
        <div style={{ display:"flex", flexWrap:"wrap", marginBottom:14 }}>
          {Object.keys(GROUPS).map(g=><Tab key={g} label={`Grupo ${g}`} active={activeGroup===g} onClick={()=>setActiveGroup(g)} />)}
        </div>
        <div style={cardS()}>
          <div style={{ fontWeight:800, color:C.gold, fontSize:15, marginBottom:14, fontFamily:"'Barlow Condensed',sans-serif" }}>
            GRUPO {activeGroup} — {GROUPS[activeGroup].teams.join(" · ")}
          </div>
          {GROUPS[activeGroup].matches.map(([h,a],idx)=>{
            const pred = predictions.groups?.[activeGroup]?.[idx]||{h:"",a:""};
            const actual = adminResults.groups?.[activeGroup]?.[idx];
            const pts = actual ? scoreMatch(pred, actual) : null;
            return (
              <div key={idx} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, background:"#0b1623", borderRadius:10, padding:"8px 12px", border:`1px solid ${pts===3?C.green:pts===1?C.orange:pts===0&&actual?C.red:C.dim}` }}>
                <span style={{ flex:1, textAlign:"right", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f(h)}</span>
                <ScoreBox value={pred.h} onChange={v=>setGroupScore(activeGroup,idx,"h",v)} />
                <div style={{ textAlign:"center", minWidth:28 }}>
                  <div style={{ color:C.dim, fontWeight:700, fontSize:13 }}>-</div>
                  <PtsBadge pts={pts} />
                </div>
                <ScoreBox value={pred.a} onChange={v=>setGroupScore(activeGroup,idx,"a",v)} />
                <span style={{ flex:1, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f(a)}</span>
              </div>
            );
          })}
        </div>

        {/* Knockout */}
        <SectionTitle>FASE ELIMINATORIA</SectionTitle>
        <div style={{ display:"flex", flexWrap:"wrap", marginBottom:14 }}>
          {KNOCKOUT_ROUNDS.map(r=><Tab key={r.id} label={r.label} active={activeKO===r.id} onClick={()=>setActiveKO(r.id)} />)}
        </div>
        {(() => {
          const round = KNOCKOUT_ROUNDS.find(r=>r.id===activeKO);
          return (
            <div style={cardS()}>
              <div style={{ fontWeight:800, color:C.gold, fontSize:15, marginBottom:14, fontFamily:"'Barlow Condensed',sans-serif" }}>
                {round.label.toUpperCase()}
              </div>
              {Array.from({length:round.matches}).map((_,idx)=>(
                <div key={idx} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginBottom:4 }}>PARTIDO {idx+1}</div>
                  <input style={inp} placeholder="Escribí el ganador..."
                    value={predictions.knockout?.[`${round.id}_${idx}`]||""}
                    onChange={e=>setKOWinner(round.id,idx,e.target.value)} />
                </div>
              ))}
            </div>
          );
        })()}

        {/* Final predictions */}
        <SectionTitle>🏆 PREDICCIONES FINALES</SectionTitle>
        <div style={cardS()}>
          {[
            {key:"champion",label:"🥇 Campeón del Mundo",pts:"6 pts"},
            {key:"runner",  label:"🥈 Subcampeón",       pts:"3 pts"},
            {key:"third",   label:"🥉 Tercer Puesto",    pts:"2 pts"},
          ].map(({key,label,pts})=>(
            <div key={key} style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:C.muted, marginBottom:5 }}>
                {label} <span style={{ background:C.gold, color:"#0b1623", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:99 }}>{pts}</span>
              </div>
              <input style={inp} placeholder="Nombre del equipo..."
                value={predictions[key]||""} onChange={e=>setPredictions(p=>({...p,[key]:e.target.value}))} />
            </div>
          ))}
        </div>

        {/* Save */}
        <div style={{ textAlign:"center", marginTop:28, paddingBottom:32 }}>
          <button style={{ ...btnS("gold"), fontSize:18, padding:"14px 48px", fontFamily:"'Bebas Neue',cursive", letterSpacing:1 }}
            onClick={handleSave} disabled={saving}>
            {saving?"GUARDANDO...":"💾 GUARDAR MIS PRONÓSTICOS"}
          </button>
          <div style={{ color:C.muted, fontSize:12, marginTop:8 }}>
            Podés volver a editar antes de que empiece cada partido.
          </div>
        </div>
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );
}
