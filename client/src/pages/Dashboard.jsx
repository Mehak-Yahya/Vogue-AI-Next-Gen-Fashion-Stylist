import { ArrowRight, ScanFace, Shirt } from "lucide-react";
import AppNavbar from "../components/AppNavbar";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("vogue-ai-user") || "{} ");
  const firstName = user.name?.trim().split(" ")[0] || "there";

  return (
    <main className="dashboard-page">
      <AppNavbar activeItem="dashboard" />

      <section className="dashboard-intro">
        <p className="dashboard-kicker">YOUR PERSONAL STYLE, REIMAGINED</p>
        <h1>Welcome back, {firstName}.</h1>
        <p>Choose where you want to begin shaping your personal style.</p>
      </section>

      <section className="dashboard-options" aria-label="Style tools">
        <a className="dashboard-option dashboard-option-analysis" href="/skintone">
          <div className="dashboard-option-icon"><ScanFace size={28} strokeWidth={1.4} /></div>
          <div>
            <p className="dashboard-option-label">01 / DISCOVER</p>
            <h2>Personal colors</h2>
            <p>Upload a clear photo and let AI discover your skin, eye, and hair colors.</p>
          </div>
          <ArrowRight className="dashboard-option-arrow" size={22} aria-hidden="true" />
        </a>
        <a className="dashboard-option dashboard-option-wardrobe" href="/wardrobe">
          <div className="dashboard-option-icon"><Shirt size={28} strokeWidth={1.4} /></div>
          <div>
            <p className="dashboard-option-label">02 / CURATE</p>
            <h2>Virtual wardrobe</h2>
            <p>Organize what you own and create outfits that feel like you.</p>
          </div>
          <ArrowRight className="dashboard-option-arrow" size={22} aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}