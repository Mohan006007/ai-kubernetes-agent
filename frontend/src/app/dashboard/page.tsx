"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";
import { getClusters, runInvestigation } from "@/services/api";
import { DiagnosisResult, InvestigationRecord, ProgressStep, ALL_STEPS, Cluster } from "@/types";

// ── Primitives ────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="url(#nav-grad)" />
      <path d="M20 8L32 14.5V25.5L20 32L8 25.5V14.5L20 8Z"
        stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <line x1="20" y1="8"  x2="20" y2="32" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="8"  y1="14.5" x2="32" y2="25.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="32" y1="14.5" x2="8"  y2="25.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <circle cx="20" cy="20" r="2.8" fill="white" />
      <defs>
        <linearGradient id="nav-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e40af" /><stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
      {children}
    </p>
  );
}

function Badge({ color, children }: { color: "green" | "blue" | "yellow" | "red"; children: React.ReactNode }) {
  const t = {
    green:  { bg: "var(--green-dim)",  border: "var(--green-border)",  color: "#4ade80" },
    blue:   { bg: "var(--blue-dim)",   border: "var(--blue-border)",   color: "#60a5fa" },
    yellow: { bg: "var(--amber-dim)",  border: "var(--amber-border)",  color: "#fbbf24" },
    red:    { bg: "var(--red-dim)",    border: "var(--red-border)",    color: "#f87171" },
  }[color];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: t.bg, border: `1px solid ${t.border}`, color: t.color, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Card({ children, style = {}, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ borderRadius: 14, padding: "18px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", ...style }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />;
}

// ── Cluster Tile ──────────────────────────────────────────────────────────────

function ClusterTile({ c, selected, onClick }: { c: Cluster; selected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`cluster-tile${selected ? " selected" : ""}`}
      style={{
        width: "100%",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transform: hovered && !selected ? "translateY(-2px)" : "none",
      }}
    >
      {/* top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {/* cluster icon */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: selected ? "var(--blue-dim)" : "var(--bg-raised)",
            border: `1px solid ${selected ? "var(--blue-border)" : "var(--border-mid)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>
            ⬡
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: selected ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.2, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.context}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.cluster}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {c.current && <Badge color="green">active</Badge>}
          {selected && !c.current && <Badge color="blue">selected</Badge>}
        </div>
      </div>

      {/* bottom row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
          background: c.current ? "var(--green-bright)" : "var(--text-muted)",
          boxShadow: c.current ? "0 0 6px var(--green-glow)" : "none",
          ...(c.current ? { animation: "pulse-ring 2s ease infinite" } : {}),
        }} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {c.current ? "Current context" : "Inactive context"}
        </span>
        {selected && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--blue-bright)", fontWeight: 600 }}>✓ Selected</span>
        )}
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId]     = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [clusters, setClusters]             = useState<Cluster[]>([]);
  const [selectedContext, setSelectedContext] = useState("");
  const [clustersError, setClustersError]   = useState("");

  const [loading, setLoading]               = useState(false);
  const [completedSteps, setCompletedSteps] = useState<ProgressStep[]>([]);
  const [diagnosis, setDiagnosis]           = useState<DiagnosisResult | null>(null);
  const [history, setHistory]               = useState<InvestigationRecord[]>([]);
  const [error, setError]                   = useState("");

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data, error }) => {
      if (error || !data.user) { router.push("/login"); return; }
      setUserId(data.user.id);
      setUserEmail(data.user.email);
    });
  }, [router]);

  useEffect(() => {
    getClusters()
      .then(list => {
        const sorted = [...list].sort((a, b) => (a.current === b.current ? 0 : a.current ? -1 : 1));
        setClusters(sorted);
        const cur = sorted.find(c => c.current);
        setSelectedContext(cur ? cur.context : sorted[0]?.context ?? "");
      })
      .catch(() => setClustersError("Could not load clusters. Is kubectl configured?"));
  }, []);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    const { data } = await insforge.database
      .from("investigations")
      .select("id, root_cause, confidence, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setHistory(data as InvestigationRecord[]);
  }, [userId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function handleInvestigate() {
    if (!selectedContext) { setError("Please select a cluster first."); return; }
    setLoading(true); setCompletedSteps([]); setDiagnosis(null); setError("");
    const sessionId = crypto.randomUUID();
    await insforge.realtime.connect();
    await insforge.realtime.subscribe(`investigation:${sessionId}`);
    insforge.realtime.on("progress", (payload: { step: string; done: boolean }) => {
      setCompletedSteps(prev => {
        const step = payload.step as ProgressStep;
        return prev.includes(step) ? prev : [...prev, step];
      });
    });
    try {
      const result = await runInvestigation(sessionId, userId, selectedContext);
      setDiagnosis(result.diagnosis);
      await loadHistory();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || (err instanceof Error ? err.message : "Investigation failed. Please try again."));
    } finally {
      insforge.realtime.unsubscribe(`investigation:${sessionId}`);
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await insforge.auth.signOut();
    router.push("/login");
  }

  const isHealthy =
    diagnosis?.root_cause?.toLowerCase().includes("no issues") ||
    (diagnosis?.confidence === 95 && diagnosis?.root_cause?.toLowerCase().includes("no issues detected"));

  const confColor = (n: number): "green" | "yellow" | "red" => n >= 80 ? "green" : n >= 50 ? "yellow" : "red";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56,
        background: "rgba(2,8,23,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>AI Kubernetes Agent</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Cluster Diagnostics</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontFamily: "monospace", padding: "3px 10px", borderRadius: 6, background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-secondary)" }} className="hidden sm:block">
            {userEmail}
          </span>
          <button onClick={handleSignOut} style={{
            fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 6,
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text-muted)", cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{
          width: 260, flexShrink: 0,
          borderRight: "1px solid var(--border)",
          padding: "20px 16px",
          display: "flex", flexDirection: "column", gap: 24,
          overflowY: "auto",
        }} className="hidden md:flex">

          {history.length > 0 && (
            <div>
              <SectionLabel>Recent Investigations · {history.length}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {history.map(item => (
                  <div key={item.id} style={{
                    padding: "9px 11px", borderRadius: 8,
                    background: "var(--bg-raised)", border: "1px solid var(--border)",
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 5 }}>
                      {item.root_cause || "—"}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: item.confidence >= 80 ? "#4ade80" : item.confidence >= 50 ? "#fbbf24" : "#f87171" }}>
                        {item.confidence}%
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length === 0 && (
            <div>
              <SectionLabel>Recent Investigations</SectionLabel>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>No investigations yet. Run your first one to see results here.</p>
            </div>
          )}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Cluster tiles ──────────────────────────────────────── */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <SectionLabel>Select Cluster</SectionLabel>
                {clusters.length > 0 && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-raised)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 99 }}>
                    {clusters.length} cluster{clusters.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {clustersError && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--amber-dim)", border: "1px solid var(--amber-border)", color: "#fcd34d", fontSize: 13, marginBottom: 12 }}>
                  ⚠ {clustersError}
                </div>
              )}

              {clusters.length === 0 && !clustersError && (
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No clusters found in kubeconfig.</p>
              )}

              {/* TILES GRID */}
              {clusters.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {clusters.map(c => (
                    <ClusterTile
                      key={c.context}
                      c={c}
                      selected={selectedContext === c.context}
                      onClick={() => setSelectedContext(c.context)}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* ── CTA ────────────────────────────────────────────────── */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                    {selectedContext || "No cluster selected"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {selectedContext
                      ? "Ready to investigate. AI will collect evidence and generate a diagnosis."
                      : "Select a cluster above to begin."}
                  </p>
                </div>
                <button
                  onClick={handleInvestigate}
                  disabled={loading || !selectedContext}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 22px", borderRadius: 8,
                    background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                    color: "white", fontWeight: 600, fontSize: 13,
                    border: "none", cursor: loading || !selectedContext ? "not-allowed" : "pointer",
                    opacity: loading || !selectedContext ? 0.45 : 1,
                    boxShadow: "0 4px 16px rgba(29,78,216,0.35)",
                    transition: "opacity 0.15s",
                    flexShrink: 0,
                  }}
                >
                  {loading && <span className="spinner" />}
                  {loading ? "Investigating…" : "Investigate Cluster"}
                </button>
              </div>

              {error && (
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "var(--red-dim)", border: "1px solid var(--red-border)", color: "#fca5a5", fontSize: 13, display: "flex", gap: 8 }}>
                  <span style={{ flexShrink: 0 }}>⚠</span><span>{error}</span>
                </div>
              )}
            </Card>

            {/* ── Progress ───────────────────────────────────────────── */}
            {(loading || completedSteps.length > 0) && (
              <Card style={{ animation: "fade-up 0.3s ease both" }}>
                <SectionLabel>Investigation Status</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {ALL_STEPS.map((step, idx) => {
                    const done   = completedSteps.includes(step);
                    const active = loading && !done && completedSteps.length === idx;
                    const last   = idx === ALL_STEPS.length - 1;
                    return (
                      <div key={step}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700,
                            background: done ? "var(--green-dim)" : active ? "var(--blue-dim)" : "var(--bg-raised)",
                            border: `1px solid ${done ? "var(--green-border)" : active ? "var(--blue-border)" : "var(--border-mid)"}`,
                            color: done ? "#4ade80" : active ? "#60a5fa" : "var(--text-muted)",
                            transition: "all 0.2s",
                          }}>
                            {done ? "✓" : active ? "›" : idx + 1}
                          </div>
                          <span style={{ flex: 1, fontSize: 13, color: done ? "var(--text-primary)" : active ? "#93c5fd" : "var(--text-muted)", transition: "color 0.2s" }}>
                            {step}
                          </span>
                          {done   && <Badge color="green">done</Badge>}
                          {active && <Badge color="blue">running</Badge>}
                        </div>
                        {!last && (
                          <div style={{ width: 1, height: 10, marginLeft: 10, background: done ? "var(--green-border)" : "var(--border)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── Healthy ────────────────────────────────────────────── */}
            {diagnosis && isHealthy && (
              <div style={{ borderRadius: 14, padding: "16px 20px", background: "var(--green-dim)", border: "1px solid var(--green-border)", animation: "fade-up 0.3s ease both" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#4ade80", marginBottom: 4 }}>✓ No critical issues detected</p>
                <p style={{ fontSize: 13, color: "#86efac" }}>Cluster appears healthy. No action required.</p>
              </div>
            )}

            {/* ── Diagnosis ──────────────────────────────────────────── */}
            {diagnosis && !isHealthy && (
              <Card style={{ animation: "fade-up 0.3s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <SectionLabel>Diagnosis</SectionLabel>
                  <Badge color={confColor(diagnosis.confidence)}>{diagnosis.confidence}% confidence</Badge>
                </div>

                {/* Root cause */}
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--bg-raised)", border: "1px solid var(--border-mid)", marginBottom: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Root Cause</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.5 }}>{diagnosis.root_cause}</p>
                </div>

                <Divider />

                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Explanation</p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{diagnosis.explanation}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Suggested Fix</p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{diagnosis.fix}</p>
                  </div>

                  {diagnosis.kubectl_commands.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>kubectl Commands</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {diagnosis.kubectl_commands.map((cmd, i) => (
                          <pre key={i} className="mono" style={{
                            fontSize: 12, padding: "10px 14px", borderRadius: 8, overflowX: "auto",
                            background: "var(--bg-base)", border: "1px solid var(--border-mid)", color: "#86efac",
                            lineHeight: 1.5,
                          }}>
                            <span style={{ color: "var(--text-muted)", userSelect: "none" }}>$ </span>{cmd}
                          </pre>
                        ))}
                      </div>
                    </div>
                  )}

                  {diagnosis.prevention && (
                    <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--blue-dim)", border: "1px solid var(--blue-border)" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#93c5fd", marginBottom: 6 }}>Prevention</p>
                      <p style={{ fontSize: 13, color: "#bfdbfe", lineHeight: 1.7 }}>{diagnosis.prevention}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── Mobile history ─────────────────────────────────────── */}
            {history.length > 0 && (
              <Card style={{}} className="md:hidden">
                <SectionLabel>Previous Investigations</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {history.map((item, idx) => (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 0", gap: 12,
                      borderBottom: idx < history.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.root_cause || "—"}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: item.confidence >= 80 ? "#4ade80" : item.confidence >= 50 ? "#fbbf24" : "#f87171" }}>{item.confidence}%</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
