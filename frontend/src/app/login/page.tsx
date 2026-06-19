"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { insforge } from "@/lib/insforge";

function KubeLogo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="url(#logo-grad)" />
      <path d="M20 8L32 14.5V25.5L20 32L8 25.5V14.5L20 8Z"
        stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <line x1="20" y1="8"  x2="20" y2="32" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="8"  y1="14.5" x2="32" y2="25.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="32" y1="14.5" x2="8"  y2="25.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <circle cx="20" cy="20" r="3" fill="white" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e40af" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function InputField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
        {label}
      </label>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: `1px solid ${focused ? "var(--blue-bright)" : "var(--border-mid)"}`,
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          fontSize: 14,
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: focused ? "0 0 0 3px var(--blue-dim)" : "none",
        }}
      />
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "11px 20px",
        borderRadius: 8,
        background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
        color: "white",
        fontWeight: 600,
        fontSize: 14,
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.65 : 1,
        boxShadow: "0 4px 16px rgba(29,78,216,0.4)",
        transition: "opacity 0.15s",
      }}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      padding: "10px 14px",
      borderRadius: 8,
      background: "var(--red-dim)",
      border: "1px solid var(--red-border)",
      color: "#fca5a5",
      fontSize: 13,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
      <span>{msg}</span>
    </div>
  );
}

const FEATURES = [
  { icon: "⬡", label: "Multi-cluster kubeconfig detection" },
  { icon: "⚡", label: "Real-time WebSocket progress updates" },
  { icon: "🧠", label: "AI root cause analysis via OpenRouter" },
  { icon: "🔍", label: "Pods, logs, events, network inspection" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]           = useState<"login" | "signup">("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp]             = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await insforge.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
        if (data?.requireEmailVerification) setVerifying(true);
        else router.push("/dashboard");
      } else {
        const { data, error } = await insforge.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        if (data) router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data, error } = await insforge.auth.verifyEmail({ email, otp });
      if (error) throw new Error(error.message);
      if (data) router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>

      {/* ── Brand panel (desktop only) ──────────────────────────────────── */}
      <div style={{
        width: 440, flexShrink: 0,
        display: "none",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "44px 48px",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(37,99,235,0.14) 0%, transparent 70%)",
      }} className="lg:flex">

        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <KubeLogo size={34} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", lineHeight: 1 }}>AI Kubernetes Agent</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>Cluster Diagnostics Platform</p>
          </div>
        </div>

        {/* copy + features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 99,
              background: "var(--blue-dim)", border: "1px solid var(--blue-border)",
              marginBottom: 16,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--blue-bright)", display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--blue-bright)", textTransform: "uppercase" }}>AI-Powered</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, color: "var(--text-primary)", marginBottom: 12 }}>
              Diagnose Kubernetes failures in seconds
            </h1>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)" }}>
              Automatically investigate pods, logs, events and deployments. Get AI-generated root cause analysis with actionable fixes.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                background: "var(--bg-raised)", border: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>FastAPI · Next.js · InsForge · OpenRouter</p>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }} className="lg:hidden">
            <KubeLogo size={30} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>AI Kubernetes Agent</p>
          </div>

          {verifying ? (
            <form onSubmit={handleVerify} className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Check your inbox</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  6-digit code sent to <span style={{ color: "var(--text-secondary)" }}>{email}</span>
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                  Verification Code
                </label>
                <input
                  type="text" placeholder="000000" value={otp}
                  onChange={e => setOtp(e.target.value)} maxLength={6}
                  style={{
                    padding: "12px", borderRadius: 8, fontSize: 26,
                    fontFamily: "monospace", letterSpacing: "0.45em",
                    textAlign: "center", width: "100%", outline: "none",
                    background: "var(--bg-base)", border: "1px solid var(--border-mid)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              {error && <ErrorBox msg={error} />}
              <SubmitBtn loading={loading}>Verify Email</SubmitBtn>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {mode === "login" ? "Sign in to access your dashboard" : "Get started with AI-powered diagnostics"}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <InputField label="Email address" type="email" placeholder="you@company.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
                <InputField label="Password" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {error && <ErrorBox msg={error} />}
              <SubmitBtn loading={loading}>
                {mode === "login" ? "Sign In" : "Create Account"}
              </SubmitBtn>

              <p style={{ fontSize: 13, textAlign: "center", color: "var(--text-muted)" }}>
                {mode === "login" ? "No account? " : "Already registered? "}
                <button type="button"
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                  style={{ color: "var(--blue-bright)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                  {mode === "login" ? "Sign up free" : "Sign in"}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
