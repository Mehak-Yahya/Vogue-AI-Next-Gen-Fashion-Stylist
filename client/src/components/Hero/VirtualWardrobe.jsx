import React, { useEffect, useRef } from "react";
import "../../styles/hero/VirtualWardrobe.css";

import virtualImage from "../../assets/virtual.png";

export default function VirtualWardrobe() {
  const sectionRef = useRef(null);
  const visualRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const visual = visualRef.current;

    if (!section || !visual) return;

    /* Reveal animation */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("vw-visible");
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(section);

    /* Subtle mouse 3D movement */
    const handleMouseMove = (e) => {
      const rect = section.getBoundingClientRect();

      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      visual.style.setProperty("--mouse-x", `${x * 4}deg`);
      visual.style.setProperty("--mouse-y", `${y * -3}deg`);
    };

    const handleMouseLeave = () => {
      visual.style.setProperty("--mouse-x", "0deg");
      visual.style.setProperty("--mouse-y", "0deg");
    };

    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      observer.disconnect();
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section className="virtual-wardrobe" ref={sectionRef}>
      {/* Background */}
      <div className="vw-bg-glow" />
      <div className="vw-grid" />

      <div className="vw-inner">
        {/* ================= LEFT ================= */}
        <div className="vw-copy">
          <div className="vw-eyebrow">
            <span className="vw-eyebrow-line" />
            YOUR DIGITAL CLOSET
          </div>

          <h2 className="vw-title">
            Your wardrobe.
            <br />
            <em>Reimagined.</em>
          </h2>

          <p className="vw-description">
            Turn everything you own into endless outfit possibilities.
            Vogue AI organizes your wardrobe, understands your style,
            and helps you discover combinations you never thought of.
          </p>

          <div className="vw-bottom">
            <div className="vw-feature">
              <span className="vw-feature-number">01</span>

              <div>
                <strong>YOUR CLOTHES</strong>
                <span>Add pieces you already own.</span>
              </div>
            </div>

            <div className="vw-feature">
              <span className="vw-feature-number">02</span>

              <div>
                <strong>AI STYLING</strong>
                <span>Get combinations made for you.</span>
              </div>
            </div>
          </div>

          <div className="vw-status">
            <span className="vw-status-dot" />
            AI WARDROBE ACTIVE
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="vw-visual" ref={visualRef}>
          {/* Ambient orbs */}
          <div className="vw-orb vw-orb-one" />
          <div className="vw-orb vw-orb-two" />

          {/* Decorative rings */}
          <div className="vw-orbit vw-orbit-one" />
          <div className="vw-orbit vw-orbit-two" />

          {/* Main product image */}
          <div className="vw-image-wrap">
            <div className="vw-image-shadow" />

            <img
              className="vw-image"
              src={virtualImage}
              alt="Vogue AI virtual wardrobe"
            />

            <div className="vw-light-sweep" />
          </div>

          {/* Top floating card */}
          <div className="vw-floating-card vw-card-top">
            <span className="vw-card-icon">✦</span>

            <div>
              <small>AI CURATED</small>
              <strong>24 ITEMS</strong>
            </div>
          </div>

          {/* Bottom floating card */}
          <div className="vw-floating-card vw-card-bottom">
            <div className="vw-mini-circle">
              <span>✦</span>
            </div>

            <div>
              <small>STYLE MATCH</small>
              <strong>98%</strong>
            </div>
          </div>

          {/* Small labels */}
          <div className="vw-floating-label vw-label-left">
            WARDROBE
          </div>

          <div className="vw-floating-label vw-label-right">
            PERSONALIZED
          </div>
        </div>
      </div>

   
    </section>
  );
}