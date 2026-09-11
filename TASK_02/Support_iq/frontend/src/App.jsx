import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { apiFetch } from "./api";

const features = [
  {
    no: "01",
    icon: "◈",
    title: "Understand",
    text: "Transform unstructured customer conversations into meaningful support signals.",
  },
  {
    no: "02",
    icon: "✦",
    title: "Classify",
    text: "Automatically identify the most relevant category for every incoming request.",
  },
  {
    no: "03",
    icon: "↗",
    title: "Prioritize",
    text: "Surface High, Medium and Low priority cases so important issues receive attention sooner.",
  },
  {
    no: "04",
    icon: "◌",
    title: "Analyze sentiment",
    text: "Understand the emotional direction behind every customer interaction.",
  },
  {
    no: "05",
    icon: "✧",
    title: "Assist",
    text: "Give support teams an intelligent response starting point.",
  },
  {
    no: "06",
    icon: "⌁",
    title: "Measure",
    text: "Turn support activity into actionable operational intelligence.",
  },
];

function LogoMark() {
  return (
    <svg
      className="support-logo-mark"
      viewBox="0 0 100 100"
      aria-label="SupportIQ logo"
    >
      <defs>
        <linearGradient
          id="logoGradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#9b6cff" />
          <stop offset="48%" stopColor="#ff5cc8" />
          <stop offset="100%" stopColor="#59d5ff" />
        </linearGradient>
      </defs>

      <path
        d="M50 8 L88 30 L88 70 L50 92 L12 70 L12 30 Z"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="3"
      />

      <path
        d="M31 50 C31 34 43 25 58 25 C67 25 74 29 79 36"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <path
        d="M69 50 C69 66 57 75 42 75 C33 75 26 71 21 64"
        fill="none"
        stroke="url(#logoGradient)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <circle
        cx="50"
        cy="50"
        r="7"
        fill="url(#logoGradient)"
      />
    </svg>
  );
}

function AnimatedBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let frame = 0;
    let lastScroll = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const delta = Math.max(-40, Math.min(40, y - lastScroll));
      root.style.setProperty("--scroll-y", `${y * 0.035}px`);
      root.style.setProperty("--scroll-delta", `${delta * 0.18}px`);
      lastScroll = y;
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="animated-background" aria-hidden="true">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="bg-orb bg-orb-c" />
      <div className="bg-orb bg-orb-d" />
      <div className="bg-orb bg-orb-e" />
      <div className="bg-beam bg-beam-a" />
      <div className="bg-beam bg-beam-b" />
      <div className="bg-ring bg-ring-a" />
      <div className="bg-ring bg-ring-b" />
      <div className="bg-spark bg-spark-a" />
      <div className="bg-spark bg-spark-b" />
      <div className="bg-spark bg-spark-c" />
      <div className="bg-spark bg-spark-d" />
      <div className="bg-flow-line bg-flow-line-a" />
      <div className="bg-flow-line bg-flow-line-b" />
    </div>
  );
}

function ParticleFormation({ complete, onComplete }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = 1000;
    const H = 250;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let particles = [];
    let animationFrame;
    let finished = false;
    const start = performance.now();

    const palette = [
      [164, 108, 255],
      [255, 91, 201],
      [92, 211, 255],
      [137, 125, 255],
      [239, 117, 226],
    ];

    const source = document.createElement("canvas");
    source.width = W;
    source.height = H;
    const sourceCtx = source.getContext("2d");

    // Draw the EXACT visual that the particles must become:
    // SupportIQ emblem first, then the SUPPORTIQ wordmark.
    sourceCtx.clearRect(0, 0, W, H);
    sourceCtx.strokeStyle = "#fff";
    sourceCtx.lineWidth = 3.2;
    sourceCtx.lineCap = "round";
    sourceCtx.lineJoin = "round";

    const cx = 292;
    const cy = 125;
    const r = 42;

    sourceCtx.beginPath();
    sourceCtx.moveTo(cx, cy - r - 2);
    sourceCtx.lineTo(cx + 38, cy - 20);
    sourceCtx.lineTo(cx + 38, cy + 20);
    sourceCtx.lineTo(cx, cy + r + 2);
    sourceCtx.lineTo(cx - 38, cy + 20);
    sourceCtx.lineTo(cx - 38, cy - 20);
    sourceCtx.closePath();
    sourceCtx.stroke();

    sourceCtx.lineWidth = 7;
    sourceCtx.beginPath();
    sourceCtx.moveTo(cx - 20, cy);
    sourceCtx.bezierCurveTo(cx - 20, cy - 18, cx - 7, cy - 28, cx + 10, cy - 28);
    sourceCtx.bezierCurveTo(cx + 21, cy - 28, cx + 28, cy - 22, cx + 31, cy - 13);
    sourceCtx.stroke();

    sourceCtx.beginPath();
    sourceCtx.moveTo(cx + 20, cy);
    sourceCtx.bezierCurveTo(cx + 20, cy + 18, cx + 7, cy + 28, cx - 10, cy + 28);
    sourceCtx.bezierCurveTo(cx - 21, cy + 28, cx - 28, cy + 22, cx - 31, cy + 13);
    sourceCtx.stroke();

    sourceCtx.beginPath();
    sourceCtx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    sourceCtx.fillStyle = "#fff";
    sourceCtx.fill();

    sourceCtx.font = '800 76px "Space Grotesk", Arial, sans-serif';
    sourceCtx.textAlign = "left";
    sourceCtx.textBaseline = "middle";
    sourceCtx.fillStyle = "#fff";
    sourceCtx.fillText("SUPPORTIQ", 360, 125);

    const data = sourceCtx.getImageData(0, 0, W, H);
    const targets = [];
    const step = 4;

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const i = (y * W + x) * 4;
        if (data.data[i + 3] > 100) {
          const isIcon = x < 345;
          targets.push({
            x,
            y,
            phase: isIcon ? "icon" : "word",
          });
        }
      }
    }

    particles = targets.map((target) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 320 + Math.random() * 430;
      const color = palette[Math.floor(Math.random() * palette.length)];

      return {
        x: W / 2 + Math.cos(angle) * radius,
        y: H / 2 + Math.sin(angle) * radius,
        tx: target.x,
        ty: target.y,
        size: Math.random() * 1.35 + 0.55,
        delay:
          target.phase === "icon"
            ? Math.random() * 520
            : 700 + Math.random() * 650,
        color,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const animate = (time) => {
      const elapsed = time - start;

      ctx.clearRect(0, 0, W, H);

      particles.forEach((particle) => {
        const local = Math.min(
          Math.max((elapsed - particle.delay) / 1750, 0),
          1
        );

        const ease = 1 - Math.pow(1 - local, 3);
        particle.x += (particle.tx - particle.x) * ease * 0.075;
        particle.y += (particle.ty - particle.y) * ease * 0.075;

        const [r, g, b] = particle.color;
        const pulse =
          Math.sin(time * 0.0022 + particle.phase) * 0.28;

        ctx.beginPath();
        ctx.arc(
          particle.x,
          particle.y,
          Math.max(0.35, particle.size + pulse),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(${r},${g},${b},${0.28 + local * 0.72})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${r},${g},${b},0.75)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (elapsed > 3300 && !finished) {
        finished = true;
        setTimeout(onComplete, 250);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [onComplete]);

  return (
    <div
      className={`particle-formation ${
        complete ? "formation-complete" : ""
      }`}
    >
      <canvas ref={canvasRef} />
      <div className="formation-glow" />
    </div>
  );
}


function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting
          ) {
            setVisible(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.12,
        }
      );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () =>
      observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${
        visible ? "visible" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function ActivityGraph() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`activity-card glass-card ${active ? "chart-active" : ""}`}>

      <div className="card-top">
        <div>
          <small>
            SUPPORT ACTIVITY
          </small>

          <strong>
            24.8%
          </strong>
        </div>

        <span>
          30 DAYS
        </span>
      </div>

      <svg
        viewBox="0 0 700 300"
        className="activity-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="activityFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#a970ff"
              stopOpacity=".3"
            />

            <stop
              offset="100%"
              stopColor="#a970ff"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <path
          className="graph-fill"
          d="M0 245 C70 220 95 190 145 205 C205 225 220 145 280 170 C340 195 390 75 450 120 C510 160 540 80 590 100 C640 120 670 65 700 35 L700 300 L0 300 Z"
        />

        <path
          className="graph-line"
          d="M0 245 C70 220 95 190 145 205 C205 225 220 145 280 170 C340 195 390 75 450 120 C510 160 540 80 590 100 C640 120 670 65 700 35"
        />
      </svg>

      <div className="graph-axis">
        <span>01</span>
        <span>07</span>
        <span>14</span>
        <span>21</span>
        <span>30</span>
      </div>
    </div>
  );
}

function SentimentDonut() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`sentiment-card glass-card ${active ? "chart-active" : ""}`}>

      <small>
        CUSTOMER SENTIMENT
      </small>

      <div className="donut-chart">

        <div className="donut-inner">
          <strong>
            68%
          </strong>

          <span>
            Positive
          </span>
        </div>

      </div>

      <div className="legend">

        <div>
          <i className="purple-dot" />
          Positive
          <b>68%</b>
        </div>

        <div>
          <i className="pink-dot" />
          Neutral
          <b>21%</b>
        </div>

        <div>
          <i className="blue-dot" />
          Negative
          <b>11%</b>
        </div>

      </div>
    </div>
  );
}

function LandingPage() {
  const [logoDone, setLogoDone] =
    useState(false);

  // Keep scrolling responsive: pause decorative motion while the user is
  // actively scrolling, then let the cinematic effects gently resume.
  useEffect(() => {
    let timer;
    const onScroll = () => {
      document.documentElement.classList.add("is-scrolling");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        document.documentElement.classList.remove("is-scrolling");
      }, 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const [launching, setLaunching] =
    useState(false);

  const launchDashboard = () => {
    // Always start from the authentication gate when entering
    // the Command Center from the public landing page.
    localStorage.removeItem("supportiq_token");
    localStorage.removeItem("supportiq_user");

    setLaunching(true);

    setTimeout(() => {
      window.location.href = "/dashboard/login";
    }, 700);
  };

  return (
    <main className="supportiq-site">
      <AnimatedBackground />

      {/* =================================================
          ONE CONTINUOUS HERO
      ================================================= */}

      <section className="hero">

        <div className="hero-ambient ambient-a" />
        <div className="hero-ambient ambient-b" />
        <div className="hero-ambient ambient-c" />

        <ParticleFormation
          complete={logoDone}
          onComplete={() =>
            setLogoDone(true)
          }
        />

        {/* NAVIGATION EXISTS FROM THE BEGINNING */}

        <header
          className={`navbar ${
            logoDone
              ? "navbar-visible"
              : ""
          }`}
        >

          <div className="brand">

            <div className="brand-symbol">
              <LogoMark />
            </div>

            <div>
              <strong>
                SUPPORTIQ
              </strong>

              <small>
                INTELLIGENCE PLATFORM
              </small>
            </div>

          </div>

          <button
            className="dashboard-button"
            onClick={
              launchDashboard
            }
          >
            Launch Dashboard

            <span>
              ↗
            </span>
          </button>

        </header>

        {/* The particle-built logo is the only central hero logo.
            It settles upward after formation; no second logo is created. */}

        <div
          className={`hero-copy ${
            logoDone ? "hero-copy-visible" : ""
          }`}
        >
          <div className="hero-badge">
            <i />
            AI CUSTOMER SUPPORT INTELLIGENCE
          </div>

          <h1>
            Every support signal.
            <span>One intelligent layer.</span>
          </h1>

          <p>
            SupportIQ turns everyday customer conversations into
            structured intelligence — revealing intent, urgency,
            sentiment and impact so teams can act with clarity.
          </p>

          <div className="hero-metrics">
            <div>
              <strong>99.53%</strong>
              <span>CATEGORY ACCURACY</span>
            </div>

            <div>
              <strong>97.84%</strong>
              <span>PRIORITY ACCURACY</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>ASSISTED ANALYSIS</span>
            </div>
          </div>
        </div>

        <div className="scroll-hint">
          <span />
          SCROLL TO DISCOVER
        </div>

      </section>

      {/* =================================================
          STORY
      ================================================= */}

      <section className="story-section">

        <Reveal>

          <div className="section-label">
            01 / THE IDEA
          </div>

          <h2>
            A support ticket
            <br />
            is more than a message.
          </h2>

          <div className="story-columns">

            <p className="story-highlight">
              Every interaction contains
              signals about urgency,
              sentiment, impact and intent.
            </p>

            <p>
              SupportIQ brings those signals
              together and turns them into
              structured intelligence that
              support teams can understand
              and act on.
              <br />
              <br />
              Instead of treating every ticket
              equally, teams gain another layer
              of context before deciding what
              happens next.
            </p>

          </div>

        </Reveal>

      </section>

      {/* =================================================
          ANALYTICS
      ================================================= */}

      <section className="analytics-section">

        <Reveal>

          <div className="section-label">
            02 / SEE THE SIGNAL
          </div>

          <h2>
            Support data,
            <br />
            <span>made visible.</span>
          </h2>

          <div className="analytics-layout">

            <ActivityGraph />

            <SentimentDonut />

          </div>

          <div className="signal-card-grid">
            <div className="signal-mini signal-cyan">
              <span>MODEL SIGNALS</span>
              <strong>03</strong>
              <small>category · priority · sentiment</small>
            </div>
            <div className="signal-mini signal-pink">
              <span>CATEGORY MODEL</span>
              <strong>99.53%</strong>
              <small>held-out test accuracy</small>
            </div>
            <div className="signal-mini signal-violet">
              <span>PRIORITY MODEL</span>
              <strong>97.84%</strong>
              <small>held-out test accuracy</small>
            </div>
            <div className="signal-mini signal-teal">
              <span>AI WORKFLOW</span>
              <strong>READY</strong>
              <small>structured support intelligence</small>
            </div>
          </div>

          <div className="floating-insight insight-one">
            <span>AI SIGNAL</span>
            High priority detected
          </div>

          <div className="floating-insight insight-two">
            <span>LIVE INSIGHT</span>
            Sentiment trending positive
          </div>

        </Reveal>

      </section>

      {/* =================================================
          WORKFLOW
      ================================================= */}

      <section className="workflow-section">

        <Reveal>

          <div className="section-label">
            03 / HOW IT WORKS
          </div>

          <h2>
            From incoming request
            <br />
            to intelligent action.
          </h2>

          <div className="workflow">

            <div className="workflow-card">
              <small>01</small>
              <div>✦</div>
              <h3>
                Customer request
              </h3>
              <p>
                A customer submits a
                support request.
              </p>
            </div>

            <div className="workflow-line" />

            <div className="workflow-card highlighted">
              <small>02</small>
              <div>◈</div>
              <h3>
                AI analysis
              </h3>
              <p>
                SupportIQ identifies
                category, priority and
                sentiment.
              </p>
            </div>

            <div className="workflow-line" />

            <div className="workflow-card">
              <small>03</small>
              <div>↗</div>
              <h3>
                Intelligent action
              </h3>
              <p>
                Teams receive structured
                information for faster
                decisions.
              </p>
            </div>

          </div>

        </Reveal>

      </section>

      {/* =================================================
          FEATURES
      ================================================= */}

      <section className="features-section">

        <Reveal>

          <div className="section-label">
            04 / CAPABILITIES
          </div>

          <h2>
            Intelligence across
            <br />
            the entire support flow.
          </h2>

        </Reveal>

        <div className="feature-list">

          {features.map(
            (feature) => (
              <Reveal
                key={feature.no}
                className="feature-row"
              >

                <span>
                  {feature.no}
                </span>

                <div className="feature-icon">
                  {feature.icon}
                </div>

                <h3>
                  {feature.title}
                </h3>

                <p>
                  {feature.text}
                </p>

                <b>
                  ↗
                </b>

              </Reveal>
            )
          )}

        </div>

      </section>

      {/* =================================================
          PERFORMANCE
      ================================================= */}

      <section className="performance-section">

        <Reveal>

          <div className="section-label">
            05 / AI PERFORMANCE
          </div>

          <h2>
            Built with models
            <br />
            you can measure.
          </h2>

          <p className="performance-copy">
            SupportIQ uses specialized machine-learning
            models for category classification and
            priority prediction.
          </p>

          <div className="performance-grid">

            <div className="performance-card">

              <small>
                CATEGORY CLASSIFICATION
              </small>

              <strong>
                99.53
                <em>%</em>
              </strong>

              <span>
                TF-IDF + LinearSVC
              </span>

              <div className="bars">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

            </div>

            <div className="performance-card pink">

              <small>
                PRIORITY PREDICTION
              </small>

              <strong>
                97.84
                <em>%</em>
              </strong>

              <span>
                CatBoost Classifier
              </span>

              <div className="radar">
                <i />
              </div>

            </div>

          </div>

          <p className="test-note">
            Evaluated on held-out test data.
          </p>

        </Reveal>

      </section>

      {/* =================================================
          PEOPLE
      ================================================= */}

      <section className="people-section">

        <Reveal>

          <div className="section-label">
            06 / HUMAN + AI
          </div>

          <h2>
            Technology should
            <br />
            strengthen the conversation.
          </h2>

          <div className="people-scene">

            <div className="floating-ticket ticket-left">

              <div className="avatar purple">
                AK
              </div>

              <div>
                <strong>
                  Customer
                </strong>

                <span>
                  Payment issue
                </span>
              </div>

              <b>
                HIGH
              </b>

            </div>

            <div className="ai-orbit">

              <div className="ai-logo">
                <LogoMark />
              </div>

              <strong>
                SUPPORTIQ
              </strong>

              <span>
                ANALYZING SIGNALS
              </span>

            </div>

            <div className="floating-ticket ticket-right">

              <div className="avatar pink">
                RS
              </div>

              <div>
                <strong>
                  Support team
                </strong>

                <span>
                  Response ready
                </span>
              </div>

              <b>
                READY
              </b>

            </div>

          </div>

        </Reveal>

      </section>

      {/* =================================================
          BUSINESS
      ================================================= */}

      <section className="business-section">

        <Reveal>

          <div className="section-label">
            07 / WHY IT MATTERS
          </div>

          <h2>
            Less manual triage.
            <br />
            More intelligent support.
          </h2>

          <div className="business-grid">

            <article>
              <span>01</span>
              <h3>Faster</h3>
              <p>
                Surface important customer
                issues sooner.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Smarter</h3>
              <p>
                Add AI-assisted intelligence
                to everyday support decisions.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Clearer</h3>
              <p>
                See category, urgency and
                sentiment together.
              </p>
            </article>

            <article>
              <span>04</span>
              <h3>Scalable</h3>
              <p>
                Create a consistent intelligence
                layer for growing support teams.
              </p>
            </article>

          </div>

        </Reveal>

      </section>

      {/* =================================================
          FINAL
      ================================================= */}

      <section className="final-section">

        <div className="final-light" />

        <Reveal>

          <div className="final-logo">
            <LogoMark />
          </div>

          <div className="section-label">
            SUPPORT INTELLIGENCE
          </div>

          <h2>
            Turn support data
            <br />
            into intelligence.
          </h2>

          <p>
            Your support command center is ready.
          </p>

          <button
            className="final-launch"
            onClick={
              launchDashboard
            }
          >
            Launch Dashboard
            <span>
              ↗
            </span>
          </button>

        </Reveal>

      </section>

      <footer>
        <span>SUPPORTIQ</span>
        <span>AI CUSTOMER SUPPORT INTELLIGENCE</span>
        <span>2026</span>
      </footer>

      {/* DASHBOARD TRANSITION ONLY AFTER CLICK */}

      {launching && (
        <div className="launch-overlay">

          <div className="launch-radiance" />

          <div className="launch-center">

            <div>
              <LogoMark />
            </div>

            <strong>
              SUPPORTIQ
            </strong>

            <span>
              INITIALIZING COMMAND CENTER
            </span>

            <div className="loading-line">
              <i />
            </div>

          </div>

          <div className="launch-curtain left" />
          <div className="launch-curtain right" />

        </div>
      )}

    </main>
  );
}



/* ============================================================
   AUTH — GLASS COMMAND ACCESS
   ============================================================ */

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMode("login");
        setError("Account created. Sign in to open your command center.");
      } else {
        const data = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });

        localStorage.setItem("supportiq_token", data.access_token);
        localStorage.setItem("supportiq_user", JSON.stringify(data.user));
        onAuthenticated(data.user);
      }
    } catch (err) {
      setError(err.message || "Unable to complete the request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-bg-grid" />
      <div className="auth-orb auth-orb-a" />
      <div className="auth-orb auth-orb-b" />
      <div className="auth-orb auth-orb-c" />

      <button
        className="auth-back"
        type="button"
        onClick={() => (window.location.href = "/")}
      >
        ← Back to SupportIQ
      </button>

      <section className="auth-card panel">
        <div className="auth-card-glow" />

        <div className="auth-brand">
          <div className="auth-brand-mark">
            <LogoMark />
          </div>
          <div>
            <strong>SUPPORTIQ</strong>
            <small>COMMAND CENTER</small>
          </div>
          <span className="auth-status">
            <i />
            SECURE
          </span>
        </div>

        <div className="auth-heading">
          <span className="auth-kicker">
            {mode === "login" ? "SECURE ACCESS" : "CREATE ACCOUNT"}
          </span>
          <h1>
            {mode === "login" ? (
              <>Welcome <span>back.</span></>
            ) : (
              <>Build your <span>command center.</span></>
            )}
          </h1>
          <p>
            {mode === "login"
              ? "Sign in to analyze customer support signals with SupportIQ."
              : "Create your SupportIQ workspace and start turning conversations into intelligence."}
          </p>
        </div>

        <div className="auth-mode-switch">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create account
          </button>
        </div>

        {error && <div className="auth-alert">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>
              <span>NAME</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            <span>EMAIL ADDRESS</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>PASSWORD</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          <button className="auth-submit" disabled={loading}>
            <span>
              {loading
                ? "Connecting..."
                : mode === "login"
                  ? "Enter command center"
                  : "Create my workspace"}
            </span>
            <b>↗</b>
          </button>
        </form>

        <div className="auth-footer">
          <span><i /> AI systems operational</span>
          <span>256-bit secure session</span>
        </div>
      </section>
    </main>
  );
}


/* ============================================================
   DASHBOARD — SUPPORTIQ COMMAND CENTER
   ============================================================ */

function Dashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("supportiq_user") || "null");
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("overview");
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [error, setError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  const token = localStorage.getItem("supportiq_token");

  const authFetch = async (path, options = {}) =>
    apiFetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("supportiq_token")}`,
        ...(options.headers || {}),
      },
    });

  const loadTickets = async () => {
    if (!localStorage.getItem("supportiq_token")) return;
    setTicketsLoading(true);

    try {
      const data = await authFetch("/api/tickets");
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch (err) {
      setError(err.message || "Unable to load tickets.");
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadTickets();
  }, [token]);

  const logout = () => {
    localStorage.removeItem("supportiq_token");
    localStorage.removeItem("supportiq_user");
    window.location.href = "/";
  };

  const runAnalysis = async (createTicket = false) => {
    if (!subject.trim() || !message.trim()) {
      setError("Please enter both a subject and customer message.");
      return;
    }

    setLoading(true);
    setError("");
    setAlert("");
    setAnalysis(null);

    try {
      const endpoint = createTicket ? "/api/tickets" : "/api/tickets/analyze";

      const data = await authFetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          description: message.trim(),
        }),
      });

      setAnalysis(data.analysis || data);
      setAlert(
        createTicket
          ? "Ticket created and analyzed successfully."
          : "AI analysis completed successfully."
      );

      if (createTicket) await loadTickets();
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const firstLetter = user?.name?.trim()?.charAt(0)?.toUpperCase() || "A";

  if (!token || !user) {
    return (
      <AuthPanel
        onAuthenticated={(nextUser) => {
          setUser(nextUser);
        }}
      />
    );
  }

  const nav = [
    ["overview", "Overview", "◈"],
    ["analyze", "Analyze Complaint", "✦"],
    ["tickets", "Tickets", "▱"],
    ["analytics", "Analytics", "⌁"],
    ["models", "Model Intelligence", "◌"],
    ["agent", "AI Agent", "✧"],
    ["settings", "Settings", "⚙"],
  ];

  const notifications = [
    {
      title: "AI systems operational",
      text: "Category and priority models are ready.",
      time: "NOW",
      tone: "violet",
    },
    ...(analysis
      ? [{
          title: "Analysis completed",
          text: "A customer support signal was successfully processed.",
          time: "JUST NOW",
          tone: "cyan",
        }]
      : []),
    ...(tickets.length
      ? [{
          title: `${tickets.length} ticket${tickets.length === 1 ? "" : "s"} in workspace`,
          text: "Your latest support records are available.",
          time: "LIVE",
          tone: "pink",
        }]
      : []),
  ];

  const changePage = (nextPage) => {
    setPage(nextPage);
    setAlert("");
    setError("");
    setNotificationsOpen(false);
    setAgentOpen(false);
  };

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <button className="dashboard-brand" onClick={() => changePage("overview")}>
          <div className="dashboard-brand-mark">
            <LogoMark />
          </div>
          <div>
            <strong>SUPPORTIQ</strong>
            <span>COMMAND CENTER</span>
          </div>
        </button>

        <div className="sidebar-live-strip">
          <i />
          <div>
            <b>AI ENGINE</b>
            <span>Operational</span>
          </div>
          <em>LIVE</em>
        </div>

        <nav className="dashboard-nav">
          <small>WORKSPACE</small>
          {nav.map(([key, label, icon]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              onClick={() => changePage(key)}
            >
              <span>{icon}</span>
              <strong>{label}</strong>
              {key === "agent" && <em>AI</em>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-insight">
            <span>MODEL SIGNALS</span>
            <strong>99.53% <small>category</small></strong>
            <strong>97.84% <small>priority</small></strong>
            <div className="mini-signal-bars">
              <i /><i /><i /><i /><i /><i /><i />
            </div>
          </div>

          <button className="sidebar-logout" onClick={logout}>
            <span>↗</span> Sign out
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-title">
            <span className="dashboard-breadcrumb">
              COMMAND CENTER / {page.replace("-", " ").toUpperCase()}
            </span>
            <h1>
              {page === "overview"
                ? "Overview"
                : page === "analyze"
                  ? "Analyze Complaint"
                  : page === "tickets"
                    ? "Tickets"
                    : page === "analytics"
                      ? "Analytics"
                      : page === "models"
                        ? "Model Intelligence"
                        : page === "agent"
                          ? "AI Agent"
                          : "Settings"}
            </h1>
          </div>

          <div className="dashboard-header-actions">
            <button
              className={`header-icon-button ${notificationsOpen ? "active" : ""}`}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setAgentOpen(false);
              }}
              aria-label="Notifications"
            >
              ◇
              <i className="notification-dot" />
            </button>

            <button
              className={`header-icon-button ${agentOpen ? "active" : ""}`}
              onClick={() => {
                setAgentOpen(!agentOpen);
                setNotificationsOpen(false);
              }}
              aria-label="AI Agent"
            >
              ✦
            </button>

            <div className="dashboard-user">
              <div className="dashboard-avatar">{firstLetter}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button
                className="dashboard-exit"
                onClick={() => changePage("settings")}
                aria-label="Open account settings"
                title="Account settings"
              >
                ⚙
              </button>
            </div>
          </div>

          {notificationsOpen && (
            <div className="header-popover notifications-popover">
              <div className="popover-head">
                <div>
                  <span>INBOX</span>
                  <h3>Notifications</h3>
                </div>
                <b>{notifications.length}</b>
              </div>
              <div className="notification-list">
                {notifications.map((item, index) => (
                  <div className="notification-item" key={`${item.title}-${index}`}>
                    <i className={`notification-icon ${item.tone}`}>✦</i>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                    <small>{item.time}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {agentOpen && (
            <div className="header-popover agent-popover">
              <div className="agent-popover-orb">✦</div>
              <div>
                <span>SUPPORTIQ AI AGENT</span>
                <h3>What should we analyze?</h3>
                <p>Jump directly into the AI analysis workspace.</p>
                <button
                  className="dashboard-primary-button compact"
                  onClick={() => changePage("analyze")}
                >
                  Open AI analyzer ↗
                </button>
              </div>
            </div>
          )}
        </header>

        <div className="dashboard-content">
          {alert && (
            <div className="dashboard-success">
              <span>✦</span>
              {alert}
              <button onClick={() => setAlert("")}>×</button>
            </div>
          )}

          {error && (
            <div className="dashboard-error">
              <span>!</span>
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {/* OVERVIEW */}
          {page === "overview" && (
            <section className="dashboard-page overview-page">
              <div className="overview-hero panel">
                <div className="overview-hero-copy">
                  <div className="hero-status"><i /> AI SUPPORT INTELLIGENCE</div>
                  <h2>
                    See the signal.
                    <br />
                    <span>Act with clarity.</span>
                  </h2>
                  <p>
                    SupportIQ transforms customer conversations into structured
                    intelligence for faster, more confident support decisions.
                  </p>
                  <div className="hero-actions">
                    <button
                      className="dashboard-primary-button"
                      onClick={() => changePage("analyze")}
                    >
                      Analyze complaint ↗
                    </button>
                    <button
                      className="dashboard-secondary-button"
                      onClick={() => changePage("tickets")}
                    >
                      View tickets
                    </button>
                  </div>
                </div>

                <div className="overview-visual">
                  <div className="overview-orbit orbit-one" />
                  <div className="overview-orbit orbit-two" />
                  <div className="overview-core">
                    <LogoMark />
                    <span>AI</span>
                  </div>
                  <div className="orbit-chip chip-a">INTENT</div>
                  <div className="orbit-chip chip-b">URGENCY</div>
                  <div className="orbit-chip chip-c">SENTIMENT</div>
                </div>
              </div>

              <div className="overview-stat-grid">
                <div className="overview-stat panel accent-violet">
                  <div className="stat-icon">◈</div>
                  <div>
                    <span>CATEGORY MODEL</span>
                    <strong>99.53%</strong>
                    <small>held-out test accuracy</small>
                  </div>
                  <i className="stat-spark" />
                </div>

                <div className="overview-stat panel accent-cyan">
                  <div className="stat-icon">↗</div>
                  <div>
                    <span>PRIORITY MODEL</span>
                    <strong>97.84%</strong>
                    <small>held-out test accuracy</small>
                  </div>
                  <i className="stat-spark" />
                </div>

                <div className="overview-stat panel accent-pink">
                  <div className="stat-icon">▱</div>
                  <div>
                    <span>WORKSPACE TICKETS</span>
                    <strong>{tickets.length}</strong>
                    <small>stored support records</small>
                  </div>
                  <i className="stat-spark" />
                </div>

                <div className="overview-stat panel accent-teal">
                  <div className="stat-icon">✦</div>
                  <div>
                    <span>AI WORKFLOW</span>
                    <strong>READY</strong>
                    <small>classification + prioritization</small>
                  </div>
                  <i className="stat-spark" />
                </div>
              </div>

              <div className="overview-feature-grid">
                <div className="panel overview-flow-card">
                  <div className="panel-title">
                    <div>
                      <span>INTELLIGENCE FLOW</span>
                      <h3>From message to decision.</h3>
                    </div>
                    <b>LIVE</b>
                  </div>

                  <div className="flow-track">
                    <div className="flow-node">
                      <i>01</i>
                      <strong>Customer</strong>
                      <span>Conversation</span>
                    </div>
                    <div className="flow-connector"><i /></div>
                    <div className="flow-node active">
                      <i>02</i>
                      <strong>SupportIQ</strong>
                      <span>AI analysis</span>
                    </div>
                    <div className="flow-connector"><i /></div>
                    <div className="flow-node">
                      <i>03</i>
                      <strong>Team</strong>
                      <span>Action</span>
                    </div>
                  </div>
                </div>

                <div className="panel overview-agent-card">
                  <div className="agent-card-glow" />
                  <div className="agent-card-icon">✦</div>
                  <span>AI AGENT</span>
                  <h3>Your support copilot.</h3>
                  <p>
                    Start an analysis, inspect a signal or move directly to
                    the ticket workspace.
                  </p>
                  <button
                    className="dashboard-secondary-button"
                    onClick={() => changePage("agent")}
                  >
                    Open AI Agent ↗
                  </button>
                </div>

                <div className="panel overview-model-card">
                  <div className="panel-title">
                    <div>
                      <span>MODEL STACK</span>
                      <h3>Two specialized engines.</h3>
                    </div>
                    <b>ML</b>
                  </div>
                  <div className="model-stack-row">
                    <div><i>01</i><strong>TF-IDF + LinearSVC</strong><span>Category classification</span></div>
                    <b>99.53%</b>
                  </div>
                  <div className="model-stack-row">
                    <div><i>02</i><strong>CatBoost Classifier</strong><span>Priority prediction</span></div>
                    <b>97.84%</b>
                  </div>
                </div>

                <div className="panel overview-activity-card">
                  <div className="panel-title">
                    <div>
                      <span>WORKSPACE ACTIVITY</span>
                      <h3>Support signal pulse.</h3>
                    </div>
                    <b>{tickets.length} TOTAL</b>
                  </div>
                  <div className="pulse-chart">
                    <span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
                  </div>
                  <div className="pulse-footer">
                    <span>Recent ticket activity</span>
                    <strong>LIVE WORKSPACE</strong>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ANALYZE */}
          {page === "analyze" && (
            <section className="dashboard-page">
              <div className="analyze-layout">
                <div className="panel analyze-form-card">
                  <div className="analyze-card-top">
                    <div>
                      <span>AI ANALYZER</span>
                      <h2>Analyze a customer complaint</h2>
                      <p>Extract category, priority, sentiment and response intelligence.</p>
                    </div>
                    <b className="live-model-pill"><i /> LIVE MODEL</b>
                  </div>

                  <label>
                    <span>SUBJECT</span>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Payment failed after checkout"
                    />
                  </label>

                  <label>
                    <span>CUSTOMER MESSAGE</span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Paste the customer's support message here..."
                    />
                  </label>

                  <div className="analyze-actions">
                    <button
                      className="dashboard-primary-button"
                      onClick={() => runAnalysis(false)}
                      disabled={loading}
                    >
                      {loading ? "Analyzing..." : "Run AI analysis ↗"}
                    </button>
                    <button
                      className="dashboard-secondary-button"
                      onClick={() => runAnalysis(true)}
                      disabled={loading}
                    >
                      Analyze + create ticket
                    </button>
                  </div>
                </div>

                <div className="panel analysis-result-card">
                  {!analysis ? (
                    <div className="empty-analysis">
                      <div className="empty-analysis-icon">✦</div>
                      <span>AI SIGNAL ENGINE</span>
                      <h3>Waiting for a signal</h3>
                      <p>
                        Submit a customer message and SupportIQ will return
                        category, priority, sentiment and a suggested response.
                      </p>
                      <div className="empty-signal-row">
                        <b>Category</b><b>Priority</b><b>Sentiment</b>
                      </div>
                    </div>
                  ) : (
                    <div className="analysis-result">
                      <span>AI RESULT / SIGNAL DETECTED</span>
                      <h2>Support intelligence ready.</h2>

                      <div className="result-grid">
                        <div><small>CATEGORY</small><strong>{analysis.category || analysis.predicted_category || "Detected"}</strong></div>
                        <div><small>PRIORITY</small><strong>{analysis.priority || analysis.predicted_priority || "Detected"}</strong></div>
                        <div><small>SENTIMENT</small><strong>{analysis.sentiment || "Analyzed"}</strong></div>
                        <div><small>CONFIDENCE</small><strong>{analysis.confidence ? `${Math.round(Number(analysis.confidence) * 100)}%` : "AI"}</strong></div>
                      </div>

                      {analysis.suggested_response && (
                        <div className="suggested-response">
                          <small>SUGGESTED RESPONSE</small>
                          <p>{analysis.suggested_response}</p>
                        </div>
                      )}

                      <div className="analysis-source-card">
                        <span>INPUT SIGNAL</span>
                        <strong>{subject || "Customer support request"}</strong>
                        <p>{message || "Customer message analyzed by SupportIQ."}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* TICKETS */}
          {page === "tickets" && (
            <section className="dashboard-page">
              <div className="tickets-heading panel">
                <div>
                  <span>WORKSPACE / CASE MANAGEMENT</span>
                  <h2>Support tickets</h2>
                  <p>Review customer requests captured in your SupportIQ workspace.</p>
                </div>
                <button className="dashboard-primary-button compact" onClick={() => changePage("analyze")}>
                  New analysis ↗
                </button>
              </div>

              <div className="panel tickets-panel">
                {ticketsLoading ? (
                  <div className="empty-dashboard-state">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div className="empty-dashboard-state">
                    <div className="empty-table-icon">▱</div>
                    <h3>No tickets yet</h3>
                    <p>Analyze your first customer complaint to create a workspace ticket.</p>
                    <button className="dashboard-secondary-button" onClick={() => changePage("analyze")}>
                      Create first ticket ↗
                    </button>
                  </div>
                ) : (
                  <div className="tickets-table">
                    <div className="ticket-row ticket-header">
                      <span>SUBJECT</span>
                      <span>DESCRIPTION</span>
                      <span>STATUS</span>
                      <span>CREATED</span>
                    </div>

                    {tickets.map((ticket) => (
                      <div className="ticket-row" key={ticket._id || ticket.id}>
                        <div className="ticket-subject">
                          <i>✦</i>
                          <strong>{ticket.subject || "Untitled ticket"}</strong>
                        </div>
                        <span className="ticket-description">
                          {ticket.description || "No description provided."}
                        </span>
                        <b className={`ticket-status ${String(ticket.status || "open").toLowerCase()}`}>
                          <i /> {ticket.status || "open"}
                        </b>
                        <span className="ticket-created">
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ANALYTICS */}
          {page === "analytics" && (
            <section className="dashboard-page analytics-dashboard">
              <div className="analytics-top-grid">
                <div className="panel analytics-hero-card">
                  <span>MODEL PERFORMANCE</span>
                  <h2>Measured intelligence.</h2>
                  <p>Two specialized machine-learning systems power SupportIQ's core classification and prioritization workflow.</p>

                  <div className="performance-bars">
                    <div>
                      <header><span>Category / TF-IDF + LinearSVC</span><b>99.53%</b></header>
                      <div><i style={{ width: "99.53%" }} /></div>
                    </div>
                    <div>
                      <header><span>Priority / CatBoost</span><b>97.84%</b></header>
                      <div><i style={{ width: "97.84%" }} /></div>
                    </div>
                  </div>
                </div>

                <div className="panel analytics-score-card">
                  <span>ACCURACY INDEX</span>
                  <div className="score-ring">
                    <div>
                      <strong>98.69</strong>
                      <small>CORE</small>
                    </div>
                  </div>
                  <p>Combined visual index of the two measured model accuracies.</p>
                </div>
              </div>

              <div className="analytics-chart-grid">
                <div className="panel signal-chart-card">
                  <div className="panel-title">
                    <div><span>AI SIGNAL TRAJECTORY</span><h3>Intelligence flow</h3></div>
                    <b>LIVE VIEW</b>
                  </div>
                  <svg className="modern-line-chart" viewBox="0 0 760 290" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="signalFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9d68ff" stopOpacity=".32" />
                        <stop offset="100%" stopColor="#9d68ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path className="chart-grid-line" d="M0 60 H760 M0 130 H760 M0 200 H760" />
                    <path className="chart-fill-path" d="M0 235 C70 218 95 188 150 204 C210 221 230 140 295 160 C360 182 405 90 470 126 C535 160 560 72 620 100 C680 130 705 52 760 38 L760 290 L0 290 Z" />
                    <path className="chart-main-path" d="M0 235 C70 218 95 188 150 204 C210 221 230 140 295 160 C360 182 405 90 470 126 C535 160 560 72 620 100 C680 130 705 52 760 38" />
                    <circle cx="620" cy="100" r="5" className="chart-point" />
                    <circle cx="760" cy="38" r="6" className="chart-point current" />
                  </svg>
                  <div className="chart-labels"><span>INPUT</span><span>TEXT</span><span>CLASSIFY</span><span>PRIORITIZE</span><span>ACTION</span></div>
                </div>

                <div className="panel signal-distribution-card">
                  <div className="panel-title">
                    <div><span>SIGNAL DISTRIBUTION</span><h3>Decision surface</h3></div>
                  </div>
                  <div className="distribution-visual">
                    <div className="distribution-ring">
                      <div><strong>AI</strong><span>SIGNAL</span></div>
                    </div>
                    <div className="distribution-list">
                      <div><i className="v" /><span>Category</span><b>99.53%</b></div>
                      <div><i className="c" /><span>Priority</span><b>97.84%</b></div>
                      <div><i className="p" /><span>Workspace</span><b>{tickets.length}</b></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="analytics-kpi-grid">
                <div className="panel analytics-kpi"><span>CLASSIFICATION</span><strong>99.53%</strong><small>TF-IDF + LinearSVC</small></div>
                <div className="panel analytics-kpi"><span>PRIORITIZATION</span><strong>97.84%</strong><small>CatBoost Classifier</small></div>
                <div className="panel analytics-kpi"><span>WORKSPACE</span><strong>{tickets.length}</strong><small>stored ticket records</small></div>
                <div className="panel analytics-kpi"><span>PIPELINE</span><strong>READY</strong><small>AI analysis workflow</small></div>
              </div>
            </section>
          )}

          {/* MODELS */}
          {page === "models" && (
            <section className="dashboard-page models-dashboard">
              <div className="models-intro panel">
                <div>
                  <span>MODEL INTELLIGENCE / SYSTEM DESIGN</span>
                  <h2>Specialized engines.<br /><em>Measurable results.</em></h2>
                  <p>
                    SupportIQ separates category classification from priority
                    prediction so each model can focus on its specific task.
                  </p>
                </div>
                <div className="models-system-orb"><LogoMark /><span>ML CORE</span></div>
              </div>

              <div className="model-card-grid">
                <article className="panel model-intelligence-card enhanced-model violet">
                  <div className="model-card-head">
                    <span>01 / CATEGORY</span><b>TEXT MODEL</b>
                  </div>
                  <strong>99.53<em>%</em></strong>
                  <h3>TF-IDF + LinearSVC</h3>
                  <p>Converts customer language into TF-IDF features and classifies the most relevant support category.</p>
                  <div className="model-visual">
                    <i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                  <footer><span>HELD-OUT TEST ACCURACY</span><b>99.53%</b></footer>
                </article>

                <article className="panel model-intelligence-card enhanced-model pink">
                  <div className="model-card-head">
                    <span>02 / PRIORITY</span><b>STRUCTURED MODEL</b>
                  </div>
                  <strong>97.84<em>%</em></strong>
                  <h3>CatBoost Classifier</h3>
                  <p>Uses structured support-ticket signals to predict High, Medium and Low priority.</p>
                  <div className="model-visual model-visual-pink">
                    <i /><i /><i /><i /><i /><i /><i /><i />
                  </div>
                  <footer><span>HELD-OUT TEST ACCURACY</span><b>97.84%</b></footer>
                </article>
              </div>

              <div className="model-design-grid">
                <div className="panel model-design-card">
                  <span>PIPELINE</span>
                  <h3>How the intelligence layer works.</h3>
                  <div className="model-pipeline">
                    <div><b>01</b><strong>Customer text</strong><span>Raw support conversation</span></div>
                    <i>→</i>
                    <div><b>02</b><strong>Feature extraction</strong><span>Text + structured signals</span></div>
                    <i>→</i>
                    <div><b>03</b><strong>Prediction</strong><span>Category + priority</span></div>
                  </div>
                </div>

                <div className="panel model-design-note">
                  <span>DESIGN PRINCIPLE</span>
                  <div className="principle-icon">✦</div>
                  <h3>Measure the model.<br />Improve the workflow.</h3>
                  <p>Model accuracy stays visible inside the command center so performance remains part of the product experience.</p>
                </div>
              </div>

              <p className="test-note">Evaluated on held-out test data.</p>
            </section>
          )}

          {/* AI AGENT */}
          {page === "agent" && (
            <section className="dashboard-page agent-dashboard">
              <div className="agent-main-card panel">
                <div className="agent-header">
                  <div className="agent-avatar-large"><LogoMark /></div>
                  <div>
                    <span>SUPPORTIQ AI AGENT</span>
                    <h2>Your intelligent support copilot.</h2>
                    <p>Use the command center to move from a customer message to structured support intelligence.</p>
                  </div>
                  <div className="agent-live-badge"><i /> ONLINE</div>
                </div>

                <div className="agent-conversation">
                  <div className="agent-message system">
                    <div className="agent-mini-avatar">✦</div>
                    <div><span>SUPPORTIQ</span><p>Hello {user.name?.split(" ")[0] || "there"}. I can guide you to the right support workflow.</p></div>
                  </div>

                  <div className="agent-command-grid">
                    <button onClick={() => changePage("analyze")}><b>✦</b><strong>Analyze a complaint</strong><span>Classify and prioritize a customer message.</span>↗</button>
                    <button onClick={() => changePage("tickets")}><b>▱</b><strong>Inspect tickets</strong><span>Review your stored support records.</span>↗</button>
                    <button onClick={() => changePage("analytics")}><b>⌁</b><strong>View intelligence</strong><span>Explore model performance signals.</span>↗</button>
                    <button onClick={() => changePage("models")}><b>◌</b><strong>Understand models</strong><span>See how the ML layer is built.</span>↗</button>
                  </div>
                </div>

                <div className="agent-input-shell">
                  <input placeholder="Ask the SupportIQ agent what you want to do..." readOnly />
                  <button onClick={() => changePage("analyze")}>✦</button>
                </div>
                <small className="agent-disclaimer">AI Agent workspace · actions open the connected SupportIQ workflows</small>
              </div>
            </section>
          )}

          {/* SETTINGS */}
          {page === "settings" && (
            <section className="dashboard-page settings-dashboard">
              <div className="settings-hero panel">
                <div>
                  <span>ACCOUNT / WORKSPACE IDENTITY</span>
                  <h2>Everything in<br /><em>one place.</em></h2>
                  <p>Manage your SupportIQ identity and review the current AI workspace status.</p>
                </div>
                <div className="settings-avatar-stage">
                  <div className="settings-avatar">{firstLetter}</div>
                  <span>ACTIVE USER</span>
                </div>
              </div>

              <div className="settings-grid">
                <div className="panel settings-profile-card">
                  <span>PROFILE</span>
                  <h3>Workspace identity</h3>
                  <div className="settings-field"><small>FULL NAME</small><strong>{user.name}</strong></div>
                  <div className="settings-field"><small>EMAIL ADDRESS</small><strong>{user.email}</strong></div>
                  <div className="settings-field"><small>ROLE</small><strong>{user.role || "user"}</strong></div>
                </div>

                <div className="panel settings-status-card">
                  <span>SYSTEM STATUS</span>
                  <h3>SupportIQ is ready.</h3>
                  <div className="settings-status-row"><i /> <div><strong>AI engine</strong><span>Operational</span></div><b>LIVE</b></div>
                  <div className="settings-status-row"><i /> <div><strong>Category model</strong><span>99.53% held-out accuracy</span></div><b>READY</b></div>
                  <div className="settings-status-row"><i /> <div><strong>Priority model</strong><span>97.84% held-out accuracy</span></div><b>READY</b></div>
                </div>

                <div className="panel settings-preference-card">
                  <span>WORKSPACE PREFERENCES</span>
                  <h3>Command center behavior.</h3>
                  <div className="preference-row"><div><strong>AI notifications</strong><span>Show workspace activity in the header.</span></div><b className="toggle on"><i /></b></div>
                  <div className="preference-row"><div><strong>Glass interface</strong><span>Use the polished command-center visual system.</span></div><b className="toggle on"><i /></b></div>
                  <div className="preference-row"><div><strong>Live model status</strong><span>Keep AI readiness visible across the workspace.</span></div><b className="toggle on"><i /></b></div>
                </div>

                <div className="panel settings-security-card">
                  <span>SESSION</span>
                  <h3>Secure access.</h3>
                  <p>Your authenticated session is stored locally in this browser and used for protected SupportIQ requests.</p>
                  <button className="dashboard-secondary-button" onClick={logout}>Sign out securely ↗</button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}


/* ============================================================
   ROUTING
   ============================================================ */

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  // Public landing page.
  if (path === "/") {
    return <LandingPage />;
  }

  // Explicit authentication gate.
  // Launch Dashboard always lands here before the protected workspace.
  if (path === "/dashboard/login" || path === "/login") {
    return (
      <AuthPanel
        onAuthenticated={() => {
          window.location.href = "/dashboard";
        }}
      />
    );
  }

  // Protected Command Center.
  // Dashboard itself checks localStorage and renders AuthPanel when
  // somebody reaches /dashboard without a valid local session.
  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    return <Dashboard />;
  }

  // Unknown routes return to the public landing page.
  return <LandingPage />;
}

export default App;
