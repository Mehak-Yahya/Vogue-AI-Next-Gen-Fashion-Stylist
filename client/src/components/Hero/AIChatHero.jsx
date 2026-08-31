import React from "react";
import heroImage from "../../assets/clothes.png";
import "../../styles/hero/AIChatHero.css";

export default function AIChatHero() {

  return (
    <section className="vogue-ai-hero">

 
      

      {/* Main */}
      <main className="vogue-hero-main">

        {/* Editorial Copy */}
        <div className="editorial-copy">
          <h1>
            Your
            eastern <em>Elegance.</em>
          </h1>

          <p>
            Vogue AI reads your silhouette, your occasion, and the mood of Pakistani luxury — refined, expressive, and unmistakably yours.
          </p>

          <ul className="feature-points">
            <li>AI chat accessible in English and Roman Urdu</li>
            <li>Simple styling guidance for everyday luxury looks</li>
            <li>Made for Pakistani fashion preferences and tone</li>
          </ul>

          <button className="editorial-cta" type="button">
            <span>START STYLING</span>
            <b>→</b>
          </button>

        </div>

        <div className="visual-stack">
          <div className="fashion-stage">

            <div className="stage-ring ring-one" />
            <div className="stage-ring ring-two" />

            <div className="fashion-image">
              <img
                src={heroImage}
                alt="Fashion editorial portrait"
                className="fashion-visual"
              />
            </div>
          </div>

          <aside className="vogue-chat">
            <div className="chat-header">
              <div className="chat-brand">
                <span className="chat-v">V</span>
                VOGUE AI
              </div>
              <span className="chat-live">
                <span />
                ONLINE
              </span>
            </div>

            <div className="chat-body">
              <div className="prompt-pill">What should I wear tonight? Kya pehnun?</div>

              <div className="ai-bubble">
                <span className="mini-v">V</span>

                <div>
                  <strong>STYLE MATCH</strong>
                  <p>Soft tailoring, crafted textures, and a subtle statement finish. Narm tailoring, refined finish, aur statement look.</p>
                </div>
              </div>

              <div className="tag-row">
                <span>Eastern luxury</span>
                <span>Soft structure</span>
                <span>Refined</span>
              </div>
            </div>
          </aside>
        </div>

      </main>
    </section>
  );
}