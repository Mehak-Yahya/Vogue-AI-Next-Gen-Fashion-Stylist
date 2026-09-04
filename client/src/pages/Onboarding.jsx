import { useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import "../styles/Onboarding.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const styleOptions = ["Elegant", "Minimal", "Feminine", "Bold", "Casual", "Classic", "Trendy", "Modest", "Streetwear", "Artistic"];
const occasionOptions = ["Everyday / Casual", "Work / University", "Parties", "Weddings", "Formal Events", "Cultural / Traditional", "Travel", "Dates", "Active / Sports"];
const wardrobeOptions = ["Tops & Jeans", "Dresses", "Skirts", "Trousers", "Blazers", "Shalwar Kameez", "Kurta", "Saree", "Lehenga", "Abaya"];
const colorOptions = ["Black", "White", "Beige", "Brown", "Red", "Pink", "Orange", "Yellow", "Green", "Blue", "Purple", "Grey"];
const goalOptions = ["Find my personal colors", "Build better outfits", "Shop smarter", "Plan travel outfits", "Dress professionally", "Style wedding looks", "Discover my style", "Use my wardrobe better", "Get daily outfit ideas"];

const initialProfile = {
  stylePreferences: [],
  occasions: [],
  wardrobePreferences: [],
  modesty: { coverage: "", sleeves: false, fullLength: false, highNecklines: false, looseFit: false },
  colorPreferences: { likes: [], avoids: [] },
  colorAnalysis: { skinTone: null, undertone: null, eyeColor: null, hairColor: null, season: null },
  fitPreference: "",
  silhouetteGoals: [],
  budget: "",
  shoppingChannels: [],
  culturalPreference: "",
  traditionalOutfits: [],
  styleGoals: [],
};

function ChoiceGrid({ options, selected, onToggle, limit }) {
  return (
    <div className="onboarding-choice-grid">
      {options.map((option) => {
        const active = selected.includes(option);
        const disabled = Boolean(limit && !active && selected.length >= limit);
        return (
          <button
            className={`onboarding-choice ${active ? "is-selected" : ""}`}
            type="button"
            key={option}
            disabled={disabled}
            onClick={() => onToggle(option)}
          >
            <span>{option}</span>
            {active && <Check size={16} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(() => ({
    ...initialProfile,
    ...(JSON.parse(localStorage.getItem("vogue-ai-user") || "{}").profile || {}),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("vogue-ai-user") || "{}");
  const totalSteps = 10;

  const updateProfile = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const updateNested = (section, key, value) => {
    setProfile((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
    setError("");
  };

  const toggleArray = (key, value, limit) => {
    const values = profile[key];
    if (values.includes(value)) updateProfile(key, values.filter((item) => item !== value));
    else if (!limit || values.length < limit) updateProfile(key, [...values, value]);
  };

  const toggleNestedArray = (section, key, value) => {
    const values = profile[section][key];
    updateNested(section, key, values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, { userId: user.id, profile });
      localStorage.setItem("vogue-ai-user", JSON.stringify(response.data.user));
      window.location.href = "/dashboard";
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to save your style profile right now.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step === 1 && profile.stylePreferences.length === 0) return setError("Choose at least one style direction.");
    if (step === 2 && profile.occasions.length === 0) return setError("Choose at least one occasion.");
    if (step === 8 && profile.styleGoals.length === 0) return setError("Choose up to three style goals.");
    setError("");
    setStep((current) => Math.min(current + 1, totalSteps - 1));
  };

  const back = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const renderStep = () => {
    if (step === 0) return <><p className="onboarding-kicker">VOGUE AI / YOUR STYLE PROFILE</p><h1>Let&apos;s discover your personal style.</h1><p className="onboarding-lede">Vogue AI will learn what looks best on you and what fits your lifestyle.</p></>;
    if (step === 1) return <><p className="onboarding-kicker">01 / STYLE IDENTITY</p><h2>How would you describe your style?</h2><p className="onboarding-hint">Choose as many as feel like you.</p><ChoiceGrid options={styleOptions} selected={profile.stylePreferences} onToggle={(value) => toggleArray("stylePreferences", value)} /></>;
    if (step === 2) return <><p className="onboarding-kicker">02 / OCCASIONS</p><h2>Where do you need styling help most?</h2><ChoiceGrid options={occasionOptions} selected={profile.occasions} onToggle={(value) => toggleArray("occasions", value)} /></>;
    if (step === 3) return <><p className="onboarding-kicker">03 / YOUR WARDROBE</p><h2>What do you wear most?</h2><p className="onboarding-hint">This helps us recommend pieces you will actually use.</p><ChoiceGrid options={wardrobeOptions} selected={profile.wardrobePreferences} onToggle={(value) => toggleArray("wardrobePreferences", value)} /></>;
    if (step === 4) return <><p className="onboarding-kicker">04 / OPTIONAL PREFERENCES</p><h2>What level of coverage do you prefer?</h2><div className="onboarding-radio-grid">{["Minimal coverage", "Moderate coverage", "Full coverage", "I decide per outfit"].map((option) => <button className={`onboarding-radio ${profile.modesty.coverage === option ? "is-selected" : ""}`} type="button" key={option} onClick={() => updateNested("modesty", "coverage", option)}>{option}</button>)}</div><div className="onboarding-check-grid">{[["sleeves", "Sleeves preferred"], ["fullLength", "Full-length bottoms preferred"], ["highNecklines", "High necklines preferred"], ["looseFit", "Loose-fitting clothing preferred"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={profile.modesty[key]} onChange={(event) => updateNested("modesty", key, event.target.checked)} />{label}</label>)}</div></>;
    if (step === 5) return <><p className="onboarding-kicker">05 / COLOR PREFERENCES</p><h2>Which colors do you usually love wearing?</h2><ChoiceGrid options={colorOptions} selected={profile.colorPreferences.likes} onToggle={(value) => toggleNestedArray("colorPreferences", "likes", value)} /><h3>Are there colors you usually avoid?</h3><ChoiceGrid options={colorOptions} selected={profile.colorPreferences.avoids} onToggle={(value) => toggleNestedArray("colorPreferences", "avoids", value)} /></>;
    if (step === 6) return <><p className="onboarding-kicker">07 / FIT & SILHOUETTE</p><h2>What kind of fit do you usually prefer?</h2><div className="onboarding-radio-grid">{["Oversized", "Relaxed", "Regular", "Fitted", "Body-hugging", "Depends on the outfit"].map((option) => <button className={`onboarding-radio ${profile.fitPreference === option ? "is-selected" : ""}`} type="button" key={option} onClick={() => updateProfile("fitPreference", option)}>{option}</button>)}</div><h3>What would you like your outfits to do?</h3><ChoiceGrid options={["Define my waist", "Look taller", "Look more balanced", "Create a slimmer appearance", "Add structure", "Keep me comfortable", "Highlight my features", "Let AI decide"]} selected={profile.silhouetteGoals} onToggle={(value) => toggleArray("silhouetteGoals", value)} /></>;
    if (step === 7) return <><p className="onboarding-kicker">08 / SHOPPING & CULTURE</p><h2>How should Vogue AI fit your world?</h2><h3>Typical clothing budget</h3><div className="onboarding-radio-grid">{["Budget-friendly", "Affordable", "Mid-range", "Premium", "Luxury", "No preference"].map((option) => <button className={`onboarding-radio ${profile.budget === option ? "is-selected" : ""}`} type="button" key={option} onClick={() => updateProfile("budget", option)}>{option}</button>)}</div><h3>Cultural fashion preference</h3><div className="onboarding-radio-grid">{["Mostly Western", "Mostly Traditional", "A mix of both", "Traditional with modern styling", "Let AI decide"].map((option) => <button className={`onboarding-radio ${profile.culturalPreference === option ? "is-selected" : ""}`} type="button" key={option} onClick={() => updateProfile("culturalPreference", option)}>{option}</button>)}</div></>;
    if (step === 8) return <><p className="onboarding-kicker">09 / STYLE GOALS</p><h2>What do you want Vogue AI to help you with?</h2><p className="onboarding-hint">Select up to three.</p><ChoiceGrid options={goalOptions} selected={profile.styleGoals} limit={3} onToggle={(value) => toggleArray("styleGoals", value, 3)} /></>;
    return <><p className="onboarding-kicker">10 / YOUR VOGUE AI PROFILE</p><h1>Your style journey starts here.</h1><p className="onboarding-lede">Vogue AI is ready to learn your personal colors, style, wardrobe, occasions, and preferences.</p><div className="onboarding-summary"><span>{profile.stylePreferences.length} style directions</span><span>{profile.occasions.length} occasions</span><span>{profile.wardrobePreferences.length} wardrobe choices</span><span>Color analysis available next</span></div>{error && <p className="onboarding-error" role="alert">{error}</p>}</>;
  };

  return <main className="onboarding-page"><div className="onboarding-shell"><header className="onboarding-header"><a href="/dashboard" className="onboarding-brand">VOGUE <span>AI</span></a><span>{String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}</span></header><div className="onboarding-progress"><span style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div><section className="onboarding-content">{renderStep()}</section><footer className="onboarding-footer">{step > 0 ? <button className="onboarding-back" type="button" onClick={back}><ArrowLeft size={17} /> Back</button> : <span />}{step === totalSteps - 1 ? <button className="onboarding-primary-action" type="button" onClick={saveProfile} disabled={saving}>{saving ? "Saving profile..." : "Discover My Style"}<ArrowRight size={18} /></button> : <button className="onboarding-primary-action" type="button" onClick={next}>Continue <ArrowRight size={18} /></button>}</footer>{error && step !== totalSteps - 1 && <p className="onboarding-error" role="alert">{error}</p>}</div></main>;
}
