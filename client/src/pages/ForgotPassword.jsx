import { useRef, useState } from "react";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import modelImage from "../assets/signup.png";
import "../styles/Signup.css";
import "../styles/Login.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const otpInputs = useRef([]);
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState("request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const otp = otpDigits.join("");

  const updateOtp = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    const nextDigits = [...otpDigits];
    if (digits.length > 1) {
      digits.split("").forEach((digit, offset) => {
        if (index + offset < 6) nextDigits[index + offset] = digit;
      });
      setOtpDigits(nextDigits);
      otpInputs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    nextDigits[index] = digits;
    setOtpDigits(nextDigits);
    if (digits && index < 5) otpInputs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (step === "request") {
        const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
        setMessage(response.data.message);
        setStep("reset");
      } else if (step === "reset") {
        const response = await axios.post(`${API_BASE_URL}/api/auth/verify-reset-otp`, { email, otp });
        setMessage(response.data.message);
        setStep("password");
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { email, otp, newPassword });
        setMessage(response.data.message);
        window.setTimeout(() => { window.location.href = "/login"; }, 1200);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to complete password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="signup-page login-page">
      <section className="signup-story-panel login-story-panel">
        <a href="/login" className="signup-back login-back" aria-label="Back to login" title="Back to login">
          <ArrowLeft size={24} strokeWidth={1.8} aria-hidden="true" />
        </a>
        <div className="signup-story-copy"><p>Every good style story has a way back in.</p></div>
        <img src={modelImage} alt="Model styled for Vogue AI" />
        <div className="signup-story-note">Reset your access.<br />Return to your closet.</div>
        <div className="signup-story-footer"><span>VOGUE AI</span><span>STYLE / 2026</span></div>
      </section>
      <section className="signup-form-panel login-form-panel">
        <div className="signup-form-wrap">
          <p className="signup-eyebrow">Account access</p>
          <h1>Reset password</h1>
          <p className="signup-intro">We will send a one-time code to your email address.</p>
          <form className="signup-form" onSubmit={submit}>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={step !== "request"} autoComplete="email" />
            </label>
            {step !== "request" && (
              <label>
                Verification code
                <span className="otp-inputs" role="group" aria-label="Six-digit verification code">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => { otpInputs.current[index] = element; }}
                      className="otp-input"
                      inputMode="numeric"
                      maxLength="6"
                      value={digit}
                      onChange={(event) => updateOtp(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      required
                      disabled={step === "password"}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      aria-label={`Verification digit ${index + 1}`}
                    />
                  ))}
                </span>
              </label>
            )}
            {step === "password" && (
              <label>
                New password
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength="8" autoComplete="new-password" />
              </label>
            )}
            {error && <p className="signup-error signup-form-error" role="alert">{error}</p>}
            {message && <p className="signup-toast" role="status">{message}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : step === "request" ? "Send code" : step === "reset" ? "Verify code" : "Reset password"}
            </button>
          </form>
          <p className="signup-login"><a href="/login">Return to login</a></p>
        </div>
      </section>
    </main>
  );
}
