/* Portale Cliente v1.4.0 — attivazione automatica clienti (inviti dal gestionale) */
"use strict";
const { useState, useEffect, useMemo, useRef } = React;
/* ═══ DESIGN TOKENS ═══════════════════════════════════════════ */
const C = {
    bg: "#0a0a0e",
    card: "#141418",
    card2: "#0F0F14",
    border: "#1e2a3a",
    borderL: "#2a3040",
    text: "#e2e8f0",
    text2: "#94a3b8",
    text3: "#64748b",
    accent: "#2DD4BF",
    accentDim: "#0d9488",
    ok: "#22c55e",
    warn: "#f59e0b",
    err: "#ef4444",
    purple: "#a855f7",
    cyan: "#06b6d4",
};
/* ═══ HELPERS ═════════════════════════════════════════════════ */
const daysBetween = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
    if (!iso)
        return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtDateLong = (iso) => {
    if (!iso)
        return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
/* ═══ ANIMATED COUNTER ═══════════════════════════════════════ */
const AnimCounter = ({ value, duration = 800 }) => {
    const [v, setV] = useState(0);
    useEffect(() => {
        let start = null, from = v;
        const step = (ts) => {
            if (!start)
                start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setV(Math.round(from + (value - from) * eased));
            if (progress < 1)
                requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [value]);
    return v;
};
/* ═══ SUPABASE (cloud + login magico) ═════════════════════════ */
const SUPA_URL = 'https://gkkkcbwttkxecaacqvwp.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdra2tjYnd0dGt4ZWNhYWNxdndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDIzMTksImV4cCI6MjA5NTYxODMxOX0.MkhQ-9XAeCGPNoqlKwygT5AQp6LBDhDEUSUXuhdhz9I';
let _sb = null;
const sb = () => {
    if (!_sb && window.supabase) {
        _sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, {
            auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: "implicit" }
        });
    }
    return _sb;
};
const h = React.createElement;
const PORTAL_VER = "1.4.0";

/* ═══ LOGIN MAGICO ════════════════════════════════════════════ */
const MagicLogin = () => {
    const [mode, setMode] = useState("magic");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const sendMagic = async () => {
        setErr(""); const e = email.trim();
        if (!e || e.indexOf("@") < 0) { setErr("Inserisci un'email valida"); return; }
        const client = sb();
        if (!client) { setErr("Servizio non disponibile. Riprova tra poco."); return; }
        setBusy(true);
        try {
            const res = await client.auth.signInWithOtp({ email: e, options: { emailRedirectTo: window.location.origin } });
            if (res && res.error) { setErr(res.error.message); setBusy(false); return; }
            setSent(true);
        } catch (ex) { setErr("Errore: " + ((ex && ex.message) ? ex.message : ex)); }
        setBusy(false);
    };
    const signPw = async () => {
        setErr(""); const e = email.trim();
        if (!e || e.indexOf("@") < 0) { setErr("Inserisci un'email valida"); return; }
        if (!pw) { setErr("Inserisci la password"); return; }
        const client = sb();
        if (!client) { setErr("Servizio non disponibile."); return; }
        setBusy(true);
        try {
            const res = await client.auth.signInWithPassword({ email: e, password: pw });
            if (res && res.error) { setErr(res.error.message); setBusy(false); return; }
        } catch (ex) { setErr("Errore: " + ((ex && ex.message) ? ex.message : ex)); }
        setBusy(false);
    };
    const inputStyle = { width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.borderL}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", marginBottom: 10 };
    const btnStyle = (b) => ({ width: "100%", background: b ? C.borderL : `linear-gradient(135deg,${C.accent},${C.accentDim})`, color: b ? C.text2 : "#04231f", border: "none", borderRadius: 10, padding: "13px", fontWeight: 800, fontSize: 14, cursor: b ? "default" : "pointer" });
    if (sent) {
        return h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", textAlign: "center" } },
            h("div", { style: { fontSize: 38, marginBottom: 10 } }, "\uD83D\uDCE7"),
            h("div", { style: { fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 } }, "Controlla la tua email"),
            h("div", { style: { fontSize: 13, color: C.text2, lineHeight: 1.5 } }, "Ti abbiamo inviato un link di accesso a ", h("strong", { style: { color: C.text } }, email), ". Aprilo da questo dispositivo per entrare."),
            h("button", { onClick: () => setSent(false), style: { marginTop: 16, background: "none", border: "none", color: C.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" } }, "Indietro"));
    }
    return h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", marginBottom: 16 } },
        h("div", { style: { fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 } }, "Accedi al portale"),
        h("div", { style: { fontSize: 12, color: C.text2, marginBottom: 16, lineHeight: 1.5 } }, mode === "magic" ? "Inserisci la tua email: ti invieremo un link per entrare, senza password." : "Accedi con email e password."),
        h("input", { type: "email", inputMode: "email", autoCapitalize: "off", autoCorrect: "off", placeholder: "La tua email", value: email, onChange: e => setEmail(e.target.value), onKeyDown: e => { if (e.key === "Enter" && mode === "magic") sendMagic(); }, style: inputStyle }),
        mode === "password" && h("input", { type: "password", placeholder: "Password", value: pw, onChange: e => setPw(e.target.value), onKeyDown: e => { if (e.key === "Enter") signPw(); }, style: inputStyle }),
        err && h("div", { style: { padding: "8px 12px", background: `${C.err}15`, border: `1px solid ${C.err}55`, borderRadius: 8, color: C.err, fontSize: 12, marginBottom: 10 } }, err),
        h("button", { onClick: mode === "magic" ? sendMagic : signPw, disabled: busy, style: btnStyle(busy) }, busy ? "Attendi\u2026" : (mode === "magic" ? "Invia link di accesso" : "Entra")),
        h("div", { onClick: () => { setErr(""); setMode(mode === "magic" ? "password" : "magic"); }, style: { marginTop: 12, textAlign: "center", fontSize: 12, color: C.accent, fontWeight: 700, cursor: "pointer" } }, mode === "magic" ? "Accedi con password" : "Usa il link via email"),
        h("div", { style: { marginTop: 14, textAlign: "center", fontSize: 10, color: C.text3, letterSpacing: 1 } }, "Portale v" + PORTAL_VER));
};

/* ═══ HOME CLOUD (dopo login) ═════════════════════════════════ */
const toCamel = (row) => {
    if (!row || typeof row !== "object") return row;
    const out = {};
    for (const k in row) out[k.replace(/_([a-z0-9])/g, function (_, c) { return c.toUpperCase(); })] = row[k];
    return out;
};

/* ═══ SCANNER QR (fotocamera) ═════════════════════════════════ */
const Scanner = ({ onResult, onClose }) => {
    const videoRef = useRef(null);
    const [err, setErr] = useState("");
    useEffect(() => {
        let stream = null, raf = null, detector = null, stopped = false, jsqr = false, canvas = null, ctx = null;
        const stop = () => { stopped = true; if (raf) cancelAnimationFrame(raf); if (stream) { try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} } };
        const done = (text) => { if (stopped || !text) return; stop(); onResult(text); };
        const loadJsQR = () => new Promise(function (res) {
            if (window.jsQR) return res(true);
            const sc = document.createElement("script");
            sc.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js";
            sc.onload = function () { res(true); }; sc.onerror = function () { res(false); };
            document.head.appendChild(sc);
        });
        (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                const v = videoRef.current; if (!v) { stop(); return; }
                v.srcObject = stream; v.setAttribute("playsinline", "true"); v.muted = true;
                try { await v.play(); } catch (e) {}
                if ("BarcodeDetector" in window) { try { detector = new window.BarcodeDetector({ formats: ["qr_code"] }); } catch (e) { detector = null; } }
                if (!detector) {
                    const ok = await loadJsQR(); jsqr = ok && !!window.jsQR;
                    canvas = document.createElement("canvas"); ctx = canvas.getContext("2d", { willReadFrequently: true });
                    if (!jsqr) setErr("Scanner non supportato qui. Apri il QR con la fotocamera del telefono.");
                }
                const tick = async () => {
                    if (stopped) return;
                    try {
                        if (detector) {
                            const codes = await detector.detect(v);
                            if (codes && codes.length) return done(codes[0].rawValue);
                        } else if (jsqr && v.videoWidth) {
                            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
                            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const code = window.jsQR(img.data, img.width, img.height);
                            if (code && code.data) return done(code.data);
                        }
                    } catch (e) {}
                    raf = requestAnimationFrame(tick);
                };
                raf = requestAnimationFrame(tick);
            } catch (e) {
                setErr("Impossibile accedere alla fotocamera. Concedi il permesso e riprova.");
            }
        })();
        return stop;
    }, []);
    return h("div", { style: { position: "fixed", inset: 0, background: "#000", zIndex: 9999, display: "flex", flexDirection: "column" } },
        h("div", { style: { padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", color: C.text } },
            h("div", { style: { fontSize: 13, fontWeight: 700 } }, "Inquadra il QR della macchina"),
            h("button", { onClick: onClose, style: { background: C.card, border: "1px solid " + C.borderL, color: C.text2, borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" } }, "Chiudi")),
        h("div", { style: { flex: 1, position: "relative", overflow: "hidden" } },
            h("video", { ref: videoRef, muted: true, playsInline: true, style: { width: "100%", height: "100%", objectFit: "cover" } }),
            h("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "68vw", maxWidth: 300, height: "68vw", maxHeight: 300, border: "3px solid " + C.accent, borderRadius: 18, boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" } })),
        err && h("div", { style: { padding: "14px 18px", background: C.err + "22", color: C.err, fontSize: 12, textAlign: "center" } }, err));
};

/* ═══ HOME CLOUD (lista macchine + storico + scanner) ════════ */
const CloudHome = ({ onLogout }) => {
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [customer, setCustomer] = useState(null);
    const [linked, setLinked] = useState(true);
    const [err, setErr] = useState("");
    const [assets, setAssets] = useState([]);
    const [iecReports, setIec] = useState([]);
    const [funcReports, setFunc] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selId, setSelId] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanMsg, setScanMsg] = useState("");
    useEffect(() => {
        (async () => {
            const client = sb();
            if (!client) { setErr("Servizio non disponibile."); setLoading(false); return; }
            try {
                const u = await client.auth.getUser();
                setEmail((u && u.data && u.data.user && u.data.user.email) || "");
                const cust = await client.from("customers").select("*");
                if (cust && cust.error) { setErr(cust.error.message); setLoading(false); return; }
                let rows = (cust && cust.data) || [];
                if (rows.length === 0) {
                    // Primo accesso: provo l'attivazione automatica (invito creato dal tecnico)
                    try {
                        const act = await client.rpc("attiva_accesso_cliente");
                        if (act && typeof act.data === "string" && act.data.indexOf("OK") === 0) {
                            const cust2 = await client.from("customers").select("*");
                            rows = (cust2 && cust2.data) || [];
                        }
                    } catch (e) { }
                }
                if (rows.length === 0) { setLinked(false); setLoading(false); return; }
                setCustomer(toCamel(rows[0]));
                const res = await Promise.all([
                    client.from("assets").select("*"),
                    client.from("iec_reports").select("*"),
                    client.from("func_reports").select("*"),
                    client.from("jobs").select("*")
                ]);
                setAssets(((res[0] && res[0].data) || []).map(toCamel));
                setIec(((res[1] && res[1].data) || []).map(toCamel));
                setFunc(((res[2] && res[2].data) || []).map(toCamel));
                setJobs(((res[3] && res[3].data) || []).map(toCamel));
            } catch (ex) { setErr("Errore: " + ((ex && ex.message) ? ex.message : ex)); }
            setLoading(false);
        })();
    }, []);
    const header = h("div", { style: { borderBottom: "1px solid " + C.border, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" } },
        h("div", { style: { fontSize: 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 } }, "Portale Cliente"),
        h("button", { onClick: onLogout, style: { background: C.card, border: "1px solid " + C.borderL, color: C.text2, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Esci"));
    const Frame = (inner) => h("div", { style: { minHeight: "100vh", background: "radial-gradient(circle at 50% 0%, " + C.accent + "11 0%, " + C.bg + " 60%)", display: "flex", flexDirection: "column" } }, header, inner);
    const Shell = (inner) => Frame(h("div", { className: "fade-in", style: { flex: 1, padding: 20, maxWidth: 560, width: "100%", margin: "0 auto", boxSizing: "border-box" } }, inner));
    if (loading) return Shell(h("div", { className: "skel", style: { height: 120, borderRadius: 16 } }));
    if (err) return Shell(h("div", { style: { padding: "16px", background: C.err + "15", border: "1px solid " + C.err + "55", borderRadius: 12, color: C.err, fontSize: 13 } }, err));
    if (!linked) return Shell(h("div", { style: { background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: "28px 24px", textAlign: "center" } },
        h("div", { style: { fontSize: 38, marginBottom: 10 } }, "\u23F3"),
        h("div", { style: { fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 } }, "Accesso effettuato"),
        h("div", { style: { fontSize: 13, color: C.text2, lineHeight: 1.5 } }, "Il tuo account (", h("strong", { style: { color: C.text } }, email), ") non \u00E8 ancora collegato a un cliente. Chiedi al tuo tecnico di abilitare il portale con questa email; poi esci e rientra.")));
    if (selId) {
        const a = assets.find(function (x) { return x.id === selId; });
        if (a) return Frame(h(AssetDetail, { asset: a, customer: customer, iecReports: iecReports, funcReports: funcReports, jobs: jobs, onBack: function () { setSelId(null); } }));
    }
    const lastOf = (arr, aid) => arr.filter(function (r) { return r.assetId === aid; }).sort(function (p, q) { return new Date(q.date) - new Date(p.date); })[0] || null;
    const sortedAssets = assets.slice().sort(function (x, y) { return (x.name || "").localeCompare(y.name || ""); });
    const onScanResult = (text) => {
        setScanning(false);
        let id = text || "";
        const m = id.match(/asset=([^&\s]+)/);
        if (m) { try { id = decodeURIComponent(m[1]); } catch (e) { id = m[1]; } }
        const found = assets.find(function (a) { return a.id === id; });
        if (found) { setSelId(found.id); setScanMsg(""); }
        else { setScanMsg("Apparecchio non trovato tra i tuoi. Riprova o contatta il tecnico."); }
    };
    const home = h(React.Fragment, null,
        h("div", { style: { background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: "22px 20px", marginBottom: 14 } },
            h("div", { style: { fontSize: 13, color: C.text3, marginBottom: 4 } }, "Benvenuto"),
            h("div", { style: { fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 2 } }, (customer && customer.name) || "Cliente"),
            h("div", { style: { fontSize: 12, color: C.text2 } }, email)),
        h("button", { onClick: function () { setScanMsg(""); setScanning(true); }, style: { width: "100%", marginBottom: 14, background: C.accent, color: "#06251f", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, "\uD83D\uDCF7 Scansiona una macchina"),
        scanMsg && h("div", { style: { marginBottom: 14, padding: "12px 14px", background: C.warn + "18", border: "1px solid " + C.warn + "55", borderRadius: 10, color: C.warn, fontSize: 12 } }, scanMsg),
        h("div", { style: { fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, margin: "4px 2px 10px" } }, assets.length + (assets.length === 1 ? " apparecchio" : " apparecchi")),
        assets.length === 0
            ? h(Empty, { msg: "Nessun apparecchio collegato al tuo account." })
            : h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
                sortedAssets.map(function (a) { return h(AssetCard, { key: a.id, asset: a, lastIec: lastOf(iecReports, a.id), lastFunc: lastOf(funcReports, a.id), nextService: a.nextService, onClick: function () { setSelId(a.id); } }); })));
    return h(React.Fragment, null,
        scanning && h(Scanner, { onResult: onScanResult, onClose: function () { setScanning(false); } }),
        Shell(home));
};

/* ═══ LANDING / UPLOAD ════════════════════════════════════════ */
const Landing = ({ onLoad }) => {
    const fileRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [err, setErr] = useState("");
    const tryLoad = (file) => {
        setErr("");
        if (!file) {
            setErr("Nessun file selezionato");
            return;
        }
        if (!file.name.endsWith(".json")) {
            setErr("Il file deve essere in formato .json");
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                // Verifica formato MedTrace minimo
                if (!data.assets && !data.customers) {
                    setErr("Il file non sembra un backup valido");
                    return;
                }
                // Salva temporaneamente in sessionStorage per refresh
                try {
                    sessionStorage.setItem("portale-data", JSON.stringify(data));
                }
                catch (e) { }
                onLoad(data);
            }
            catch (err) {
                setErr("File non valido: " + err.message);
            }
        };
        reader.onerror = () => setErr("Impossibile leggere il file");
        reader.readAsText(file);
    };
    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        tryLoad(e.dataTransfer.files[0]);
    };
    return (React.createElement("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: `radial-gradient(circle at 50% 0%, ${C.accent}11 0%, ${C.bg} 60%)` } },
        React.createElement("div", { className: "fade-in", style: { maxWidth: 520, width: "100%" } },
            React.createElement("div", { style: { textAlign: "center", marginBottom: 32 } },
                React.createElement("div", { style: { display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16 } },
                    React.createElement("svg", { width: "42", height: "42", viewBox: "0 0 60 60", style: { display: "block" } },
                        React.createElement("defs", null,
                            React.createElement("linearGradient", { id: "g1", x1: "0", y1: "0", x2: "1", y2: "1" },
                                React.createElement("stop", { offset: "0%", stopColor: C.accent }),
                                React.createElement("stop", { offset: "100%", stopColor: C.accentDim }))),
                        React.createElement("circle", { cx: "30", cy: "30", r: "28", fill: "none", stroke: "url(#g1)", strokeWidth: "2" }),
                        React.createElement("path", { d: "M15 30 Q22 22 30 30 Q38 38 45 30", fill: "none", stroke: "url(#g1)", strokeWidth: "2.5", strokeLinecap: "round" }),
                        React.createElement("circle", { cx: "30", cy: "30", r: "4", fill: C.accent })),
                    React.createElement("div", { style: { textAlign: "left" } },
                        React.createElement("div", { style: { fontSize: 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 } }, "Portale Cliente"),
                        React.createElement("div", { style: { fontSize: 13, color: C.text2 } }, "Stato del tuo parco apparecchi")))),
            React.createElement(MagicLogin, null),
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, margin: "2px 0 16px" } }, React.createElement("div", { style: { flex: 1, height: 1, background: C.border } }), React.createElement("span", { style: { fontSize: 11, color: C.text3, fontWeight: 700 } }, "oppure"), React.createElement("div", { style: { flex: 1, height: 1, background: C.border } })),
            React.createElement("div", { onDragOver: e => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onDrop: onDrop, onClick: () => { var _a; return (_a = fileRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, style: {
                    background: dragOver ? `${C.accent}11` : C.card,
                    border: `2px dashed ${dragOver ? C.accent : C.border}`,
                    borderRadius: 16,
                    padding: "40px 24px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all .2s",
                    marginBottom: 16,
                } },
                React.createElement("div", { style: { fontSize: 42, marginBottom: 12, opacity: .6 } }, "\uD83D\uDCC1"),
                React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 } }, "Carica il tuo report"),
                React.createElement("div", { style: { fontSize: 12, color: C.text2, lineHeight: 1.5 } },
                    "Trascina qui il file .json fornito dal tuo tecnico",
                    React.createElement("br", null),
                    "oppure tocca per selezionarlo"),
                React.createElement("input", { ref: fileRef, type: "file", accept: ".json,application/json", style: { display: "none" }, onChange: e => tryLoad(e.target.files[0]) })),
            err && (React.createElement("div", { style: { padding: "10px 14px", background: `${C.err}15`, border: `1px solid ${C.err}55`, borderRadius: 8, color: C.err, fontSize: 12, marginBottom: 16 } }, err)),
            React.createElement("div", { style: { padding: "14px 16px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 11, color: C.text2, lineHeight: 1.6 } },
                React.createElement("div", { style: { color: C.accent, fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 } }, "Privacy"),
                "Con l'accesso via email i tuoi dati vengono letti in modo sicuro: vedi solo i tuoi. In alternativa, il file che ti invia il tecnico resta sul tuo dispositivo."))));
};
/* ═══ STAT CARD ═══════════════════════════════════════════════ */
const StatCard = ({ label, value, sub, color, icon }) => (React.createElement("div", { className: "fade-in", style: {
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
    } },
    React.createElement("div", { style: { position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `${color}11`, borderRadius: "50%" } }),
    React.createElement("div", { style: { position: "relative" } },
        React.createElement("div", { style: { fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 6 } }, label),
        React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 6 } },
            React.createElement("div", { style: { fontSize: 30, fontWeight: 900, color, fontFamily: "-apple-system,SF Pro Display,system-ui", lineHeight: 1 } },
                React.createElement(AnimCounter, { value: value })),
            icon && React.createElement("span", { style: { fontSize: 14, color } }, icon)),
        sub && React.createElement("div", { style: { fontSize: 11, color: C.text2, marginTop: 6 } }, sub))));
/* ═══ STATUS PILL ═════════════════════════════════════════════ */
const Pill = ({ children, color }) => (React.createElement("span", { style: {
        display: "inline-flex", alignItems: "center", gap: 4,
        background: `${color}22`, color, border: `1px solid ${color}44`,
        borderRadius: 20, padding: "2px 10px",
        fontSize: 10, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase",
        whiteSpace: "nowrap"
    } }, children));
/* ═══ ASSET CARD ══════════════════════════════════════════════ */
const AssetCard = ({ asset, lastIec, lastFunc, nextService, onClick }) => {
    const daysToService = nextService ? daysBetween(nextService, todayISO()) : null;
    const serviceColor = daysToService === null ? C.text3 :
        daysToService < 0 ? C.err :
            daysToService <= 7 ? C.warn :
                daysToService <= 30 ? "#facc15" : C.ok;
    return (React.createElement("div", { onClick: onClick, className: "fade-in", style: {
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "all .2s",
            position: "relative",
            overflow: "hidden",
        }, onMouseEnter: e => e.currentTarget.style.borderColor = C.accent + "66", onMouseLeave: e => e.currentTarget.style.borderColor = C.border },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 } },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3, lineHeight: 1.3 } }, asset.name || "Apparecchio senza nome"),
                (asset.brand || asset.model) && React.createElement("div", { style: { fontSize: 12, color: C.text2 } }, [asset.brand, asset.model].filter(Boolean).join(" ")),
                asset.serial && React.createElement("div", { style: { fontSize: 10, color: C.text3, fontFamily: "monospace", marginTop: 3 } },
                    "S/N: ",
                    asset.serial)),
            React.createElement(Pill, { color: asset.status === "operativo" ? C.ok : asset.status === "in manutenzione" ? C.warn : C.err }, asset.status || "n/d")),
        asset.location && React.createElement("div", { style: { fontSize: 11, color: C.text3, marginBottom: 10 } },
            "\uD83D\uDCCD ",
            asset.location),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "8px 0", borderTop: `1px solid ${C.border}` } },
            React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: .8, fontWeight: 700 } }, "Ultima sicurezza"),
                React.createElement("div", { style: { fontSize: 11, color: lastIec ? (lastIec.overallPass ? C.ok : C.err) : C.text3, fontWeight: 600, marginTop: 2 } }, lastIec ? (lastIec.overallPass ? `✓ ${fmtDate(lastIec.date)}` : `✗ ${fmtDate(lastIec.date)}`) : "Mai eseguita")),
            React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: .8, fontWeight: 700 } }, "Ultima funzionale"),
                React.createElement("div", { style: { fontSize: 11, color: lastFunc ? (lastFunc.overallPass ? C.ok : C.err) : C.text3, fontWeight: 600, marginTop: 2 } }, lastFunc ? (lastFunc.overallPass ? `✓ ${fmtDate(lastFunc.date)}` : `✗ ${fmtDate(lastFunc.date)}`) : "Mai eseguita"))),
        nextService && (React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 11 } },
            React.createElement("span", { style: { color: C.text3 } }, "Prossima manutenzione"),
            React.createElement("span", { style: { color: serviceColor, fontWeight: 700 } }, daysToService < 0 ? `Scaduta da ${Math.abs(daysToService)}gg` :
                daysToService === 0 ? "Oggi" :
                    daysToService === 1 ? "Domani" :
                        `Tra ${daysToService} giorni`)))));
};
/* ═══ RICHIESTA INTERVENTO ════════════════════════════════════ */
const fileToDataURL = (file, maxDim, quality) => new Promise(function (resolve) {
    const reader = new FileReader();
    reader.onload = function () {
        const img = new Image();
        img.onload = function () {
            let w = img.width, hh = img.height;
            if (w > maxDim || hh > maxDim) { if (w >= hh) { hh = Math.round(hh * maxDim / w); w = maxDim; } else { w = Math.round(w * maxDim / hh); hh = maxDim; } }
            const cv = document.createElement("canvas"); cv.width = w; cv.height = hh;
            cv.getContext("2d").drawImage(img, 0, 0, w, hh);
            try { resolve(cv.toDataURL("image/jpeg", quality)); } catch (e) { resolve(reader.result); }
        };
        img.onerror = function () { resolve(reader.result); };
        img.src = reader.result;
    };
    reader.onerror = function () { resolve(null); };
    reader.readAsDataURL(file);
});
const URG = [
    { v: "normale", label: "Normale", color: C.text2 },
    { v: "urgente", label: "Urgente", color: C.warn },
    { v: "fermo_macchina", label: "Fermo macchina", color: C.err }
];
const URG_LABEL = { normale: "Normale", urgente: "Urgente", fermo_macchina: "Fermo macchina" };
const REQ_STATUS = { nuova: "Inviata", presa_in_carico: "Presa in carico", convertita: "In lavorazione", chiusa: "Chiusa" };
const RequestForm = ({ asset }) => {
    const [reqs, setReqs] = useState([]);
    const [loadingReqs, setLoadingReqs] = useState(true);
    const [open, setOpen] = useState(false);
    const [desc, setDesc] = useState("");
    const [urg, setUrg] = useState("normale");
    const [photo, setPhoto] = useState(null);
    const [contact, setContact] = useState("");
    const [sending, setSending] = useState(false);
    const [err, setErr] = useState("");
    const loadReqs = async () => {
        const client = sb(); if (!client) { setLoadingReqs(false); return; }
        try {
            const r = await client.from("richieste").select("*").eq("asset_id", asset.id).order("created_at", { ascending: false });
            setReqs(((r && r.data) || []).map(toCamel));
        } catch (e) {}
        setLoadingReqs(false);
    };
    useEffect(() => { loadReqs(); }, [asset.id]);
    const onPhoto = async (e) => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        const d = await fileToDataURL(f, 1200, 0.7); setPhoto(d);
    };
    const submit = async () => {
        if (!desc.trim() || sending) return;
        setSending(true); setErr("");
        const client = sb();
        try {
            const ins = await client.from("richieste").insert({ asset_id: asset.id, description: desc.trim(), urgency: urg, photo: photo, contact: contact.trim() || null });
            if (ins && ins.error) { setErr(ins.error.message); setSending(false); return; }
            setDesc(""); setUrg("normale"); setPhoto(null); setContact(""); setOpen(false);
            await loadReqs();
        } catch (e) { setErr((e && e.message) ? e.message : "Errore di invio."); }
        setSending(false);
    };
    const lbl = (t) => h("div", { style: { fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: .8, fontWeight: 700, margin: "12px 0 6px" } }, t);
    return h("div", { style: { marginBottom: 4 } },
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid " + C.border } },
            h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                h("span", { style: { fontSize: 14, color: C.accent } }, "\uD83D\uDEE0"),
                h("span", { style: { fontSize: 12, fontWeight: 800, color: C.text, textTransform: "uppercase", letterSpacing: .8 } }, "Richieste di intervento")),
            reqs.length > 0 && h("span", { style: { fontSize: 11, color: C.text3, fontFamily: "monospace" } }, reqs.length)),
        !loadingReqs && reqs.length > 0 && h("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 } },
            reqs.map(function (r) {
                const sc = r.status === "chiusa" ? C.ok : (r.status === "nuova" ? C.accent : C.warn);
                return h("div", { key: r.id, style: { background: C.card2, border: "1px solid " + C.border, borderLeft: "3px solid " + sc, borderRadius: 8, padding: "10px 14px" } },
                    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, gap: 8 } },
                        h(Pill, { color: r.urgency === "fermo_macchina" ? C.err : (r.urgency === "urgente" ? C.warn : C.text2) }, URG_LABEL[r.urgency] || r.urgency),
                        h(Pill, { color: sc }, REQ_STATUS[r.status] || r.status)),
                    h("div", { style: { fontSize: 11, color: C.text3, marginBottom: 3 } }, fmtDateLong(r.createdAt)),
                    r.description && h("div", { style: { fontSize: 12, color: C.text, lineHeight: 1.4 } }, r.description));
            })),
        !open && h("button", { onClick: function () { setOpen(true); setErr(""); }, style: { width: "100%", background: "transparent", color: C.accent, border: "1px solid " + C.accent + "66", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" } }, "\uD83D\uDEE0 Richiedi intervento"),
        open && h("div", { style: { background: C.card2, border: "1px solid " + C.border, borderRadius: 12, padding: "14px 16px" } },
            h("div", { style: { fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: .8, fontWeight: 700, marginBottom: 6 } }, "Descrivi il problema"),
            h("textarea", { value: desc, onChange: function (e) { setDesc(e.target.value); }, rows: 3, placeholder: "Es. la macchina non si accende, allarme sul display\u2026", style: { width: "100%", boxSizing: "border-box", background: C.bg, border: "1px solid " + C.borderL, borderRadius: 8, color: C.text, fontSize: 13, padding: "10px 12px", resize: "vertical", fontFamily: "inherit" } }),
            lbl("Urgenza"),
            h("div", { style: { display: "flex", gap: 6 } }, URG.map(function (o) {
                const on = urg === o.v;
                return h("button", { key: o.v, onClick: function () { setUrg(o.v); }, style: { flex: 1, background: on ? (o.color + "22") : "transparent", color: on ? o.color : C.text2, border: "1px solid " + (on ? (o.color + "88") : C.borderL), borderRadius: 8, padding: "9px 4px", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, o.label);
            })),
            lbl("Foto (opzionale)"),
            photo
                ? h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                    h("img", { src: photo, style: { width: 54, height: 54, objectFit: "cover", borderRadius: 8, border: "1px solid " + C.border } }),
                    h("button", { onClick: function () { setPhoto(null); }, style: { background: "transparent", color: C.err, border: "1px solid " + C.err + "55", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Rimuovi"))
                : h("label", { style: { display: "inline-block", color: C.text2, border: "1px dashed " + C.borderL, borderRadius: 8, padding: "10px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "\uD83D\uDCF7 Aggiungi foto",
                    h("input", { type: "file", accept: "image/*", capture: "environment", onChange: onPhoto, style: { display: "none" } })),
            lbl("Contatto (opzionale)"),
            h("input", { value: contact, onChange: function (e) { setContact(e.target.value); }, placeholder: "Nome / telefono di riferimento", style: { width: "100%", boxSizing: "border-box", background: C.bg, border: "1px solid " + C.borderL, borderRadius: 8, color: C.text, fontSize: 13, padding: "10px 12px" } }),
            err && h("div", { style: { marginTop: 10, padding: "10px 12px", background: C.err + "18", border: "1px solid " + C.err + "55", borderRadius: 8, color: C.err, fontSize: 12 } }, err),
            h("div", { style: { display: "flex", gap: 8, marginTop: 14 } },
                h("button", { onClick: function () { setOpen(false); setErr(""); }, style: { flex: 1, background: "transparent", color: C.text2, border: "1px solid " + C.borderL, borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer" } }, "Annulla"),
                h("button", { onClick: submit, disabled: sending || !desc.trim(), style: { flex: 2, background: (sending || !desc.trim()) ? C.borderL : C.accent, color: (sending || !desc.trim()) ? C.text3 : "#06251f", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 800, cursor: (sending || !desc.trim()) ? "default" : "pointer" } }, sending ? "Invio\u2026" : "Invia richiesta"))));
};

/* ═══ ASSET DETAIL VIEW ══════════════════════════════════════ */
const AssetDetail = ({ asset, customer, iecReports, funcReports, jobs, onBack }) => {
    const myIec = iecReports.filter(r => r.assetId === asset.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const myFunc = funcReports.filter(r => r.assetId === asset.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const myJobs = jobs.filter(j => j.assetId === asset.id).sort((a, b) => new Date(b.openDate) - new Date(a.openDate));
    return (React.createElement("div", { className: "fade-in", style: { padding: "20px 18px", maxWidth: 720, margin: "0 auto" } },
        React.createElement("button", { onClick: onBack, style: {
                background: "none", border: "none", color: C.accent, cursor: "pointer",
                fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 18,
                display: "flex", alignItems: "center", gap: 6
            } }, "\u2190 Torna alla lista"),
        React.createElement("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 16 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 } }, "Scheda apparecchio"),
                    React.createElement("div", { style: { fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1.2, marginBottom: 4 } }, asset.name),
                    (asset.brand || asset.model) && React.createElement("div", { style: { fontSize: 13, color: C.text2 } }, [asset.brand, asset.model].filter(Boolean).join(" · "))),
                React.createElement(Pill, { color: asset.status === "operativo" ? C.ok : asset.status === "in manutenzione" ? C.warn : C.err }, asset.status)),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` } },
                asset.serial && React.createElement(Field, { label: "N. Serie", value: asset.serial, mono: true }),
                asset.location && React.createElement(Field, { label: "Ubicazione", value: asset.location }),
                asset.riskClass && React.createElement(Field, { label: "Classe rischio", value: asset.riskClass }),
                asset.iecClass && React.createElement(Field, { label: "Classe elettrica", value: asset.iecClass }),
                asset.patientType && React.createElement(Field, { label: "Tipo PA", value: asset.patientType }),
                asset.buyDate && React.createElement(Field, { label: "Acquistato il", value: fmtDate(asset.buyDate) }),
                asset.warrantyExpiry && React.createElement(Field, { label: "Garanzia fino al", value: fmtDate(asset.warrantyExpiry) }),
                asset.nextService && React.createElement(Field, { label: "Prossima manutenzione", value: fmtDate(asset.nextService) }))),
        React.createElement(RequestForm, { asset: asset }),
        React.createElement(Section, { title: "Verifiche di Sicurezza Elettrica", count: myIec.length, icon: "\u26A1", color: C.purple }, myIec.length === 0 ? React.createElement(Empty, { msg: "Nessuna verifica di sicurezza eseguita" }) : myIec.map(r => (React.createElement(ReportRow, { key: r.id, r: r, kind: "iec" })))),
        React.createElement(Section, { title: "Verifiche Funzionali", count: myFunc.length, icon: "\u2713", color: C.cyan }, myFunc.length === 0 ? React.createElement(Empty, { msg: "Nessuna verifica funzionale eseguita" }) : myFunc.map(r => (React.createElement(ReportRow, { key: r.id, r: r, kind: "func" })))),
        React.createElement(Section, { title: "Interventi", count: myJobs.length, icon: "\uD83D\uDD27", color: C.warn }, myJobs.length === 0 ? React.createElement(Empty, { msg: "Nessun intervento registrato" }) : myJobs.map(j => (React.createElement(JobRow, { key: j.id, j: j }))))));
};
const Field = ({ label, value, mono }) => (React.createElement("div", null,
    React.createElement("div", { style: { fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: .8, fontWeight: 700, marginBottom: 3 } }, label),
    React.createElement("div", { style: { fontSize: 12, color: C.text, fontFamily: mono ? "monospace" : "inherit" } }, value)));
const Section = ({ title, count, icon, color, children }) => (React.createElement("div", { style: { marginBottom: 18 } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.border}` } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            React.createElement("span", { style: { fontSize: 14, color } }, icon),
            React.createElement("span", { style: { fontSize: 12, fontWeight: 800, color: C.text, textTransform: "uppercase", letterSpacing: .8 } }, title)),
        React.createElement("span", { style: { fontSize: 11, color: C.text3, fontFamily: "monospace" } }, count)),
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, children)));
const Empty = ({ msg }) => (React.createElement("div", { style: { padding: "16px", textAlign: "center", fontSize: 12, color: C.text3, background: C.card2, borderRadius: 8, border: `1px dashed ${C.border}` } }, msg));
const ReportRow = ({ r, kind }) => {
    const isNA = r.verifyStatus === "non_disponibile";
    const pass = r.overallPass === true || r.overallPass === "true";
    const color = isNA ? C.warn : (pass ? C.ok : C.err);
    const label = isNA ? "NON ESEGUITA" : (pass ? "CONFORME" : "NON CONFORME");
    return (React.createElement("div", { style: { background: C.card2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "10px 14px" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
            React.createElement("span", { style: { fontSize: 11, color: C.text, fontFamily: "monospace", fontWeight: 700 } }, r.reportNumber || r.id),
            React.createElement(Pill, { color: color }, label)),
        React.createElement("div", { style: { fontSize: 11, color: C.text2 } }, fmtDateLong(r.date)),
        r.technician && React.createElement("div", { style: { fontSize: 11, color: C.text3, marginTop: 2 } },
            "Tecnico: ",
            r.technician),
        kind === "iec" && r.norm && React.createElement("div", { style: { fontSize: 10, color: C.text3, marginTop: 2, fontFamily: "monospace" } },
            "IEC ",
            r.norm,
            " \u00B7 Classe ",
            r.equipClass || "—",
            r.patientType ? ` · Tipo ${r.patientType}` : "")));
};
const JobRow = ({ j }) => {
    const isClosed = j.status === "chiuso";
    const priColor = j.priority === "urgente" ? C.err : j.priority === "alta" ? C.warn : C.text2;
    return (React.createElement("div", { style: { background: C.card2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${priColor}`, borderRadius: 8, padding: "10px 14px" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } },
            React.createElement("span", { style: { fontSize: 11, color: C.text, fontFamily: "monospace", fontWeight: 700 } }, j.id),
            React.createElement(Pill, { color: isClosed ? C.ok : priColor }, j.status)),
        React.createElement("div", { style: { fontSize: 11, color: C.text2, marginBottom: 3 } },
            fmtDate(j.openDate),
            j.closeDate ? ` → ${fmtDate(j.closeDate)}` : ""),
        j.description && React.createElement("div", { style: { fontSize: 12, color: C.text, marginTop: 4, lineHeight: 1.4 } }, j.description)));
};
/* ═══ MAIN DASHBOARD ═════════════════════════════════════════ */
const Dashboard = ({ data, onReset }) => {
    var _a;
    const [view, setView] = useState({ type: "home" });
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const { assets, iecReports, funcReports, jobs, customers, company } = data;
    // Calcoli
    const stats = useMemo(() => {
        const today = todayISO();
        const ok = assets.filter(a => a.status === "operativo").length;
        const inMaint = assets.filter(a => a.status === "in manutenzione").length;
        const ko = assets.filter(a => a.status === "fuori servizio").length;
        const scaduti = assets.filter(a => a.nextService && daysBetween(a.nextService, today) < 0).length;
        const imminenti = assets.filter(a => a.nextService && daysBetween(a.nextService, today) >= 0 && daysBetween(a.nextService, today) <= 30).length;
        const openJobs = jobs.filter(j => j.status !== "chiuso").length;
        const totIec = iecReports.length;
        const totFunc = funcReports.length;
        return { ok, inMaint, ko, scaduti, imminenti, openJobs, totIec, totFunc };
    }, [assets, jobs, iecReports, funcReports]);
    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            if (filterStatus && a.status !== filterStatus)
                return false;
            if (search) {
                const q = search.toLowerCase();
                return [a.name, a.brand, a.model, a.serial, a.location].some(f => String(f || "").toLowerCase().includes(q));
            }
            return true;
        });
    }, [assets, search, filterStatus]);
    if (view.type === "asset") {
        return React.createElement(AssetDetail, { asset: view.asset, customer: customers[0], iecReports: iecReports, funcReports: funcReports, jobs: jobs, onBack: () => setView({ type: "home" }) });
    }
    return (React.createElement("div", { style: { minHeight: "100vh", paddingBottom: 30 } },
        React.createElement("header", { style: {
                background: `linear-gradient(180deg, ${C.card} 0%, ${C.bg} 100%)`,
                borderBottom: `1px solid ${C.border}`,
                padding: "20px 18px 16px",
                position: "sticky", top: 0, zIndex: 10,
                backdropFilter: "blur(8px)",
            } },
            React.createElement("div", { style: { maxWidth: 720, margin: "0 auto" } },
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 } },
                    React.createElement("div", { style: { minWidth: 0 } },
                        React.createElement("div", { style: { fontSize: 9, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 } }, (company === null || company === void 0 ? void 0 : company.name) || "Portale Cliente"),
                        React.createElement("h1", { style: { margin: 0, fontSize: 18, fontWeight: 900, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, ((_a = customers === null || customers === void 0 ? void 0 : customers[0]) === null || _a === void 0 ? void 0 : _a.name) || "Il tuo parco apparecchi")),
                    React.createElement("button", { onClick: onReset, title: "Carica altro file", style: {
                            background: "none", border: `1px solid ${C.border}`, color: C.text2,
                            borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600
                        } }, "\u21BB Altro file")))),
        React.createElement("main", { style: { maxWidth: 720, margin: "0 auto", padding: "20px 18px" } },
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 24 } },
                React.createElement(StatCard, { label: "Operativi", value: stats.ok, sub: `su ${assets.length} totali`, color: C.ok }),
                React.createElement(StatCard, { label: "In manutenzione", value: stats.inMaint, sub: stats.inMaint > 0 ? "in lavorazione" : "nessuno", color: C.warn }),
                React.createElement(StatCard, { label: "Fuori servizio", value: stats.ko, sub: stats.ko > 0 ? "richiede attenzione" : "tutti attivi", color: stats.ko > 0 ? C.err : C.text3 }),
                React.createElement(StatCard, { label: "Verifiche eseguite", value: stats.totIec + stats.totFunc, sub: `${stats.totIec} sicurezza · ${stats.totFunc} funzionali`, color: C.accent })),
            (stats.scaduti > 0 || stats.openJobs > 0) && (React.createElement("div", { style: {
                    background: `linear-gradient(90deg, ${C.warn}11, ${C.warn}05)`,
                    border: `1px solid ${C.warn}44`,
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: 18,
                    fontSize: 12,
                    color: C.text,
                    display: "flex", flexDirection: "column", gap: 6
                } },
                stats.scaduti > 0 && React.createElement("div", null,
                    "\u26A0 ",
                    React.createElement("strong", { style: { color: C.warn } },
                        stats.scaduti,
                        " ",
                        stats.scaduti === 1 ? "apparecchio" : "apparecchi"),
                    " con manutenzione scaduta"),
                stats.openJobs > 0 && React.createElement("div", null,
                    "\uD83D\uDD27 ",
                    React.createElement("strong", { style: { color: C.warn } },
                        stats.openJobs,
                        " ",
                        stats.openJobs === 1 ? "intervento" : "interventi"),
                    " in corso o aperti"),
                stats.imminenti > 0 && React.createElement("div", null,
                    "\uD83D\uDCC5 ",
                    React.createElement("strong", { style: { color: C.warn } }, stats.imminenti),
                    " manutenzioni nei prossimi 30 giorni"))),
            React.createElement("div", { style: { marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" } },
                    React.createElement("span", { style: { fontSize: 13, color: C.text3 } }, "\uD83D\uDD0D"),
                    React.createElement("input", { type: "text", placeholder: "Cerca apparecchio, marca, S/N\u2026", value: search, onChange: e => setSearch(e.target.value), style: { flex: 1, background: "transparent", border: "none", color: C.text, fontSize: 13, outline: "none" } }),
                    search && React.createElement("button", { onClick: () => setSearch(""), style: { background: "none", border: "none", color: C.text3, fontSize: 14, cursor: "pointer" } }, "\u2715")),
                React.createElement("div", { style: { display: "flex", gap: 6, overflowX: "auto" } }, [
                    { id: "", label: "Tutti", color: C.text2 },
                    { id: "operativo", label: "Operativi", color: C.ok },
                    { id: "in manutenzione", label: "In manutenzione", color: C.warn },
                    { id: "fuori servizio", label: "Fuori servizio", color: C.err },
                ].map(f => (React.createElement("button", { key: f.id, onClick: () => setFilterStatus(f.id), style: {
                        background: filterStatus === f.id ? `${f.color}22` : C.card2,
                        border: `1px solid ${filterStatus === f.id ? f.color + "66" : C.border}`,
                        color: filterStatus === f.id ? f.color : C.text2,
                        borderRadius: 20, padding: "5px 12px",
                        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                        cursor: "pointer"
                    } }, f.label))))),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, filteredAssets.length === 0 ? (React.createElement("div", { style: { padding: "40px 20px", textAlign: "center", color: C.text3, fontSize: 13, background: C.card, borderRadius: 12, border: `1px dashed ${C.border}` } }, search || filterStatus ? "Nessun apparecchio corrisponde ai filtri" : "Nessun apparecchio nel report")) : filteredAssets.map(a => {
                const myIec = iecReports.filter(r => r.assetId === a.id).sort((x, y) => new Date(y.date) - new Date(x.date))[0];
                const myFunc = funcReports.filter(r => r.assetId === a.id).sort((x, y) => new Date(y.date) - new Date(x.date))[0];
                return React.createElement(AssetCard, { key: a.id, asset: a, lastIec: myIec, lastFunc: myFunc, nextService: a.nextService, onClick: () => setView({ type: "asset", asset: a }) });
            })),
            React.createElement("div", { style: { marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}`, textAlign: "center", fontSize: 10, color: C.text3, lineHeight: 1.6 } },
                "Portale generato da ",
                React.createElement("strong", { style: { color: C.text2 } }, (company === null || company === void 0 ? void 0 : company.name) || "tecnico"),
                React.createElement("br", null),
                "Stato aggiornato al ",
                fmtDate(todayISO()),
                " \u00B7 Tutti i dati sono locali al tuo dispositivo"))));
};
/* ═══ APP ENTRY ═══════════════════════════════════════════════ */
/* ═══ APP ENTRY ═══════════════════════════════════════════════ */
const App = () => {
    const [authReady, setAuthReady] = useState(false);
    const [session, setSession] = useState(null);
    const [data, setData] = useState(() => {
        try { const saved = sessionStorage.getItem("portale-data"); return saved ? JSON.parse(saved) : null; }
        catch (e) { return null; }
    });
    useEffect(() => {
        const client = sb();
        if (!client) { setAuthReady(true); return; }
        client.auth.getSession().then(function (res) { setSession(res && res.data ? res.data.session : null); setAuthReady(true); });
        const out = client.auth.onAuthStateChange(function (_e, ses) { setSession(ses); });
        return function () { try { out.data.subscription.unsubscribe(); } catch (e) { } };
    }, []);
    const logout = async () => { try { await sb().auth.signOut(); } catch (e) { } setSession(null); };
    const resetFile = () => { try { sessionStorage.removeItem("portale-data"); } catch (e) { } setData(null); };
    if (!authReady)
        return h("div", { style: { minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.text3, fontSize: 13 } }, "Caricamento\u2026");
    if (session)
        return h(CloudHome, { onLogout: logout });
    if (data)
        return h(Dashboard, { data: data, onReset: resetFile });
    return h(Landing, { onLoad: setData });
};
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
