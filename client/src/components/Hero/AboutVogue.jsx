
import React, { useEffect, useRef } from "react";
import "../../styles/hero/AboutVogue.css";

const intelligence = [
  {
    number: "01",
    title: "UNDERSTAND",
    text: "Your features become the starting point — skin tone, undertone, face shape, hair and eye colour.",
  },
  {
    number: "02",
    title: "PERSONALIZE",
    text: "Your preferences, wardrobe and occasion shape recommendations around your actual life.",
  },
  {
    number: "03",
    title: "STYLE",
    text: "From colours and outfits to accessories and everyday decisions, AI turns insight into style.",
  },
];

const AboutVogue = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="about-vogue" ref={sectionRef}>
      <div className="about-bg-orb about-bg-orb-one" />
      <div className="about-bg-orb about-bg-orb-two" />

      {/* TOP LABEL */}
      <header className="about-header">
        <div className="about-header-left">
          <span className="about-index">04</span>
          <span>ABOUT VOGUE AI</span>
        </div>

        <div className="about-header-right">
          <span className="about-status-dot" />
          <span>PERSONAL STYLE INTELLIGENCE</span>
        </div>
      </header>

      {/* MAIN */}
      <div className="about-content">
        <div className="about-side-label">
          <span>THE IDEA</span>
          <span className="about-side-line" />
        </div>

        <div className="about-statement">
          <p className="about-eyebrow">A DIFFERENT WAY TO APPROACH STYLE</p>

          <h2>
            Not just
            <em>what to wear.</em>
          </h2>

          <h3>What suits you.</h3>
        </div>

        <div className="about-description">
          <p>
            Vogue AI is an AI-powered personal fashion stylist designed
            around the way Pakistani women actually dress.
          </p>

          <p>
            It brings together personal features, preferences, wardrobe and
            occasion to create styling guidance that feels relevant to you —
            not recommendations made for everyone.
          </p>
        </div>
      </div>

      {/* INTELLIGENCE */}
      <div className="about-intelligence">
        <div className="about-intelligence-heading">
          <span>HOW IT THINKS</span>
          <span>01 — 03</span>
        </div>

        <div className="about-intelligence-grid">
          {intelligence.map((item) => (
            <article
              className="about-intelligence-item"
              key={item.number}
            >
              <div className="about-item-number">{item.number}</div>

              <div className="about-item-content">
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>

              <span className="about-item-arrow">↗</span>
            </article>
          ))}
        </div>
      </div>

      {/* BOTTOM */}
      <footer className="about-footer">
        <span>AI</span>

        <div className="about-footer-line" />

        <span>PERSONAL STYLE</span>

        <div className="about-footer-line" />

        <span>PAKISTANI FASHION</span>

        <span className="about-footer-mark">VOGUE AI®</span>
      </footer>
    </section>
  );
};

export default AboutVogue;
