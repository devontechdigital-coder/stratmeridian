"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "@/components/public/meridianTheme.module.css";

/* ─── Styles (mirrors Login theme exactly) ─── */
const CSS = `

  .rp-root *, .rp-root *::before, .rp-root *::after { box-sizing: border-box; }

  .rp-root {
    min-height: 100vh;
    background: var(--ivory);
    font-family: var(--sans);
    display: flex;
     position: relative;
    overflow: hidden;
    padding-top: 96px;
  }

  /* ── Left panel ── */
  .rp-left {
    display: none;
    width: 42%;
    background: var(--ink-primary);
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    position: relative;
    overflow: hidden;
  }
  @media(min-width:960px){ .rp-left { display: flex; } }

  .rp-left-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(198,167,107,.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(198,167,107,.06) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .rp-left-blob {
    position: absolute; bottom: -80px; left: -80px;
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(198,167,107,.14) 0%, transparent 65%);
    border-radius: 50%; pointer-events: none;
  }
  .rp-left-blob2 {
    position: absolute; top: -60px; right: -60px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, rgba(198,167,107,.1) 0%, transparent 65%);
    border-radius: 50%; pointer-events: none;
  }

  .rp-brand {
    display: flex; align-items: center; gap: 11px;
    position: relative; z-index: 2;
  }
  .rp-brand-icon {
    width: 38px; height: 38px; background: var(--gold);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .rp-brand-icon svg { width: 20px; height: 20px; color: var(--ink-primary); }
  .rp-brand-name {
   font-size: 18px;
    font-weight: 800; color: var(--text-on-dark); letter-spacing: -.3px;
  }

  .rp-left-body { position: relative; z-index: 2; }
  .rp-left-steps { list-style: none; padding: 0; margin: 0 0 28px; }
  .rp-left-step {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 0;
    border-bottom: 1px solid rgba(237,234,224,.1);
  }
  .rp-left-step:last-child { border-bottom: none; }
  .rp-step-num {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(198,167,107,.12);
    border: 1px solid rgba(198,167,107,.3);
    display: flex; align-items: center; justify-content: center;
   font-size: 13px; font-weight: 800;
    color: var(--gold); flex-shrink: 0; margin-top: 1px;
  }
  .rp-step-title {
     font-size: 14px;
    font-weight: 700; color: var(--text-on-dark); margin-bottom: 3px;
  }
  .rp-step-desc { font-size: 12.5px; color: var(--text-on-dark-mute); font-weight: 500; line-height: 1.5; }

  .rp-left-heading {
    font-family: var(--serif);
    font-size: 32px;
    font-weight: 500; color: var(--text-on-dark); line-height: 1.2;
    letter-spacing: -.6px; margin-bottom: 10px;
  }
  .rp-left-heading span {
    color: transparent;
    -webkit-text-stroke: 1.5px rgba(198,167,107,.65);
  }
  .rp-left-sub { font-size: 14px; color: var(--text-on-dark-mute); font-weight: 500; line-height: 1.6; }


  /* ── Right form ── */
  .rp-right {
    flex: 1; display: flex;
    align-items: center; justify-content: center;
    padding: 48px 24px;
    background: var(--ivory);
  }

  .rp-card {
    width: 100%; max-width: 420px;
    animation: rpIn .5s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes rpIn {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0);    }
  }

  /* Mobile brand */
  .rp-mobile-brand {
    display: flex; align-items: center; gap: 9px;
    margin-bottom: 36px;
  }
  @media(min-width:960px){ .rp-mobile-brand { display:none; } }
  .rp-mobile-brand-icon {
    width: 34px; height: 34px; background: var(--gold);
    border-radius: 9px; display: flex; align-items: center; justify-content: center;
  }
  .rp-mobile-brand-icon svg { width: 18px; height: 18px; color: var(--ink-primary); }
  .rp-mobile-brand-name {
   font-size: 17px;
    font-weight: 800; color: var(--text-primary); letter-spacing: -.3px;
  }

  .rp-heading {
    font-family: var(--serif);
    font-size: 30px;
    font-weight: 500; color: var(--text-primary); letter-spacing: -.6px;
    line-height: 1.15; margin-bottom: 6px;
  }
  .rp-sub { font-size: 14px; color: var(--text-secondary); font-weight: 500; margin-bottom: 30px; }

  /* Alert */
  .rp-alert {
    border-radius: 2px; padding: 11px 14px;
    font-size: 13px; font-weight: 600;
    margin-bottom: 18px;
    display: flex; align-items: center; gap: 8px;
    animation: rpIn .25s ease both;
  }
  .rp-alert svg { width: 15px; height: 15px; flex-shrink: 0; }
  .rp-alert-error   { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
  .rp-alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }

  /* Fields */
  .rp-field { margin-bottom: 18px; }
  .rp-label {
    display: block; font-size: 11.5px; font-weight: 700;
    color: var(--text-secondary); letter-spacing: .06em;
    text-transform: uppercase; margin-bottom: 7px;
  }
  .rp-input-wrap { position: relative; }
  .rp-input-icon {
    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
    color: var(--text-secondary); pointer-events: none; display: flex;
  }
  .rp-input-icon svg { width: 16px; height: 16px; }

  .rp-input {
    width: 100%;
    padding: 13px 14px 13px 40px;
    border: 1.5px solid rgba(16,25,24,.16);
    border-radius: 2px;
     font-size: 14px; font-family: var(--sans); color: var(--text-primary);
    background: var(--surface); outline: none;
    transition: border .2s, background .2s, box-shadow .2s;
  }
  .rp-input::placeholder { color: var(--text-secondary); }
  .rp-input:focus {
    border-color: var(--gold); background: var(--surface);
    box-shadow: 0 0 0 3px rgba(198,167,107,.16);
  }

  .rp-pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: var(--text-secondary);
    cursor: pointer; display: flex; padding: 2px;
    transition: color .2s;
  }
  .rp-pw-toggle:hover { color: var(--gold); }
  .rp-pw-toggle svg { width: 16px; height: 16px; }

  /* Password strength (kept semantic red/orange/yellow/green) */
  .rp-strength { margin-top: 8px; }
  .rp-strength-bar {
    display: flex; gap: 4px; margin-bottom: 5px;
  }
  .rp-strength-seg {
    flex: 1; height: 3px; border-radius: 99px;
    background: rgba(16,25,24,.14);
    transition: background .3s;
  }
  .rp-strength-seg.s1 { background: #ef4444; }
  .rp-strength-seg.s2 { background: #f97316; }
  .rp-strength-seg.s3 { background: #eab308; }
  .rp-strength-seg.s4 { background: #22c55e; }
  .rp-strength-label { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); }

  /* Terms */
  .rp-terms {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 22px; cursor: pointer;
  }
  .rp-checkbox {
    width: 17px; height: 17px; border: 1.5px solid rgba(16,25,24,.24);
    border-radius: 4px; background: var(--surface); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    margin-top: 1px; transition: border .2s, background .2s;
    cursor: pointer;
  }
  .rp-checkbox.checked { background: var(--gold); border-color: var(--gold); }
  .rp-checkbox svg { width: 10px; height: 10px; color: var(--ink-primary); }
  .rp-terms-text { font-size: 13px; color: var(--text-secondary); font-weight: 500; line-height: 1.5; }
  .rp-terms-text a { color: var(--gold); font-weight: 700; text-decoration: none; }
  .rp-terms-text a:hover { text-decoration: underline; }

  /* CTA */
  .rp-btn {
    width: 100%; padding: 14px; border: none;
    border-radius: 2px; background: var(--gold); color: var(--ink-primary);
      font-size: 15px; font-weight: 700;
    cursor: pointer; letter-spacing: .1px;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 2px 8px rgba(198,167,107,.3);
    position: relative; overflow: hidden;
  }
  .rp-btn:hover:not(:disabled) { background: #d8bb84; box-shadow:0 4px 16px rgba(198,167,107,.4); transform:translateY(-1px); }
  .rp-btn:active:not(:disabled) { transform:translateY(0); }
  .rp-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }

  /* Divider */
  .rp-divider { display:flex; align-items:center; gap:12px; margin:22px 0; }
  .rp-divider-line { flex:1; height:1px; background:rgba(16,25,24,.14); }
  .rp-divider-text { font-size:12px; color:var(--text-secondary); font-weight:600; white-space:nowrap; }

  /* Social */
  .rp-btn-social {
    width:100%; padding:12px; border:1.5px solid rgba(16,25,24,.16);
    border-radius:2px; background:var(--surface); color:var(--text-primary);
      font-size:14px; font-weight:700;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px;
    transition:border-color .2s, background .2s, box-shadow .2s;
  }
  .rp-btn-social:hover { border-color:var(--gold); background:var(--ivory); box-shadow:0 1px 4px rgba(16,25,24,.06); }

  /* Footer */
  .rp-footer { margin-top:24px; text-align:center; font-size:13.5px; color:var(--text-secondary); font-weight:500; }
  .rp-footer a { color:var(--gold); font-weight:700; text-decoration:none; }
  .rp-footer a:hover { text-decoration:underline; }

  /* Trust */
  .rp-trust {
    display:flex; align-items:center; justify-content:center; gap:20px;
    margin-top:22px; padding-top:20px; border-top:1px solid rgba(16,25,24,.1);
  }
  .rp-trust-item { display:flex; align-items:center; gap:5px; font-size:11.5px; color:var(--text-secondary); font-weight:600; }
  .rp-trust-item svg { width:12px; height:12px; color:var(--gold); }

  /* Spinner */
  .rp-spinner {
    display:inline-block; width:14px; height:14px;
    border:2px solid rgba(7,28,27,.35); border-top-color:var(--ink-primary);
    border-radius:50%; animation:spin .6s linear infinite;
    margin-right:8px; vertical-align:middle;
  }
  @keyframes spin { to { transform:rotate(360deg); } }
`;
 
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const IconLock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
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
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
 
/* ─── Password strength helper ─── */
function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "s1", "s2", "s3", "s4"];

export default function Register() {
  const router = useRouter();
  const [formData, setFormData]   = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw]       = useState(false);
  const [agreed, setAgreed]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [websiteName, setWebsiteName] = useState("Strat Meridian");

  const strength = getStrength(formData.password);

  useEffect(() => {
    fetch("/api/settings/theme")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data?.websiteName) setWebsiteName(d.data.websiteName); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the Terms & Privacy Policy to continue."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setSuccess("Account created! Redirecting to sign in…");
      setTimeout(() => router.push("/login?registered=true"), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setFormData((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <style>{CSS}</style>
      <div className={`${styles.shell} rp-root`}>

        {/* ─── Left panel ─── */}
        <div className="rp-left">
          <div className="rp-left-grid" />
          <div className="rp-left-blob" />
          <div className="rp-left-blob2" />

          <div className="rp-brand">
            <div className="rp-brand-icon"><IconUser /></div>
            <span className="rp-brand-name">{websiteName}</span>
          </div>

          <div className="rp-left-body">
            <p className="rp-left-heading">
              Get started<br />
              <span>in minutes.</span>
            </p>
            <p className="rp-left-sub" style={{ marginBottom: "28px" }}>
              Everything you need to collaborate, ship faster, and grow — all in one place.
            </p>
            <ul className="rp-left-steps">
              {[
                { n: "01", t: "Create your account", d: "Free forever, no credit card required." },
                { n: "02", t: "Set up your workspace", d: "Invite your team and configure your projects." },
                { n: "03", t: "Start collaborating", d: "Ship faster with powerful tools built for modern teams." },
              ].map((s) => (
                <li className="rp-left-step" key={s.n}>
                  <div className="rp-step-num">{s.n}</div>
                  <div>
                    <p className="rp-step-title">{s.t}</p>
                    <p className="rp-step-desc">{s.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
 
        </div>

        {/* ─── Right form ─── */}
        <div className="rp-right">
          <div className="rp-card">

            <div className="rp-mobile-brand">
              <div className="rp-mobile-brand-icon"><IconUser /></div>
              <span className="rp-mobile-brand-name">{websiteName}</span>
            </div>

            <h1 className="rp-heading text-dark">Create account</h1>

            {/* Alerts */}
            {error   && <div className="rp-alert rp-alert-error">  <IconShield />{error}  </div>}
            {success && <div className="rp-alert rp-alert-success"><IconShield />{success}</div>}

            <form onSubmit={handleSubmit}>

              {/* Name */}
              <div className="rp-field">
                <label className="rp-label">Full Name</label>
                <div className="rp-input-wrap">
                  <span className="rp-input-icon"><IconUser /></span>
                  <input
                    type="text" required className="rp-input"
                    placeholder="Jane Smith"
                    value={formData.name} onChange={set("name")}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="rp-field">
                <label className="rp-label">Email Address</label>
                <div className="rp-input-wrap">
                  <span className="rp-input-icon"><IconMail /></span>
                  <input
                    type="email" required className="rp-input"
                    placeholder="you@company.com"
                    value={formData.email} onChange={set("email")}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="rp-field">
                <label className="rp-label">Password</label>
                <div className="rp-input-wrap">
                  <span className="rp-input-icon"><IconLock /></span>
                  <input
                    type={showPw ? "text" : "password"} required className="rp-input"
                    placeholder="Min. 8 characters"
                    style={{ paddingRight: "42px" }}
                    value={formData.password} onChange={set("password")}
                  />
                  <button type="button" className="rp-pw-toggle" onClick={() => setShowPw((p) => !p)}>
                    <IconEye off={showPw} />
                  </button>
                </div>
                {formData.password && (
                  <div className="rp-strength">
                    <div className="rp-strength-bar">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`rp-strength-seg${strength >= i ? " " + strengthColors[strength] : ""}`} />
                      ))}
                    </div>
                    <span className="rp-strength-label">{strengthLabels[strength]} password</span>
                  </div>
                )}
              </div>

              {/* Terms checkbox */}
              <div className="rp-terms" onClick={() => setAgreed((a) => !a)}>
                <div className={`rp-checkbox${agreed ? " checked" : ""}`}>
                  {agreed && <IconCheck />}
                </div>
                <p className="rp-terms-text">
                  I agree to the <a href="#" onClick={(e) => e.stopPropagation()}>Terms of Service</a> and{" "}
                  <a href="#" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
                </p>
              </div>

              <button type="submit" className="rp-btn" disabled={loading}>
                {loading && <span className="rp-spinner" />}
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <div className="rp-divider">
              <div className="rp-divider-line" />
              <span className="rp-divider-text">or</span>
              <div className="rp-divider-line" />
            </div>
 

            <p className="rp-footer">
              Already have an account?{" "}
              <Link href="/login">Sign in</Link>
            </p>
 
          </div>
        </div>

      </div>
    </>
  );
}