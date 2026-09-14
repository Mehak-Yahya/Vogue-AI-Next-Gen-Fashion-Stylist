import { useState } from "react";
import { ArrowLeft, Check, Edit3, Eye, EyeOff, LogOut, X } from "lucide-react";
import axios from "axios";
import "../styles/Profile.css";
import { authHeaders } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
import brightSpringPalette from "../assets/colorpalletes/bright spring.PNG";
import brightWinterPalette from "../assets/colorpalletes/bright winter.PNG";
import coolSummerPalette from "../assets/colorpalletes/cool summer.PNG";
import coolWinterPalette from "../assets/colorpalletes/cool winter.PNG";
import darkAutumnPalette from "../assets/colorpalletes/dark autumn.PNG";
import darkWinterPalette from "../assets/colorpalletes/dark winter.PNG";
import lightSpringPalette from "../assets/colorpalletes/light spring.PNG";
import lightSummerPalette from "../assets/colorpalletes/light summer.PNG";
import mutedAutumnPalette from "../assets/colorpalletes/muted autumn.PNG";
import mutedSummerPalette from "../assets/colorpalletes/muted summer.PNG";
import warmAutumnPalette from "../assets/colorpalletes/warm autumn.PNG";
import warmSpringPalette from "../assets/colorpalletes/warm spring.PNG";

const paletteAssets = {
  "bright spring": brightSpringPalette,
  "bright winter": brightWinterPalette,
  "cool summer": coolSummerPalette,
  "cool winter": coolWinterPalette,
  "dark autumn": darkAutumnPalette,
  "dark winter": darkWinterPalette,
  "light spring": lightSpringPalette,
  "light summer": lightSummerPalette,
  "muted autumn": mutedAutumnPalette,
  "muted summer": mutedSummerPalette,
  "warm autumn": warmAutumnPalette,
  "warm spring": warmSpringPalette,
};

const profileLabels = {
  stylePreferences: "Style directions",
  occasions: "Occasions",
  wardrobePreferences: "Wardrobe",
  fitPreference: "Preferred fit",
  budget: "Budget",
  culturalPreference: "Cultural fashion",
  styleGoals: "Style goals",
};

export default function Profile() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("vogue-ai-user") || "{}"));
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, next: false, confirm: false });
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const profile = user.profile || {};
  const season = profile.colorAnalysis?.season || "";
  const palette = paletteAssets[season.toLowerCase()];

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Clear the local profile even when the backend is unavailable.
    }
    localStorage.removeItem("vogue-ai-user");
    window.location.href = "/login";
  };

  const valuesFor = (key) => {
    const value = profile[key];
    return Array.isArray(value) ? value.join(" / ") : value || "Not specified";
  };

  const saveName = async (event) => {
    event.preventDefault();
    const nextName = name.trim();
    if (nextName.length < 2 || nextName.length > 100) {
      setNameError("Name must be between 2 and 100 characters.");
      return;
    }
    setSavingName(true);
    setNameError("");
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, { name: nextName, profile }, { headers: authHeaders(), withCredentials: true });
      setUser(response.data.user);
      localStorage.setItem("vogue-ai-user", JSON.stringify(response.data.user));
      setEditingName(false);
    } catch (error) {
      setNameError(error.response?.data?.error || "Unable to update your name.");
    } finally {
      setSavingName(false);
    }
  };

  const updatePassword = (event) => {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));
    setPasswordError("");
    setPasswordMessage("");
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((current) => ({ ...current, [field]: !current[field] }));
  };

  const closePasswordForm = () => {
    setPasswordFormOpen(false);
    setPasswords({ current: "", next: "", confirm: "" });
    setPasswordError("");
    setPasswordMessage("");
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/password`, {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      }, { headers: authHeaders(), withCredentials: true });
      setPasswordMessage(response.data.message);
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (error) {
      setPasswordError(error.response?.data?.error || "Unable to update your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="profile-page">
      <header className="profile-header">
        <a href="/dashboard" className="profile-brand">VOGUE <span>AI</span></a>
        <a href="/dashboard" className="profile-back"><ArrowLeft size={15} /> Dashboard</a>
        <button className="profile-logout" type="button" onClick={logout}><LogOut size={15} /> Log out</button>
      </header>
      <section className="profile-intro">
        <p className="profile-kicker">YOUR STYLE PROFILE</p>
        {editingName ? (
          <form className="profile-name-form" onSubmit={saveName}>
            <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Display name" autoFocus />
            <button type="submit" disabled={savingName} aria-label="Save name" title="Save name"><Check size={16} /></button>
            <button type="button" onClick={() => { setName(user.name || ""); setEditingName(false); setNameError(""); }} aria-label="Cancel name edit" title="Cancel"><X size={16} /></button>
          </form>
        ) : (
          <div className="profile-name-line"><h1>{user.name || "Your profile"}</h1><button type="button" onClick={() => setEditingName(true)} aria-label="Edit name" title="Edit name"><Edit3 size={16} /></button></div>
        )}
        {nameError && <p className="profile-name-error" role="alert">{nameError}</p>}
        <p>{user.email || "Your personal style, in one place."}</p>
      </section>
      <section className="profile-content">
        <article className="profile-color-panel">
          <div className="profile-section-label">PERSONAL COLOR</div>
          <strong>{season || "Not analyzed yet"}</strong>
          <small>{profile.colorAnalysis?.undertone ? `Undertone: ${profile.colorAnalysis.undertone}` : "Complete a skin analysis to discover your palette."}</small>
          {palette && <img className="profile-palette-image" src={palette} alt={`${season} color palette`} />}
          {!palette && <a className="profile-inline-link" href="/skintone">Run color analysis <ArrowLeft size={13} /></a>}
        </article>
        <section className="profile-preferences">
          <div className="profile-section-label">STYLE PREFERENCES</div>
          {Object.entries(profileLabels).map(([key, label]) => (
            <div className="profile-row" key={key}>
              <span>{label}</span>
              <strong>{valuesFor(key)}</strong>
            </div>
          ))}
        </section>
      </section>
      <div className="profile-actions">
        <a className="profile-edit" href="/onboarding">Update style profile</a>
      </div>
      <section className="profile-security">
        <div>
          <div className="profile-section-label">ACCOUNT SECURITY</div>
          <h2>Keep your account secure</h2>
          <p>Choose a new password you do not use elsewhere. It should have at least 8 characters, including uppercase, lowercase, and a number.</p>
        </div>
        {passwordFormOpen ? (
          <form className="profile-password-form" onSubmit={savePassword}>
            <div className="profile-password-form-heading">
              <strong>Change password</strong>
              <span>All fields are required</span>
            </div>
            <label className="profile-password-field">
              Current password
              <span className="profile-password-input">
                <input name="current" type={passwordVisibility.current ? "text" : "password"} value={passwords.current} onChange={updatePassword} autoComplete="current-password" required />
                <button type="button" onClick={() => togglePasswordVisibility("current")} aria-label={passwordVisibility.current ? "Hide current password" : "Show current password"} title={passwordVisibility.current ? "Hide password" : "Show password"}>
                  {passwordVisibility.current ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </span>
            </label>
            <label className="profile-password-field">
              New password
              <span className="profile-password-input">
                <input name="next" type={passwordVisibility.next ? "text" : "password"} value={passwords.next} onChange={updatePassword} autoComplete="new-password" required />
                <button type="button" onClick={() => togglePasswordVisibility("next")} aria-label={passwordVisibility.next ? "Hide new password" : "Show new password"} title={passwordVisibility.next ? "Hide password" : "Show password"}>
                  {passwordVisibility.next ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </span>
            </label>
            <label className="profile-password-field">
              Confirm new password
              <span className="profile-password-input">
                <input name="confirm" type={passwordVisibility.confirm ? "text" : "password"} value={passwords.confirm} onChange={updatePassword} autoComplete="new-password" required />
                <button type="button" onClick={() => togglePasswordVisibility("confirm")} aria-label={passwordVisibility.confirm ? "Hide confirmed password" : "Show confirmed password"} title={passwordVisibility.confirm ? "Hide password" : "Show password"}>
                  {passwordVisibility.confirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </span>
            </label>
            <div className="profile-password-actions">
              <button className="profile-password-submit" type="submit" disabled={savingPassword}>{savingPassword ? "Saving..." : "Update password"}</button>
              <button className="profile-password-cancel" type="button" onClick={closePasswordForm}>Cancel</button>
            </div>
            {passwordError && <span className="profile-security-error" role="alert">{passwordError}</span>}
            {passwordMessage && <span className="profile-security-message" role="status">{passwordMessage}</span>}
          </form>
        ) : (
          <div className="profile-password-collapsed">
            <p>Ready to refresh your login details?</p>
            <button type="button" onClick={() => setPasswordFormOpen(true)}>Change password</button>
          </div>
        )}
      </section>
    </main>
  );
}