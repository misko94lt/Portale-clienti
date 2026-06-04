/* Portale Cliente v1.1 — login cloud (link magico) + ripiego file */
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
            auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
        });
    }
    return _sb;
};
const h = React.createElement;

/* ═══ LOGIN MAGICO ════════════════════════════════════════════ */
const MagicLogin = () => {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const send = async () => {
        setErr("");
        const e = email.trim();
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
    if (sent) {
        return h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", textAlign: "center" } },
            h("div", { style: { fontSize: 38, marginBottom: 10 } }, "\uD83D\uDCE7"),
            h("div", { style: { fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 } }, "Controlla la tua email"),
            h("div", { style: { fontSize: 13, color: C.text2, lineHeight: 1.5 } }, "Ti abbiamo inviato un link di accesso a ", h("strong", { style: { color: C.text } }, email), ". Aprilo da questo dispositivo per entrare."),
            h("button", { onClick: () => { setSent(false); }, style: { marginTop: 16, background: "none", border: "none", color: C.accent, fontWeight: 700, fontSize: 12, cursor: "pointer" } }, "Usa un'altra email"));
    }
    return h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", marginBottom: 16 } },
        h("div", { style: { fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 4 } }, "Accedi al portale"),
        h("div", { style: { fontSize: 12, color: C.text2, marginBottom: 16, lineHeight: 1.5 } }, "Inserisci la tua email: ti invieremo un link per entrare, senza password."),
        h("input", { type: "email", inputMode: "email", autoCapitalize: "off", autoCorrect: "off", placeholder: "La tua email", value: email,
            onChange: e => setEmail(e.target.value),
            onKeyDown: e => { if (e.key === "Enter") send(); },
            style: { width: "100%", boxSizing: "border-box", background: C.card2, border: `1px solid ${C.borderL}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", marginBottom: 10 } }),
        err && h("div", { style: { padding: "8px 12px", background: `${C.err}15`, border: `1px solid ${C.err}55`, borderRadius: 8, color: C.err, fontSize: 12, marginBottom: 10 } }, err),
        h("button", { onClick: send, disabled: busy,
            style: { width: "100%", background: busy ? C.borderL : `linear-gradient(135deg,${C.accent},${C.accentDim})`, color: busy ? C.text2 : "#04231f", border: "none", borderRadius: 10, padding: "13px", fontWeight: 800, fontSize: 14, cursor: busy ? "default" : "pointer" } },
            busy ? "Invio in corso\u2026" : "Invia link di accesso"));
};

/* ═══ HOME CLOUD (dopo login) ═════════════════════════════════ */
const CloudHome = ({ onLogout }) => {
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [customer, setCustomer] = useState(null);
    const [assetCount, setAssetCount] = useState(null);
    const [linked, setLinked] = useState(true);
    const [err, setErr] = useState("");
    useEffect(() => {
        (async () => {
            const client = sb();
            if (!client) { setErr("Servizio non disponibile."); setLoading(false); return; }
            try {
                const u = await client.auth.getUser();
                setEmail((u && u.data && u.data.user && u.data.user.email) || "");
                const cust = await client.from("customers").select("*");
                if (cust && cust.error) { setErr(cust.error.message); setLoading(false); return; }
                const rows = (cust && cust.data) || [];
                if (rows.length === 0) { setLinked(false); setLoading(false); return; }
                setCustomer(rows[0]);
                const ac = await client.from("assets").select("id", { count: "exact", head: true });
                setAssetCount(typeof (ac && ac.count) === "number" ? ac.count : 0);
            } catch (ex) { setErr("Errore: " + ((ex && ex.message) ? ex.message : ex)); }
            setLoading(false);
        })();
    }, []);
    const Shell = (inner) => h("div", { style: { minHeight: "100vh", background: `radial-gradient(circle at 50% 0%, ${C.accent}11 0%, ${C.bg} 60%)`, display: "flex", flexDirection: "column" } },
        h("div", { style: { borderBottom: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" } },
            h("div", { style: { fontSize: 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 } }, "Portale Cliente"),
            h("button", { onClick: onLogout, style: { background: C.card, border: `1px solid ${C.borderL}`, color: C.text2, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "Esci")),
        h("div", { className: "fade-in", style: { flex: 1, padding: 20, maxWidth: 560, width: "100%", margin: "0 auto", boxSizing: "border-box" } }, inner));
    if (loading) return Shell(h("div", { className: "skel", style: { height: 120, borderRadius: 16 } }));
    if (err) return Shell(h("div", { style: { padding: "16px", background: `${C.err}15`, border: `1px solid ${C.err}55`, borderRadius: 12, color: C.err, fontSize: 13 } }, err));
    if (!linked) return Shell(h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", textAlign: "center" } },
        h("div", { style: { fontSize: 38, marginBottom: 10 } }, "\u23F3"),
        h("div", { style: { fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 } }, "Accesso effettuato"),
        h("div", { style: { fontSize: 13, color: C.text2, lineHeight: 1.5 } }, "Il tuo account (", h("strong", { style: { color: C.text } }, email), ") non \u00E8 ancora collegato a un cliente. Contatta il tuo tecnico per l'abilitazione.")));
    return Shell(h(React.Fragment, null,
        h("div", { style: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 20px", marginBottom: 14 } },
            h("div", { style: { fontSize: 13, color: C.text3, marginBottom: 4 } }, "Benvenuto"),
            h("div", { style: { fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 2 } }, customer.name || "Cliente"),
            h("div", { style: { fontSize: 12, color: C.text2 } }, email)),
        h("div", { style: { display: "flex", gap: 12 } },
            h("div", { style: { flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px" } },
                h("div", { style: { fontSize: 28, fontWeight: 800, color: C.accent } }, assetCount === null ? "\u2014" : assetCount),
                h("div", { style: { fontSize: 12, color: C.text2, marginTop: 2 } }, assetCount === 1 ? "apparecchio" : "apparecchi"))),
        h("div", { style: { marginTop: 18, padding: "14px 16px", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.text2, lineHeight: 1.6 } },
            h("div", { style: { color: C.accent, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1, fontSize: 11 } }, "Collegato"),
            "Stai visualizzando il tuo parco apparecchi in tempo reale e in modo protetto. L'elenco dettagliato arriver\u00E0 a breve.")));
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
