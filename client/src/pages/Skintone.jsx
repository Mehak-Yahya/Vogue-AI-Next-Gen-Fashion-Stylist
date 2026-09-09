import { useEffect, useState } from 'react';
import axios from 'axios';
import { Camera, CheckCircle2, Image as ImageIcon, ScanFace, Sun, UserRound } from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import '../styles/Skintone.css';
import { authHeaders } from '../utils/auth';
import brightSpringPalette from '../assets/colorpalletes/bright spring.PNG';
import brightWinterPalette from '../assets/colorpalletes/bright winter.PNG';
import coolSummerPalette from '../assets/colorpalletes/cool summer.PNG';
import coolWinterPalette from '../assets/colorpalletes/cool winter.PNG';
import darkAutumnPalette from '../assets/colorpalletes/dark autumn.PNG';
import darkWinterPalette from '../assets/colorpalletes/dark winter.PNG';
import lightSpringPalette from '../assets/colorpalletes/light spring.PNG';
import lightSummerPalette from '../assets/colorpalletes/light summer.PNG';
import mutedAutumnPalette from '../assets/colorpalletes/muted autumn.PNG';
import mutedSummerPalette from '../assets/colorpalletes/muted summer.PNG';
import warmAutumnPalette from '../assets/colorpalletes/warm autumn.PNG';
import warmSpringPalette from '../assets/colorpalletes/warm spring.PNG';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const paletteAssets = {
  'bright spring': brightSpringPalette,
  'bright winter': brightWinterPalette,
  'cool summer': coolSummerPalette,
  'cool winter': coolWinterPalette,
  'dark autumn': darkAutumnPalette,
  'dark winter': darkWinterPalette,
  'light spring': lightSpringPalette,
  'light summer': lightSummerPalette,
  'muted autumn': mutedAutumnPalette,
  'muted summer': mutedSummerPalette,
  'warm autumn': warmAutumnPalette,
  'warm spring': warmSpringPalette,
};

export default function Skintone() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showingResult, setShowingResult] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [paletteSaved, setPaletteSaved] = useState(false);

  useEffect(() => {
    if (!showingResult) return undefined;

    const revealTimer = setTimeout(() => setShowingResult(false), 500);
    return () => clearTimeout(revealTimer);
  }, [showingResult]);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setShowingResult(false);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile || selectedFile.size === 0) {
      setError('Please select a valid image file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await axios.post(`${API_BASE_URL}/api/analyze-skin`, formData, { headers: authHeaders() });

      if (response.data && response.data.success) {
        const analysis = response.data.data;
        const season = analysis.season_analysis?.season || '';
        const user = JSON.parse(localStorage.getItem('vogue-ai-user') || '{}');
        const paletteAsset = paletteAssets[season.toLowerCase()];
        setResult(analysis);
        setPaletteSaved(false);
        if (season && user.id) {
          const profile = {
            ...(user.profile || {}),
            colorAnalysis: {
              ...(user.profile?.colorAnalysis || {}),
              season,
              paletteAsset: season.toLowerCase(),
              paletteSavedAt: new Date().toISOString(),
            },
          };
          const profileResponse = await axios.put(`${API_BASE_URL}/api/auth/profile`, { profile }, { headers: authHeaders() });
          localStorage.setItem('vogue-ai-user', JSON.stringify(profileResponse.data.user));
          setPaletteSaved(Boolean(paletteAsset));
        }
        setShowingResult(true);
      } else {
        setShowingResult(false);
        setError(response.data.error || 'Analysis failed.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setShowingResult(false);
      const serverMessage = err.response?.data?.error || 'Failed to analyze image. Check backend server logs.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="skintone-page">
      <AppNavbar activeItem="colors" />
      <div className="skintone-layout">
        <header className="skintone-intro">
          <span className="skintone-kicker">VOGUE AI / COLOR ANALYSIS</span>
          <h1>12-Season Automated Analysis</h1>
          <p>Upload a clear selfie to extract skin, hair, and iris features automatically.</p>
        </header>

        <form className="skintone-workspace" onSubmit={handleSubmit}>
          <aside className="skintone-guidance">
            <span className="skintone-panel-kicker">PHOTO GUIDELINES</span>
            <div className="skintone-guideline"><CheckCircle2 size={15} /><span>Natural lighting</span><Sun size={15} /></div>
            <div className="skintone-guideline"><CheckCircle2 size={15} /><span>Clear face</span><i /></div>
            <div className="skintone-guideline"><CheckCircle2 size={15} /><span>No filters or makeup</span><i /></div>
            <div className="skintone-guideline"><CheckCircle2 size={15} /><span>Neutral background</span><ImageIcon size={15} /></div>
          </aside>

          <label className={`skintone-dropzone ${previewUrl ? 'has-preview' : ''}`}>
            {previewUrl ? <img src={previewUrl} alt="Selected selfie preview" /> : <Camera size={34} strokeWidth={1.3} />}
            <strong>{previewUrl ? selectedFile?.name : 'Drag & drop your selfie here'}</strong>
            <span>{previewUrl ? 'Click to choose a different photo' : 'or click to browse photos'}</span>
            <small>Accepted: PNG, JPG, JPEG (Max 10MB)</small>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          <aside className="skintone-guide-visual">
            <div className="skintone-guide-portrait"><UserRound size={58} strokeWidth={1.2} /></div>
            <div className="skintone-guide-line"><ScanFace size={15} /> Skin parsing</div>
            <div className="skintone-guide-line"><ScanFace size={15} /> Iris detection</div>
            <div className="skintone-guide-line"><ScanFace size={15} /> Hair tone sampling</div>
          </aside>

          <button className="skintone-submit" type="submit" disabled={loading || showingResult || !selectedFile}>
            {loading ? 'Reading your features...' : showingResult ? 'Analysis complete' : '✦ Run 12-Season AI Analysis'}
          </button>
        </form>

        {loading && (
          <div className="skin-analysis-loader" role="status" aria-label="Analyzing image">
            <span className="skin-analysis-loader-text">AI is reading your features...</span>
          </div>
        )}
        {error && <p className="skintone-error" role="alert">{error}</p>}

        {result && result.face_detected && (
          <section className="skintone-result">
            <div className="skintone-result-head"><div><span className="skintone-panel-kicker">ANALYSIS COMPLETE</span><h2>Your feature profile</h2></div><strong>{result.season_analysis?.season || 'Season ready'}</strong></div>
            <div className="skintone-traits">
              {['hue', 'value', 'chroma'].map((trait) => <div className="skintone-trait" key={trait}><small>{trait.toUpperCase()}</small><strong>{result.detected_traits?.[trait] || '—'}</strong></div>)}
            </div>
            {result.extracted_features && <div className="skintone-features">
              {[['Skin Tone', result.feature_hexes?.skin || result.overall_rgb?.hex || '#ccc', result.extracted_features.skin_lab?.L], ['Hair Color', result.feature_hexes?.hair || '#555', result.extracted_features.hair_lab?.L], ['Iris Tone', result.feature_hexes?.iris || '#777', result.extracted_features.iris_lab?.L]].map(([label, color, lightness]) => <div className="skintone-feature" key={label}><span style={{ backgroundColor: color }} /><strong>{label}</strong><small>L*: {lightness ?? '—'}</small></div>)}
            </div>}
            {paletteAssets[result.season_analysis?.season?.toLowerCase()] && <div className="skintone-palette">
              <div className="skintone-palette-head">
                <div><span className="skintone-panel-kicker">YOUR PALETTE</span><h3>{result.season_analysis.season}</h3></div>
                {paletteSaved && <small>Saved to your profile</small>}
              </div>
              <img src={paletteAssets[result.season_analysis.season.toLowerCase()]} alt={`${result.season_analysis.season} color palette`} />
              <a className="skintone-palette-download" href={paletteAssets[result.season_analysis.season.toLowerCase()]} download={`${result.season_analysis.season.toLowerCase().replace(/\s+/g, '-')}-palette.png`}>Download palette</a>
            </div>}
          </section>
        )}
      </div>
    </main>
  );
}