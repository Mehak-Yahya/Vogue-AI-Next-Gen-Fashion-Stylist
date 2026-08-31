import { useEffect, useRef } from "react";
import "../../styles/hero/hero.css";
import Navbar from "./Navbar";

const BG_IMAGE_1 = "/before.png";
const BG_IMAGE_2 = "/after.png";

const stats = [
  {
    radius: 330,
    start: -92,
    end: 16,
    dot: -46,
    number: "10",
    suffix: "+",
    label: "STYLE MODES",
  },
  {
    radius: 395,
    start: -56,
    end: 60,
    dot: 2,
    number: "40",
    suffix: "+",
    label: "LOOKS CREATED",
  },
  {
    radius: 460,
    start: -14,
    end: 72,
    dot: 44,
    number: "95",
    suffix: "%",
    label: "STYLE MATCH",
  },
];

const CENTER_X = -110;
const CENTER_Y = 300;

function pointOnCircle(radius, angle) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: CENTER_X + radius * Math.cos(radians),
    y: CENTER_Y + radius * Math.sin(radians),
  };
}

function createArc(radius, start, end) {
  const first = pointOnCircle(radius, start);
  const second = pointOnCircle(radius, end);

  return `
    M ${first.x} ${first.y}
    A ${radius} ${radius} 0 0 1 ${second.x} ${second.y}
  `;
}

export default function Hero() {
  const heroRef = useRef(null);
  const revealRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const reveal = revealRef.current;

    if (!hero || !reveal) return;

    let animationFrame = null;
    let mounted = true;

    const cursor = {
      x: -1000,
      y: -1000,
    };

    const smooth = {
      x: -1000,
      y: -1000,
    };

    const grid = {
      x: 0,
      y: 0,
    };

    const gridTarget = {
      x: 0,
      y: 0,
    };

    let cursorHasEntered = false;

    // SECOND IMAGE HIDDEN INITIALLY
    reveal.style.opacity = "0";
    reveal.style.maskImage = "none";
    reveal.style.webkitMaskImage = "none";

    function mouseEnter() {
      cursorHasEntered = true;
    }

    function mouseMove(event) {
      cursor.x = event.clientX;
      cursor.y = event.clientY;
      cursorHasEntered = true;

      gridTarget.x =
        (event.clientX / window.innerWidth - 0.5) * 16;

      gridTarget.y =
        (event.clientY / window.innerHeight - 0.5) * 16;
    }

    function mouseLeave() {
      cursorHasEntered = false;

      reveal.style.opacity = "0";
      reveal.style.maskImage = "none";
      reveal.style.webkitMaskImage = "none";
    }

    function animate() {
      if (!mounted) return;

      // SMOOTH CURSOR
      smooth.x += (cursor.x - smooth.x) * 0.1;
      smooth.y += (cursor.y - smooth.y) * 0.1;

      // GRID PARALLAX
      grid.x += (gridTarget.x - grid.x) * 0.06;
      grid.y += (gridTarget.y - grid.y) * 0.06;

      hero.style.setProperty("--grid-x", `${grid.x}px`);
      hero.style.setProperty("--grid-y", `${grid.y}px`);

      // KEEP SECOND IMAGE HIDDEN
      if (!cursorHasEntered) {
        reveal.style.opacity = "0";
        reveal.style.maskImage = "none";
        reveal.style.webkitMaskImage = "none";

        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;

      const cursorInside =
        smooth.x >= 0 &&
        smooth.y >= 0 &&
        smooth.x <= width &&
        smooth.y <= height;

      if (!cursorInside) {
        reveal.style.opacity = "0";
        reveal.style.maskImage = "none";
        reveal.style.webkitMaskImage = "none";

        animationFrame = requestAnimationFrame(animate);
        return;
      }

      // IMAGE REVEAL
      const radius = 230;

      const mask = `
        radial-gradient(
          circle ${radius}px at ${smooth.x}px ${smooth.y}px,
          rgba(255,255,255,1) 0%,
          rgba(255,255,255,1) 72%,
          rgba(255,255,255,0.96) 78%,
          rgba(255,255,255,0.82) 84%,
          rgba(255,255,255,0.55) 90%,
          rgba(255,255,255,0.22) 96%,
          rgba(255,255,255,0) 100%
        )
      `;

      reveal.style.opacity = "1";
      reveal.style.maskImage = mask;
      reveal.style.webkitMaskImage = mask;

      animationFrame = requestAnimationFrame(animate);
    }

    hero.addEventListener("mouseenter", mouseEnter);
    hero.addEventListener("mousemove", mouseMove);
    hero.addEventListener("mouseleave", mouseLeave);

    animationFrame = requestAnimationFrame(animate);

    return () => {
      mounted = false;

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      hero.removeEventListener("mouseenter", mouseEnter);
      hero.removeEventListener("mousemove", mouseMove);
      hero.removeEventListener("mouseleave", mouseLeave);
    };
  }, []);

  return (
    <main ref={heroRef} className="cyber-hero">

      {/* NAVBAR — FIRST SECTION ONLY */}
      <Navbar />

      {/* HERO */}
      <section className="hero-stage">

        {/* GRID */}
        <div className="hero-grid">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="gridPattern"
                width="48"
                height="48"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M48 0H0V48"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>

            <rect
              width="100%"
              height="100%"
              fill="url(#gridPattern)"
            />
          </svg>
        </div>

        {/* FIRST IMAGE */}
        <img
          src={BG_IMAGE_1}
          alt=""
          className="hero-image base-image"
          draggable="false"
        />

        {/* RED OVERLAY */}
        <div className="hero-red-overlay" />

        {/* VIGNETTE */}
        <div className="hero-vignette" />

        {/* SECOND IMAGE / HOVER REVEAL */}
        <div
          ref={revealRef}
          className="hero-reveal"
          aria-hidden="true"
        >
          <img
            src={BG_IMAGE_2}
            alt=""
            className="hero-image reveal-image"
            draggable="false"
          />
        </div>

        {/* STATS */}
        <div className="stats-container">
          <svg
            viewBox="0 0 380 700"
            preserveAspectRatio="xMaxYMid meet"
          >
            <defs>
              {stats.map((stat, index) => {
                const first = pointOnCircle(
                  stat.radius,
                  stat.start
                );

                const second = pointOnCircle(
                  stat.radius,
                  stat.end
                );

                return (
                  <linearGradient
                    key={index}
                    id={`gradient-${index}`}
                    gradientUnits="userSpaceOnUse"
                    x1={first.x}
                    y1={first.y}
                    x2={second.x}
                    y2={second.y}
                  >
                    <stop
                      offset="0"
                      stopColor="white"
                      stopOpacity="0"
                    />

                    <stop
                      offset=".22"
                      stopColor="white"
                      stopOpacity=".5"
                    />

                    <stop
                      offset=".55"
                      stopColor="white"
                      stopOpacity=".5"
                    />

                    <stop
                      offset=".85"
                      stopColor="white"
                      stopOpacity=".1"
                    />

                    <stop
                      offset="1"
                      stopColor="white"
                      stopOpacity="0"
                    />
                  </linearGradient>
                );
              })}
            </defs>

            {stats.map((stat, index) => {
              const path = createArc(
                stat.radius,
                stat.start,
                stat.end
              );

              const dot = pointOnCircle(
                stat.radius,
                stat.dot
              );

              const length =
                stat.radius *
                Math.abs(
                  ((stat.end - stat.start) * Math.PI) / 180
                );

              const lineDelay =
                0.4 + index * 0.22;

              return (
                <g key={stat.label}>

                  {/* ARC */}
                  <path
                    d={path}
                    className="arc-line"
                    stroke={`url(#gradient-${index})`}
                    style={{
                      "--arc-length": length,
                      animationDelay: `${lineDelay}s`,
                    }}
                  />

                  {/* OUTER DOT */}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r="7"
                    className="arc-ring"
                    style={{
                      animationDelay: `${
                        lineDelay + 1.2
                      }s`,
                    }}
                  />

                  {/* INNER DOT */}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r="3.4"
                    className="arc-dot"
                    style={{
                      animationDelay: `${
                        lineDelay + 0.9
                      }s`,
                    }}
                  />

                  {/* NUMBER */}
                  <text
                    x={dot.x + 16}
                    y={dot.y + 4}
                    className="arc-number"
                    style={{
                      animationDelay: `${
                        lineDelay + 1.05
                      }s`,
                    }}
                  >
                    {stat.number}

                    <tspan
                      dy="-10"
                      fontSize="19"
                    >
                      {stat.suffix}
                    </tspan>
                  </text>

                  {/* LABEL */}
                  <text
                    x={dot.x + 18}
                    y={dot.y + 22}
                    className="arc-label"
                    style={{
                      animationDelay: `${
                        lineDelay + 1.2
                      }s`,
                    }}
                  >
                    {stat.label}
                  </text>

                </g>
              );
            })}
          </svg>
        </div>

        {/* HERO COPY */}
        <div className="hero-copy">

          <div
            className="hero-eyebrow hero-rise"
            style={{
              animationDelay: ".15s",
            }}
          >
            Your style,{" "}
            <em>intelligently redefined</em>
          </div>

          <h1
            className="hero-title hero-rise"
            style={{
              animationDelay: ".3s",
            }}
          >
            <span>Vogue AI</span>
            <br />
            <span>
              Next Gen Fashion Stylist
            </span>
          </h1>

          <p
            className="hero-description hero-rise"
            style={{
              animationDelay: ".5s",
            }}
          >
            Discover a smarter way to dress.
            Vogue AI understands your style,
            colors, preferences, and personality
            to create fashion that feels uniquely
            you.
          </p>

          <button
            className="reserve-button hero-rise"
            style={{
              animationDelay: ".7s",
            }}
          >
            <span>
              Discover Your Style
            </span>

            <i />
          </button>

        </div>

      </section>
    </main>
  );
}