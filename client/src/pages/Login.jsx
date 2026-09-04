import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import modelImage from "../assets/signup.png";
import "../styles/Signup.css";
import "../styles/Login.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);
    setError("");
    setStatus("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      localStorage.setItem("vogue-ai-user", JSON.stringify(response.data.user));
      setPassword("");
      setStatus("Welcome back. Taking you to your dashboard...");
      window.setTimeout(() => {
        window.location.href = response.data.user.onboardingComplete ? "/dashboard" : "/onboarding";
      }, 1200);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to log in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="signup-page login-page">
        
      <section className="signup-story-panel login-story-panel">
          <a href="/" className="signup-back login-back" aria-label="Back to home" title="Back to home">
            <ArrowLeft size={24} strokeWidth={1.8} aria-hidden="true" />
          </a>
        <div className="signup-story-copy">
          <p>Style is a language. Let&apos;s make yours unmistakable.</p>
        </div>
        <img src={modelImage} alt="Model styled for Vogue AI" />
        <div className="signup-story-note">Find your colors.<br />Build your point of view.</div>
        <div className="signup-story-footer">
          <span>VOGUE AI</span>
          <span>STYLE / 2026</span>
        </div>
      </section>

      <section className="signup-form-panel login-form-panel">
        <div className="signup-topbar">
        
        </div>

        <div className="signup-form-wrap">
          <h1>Log in</h1>
          <p className="signup-intro">Step back into a wardrobe that feels entirely yours.</p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <span className="signup-password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(""); }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} strokeWidth={1.7} aria-hidden="true" /> : <Eye size={17} strokeWidth={1.7} aria-hidden="true" />}
                </button>
              </span>
            </label>
            {error && <p className="signup-error signup-form-error" role="alert">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          {status && <p className="signup-toast" role="status">{status}</p>}

          <p className="signup-login"><a href="/signup">Create an account</a></p>
        </div>
      </section>
    </main>
  );
}