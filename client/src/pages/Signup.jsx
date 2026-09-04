import { useState } from "react";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import modelImage from "../assets/signup.png";
import "../styles/Signup.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", terms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
    setStatus("");
  };

  const validate = () => {
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(form.password)) nextErrors.password = "Use 8+ characters with uppercase, lowercase, and a number.";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (!form.terms) nextErrors.terms = "Accept the terms to continue.";
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setStatus("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password,
      });
      setStatus(response.data.message || "Your account is ready.");
      setForm({ name: "", email: "", password: "", confirmPassword: "", terms: false });
      window.setTimeout(() => {
        window.location.href = "/login";
      }, 1600);
    } catch (error) {
      setErrors({ form: error.response?.data?.error || "Unable to create your account right now." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="signup-page">
      <section className="signup-form-panel">
        <div className="signup-topbar">
          <a href="/" className="signup-back" aria-label="Back to home" title="Back to home">
            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>

        <div className="signup-form-wrap">
          <h1>Sign up</h1>
          
          <p className="signup-intro">
            Create your account and discover a wardrobe that feels entirely yours.
          </p>

          <form className="signup-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input name="name" type="text" placeholder="Your name" value={form.name} onChange={updateField} autoComplete="name" />
              {errors.name && <span className="signup-error">{errors.name}</span>}
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={updateField} autoComplete="email" />
              {errors.email && <span className="signup-error">{errors.email}</span>}
            </label>
            <label>
              Password
              <span className="signup-password-field">
                <input name="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" value={form.password} onChange={updateField} autoComplete="new-password" />
                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} strokeWidth={1.7} aria-hidden="true" /> : <Eye size={17} strokeWidth={1.7} aria-hidden="true" />}
                </button>
              </span>
              {errors.password && <span className="signup-error">{errors.password}</span>}
            </label>
            <label>
              Confirm password
              <span className="signup-password-field">
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repeat your password" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" />
                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                  title={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff size={17} strokeWidth={1.7} aria-hidden="true" /> : <Eye size={17} strokeWidth={1.7} aria-hidden="true" />}
                </button>
              </span>
              {errors.confirmPassword && <span className="signup-error">{errors.confirmPassword}</span>}
            </label>
            <label className="signup-check">
              <input name="terms" type="checkbox" checked={form.terms} onChange={updateField} />
              <span>I agree to the terms and privacy policy.</span>
              {errors.terms && <span className="signup-error">{errors.terms}</span>}
            </label>
            {errors.form && <p className="signup-error signup-form-error" role="alert">{errors.form}</p>}
            <button type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</button>
          </form>

          {status && <p className="signup-toast" role="status">{status} Redirecting to login...</p>}

          <p className="signup-login">Already have an account? <a href="/login">Log in</a></p>
        </div>
      </section>

      <section className="signup-story-panel">
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
    </main>
  );
}