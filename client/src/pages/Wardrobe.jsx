import { useEffect, useMemo, useState } from "react";
import AppNavbar from "../components/AppNavbar";
import "../styles/Wardrobe.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const categories = ["Top", "Bottom", "Dress", "Jacket", "Shoes", "Accessory"];
const colors = [
  "Black",
  "White",
  "Beige",
  "Blue",
  "Red",
  "Pink",
  "Green",
  "Purple",
  "Gray",
];
const occasions = ["Casual", "Formal", "Business", "Party"];

const styles = `
.wardrobe-page{min-height:100vh;background:#f4efe8;color:#241b1d;padding:34px 6vw 70px;font-family:"DM Sans",sans-serif}.wardrobe-head{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #cdbeb5;padding-bottom:24px;margin-bottom:30px}.wardrobe-kicker{font-size:11px;letter-spacing:.2em;color:#8e334d;font-weight:700}.wardrobe-title{font:400 clamp(46px,7vw,92px)/.9 "Playfair Display",serif;margin:10px 0 0}.wardrobe-title em{color:#8e334d}.wardrobe-back{color:#241b1d;text-decoration:none;border:1px solid #241b1d;padding:11px 16px;font-size:11px;letter-spacing:.12em}.wardrobe-layout{max-width:1400px;margin:auto}.wardrobe-toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:24px}.wardrobe-toolbar select,.wardrobe-toolbar button,.wardrobe-upload input,.wardrobe-upload select{border:1px solid #cdbeb5;background:#fffaf5;padding:12px 14px;color:#241b1d;font:inherit}.wardrobe-toolbar button,.wardrobe-submit{background:#8e334d!important;color:#fff!important;border-color:#8e334d!important;cursor:pointer}.wardrobe-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#cdbeb5;border:1px solid #cdbeb5;margin-bottom:28px}.wardrobe-stat{background:#fffaf5;padding:18px}.wardrobe-stat small{display:block;color:#806d70;font-size:10px;letter-spacing:.15em}.wardrobe-stat strong{display:block;font:400 32px "Playfair Display",serif;margin-top:6px}.wardrobe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}.wardrobe-card{background:#fffaf5;border:1px solid #d8c9c0;position:relative;overflow:hidden}.wardrobe-card img{width:100%;aspect-ratio:1/1.15;object-fit:cover;display:block;background:#e7dbd3}.wardrobe-card-info{padding:14px}.wardrobe-card-info strong{display:block;font-size:15px;text-transform:capitalize}.wardrobe-meta{color:#806d70;font-size:12px;margin-top:5px;text-transform:capitalize}.wardrobe-actions{display:flex;gap:7px;margin-top:14px}.wardrobe-actions button{flex:1;border:1px solid #cdbeb5;background:transparent;padding:8px;font-size:1１ px;cursor:pointer}.wardrobe-actions button:last-child{color:#8e334d}.wardrobe-upload{background:#24１b１d;color:#fffaf5;padding：2４ px;margin-bottom：2８ px} .ward robe-form input[type=file]{grid-column：１／-１；color：#fff} . ward robe-form input，. ward robe-form select {min-width：０} . ward robe-submit {grid-column：１／-１；padding：１３ px} . ward robe-message {padding：１４ px ０；color：#b７５a３７} . ward robe-outfits {margin-top：４２ px} . ward robe-outfits h２ {font：４００ ３６ px "Playfair Display"，serif} . outfit-row {display:flex；gap：１４ px；overflow:auto；padding-bottom：１２ px} . outfit {min-width：１８０ px；background：#fffaf５；border：１ px solid #d８c９c０；padding：１２ px} . outfit img {width：１００％；aspect-ratio：１；object-fit：cover} . outfit p {font-size：１２ px；text-transform：capitalize；margin ：８ px ０ ０} @media(max-width ：７００ px) {. wardrobe-head {align-items ：start；gap ：２０ px；flex-direction ：column} . wardrobe-stats {grid-template-columns ：１ fr} . wardrobe-form {grid-template-columns ：１ fr} . wardrobe-form input[type=file]，. wardrobe-submit {grid-column ：auto}} 
 . wardrobe-page {background ：#f３f０ea}
`;

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [wearFilter, setWearFilter] = useState("all");
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    category: "Top",
    color: "Black",
    occasion: "Casual",
    brand: "",
    price: "",
  });
  const [customColor, setCustomColor] = useState("");
  const [customOccasion, setCustomOccasion] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const load = async () => {
    const wardrobeResponse = await fetch(`${API}/api/wardrobe`);
    setItems((await wardrobeResponse.json()).items || []);
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      load().catch(() =>
        setMessage("Backend unavailable. Start the server on port 5000."),
      );
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!isUploadOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isUploadOpen]);

  const visibleItems = useMemo(() => {
    const categoryItems =
      filter === "all"
        ? items
        : items.filter(
            (item) =>
              String(item.category).toLowerCase() === filter.toLowerCase(),
          );
    const wearItems =
      wearFilter === "never"
        ? categoryItems.filter((item) => !(item.times_worn || 0))
        : wearFilter === "worn"
          ? categoryItems.filter((item) => (item.times_worn || 0) > 0)
          : categoryItems;

    return wearFilter === "most-worn"
      ? [...wearItems].sort(
          (first, second) => (second.times_worn || 0) - (first.times_worn || 0),
        )
      : wearItems;
  }, [items, filter, wearFilter]);
  const imagePath = (item) =>
    item.filepath?.startsWith("http")
      ? item.filepath
      : `${API}${item.filepath}`;
  const updateForm = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const selectFile = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile || null);
    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : "");
  };
  const clearFile = () => {
    setFile(null);
    setPreviewUrl("");
  };

  const uploadItem = async (event) => {
    event.preventDefault();
    if (!file) return setMessage("Choose an image first.");
    setLoading(true);
    setMessage("");
    const data = new FormData();
    data.append("file", file);
    const values = {
      ...form,
      color: form.color === "other" ? customColor.trim() : form.color,
      occasion:
        form.occasion === "other" ? customOccasion.trim() : form.occasion,
    };
    if (!values.color || !values.occasion) {
      setMessage("Enter a custom color and occasion before adding the piece.");
      setLoading(false);
      return;
    }
    Object.entries(values).forEach(([key, value]) => data.append(key, value));
    try {
      const response = await fetch(`${API}/api/wardrobe/upload`, {
        method: "POST",
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      setFile(null);
      setPreviewUrl("");
      setForm({
        category: "Top",
        color: "Black",
        occasion: "Casual",
        brand: "",
        price: "",
      });
      setCustomColor("");
      setCustomOccasion("");
      event.target.reset();
      setMessage("Added to your wardrobe.");
      setIsUploadOpen(false);
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markWorn = async (id) => {
    await fetch(`${API}/api/wardrobe/${id}/worn`, { method: "POST" });
    await load();
  };
  const remove = async (id) => {
    await fetch(`${API}/api/wardrobe/${id}`, { method: "DELETE" });
    await load();
  };
  const generate = async () => {
    window.location.href = "/outfits";
  };

  return (
    <>
      <style>{styles}</style>
      <main className="wardrobe-page wardrobe-refined">
        <AppNavbar activeItem="wardrobe" />
        <div className="wardrobe-layout">
          <header className="wardrobe-head">
            <div>
              <div className="wardrobe-kicker">DIGITAL CLOSET</div>
              <h2 className="wardrobe-title">Wear what you own</h2>
            </div>
          
          </header>
          {isUploadOpen && (
            <div
              className="wardrobe-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget)
                  setIsUploadOpen(false);
              }}
            >
              <section
                className="wardrobe-upload wardrobe-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-piece-title"
              >
                <div className="wardrobe-modal-head">
                  <h2 id="add-piece-title">Add a piece</h2>
                  <button
                    className="wardrobe-modal-close"
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    aria-label="Close add piece dialog"
                  >
                    ×
                  </button>
                </div>
                <form
                  className="wardrobe-form wardrobe-modal-form"
                  onSubmit={uploadItem}
                >
                  <div className="wardrobe-modal-media">
                    <label className="wardrobe-file-picker">
                      <span>{file ? "Change image" : "Choose an image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={selectFile}
                      />
                    </label>
                    {previewUrl ? (
                      <div className="wardrobe-image-preview">
                        <img
                          src={previewUrl}
                          alt="Selected wardrobe item preview"
                        />
                        <div>
                          <strong>{file?.name}</strong>
                          <span>Ready to add to your wardrobe</span>
                        </div>
                        <button type="button" onClick={clearFile}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        className="wardrobe-image-preview wardrobe-image-preview-empty"
                        aria-hidden="true"
                      >
                        <span>Preview</span>
                      </div>
                    )}
                  </div>
                  <div className="wardrobe-modal-details">
                    <div className="wardrobe-field">
                      <label htmlFor="wardrobe-category">Category</label>
                      <select
                        id="wardrobe-category"
                        name="category"
                        value={form.category}
                        onChange={updateForm}
                      >
                        {categories.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </div>
                    <div className="wardrobe-field">
                      <label htmlFor="wardrobe-color">Color</label>
                      <select
                        id="wardrobe-color"
                        name="color"
                        value={form.color}
                        onChange={updateForm}
                      >
                        {colors.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                      {form.color === "other" && (
                        <input
                          id="wardrobe-custom-color"
                          value={customColor}
                          onChange={(event) =>
                            setCustomColor(event.target.value)
                          }
                          placeholder="Enter another color"
                          aria-label="Custom color"
                          required
                        />
                      )}
                    </div>
                    <div className="wardrobe-field">
                      <label htmlFor="wardrobe-occasion">Occasion</label>
                      <select
                        id="wardrobe-occasion"
                        name="occasion"
                        value={form.occasion}
                        onChange={updateForm}
                      >
                        {occasions.map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                        <option value="other">Other</option>
                      </select>
                      {form.occasion === "other" && (
                        <input
                          id="wardrobe-custom-occasion"
                          value={customOccasion}
                          onChange={(event) =>
                            setCustomOccasion(event.target.value)
                          }
                          placeholder="Enter another occasion"
                          aria-label="Custom occasion"
                          required
                        />
                      )}
                    </div>
                    <div className="wardrobe-field">
                      <label htmlFor="wardrobe-brand">
                        Brand <span>(optional)</span>
                      </label>
                      <input
                        id="wardrobe-brand"
                        name="brand"
                        placeholder="Add a brand"
                        onChange={updateForm}
                      />
                    </div>
                    <div className="wardrobe-field">
                      <label htmlFor="wardrobe-price">
                        Price <span>(optional)</span>
                      </label>
                      <input
                        id="wardrobe-price"
                        name="price"
                        type="number"
                        min="0"
                        placeholder="Add a price"
                        onChange={updateForm}
                      />
                    </div>
                  </div>
                  <div className="wardrobe-modal-actions">
                    <button
                      type="button"
                      className="wardrobe-modal-secondary"
                      onClick={() => setIsUploadOpen(false)}
                    >
                      Cancel
                    </button>
                    <button className="wardrobe-submit" disabled={loading}>
                      {loading ? "ADDING..." : "ADD TO WARDROBE"}
                    </button>
                  </div>
                </form>
                {message && <div className="wardrobe-message">{message}</div>}
              </section>
            </div>
          )}
          <div className="wardrobe-controls">
            <div
              className="wardrobe-category-filters"
              aria-label="Filter by category"
            >
              <button
                className={filter === "all" ? "is-active" : ""}
                type="button"
                onClick={() => setFilter("all")}
              >
                All
              </button>
              {categories.map((value) => (
                <button
                  className={
                    filter.toLowerCase() === value.toLowerCase()
                      ? "is-active"
                      : ""
                  }
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="wardrobe-actions-bar">
              <select
                value={wearFilter}
                onChange={(event) => setWearFilter(event.target.value)}
                aria-label="Filter by wear status"
              >
                <option value="all">All wear status</option>
                <option value="most-worn">Most worn first</option>
                <option value="worn">Worn at least once</option>
                <option value="never">Never worn</option>
              </select>
              <button
                className="wardrobe-add-button"
                type="button"
                onClick={() => {
                  setMessage("");
                  setIsUploadOpen(true);
                }}
              >
                + ADD A PIECE
              </button>
              <button
                className="wardrobe-generate-button"
                type="button"
                onClick={generate}
              >
                GENERATE OUTFITS <span aria-hidden="true">✦</span>
              </button>
            </div>
          </div>
          <section className="wardrobe-grid">
            {visibleItems.map((item) => (
              <article className="wardrobe-card" key={item.id}>
                <img
                  src={imagePath(item)}
                  alt={`${item.color} ${item.category}`}
                />
                <div className="wardrobe-card-info">
                  <strong>{item.category}</strong>
                  <div className="wardrobe-meta">
                    {item.color} · worn {item.times_worn || 0} times
                  </div>
                  <div className="wardrobe-actions">
                    <button onClick={() => markWorn(item.id)}>MARK WORN</button>
                    <button onClick={() => remove(item.id)}>REMOVE</button>
                  </div>
                </div>
              </article>
            ))}
            {!visibleItems.length && (
              <p>Your wardrobe is empty. Add your first piece above.</p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
