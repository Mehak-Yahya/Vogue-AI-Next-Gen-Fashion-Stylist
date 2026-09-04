import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import "../styles/AppNavbar.css";

const navItems = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "wardrobe", label: "Virtual Wardrobe", href: "/wardrobe" },
  { id: "outfits", label: "Outfits", href: "/outfits" },
  { id: "colors", label: "Color Analysis", href: "/skintone" },
  { id: "trends", label: "Trend Scouting", href: "/dashboard" },
  { id: "lookbooks", label: "Saved Lookbooks", href: "/dashboard" },
];

export default function AppNavbar({ activeItem = "" }) {
  const user = JSON.parse(localStorage.getItem("vogue-ai-user") || "{}");
  const firstName = user.name?.trim().split(" ")[0] || "there";
  const initials = user.name?.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "V";
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("vogue-ai-user");
    window.location.href = "/login";
  };

  return (
    <header className="app-navbar">
      <a className="app-navbar-brand" href="/">VOGUE <span>AI</span></a>
      <nav className="app-navbar-links" aria-label="Main navigation">
        {navItems.map((item) => (
          <a className={activeItem === item.id ? "is-active" : ""} href={item.href} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="app-navbar-profile">
        <button className="app-navbar-profile-trigger" type="button" onClick={() => setIsProfileOpen((open) => !open)} aria-expanded={isProfileOpen} aria-haspopup="menu">
          <span className="app-navbar-avatar" aria-hidden="true">{initials}</span>
          <span>{firstName}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {isProfileOpen && (
          <div className="app-navbar-menu" role="menu">
            <a href="/profile" role="menuitem">Profile</a>
            <a href="/dashboard" role="menuitem">Subscription</a>
            <a href="/onboarding" role="menuitem">Styling Preferences</a>
            <button type="button" onClick={logout} role="menuitem">
              <LogOut size={15} aria-hidden="true" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
