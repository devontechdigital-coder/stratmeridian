"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import styles from "@/components/public/meridianTheme.module.css";

/* ─── Inline styles as a <style> tag injected once ─── */
const CSS = `

  .lp-root *,
  .lp-root *::before,
  .lp-root *::after { box-sizing: border-box; }

  .lp-root {
    min-height: 100vh;
    background: var(--ivory);
    font-family: var(--sans);
    display: flex;
     position: relative;
    overflow: hidden;
    padding-top: 96px;
  }

  /* Left decorative panel */
  .lp-left {
    display: none;
    width: 42%;
    background: var(--ink-primary);
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    position: relative;
    overflow: hidden;
  }
  @media(min-width:960px){ .lp-left { display: flex; } }

  .lp-left-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(198,167,107,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(198,167,107,.06) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .lp-left-blob {
    position: absolute;
    bottom: -80px; left: -80px;
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(198,167,107,.14) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }
  .lp-left-blob2 {
    position: absolute;
    top: -60px; right: -60px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(198,167,107,.1) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .lp-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    position: relative;
    z-index: 2;
  }
  .lp-brand-icon {
    width: 38px; height: 38px;
    background: var(--gold);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-brand-icon svg { width: 20px; height: 20px; color: var(--ink-primary); }
  .lp-brand-name {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-on-dark);
    letter-spacing: -.3px;
  }

  .lp-left-body {
    position: relative;
    z-index: 2;
  }
  .lp-left-quote {
    font-family: var(--serif);
    font-size: 32px;
    font-weight: 500;
    color: var(--text-on-dark);
    line-height: 1.2;
    letter-spacing: -.6px;
    margin-bottom: 20px;
  }
  .lp-left-quote span {
    color: transparent;
    -webkit-text-stroke: 1.5px rgba(198,167,107,.65);
  }
  .lp-left-sub {
    font-size: 14px;
    color: var(--text-on-dark-mute);
    font-weight: 500;
    line-height: 1.6;
  }

  .lp-left-footer {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .lp-avatar-stack { display: flex; }
  .lp-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 2px solid var(--ink-primary);
    background: var(--ink-secondary);
    margin-left: -8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-on-dark);
  }
  .lp-avatar:first-child { margin-left: 0; }
  .lp-left-footer-text {
    font-size: 12.5px;
    color: var(--text-on-dark-mute);
    font-weight: 500;
  }
  .lp-left-footer-text strong { color: var(--text-on-dark); }

  /* Right form panel */
  .lp-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    background: var(--ivory);
  }

  .lp-card {
    width: 100%;
    max-width: 420px;
    animation: lpIn .5s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes lpIn {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* Mobile brand */
  .lp-mobile-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 36px;
  }
  @media(min-width:960px){ .lp-mobile-brand { display:none; } }
  .lp-mobile-brand-icon {
    width: 34px; height: 34px;
    background: var(--gold);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-mobile-brand-icon svg { width: 18px; height: 18px; color: var(--ink-primary); }
  .lp-mobile-brand-name {
    font-size: 17px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -.3px;
  }

  .lp-heading {
    font-family: var(--serif);
    font-size: 30px;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: -.6px;
    line-height: 1.15;
    margin-bottom: 6px;
  }
  .lp-sub {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 30px;
  }

  /* Tab */
  .lp-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: rgba(16,25,24,.05);
    border-radius: 2px;
    padding: 4px;
    gap: 4px;
    margin-bottom: 28px;
  }
  .lp-tab {
    border: none;
    background: transparent;
    border-radius: 2px;
    padding: 10px 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background .2s, color .2s, box-shadow .2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .lp-tab.active {
    background: var(--gold);
    color: var(--ink-primary);
    box-shadow: 0 2px 8px rgba(198,167,107,.35);
  }
  .lp-tab svg { width: 14px; height: 14px; }

  /* Alerts */
  .lp-alert {
    border-radius: 2px;
    padding: 11px 14px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 18px;
    display: flex; align-items: center; gap: 8px;
    animation: lpIn .25s ease both;
  }
  .lp-alert svg { width: 15px; height: 15px; flex-shrink: 0; }
  .lp-alert-error  { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
  .lp-alert-success{ background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }

  /* Panel */
  .lp-panel { display: none; }
  .lp-panel.active { display: block; animation: lpIn .3s ease both; }

  /* Field */
  .lp-field { margin-bottom: 18px; }
  .lp-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }
  .lp-input-wrap { position: relative; }
  .lp-input-icon {
    position: absolute;
    left: 13px; top: 50%; transform: translateY(-50%);
    color: var(--text-secondary);
    pointer-events: none;
    display: flex;
  }
  .lp-input-icon svg { width: 16px; height: 16px; }

  .lp-input {
    width: 100%;
    padding: 13px 14px 13px 40px;
    border: 1.5px solid rgba(16,25,24,.16);
    border-radius: 2px;
    font-size: 14px;
    font-family: var(--sans);
    color: var(--text-primary);
    background: var(--surface);
    outline: none;
    transition: border .2s, background .2s, box-shadow .2s;
  }
  .lp-input::placeholder { color: var(--text-secondary); }
  .lp-input:focus {
    border-color: var(--gold);
    background: var(--surface);
    box-shadow: 0 0 0 3px rgba(198,167,107,.16);
  }
  .lp-input:disabled { opacity: .45; cursor: not-allowed; }

  .lp-pw-toggle {
    position: absolute;
    right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    padding: 2px;
    transition: color .2s;
  }
  .lp-pw-toggle:hover { color: var(--gold); }
  .lp-pw-toggle svg { width: 16px; height: 16px; }

  /* OTP row */
  .lp-otp-row { display: flex; gap: 8px; }
  .lp-otp-row .lp-input { flex: 1; }
  .lp-btn-send {
    flex-shrink: 0;
    border: 1.5px solid var(--gold);
    background: transparent;
    color: var(--text-primary);
    border-radius: 2px;
    padding: 0 15px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: background .2s, color .2s;
    letter-spacing: .2px;
  }
  .lp-btn-send:hover:not(:disabled) { background: var(--gold); color: var(--ink-primary); }
  .lp-btn-send:disabled { opacity: .4; cursor: not-allowed; }

  /* Forgot */
  .lp-forgot {
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    text-align: right;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--gold);
    text-decoration: none;
    cursor: pointer;
    margin-top: -10px;
    margin-bottom: 24px;
    transition: opacity .2s;
  }
  .lp-forgot:hover { opacity: .65; }

  /* OTP progress dots */
  .lp-otp-dots {
    display: flex;
    gap: 5px;
    margin-top: 10px;
    align-items: center;
  }
  .lp-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: rgba(16,25,24,.16);
    transition: background .18s, transform .18s;
    display: inline-block;
  }
  .lp-dot.filled { background: var(--gold); transform: scale(1.15); }
  .lp-otp-hint {
    font-size: 11.5px;
    color: var(--text-secondary);
    font-weight: 500;
    margin-left: 8px;
  }

  /* Primary button */
  .lp-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 2px;
    background: var(--gold);
    color: var(--ink-primary);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: .1px;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 2px 8px rgba(198,167,107,.3);
    position: relative;
    overflow: hidden;
  }
  .lp-btn:hover:not(:disabled) { background: #d8bb84; box-shadow: 0 4px 16px rgba(198,167,107,.4); transform: translateY(-1px); }
  .lp-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

  /* Divider */
  .lp-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 22px 0;
  }
  .lp-divider-line { flex:1; height:1px; background:rgba(16,25,24,.14); }
  .lp-divider-text { font-size: 12px; color: var(--text-secondary); font-weight: 600; white-space:nowrap; }

  /* Social */
  .lp-btn-social {
    width: 100%;
    padding: 12px;
    border: 1.5px solid rgba(16,25,24,.16);
    border-radius: 2px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .lp-btn-social:hover { border-color: var(--gold); background: var(--ivory); box-shadow: 0 1px 4px rgba(16,25,24,.06); }

  /* Footer */
  .lp-footer {
    margin-top: 24px;
    text-align: center;
    font-size: 13.5px;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .lp-footer a { color: var(--gold); font-weight: 700; text-decoration: none; }
  .lp-footer a:hover { text-decoration: underline; }

  /* Trust badges */
  .lp-trust {
    display: flex; align-items: center; justify-content: center; gap: 20px;
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid rgba(16,25,24,.1);
  }
  .lp-trust-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px;
    color: var(--text-secondary);
    font-weight: 600;
  }
  .lp-trust-item svg { width: 12px; height: 12px; color: var(--gold); }

  /* Spinner */
  .lp-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(7,28,27,.35);
    border-top-color: var(--ink-primary);
    border-radius: 50%;
    animation: spin .6s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── SVG icons ─── */
const IconBolt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const IconEye = ({ off }) => off ? (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
 

export default function Login() {
  const [mode, setMode]         = useState("password");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [otp, setOtp]           = useState("");
  const [otpSent, setOtpSent]   = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [websiteName, setWebsiteName] = useState("Strat Meridian");

  useEffect(() => {
    fetch("/api/settings/theme")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data?.websiteName) setWebsiteName(d.data.websiteName); })
      .catch(() => {});
  }, []);

  /* ── Password login ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) { setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error); return; }
    const sessionData = await fetch("/api/auth/session").then((r) => r.json());
    const role = sessionData?.user?.role;
    window.location.href = role === "admin" || role === "sub-admin" ? "/admin" : "/";
  };

  /* ── Send OTP ── */
  const sendOtp = async () => {
    setLoading(true); setError(""); setMessage("");
    try {
      const res  = await fetch("/api/auth/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Failed to send OTP"); return; }
      setOtpSent(true);
      setMessage("OTP sent! Check your inbox.");
    } catch { setError("Failed to send OTP"); }
    finally { setLoading(false); }
  };

  /* ── Verify OTP ── */
  const verifyOtpLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const res  = await fetch("/api/auth/otp/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Invalid OTP"); return; }
      const signInRes = await signIn("credentials", { redirect: false, email: data.loginEmail, orderLoginToken: data.loginToken });
      if (signInRes?.error) { setError(signInRes.error === "CredentialsSignin" ? "Unable to sign in with OTP" : signInRes.error); return; }
      const sessionData = await fetch("/api/auth/session").then((r) => r.json());
      const role = sessionData?.user?.role;
      window.location.href = role === "admin" || role === "sub-admin" ? "/admin" : "/dashboard";
    } catch { setError("Failed to verify OTP"); }
    finally { setLoading(false); }
  };

  const sendResetOtp = async () => {
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/auth/password-reset/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Failed to send reset OTP"); return; }
      setResetOtpSent(true);
      setMessage("Password reset OTP sent! Check your inbox.");
    } catch { setError("Failed to send reset OTP"); }
    finally { setLoading(false); }
  };

  const resetPasswordWithOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    if (resetPassword !== resetConfirmPassword) {
      setLoading(false);
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: resetOtp, password: resetPassword }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Failed to change password"); return; }
      setMode("password");
      setPassword("");
      setResetOtp("");
      setResetOtpSent(false);
      setResetPassword("");
      setResetConfirmPassword("");
      setMessage("Password changed successfully. Please sign in.");
    } catch { setError("Failed to change password"); }
    finally { setLoading(false); }
  };

  const switchMode = (m) => { setMode(m); setError(""); setMessage(""); };

  /* OTP dots */
  const dots = Array.from({ length: 6 }, (_, i) => (
    <span key={i} className={`lp-dot${i < otp.length ? " filled" : ""}`} />
  ));
  const resetDots = Array.from({ length: 6 }, (_, i) => (
    <span key={i} className={`lp-dot${i < resetOtp.length ? " filled" : ""}`} />
  ));

  return (
    <>
      <style>{CSS}</style>
      <div className={`${styles.shell} lp-root`}>

        {/* ─── Left panel ─── */}
        <div className="lp-left">
          <div className="lp-left-grid" />
          <div className="lp-left-blob" />
          <div className="lp-left-blob2" />

          <div className="lp-brand">
            <div className="lp-brand-icon"><IconBolt /></div>
            <span className="lp-brand-name">{websiteName}</span>
          </div>

          <div className="lp-left-body">
            <p className="lp-left-quote">
              The workspace<br />
              <span>built for</span><br />
              modern teams.
            </p>
            <p className="lp-left-sub">
              Streamline collaboration, manage projects, and stay in sync — all from one beautiful dashboard.
            </p>
          </div>

          <div className="lp-left-footer">
            <div className="lp-avatar-stack">
              {["AK","SR","MJ","PL"].map((n) => (
                <div className="lp-avatar" key={n} style={{ background: ["#2d2d2d","#3d3d3d","#4d4d4d","#5d5d5d"][["AK","SR","MJ","PL"].indexOf(n)] }}>{n}</div>
              ))}
            </div>
            <p className="lp-left-footer-text"><strong>12,000+</strong> teams worldwide</p>
          </div>
        </div>

        {/* ─── Right form ─── */}
        <div className="lp-right mt-4">
          <div className="lp-card mt-4">

            {/* Mobile brand */}
            <div className="lp-mobile-brand">
              <div className="lp-mobile-brand-icon"><IconBolt /></div>
              <span className="lp-mobile-brand-name">{websiteName}</span>
            </div>

            <h1 className="lp-heading text-dark mb-2">{mode === "forgot" ? "Forgot Password" : "Sign in"}</h1>
 
            {/* Tabs */}
            <div className={`lp-tabs ${mode === "forgot" ? "d-none" : ""}`}>
              <button type="button" className={`lp-tab${mode === "password" ? " active" : ""}`} onClick={() => switchMode("password")}>
                <IconLock /> Password
              </button>
              <button type="button" className={`lp-tab${mode === "otp" ? " active" : ""}`} onClick={() => switchMode("otp")}>
                <IconMail /> Email OTP
              </button>
            </div>
 
 {mode === "forgot" && 
                <button type="button" className="btn btn-dark btn-sm rounded-1 ps-2 mb-2 d-flex gap-1" style={{ textAlign: "center", marginTop: "16px", marginBottom: 0 }} onClick={() => switchMode("password")}>
                <svg
  width="20px"
  height="20px"
  viewBox="0 0 512 512"
  xmlns="http://www.w3.org/2000/svg"
>
  <title>ionicons-v5-a</title>
  <polyline
    points="328 112 184 256 328 400"
    style={{
      fill: "none",
      stroke: "white",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 48
    }}
  />
</svg>
  GO BACK
                </button>
}

            {/* Alerts */}
            {error   && <div className="lp-alert lp-alert-error">  <IconShield />{error}  </div>}
            {message && <div className="lp-alert lp-alert-success"><IconShield />{message}</div>}

            {/* ── Password panel ── */}
            <div className={`lp-panel${mode === "password" ? " active" : ""}`}>
              <form onSubmit={handleSubmit}>
                <div className="lp-field">
                  <label className="lp-label">Email Address</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconMail /></span>
                    <input
                      type="email" required className="lp-input"
                      placeholder="you@company.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="lp-field" style={{ marginBottom: "8px" }}>
                  <label className="lp-label">Password</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconLock /></span>
                    <input
                      type={showPw ? "text" : "password"} required className="lp-input"
                      placeholder="Your password"
                      style={{ paddingRight: "42px" }}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" className="lp-pw-toggle" onClick={() => setShowPw((p) => !p)} title="Toggle password">
                      <IconEye off={showPw} />
                    </button>
                  </div>
                </div>

                <button type="button" className="lp-forgot mt-2" onClick={() => switchMode("forgot")}>Forgot password?</button>

                <button type="submit" className="lp-btn" disabled={loading}>
                  {loading && <span className="lp-spinner" />}
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="lp-divider">
                <div className="lp-divider-line" />
                <span className="lp-divider-text">or </span>
                <div className="lp-divider-line" />
              </div>

              
            </div>

            {/* ── OTP panel ── */}
            <div className={`lp-panel${mode === "otp" ? " active" : ""}`}>
              <form onSubmit={verifyOtpLogin}>
                <div className="lp-field">
                  <label className="lp-label">Email Address</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconMail /></span>
                    <div className="lp-otp-row">
                      <input
                        type="email" required className="lp-input"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setOtp(""); }}
                      />
                      <button
                        type="button" className="lp-btn-send"
                        onClick={sendOtp} disabled={loading || !email}
                      >
                        {loading && otpSent ? "…" : otpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">OTP Code</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconLock /></span>
                    <input
                      type="text" inputMode="numeric" maxLength={6}
                      required className="lp-input"
                      placeholder="6-digit code"
                      style={{ letterSpacing: "6px", fontSize: "18px", fontWeight: 700 }}
                      disabled={!otpSent}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </div>
                  <div className="lp-otp-dots">
                    {dots}
                    <span className="lp-otp-hint">Enter the code from your inbox</span>
                  </div>
                </div>

                <button
                  type="submit" className="lp-btn"
                  disabled={loading || !otpSent || otp.length !== 6}
                  style={{ marginTop: "6px" }}
                >
                  {loading && <span className="lp-spinner" />}
                  {loading ? "Verifying…" : "Verify & Sign In"}
                </button>
              </form>
            </div>

            {/* Forgot password panel */}
            <div className={`lp-panel${mode === "forgot" ? " active" : ""}`}>
              <form onSubmit={resetPasswordWithOtp}>
                <div className="lp-field">
                  <label className="lp-label">Email Address</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconMail /></span>
                    <div className="lp-otp-row">
                      <input
                        type="email" required className="lp-input"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setResetOtpSent(false); setResetOtp(""); }}
                      />
                      <button
                        type="button" className="lp-btn-send"
                        onClick={sendResetOtp} disabled={loading || !email}
                      >
                        {loading && resetOtpSent ? "..." : resetOtpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">OTP Code</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconLock /></span>
                    <input
                      type="text" inputMode="numeric" maxLength={6}
                      required className="lp-input"
                      placeholder="6-digit code"
                      style={{ letterSpacing: "6px", fontSize: "18px", fontWeight: 700 }}
                      disabled={!resetOtpSent}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </div>
                  <div className="lp-otp-dots">
                    {resetDots}
                    <span className="lp-otp-hint">Enter the reset code from your inbox</span>
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">New Password</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconLock /></span>
                    <input
                      type={showResetPw ? "text" : "password"} required className="lp-input"
                      placeholder="New password"
                      style={{ paddingRight: "42px" }}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                    <button type="button" className="lp-pw-toggle" onClick={() => setShowResetPw((p) => !p)} title="Toggle password">
                      <IconEye off={showResetPw} />
                    </button>
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">Confirm Password</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon"><IconLock /></span>
                    <input
                      type={showResetPw ? "text" : "password"} required className="lp-input"
                      placeholder="Confirm new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit" className="lp-btn"
                  disabled={loading || !resetOtpSent || resetOtp.length !== 6 || !resetPassword || !resetConfirmPassword}
                  style={{ marginTop: "6px" }}
                >
                  {loading && <span className="lp-spinner" />}
                  {loading ? "Changing password..." : "Change Password"}
                </button>

                {/* <button type="button" className="lp-forgot" style={{ textAlign: "center", marginTop: "16px", marginBottom: 0 }} onClick={() => switchMode("password")}>
                  Back to sign in
                </button> */}
              </form>
            </div>

            {/* Footer */}
            <p className="lp-footer">
              Don&apos;t have an account?{" "}
              <Link href="/register">Create one free</Link>
            </p>

            {/* Trust */}
            <div className="lp-trust">
              <div className="lp-trust-item"><IconShield /> 256-bit SSL</div>
              <div className="lp-trust-item"><IconShield /> GDPR Safe</div>
              <div className="lp-trust-item"><IconShield /> No spam</div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
