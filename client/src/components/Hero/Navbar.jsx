import { useState } from "react";
import "../../styles/hero/Navbar.css";

function Logo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="white"
        d="M256 64V128H192.5L160 95L128 64L96 95L63.5 128H64L128 192V256H64.5L32 223L0 192V64L64 0H192V64H256ZM256 192V256H192.5L160 223L128 192V128H192L256 192Z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navItems = [
  "Style AI",
  "Style Analysis",
  "Collections",
  "How It Works",
  "Live Demo",
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="cyber-nav">
        {/* Desktop */}
        <div className="desktop-nav">
          <Logo />

          {navItems.map((item, index) => (
            <button
              key={item}
              className={`nav-link ${index === 0 ? "active" : ""}`}
              onClick={closeMenu}
            >
              {item}
            </button>
          ))}

          <a className="connect-button" href="/signup">
            Get Styled
          </a>
        </div>

        {/* Mobile */}
        <div className="mobile-nav">
          <div className="mobile-logo">
            <Logo />
          </div>

          <button
            className="mobile-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {navItems.map((item) => (
          <button key={item} onClick={closeMenu}>
            {item}
          </button>
        ))}

        <a
          className="mobile-connect"
          href="/signup"
          onClick={closeMenu}
        >
          Get Styled
        </a>
      </div>
    </>
  );
}