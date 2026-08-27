import { useEffect, useRef } from "react";
import "../../styles/hero/SkinAnalysis.css";

const MODEL_IMAGE = "/aft.png";

const analysisItems = [
  {
    label: "SKIN TONE",
    value: "Medium",
  },
  {
    label: "UNDERTONE",
    value: "Warm",
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
  "#6B2418",
  "#A85D32",
  "#C39A55",
  "#3F5135",
  "#263B3B",
  "#6C4B35",
];

export default function SkinAnalysis() {
  const sectionRef = useRef(null);

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
            LEFT — GIRL
        ================================================= */}

        <div className="skin-model">

          <div className="model-aura" />

          <div className="model-ring model-ring-one" />
          <div className="model-ring model-ring-two" />

          <div className="model-image-wrap">

            <img
              src={MODEL_IMAGE}
              alt="AI appearance analysis"
              draggable="false"
            />

            {/* =================================================
                FACE DETECTION
            ================================================= */}

            <div className="face-detection">

              {/* FACE CORNERS */}
              <span className="face-corner corner-tl" />
              <span className="face-corner corner-tr" />
              <span className="face-corner corner-bl" />
              <span className="face-corner corner-br" />

              {/* SCANNING LINE */}
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
              <div
                className="feature"
                key={item.label}
              >

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

          {/* PALETTE */}

          <div className="palette-block">

            <div className="palette-heading">
              <span>PERSONALIZED PALETTE</span>
              <small>06 COLORS</small>
            </div>

            <div className="palette">

              {palette.map((color, index) => (
                <span
                  key={color}
                  style={{
                    backgroundColor: color,
                  }}
                  title={`Palette color ${index + 1}`}
                />
              ))}

            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT — EDITORIAL
        ================================================= */}

        <div className="skin-intro">

          <span className="skin-kicker">
            AI PERSONAL ANALYSIS
          </span>

          <h2>
            Your
            <br />
            appearance.
            <br />
            <em>Decoded.</em>
          </h2>

          <p>
            AI reads your natural features to reveal
            the tones, colors and visual characteristics
            that suit you best.
          </p>

          <div className="analysis-result">

            <span>YOUR COLOR SEASON</span>

            <strong>
              DEEP <em>AUTUMN</em>
            </strong>

            <small>
              Warm undertones · Deep natural features
            </small>

          </div>

        </div>

      </div>

    </section>
  );
}