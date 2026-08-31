import { useEffect, useRef, useState } from "react";
import "../../styles/hero/SkinAnalysis.css";

import dressOne from "../../assets/dresses/1st dress.png";
import dressTwo from "../../assets/dresses/2nd dress.png";
import dressThree from "../../assets/dresses/3rd dress.png";
import dressFour from "../../assets/dresses/4th dress.png";
import dressFive from "../../assets/dresses/5th dress.png";

const MODEL_IMAGE = "/after.png";

const analysisItems = [
  {
    label: "SKIN TONE",
    value: "Medium",
  },
  {
    label: "UNDERTONE",
    value: "Cool",
  },
  {
    label: "HAIR",
    value: "Dark Brown",
  },
  {
    label: "EYES",
    value: "Deep Brown",
  },
];

const palette = [
  {
    color: "#263B5B",
    name: "Rich Navy",
    dress: "Navy Evening Dress",
    image: dressOne,
  },
  {
    color: "#315C4A",
    name: "Deep Forest",
    dress: "Forest Green Silk Dress",
    image: dressTwo,
  },
  {
    color: "#54263F",
    name: "Mulberry",
    dress: "Mulberry Statement Dress",
    image: dressThree,
  },
  {
    color: "#722F35",
    name: "Deep Claret",
    dress: "Claret Formal Dress",
    image: dressFour,
  },
  {
    color: "#3B3D42",
    name: "Midnight Grey",
    dress: "Graphite Evening Dress",
    image: dressFive,
  },
];

export default function SkinAnalysis() {
  const sectionRef = useRef(null);
  const [activeColor, setActiveColor] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const selectedPalette =
    selectedColor === null ? null : palette[selectedColor];

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="skin-analysis">
      {/* BACKGROUND */}
      <div className="skin-grid" />
      <div className="skin-glow" />

      <div className="skin-layout">
        {/* =================================================
            LEFT — MODEL
        ================================================= */}

        <div className="skin-model">
          <div className="model-aura" />

          <div className="model-ring model-ring-one" />
          <div className="model-ring model-ring-two" />

          <div
            className={`model-image-wrap ${
              selectedPalette ? "has-selected-look" : ""
            }`}
          >
            <img
              src={selectedPalette ? selectedPalette.image : MODEL_IMAGE}
              alt={
                selectedPalette
                  ? selectedPalette.dress
                  : "AI appearance analysis"
              }
              draggable="false"
              className={selectedPalette ? "selected-look-image" : ""}
            />

            {/* FACE DETECTION */}
            <div className="face-detection">
              <span className="face-corner corner-tl" />
              <span className="face-corner corner-tr" />
              <span className="face-corner corner-bl" />
              <span className="face-corner corner-br" />

              <span className="face-scan-line" />
            </div>
          </div>

          {/* IMAGE LABEL */}
          <div className="model-label">
            <span />
            AI ANALYSIS
          </div>
        </div>

        {/* =================================================
            CENTER — DETECTION
        ================================================= */}

        <div className="detection">
          <div className="detection-header">
            <div className="detected-title">
              <span>DETECTED</span>
              <strong>FEATURES</strong>
            </div>

            <div className="accuracy">
              <span>ACCURACY</span>
              <strong>98.4%</strong>
            </div>
          </div>

          <div className="feature-list">
            {analysisItems.map((item, index) => (
              <div className="feature" key={item.label}>
                <span className="feature-number">
                  0{index + 1}
                </span>

                <div className="feature-info">
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>

                <span className="feature-dot" />
              </div>
            ))}
          </div>

          {/* =================================================
              PERSONALIZED PALETTE
          ================================================= */}

          <div className="palette-block">
            <div className="palette-heading">
              <span>PERSONALIZED PALETTE</span>
              <small>06 COLORS</small>
            </div>

            <div className="palette">
              {palette.map((item, index) => (
                <div
                  className={`palette-item ${
                    activeColor === index ? "is-hovered" : ""
                  } ${selectedColor === index ? "is-selected" : ""}`}
                  key={`${item.color}-${index}`}
                  onMouseEnter={() => setActiveColor(index)}
                  onMouseLeave={() => setActiveColor(null)}
                  onFocus={() => setActiveColor(index)}
                  onBlur={() => setActiveColor(null)}
                  tabIndex={0}
                >
                  <button
                    type="button"
                    className="palette-swatch"
                    style={{
                      backgroundColor: item.color,
                    }}
                    aria-label={`${item.name} — ${item.dress}`}
                    aria-pressed={selectedColor === index}
                    onClick={() =>
                      setSelectedColor((current) =>
                        current === index ? null : index
                      )
                    }
                  />

                  {/* HOVER DRESS CARD */}
                  <div className="palette-preview">
                    <div className="preview-image">
                      <img
                        src={item.image}
                        alt={item.dress}
                        draggable="false"
                      />

                      <div className="preview-index">
                        0{index + 1}
                      </div>
                    </div>

                    <div className="preview-info">
                      <span>{item.name}</span>
                      <strong>{item.dress}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="palette-hint">
              <span>HOVER A COLOR</span>
              <i />
              <span>EXPLORE THE LOOK</span>
            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT — EDITORIAL INTRO
        ================================================= */}

        <div className="skin-intro">
          <div className="intro-number">01 / 04</div>

          <h2>
            Your
            <br />
            appearance.
            <br />
            <em>Decoded.</em>
          </h2>

          <p>
            AI reads your natural features to reveal the
            tones, colors and visual characteristics that
            suit you best.
          </p>

          {/* ANALYSIS RESULT */}
          <div className="analysis-result">
            <span>YOUR COLOR SEASON</span>

            <strong>
              DARK <em>WINTER</em>
            </strong>

            <small>
              Cool undertones · Deep natural features
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}