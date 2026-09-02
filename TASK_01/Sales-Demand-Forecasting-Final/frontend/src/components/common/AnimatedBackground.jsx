function AnimatedBackground() {
  return (
    <div className="animated-background" aria-hidden="true">

      <div className="bg-grid" />

      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />
      <div className="ambient-glow glow-three" />

      <div className="light-beam beam-one" />
      <div className="light-beam beam-two" />

      <div className="forecast-visual">
        <svg
          className="forecast-svg"
          viewBox="0 0 700 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="forecastLine"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#b8ed28" stopOpacity="0.05" />
              <stop offset="45%" stopColor="#a8dc18" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#c9f34a" stopOpacity="1" />
            </linearGradient>

            <linearGradient
              id="forecastArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#b8ed28" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#b8ed28" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            className="forecast-area"
            d="
              M0 260
              L45 230
              L85 245
              L125 185
              L170 205
              L215 145
              L255 170
              L300 105
              L345 140
              L390 90
              L435 115
              L480 65
              L525 85
              L575 50
              L620 68
              L700 20
              L700 320
              L0 320
              Z
            "
          />

          <path
            className="forecast-line"
            d="
              M0 260
              L45 230
              L85 245
              L125 185
              L170 205
              L215 145
              L255 170
              L300 105
              L345 140
              L390 90
              L435 115
              L480 65
              L525 85
              L575 50
              L620 68
              L700 20
            "
          />

          <path
            className="forecast-secondary"
            d="
              M0 275
              L60 250
              L120 260
              L180 220
              L240 235
              L300 175
              L360 195
              L420 145
              L480 160
              L540 115
              L610 130
              L700 95
            "
          />

          <circle className="forecast-dot dot-a" cx="125" cy="185" r="5" />
          <circle className="forecast-dot dot-b" cx="300" cy="105" r="5" />
          <circle className="forecast-dot dot-c" cx="480" cy="65" r="5" />
          <circle className="forecast-dot dot-d" cx="620" cy="68" r="5" />
        </svg>
      </div>

      <div className="floating-card floating-card-one">
        <span>DEMAND SIGNAL</span>
        <strong>+18.4%</strong>
        <small>Growth detected</small>
      </div>

      <div className="floating-card floating-card-two">
        <span>MODEL R²</span>
        <strong>95.72%</strong>
        <small>Seasonal HGB-C</small>
      </div>

      <div className="floating-card floating-card-three">
        <span>FORECAST HORIZON</span>
        <strong>30D</strong>
        <small>Live demand projection</small>
      </div>

      <div className="floating-card floating-card-four">
        <span>MAPE</span>
        <strong>3.02%</strong>
        <small>Validation error</small>
      </div>

      <div className="data-particles">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="data-stream stream-one">
        <span>SALES</span>
        <span>DEMAND</span>
        <span>FORECAST</span>
        <span>AI</span>
      </div>

      <div className="data-stream stream-two">
        <span>95.72</span>
        <span>3.02</span>
        <span>30D</span>
        <span>LIVE</span>
      </div>

    </div>
  );
}

export default AnimatedBackground;