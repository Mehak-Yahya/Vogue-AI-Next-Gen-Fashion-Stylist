import { ArrowLeft, ArrowUpRight } from "lucide-react";
import "../styles/NotFound.css";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <header className="not-found-header">
        <a className="not-found-brand" href="/" aria-label="Vogue AI home">
          VOGUE <span>AI</span>
        </a>
        <span className="not-found-season">STYLE / 2026</span>
      </header>

      <section className="not-found-content" aria-labelledby="not-found-title">
        <p className="not-found-number">404</p>
        <div className="not-found-copy">
          <p className="not-found-kicker">A look that got away</p>
          <h1 id="not-found-title">This page is<br /><em>out of style.</em></h1>
          <p className="not-found-description">
            The page you&apos;re looking for has left the runway. Let&apos;s take you back to your style story.
          </p>
          <a className="not-found-home" href="/">
            <ArrowLeft size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>Return home</span>
            <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
          </a>
        </div>
      </section>

      <div className="not-found-mark" aria-hidden="true">V</div>
      <p className="not-found-footer">VOGUE AI / YOUR PERSONAL STYLE EDIT</p>
    </main>
  );
}