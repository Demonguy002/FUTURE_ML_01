import { useEffect, useState } from "react";
import AnimatedBackground from "./components/common/AnimatedBackground";
import CommandCenter from "./components/CommandCenter";
import "./App.css";

const DEMO_EMPLOYEE = {
  id: "FQ-10284",
  password: "forecast123",
  name: "Anirudha",
  role: "Business Intelligence Analyst",
};

function App() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const savedEmployee = localStorage.getItem("forecastiq_employee");

    if (savedEmployee) {
      try {
        const parsed = JSON.parse(savedEmployee);
        setEmployeeId(parsed.id || "");
        setRememberMe(true);
      } catch {
        localStorage.removeItem("forecastiq_employee");
      }
    }
  }, []);

  const getCreatedEmployee = () => {
    const stored = localStorage.getItem("forecastiq_created_employee");

    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();

    setMessage("");

    if (!employeeId.trim() || !password.trim()) {
      setMessage("Please enter your Employee ID and password.");
      return;
    }

    const createdEmployee = getCreatedEmployee();

    const validDemo =
      employeeId.trim().toUpperCase() === DEMO_EMPLOYEE.id &&
      password === DEMO_EMPLOYEE.password;

    const validCreated =
      createdEmployee &&
      employeeId.trim().toUpperCase() ===
        String(createdEmployee.id).toUpperCase() &&
      password === createdEmployee.password;

    if (!validDemo && !validCreated) {
      setMessage(
        "Invalid Employee ID or password. Use FQ-10284 / forecast123 for the demo."
      );
      return;
    }

    const loggedEmployee = validCreated
      ? createdEmployee
      : DEMO_EMPLOYEE;

    setEmployee(loggedEmployee);
    setLoggedIn(true);

    if (rememberMe) {
      localStorage.setItem(
        "forecastiq_employee",
        JSON.stringify({
          id: loggedEmployee.id,
        })
      );
    } else {
      localStorage.removeItem("forecastiq_employee");
    }
  };

  const handleCreateEmployee = (event) => {
    event.preventDefault();

    if (!newName || !newEmployeeId || !newPassword) {
      setMessage("Complete all employee registration fields.");
      return;
    }

    const id = newEmployeeId.trim().toUpperCase();

    if (id === DEMO_EMPLOYEE.id) {
      setMessage("That Employee ID is already registered.");
      return;
    }

    const newEmployee = {
      id,
      password: newPassword,
      name: newName.trim(),
      role: "Employee",
    };

    localStorage.setItem(
      "forecastiq_created_employee",
      JSON.stringify(newEmployee)
    );

    setEmployeeId(id);
    setPassword(newPassword);

    setNewName("");
    setNewEmployeeId("");
    setNewPassword("");

    setShowCreate(false);

    setMessage(
      `Employee ID ${id} created successfully. You can now sign in.`
    );
  };

  const handleForgotPassword = (event) => {
    event.preventDefault();

    setShowForgot(false);
    setMessage(
      "Password recovery request registered. For this demo, contact your administrator."
    );
  };

  if (loggedIn && employee) {
    return (
      <CommandCenter
        employee={employee}
        onLogout={() => {
          setLoggedIn(false);
          setEmployee(null);
        }}
      />
    );
  }

  return (
    <main className="login-page">
      <AnimatedBackground />

      <section className="login-shell">

        {/* LEFT SIDE */}
        <div className="login-showcase">

          {/* FOREGROUND LIVE DEMAND SIGNAL */}
          <div className="foreground-sales-flow" aria-hidden="true">
            <div className="sales-signal-glow" />

            <div className="sales-wave">
              <svg viewBox="0 0 1000 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="liveWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b7ea27" stopOpacity="0" />
                    <stop offset="18%" stopColor="#9ed40b" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#8fc900" stopOpacity="0.9" />
                    <stop offset="82%" stopColor="#9ed40b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#b7ea27" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  className="sales-wave-shadow"
                  d="M0,98 C45,82 72,112 115,91 S188,48 232,84 S300,128 348,88 S425,55 470,91 S538,122 585,84 S662,49 710,82 S780,119 826,82 S910,55 1000,72"
                />

                <path
                  className="sales-wave-path"
                  d="M0,98 C45,82 72,112 115,91 S188,48 232,84 S300,128 348,88 S425,55 470,91 S538,122 585,84 S662,49 710,82 S780,119 826,82 S910,55 1000,72"
                />

                <path
                  className="sales-wave-path-secondary"
                  d="M0,113 C45,97 72,127 115,106 S188,63 232,99 S300,143 348,103 S425,70 470,106 S538,137 585,99 S662,64 710,97 S780,134 826,97 S910,70 1000,87"
                />
              </svg>
            </div>

            <div className="sales-sprinkles">
              {Array.from({ length: 22 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>

            <div className="sales-scan">
              <span />
            </div>

            <div className="live-demand-badge">
              <i />
              LIVE DEMAND SIGNAL
            </div>
          </div>


          <div className="brand">
            <div className="brand-mark">FQ</div>

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

            <div className="engine-status">
              <i />
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

            <div className="model-metrics">

              <div className="model-metric">
                <strong>95.72%</strong>
                <span>MODEL R²</span>
              </div>

              <div className="metric-divider" />

              <div className="model-metric">
                <strong>3.02%</strong>
                <span>MAPE</span>
              </div>

              <div className="metric-divider" />

              <div className="model-metric">
                <strong>30D</strong>
                <span>FORECAST</span>
              </div>

            </div>

          </div>

          <div className="showcase-footer">
            <span>AI-POWERED FORECASTING</span>
            <b>•</b>
            <span>BUSINESS INTELLIGENCE</span>
            <b>•</b>
            <span>DEMAND ANALYTICS</span>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="login-panel">

          <div className="secure-status">
            <div className="secure-icon">
              <i />
            </div>

            <div>
              <strong>SECURE EMPLOYEE ACCESS</strong>
              <span>
                <i />
                Enterprise authentication
              </span>
            </div>
          </div>

          <div className="login-heading">
            <h2>
              Welcome back<span>.</span>
            </h2>

            <p>
              Sign in to access your company's Sales Intelligence
              Command Center.
            </p>
          </div>

          <form onSubmit={handleLogin}>

            <label>EMPLOYEE ID</label>

            <div className="input-shell">
              <span className="input-icon">ID</span>

              <input
                type="text"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value.toUpperCase());
                  setMessage("");
                }}
                placeholder="e.g. FQ-10284"
                autoComplete="username"
              />
            </div>

            <label>PASSWORD</label>

            <div className="input-shell password-shell">
              <span className="password-dots">
                ••
              </span>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="login-options">

              <label className="remember-option">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />
                <span />
                Remember me
              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={() => {
                  setShowForgot(true);
                  setMessage("");
                }}
              >
                Forgot password?
              </button>

            </div>

            {message && (
              <div className="login-message">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
            >
              <span>Sign in to Command Center</span>

              <span className="login-arrow">
                →
              </span>
            </button>

          </form>

          <div className="create-account">
            <span>New to ForecastIQ?</span>

            <button
              type="button"
              onClick={() => {
                setShowCreate(true);
                setMessage("");
              }}
            >
              Create Employee ID
              <span>→</span>
            </button>
          </div>

          <div className="security-footer">
            <span>⌁</span>
            Your session is protected by enterprise access controls.
          </div>

        </div>

      </section>

      {/* CREATE EMPLOYEE MODAL */}
      {showCreate && (
        <div className="modal-overlay">

          <div className="modal-card">

            <button
              className="modal-close"
              onClick={() => setShowCreate(false)}
            >
              ×
            </button>

            <div className="modal-icon">
              +
            </div>

            <div className="modal-kicker">
              EMPLOYEE ONBOARDING
            </div>

            <h3>
              Create your
              <span> Employee ID.</span>
            </h3>

            <p>
              Set up a local employee profile for this
              Sales Intelligence demo.
            </p>

            <form onSubmit={handleCreateEmployee}>

              <input
                type="text"
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Employee ID e.g. FQ-20481"
                value={newEmployeeId}
                onChange={(e) =>
                  setNewEmployeeId(e.target.value.toUpperCase())
                }
              />

              <input
                type="password"
                placeholder="Create password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <button type="submit">
                Create Employee ID
                <span>→</span>
              </button>

            </form>

            <div className="demo-note">
              Demo ID:
              <strong> FQ-10284</strong>
              <br />
              Demo password:
              <strong> forecast123</strong>
            </div>

          </div>

        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgot && (
        <div className="modal-overlay">

          <div className="modal-card small-modal">

            <button
              className="modal-close"
              onClick={() => setShowForgot(false)}
            >
              ×
            </button>

            <div className="modal-icon">
              ?
            </div>

            <div className="modal-kicker">
              ACCOUNT RECOVERY
            </div>

            <h3>
              Recover access<span>.</span>
            </h3>

            <p>
              Enter your Employee ID and we'll register a
              recovery request for your administrator.
            </p>

            <form onSubmit={handleForgotPassword}>

              <input
                type="text"
                placeholder="Employee ID"
              />

              <button type="submit">
                Request Recovery
                <span>→</span>
              </button>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}

export default App;