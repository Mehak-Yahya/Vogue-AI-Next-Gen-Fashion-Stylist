import { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import "../styles/Outfits.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Outfits() {
  const [outfits, setOutfits] = useState([]);
  const [message, setMessage] = useState("");
  const [recommendationMode, setRecommendationMode] = useState("balanced");

  useEffect(() => {
    fetch(`${API}/api/wardrobe/outfits/generate`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load outfits.");
        setOutfits(result.outfits || []);
        if (result.message) setMessage(result.message);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const imagePath = (item) =>
    item.filepath?.startsWith("http") ? item.filepath : `${API}${item.filepath}`;
  const visibleOutfits = useMemo(() => {
    if (recommendationMode === "balanced") return outfits;

    return [...outfits].sort((first, second) => {
      const firstWear = first.items.reduce((total, item) => total + (item.times_worn || 0), 0);
      const secondWear = second.items.reduce((total, item) => total + (item.times_worn || 0), 0);
      return recommendationMode === "less-worn" ? firstWear - secondWear : secondWear - firstWear;
    });
  }, [outfits, recommendationMode]);

  return (
    <main className="outfits-page">
      <AppNavbar activeItem="outfits" />
      <div className="outfits-layout">
        <header className="outfits-header">
          <div>
            <span className="outfits-kicker">VOGUE AI / WARDROBE</span>
            <h1>Today&apos;s combinations</h1>
            <p>Outfits generated from the pieces you already own.</p>
          </div>
          <a className="outfits-back" href="/wardrobe">BACK TO WARDROBE</a>
        </header>
        <div className="outfits-controls">
          <label htmlFor="recommendation-mode">Recommendation priority</label>
          <select id="recommendation-mode" value={recommendationMode} onChange={(event) => setRecommendationMode(event.target.value)}>
            <option value="balanced">Balanced recommendations</option>
            <option value="less-worn">Prioritize less-worn pieces</option>
            <option value="more-worn">Show most-worn pieces first</option>
          </select>
        </div>
        {message && <p className="outfits-message">{message}</p>}
        {visibleOutfits.length > 0 ? (
          <section className="outfits-grid" aria-label="Generated outfit combinations">
            {visibleOutfits.map((outfit) => (
              <article className="outfit-card" key={outfit.id}>
                <div className="outfit-card-items" style={{ backgroundColor: String(outfit.items[0]?.color || "#edf0f3").toLowerCase() }}>
                  {outfit.items.map((item) => (
                    <div className="outfit-card-piece" key={item.id}>
                      <img src={imagePath(item)} alt={`${item.color} ${item.category}`} />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : !message ? (
          <p className="outfits-empty">Loading combinations...</p>
        ) : null}
      </div>
    </main>
  );
}
