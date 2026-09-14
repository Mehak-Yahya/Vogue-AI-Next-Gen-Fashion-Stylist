import { X } from "lucide-react";
import { useState } from "react";
import "../styles/CookieConsent.css";

const COOKIE_CONSENT_KEY = "vogue-ai-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(COOKIE_CONSENT_KEY));

  const closeBanner = (choice) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-consent" aria-label="Cookie consent">
      <div className="cookie-consent-copy">
        <p className="cookie-consent-label">A little note</p>
        <p>We use essential cookies to keep Vogue AI secure and remember your preferences. <a href="/privacy-policy">Read our privacy policy.</a></p>
      </div>
      <div className="cookie-consent-actions">
        <button className="cookie-consent-accept" type="button" onClick={() => closeBanner("accepted")}>Accept</button>
        <button className="cookie-consent-close" type="button" onClick={() => closeBanner("dismissed")} aria-label="Dismiss cookie notice" title="Dismiss">
          <X size={17} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}