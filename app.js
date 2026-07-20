/* Portale Cliente v1.13.0 — UX allineata a MedTrace (palette grigi neutri + teal) */
"use strict";
const { useState, useEffect, useMemo, useRef } = React;
/* ═══ DESIGN TOKENS ═══════════════════════════════════════════ */
const C = {
    bg: "#0D0D12",
    card: "#1a1a22",
    card2: "#101016",
    border: "#2a2a38",
    borderL: "#2e2e3a",
    text: "#e8e8ef",
    text2: "#9a9aab",
    text3: "#6a6a78",
    accent: "#2dd4bf",
    accentDim: "#0d9488",
    ok: "#22c55e",
    warn: "#f59e0b",
    err: "#ef4444",
    purple: "#a855f7",
    cyan: "#22d3ee",
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
const addMonths = (iso, m) => { const d = new Date(iso); if (isNaN(d.getTime())) return null; d.setMonth(d.getMonth() + m); return d; };
const verifDue = (last, interval) => {
    if (!last || !last.date) return null;
    const explicit = last.nextDate || last.next_date;
    const iv = parseInt(interval, 10);
    let due = explicit ? new Date(explicit) : addMonths(last.date, (iv > 0 ? iv : 12));
    if (!due || isNaN(due.getTime())) return null;
    const isoDue = due.toISOString().slice(0, 10);
    const days = daysBetween(isoDue, todayISO());
    const status = days < 0 ? "scaduto" : days <= 60 ? "scadenza" : "ok";
    return { date: isoDue, days: days, status: status };
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
const PORTAL_VER = "1.12.0";

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
    const inputStyle = { width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.borderL}`, borderRadius: 8, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", marginBottom: 10 };
    const btnStyle = (b) => ({ width: "100%", background: b ? C.borderL : `linear-gradient(135deg,${C.accent},${C.accentDim})`, color: b ? C.text2 : "#04231f", border: "none", borderRadius: 8, padding: "13px", fontWeight: 800, fontSize: 14, cursor: b ? "default" : "pointer" });
    if (sent) {
        return h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 24px", textAlign: "center" } },
            h("div", { style: { fontSize: 38, marginBottom: 10 } }, "\uD83D\uDCE7"),
            h("div", { style: { fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 } }, "Controlla la tua email"),
            h("div", { style: { fontSize: 13, color: C.text2, lineHeight: 1.5 } }, "Ti abbiamo inviato un link di accesso a ", h("strong", { style: { color: C.text } }, email), ". Aprilo da questo dispositivo per entrare."),
            h("button", { onClick: () => setSent(false), style: { marginTop: 16, background: "none", border: "none", color: C.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" } }, "Indietro"));
    }
    return h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px", marginBottom: 16 } },
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
            h("div", { style: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "68vw", maxWidth: 300, height: "68vw", maxHeight: 300, border: "3px solid " + C.accent, borderRadius: 14, boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" } })),
        err && h("div", { style: { padding: "14px 18px", background: C.err + "22", color: C.err, fontSize: 12, textAlign: "center" } }, err));
};

/* ═══ HOME CLOUD (lista macchine + storico + scanner) ════════ */
const CloudHome = ({ onLogout }) => {
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [customer, setCustomer] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [linked, setLinked] = useState(true);
    const [err, setErr] = useState("");
    const [assets, setAssets] = useState([]);
    const [iecReports, setIec] = useState([]);
    const [funcReports, setFunc] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selId, setSelId] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanMsg, setScanMsg] = useState("");
    const [search, setSearch] = useState("");
    const [locFilter, setLocFilter] = useState("");
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
                try {
                    const ci = await client.rpc("dati_azienda_portale");
                    if (ci && ci.data) setCompanyInfo(ci.data);
                } catch (e) { }
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
    if (loading) return Shell(h("div", { className: "skel", style: { height: 120, borderRadius: 14 } }));
    if (err) return Shell(h("div", { style: { padding: "16px", background: C.err + "15", border: "1px solid " + C.err + "55", borderRadius: 12, color: C.err, fontSize: 13 } }, err));
    if (!linked) return Shell(h("div", { style: { background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: "28px 24px", textAlign: "center" } },
        h("div", { style: { fontSize: 38, marginBottom: 10 } }, "\u23F3"),
        h("div", { style: { fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 } }, "Accesso effettuato"),
        h("div", { style: { fontSize: 13, color: C.text2, lineHeight: 1.5 } }, "Il tuo account (", h("strong", { style: { color: C.text } }, email), ") non \u00E8 ancora collegato a un cliente. Chiedi al tuo tecnico di abilitare il portale con questa email; poi esci e rientra.")));
    if (selId) {
        const a = assets.find(function (x) { return x.id === selId; });
        if (a) return Frame(h(AssetDetail, { asset: a, customer: customer, iecReports: iecReports, funcReports: funcReports, jobs: jobs, company: companyInfo, onBack: function () { setSelId(null); } }));
    }
    const lastOf = (arr, aid) => arr.filter(function (r) { return r.assetId === aid; }).sort(function (p, q) { return new Date(q.date) - new Date(p.date); })[0] || null;
    const sortedAssets = assets.slice().sort(function (x, y) { return (x.name || "").localeCompare(y.name || ""); });
    const locations = Array.from(new Set(assets.map(function (a) { return a.location; }).filter(Boolean))).sort();
    const filteredAssets = sortedAssets.filter(function (a) {
        if (locFilter && a.location !== locFilter) return false;
        if (search) {
            var q = search.toLowerCase();
            return [a.name, a.brand, a.model, a.serial, a.assetCode, a.location].filter(Boolean).some(function (s2) { return String(s2).toLowerCase().indexOf(q) >= 0; });
        }
        return true;
    });
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
        h("div", { style: { background: C.card, border: "1px solid " + C.border, borderRadius: 14, padding: "22px 20px", marginBottom: 14 } },
            h("div", { style: { fontSize: 13, color: C.text3, marginBottom: 4 } }, "Benvenuto"),
            h("div", { style: { fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 2 } }, (customer && customer.name) || "Cliente"),
            h("div", { style: { fontSize: 12, color: C.text2 } }, email)),
        (function () {
            var scad = 0, imm = 0;
            (assets || []).forEach(function (a) {
                [verifDue(lastOf(iecReports, a.id), a.intervalIec), verifDue(lastOf(funcReports, a.id), a.intervalFunc)].forEach(function (d) {
                    if (d) { if (d.status === "scaduto") scad++; else if (d.status === "scadenza") imm++; }
                });
            });
            if (!scad && !imm) return null;
            var hard = scad > 0;
            return h("div", { style: { background: (hard ? C.err : C.warn) + "12", border: "1px solid " + (hard ? C.err : C.warn) + "44", borderRadius: 14, padding: "14px 16px", marginBottom: 14, fontSize: 12.5, color: C.text, display: "flex", flexDirection: "column", gap: 6 } },
                h("div", { style: { fontWeight: 800, fontSize: 10.5, textTransform: "uppercase", letterSpacing: .8, color: hard ? C.err : C.warn } }, "Conformit\u00E0 verifiche"),
                scad > 0 && h("div", null, "\u26A0 ", h("strong", { style: { color: C.err } }, scad), " " + (scad === 1 ? "verifica scaduta" : "verifiche scadute")),
                imm > 0 && h("div", null, "\uD83D\uDD52 ", h("strong", { style: { color: C.warn } }, imm), " in scadenza nei prossimi 60 giorni"));
        })(),
        h("button", { onClick: function () { setScanMsg(""); setScanning(true); }, style: { width: "100%", marginBottom: 14, background: C.accent, color: "#06251f", border: "none", borderRadius: 14, padding: "15px", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, "\uD83D\uDCF7 Scansiona una macchina"),
        scanMsg && h("div", { style: { marginBottom: 14, padding: "12px 14px", background: C.warn + "18", border: "1px solid " + C.warn + "55", borderRadius: 10, color: C.warn, fontSize: 12 } }, scanMsg),
        h("div", { style: { display: "flex", alignItems: "center", gap: 8, background: C.card2, border: "1px solid " + C.border, borderRadius: 10, padding: "10px 14px", marginBottom: 10 } }, h("span", { style: { color: C.text3, fontSize: 14 } }, "\uD83D\uDD0D"), h("input", { type: "text", placeholder: "Cerca apparecchio, marca, S/N\u2026", value: search, onChange: function (e) { setSearch(e.target.value); }, style: { flex: 1, background: "transparent", border: "none", color: C.text, fontSize: 13, outline: "none" } }), search && h("button", { onClick: function () { setSearch(""); }, style: { background: "none", border: "none", color: C.text3, fontSize: 14, cursor: "pointer" } }, "\u2715")),
        locations.length > 1 && h("div", { style: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 12 } }, [""].concat(locations).map(function (loc) { var active = locFilter === loc; return h("button", { key: loc || "__all", onClick: function () { setLocFilter(loc); }, style: { flexShrink: 0, background: active ? C.accent + "22" : C.card2, border: "1px solid " + (active ? C.accent + "66" : C.border), color: active ? C.accent : C.text2, borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" } }, loc === "" ? "Tutte" : loc); })),
        h("div", { style: { fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, margin: "4px 2px 10px" } }, filteredAssets.length + (filteredAssets.length === 1 ? " apparecchio" : " apparecchi") + (filteredAssets.length !== assets.length ? " su " + assets.length : "")),
        assets.length === 0
            ? h(Empty, { msg: "Nessun apparecchio collegato al tuo account." })
            : filteredAssets.length === 0
                ? h(Empty, { msg: "Nessun apparecchio corrisponde ai filtri." })
                : h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, filteredAssets.map(function (a) { return h(AssetCard, { key: a.id, asset: a, lastIec: lastOf(iecReports, a.id), lastFunc: lastOf(funcReports, a.id), nextService: a.nextService, onClick: function () { setSelId(a.id); } }); })), h("div", { style: { marginTop: 28, paddingTop: 18, borderTop: "1px solid " + C.border, fontSize: 10, color: C.text3, lineHeight: 1.6 } }, h("div", { style: { fontWeight: 700, color: C.text2, marginBottom: 4, textTransform: "uppercase", letterSpacing: .6 } }, "Informativa privacy"), "Titolare del trattamento: ", h("strong", { style: { color: C.text2 } }, (companyInfo && companyInfo.name) || (customer && customer.name) || "il tuo tecnico"), ". I dati di questo portale riguardano apparecchiature e relativi interventi (non dati sanitari di pazienti) e sono trattati per l'esecuzione del contratto di assistenza (art. 6.1.b GDPR). Vedi solo i dati collegati al tuo account; hai diritto di accesso, rettifica e cancellazione contattando il titolare. Dati ospitati su infrastruttura UE.", h("br", null), h("br", null), h("span", { style: { fontStyle: "italic" } }, "Accessibilit\u00E0: ci impegniamo a rendere il portale accessibile. Per segnalare difficolt\u00E0 di accesso o richiedere i contenuti in formato alternativo, contatta il titolare.")));
    return h(React.Fragment, null,
        scanning && h(Scanner, { onResult: onScanResult, onClose: function () { setScanning(false); } }),
        Shell(home));
};

/* ═══ LANDING / UPLOAD ════════════════════════════════════════ */
const Landing = () => {
    var ecg = "M0 20 L150 20 L164 20 L174 6 L184 34 L194 11 L204 20 L250 20 L400 20";
    return React.createElement("div", { style: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: `radial-gradient(circle at 50% -5%, ${C.accent}14 0%, ${C.bg} 55%)` } },
        React.createElement("div", { className: "fade-in", style: { maxWidth: 430, width: "100%" } },
            React.createElement("div", { style: { textAlign: "center", marginBottom: 6 } },
                React.createElement("svg", { viewBox: "0 0 220 48", style: { width: 200, height: 44, display: "block", margin: "0 auto 14px" } },
                    React.createElement("g", { fill: "none", stroke: C.accent, strokeLinecap: "round", strokeLinejoin: "round" },
                        React.createElement("path", { d: "M6 24 Q11 14 16 24 Q21 34 26 24", strokeWidth: "2.5" }),
                        React.createElement("path", { d: "M1 24 Q9 10 16 24 Q23 38 31 24", strokeWidth: "2.5" }),
                        React.createElement("path", { d: "M-4 24 Q7 6 16 24 Q25 42 36 24", strokeWidth: "2.5" }),
                        React.createElement("circle", { cx: "42", cy: "24", r: "3.5", fill: C.accent, stroke: "none" },
                            React.createElement("animate", { attributeName: "opacity", values: "1;0.35;1", dur: "2s", repeatCount: "indefinite" }))),
                    React.createElement("text", { x: "54", y: "28", fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: "20", fontWeight: "800", letterSpacing: "-0.5", fill: C.text }, "MedTrace"),
                    React.createElement("text", { x: "54", y: "40", fontFamily: "'Segoe UI',Arial,sans-serif", fontSize: "8.5", fontWeight: "600", letterSpacing: "1.5", fill: "#5A5A70" }, "MEDICAL")),
                React.createElement("div", { style: { fontSize: 11, color: C.accent, letterSpacing: 3, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 } }, "Portale Clienti"),
                React.createElement("div", { style: { fontSize: 27, fontWeight: 800, color: C.text, lineHeight: 1.18, letterSpacing: "-0.02em", marginBottom: 10 } }, "Le tue apparecchiature, sotto controllo."),
                React.createElement("div", { style: { fontSize: 14, color: C.text2, lineHeight: 1.55 } }, "Stato di sicurezza elettrica, scadenze e interventi del tuo parco macchine, sempre aggiornati.")),
            React.createElement("svg", { width: "100%", height: "40", viewBox: "0 0 400 40", preserveAspectRatio: "none", style: { display: "block", margin: "16px 0 18px" } },
                React.createElement("path", { d: ecg, fill: "none", stroke: C.accent, strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", opacity: ".18" }),
                React.createElement("path", { d: ecg, fill: "none", stroke: C.accent, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", pathLength: "100", strokeDasharray: "16 84" },
                    React.createElement("animate", { attributeName: "stroke-dashoffset", values: "100;0", dur: "2.2s", repeatCount: "indefinite" }))),
            React.createElement(MagicLogin, null),
            React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 16, marginTop: 22, flexWrap: "wrap" } },
                [["\u26A1", "Verifiche IEC 62353"], ["\uD83D\uDCC5", "Scadenze visibili"], ["\uD83D\uDD12", "Dati protetti"]].map(function (it) {
                    return React.createElement("div", { key: it[1], style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.text3, fontWeight: 600 } }, React.createElement("span", { style: { fontSize: 13 } }, it[0]), it[1]);
                })),
            React.createElement("div", { style: { marginTop: 24, textAlign: "center", fontSize: 11, color: C.text3, lineHeight: 1.6 } },
                "Accedendo con la tua email vedi solo i dati collegati al tuo account, su infrastruttura UE.")));
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
        background: `${color}18`, color, border: `1px solid ${color}40`,
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
                asset.assetCode && React.createElement("div", { style: { fontSize: 12.5, fontWeight: 800, color: C.accent, fontFamily: "monospace", letterSpacing: .5, marginBottom: 4 } }, asset.assetCode),
                React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3, lineHeight: 1.3 } }, asset.name || "Apparecchio senza nome"),
                (asset.brand || asset.model) && React.createElement("div", { style: { fontSize: 12, color: C.text2 } }, [asset.brand, asset.model].filter(Boolean).join(" ")),
                asset.serial && React.createElement("div", { style: { fontSize: 11, color: C.text2, fontFamily: "monospace", marginTop: 4 } },
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
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5, paddingTop: 8, borderTop: `1px solid ${C.border}` } }, [["Sic. elettrica", verifDue(lastIec, asset.intervalIec)], ["Funzionale", verifDue(lastFunc, asset.intervalFunc)]].map(function (row) { var lab = row[0], d = row[1]; var col = !d ? C.text3 : d.status === "scaduto" ? C.err : d.status === "scadenza" ? C.warn : C.ok; var txt = !d ? "\u2014" : d.status === "scaduto" ? ("Scaduta da " + Math.abs(d.days) + "gg") : ("Scade " + fmtDate(d.date)); return React.createElement("div", { key: lab, style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 } }, React.createElement("span", { style: { color: C.text3 } }, "Prossima " + lab.toLowerCase()), React.createElement("span", { style: { color: col, fontWeight: 700 } }, txt)); }))));
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
/* ═══ PDF VERBALI — generatori portati dalla gestionale (identici) ═══ */

let _instrumentsRegistry = [];

function openPrintWindow(htmlContent) {
  // Most reliable cross-platform approach: inject into a full-screen overlay
  // and use window.print() which works on iOS Safari, Android Chrome, and Desktop
  window.dispatchEvent(new CustomEvent('show-pdf', { detail: htmlContent }));
}

const FUNC_TEMPLATES = {

  // ═══════════════ AGGIUNTI v1.56 — ulteriori tipi con norma particolare ═══════════════

  "dialisi": {
    label: "Apparecchio per emodialisi", icon: "›", norm: "IEC 60601-2-16:2018",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e idraulica", items:[
        {id:"involucro", text:"Involucro, display e supporti: integri e puliti"},
        {id:"linee", text:"Linee/circuito idraulico e raccordi: integri, senza perdite"},
        {id:"pompe", text:"Pompe (sangue, eparina): rulli/alloggiamenti integri"},
        {id:"filtri", text:"Filtri e connettori dialisato: integri, puliti"},
        {id:"etichette", text:"Etichette CE, n° serie, parti applicate: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire la verifica di sicurezza elettrica (vedi template dedicato IEC 60601-1 / IEC 62353).", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità di base", items:[
        {id:"acc", text:"Accensione e autotest: superati"},
        {id:"pompa_sangue", text:"Pompa sangue: rotazione regolare, portata regolabile"},
        {id:"uf", text:"Controllo ultrafiltrazione (UF): risponde all'impostazione"},
        {id:"risc", text:"Riscaldatore dialisato: raggiunge la temperatura impostata"},
        {id:"cond", text:"Preparazione/conducibilità dialisato: stabile in range"},
        {id:"deaer", text:"Deareazione/rimozione bolle: funzionante"},
      ]},
      { id:"allarmi", title:"Allarmi di sicurezza (IEC 60601-2-16)", note:"Verificare l'intervento degli allarmi critici secondo procedura.", items:[
        {id:"all_aria", text:"Rilevatore aria/microbolle: arresta la pompa sangue e allarma"},
        {id:"all_blood", text:"Rilevatore perdita ematica (blood leak): allarma"},
        {id:"all_press", text:"Allarmi pressioni (arteriosa, venosa, TMP): intervengono ai limiti"},
        {id:"all_cond", text:"Allarme conducibilità fuori range: interviene"},
        {id:"all_temp", text:"Allarme temperatura dialisato fuori range: interviene"},
        {id:"all_alim", text:"Allarme mancanza alimentazione: interviene"},
      ], measures:[
        {id:"t_dial", name:"Temperatura dialisato vs set", unit:"°C", expected:"secondo costruttore (tipico ~37 °C)", value:""},
        {id:"cond_dial", name:"Conducibilità dialisato", unit:"mS/cm", expected:"secondo costruttore", value:""},
        {id:"q_sangue", name:"Portata pompa sangue (a impostazione di rif.)", unit:"ml/min", expected:"secondo costruttore", value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"dataora", text:"Data/ora corrette; disinfezione/ciclo igienico eseguito"},
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "capnografo": {
    label: "Capnografo / monitor gas respiratori", icon: "›", norm: "ISO 80601-2-55:2018",
    sections: [
      { id:"ispezione", title:"Ispezione visiva", items:[
        {id:"involucro", text:"Involucro e display: integri e puliti"},
        {id:"linea", text:"Linea di campionamento e water-trap: integre, non occluse"},
        {id:"sensore", text:"Sensore/cella di misura: pulito, finestra ottica integra"},
        {id:"etichette", text:"Etichette CE, n° serie: leggibili"},
      ]},
      { id:"funz", title:"Funzionalità di base", items:[
        {id:"acc", text:"Accensione e autotest: nessun errore"},
        {id:"zero", text:"Azzeramento (zeroing): eseguibile, completato"},
        {id:"riscald", text:"Riscaldamento/condizionamento sensore: completato"},
        {id:"forma", text:"Curva di capnografia: presente e stabile"},
      ]},
      { id:"prestazioni", title:"Accuratezza (ISO 80601-2-55) — con gas di taratura", note:"Verificare con miscela di gas certificata (es. CO2 nota). Compilare i limiti secondo ISO 80601-2-55 e/o le specifiche del costruttore. Per O2/N2O/agenti anestetici usare le rispettive miscele.", items:[
        {id:"gas", text:"Miscela di gas certificata collegata"},
      ], measures:[
        {id:"co2", name:"CO2 letta — miscela nota", unit:"mmHg / %", expected:"valore nominale ± tolleranza secondo ISO 80601-2-55/costruttore", value:""},
        {id:"o2", name:"O2 letta (se previsto) — miscela nota", unit:"%", expected:"secondo norma/costruttore", value:""},
      ]},
      { id:"allarmi", title:"Allarmi (IEC 60601-1-8)", items:[
        {id:"all_apnea", text:"Allarme apnea: interviene entro il tempo impostato"},
        {id:"all_co2", text:"Allarmi CO2 (etCO2/FiCO2) alta/bassa: intervengono"},
        {id:"all_fr", text:"Allarme frequenza respiratoria: interviene"},
        {id:"all_occl", text:"Allarme occlusione/linea: interviene"},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "tavolo_operatorio": {
    label: "Tavolo operatorio", icon: "›", norm: "IEC 60601-2-46:2016",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"struttura", text:"Struttura, colonna e piano: integri, nessun gioco anomalo"},
        {id:"sezioni", text:"Sezioni del piano e snodi: integri, fissaggi sicuri"},
        {id:"cuscini", text:"Cuscini/imbottiture: integri, puliti"},
        {id:"ruote", text:"Ruote e sistema di frenatura/ancoraggio: funzionanti"},
        {id:"comando", text:"Pulsantiera/telecomando e cavo: integri; batteria non gonfia"},
        {id:"etichette", text:"Etichette CE, n° serie, carico massimo: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire la verifica di sicurezza elettrica (vedi template dedicato).", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Movimenti e funzionalità", items:[
        {id:"altezza", text:"Salita/discesa altezza: fluida, su tutta la corsa"},
        {id:"trend", text:"Trendelenburg / anti-Trendelenburg: funzionanti"},
        {id:"lat", text:"Inclinazioni laterali (tilt): funzionanti"},
        {id:"dorso_gambe", text:"Sezioni dorso/gambe/testa: regolazioni funzionanti"},
        {id:"ritorno", text:"Ritorno a zero/livellamento (se previsto): funzionante"},
        {id:"tenuta", text:"Tenuta in posizione sotto carico: nessun cedimento"},
      ]},
      { id:"sicurezza", title:"Sicurezza", items:[
        {id:"emergenza", text:"Arresto di emergenza / blocco movimenti: funzionante"},
        {id:"backup", text:"Comando di emergenza/manuale (se previsto): funzionante"},
        {id:"stabilita", text:"Stabilità complessiva: nessun rischio di ribaltamento"},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "culla_termica": {
    label: "Culla termica / lettino di rianimazione (radiant warmer)", icon: "›", norm: "IEC 60601-2-21:2009+A1:2016",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"struttura", text:"Struttura, colonna e piano: integri, stabili"},
        {id:"riscaldatore", text:"Elemento riscaldante radiante: integro, griglia di protezione presente"},
        {id:"sonda", text:"Sonda cutanea: integra, cavo OK"},
        {id:"materasso", text:"Materasso e sponde: integri, puliti"},
        {id:"ruote", text:"Ruote e freni: funzionanti"},
        {id:"etichette", text:"Etichette CE, n° serie, parti applicate: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire la verifica di sicurezza elettrica (vedi template dedicato).", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità", items:[
        {id:"acc", text:"Accensione e autotest: nessun errore"},
        {id:"manuale", text:"Modo manuale (potenza riscaldatore): regolabile"},
        {id:"servo", text:"Modo servo-controllo cute: insegue la temperatura impostata"},
        {id:"sonda_ok", text:"Lettura sonda cutanea: plausibile e stabile"},
        {id:"luce_apgar", text:"Illuminazione e (se presente) timer Apgar: funzionanti"},
      ]},
      { id:"allarmi", title:"Allarmi (IEC 60601-2-21)", items:[
        {id:"all_alta", text:"Allarme sovra-temperatura cute: interviene"},
        {id:"all_bassa", text:"Allarme sotto-temperatura cute: interviene"},
        {id:"all_sonda", text:"Allarme guasto/scollegamento sonda: interviene"},
        {id:"all_manuale", text:"Allarme periodico in modo manuale (controllo prolungato): presente"},
        {id:"all_alim", text:"Allarme mancanza alimentazione: interviene"},
      ], measures:[
        {id:"t_cute", name:"Temperatura cute (servo) vs set", unit:"°C", expected:"deviazione secondo IEC 60601-2-21/costruttore", value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "holter_ecg": {
    label: "Holter ECG (registratore ambulatoriale)", icon: "›", norm: "IEC 60601-2-47:2012",
    sections: [
      { id:"ispezione", title:"Ispezione visiva", items:[
        {id:"reg", text:"Registratore e display: integri e puliti"},
        {id:"cavo", text:"Cavo paziente ed elettrodi/clip: integri, isolamento OK"},
        {id:"batteria", text:"Vano batteria/contatti: puliti; batteria non gonfia"},
        {id:"etichette", text:"Etichette CE, n° serie, parti applicate (CF): leggibili"},
      ]},
      { id:"funz", title:"Funzionalità", items:[
        {id:"acc", text:"Accensione e avvio registrazione: corretti"},
        {id:"canali", text:"Canali/derivazioni: tutti acquisiti, no canali muti"},
        {id:"marker", text:"Tasto marcatore evento paziente: funzionante"},
        {id:"orologio", text:"Orologio interno: ora corretta"},
        {id:"scarico", text:"Scarico dati e software di analisi: funzionante"},
      ]},
      { id:"prestazioni", title:"Prestazioni (IEC 60601-2-47) — con simulatore ECG", note:"Verificare con simulatore ECG certificato. Compilare i limiti secondo IEC 60601-2-47 e/o le specifiche del costruttore.", items:[
        {id:"sim", text:"Simulatore ECG collegato"},
        {id:"morf", text:"Morfologia registrata: corretta su tutti i canali"},
      ], measures:[
        {id:"fc", name:"FC rilevata — simulatore (valore di rif.)", unit:"bpm", expected:"secondo norma/costruttore", value:""},
      ]},
      { id:"batteria_sec", title:"Alimentazione", items:[
        {id:"auton", text:"Autonomia adeguata alla durata di registrazione prevista"},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "riunito_odontoiatrico": {
    label: "Riunito odontoiatrico", icon: "›", norm: "ISO 7494-1:2018 (+ IEC 60601-1)",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"poltrona", text:"Poltrona, bracci e snodi: integri, stabili"},
        {id:"manipoli", text:"Manipoli/turbine e cordoni: integri, raccordi a tenuta"},
        {id:"faretra", text:"Faretra/strumenti, siringa aria-acqua: integri"},
        {id:"lampada", text:"Lampada operatoria e snodo: integri, funzionanti"},
        {id:"idrico", text:"Gruppo idrico/aspirazione, bacinella: integri, scarichi liberi"},
        {id:"etichette", text:"Etichette CE, n° serie: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 60601-1 / IEC 62353)", note:"Eseguire la verifica di sicurezza elettrica (vedi template dedicato).", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica eseguita, esito registrato"},
      ]},
      { id:"poltrona_funz", title:"Poltrona e sicurezza movimenti", note:"ISO 7494-1 richiede un sistema di arresto delle funzioni (function stop) per le poltrone a movimento elettrico.", items:[
        {id:"movimenti", text:"Movimenti poltrona (salita/discesa, schienale): fluidi"},
        {id:"function_stop", text:"Sistema di arresto funzioni (function stop): arresta i movimenti pericolosi"},
        {id:"posizioni", text:"Posizioni memorizzate/ritorno (se previsti): funzionanti"},
      ]},
      { id:"strumenti", title:"Strumenti e servizi", items:[
        {id:"turbine", text:"Manipoli/turbine: rotazione, spray e raffreddamento corretti"},
        {id:"siringa", text:"Siringa aria/acqua: erogazione corretta"},
        {id:"aspirazione", text:"Aspirazione (chirurgica/saliva): potenza adeguata"},
        {id:"polimerizz", text:"Lampada polimerizzante (se integrata): funzionante"},
        {id:"riscaldatore", text:"Riscaldatore acqua/siringa (se presente): funzionante"},
      ]},
      { id:"igiene", title:"Impianto idrico e igiene", note:"ISO 7494-1: filtro solidi (≥ 2 mm); se presente, separatore amalgama conforme a ISO 11143.", items:[
        {id:"filtro", text:"Filtro solidi presente e pulito"},
        {id:"amalgama", text:"Separatore amalgama (se presente): funzionante"},
        {id:"decont", text:"Decontaminazione/flussaggio linee acqua: eseguito secondo protocollo"},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  // ═══════════════ AGGIUNTI v1.55 — altri tipi con norma particolare ═══════════════

  "elettrocardiografo": {
    label: "Elettrocardiografo (ECG diagnostico)", icon: "›", norm: "IEC 60601-2-25:2011",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"involucro", text:"Involucro, display e tastiera: integri e puliti"},
        {id:"cavo_paz", text:"Cavo paziente e derivazioni: isolamento integro, connettori OK"},
        {id:"elettrodi", text:"Elettrodi/pinze/ventose: puliti, molle e adesione funzionanti"},
        {id:"alim", text:"Alimentatore e cavo rete: integri; batteria (se presente) non gonfia"},
        {id:"stampante", text:"Stampante e carta: presenti, avanzamento regolare"},
        {id:"etichette", text:"Etichette CE, n° serie, parti applicate (tipo CF): leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire le prove di sicurezza elettrica secondo IEC 62353 (resistenza del conduttore di protezione e correnti di dispersione) con safety analyzer. Parti applicate ECG: tipo CF.", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica IEC 62353 eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità di base", items:[
        {id:"acc", text:"Accensione e autotest: nessun messaggio di errore"},
        {id:"deriv", text:"Selezione derivazioni (I, II, III, aVR, aVL, aVF, V1-V6): tutte presenti"},
        {id:"vel", text:"Velocità carta selezionabile (25 / 50 mm/s)"},
        {id:"gain", text:"Sensibilità/guadagno selezionabile (5 / 10 / 20 mm/mV)"},
        {id:"filtri", text:"Filtri (rete 50 Hz, muscolare, deriva linea di base): attivabili"},
        {id:"lead_off", text:"Segnalazione elettrodo staccato (lead-off): funzionante"},
      ]},
      { id:"prestazioni", title:"Prestazioni (IEC 60601-2-25) — con simulatore ECG", note:"Verificare con simulatore ECG certificato. Compilare i limiti secondo IEC 60601-2-25 e/o le specifiche del costruttore (accuratezza di guadagno, base dei tempi, frequenza).", items:[
        {id:"sim", text:"Simulatore ECG collegato e impostato"},
        {id:"cal_1mv", text:"Impulso di taratura 1 mV: ampiezza corretta sul tracciato"},
        {id:"morf", text:"Morfologia su tutte le derivazioni: corretta, senza artefatti"},
      ], measures:[
        {id:"amp_cal", name:"Ampiezza impulso 1 mV a 10 mm/mV", unit:"mm", expected:"10 mm — tolleranza secondo IEC 60601-2-25 (tipico ±5%)", value:""},
        {id:"fc_60", name:"FC visualizzata — simulatore 60 bpm", unit:"bpm", expected:"60 — secondo norma/costruttore", value:""},
        {id:"vel_carta", name:"Velocità carta misurata (impostata 25 mm/s)", unit:"mm/s", expected:"25 — tolleranza secondo norma/costruttore", value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"dataora", text:"Data/ora di sistema corrette"},
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma tecnico"},
      ]},
    ]
  },

  "sfigmomanometro": {
    label: "Sfigmomanometro automatico (NIBP)", icon: "›", norm: "IEC 80601-2-30:2018",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"involucro", text:"Involucro e display: integri e puliti"},
        {id:"bracciali", text:"Bracciali e tubi: integri, senza tagli, raccordi a tenuta"},
        {id:"valvola", text:"Connettore bracciale e valvola: integri, innesto corretto"},
        {id:"alim", text:"Alimentatore/batteria: integri, batteria non gonfia"},
        {id:"etichette", text:"Etichette CE, n° serie, parte applicata: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Per i dispositivi alimentati da rete eseguire le prove IEC 62353 con safety analyzer.", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica IEC 62353 eseguita (se da rete), esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità di base", items:[
        {id:"acc", text:"Accensione e autotest: nessun errore"},
        {id:"ciclo", text:"Ciclo di misura completo: gonfiaggio, sgonfiaggio graduale, lettura"},
        {id:"modi", text:"Modalità adulto/pediatrico/neonatale (se previste): selezionabili"},
        {id:"sgonfia", text:"Sgonfiaggio rapido di sicurezza (stop): funzionante"},
      ]},
      { id:"pressione", title:"Accuratezza pressione statica (IEC 80601-2-30) — con manometro di riferimento", note:"Collegare un manometro/simulatore NIBP certificato al posto del bracciale (volume di prova). La norma IEC 80601-2-30 richiede accuratezza dell'indicazione di pressione entro ±3 mmHg (o ±2% del valore, il maggiore).", items:[
        {id:"rif", text:"Manometro di riferimento / simulatore NIBP collegato"},
      ], measures:[
        {id:"p_50",  name:"Pressione statica — riferimento 50 mmHg",  unit:"mmHg", expected:"50 ±3 (47–53)",     limitVal:53,  limitMin:47,  value:""},
        {id:"p_150", name:"Pressione statica — riferimento 150 mmHg", unit:"mmHg", expected:"150 ±3 (147–153)", limitVal:153, limitMin:147, value:""},
        {id:"p_250", name:"Pressione statica — riferimento 250 mmHg", unit:"mmHg", expected:"250 ±3 (247–253)", limitVal:253, limitMin:247, value:""},
        {id:"tenuta", name:"Perdita pneumatica (caduta in 1 min a ~250 mmHg)", unit:"mmHg/min", expected:"secondo costruttore (tipico basso)", value:""},
      ]},
      { id:"sicurezza", title:"Sicurezza e allarmi", note:"Verificare la sovrapressione massima e gli allarmi secondo IEC 60601-1-8.", items:[
        {id:"overpress", text:"Limite di sovrapressione (cut-off): interviene entro il massimo dichiarato"},
        {id:"all_err", text:"Allarmi/segnalazioni di errore (bracciale, movimento, fuori range): presenti"},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"dataora", text:"Data/ora corrette"},
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "termometro_clinico": {
    label: "Termometro clinico elettronico", icon: "›", norm: "ISO 80601-2-56:2017",
    sections: [
      { id:"ispezione", title:"Ispezione visiva", items:[
        {id:"involucro", text:"Involucro, display e sonda: integri e puliti"},
        {id:"copri", text:"Copri-sonda (se usa-e-getta): disponibili, integri"},
        {id:"batteria", text:"Batteria/contatti: OK, batteria non gonfia"},
        {id:"etichette", text:"Etichette CE, n° serie: leggibili"},
      ]},
      { id:"funz", title:"Funzionalità di base", items:[
        {id:"acc", text:"Accensione e autotest: nessun errore"},
        {id:"misura", text:"Ciclo di misura completo con segnale di fine misura"},
        {id:"modo", text:"Modalità (predittiva/diretta, sito di misura): selezionabili se previste"},
      ]},
      { id:"accuratezza", title:"Accuratezza (ISO 80601-2-56) — con bagno/simulatore di temperatura", note:"Verificare con bagno termostatico o simulatore certificato. Compilare i limiti secondo ISO 80601-2-56 e/o le specifiche del costruttore (errore massimo di laboratorio, tipicamente molto stretto nel range clinico ~35,5–42 °C).", items:[
        {id:"rif", text:"Riferimento di temperatura certificato pronto"},
      ], measures:[
        {id:"t_37", name:"Lettura — riferimento 37,0 °C", unit:"°C", expected:"37,0 — tolleranza secondo ISO 80601-2-56/costruttore", value:""},
        {id:"t_40", name:"Lettura — riferimento 40,0 °C", unit:"°C", expected:"40,0 — tolleranza secondo ISO 80601-2-56/costruttore", value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "incubatrice_neonatale": {
    label: "Incubatrice neonatale", icon: "›", norm: "IEC 60601-2-19:2009+A1:2016",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"cupola", text:"Cupola/parete: integra, trasparente, guarnizioni a tenuta"},
        {id:"oblo", text:"Oblò e maniche di accesso: chiusura e tenuta corrette"},
        {id:"materasso", text:"Materasso e piano: puliti, integri, inclinazione funzionante"},
        {id:"ruote", text:"Carrello/ruote e freni: stabili e funzionanti"},
        {id:"umidif", text:"Vaschetta umidificazione (se presente): pulita, senza incrostazioni"},
        {id:"etichette", text:"Etichette CE, n° serie, parti applicate: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire le prove IEC 62353 con safety analyzer.", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica IEC 62353 eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità di base", items:[
        {id:"acc", text:"Accensione e autotest: nessun errore"},
        {id:"modo", text:"Controllo temperatura aria / servo-cute (sonda paziente): funzionanti"},
        {id:"sonda", text:"Sonda cutanea: integra, lettura plausibile"},
        {id:"umid_set", text:"Regolazione umidità (se presente): risponde all'impostazione"},
        {id:"o2", text:"Controllo/monitor O2 (se presente): risponde, da verificare con analizzatore"},
      ]},
      { id:"temperatura", title:"Temperatura (IEC 60601-2-19) — con termometro di riferimento", note:"Verificare temperatura e uniformità con termometro/registratore certificato sul piano materasso. Compilare i limiti secondo IEC 60601-2-19 (deviazione, variabilità, uniformità) e/o le specifiche del costruttore.", items:[
        {id:"rif", text:"Termometro di riferimento posizionato sul materasso"},
        {id:"stabile", text:"Temperatura raggiunta e stabile prima della misura"},
      ], measures:[
        {id:"t_set", name:"Temperatura aria vs set-point", unit:"°C", expected:"deviazione secondo IEC 60601-2-19/costruttore", value:""},
        {id:"t_unif", name:"Uniformità sul materasso (max-min tra punti)", unit:"°C", expected:"secondo IEC 60601-2-19/costruttore", value:""},
      ]},
      { id:"allarmi", title:"Allarmi (IEC 60601-1-8 / IEC 60601-2-19)", items:[
        {id:"all_alta", text:"Allarme sovra-temperatura: interviene"},
        {id:"all_sonda", text:"Allarme guasto/scollegamento sonda: interviene"},
        {id:"all_flusso", text:"Allarme guasto ventilazione/flusso aria: interviene"},
        {id:"all_alim", text:"Allarme mancanza alimentazione: interviene"},
        {id:"all_udibile", text:"Segnali acustici e visivi: presenti e percepibili"},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"dataora", text:"Data/ora corrette"},
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "lampada_scialitica": {
    label: "Lampada scialitica (operatoria)", icon: "›", norm: "IEC 60601-2-41:2009+A1:2013",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"cupola", text:"Cupola/corpo lampada: integro, pulito"},
        {id:"bracci", text:"Bracci e snodi: tenuta in posizione, movimenti fluidi, nessun cedimento"},
        {id:"maniglia", text:"Maniglia centrale (sterilizzabile/usa-e-getta): presente, fissaggio OK"},
        {id:"led", text:"LED/lampade: tutti funzionanti, nessun modulo spento"},
        {id:"etichette", text:"Etichette CE, n° serie: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire le prove IEC 62353 con safety analyzer (alimentazione e, se presente, gruppo di continuità).", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica IEC 62353 eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità", items:[
        {id:"acc", text:"Accensione/spegnimento: corretti"},
        {id:"dimmer", text:"Regolazione intensità (dimmer): tutti i livelli funzionanti"},
        {id:"fuoco", text:"Regolazione fuoco/diametro campo (se prevista): funzionante"},
        {id:"emergenza", text:"Alimentazione di emergenza/batteria (se presente): commutazione OK"},
        {id:"posiz", text:"Posizionamento e stabilità nelle varie angolazioni"},
      ]},
      { id:"prestazioni", title:"Prestazioni illuminotecniche (IEC 60601-2-41)", note:"Parametri come illuminamento centrale (Ec), diametro del campo, temperatura di colore e resa cromatica (Ra) si misurano con luxmetro/strumenti idonei. Compilare secondo IEC 60601-2-41 e/o le specifiche del costruttore — NON stimare a vista.", items:[
        {id:"strum", text:"Strumento di misura (luxmetro) disponibile, se la misura è richiesta"},
      ], measures:[
        {id:"ec", name:"Illuminamento centrale Ec (se misurato)", unit:"lux", expected:"secondo IEC 60601-2-41/costruttore", value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "fototerapia_neonatale": {
    label: "Lampada fototerapia neonatale", icon: "›", norm: "IEC 60601-2-50:2009+A1:2016",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"corpo", text:"Corpo lampada e supporto: integri, stabili"},
        {id:"led", text:"LED/tubi fototerapia: tutti funzionanti, nessuno annerito/spento"},
        {id:"schermo", text:"Schermo/diffusore: pulito, integro"},
        {id:"contaore", text:"Contaore lampada/sorgente: leggibile (durata residua)"},
        {id:"etichette", text:"Etichette CE, n° serie: leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire le prove IEC 62353 con safety analyzer.", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica IEC 62353 eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità", items:[
        {id:"acc", text:"Accensione/spegnimento e timer (se presente): corretti"},
        {id:"intensita", text:"Regolazione intensità (se prevista): funzionante"},
        {id:"distanza", text:"Regolazione altezza/distanza dal neonato: funzionante"},
      ]},
      { id:"prestazioni", title:"Irradianza (IEC 60601-2-50) — con radiometro", note:"L'irradianza spettrale efficace (banda ~400–500 nm) si misura SOLO con radiometro per fototerapia certificato, alla distanza d'uso. Compilare secondo IEC 60601-2-50 e/o le specifiche del costruttore — NON stimare a vista.", items:[
        {id:"radiom", text:"Radiometro per fototerapia disponibile e tarato"},
      ], measures:[
        {id:"irr", name:"Irradianza alla distanza d'uso (se misurata)", unit:"µW/cm²/nm", expected:"secondo IEC 60601-2-50/costruttore", value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato; ore lampada annotate"},
      ]},
    ]
  },

  "elettrostimolatore": {
    label: "Elettrostimolatore / TENS", icon: "›", norm: "IEC 60601-2-10:2012",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"involucro", text:"Involucro, display e comandi: integri e puliti"},
        {id:"cavi", text:"Cavi paziente ed elettrodi: isolamento integro, connettori OK"},
        {id:"batteria", text:"Batteria/alimentatore: integri, batteria non gonfia"},
        {id:"etichette", text:"Etichette CE, n° serie, parti applicate (tipo BF/CF): leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Per i dispositivi alimentati da rete eseguire le prove IEC 62353. Le parti applicate degli stimolatori devono essere tipo BF o CF (IEC 60601-2-10).", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica IEC 62353 eseguita (se da rete), esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità di base", items:[
        {id:"acc", text:"Accensione e autotest: nessun errore"},
        {id:"prog", text:"Programmi/parametri (frequenza, durata impulso, ampiezza): selezionabili"},
        {id:"intens", text:"Regolazione intensità: graduale, parte da zero"},
        {id:"open_circ", text:"Rilevazione elettrodo staccato / circuito aperto: intensità si annulla"},
        {id:"timer", text:"Timer di trattamento: funzionante"},
      ]},
      { id:"prestazioni", title:"Uscita (IEC 60601-2-10) — con oscilloscopio/carico resistivo", note:"Misurare i parametri d'uscita su carico resistivo idoneo (es. 500 Ω) con oscilloscopio. Compilare secondo IEC 60601-2-10 e/o le specifiche del costruttore (corrente/tensione max, frequenza, durata impulso). N.B.: per uscite > 10 mA o 10 V valgono requisiti aggiuntivi della norma.", items:[
        {id:"carico", text:"Carico resistivo e strumento di misura collegati"},
        {id:"forma", text:"Forma d'onda d'uscita: conforme alle specifiche costruttore"},
      ], measures:[
        {id:"i_out", name:"Corrente d'uscita su carico (a impostazione di rif.)", unit:"mA", expected:"secondo IEC 60601-2-10/costruttore", value:""},
        {id:"freq", name:"Frequenza impulsi (a impostazione di rif.)", unit:"Hz", expected:"secondo costruttore", value:""},
        {id:"width", name:"Durata impulso (a impostazione di rif.)", unit:"µs", expected:"secondo costruttore", value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"registro", text:"Registro manutenzioni aggiornato con data e firma"},
      ]},
    ]
  },

  "autoclave": {
    label: "Autoclave / sterilizzatrice a vapore", icon: "›", norm: "EN 13060:2014+A1:2018",
    sections: [
      { id:"ispezione", title:"Ispezione visiva e meccanica", items:[
        {id:"camera", text:"Camera e guarnizione portello: pulite, integre, tenuta corretta"},
        {id:"portello", text:"Chiusura/blocco portello: funzionante, sicurezza attiva"},
        {id:"acqua", text:"Serbatoi acqua pulita/usata: livelli e qualità acqua OK"},
        {id:"filtro", text:"Filtro/i e cestelli: puliti, integri"},
        {id:"etichette", text:"Etichette CE, n° serie, tipo cicli (B/N/S): leggibili"},
      ]},
      { id:"sicurezza_el", title:"Sicurezza elettrica (IEC 62353)", note:"Eseguire le prove IEC 62353 con safety analyzer.", items:[
        {id:"se_fatto", text:"Verifica di sicurezza elettrica IEC 62353 eseguita, esito registrato"},
      ]},
      { id:"funz", title:"Funzionalità e cicli", items:[
        {id:"acc", text:"Accensione e autotest: nessun allarme anomalo"},
        {id:"cicli", text:"Selezione cicli (134 °C, 121 °C, ecc.): avviabili e completati"},
        {id:"stampa", text:"Stampante/registrazione ciclo (data, parametri): funzionante"},
        {id:"sicurezze", text:"Sicurezze (sovrapressione, sovratemperatura, blocco portello): integre"},
      ]},
      { id:"test", title:"Test periodici (EN 13060)", note:"Test previsti per i piccoli sterilizzatori a vapore: vuoto/tenuta, penetrazione vapore. Per i cicli tipo B usare l'helix; il Bowie-Dick per i carichi porosi.", items:[
        {id:"vacuum", text:"Vacuum/leak test (tenuta del vuoto): superato"},
        {id:"bowie", text:"Bowie-Dick / Helix (penetrazione vapore): superato"},
        {id:"indicatori", text:"Indicatori chimici/biologici secondo protocollo: esito conforme"},
      ]},
      { id:"plateau", title:"Parametri di sterilizzazione (plateau) — con data-logger/registro ciclo", note:"Confrontare i valori del ciclo con i parametri standard di sterilizzazione a vapore saturo. Tipici: 134 °C con plateau ≥ 3 min (banda 134–137 °C); 121 °C con plateau ≥ 15 min (banda 121–124 °C). Verificare su stampa ciclo o data-logger calibrato.", items:[
        {id:"saturo", text:"Vapore saturo (relazione temperatura/pressione corretta)"},
      ], measures:[
        {id:"t_134", name:"Temperatura di plateau — ciclo 134 °C", unit:"°C", expected:"134–137 °C", limitVal:137, limitMin:134, value:""},
        {id:"h_134", name:"Durata plateau — ciclo 134 °C", unit:"min", expected:"≥ 3 min", limitMin:3, invertPass:true, value:""},
        {id:"t_121", name:"Temperatura di plateau — ciclo 121 °C", unit:"°C", expected:"121–124 °C", limitVal:124, limitMin:121, value:""},
        {id:"h_121", name:"Durata plateau — ciclo 121 °C", unit:"min", expected:"≥ 15 min", limitMin:15, invertPass:true, value:""},
      ]},
      { id:"doc", title:"Registro e documentazione", items:[
        {id:"dataora", text:"Data/ora di sistema corrette"},
        {id:"registro", text:"Registro manutenzioni e test periodici aggiornato con firma"},
      ]},
    ]
  },

"pulsossimetro": {
    label: "Pulsossimetro / SpO2 monitor", icon: "›", norm: "ISO 80601-2-61:2017",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva e meccanica",
        items: [
          {id:"involucro",   text:"Involucro/display: integro, privo di crepe o danni"},
          {id:"cavo_paz",    text:"Cavo paziente e sensore: integri, isolamento OK"},
          {id:"sensore",     text:"Sensore SpO2: clip/finger pulita, LED visibili e funzionanti"},
          {id:"alimentaz",   text:"Cavo alimentazione / alimentatore: integro (se da rete)"},
          {id:"batteria",    text:"Batteria interna (se presente): non gonfia, contatti puliti"},
          {id:"etichette",   text:"Etichette CE, n° serie, classificazione: leggibili"},
        ]
      },
      {
        id: "alimentazione", title: "Alimentazione e batteria",
        note: "ISO 80601-2-61: i pulsossimetri portatili devono funzionare almeno 8 ore con batteria carica (manutenzione tipica).",
        items: [
          {id:"acc_rete",     text:"Accensione da rete: corretta, indicatori luminosi normali"},
          {id:"acc_batteria", text:"Accensione da batteria: corretta, indicatore stato carica visibile"},
          {id:"low_batt",     text:"Allarme batteria scarica: attivo (test con tensione bassa o storia clinica)"},
        ],
        measures: [
          {id:"batt_perc", name:"Carica residua batteria", unit:"%", expected:"≥ 80% dopo ricarica completa", limitVal:100, limitMin:80, invertPass:true, value:""},
          {id:"auton",     name:"Autonomia (se misurata)", unit:"h", expected:"≥ 8 h (portatili)", limitMin:8, invertPass:true, value:""},
        ]
      },
      {
        id: "accuratezza_spo2", title: "Accuratezza SpO2 (ISO 80601-2-61)",
        note: "Verificare con simulatore SpO2 certificato (es. Fluke ProSim 8, Index 2 SpO2, Rigel UNI-SiM). Tolleranza tipica ±2% nel range 70-100%. Test su almeno 3 punti: 90%, 80%, 70%.",
        items: [
          {id:"simulatore",  text:"Simulatore SpO2 collegato e calibrato"},
          {id:"morf_pleth",  text:"Forma d'onda pletismografica: presente e stabile sul display"},
        ],
        measures: [
          {id:"spo2_97", name:"SpO2 simulato 97% — lettura", unit:"%", expected:"97 ±2 (95-99)", limitVal:99, limitMin:95, value:""},
          {id:"spo2_90", name:"SpO2 simulato 90% — lettura", unit:"%", expected:"90 ±2 (88-92)", limitVal:92, limitMin:88, value:""},
          {id:"spo2_80", name:"SpO2 simulato 80% — lettura", unit:"%", expected:"80 ±2 (78-82)", limitVal:82, limitMin:78, value:""},
          {id:"spo2_70", name:"SpO2 simulato 70% — lettura", unit:"%", expected:"70 ±3 (67-73)", limitVal:73, limitMin:67, value:""},
        ]
      },
      {
        id: "accuratezza_fc", title: "Accuratezza frequenza cardiaca",
        note: "Verificare con simulatore impostato a diverse frequenze. Tolleranza tipica ±2% o ±2 bpm (il valore maggiore).",
        items: [
          {id:"fc_traccia", text:"Tracciato FC stabile, senza artefatti"},
        ],
        measures: [
          {id:"fc_30",  name:"FC simulato 30 bpm — lettura",  unit:"bpm", expected:"30 ±2 (28-32)",    limitVal:32,  limitMin:28,  value:""},
          {id:"fc_60",  name:"FC simulato 60 bpm — lettura",  unit:"bpm", expected:"60 ±2 (58-62)",    limitVal:62,  limitMin:58,  value:""},
          {id:"fc_120", name:"FC simulato 120 bpm — lettura", unit:"bpm", expected:"120 ±3 (117-123)", limitVal:123, limitMin:117, value:""},
          {id:"fc_200", name:"FC simulato 200 bpm — lettura", unit:"bpm", expected:"200 ±4 (196-204)", limitVal:204, limitMin:196, value:""},
        ]
      },
      {
        id: "allarmi", title: "Allarmi (IEC 60601-1-8)",
        note: "Verificare attivazione allarmi acustici e visivi al superamento delle soglie impostate.",
        items: [
          {id:"all_spo2_low",  text:"Allarme SpO2 basso: si attiva entro 10s dal superamento soglia"},
          {id:"all_spo2_high", text:"Allarme SpO2 alto: si attiva entro 10s (se previsto)"},
          {id:"all_fc_low",    text:"Allarme FC bassa: si attiva entro 10s"},
          {id:"all_fc_high",   text:"Allarme FC alta: si attiva entro 10s"},
          {id:"all_sensore",   text:"Allarme sensore scollegato/no segnale: si attiva entro 10s"},
          {id:"all_audio",     text:"Segnale acustico udibile a 1m (>= 45 dB)"},
          {id:"all_visivo",    text:"Segnale visivo (icona/LED): chiaramente visibile"},
          {id:"all_pausa",     text:"Funzione pausa/silenziamento allarme: funzionante, ripristino automatico <= 120s"},
        ]
      },
      {
        id: "perfusione", title: "Indice di perfusione (PI) - OPZIONALE",
        note: "OPZIONALE - solo se il dispositivo riporta l'indice di perfusione (PI). Verifica del comportamento a basso segnale.",
        items: [
          {id:"pi_basso", text:"Lettura PI bassa (< 1%): dispositivo riconosce condizione e segnala bassa perfusione"},
          {id:"pi_norm",  text:"Lettura PI normale (3-10%): valore stabile su simulatore"},
        ]
      },
      {
        id: "registro", title: "Registro e documentazione",
        items: [
          {id:"data_ora",            text:"Data/ora di sistema corrette"},
          {id:"memorizzazione",      text:"Memorizzazione trend (se presente): funzionante"},
          {id:"trasferimento",       text:"Trasferimento dati / interfaccia (USB/Bluetooth, se prevista): funzionante"},
          {id:"registro_aggiornato", text:"Registro manutenzioni aggiornato con data e firma tecnico"},
        ]
      },
    ]
  },


  // ─── DEFIBRILLATORE MANUALE (IEC 60601-2-4:2010+AMD1:2021) ──────────────
  "defibrillatore": {
    label: "Defibrillatore manuale", icon: "›", norm: "IEC 60601-2-4:2010+AMD1:2021",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva e meccanica",
        items: [
          {id:"cavo_al",    text:"Cavo alimentazione e spina: integri, nessun danno visibile"},
          {id:"involucro",  text:"Involucro e display: privi di crepe, bruciature o danni meccanici"},
          {id:"piastre",    text:"Palette/piastre manuali: superficie conduttiva integra, impugnatura isolata"},
          {id:"pad_adesivi",text:"Pad adesivi (se presenti): non scaduti, gel integro, connettori OK"},
          {id:"cavo_ecg",   text:"Cavo ECG paziente e connettori: integrità isolamento, clip/elettrodi funzionanti"},
          {id:"stampante",  text:"Stampante termica: carta presente, funzionante"},
          {id:"etichette",  text:"Etichette di sicurezza, classe e numero serie: leggibili e presenti"},
        ]
      },
      {
        id: "batteria", title: "Batteria e alimentazione",
        items: [
          {id:"batt_scad",    text:"Data scadenza batteria: non superata"},
          {id:"batt_carica",  text:"Indicatore carica: livello adeguato per utilizzo"},
          {id:"batt_autotest",text:"Autotest batteria (se previsto dal costruttore): superato"},
          {id:"rete_ok",      text:"Funzionamento da rete: corretto, indicatore carica attivo"},
        ],
        measures: [
          {id:"batt_perc", name:"Carica residua batteria", unit:"%", expected:"≥ 80%", limitVal:80, invertPass:true, value:""},
        ]
      },
      {
        id: "funz_base", title: "Funzionalità di base",
        items: [
          {id:"accensione",     text:"Accensione: nessun messaggio di errore o allarme anomalo"},
          {id:"display",        text:"Display: leggibile, nessun pixel morto o artefatto"},
          {id:"sel_energia",    text:"Selettore energia: funzionante a tutti i livelli (da minimo a massimo)"},
          {id:"puls_carica",    text:"Tasto CARICA: funzionante, tempo carica entro specifiche costruttore"},
          {id:"puls_scarica",   text:"Tasto SCARICA: funzionante (test su analizzatore/carico resistivo)"},
          {id:"beep_carica",    text:"Segnale acustico carica completata: presente e udibile"},
          {id:"annullamento",   text:"Annullamento carica (tasto o timeout): funzionante"},
        ]
      },
      {
        id: "energia", title: "Energia erogata (IEC 60601-2-4 cl.201.12.4.101)",
        note: "Misurare con analizzatore certificato su carico resistivo 50 Ω. Tolleranza ammessa: ±15% del valore selezionato oppure ±3 J (si applica il maggiore dei due). Eseguire anche a 25 Ω e 175 Ω se richiesto dal costruttore.",
        items: [
          {id:"carico_50",  text:"Analizzatore collegato: carico 50 Ω"},
          {id:"forma_onda", text:"Forma d'onda di scarica (bifasica/monofasica): conforme alle specifiche costruttore"},
        ],
        measures: [
          {id:"e_low",    name:"Energia — selezione minima",   unit:"J", expected:"sel. ±15% o ±3J", value:""},
          {id:"e_50j",    name:"Energia — selezione 50 J",     unit:"J", expected:"50 ±15% (42.5–57.5) o ±3J", limitVal:57.5, limitMin:42.5, value:""},
          {id:"e_100j",   name:"Energia — selezione 100 J",    unit:"J", expected:"100 ±15% (85–115)", limitVal:115, limitMin:85, value:""},
          {id:"e_150j",   name:"Energia — selezione 150 J",    unit:"J", expected:"150 ±15% (127.5–172.5)", limitVal:172.5, limitMin:127.5, value:""},
          {id:"e_200j",   name:"Energia — selezione 200 J",    unit:"J", expected:"200 ±15% (170–230)", limitVal:230, limitMin:170, value:""},
          {id:"e_max",    name:"Energia — selezione massima",  unit:"J", expected:"max ±15% o ±3J", value:""},
          {id:"t_carica", name:"Tempo di carica a energia max",unit:"s", expected:"≤ 15 s (IEC 60601-2-4)", limitVal:15, value:""},
        ]
      },
      {
        id: "sync", title: "Cardioversione sincronizzata (IEC 60601-2-4 cl.201.12.4.4)",
        note: "Il ritardo tra picco R e inizio scarica deve essere < 60 ms (IEC 60601-2-4).",
        items: [
          {id:"sync_attiva",    text:"Modalità SYNC: attivabile, indicatore visivo presente"},
          {id:"sync_marker",    text:"Marker di sincronismo sull'onda R del tracciato ECG: visibile"},
          {id:"sync_auto_off",  text:"Disattivazione automatica SYNC dopo scarica: confermata"},
        ],
        measures: [
          {id:"sync_delay", name:"Ritardo scarica dal picco R (sync delay)", unit:"ms", expected:"< 60 ms", limitVal:60, value:""},
        ]
      },
      {
        id: "ecg_mon", title: "Monitoraggio ECG (IEC 60601-2-27)",
        items: [
          {id:"ecg_tracciato",    text:"Tracciato ECG su simulatore: morfologia corretta, no artefatti"},
          {id:"ecg_derivazioni",  text:"Selezione derivazioni (I, II, III, aVR, aVL, aVF, V): funzionante"},
          {id:"ecg_allarmi",      text:"Allarmi FC alta/bassa: attivazione nei range impostati"},
          {id:"ecg_vf",           text:"Rilevazione FV (se previsto): segnale di allarme presente"},
        ],
        measures: [
          {id:"fc_sim60",  name:"FC visualizzata — simulatore a 60 bpm",  unit:"bpm", expected:"60 ±1% o ±1 bpm", limitVal:61, limitMin:59, value:""},
          {id:"fc_sim120", name:"FC visualizzata — simulatore a 120 bpm", unit:"bpm", expected:"120 ±1% o ±1 bpm", limitVal:122, limitMin:118, value:""},
        ]
      },
      {
        id: "pacing", title: "Pacing esterno transcutaneo (se presente)",
        items: [
          {id:"pacing_attiva",   text:"Modalità pacing: attivabile"},
          {id:"pacing_freq",     text:"Frequenza pacing: selezionabile nel range indicato"},
          {id:"pacing_corrente", text:"Corrente stimolazione: selezionabile da min a max"},
          {id:"pacing_cattura",  text:"Cattura ventricolare verificabile su simulatore ECG"},
          {id:"pacing_spike",    text:"Spike di pacing visibile sul tracciato"},
        ]
      },
    ]
  },

  // ─── DAE (IEC 60601-2-4 + D.Lgs. 53/2021 + Circ. Min. Salute 2021) ──────
  "dae": {
    label: "DAE — Defibrillatore Automatico Esterno", icon: "DAE", norm: "IEC 60601-2-4 / D.Lgs. 53/2021",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva e stato operativo",
        items: [
          {id:"contenitore",  text:"Contenitore/zaino: integrità, chiusura funzionante"},
          {id:"segnalatore",  text:"Segnalatore di pronto intervento (luce verde/LED): attivo"},
          {id:"involucro",    text:"Involucro DAE: privo di danni, sporco o umidità"},
          {id:"display",      text:"Display/segnalazioni vocali: funzionanti"},
          {id:"pad_adulti",   text:"Pad adulti: non scaduti, confezionamento integro"},
          {id:"pad_pediatrici",text:"Pad pediatrici (se presenti): non scaduti, integri"},
          {id:"accessori",    text:"Accessori kit (forbici, rasoio, guanti, garze): presenti e integri"},
        ]
      },
      {
        id: "batteria", title: "Batteria (IEC 60601-2-4)",
        items: [
          {id:"batt_scad",   text:"Data scadenza batteria: non superata"},
          {id:"batt_status", text:"Indicatore stato batteria: OK / pronto"},
          {id:"batt_autotest",text:"Autotest automatico superato (log di sistema)"},
        ],
        measures: [
          {id:"batt_perc", name:"Carica residua batteria", unit:"%", expected:"≥ 80%", limitVal:80, invertPass:true, value:""},
          {id:"n_scariche", name:"Numero scariche residue stimate", unit:"n", expected:"≥ 100 scariche", limitVal:100, invertPass:true, value:""},
        ]
      },
      {
        id: "funz_dae", title: "Verifica funzionale (con analizzatore/simulatore)",
        note: "Usare simulatore ECG con pattern FV/TV. NON eseguire scarica su persona.",
        items: [
          {id:"analisi_fv",  text:"Analisi ritmo FV: DAE consiglia scarica correttamente"},
          {id:"analisi_rns", text:"Analisi ritmo sinusale normale: DAE NON consiglia scarica"},
          {id:"guida_vocale",text:"Guida vocale durante procedura: chiara e corretta"},
          {id:"segnale_cpr", text:"Segnale guida RCP post-scarica: presente (se previsto)"},
        ]
      },
      {
        id: "energia_dae", title: "Verifica energia erogata",
        note: "Misurare con analizzatore su carico 50 Ω. Tolleranza ±15% o ±3J.",
        items: [
          {id:"scarica_ok", text:"Scarica su carico 50 Ω: eseguita correttamente"},
        ],
        measures: [
          {id:"e_scarica1", name:"Energia 1ª scarica", unit:"J", expected:"secondo costruttore ±15%", value:""},
          {id:"e_scarica2", name:"Energia 2ª scarica (se escalation)", unit:"J", expected:"secondo costruttore ±15%", value:""},
        ]
      },
      {
        id: "registro", title: "Registro e documentazione",
        items: [
          {id:"log_ok",     text:"Log eventi scaricato e verificato (nessun allarme anomalo)"},
          {id:"data_manut", text:"Data prossima manutenzione/scadenza aggiornata"},
          {id:"posizione",  text:"Segnaletica posizione DAE: visibile e corretta"},
          {id:"registro_aggiornato", text:"Registro manutenzioni aggiornato"},
        ]
      },
    ]
  },

  // ─── ASPIRATORE CHIRURGICO (ISO 10079-1:2015) ────────────────────────────
  "aspiratore_chirurgico": {
    label: "Aspiratore chirurgico / da secreti", icon: "ASP", norm: "ISO 10079-1:2015",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva e meccanica",
        items: [
          {id:"cavo_al",     text:"Cavo alimentazione: integro, spina OK"},
          {id:"involucro",   text:"Involucro e carrello (se presente): integrità strutturale"},
          {id:"tubazioni",   text:"Tubazioni, raccordi e connettori: integri, senza cricche o occlusioni"},
          {id:"filtro_batt", text:"Filtro batterico: presente, non scaduto, non otturato"},
          {id:"filtro_idr",  text:"Filtro idrofobico (protezione pompa): presente e integro"},
          {id:"contenitore", text:"Contenitore liquidi: integro, guarnizioni OK, sistema di smaltimento funzionante"},
          {id:"overflow",    text:"Dispositivo di protezione overflow: presente e funzionante"},
          {id:"valvola_sic", text:"Valvola di sicurezza/limitatore di pressione: presente"},
        ]
      },
      {
        id: "vuoto", title: "Verifica del vuoto (ISO 10079-1 cl.5.2)",
        note: "Aspiratore chirurgico: vuoto max ≥ 80 kPa. Aspiratore da secreti: ≥ 60 kPa. Misurare a contenitore chiuso.",
        items: [
          {id:"otturazione", text:"Occlusione dell'uscita paziente: corretta per test"},
        ],
        measures: [
          {id:"vuoto_max",   name:"Vuoto massimo (contenitore chiuso)", unit:"kPa", expected:"≥ 80 kPa (chirurgico) / ≥ 60 kPa (secreti)", limitVal:80, invertPass:true, value:""},
          {id:"t_vuoto",     name:"Tempo raggiungimento vuoto max", unit:"s", expected:"< 20 s (chirurgico)", limitVal:20, value:""},
        ]
      },
      {
        id: "portata", title: "Verifica portata (ISO 10079-1 cl.5.3)",
        note: "Portata libera misurata a pressione atmosferica. Chirurgico: ≥ 25 L/min. Da secreti: ≥ 15 L/min.",
        measures: [
          {id:"portata_lib", name:"Portata libera (max, a 0 kPa)",      unit:"L/min", expected:"≥ 25 L/min (chir.)", limitVal:25, invertPass:true, value:""},
          {id:"portata_50",  name:"Portata a 50 kPa di depressione",    unit:"L/min", expected:"≥ 15 L/min", limitVal:15, invertPass:true, value:""},
          {id:"regolazione", name:"Depressione regolabile (valore max impostato)", unit:"kPa", expected:"regolabile", value:""},
        ]
      },
      {
        id: "batteria_asp", title: "Batteria (se dispositivo portatile)",
        items: [
          {id:"batt_scad", text:"Batteria: non scaduta, carica adeguata"},
          {id:"autonomia", text:"Autonomia su batteria: sufficiente per l'uso previsto"},
        ],
        measures: [
          {id:"batt_perc", name:"Carica residua", unit:"%", expected:"≥ 80%", limitVal:80, invertPass:true, value:""},
        ]
      },
    ]
  },

  // ─── ELETTROBISTURI HF (IEC 60601-2-2:2017) ─────────────────────────────
  "elettrobisturi": {
    label: "Elettrobisturi / Unità HF chirurgica", icon: "ESU", norm: "IEC 60601-2-2:2017",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva",
        items: [
          {id:"cavo_al",     text:"Cavo alimentazione e spina: integrità isolamento"},
          {id:"involucro",   text:"Involucro: privo di danni, ventilazione libera"},
          {id:"cavi_att",    text:"Cavi elettrodi attivi (monopolare/bipolare): isolamento integro, connettori OK"},
          {id:"elettrodo_n", text:"Elettrodo neutro (piastra): integrità, connettore, cavo"},
          {id:"pedale",      text:"Pedale di comando (se presente): funzionante, cavo integro"},
          {id:"etichette",   text:"Etichette potenza, avvertenze e classe: leggibili"},
        ]
      },
      {
        id: "funz_hf", title: "Verifica funzionale",
        items: [
          {id:"accensione",   text:"Accensione: nessun allarme anomalo"},
          {id:"display",      text:"Display potenza e modalità: corretto"},
          {id:"sel_modo",     text:"Selezione modalità (CUT/COAG/BLEND): funzionante"},
          {id:"attivazione",  text:"Attivazione manuale e pedale: funzionanti"},
          {id:"allarme_en",   text:"Allarme elettrodo neutro disconnesso: attivo (IEC 60601-2-2 cl.201.8.4)"},
        ]
      },
      {
        id: "potenza", title: "Verifica potenza erogata (IEC 60601-2-2 cl.201.12.4.101)",
        note: "Misurare con analizzatore HF certificato su carico resistivo. Tolleranza: ±20% della potenza nominale per ciascuna modalità.",
        items: [
          {id:"carico_300", text:"Analizzatore su carico resistivo 300 Ω (monopolare standard)"},
        ],
        measures: [
          {id:"p_cut_low",  name:"Potenza CUT — selezione bassa (es. 30W)",   unit:"W", expected:"30 ±20% (24–36 W)", limitVal:36, limitMin:24, value:""},
          {id:"p_cut_med",  name:"Potenza CUT — selezione media (es. 60W)",   unit:"W", expected:"60 ±20% (48–72 W)", limitVal:72, limitMin:48, value:""},
          {id:"p_cut_high", name:"Potenza CUT — selezione alta (es. 100W)",   unit:"W", expected:"100 ±20% (80–120 W)", limitVal:120, limitMin:80, value:""},
          {id:"p_coag_low", name:"Potenza COAG — selezione bassa",            unit:"W", expected:"secondo costruttore ±20%", value:""},
          {id:"p_coag_high",name:"Potenza COAG — selezione alta",             unit:"W", expected:"secondo costruttore ±20%", value:""},
          {id:"p_bip",      name:"Potenza BIPOLARE (se presente)",            unit:"W", expected:"secondo costruttore ±20%", value:""},
          {id:"i_hf_leak",  name:"Corrente di perdita HF (IEC 60601-2-2 cl.202.8.4)", unit:"mA", expected:"< 150 mA", limitVal:150, value:""},
        ]
      },
    ]
  },

  // ─── MONITOR MULTIPARAMETRICO (IEC 60601-2-27/30/49, ISO 80601-2-61) ────
  "monitor_multipar": {
    label: "Monitor multiparametrico", icon: "MON", norm: "IEC 60601-2-27/30/49 · ISO 80601-2-61",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva",
        items: [
          {id:"cavo_al",    text:"Cavo alimentazione: integro"},
          {id:"involucro",  text:"Involucro e schermo: privi di danni, schermo leggibile"},
          {id:"cavi_paz",   text:"Cavi paziente (ECG, SpO2, NIBP, temperatura): integrità e connettori"},
          {id:"manicotti",  text:"Manicotti NIBP: integrità, assenza perdite d'aria"},
          {id:"sensori",    text:"Sensori SpO2 e temperatura: condizioni operative OK"},
        ]
      },
      {
        id: "ecg_mon", title: "ECG (IEC 60601-2-27)",
        note: "Tolleranza FC: ±1% del valore visualizzato oppure ±1 bpm (il maggiore dei due).",
        items: [
          {id:"tracciato",    text:"Tracciato ECG con simulatore: morfologia corretta, assenza artefatti"},
          {id:"derivazioni",  text:"Selezione derivazioni: tutte funzionanti (almeno I, II, III)"},
          {id:"allarmi_fc",   text:"Allarmi FC alta/bassa: attivazione nei limiti impostati"},
          {id:"st_analisi",   text:"Analisi del tratto ST (se presente): visualizzazione corretta"},
        ],
        measures: [
          {id:"fc_30",  name:"FC — simulatore 30 bpm",  unit:"bpm", expected:"30 ±1 bpm", limitVal:31, limitMin:29, value:""},
          {id:"fc_60",  name:"FC — simulatore 60 bpm",  unit:"bpm", expected:"60 ±1 bpm", limitVal:61, limitMin:59, value:""},
          {id:"fc_120", name:"FC — simulatore 120 bpm", unit:"bpm", expected:"120 ±1 bpm", limitVal:121, limitMin:119, value:""},
          {id:"fc_200", name:"FC — simulatore 200 bpm", unit:"bpm", expected:"200 ±1% o ±1 bpm", limitVal:202, limitMin:198, value:""},
        ]
      },
      {
        id: "spo2", title: "SpO₂ (ISO 80601-2-61)",
        note: "Accuratezza richiesta: ±3% ARMS nel range 70–100% SaO2.",
        items: [
          {id:"spo2_display", text:"Visualizzazione SpO2 e curva pletismografica: corretta"},
          {id:"spo2_allarmi", text:"Allarmi SpO2 bassa: attivazione corretta"},
        ],
        measures: [
          {id:"spo2_98", name:"SpO2 — simulatore 98%", unit:"%", expected:"98 ±3% (95–100)", limitVal:100, limitMin:95, value:""},
          {id:"spo2_90", name:"SpO2 — simulatore 90%", unit:"%", expected:"90 ±3% (87–93)", limitVal:93, limitMin:87, value:""},
          {id:"spo2_80", name:"SpO2 — simulatore 80%", unit:"%", expected:"80 ±3% (77–83)", limitVal:83, limitMin:77, value:""},
          {id:"fc_spo2", name:"FC da SpO2 — simulatore 60 bpm", unit:"bpm", expected:"60 ±3 bpm", limitVal:63, limitMin:57, value:""},
        ]
      },
      {
        id: "nibp", title: "NIBP — PA non invasiva (IEC 60601-2-30)",
        note: "Errore medio ≤ 5 mmHg, deviazione standard ≤ 8 mmHg (IEC 60601-2-30 cl.201.12.1.101).",
        items: [
          {id:"gonfiaggio",   text:"Gonfiaggio e sgonfiaggio automatico: corretto"},
          {id:"allarmi_pa",   text:"Allarmi PA alta/bassa: attivazione corretta"},
          {id:"modalita",     text:"Modalità manuale, automatica e STAT: funzionanti"},
        ],
        measures: [
          {id:"pa_sis_120", name:"PA sistolica — riferimento 120 mmHg", unit:"mmHg", expected:"120 ±5 mmHg (115–125)", limitVal:125, limitMin:115, value:""},
          {id:"pa_dias_80", name:"PA diastolica — riferimento 80 mmHg", unit:"mmHg", expected:"80 ±5 mmHg (75–85)", limitVal:85, limitMin:75, value:""},
          {id:"pa_map_93",  name:"PA media (MAP) — riferimento 93 mmHg", unit:"mmHg", expected:"93 ±5 mmHg", limitVal:98, limitMin:88, value:""},
        ]
      },
      {
        id: "temp", title: "Temperatura (IEC 60601-2-56)",
        note: "Accuratezza richiesta: ±0.3°C nel range clinico 35–42°C.",
        measures: [
          {id:"temp_37", name:"Temperatura — riferimento 37.0°C", unit:"°C", expected:"37.0 ±0.3°C (36.7–37.3)", limitVal:37.3, limitMin:36.7, value:""},
          {id:"temp_39", name:"Temperatura — riferimento 39.0°C", unit:"°C", expected:"39.0 ±0.3°C (38.7–39.3)", limitVal:39.3, limitMin:38.7, value:""},
        ]
      },
      {
        id: "allarmi_mon", title: "Sistema allarmi (IEC 60601-1-8)",
        note: "IEC 60601-1-8 impone che tutti gli allarmi di priorità alta siano visivi E acustici.",
        items: [
          {id:"allarme_vis",  text:"Allarmi alta priorità: segnalazione visiva (lampeggio rosso) presente"},
          {id:"allarme_ac",   text:"Allarmi alta priorità: segnalazione acustica presente e udibile"},
          {id:"allarme_sil",  text:"Silenziamento allarmi: funzionante con ripristino automatico"},
          {id:"allarme_tecn", text:"Allarmi tecnici (guasto tecnico, batteria scarica): attivazione corretta"},
        ]
      },
      {
        id: "etco2", title: "etCO₂ (ISO 80601-2-55) — se presente",
        measures: [
          {id:"etco2_val", name:"etCO2 — gas di riferimento (es. 38 mmHg)", unit:"mmHg", expected:"±2 mmHg o ±8%", value:""},
          {id:"fr_etco2",  name:"FR da capnografia", unit:"atti/min", expected:"±1 atto/min", value:""},
        ]
      },
    ]
  },

  // ─── VENTILATORE POLMONARE (ISO 80601-2-12:2020) ─────────────────────────
  "ventilatore": {
    label: "Ventilatore polmonare (terapia intensiva)", icon: "VEN", norm: "ISO 80601-2-12:2020",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva e meccanica",
        items: [
          {id:"cavo_al",     text:"Cavo alimentazione e spina: integri"},
          {id:"involucro",   text:"Involucro: privo di danni, ventilazione libera"},
          {id:"circuito",    text:"Circuito paziente: integrità tubi, raccordi, valvole espiratoria/inspiratoria"},
          {id:"filtri",      text:"Filtri (antibatterico, HMEF): presenti e non scaduti"},
          {id:"sensori_fl",  name:"Sensori di flusso e pressione: puliti, non otturati"},
          {id:"umidif",      text:"Umidificatore (se presente): livello acqua corretto, integro"},
          {id:"polmone_test",text:"Polmone test per calibrazione: disponibile"},
          {id:"o2_supply",   text:"Alimentazione O2 e aria compressa: pressione corretta (3.5–6 bar)"},
        ]
      },
      {
        id: "calibrazione", title: "Calibrazione e autotest",
        items: [
          {id:"autotest",    text:"Autotest all'accensione: superato senza errori"},
          {id:"calib_fluido",text:"Calibrazione sensori di flusso: eseguita secondo costruttore"},
          {id:"test_tenuta", text:"Test tenuta circuito (leak test): perdita entro specifiche costruttore"},
          {id:"calib_o2",    text:"Calibrazione cella O2 (se applicabile): eseguita"},
        ]
      },
      {
        id: "parametri", title: "Verifica accuratezza parametri erogati (ISO 80601-2-12 cl.201.12.4)",
        note: "ISO 80601-2-12: VT ±10% o ±10 mL; FR ±1 atto/min; PEEP ±2 cmH2O; FiO2 ±3%; Ppeak ±4% o ±2 cmH2O.",
        items: [
          {id:"connessione",  text:"Ventilatore connesso al polmone test"},
        ],
        measures: [
          {id:"vt_500",    name:"Volume corrente erogato (impostato 500 mL)",  unit:"mL",       expected:"500 ±10% (450–550)", limitVal:550, limitMin:450, value:""},
          {id:"fr_15",     name:"Frequenza respiratoria (impostata 15 a/min)", unit:"atti/min", expected:"15 ±1 (14–16)", limitVal:16, limitMin:14, value:""},
          {id:"peep_5",    name:"PEEP (impostata 5 cmH2O)",                   unit:"cmH2O",    expected:"5 ±2 (3–7)", limitVal:7, limitMin:3, value:""},
          {id:"peep_10",   name:"PEEP (impostata 10 cmH2O)",                  unit:"cmH2O",    expected:"10 ±2 (8–12)", limitVal:12, limitMin:8, value:""},
          {id:"fio2_40",   name:"FiO2 (impostata 40%)",                       unit:"%",        expected:"40 ±3% (37–43)", limitVal:43, limitMin:37, value:""},
          {id:"fio2_100",  name:"FiO2 (impostata 100%)",                      unit:"%",        expected:"100 ±3% (97–100)", limitVal:100, limitMin:97, value:""},
          {id:"ppeak",     name:"Pressione di picco inspiratoria",             unit:"cmH2O",    expected:"±4% o ±2 cmH2O del valore misurato", value:""},
        ]
      },
      {
        id: "allarmi_vent", title: "Allarmi (ISO 80601-2-12 + IEC 60601-1-8)",
        note: "Allarmi obbligatori per ventilatori TI: disconnessione, alta pressione, apnea, alimentazione gas, O2.",
        items: [
          {id:"alarm_disc",    text:"Allarme DISCONNESSIONE paziente: attivazione < 15 s"},
          {id:"alarm_press",   text:"Allarme ALTA PRESSIONE: attivazione al superamento del limite impostato"},
          {id:"alarm_apnea",   text:"Allarme APNEA: attivazione entro il tempo impostato (default 20 s)"},
          {id:"alarm_o2",      text:"Allarme MANCANZA O2/ARIA: attivazione corretta"},
          {id:"alarm_power",   text:"Allarme MANCANZA ALIMENTAZIONE elettrica: attivazione"},
          {id:"batt_vent",     text:"Autonomia su batteria interna: sufficiente (≥ 30 min o secondo costruttore)"},
          {id:"alarm_fio2",    text:"Allarme FiO2 bassa/alta: attivazione corretta (se presente)"},
        ]
      },
    ]
  },

  // ─── POMPA INFUSIONALE (IEC 60601-2-24:2012) ─────────────────────────────
  "pompa_infusionale": {
    label: "Pompa infusionale / siringa elettrica", icon: "POM", norm: "IEC 60601-2-24:2012",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva",
        items: [
          {id:"cavo_al",    text:"Cavo alimentazione: integro"},
          {id:"involucro",  text:"Involucro: privo di danni, slot siringa/sacca funzionante"},
          {id:"display",    text:"Display e tastiera: leggibili e funzionanti"},
          {id:"porta_set",  text:"Porta set infusionale / sede siringa: pulizia, usura meccanismo"},
          {id:"sensori",    text:"Sensori aria in linea e occlusione: presenti e attivi"},
        ]
      },
      {
        id: "accuratezza", title: "Accuratezza portata (IEC 60601-2-24 cl.201.12.4.101)",
        note: "IEC 60601-2-24: errore portata ≤ ±5% dopo periodo di stabilizzazione (almeno 1h a portata nominale). Misurare con metodo gravimetrico o contagocce calibrato.",
        items: [
          {id:"stabilizz",   text:"Periodo di stabilizzazione ≥ 1 ora prima della misurazione"},
          {id:"metodo_grav", text:"Metodo di misura: gravimetrico (bilancia ±0.01 g) o contagocce calibrato"},
        ],
        measures: [
          {id:"q_5",    name:"Portata — impostata 5 mL/h",   unit:"mL/h", expected:"5 ±5% (4.75–5.25)", limitVal:5.25, limitMin:4.75, value:""},
          {id:"q_25",   name:"Portata — impostata 25 mL/h",  unit:"mL/h", expected:"25 ±5% (23.75–26.25)", limitVal:26.25, limitMin:23.75, value:""},
          {id:"q_100",  name:"Portata — impostata 100 mL/h", unit:"mL/h", expected:"100 ±5% (95–105)", limitVal:105, limitMin:95, value:""},
          {id:"q_kvo",  name:"Portata KVO (Keep Vein Open)",  unit:"mL/h", expected:"1–5 mL/h (secondo costruttore)", value:""},
        ]
      },
      {
        id: "allarmi_pompa", title: "Allarmi (IEC 60601-2-24 + IEC 60601-1-8)",
        items: [
          {id:"alarm_occ",  text:"Allarme OCCLUSIONE a valle: attivazione entro pressione specificata dal costruttore"},
          {id:"alarm_aria", text:"Allarme ARIA IN LINEA: attivazione con bolla ≥ 50 µL (se presente sensore)"},
          {id:"alarm_fine", text:"Allarme FINE INFUSIONE / SIRINGA QUASI VUOTA: attivazione corretta"},
          {id:"alarm_batt", text:"Allarme BATTERIA SCARICA: attivazione con preavviso adeguato"},
          {id:"alarm_porta",text:"Allarme PORTA APERTA / SIRINGA RIMOSSA: attivazione immediata"},
        ]
      },
      {
        id: "batteria_pompa", title: "Batteria",
        items: [
          {id:"batt_scad", text:"Batteria: non scaduta"},
        ],
        measures: [
          {id:"batt_perc",   name:"Carica residua", unit:"%", expected:"≥ 80%", limitVal:80, invertPass:true, value:""},
          {id:"autonomia_h", name:"Autonomia su batteria", unit:"h", expected:"≥ 4 h (o secondo costruttore)", limitVal:4, invertPass:true, value:""},
        ]
      },
    ]
  },

  // ─── ECOGRAFO (IEC 60601-2-37:2007+AMD1:2015) ────────────────────────────
  "ecografo": {
    label: "Ecografo", icon: "ECO", norm: "IEC 60601-2-37:2007+AMD1:2015",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva",
        items: [
          {id:"cavo_al",    text:"Cavo alimentazione: integro"},
          {id:"involucro",  text:"Carrello/console: integrità strutturale, stabilità"},
          {id:"sonde",      text:"Sonde: nessuna cricca, scheggia o delaminazione del trasduttore"},
          {id:"cavi_sonde", text:"Cavi sonde: isolamento integro, connettori puliti e funzionanti"},
          {id:"monitor",    text:"Monitor: nessun pixel morto, luminosità adeguata"},
          {id:"gel",        text:"Gel ecografico: disponibile e adeguato"},
        ]
      },
      {
        id: "funz_eco", title: "Verifica funzionale",
        note: "Usare fantoccio ecografico (phantom) per verifica accuratezza. Se non disponibile, documentare verifica su soggetto/mano.",
        items: [
          {id:"accensione",   text:"Accensione: nessun errore, autotest OK"},
          {id:"b_mode",       text:"Modalità B-mode: immagine acquisita, risoluzione adeguata"},
          {id:"m_mode",       text:"Modalità M-mode (se presente): tracciato tempo/movimento corretto"},
          {id:"doppler_col",  text:"Color Doppler (se presente): flusso visualizzato correttamente"},
          {id:"doppler_pw",   text:"PW/CW Doppler (se presente): spettro Doppler corretto"},
          {id:"misure",       text:"Misure caliper (distanza/area): funzionanti"},
          {id:"stampa_arch",  text:"Stampa/archiviazione immagini: funzionante"},
          {id:"selezione_sonde", text:"Selezione sonde (se multiple): tutte riconosciute"},
        ]
      },
      {
        id: "phantom", title: "Verifica con fantoccio (phantom test)",
        note: "Se disponibile fantoccio calibrato, verificare risoluzione assiale/laterale e accuratezza distanze.",
        measures: [
          {id:"dist_10mm", name:"Distanza misurata — target 10 mm", unit:"mm", expected:"10 ±1 mm (±10%)", limitVal:11, limitMin:9, value:""},
          {id:"dist_50mm", name:"Distanza misurata — target 50 mm", unit:"mm", expected:"50 ±5 mm (±10%)", limitVal:55, limitMin:45, value:""},
          {id:"profondita", name:"Profondità massima immagine",       unit:"cm", expected:"secondo costruttore", value:""},
        ]
      },
    ]
  },

  // ─── LETTO ELETTRICO / BARELLA MOTORIZZATA (IEC 60601-2-38:2014) ─────────
  "letto_elettrico": {
    label: "Letto elettrico / barella motorizzata", icon: "LET", norm: "IEC 60601-2-38:2014",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva e meccanica",
        items: [
          {id:"cavo_al",    text:"Cavo alimentazione e spina: integri, nessun danno"},
          {id:"struttura",  text:"Struttura, sponde e materasso: integrità, nessun spigolo tagliente"},
          {id:"freni",      text:"Freni ruote: funzionanti su tutti i punti di frenatura"},
          {id:"comandi",    text:"Comandi paziente e infermiere: tutti funzionanti, etichettati"},
          {id:"cavo_comandi",text:"Cavo telecomando: integro, connettore OK"},
          {id:"fine_corsa", text:"Fine corsa meccanici e elettrici: presenti e funzionanti"},
          {id:"giunti",     text:"Giunti, snodi e meccanismi di articolazione: lubrificati, nessun gioco anomalo"},
        ]
      },
      {
        id: "movimenti", title: "Verifica movimenti (IEC 60601-2-38 cl.201.15)",
        note: "Verificare assenza di movimenti inattesi, vibrazioni, rumori anomali. Velocità massima limitata da norma.",
        items: [
          {id:"schienale_su",   text:"Alzata schienale: movimento fluido, senza scatti, fine corsa funzionante"},
          {id:"schienale_giu",  text:"Abbassamento schienale: corretto"},
          {id:"trendelenburg",  text:"Trendelenburg (se presente): movimento fluido, fine corsa OK"},
          {id:"antitrendel",    text:"Anti-Trendelenburg (se presente): corretto"},
          {id:"alzata_letto",   text:"Alzata/abbassamento altezza letto: fluido, nessun bloccaggio"},
          {id:"sponde_el",      text:"Sponde elettriche (se presenti): alzata/abbassamento corretti"},
          {id:"posizione_card", text:"Posizione cardiaca/sedia (se presente): funzionante"},
          {id:"posizione_prone",text:"Posizione prona (se presente): corretta"},
        ],
        measures: [
          {id:"altezza_min", name:"Altezza minima dal suolo", unit:"cm", expected:"≤ 40 cm (accessibilità)", value:""},
          {id:"altezza_max", name:"Altezza massima dal suolo", unit:"cm", expected:"secondo costruttore", value:""},
          {id:"angolo_schienale", name:"Angolo massimo schienale", unit:"°", expected:"≥ 75°", limitVal:75, invertPass:true, value:""},
        ]
      },
      {
        id: "sicurezza_letto", title: "Sicurezza e carichi",
        items: [
          {id:"carico_max",   text:"Carico massimo: etichetta presente e leggibile"},
          {id:"arresto_emerg",text:"Tasto di arresto emergenza (se presente): funzionante"},
          {id:"sovraccarico", text:"Protezione da sovraccarico: attiva"},
          {id:"cpe",          text:"Sistema CPR/RCP (tasto emergenza schienale piatto): funzionante e raggiungibile"},
        ]
      },
    ]
  },

  // ─── APPARECCHIO GENERICO ─────────────────────────────────────────────────
  "generico": {
    label: "Apparecchio generico", icon: "›", norm: "IEC 60601-1 generale",
    sections: [
      {
        id: "ispezione", title: "Ispezione visiva e meccanica",
        items: [
          {id:"cavo_al",    text:"Cavo alimentazione e spina: integri"},
          {id:"involucro",  text:"Involucro: privo di danni meccanici visibili"},
          {id:"acc",        text:"Accessori e cavi paziente: integrità isolamento e connettori"},
          {id:"etichette",  text:"Etichette identificazione, classe, tensione: presenti e leggibili"},
          {id:"ventilazione",text:"Aperture di ventilazione: libere, non ostruite"},
        ]
      },
      {
        id: "funz_gen", title: "Verifica funzionale generale",
        items: [
          {id:"accensione",  text:"Accensione regolare: nessun messaggio di errore"},
          {id:"autotest",    text:"Autotest (se previsto): superato"},
          {id:"funzione_1",  text:"Funzione principale 1: operativa e conforme alle specifiche"},
          {id:"funzione_2",  text:"Funzione principale 2: operativa"},
          {id:"allarmi",     text:"Sistema allarmi: funzionante (visivo e acustico)"},
          {id:"display",     text:"Display e interfaccia: leggibili e funzionanti"},
        ]
      },
      {
        id: "misure_gen", title: "Misure (compilare secondo tipo apparecchio)",
        measures: [
          {id:"misura_1", name:"Misura 1 (specificare)", unit:"", expected:"secondo costruttore", value:""},
          {id:"misura_2", name:"Misura 2 (specificare)", unit:"", expected:"secondo costruttore", value:""},
          {id:"misura_3", name:"Misura 3 (specificare)", unit:"", expected:"secondo costruttore", value:""},
        ]
      },
    ]
  },
};

function generateIECPDF(rep, asset, customer, company) {
  let _instSerial = rep.instrumentSerial || "";
  let _instExpiry = rep.instrumentCalExpiry || "";
  if((!_instSerial || !_instExpiry) && rep.instrument && Array.isArray(_instrumentsRegistry)){
    const _m = _instrumentsRegistry.find(i => { const t=[i.brand,i.model].filter(Boolean).join(" "); return rep.instrument===t || rep.instrument===(t+(i.internalCode?(" ("+i.internalCode+")"):"")); });
    if(_m){ if(!_instSerial) _instSerial=_m.serial||""; if(!_instExpiry) _instExpiry=_m.calExpiry||""; }
  }
  const normL = rep.norm === '61010' ? 'IEC 61010-1 — Strumentazione Lab.' : rep.norm === '60601' ? 'IEC 60601-1 — Prova approfondita' : 'IEC 62353 — Elettromedicale';
  const ptLabel = rep.norm !== '61010' ? (' · Tipo ' + (rep.patientType || 'BF')) : '';
  const vi = rep.visual || {};
  const visItems = [
    ['Involucro integro', vi.housing],
    ['Cavo di rete e spina integri', vi.cable],
    ['Connettori in buono stato', vi.connectors],
    ['Etichette e marcatura CE leggibili', vi.labels],
    ['Documentazione tecnica presente', vi.docs],
  ];

  // Mostro solo le voci visive effettivamente compilate (true/false). Le N/D le salto.
  const visItemsFilled = visItems.filter(([label, val]) => val === true || val === false);
  const visRows = visItemsFilled.map(([label, val]) => `
    <div class="vis-row">
      <span>${label}</span>
      <span class="badge ${val === true ? 'pass' : 'fail'}">${val === true ? '✓ OK' : '✗ NO'}</span>
    </div>`).join('');

  // Mostro solo le misure effettivamente eseguite (con un valore). Le N/D le salto.
  const measFilled = (rep.measures || []).filter(m => m.value !== '' && m.value !== undefined && m.value !== null && !isNaN(parseFloat(m.value)));
  const measRows = measFilled.map(m => {
    const v = parseFloat(m.value);
    const lv = parseFloat(m.limitVal);
    const pass = m.invertPass ? v >= lv : v <= lv;
    return `<tr>
      <td>${m.name}</td>
      <td style="text-align:center;font-family:monospace">${m.limit}</td>
      <td style="text-align:center;font-family:monospace;font-weight:700">${m.value}</td>
      <td style="text-align:center">${m.unit}</td>
      <td style="text-align:center"><span class="badge ${pass ? 'pass' : 'fail'}">${pass ? '✓ PASS' : '✗ FAIL'}</span></td>
    </tr>`;
  }).join('');

  const isNotAvail = rep.verifyStatus === "non_disponibile";
  const esitoColor = isNotAvail ? '#f59e0b' : (rep.overallPass ? '#059669' : '#dc2626');
  const esitoLabel = isNotAvail ? 'NON ESEGUITA' : (rep.overallPass ? 'CONFORME' : 'NON CONFORME');
  const reasonLabel = {
    in_uso:"Apparecchio in uso su paziente",
    non_trovato:"Apparecchio non reperibile in reparto",
    trasferito:"Apparecchio trasferito ad altro reparto",
    riparazione_esterna:"In riparazione esterna",
    dismesso:"Dismesso / non più in uso",
    rifiuto_reparto:"Reparto non autorizza intervento ora",
    altro:"Altro motivo"
  }[rep.notAvailableReason] || rep.notAvailableReason || "Non specificato";

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
    <title>Verifica ${rep.reportNumber || rep.id}</title>
    <style>${PDF_STYLE}</style></head><body><div class="wrap"><div class="side"></div><div class="main">
    <div class="header">
      <div>
        ${company.logo ? `<img src="${company.logo}" class="brand-logo"/>` : `<h1>${company.name || 'Documento'}</h1>`}
        <div class="sub">Rapporto di Verifica Sicurezza Elettrica</div>
        <div class="sub">${normL}${ptLabel}</div>
      </div>
      <div class="right">
        <div class="doctype">Verifica Sicurezza Elettrica</div>
        <div class="docnum">${rep.reportNumber || rep.id}</div>
        <div style="margin-top:6px;background:${esitoColor};color:#fff;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:800">${esitoLabel}</div>
        <div style="font-size:10px;margin-top:4px;opacity:.8">Data: ${rep.date || '—'}</div>
      </div>
    </div>

    <div class="titlebar">
      ${(company.logo && company.logoHasName) ? '' : `<h2>${company.name || 'Documento'}</h2>`}
      <p>${[company.subtitle, company.vat ? 'P.IVA ' + company.vat : '', company.address].filter(Boolean).join(' · ')}</p>
    </div>

    <div class="section">
      <div class="sec-head"><span class="sec-num">1</span><span class="sec-title">Apparecchio</span></div>
      <div class="kv-grid">
        <div class="kv"><span class="kv-label">Nome</span><span class="kv-value">${asset?.name || '—'}</span></div>
        <div class="kv"><span class="kv-label">Marca / Modello</span><span class="kv-value">${asset?.brand || ''} ${asset?.model || ''}</span></div>
        <div class="kv"><span class="kv-label">N° Serie</span><span class="kv-value" style="font-family:monospace">${asset?.serial || '—'}</span></div>
        <div class="kv"><span class="kv-label">Ubicazione</span><span class="kv-value">${asset?.location || '—'}</span></div>
        ${customer?.name ? `<div class="kv"><span class="kv-label">Cliente</span><span class="kv-value">${customer.name}</span></div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="sec-head"><span class="sec-num">2</span><span class="sec-title">Dati Verifica</span></div>
      <div class="kv-grid">
        <div class="kv"><span class="kv-label">Tecnico</span><span class="kv-value">${rep.technician || '—'}</span></div>
        ${isNotAvail ? `
        <div class="kv"><span class="kv-label">Data</span><span class="kv-value">${rep.date || '—'}</span></div>
        ` : `
        <div class="kv"><span class="kv-label">Strumento di misura</span><span class="kv-value">${rep.instrument || '—'}</span></div>
        <div class="kv"><span class="kv-label">N° Serie strumento</span><span class="kv-value" style="font-family:monospace">${_instSerial || '—'}</span></div>
        <div class="kv"><span class="kv-label">Scadenza taratura</span><span class="kv-value">${_instExpiry || '—'}</span></div>
        <div class="kv"><span class="kv-label">Tipo verifica</span><span class="kv-value" style="text-transform:capitalize">${rep.verifyType || '—'}</span></div>
        ${rep.norm === '62353' && rep.equipClass !== 'III' ? `<div class="kv"><span class="kv-label">Metodo misura dispersione</span><span class="kv-value" style="text-transform:capitalize">${rep.leakageMethod || 'diretto'}</span></div>` : ''}
        <div class="kv"><span class="kv-label">Classe apparecchio</span><span class="kv-value">Classe ${rep.equipClass || '—'}</span></div>
        ${rep.norm !== '61010' ? `<div class="kv"><span class="kv-label">Tipo parte paziente</span><span class="kv-value">Tipo ${rep.patientType || 'BF'}</span></div>` : ''}
        `}
      </div>
    </div>

    ${isNotAvail ? `
    <div class="section">
      <div class="section-title" style="color:#d97706">⚠ Verifica Non Eseguita</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7;width:35%"><strong>Motivo</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${reasonLabel}</td></tr>
        <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7"><strong>Reparto / Unità</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${rep.departmentName || '—'}</td></tr>
        <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7"><strong>Referente reparto</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${rep.departmentContact || '—'}</td></tr>
        <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7"><strong>Data tentativo</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${rep.date}</td></tr>
      </table>
      <p style="margin-top:10px;font-size:11px;color:#64748b;font-style:italic">Il presente rapporto documenta l'impossibilità di eseguire la verifica programmata. La verifica sarà ripianificata e l'apparecchio resterà in stato "verifica scaduta" fino al completamento.</p>
    </div>` : `
    ${visRows ? `<div class="section">
      <div class="sec-head"><span class="sec-num">3</span><span class="sec-title">Ispezione Visiva</span></div>
      ${visRows}
    </div>` : ''}

    ${measRows ? `<div class="section">
      <div class="sec-head"><span class="sec-num">4</span><span class="sec-title">Misure Elettriche</span></div>
      <table>
        <thead><tr><th>Parametro</th><th style="text-align:center">Limite (norma)</th><th style="text-align:center">Valore misurato</th><th style="text-align:center">Unità</th><th style="text-align:center">Esito</th></tr></thead>
        <tbody>${measRows}</tbody>
      </table>
    </div>` : ''}`}

    <div class="total-box" style="margin-top:12px">
      <span class="label">ESITO FINALE VERIFICA</span>
      <span class="amount">${esitoLabel}</span>
    </div>

    ${rep.notes ? `<div style="margin-top:12px;padding:8px 12px;background:#f8fafc;border-left:3px solid #64748b;font-size:11px"><strong>Note:</strong> ${rep.notes}</div>` : ''}

    <div class="sign-row">
      <div class="sign">
        ${rep.technicianSignature ? `<img src="${rep.technicianSignature}" style="max-height:55px;max-width:200px;display:block;margin:0 auto"/>` : '<div style="height:55px"></div>'}
        <div class="line"><span class="label">Firma Tecnico Verificatore</span><br><strong style="color:#1e293b;font-size:11px">${rep.technician || ''}</strong></div>
      </div>
      ${(rep.departmentSignature || rep.departmentContact || rep.departmentName) ? `
      <div class="sign">
        ${rep.departmentSignature ? `<img src="${rep.departmentSignature}" style="max-height:55px;max-width:200px;display:block;margin:0 auto"/>` : '<div style="height:55px"></div>'}
        <div class="line"><span class="label">Firma Referente Reparto / Cliente</span><br><strong style="color:#1e293b;font-size:11px">${rep.departmentContact || rep.departmentName || ''}</strong></div>
      </div>` : ''}
    </div>

    <div class="footer">
      <span>${(company.name || 'Documento')} — Generato il ${new Date().toLocaleDateString('it-IT')} — ${normL}</span>
      <span>${rep.reportNumber || rep.id} · ${asset?.serial || ''}</span>
    </div>
  </div></div></body></html>`;

  openPrintWindow(html);
}

function generateFuncPDF(rep, asset, customer, company, templates) {
  let _instSerial = rep.instrumentSerial || "";
  let _instExpiry = rep.instrumentCalExpiry || "";
  if((!_instSerial || !_instExpiry) && rep.instrument && Array.isArray(_instrumentsRegistry)){
    const _m = _instrumentsRegistry.find(i => { const t=[i.brand,i.model].filter(Boolean).join(" "); return rep.instrument===t || rep.instrument===(t+(i.internalCode?(" ("+i.internalCode+")"):"")); });
    if(_m){ if(!_instSerial) _instSerial=_m.serial||""; if(!_instExpiry) _instExpiry=_m.calExpiry||""; }
  }
  const _TPLS = templates || (typeof FUNC_TEMPLATES !== "undefined" ? FUNC_TEMPLATES : {});
  const tpl = _TPLS[rep.templateId] || {label:"Verifica Funzionale", icon:"›", norm:"IEC 60601-1", sections:[]};
  const isNotAvail = rep.verifyStatus === "non_disponibile";
  const esitoColor = isNotAvail ? "#f59e0b" : (rep.overallPass ? "#0D9488" : "#dc2626");
  const esitoLabel = isNotAvail ? "NON ESEGUITA" : (rep.overallPass ? "CONFORME" : "NON CONFORME");
  const reasonLabel = {
    in_uso:"Apparecchio in uso su paziente",
    non_trovato:"Apparecchio non reperibile in reparto",
    trasferito:"Apparecchio trasferito ad altro reparto",
    riparazione_esterna:"In riparazione esterna",
    dismesso:"Dismesso / non più in uso",
    rifiuto_reparto:"Reparto non autorizza intervento ora",
    altro:"Altro motivo"
  }[rep.notAvailableReason] || rep.notAvailableReason || "Non specificato";

  // Build sections HTML
  let secNum = 1; // le sezioni "Apparecchio" è la 1, quindi parto da 2
  const sectionsHtml = (tpl.sections || []).map(sec => {
    const sd = (rep.sections || {})[sec.id] || {items:{}, measures:{}};

    // Una sezione è "N/A" se non è stata compilata: nessuna voce valorizzata
    // (tutte a "—") e nessuna misura inserita. In tal caso la salto dal PDF.
    const hasItem = (sec.items || []).some(it => {
      const v = sd.items[it.id];
      return v === true || v === false;
    });
    const hasMeas = (sec.measures || []).some(m => {
      const v = sd.measures[m.id];
      return v !== undefined && v !== null && String(v).trim() !== "";
    });
    if(!hasItem && !hasMeas) return ""; // sezione non compilata → non mostrata

    const itemsHtml = (sec.items || []).map(item => {
      const val = sd.items[item.id];
      const icon = val === true ? "✓" : val === false ? "✗" : "—";
      const color = val === true ? "#0D9488" : val === false ? "#dc2626" : "#9ca3af";
      return `<div class="check-row">
        <span class="check-text">${item.text}</span>
        <span class="check-result" style="color:${color};background:${color}18;border-color:${color}44">${icon}</span>
      </div>`;
    }).join("");

    const measHtml = (sec.measures || []).map(m => {
      const val = sd.measures[m.id] || "";
      const vNum = parseFloat(val);
      let pass = null;
      if (!isNaN(vNum) && val !== "") {
        pass = true;
        if (m.limitMin !== undefined && vNum < m.limitMin) pass = false;
        if (m.limitVal !== undefined) {
          if (m.invertPass) { if (vNum < m.limitVal) pass = false; }
          else { if (vNum > m.limitVal) pass = false; }
        }
      }
      const pc = pass === null ? "#9ca3af" : pass ? "#0D9488" : "#dc2626";
      return `<tr>
        <td>${m.name}</td>
        <td style="text-align:center;font-family:monospace;font-size:10px;color:#6b7280">${m.expected || ""}</td>
        <td style="text-align:center;font-family:monospace;font-weight:700">${val || "—"}</td>
        <td style="text-align:center;color:#6b7280">${m.unit}</td>
        <td style="text-align:center"><span class="badge ${pass === null ? "nd" : pass ? "pass" : "fail"}">${pass === null ? "N/D" : pass ? "✓ PASS" : "✗ FAIL"}</span></td>
      </tr>`;
    }).join("");

    secNum++;
    return `<div class="section">
      <div class="sec-head"><span class="sec-num">${secNum}</span><span class="sec-title">${sec.title}</span></div>
      ${sec.note ? `<div class="section-note">${sec.note}</div>` : ""}
      ${itemsHtml}
      ${measHtml ? `<table style="margin-top:${(sec.items||[]).length>0?8:0}px">
        <thead><tr><th>Misura</th><th style="text-align:center">Atteso</th><th style="text-align:center">Valore</th><th style="text-align:center">U.M.</th><th style="text-align:center">Esito</th></tr></thead>
        <tbody>${measHtml}</tbody>
      </table>` : ""}
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
  <title>Verifica Funzionale ${rep.reportNumber || rep.id}</title>
  <style>${PDF_STYLE}</style></head><body><div class="wrap"><div class="side"></div><div class="main">

  <div class="header">
    <div>
      ${company.logo ? `<img src="${company.logo}" class="brand-logo"/>` : `<h1>${(company.name || 'Documento')}</h1>`}
      <div class="sub">Rapporto di Verifica Funzionale</div>
      <div class="sub">${tpl.norm}</div>
    </div>
    <div class="right">
      <div class="doctype">Verifica Funzionale</div>
      <div class="docnum">${rep.reportNumber || rep.id}</div>
      <div style="margin-top:6px;background:${esitoColor};color:#fff;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:800">${esitoLabel}</div>
      <div style="font-size:10px;margin-top:4px;opacity:.8">Data: ${rep.date || "—"}</div>
    </div>
  </div>

  <div class="titlebar">
    ${(company.logo && company.logoHasName) ? '' : `<h2>${company.name || 'Documento'}</h2>`}
    <p>${[company.subtitle, company.vat ? 'P.IVA ' + company.vat : '', company.address].filter(Boolean).join(' · ')}</p>
  </div>

  <div class="section">
    <div class="sec-head"><span class="sec-num">1</span><span class="sec-title">Apparecchio</span></div>
  <div class="kv-grid">
    <div class="kv"><span class="kv-label">Tipo apparecchio</span><span class="kv-value">${tpl.icon} ${tpl.label}</span></div>
    <div class="kv"><span class="kv-label">Apparecchio</span><span class="kv-value">${asset?.name || "—"}</span></div>
    <div class="kv"><span class="kv-label">Marca / Modello</span><span class="kv-value">${asset?.brand || ""} ${asset?.model || ""}</span></div>
    <div class="kv"><span class="kv-label">N° Serie</span><span class="kv-value" style="font-family:monospace">${asset?.serial || "—"}</span></div>
    <div class="kv"><span class="kv-label">Ubicazione</span><span class="kv-value">${asset?.location || "—"}</span></div>
    ${customer?.name ? `<div class="kv"><span class="kv-label">Cliente</span><span class="kv-value">${customer.name}</span></div>` : ""}
    <div class="kv"><span class="kv-label">Tecnico verificatore</span><span class="kv-value">${rep.technician || "—"}</span></div>
    ${isNotAvail ? '' : `<div class="kv"><span class="kv-label">Strumento/tester</span><span class="kv-value">${rep.instrument || "—"}</span></div>
    <div class="kv"><span class="kv-label">N° Serie strumento</span><span class="kv-value" style="font-family:monospace">${_instSerial || "—"}</span></div>
    <div class="kv"><span class="kv-label">Scadenza taratura</span><span class="kv-value">${_instExpiry || "—"}</span></div>`}
  </div>
  </div>

  ${isNotAvail ? `
  <div class="section">
    <div class="section-title" style="color:#d97706">⚠ Verifica Non Eseguita</div>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7;width:35%"><strong>Motivo</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${reasonLabel}</td></tr>
      <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7"><strong>Reparto / Unità</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${rep.departmentName || '—'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7"><strong>Referente reparto</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${rep.departmentContact || '—'}</td></tr>
      <tr><td style="padding:6px;border:1px solid #cbd5e1;background:#fef3c7"><strong>Data tentativo</strong></td><td style="padding:6px;border:1px solid #e5e7eb">${rep.date}</td></tr>
    </table>
    <p style="margin-top:10px;font-size:11px;color:#64748b;font-style:italic">Il presente rapporto documenta l'impossibilità di eseguire la verifica funzionale programmata. La verifica sarà ripianificata.</p>
  </div>` : sectionsHtml}

  ${rep.notes ? `<div style="margin-top:8px;padding:8px 10px;background:#f8fafc;border-left:3px solid #64748b;font-size:10px"><strong>Note:</strong> ${rep.notes}</div>` : ""}

  <div class="total-box">
    <span class="label">ESITO FINALE VERIFICA FUNZIONALE</span>
    <span class="amount">${esitoLabel}</span>
  </div>

  <div class="sign-row">
    <div class="sign">
      ${rep.technicianSignature ? `<img src="${rep.technicianSignature}" style="max-height:55px;max-width:200px;display:block;margin:0 auto"/>` : '<div style="height:55px"></div>'}
      <div class="line"><span class="label">Firma Tecnico Verificatore</span><br><strong style="color:#1e293b;font-size:11px">${rep.technician || ''}</strong></div>
    </div>
    ${(isNotAvail || rep.departmentSignature || rep.departmentContact || rep.departmentName) ? `
    <div class="sign">
      ${rep.departmentSignature ? `<img src="${rep.departmentSignature}" style="max-height:55px;max-width:200px;display:block;margin:0 auto"/>` : '<div style="height:55px"></div>'}
      <div class="line"><span class="label">Firma Referente Reparto / Cliente</span><br><strong style="color:#1e293b;font-size:11px">${rep.departmentContact || rep.departmentName || ''}</strong></div>
    </div>` : ''}
  </div>

  <div class="footer">
    <span>${(company.name || 'Documento')} — Generato il ${new Date().toLocaleDateString("it-IT")} — ${tpl.norm}</span>
    <span>${rep.reportNumber || rep.id} · ${asset?.serial || ""}</span>
  </div>
</div></div></body></html>`;

  openPrintWindow(html);
}

const AssetDetail = ({ asset, customer, iecReports, funcReports, jobs, onBack, company }) => {
    const myIec = iecReports.filter(r => r.assetId === asset.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const myFunc = funcReports.filter(r => r.assetId === asset.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const myJobs = jobs.filter(j => j.assetId === asset.id).sort((a, b) => new Date(b.openDate) - new Date(a.openDate));
    return (React.createElement("div", { className: "fade-in", style: { padding: "20px 18px", maxWidth: 720, margin: "0 auto" } },
        React.createElement("button", { onClick: onBack, style: {
                background: "none", border: "none", color: C.accent, cursor: "pointer",
                fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 18,
                display: "flex", alignItems: "center", gap: 6
            } }, "\u2190 Torna alla lista"),
        React.createElement("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 } },
                React.createElement("div", null,
                    React.createElement("div", { style: { fontSize: 10, color: C.accent, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 } }, "Scheda apparecchio"),
                    asset.assetCode && React.createElement("div", { style: { display: "inline-block", fontSize: 13, fontWeight: 800, color: C.accent, fontFamily: "monospace", background: C.accent + "12", border: "1px solid " + C.accent + "33", borderRadius: 6, padding: "2px 9px", marginBottom: 7 } }, asset.assetCode),
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
                asset.nextService && React.createElement(Field, { label: "Prossima manutenzione", value: fmtDate(asset.nextService) }), asset.lastSeenAt && React.createElement(Field, { label: "Ultimo rilevamento", value: (function () { var dt = new Date(asset.lastSeenAt); return isNaN(dt.getTime()) ? "\u2014" : dt.toLocaleString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); })() }))),
        React.createElement(RequestForm, { asset: asset }),
        React.createElement(Section, { title: "Verifiche di Sicurezza Elettrica", count: myIec.length, icon: "\u26A1", color: C.purple }, myIec.length === 0 ? React.createElement(Empty, { msg: "Nessuna verifica di sicurezza eseguita" }) : myIec.map(r => (React.createElement(ReportRow, { key: r.id, r: r, kind: "iec", onPdf: function () { generateIECPDF(r, asset, customer, company || {}); } })))),
        React.createElement(Section, { title: "Verifiche Funzionali", count: myFunc.length, icon: "\u2713", color: C.cyan }, myFunc.length === 0 ? React.createElement(Empty, { msg: "Nessuna verifica funzionale eseguita" }) : myFunc.map(r => (React.createElement(ReportRow, { key: r.id, r: r, kind: "func", onPdf: function () { generateFuncPDF(r, asset, customer, company || {}, FUNC_TEMPLATES); } })))),
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
const ReportRow = ({ r, kind, onPdf }) => {
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
            r.patientType ? ` · Tipo ${r.patientType}` : ""),
        onPdf && React.createElement("button", { onClick: onPdf, style: { marginTop: 9, width: "100%", background: "transparent", border: "1px solid " + C.borderL, color: C.accent, borderRadius: 8, padding: "8px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "\uD83D\uDCC4 Scarica verbale (PDF)")));
};
const JobRow = ({ j }) => {
    const isClosed = j.status === "chiuso";
    const priColor = j.priority === "urgente" ? C.err : j.priority === "alta" ? C.warn : C.text2;
    const tipoLabel = ({ preventiva: "Manutenzione preventiva", correttiva: "Intervento correttivo", straordinaria: "Intervento straordinario" })[j.type] || "Intervento";
    return (React.createElement("div", { style: { background: C.card2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${priColor}`, borderRadius: 8, padding: "10px 14px" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 } },
            React.createElement("span", { style: { fontSize: 12.5, color: C.text, fontWeight: 800 } }, tipoLabel,
                j.priority === "urgente" ? React.createElement("span", { style: { color: C.err, fontSize: 10.5, fontWeight: 800, marginLeft: 6 } }, "URGENTE") : null),
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
        /* Conformita' del parco: ultimo report IEC per apparecchio (dashboard conformita', audit portale) */
        const lastIecByAsset = {};
        for (const r of iecReports) { const k = r.assetId; if (k && (!lastIecByAsset[k] || String(r.date || "") > String(lastIecByAsset[k].date || ""))) lastIecByAsset[k] = r; }
        let conformi = 0, nonConformi = 0, maiVerificati = 0;
        for (const a of assets) { const r = lastIecByAsset[a.id]; if (!r) maiVerificati++; else if (r.overallPass === true || r.overallPass === "true") conformi++; else nonConformi++; }
        const compliancePct = assets.length ? Math.round((conformi / assets.length) * 100) : 100;
        return { ok, inMaint, ko, scaduti, imminenti, openJobs, totIec, totFunc, conformi, nonConformi, maiVerificati, compliancePct };
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
            React.createElement("div", { style: { background: C.card, border: `1px solid ${stats.nonConformi > 0 ? C.bad + "66" : C.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 18 } },
                React.createElement("div", { style: { fontSize: 34, fontWeight: 800, color: stats.compliancePct >= 90 ? C.ok : (stats.compliancePct >= 70 ? C.warn : C.bad), fontVariantNumeric: "tabular-nums", flexShrink: 0 } }, stats.compliancePct + "%"),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 } }, "Conformit\u00e0 del parco"),
                    React.createElement("div", { style: { fontSize: 12, color: C.text2 } }, stats.conformi + " conformi \u00b7 " + stats.nonConformi + " non conformi \u00b7 " + stats.maiVerificati + " mai verificati"),
                    stats.nonConformi > 0 ? React.createElement("div", { style: { fontSize: 12, color: C.bad, fontWeight: 700, marginTop: 5 } }, "\u26a0 " + stats.nonConformi + (stats.nonConformi === 1 ? " apparecchio non conforme" : " apparecchi non conformi") + " \u2014 vedi i rapporti di verifica") : null)),
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
    return h(Landing, null);
};
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
