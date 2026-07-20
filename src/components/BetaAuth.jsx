import { useState } from "react";
import { requestPasswordReset, signInWithEmail, signUpWithEmail } from "../services/supabaseBeta.js";

export default function BetaAuth({ onAuthenticated }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wantsProductUpdates, setWantsProductUpdates] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    try {
      if (mode === "reset") {
        await requestPasswordReset(email);
        setStatus("Password reset email sent if this account exists.");
        return;
      }
      const session = mode === "signup"
        ? await signUpWithEmail({ email, password, wantsProductUpdates })
        : await signInWithEmail({ email, password });
      if (session?.access_token) onAuthenticated(session);
      else setStatus("Account created. Please check your email if confirmation is enabled in Supabase.");
    } catch (authError) {
      setError(authError.message || "Authentication failed.");
    }
  }

  return (
    <main className="beta-auth-page">
      <section className="beta-auth-card">
        <div>
          <p className="eyebrow">Private Beta</p>
          <h1>Atlas Lore</h1>
          <p className="muted-text">Sign in with your own tester account. Your characters are private and owned by your account.</p>
        </div>
        <div className="segmented-control two-options">
          <button className={mode === "signin" ? "choice-button active" : "choice-button"} type="button" onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "choice-button active" : "choice-button"} type="button" onClick={() => setMode("signup")}>Sign up</button>
        </div>
        <form className="beta-auth-form" onSubmit={submit}>
          <label className="field"><span>Email</span><input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          {mode !== "reset" ? <label className="field"><span>Password</span><input autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength="8" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label> : null}
          {mode === "signup" ? (
            <>
              <p className="beta-policy-note">By creating an account, you acknowledge the <a href="#legal/privacy">Privacy Policy</a> and agree to the <a href="#legal/terms">Beta Terms</a>.</p>
              <label className="inline-check"><input type="checkbox" checked={wantsProductUpdates} onChange={(event) => setWantsProductUpdates(event.target.checked)} /><span>I would like to receive product updates.</span></label>
            </>
          ) : null}
          {error ? <p className="form-error-text">{error}</p> : null}
          {status ? <p className="success-text">{status}</p> : null}
          <button className="primary-button" type="submit">{mode === "reset" ? "Send Reset Email" : mode === "signup" ? "Create Account" : "Sign In"}</button>
        </form>
        <button className="text-button" type="button" onClick={() => setMode(mode === "reset" ? "signin" : "reset")}>{mode === "reset" ? "Back to sign in" : "Reset password"}</button>
      </section>
    </main>
  );
}

