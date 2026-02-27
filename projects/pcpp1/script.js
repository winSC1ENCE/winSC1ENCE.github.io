const { useState, useEffect, useCallback, useMemo } = React;

const TAG_STYLES = {
    concept: { bg: "#1e293b", border: "#334155", label: { en: "Concept", de: "Konzept" } },
    code: { bg: "#14281d", border: "#166534", label: { en: "Code", de: "Code" } },
    exam: { bg: "#2d1f1f", border: "#991b1b", label: { en: "Exam Q", de: "Prüfungsfrage" } },
    tip: { bg: "#1e1a2e", border: "#6d28d9", label: { en: "Tip", de: "Tipp" } },
};

function renderMarkdown(text) {
    if (!text) return "";
    return text
        .replace(/```python\n([\s\S]*?)```/g, (_, code) =>
            `<pre class="code-block"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
        .replace(/```\n?([\s\S]*?)```/g, (_, code) =>
            `<pre class="code-block"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "</p><p>");
}

function CardContent({ text }) {
    return <div style={{ lineHeight: 1.7, fontSize: "0.92rem" }} dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />;
}

function PCPP1FlashcardsApp() {
    const [modules, setModules] = useState([]);
    const [cards, setCards] = useState([]);
    const [lang, setLang] = useState("de");
    const [activeModule, setActiveModule] = useState(0);
    const [activeTag, setActiveTag] = useState("all");
    const [cardIndex, setCardIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [shuffled, setShuffled] = useState(false);
    const [cardOrder, setCardOrder] = useState([]);
    const [known, setKnown] = useState(new Set());
    const [unknown, setUnknown] = useState(new Set());
    const [view, setView] = useState("cards");
    const [error, setError] = useState("");

    const getLocalized = (field) => {
        if (!field) return "";
        if (typeof field === "string") return field;
        return field[lang] || field.de || field.en || "";
    };

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch("cards.json");
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (!Array.isArray(data.cards) || data.cards.length === 0) throw new Error("Keine Karten gefunden.");

                const normalizedModules = Array.isArray(data.modules) ? data.modules : [];
                const normalizedCards = data.cards.map((c, idx) => ({
                    id: c.id ?? idx + 1,
                    module: c.module ?? 0,
                    tag: c.tag ?? "concept",
                    q: typeof c.q === "string" ? { de: c.q, en: c.q } : c.q,
                    a: typeof c.a === "string" ? { de: c.a, en: c.a } : c.a,
                }));

                setModules(normalizedModules);
                setCards(normalizedCards);
                setCardOrder(normalizedCards.map((_, i) => i));
            } catch (e) {
                setError(`Karten konnten nicht geladen werden: ${e.message}`);
            }
        };

        load();
    }, []);

    const moduleMap = useMemo(() => {
        const map = new Map();
        modules.forEach((m) => map.set(m.id, m));
        return map;
    }, [modules]);

    const moduleList = useMemo(() => {
        if (modules.length) return modules;
        const ids = [...new Set(cards.map((c) => c.module).filter((id) => id > 0))].sort((a, b) => a - b);
        return ids.map((id) => ({ id, short: `M${id}`, de: `Modul ${id}`, en: `Module ${id}`, icon: "📚", color: "#94a3b8", accent: "#475569" }));
    }, [modules, cards]);

    const filteredIndices = useMemo(() => {
        return cardOrder.filter((i) => {
            const c = cards[i];
            if (!c) return false;
            const modOk = activeModule === 0 || c.module === activeModule;
            const tagOk = activeTag === "all" || c.tag === activeTag;
            return modOk && tagOk;
        });
    }, [cardOrder, cards, activeModule, activeTag]);

    const totalFiltered = filteredIndices.length;
    const safeIndex = totalFiltered ? cardIndex % totalFiltered : 0;
    const currentCardIdx = filteredIndices[safeIndex];
    const currentCard = currentCardIdx !== undefined ? cards[currentCardIdx] : null;
    const currentModule = currentCard ? moduleMap.get(currentCard.module) : null;

    const tagCounts = useMemo(() => {
        const counts = {};
        cards.forEach((c) => {
            const modOk = activeModule === 0 || c.module === activeModule;
            if (modOk) counts[c.tag] = (counts[c.tag] || 0) + 1;
        });
        return counts;
    }, [cards, activeModule]);

    const goNext = useCallback(() => {
        if (!totalFiltered) return;
        setFlipped(false);
        setCardIndex((i) => (i + 1) % totalFiltered);
    }, [totalFiltered]);

    const goPrev = useCallback(() => {
        if (!totalFiltered) return;
        setFlipped(false);
        setCardIndex((i) => (i - 1 + totalFiltered) % totalFiltered);
    }, [totalFiltered]);

    const handleShuffle = () => {
        const arr = [...cards.map((_, i) => i)];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        setCardOrder(arr);
        setCardIndex(0);
        setFlipped(false);
        setShuffled(true);
    };

    const resetOrder = () => {
        setCardOrder(cards.map((_, i) => i));
        setCardIndex(0);
        setFlipped(false);
        setShuffled(false);
    };

    useEffect(() => {
        setCardIndex(0);
        setFlipped(false);
    }, [activeModule, activeTag]);

    useEffect(() => {
        const handler = (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                setFlipped((f) => !f);
            }
            if (e.code === "ArrowRight") goNext();
            if (e.code === "ArrowLeft") goPrev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [goNext, goPrev]);

    if (error) {
        return <div className="keyboard-hints"><p><strong>⚠️ Fehler:</strong> {error}</p></div>;
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');

                .pcpp-modern * { box-sizing: border-box; }
                .pcpp-modern { font-family: 'Outfit', sans-serif; color: #e2e8f0; }

                .pcpp-modern .app {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 1.5rem 1rem 3rem;
                    background: #080c14;
                    border-radius: 16px;
                    border: 1px solid #1e293b;
                }

                .pcpp-modern .header { text-align: center; margin-bottom: 2rem; }
                .pcpp-modern .header h1 {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 1.8rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #6EE7B7 0%, #3B82F6 50%, #A78BFA 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: .3rem;
                }
                .pcpp-modern .header p { color: #64748b; font-size: .85rem; font-family: 'JetBrains Mono', monospace; }

                .pcpp-modern .controls-bar,
                .pcpp-modern .module-tabs,
                .pcpp-modern .tag-filter,
                .pcpp-modern .nav-bar,
                .pcpp-modern .stats-bar,
                .pcpp-modern .feedback-btns { display: flex; gap: .6rem; flex-wrap: wrap; }

                .pcpp-modern .controls-bar { justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .pcpp-modern .lang-toggle { display:flex; border:1px solid #1e293b; border-radius:8px; overflow:hidden; }
                .pcpp-modern .lang-btn {
                    padding:.4rem .9rem; border:none; background:#0f172a; color:#64748b; cursor:pointer;
                    font-family:'JetBrains Mono', monospace; font-size:.8rem; font-weight:600;
                }
                .pcpp-modern .lang-btn.active { background:#1e3a5f; color:#60a5fa; }

                .pcpp-modern .action-btn {
                    padding:.4rem .85rem; border-radius:7px; border:1px solid #1e293b; background:#0f172a;
                    color:#94a3b8; cursor:pointer; font-size:.8rem;
                }
                .pcpp-modern .action-btn.active-view { background:#1e293b; color:#e2e8f0; border-color:#475569; }

                .pcpp-modern .mod-tab,
                .pcpp-modern .tag-btn,
                .pcpp-modern .nav-btn,
                .pcpp-modern .feedback-btn,
                .pcpp-modern .overview-card,
                .pcpp-modern .card-face { transition: all .15s; }

                .pcpp-modern .mod-tab {
                    padding:.45rem .85rem; border-radius:8px; border:1px solid #1e293b; background:#0a0f1a;
                    color:#64748b; cursor:pointer; font-size:.8rem;
                }
                .pcpp-modern .mod-tab.active { border-color: var(--mod-color); color: var(--mod-color); background: rgba(255,255,255,.04); }

                .pcpp-modern .tag-btn {
                    padding:.3rem .7rem; border-radius:6px; border:1px solid #1e293b; background:transparent;
                    color:#475569; cursor:pointer; font-size:.75rem; font-family:'JetBrains Mono', monospace;
                }
                .pcpp-modern .tag-btn.active { color:#e2e8f0; border-color:#475569; background:#1e293b; }

                .pcpp-modern .card-area { perspective: 1200px; margin-bottom: 1.25rem; }
                .pcpp-modern .card-wrapper {
                    position: relative; width: 100%; min-height: 380px; transform-style: preserve-3d;
                    transition: transform .5s cubic-bezier(.4,0,.2,1); cursor:pointer;
                }
                .pcpp-modern .card-wrapper.flipped { transform: rotateY(180deg); }
                .pcpp-modern .card-face {
                    position:absolute; inset:0; backface-visibility:hidden; border-radius:16px; padding:2rem;
                    display:flex; flex-direction:column; border:1px solid #1e293b; min-height:380px;
                }
                .pcpp-modern .card-front { background: linear-gradient(145deg, #0d1526 0%, #0a1020 100%); }
                .pcpp-modern .card-back { background: linear-gradient(145deg, #0d2015 0%, #091510 100%); transform: rotateY(180deg); }

                .pcpp-modern .card-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.1rem; }
                .pcpp-modern .card-module-badge {
                    display:flex; gap:.4rem; font-size:.75rem; font-weight:600; padding:.25rem .7rem; border-radius:6px;
                    border:1px solid var(--mod-accent); color:var(--mod-color); background:rgba(0,0,0,.3);
                    font-family:'JetBrains Mono', monospace;
                }
                .pcpp-modern .card-tag-badge {
                    font-size:.7rem; padding:.2rem .6rem; border-radius:5px; border:1px solid var(--tag-border);
                    color:#94a3b8; font-family:'JetBrains Mono', monospace;
                }

                .pcpp-modern .card-question { flex:1; display:flex; align-items:center; justify-content:center; text-align:center; }
                .pcpp-modern .card-question p { font-size:1.05rem; line-height:1.55; white-space:pre-wrap; }
                .pcpp-modern .card-answer { flex:1; overflow-y:auto; }
                .pcpp-modern .card-hint { text-align:center; color:#334155; font-size:.75rem; margin-top:1rem; }

                .pcpp-modern .code-block {
                    background:#000d1a; border:1px solid #1e3a5f; border-radius:8px; padding:.85rem 1rem; margin:.6rem 0;
                    overflow-x:auto; font-family:'JetBrains Mono', monospace; font-size:.78rem; line-height:1.6; color:#7dd3fc;
                }

                .pcpp-modern .nav-bar { justify-content:space-between; align-items:center; margin-bottom:1rem; }
                .pcpp-modern .nav-btn {
                    padding:.6rem 1.1rem; border-radius:10px; border:1px solid #1e293b; background:#0f172a;
                    color:#94a3b8; cursor:pointer; font-size:.85rem;
                }
                .pcpp-modern .card-counter { font-family:'JetBrains Mono', monospace; color:#475569; text-align:center; flex:1; }
                .pcpp-modern .card-counter span { color:#94a3b8; font-weight:600; }

                .pcpp-modern .progress-bar { height:4px; background:#0f172a; border-radius:2px; margin-bottom:1rem; overflow:hidden; }
                .pcpp-modern .progress-fill { height:100%; background:linear-gradient(90deg,#059669,#3b82f6); transition:width .3s ease; }

                .pcpp-modern .feedback-btn { padding:.5rem 1.4rem; border-radius:9px; border:1px solid; cursor:pointer; font-size:.82rem; font-weight:600; }
                .pcpp-modern .feedback-btn.known { border-color:#166534; background:rgba(22,101,52,.2); color:#4ade80; }
                .pcpp-modern .feedback-btn.unknown { border-color:#991b1b; background:rgba(153,27,27,.2); color:#f87171; }

                .pcpp-modern .stats-bar {
                    justify-content:center; padding:.75rem; background:#0a0f1a; border:1px solid #1e293b; border-radius:10px;
                    margin-top:1rem;
                }
                .pcpp-modern .stat-item { color:#64748b; font-family:'JetBrains Mono', monospace; font-size:.8rem; }
                .pcpp-modern .stat-item span { color:#94a3b8; font-weight:600; }

                .pcpp-modern .overview-grid {
                    display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:.75rem;
                }
                .pcpp-modern .overview-card {
                    background:#0a0f1a; border:1px solid #1e293b; border-radius:10px; padding:1rem; cursor:pointer;
                }
                .pcpp-modern .oc-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:.6rem; }
                .pcpp-modern .oc-q {
                    font-size:.82rem; color:#94a3b8; line-height:1.4; display:-webkit-box; -webkit-line-clamp:3;
                    -webkit-box-orient:vertical; overflow:hidden;
                }

                .pcpp-modern .kbd {
                    display:inline-flex; align-items:center; justify-content:center; background:#0f172a; border:1px solid #334155;
                    border-radius:4px; padding:.1rem .35rem; font-family:'JetBrains Mono', monospace; font-size:.7rem; color:#64748b;
                }

                @media (max-width: 768px) {
                    .pcpp-modern .app { padding: 1rem .7rem 2rem; }
                    .pcpp-modern .header h1 { font-size: 1.35rem; }
                    .pcpp-modern .card-face { padding: 1.15rem; min-height: 320px; }
                    .pcpp-modern .card-question p { font-size: .95rem; }
                    .pcpp-modern .controls-bar { gap: .5rem; }
                    .pcpp-modern .action-btn { font-size: .75rem; }
                    .pcpp-modern .overview-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="pcpp-modern">
                <div className="app">
                    <div className="header">
                        <h1>PCPP1 Lernkarten · Flashcards</h1>
                        <p>PCPP-32-101 · {cards.length} Karten</p>
                    </div>

                    <div className="controls-bar">
                        <div className="lang-toggle">
                            <button className={`lang-btn ${lang === "de" ? "active" : ""}`} onClick={() => setLang("de")}>🇩🇪 DE</button>
                            <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>🇬🇧 EN</button>
                        </div>
                        <div style={{ display: "flex", gap: ".5rem" }}>
                            <button className={`action-btn ${view === "cards" ? "active-view" : ""}`} onClick={() => setView("cards")}>
                                🃏 {lang === "de" ? "Karten" : "Cards"}
                            </button>
                            <button className={`action-btn ${view === "overview" ? "active-view" : ""}`} onClick={() => setView("overview")}>
                                📋 {lang === "de" ? "Übersicht" : "Overview"}
                            </button>
                            <button className="action-btn" onClick={shuffled ? resetOrder : handleShuffle}>
                                {shuffled ? "🔄 Reset" : "🔀 Shuffle"}
                            </button>
                        </div>
                    </div>

                    <div className="module-tabs" style={{ marginBottom: "1rem" }}>
                        <button className={`mod-tab ${activeModule === 0 ? "active" : ""}`} style={{ "--mod-color": "#94a3b8", "--mod-accent": "#475569" }} onClick={() => setActiveModule(0)}>
                            🗂 {lang === "de" ? "Alle" : "All"} ({cards.length})
                        </button>
                        {moduleList.map((m) => (
                            <button key={m.id} className={`mod-tab ${activeModule === m.id ? "active" : ""}`} style={{ "--mod-color": m.color || "#94a3b8", "--mod-accent": m.accent || "#475569" }} onClick={() => setActiveModule(m.id)}>
                                {(m.icon || "📚")} {m.short || `M${m.id}`}
                            </button>
                        ))}
                    </div>

                    <div className="tag-filter" style={{ marginBottom: "1.2rem" }}>
                        <button className={`tag-btn ${activeTag === "all" ? "active" : ""}`} onClick={() => setActiveTag("all")}>all ({Object.values(tagCounts).reduce((a, b) => a + b, 0) || 0})</button>
                        {["concept", "code", "exam", "tip"].map((tag) => (
                            <button key={tag} className={`tag-btn ${activeTag === tag ? "active" : ""}`} onClick={() => setActiveTag(tag)}>
                                {tag} ({tagCounts[tag] || 0})
                            </button>
                        ))}
                    </div>

                    {view === "cards" ? (
                        <>
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${totalFiltered ? Math.round(((safeIndex + 1) / totalFiltered) * 100) : 0}%` }} /></div>

                            {currentCard && (
                                <div className="card-area">
                                    <div className={`card-wrapper ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
                                        <div className="card-face card-front">
                                            <div className="card-meta">
                                                <div className="card-module-badge" style={{ "--mod-color": currentModule?.color || "#94a3b8", "--mod-accent": currentModule?.accent || "#475569" }}>
                                                    {currentModule?.icon || "📚"} M{currentCard.module} · {currentModule?.short || `M${currentCard.module}`}
                                                </div>
                                                <div className="card-tag-badge" style={{ "--tag-border": TAG_STYLES[currentCard.tag]?.border || "#334155" }}>
                                                    {TAG_STYLES[currentCard.tag]?.label[lang] || currentCard.tag}
                                                </div>
                                            </div>
                                            <div className="card-question"><p>{getLocalized(currentCard.q)}</p></div>
                                            <div className="card-hint"><span className="kbd">Space</span> · {lang === "de" ? "klicken zum Umdrehen" : "click to flip"}</div>
                                        </div>

                                        <div className="card-face card-back">
                                            <div className="card-meta">
                                                <div className="card-module-badge" style={{ "--mod-color": currentModule?.color || "#94a3b8", "--mod-accent": currentModule?.accent || "#475569" }}>
                                                    {currentModule?.icon || "📚"} {lang === "de" ? "Antwort" : "Answer"}
                                                </div>
                                                <div className="card-tag-badge" style={{ "--tag-border": TAG_STYLES[currentCard.tag]?.border || "#334155" }}>
                                                    {TAG_STYLES[currentCard.tag]?.label[lang] || currentCard.tag}
                                                </div>
                                            </div>
                                            <div className="card-answer"><CardContent text={getLocalized(currentCard.a)} /></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {flipped && currentCard && (
                                <div className="feedback-btns" style={{ justifyContent: "center", marginBottom: "1rem" }}>
                                    <button className="feedback-btn unknown" onClick={(e) => { e.stopPropagation(); setUnknown((s) => new Set(s).add(currentCard.id)); goNext(); }}>✗ {lang === "de" ? "Noch lernen" : "Still learning"}</button>
                                    <button className="feedback-btn known" onClick={(e) => { e.stopPropagation(); setKnown((s) => new Set(s).add(currentCard.id)); goNext(); }}>✓ {lang === "de" ? "Gewusst" : "Got it"}</button>
                                </div>
                            )}

                            <div className="nav-bar">
                                <button className="nav-btn" onClick={goPrev} disabled={!totalFiltered}>← {lang === "de" ? "Zurück" : "Prev"}</button>
                                <div className="card-counter"><span>{safeIndex + 1}</span> / <span>{totalFiltered}</span></div>
                                <button className="nav-btn" onClick={goNext} disabled={!totalFiltered}>{lang === "de" ? "Weiter" : "Next"} →</button>
                            </div>

                            <div className="stats-bar">
                                <div className="stat-item">📚 <span>{totalFiltered}</span> {lang === "de" ? "Karten" : "cards"}</div>
                                <div className="stat-item">✅ <span>{known.size}</span> {lang === "de" ? "gewusst" : "known"}</div>
                                <div className="stat-item">🔁 <span>{unknown.size}</span> {lang === "de" ? "wiederholen" : "repeat"}</div>
                            </div>
                        </>
                    ) : (
                        <div className="overview-grid">
                            {filteredIndices.map((i, idx) => {
                                const c = cards[i];
                                const m = moduleMap.get(c.module);
                                const isKnown = known.has(c.id);
                                const isUnknown = unknown.has(c.id);
                                return (
                                    <div key={c.id} className="overview-card" style={{ borderColor: isKnown ? "#166534" : isUnknown ? "#991b1b" : "#1e293b" }} onClick={() => { setCardIndex(idx); setFlipped(false); setView("cards"); }}>
                                        <div className="oc-meta">
                                            <div style={{ fontSize: ".7rem", color: m?.color || "#94a3b8", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
                                                {m?.icon || "📚"} M{c.module} · {m?.short || `M${c.module}`}
                                            </div>
                                            <div style={{ display: "flex", gap: ".3rem", alignItems: "center" }}>
                                                <span style={{ fontSize: ".65rem", padding: ".15rem .4rem", borderRadius: "4px", border: `1px solid ${TAG_STYLES[c.tag]?.border || "#334155"}`, color: "#64748b", fontFamily: "monospace" }}>{c.tag}</span>
                                                {isKnown && <span>✅</span>}
                                                {isUnknown && <span>🔁</span>}
                                            </div>
                                        </div>
                                        <div className="oc-q">{getLocalized(c.q)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<PCPP1FlashcardsApp />);
