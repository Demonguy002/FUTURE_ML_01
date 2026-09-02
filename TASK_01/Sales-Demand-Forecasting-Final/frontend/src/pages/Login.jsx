import { useState } from "react";
import AnimatedBackground from "../components/common/AnimatedBackground";

function Login() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!employeeId.trim() || !password.trim()) {
      return;
    }

    console.log("Employee login:", {
      employeeId,
      rememberMe,
    });

    alert(`Welcome, ${employeeId}`);
  };

  return (
    <main className="login-page">

      <AnimatedBackground />

      <div className="login-shell">

        {/* LEFT BRANDING PANEL */}
        <section className="login-showcase">

          <div className="brand">
            <div className="brand-symbol">
              FQ
            </div>

            <div>
              <div className="brand-name">
                Forecast<span>IQ</span>
              </div>

              <div className="brand-subtitle">
                SALES INTELLIGENCE PLATFORM
              </div>
            </div>
          </div>

          <div className="showcase-content">

            <div className="live-badge">
              <span className="live-dot" />
              INTELLIGENCE ENGINE ONLINE
            </div>

            <h1>
              Turn demand
              <br />
              into <span>decisions.</span>
            </h1>

            <p>
              Predict future sales, understand demand patterns,
              and turn machine learning into business decisions.
            </p>

            <div className="showcase-metrics">

              <div className="mini-metric">
                <strong>95.72%</strong>
                <span>MODEL R²</span>
              </div>

              <div className="metric-divider" />

              <div className="mini-metric">
                <strong>3.02%</strong>
                <span>MAPE</span>
              </div>

              <div className="metric-divider" />

              <div className="mini-metric">
                <strong>30D</strong>
                <span>FORECAST</span>
              </div>

            </div>

          </div>

          <div className="showcase-footer">
            <span>AI-POWERED FORECASTING</span>
            <span>•</span>
            <span>BUSINESS INTELLIGENCE</span>
          </div>

        </section>

        {/* LOGIN PANEL */}
        <section className="login-panel">

          <div className="mobile-brand">
            Forecast<span>IQ</span>
          </div>

          <div className="login-card">

            <div className="card-header">

              <div className="secure-icon">
                <span />
              </div>

              <div>
                <div className="secure-label">
                  SECURE EMPLOYEE ACCESS
                </div>

                <div className="secure-status">
                  <span />
                  Enterprise authentication
                </div>
              </div>

            </div>

            <h2>
              Welcome back<span>.</span>
            </h2>

            <p className="login-description">
              Sign in to access your company's
              Sales Intelligence Command Center.
            </p>

            <form onSubmit={handleSubmit}>

              <div className="field">

                <label htmlFor="employeeId">
                  EMPLOYEE ID
                </label>

                <div className="input-box">

                  <div className="input-prefix">
                    ID
                  </div>

                  <input
                    id="employeeId"
                    type="text"
                    placeholder="e.g. FQ-10284"
                    value={employeeId}
                    onChange={(event) =>
                      setEmployeeId(event.target.value)
                    }
                    autoComplete="username"
                  />

                </div>

              </div>

              <div className="field">

                <label htmlFor="password">
                  PASSWORD
                </label>

                <div className="input-box">

                  <div className="input-prefix password-prefix">
                    ••
                  </div>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              <div className="login-options">

                <label className="remember-option">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                  />

                  <span className="custom-checkbox" />

                  <span>Remember me</span>

                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert("Password recovery will be added later.")
                  }
                >
                  Forgot password?
                </button>

              </div>

              <button
                type="submit"
                className="signin-button"
              >
                <span>Sign in to Command Center</span>

                <span className="signin-arrow">
                  →
                </span>
              </button>

            </form>

            <div className="create-account">

              <span>New to ForecastIQ?</span>

              <button
                type="button"
                onClick={() =>
                  alert("Employee registration will be added next.")
                }
              >
                Create Employee ID
                <span>→</span>
              </button>

            </div>

            <div className="security-note">
              <span>⌁</span>
              Your session is protected by enterprise access controls.
            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

export default Login;