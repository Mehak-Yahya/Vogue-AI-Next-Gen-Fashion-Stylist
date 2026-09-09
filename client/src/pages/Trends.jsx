import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import AppNavbar from "../components/AppNavbar";
import "../styles/Trends.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const currentUser = JSON.parse(localStorage.getItem("vogue-ai-user") || "null");
const savedSeason = currentUser?.profile?.colorAnalysis?.season;

export default function Trends() {
  const [season] = useState(savedSeason || "");
  const [colors, setColors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");

  const loadCatalog = async (selectedSeason = season) => {
    setLoading(true);
    setError("");
    try {
      if (!selectedSeason) {
        setProducts([]);
        setColors([]);
        setLoading(false);
        return;
      }
      const seasonQuery = `?season=${encodeURIComponent(selectedSeason)}`;
      const [productsResponse, colorsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/recommendations/products${seasonQuery}`),
        fetch(`${API_BASE_URL}/api/recommendations/colors${seasonQuery}`),
      ]);
      if (!productsResponse.ok) throw new Error("Unable to load scraped products.");
      const productData = await productsResponse.json();
      setProducts(productData.products || []);
      if (colorsResponse) {
        const colorData = await colorsResponse.json();
        setColors(Object.values(colorData.palettes || {}).flat());
      } else {
        setColors([]);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const refreshCatalog = async () => {
    setScraping(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/scrape`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Scraping failed.");
      await loadCatalog();
    } catch (scrapeError) {
      setError(scrapeError.message);
    } finally {
      setScraping(false);
    }
  };

  return (
    <main className="trends-page">
      <AppNavbar activeItem="trends" />
      <section className="trends-intro">
        <div>
          <p className="trends-kicker"><Sparkles size={14} /> LIVE STYLE INTELLIGENCE</p>
          <h1>Trend scouting, tuned to you.</h1>
          <p>Browse current pieces selected for your personal seasonal palette.</p>
        </div>
        <button className="trends-refresh" type="button" onClick={refreshCatalog} disabled={scraping}>
          <RefreshCw size={16} className={scraping ? "is-spinning" : ""} />
          {scraping ? "Scraping brands..." : "Refresh catalog"}
        </button>
      </section>

      <section className="trends-controls" aria-label="Trend filters">
        <div className="trends-season-lock">
          <span>Your detected season</span>
          <strong>{season || "Not analyzed yet"}</strong>
        </div>
        <div className="trends-summary"><strong>{products.length}</strong> pieces found</div>
      </section>

      {colors.length > 0 && <div className="trends-palette" aria-label={`${season} palette`}>
        {colors.slice(0, 18).map((color) => <span key={color}>{color}</span>)}
      </div>}

      {error && <p className="trends-error" role="alert">{error}</p>}
      {loading ? <p className="trends-status">Reading the latest catalog...</p> : null}
      {!loading && !products.length && <div className="trends-empty"><h2>{season ? "No matching pieces yet." : "Discover your season first."}</h2><p>{season ? "Refresh the catalog to collect pieces that match your palette." : "Complete Skin Analysis to personalize Trend Scouting to you."}</p></div>}
      <section className="trends-grid" aria-live="polite">
        {products.map((product) => (
          <article className="trend-card" key={product.id}>
            <div className="trend-card-image">{product.image ? <img src={product.image} alt={product.title || product.brand} loading="lazy" /> : <Sparkles size={24} />}</div>
            <div className="trend-card-content">
              <span>{product.brand}</span>
              <h2>{product.title || "Untitled piece"}</h2>
              <p>{product.color || "Color pending"} {product.price ? `· PKR ${product.price.toLocaleString()}` : ""}</p>
              {product.url && <a href={product.url} target="_blank" rel="noreferrer">View piece <ExternalLink size={13} /></a>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}