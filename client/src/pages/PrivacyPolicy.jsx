import { ArrowLeft } from "lucide-react";
import "../styles/PrivacyPolicy.css";

const sections = [
  {
    title: "What we collect",
    body: "When you create an account, we collect details such as your name, email address, and password. You may also choose to provide style preferences, sizing information, color preferences, and other profile details.",
  },
  {
    title: "Your wardrobe and images",
    body: "Images and wardrobe information you upload are used to provide features such as wardrobe organization, color analysis, and outfit recommendations. Please only upload images you have permission to share.",
  },
  {
    title: "How we use information",
    body: "We use your information to operate and improve Vogue AI, personalize recommendations, secure your account, respond to support requests, and communicate important service updates. We do not use your private wardrobe data to sell advertising profiles.",
  },
  {
    title: "AI-assisted features",
    body: "Some features use automated systems to analyze information you provide and generate styling suggestions. These suggestions are creative guidance, not professional, medical, or guaranteed advice. You can choose not to use image-based features.",
  },
  {
    title: "Storage and sharing",
    body: "We retain account information while your account is active or as needed to provide the service. We may use trusted service providers to host data, process requests, or keep the service secure. We do not sell your personal information.",
  },
  {
    title: "Your choices",
    body: "You may review or update your profile information through the app. You can also request access to, correction of, or deletion of your personal information by contacting us. Some information may need to be retained where required by law or for legitimate security purposes.",
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="privacy-page">
      <header className="privacy-header">
        <a className="privacy-brand" href="/" aria-label="Vogue AI home">VOGUE <span>AI</span></a>
        <a className="privacy-back" href="/">
          <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          Back home
        </a>
      </header>

      <section className="privacy-intro" aria-labelledby="privacy-title">
        <h1 id="privacy-title">Privacy, with <em>intention.</em></h1>
        <p className="privacy-lede">Your style is personal. We treat the information that shapes it with the same care.</p>
        <p className="privacy-updated">Last updated: September 9, 2026</p>
      </section>

      <div className="privacy-rule" />

      <section className="privacy-body" aria-label="Privacy policy details">
        {sections.map((section, index) => (
          <article className="privacy-section" key={section.title}>
            <span className="privacy-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          </article>
        ))}
        <article className="privacy-section">
          <span className="privacy-index">07</span>
          <div>
            <h2>Contact us</h2>
            <p>Questions about this policy or your information? Contact the Vogue AI team at <a href="mailto:privacy@vogueai.com">privacy@vogueai.com</a>.</p>
          </div>
        </article>
      </section>

      <footer className="privacy-footer">VOGUE AI / YOUR PERSONAL STYLE EDIT</footer>
    </main>
  );
}