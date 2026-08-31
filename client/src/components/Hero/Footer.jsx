import React from "react";
import "../../styles/hero/Footer.css";

const Footer = () => {
return ( <footer className="vogue-footer"> <div className="footer-top"> <div className="footer-brand"> <span className="footer-eyebrow">VOGUE AI</span> <h2>
Your style, <em> intelligently.</em> </h2> <p>
Personalized fashion guidance designed around you,
your wardrobe, and your world. </p> </div>

```
    <div className="footer-links">
      <div className="footer-column">
        <span className="footer-label">EXPLORE</span>
        <a href="#about">About Vogue AI</a>
        <a href="#skin-analysis">Skin Analysis</a>
        <a href="#stylist">AI Stylist</a>
        <a href="#wardrobe">Virtual Wardrobe</a>
      </div>

      <div className="footer-column">
        <span className="footer-label">VOGUE AI</span>
        <a href="#fitme">FitMe</a>
        <a href="#recommendations">Recommendations</a>
        <a href="#palette">Colour Palette</a>
        <a href="#chat">Ask Your Stylist</a>
      </div>
    </div>
  </div>

  <div className="footer-divider" />

  <div className="footer-bottom">
    <span>© 2026 VOGUE AI</span>

    <span className="footer-center">
      AI × PERSONAL STYLE × PAKISTANI FASHION
    </span>

    <span>MADE FOR YOUR STYLE</span>
  </div>
</footer>


);
};

export default Footer;
