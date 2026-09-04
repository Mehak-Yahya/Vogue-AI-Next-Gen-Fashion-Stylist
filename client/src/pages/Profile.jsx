import { ArrowLeft, LogOut } from "lucide-react";
import "../styles/Profile.css";

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
  const user = JSON.parse(localStorage.getItem("vogue-ai-user") || "{}");
  const profile = user.profile || {};

  const logout = () => {
    localStorage.removeItem("vogue-ai-user");
    window.location.href = "/login";
  };

  const valuesFor = (key) => {
    const value = profile[key];
    return Array.isArray(value) ? value.join(" / ") : value || "Not specified";
  };

  return (
    <main className="profile-page">
      <header className="profile-header">
        <a href="/dashboard" className="profile-back"><ArrowLeft size={16} /> Back to dashboard</a>
        <button className="profile-logout" type="button" onClick={logout}><LogOut size={15} /> Log out</button>
      </header>
      <section className="profile-intro">
        <p className="profile-kicker">VOGUE AI / YOUR STYLE PROFILE</p>
        <h1>{user.name}&apos;s point of view.</h1>
        <p>These preferences help Vogue AI make recommendations that feel personal, practical, and like you.</p>
      </section>
      <section className="profile-grid">
        {Object.entries(profileLabels).map(([key, label]) => (
          <article className="profile-card" key={key}>
            <span>{label}</span>
            <strong>{valuesFor(key)}</strong>
          </article>
        ))}
        <article className="profile-card">
          <span>Personal color analysis</span>
          <strong>{profile.colorAnalysis?.season || "Pending AI analysis"}</strong>
          <small>{profile.colorAnalysis?.undertone ? `Undertone: ${profile.colorAnalysis.undertone}` : "Upload a photo from Skin Analysis to discover your palette."}</small>
        </article>
      </section>
      <a className="profile-edit" href="/onboarding">Update style profile</a>
    </main>
  );
}