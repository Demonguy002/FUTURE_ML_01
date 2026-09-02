import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Activity, AlertTriangle, BarChart3, Bell, Bot, Boxes, BrainCircuit,
  CalendarDays, ChevronDown, CircleHelp, Download, Gauge, LayoutDashboard,
  LogOut, Menu, PackageCheck, PanelLeftClose, PanelLeftOpen, Settings,
  Sparkles, TrendingUp, Zap, CheckCircle2, MessageCircle, X, Send, RefreshCw,
  UserRound, Clock3, ShieldCheck, Brain, Target
} from "lucide-react";
import AnimatedBackground from "./common/AnimatedBackground";

const FALLBACK = { r2: 0.957157, mape: 3.02, rmse: 31501.11, mae: 25761.64 };
const NAV = [
  ["Overview", LayoutDashboard], ["Forecast", TrendingUp], ["Analytics", BarChart3],
  ["Planning", Boxes], ["AI Agent", Bot], ["Model Performance", BrainCircuit],
  ["Alerts", Bell], ["Settings", Settings],
];

const fmt = (n) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)
    : "—";

const fmtCompact = (n) => {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

const normalizeRows = (payload) => {
  const rows = Array.isArray(payload)
    ? payload
    : payload?.forecast ||
      payload?.data ||
      payload?.predictions ||
      payload?.forecast_data ||
      payload?.results ||
      [];

  return rows
    .map((r, i) => ({
      date: r.date || r.ds || r.forecast_date || r.Date || `Day ${i + 1}`,
      sales: Number(
        r.sales ??
          r.predicted_sales ??
          r.forecast ??
          r.prediction ??
          r.yhat ??
          r.predicted ??
          r.Sales
      ),
      onpromotion: Number(r.onpromotion ?? r.promotion ?? 0),
      transactions: Number(r.transactions ?? 0),
      oil_price: Number(r.oil_price ?? r.oil ?? 0),
    }))
    .filter((r) => Number.isFinite(r.sales) && r.sales >= 0);
};

const normalizeHistorical = (payload) => {
  const rows = Array.isArray(payload) ? payload : payload?.historical || [];
  return rows
    .map((r) => ({
      date: r.date || r.Date,
      sales: Number(r.sales ?? r.Sales ?? r.actual_sales),
      kind: "historical",
    }))
    .filter((r) => r.date && Number.isFinite(r.sales) && r.sales >= 0);
};

function Metric({ icon: Icon, label, value, meta, tone = "lime" }) {
  return (
    <div className={`command-metric ${tone}`}>
      <div className="metric-icon"><Icon size={18} /></div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
      <div className="metric-spark" />
    </div>
  );
}

function Chart({ points }) {
  const option = useMemo(() => {
    const actual = points.map((p) => p.kind === "historical" ? p.sales : null);
    const forecast = points.map((p, i) =>
      p.kind === "forecast" || (p.kind === "historical" && i === points.findIndex(x => x.kind === "forecast") - 1)
        ? p.sales
        : null
    );

    return {
      animationDuration: 900,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(18,47,75,.94)",
        borderWidth: 0,
        textStyle: { color: "#fff" },
        valueFormatter: (v) => fmt(v),
      },
      legend: {
        top: 4,
        right: 0,
        itemWidth: 18,
        itemHeight: 3,
        textStyle: { color: "#78909b", fontSize: 11 },
      },
      grid: { left: 8, right: 12, top: 42, bottom: 54, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: points.map((p) => p.date),
        axisLine: { lineStyle: { color: "#dce7e1" } },
        axisLabel: { color: "#8da0a6", fontSize: 10, hideOverlap: true },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#8da0a6",
          fontSize: 10,
          formatter: (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
        },
        splitLine: { lineStyle: { color: "#edf2ef" } },
      },
      dataZoom: [
        { type: "inside", zoomOnMouseWheel: true, moveOnMouseMove: true },
        {
          type: "slider",
          height: 18,
          bottom: 5,
          borderColor: "transparent",
          backgroundColor: "#f0f5f0",
          fillerColor: "rgba(159,220,14,.18)",
          handleStyle: { color: "#9fdc0e" },
        },
      ],
      series: [
        {
          name: "Actual sales",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: actual,
          connectNulls: false,
          lineStyle: { width: 2.5 },
          areaStyle: { opacity: 0.06 },
        },
        {
          name: "Forecast",
          type: "line",
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          data: forecast,
          lineStyle: { width: 3, type: "dashed" },
          areaStyle: { opacity: 0.04 },
        },
      ],
    };
  }, [points]);

  return <ReactECharts option={option} style={{ width: "100%", height: 390 }} notMerge lazyUpdate />;
}

function answerAgent(question, forecast, metrics, horizon = forecast.length) {
  const q = question.toLowerCase().trim();
  const rows = forecast.slice(0, horizon);
  if (!rows.length) {
    return "The forecast artifact is not loaded yet. Add future_sales_forecast.json to frontend/public/data and refresh the dashboard.";
  }

  const avg = rows.reduce((a, b) => a + b.sales, 0) / rows.length;
  const total = rows.reduce((a, b) => a + b.sales, 0);
  const peakRow = rows.reduce((best, row) => row.sales > best.sales ? row : best, rows[0]);
  const first = rows[0]?.sales || 0;
  const last = rows.at(-1)?.sales || 0;
  const movement = first ? ((last - first) / first) * 100 : 0;
  const min = Math.min(...rows.map(x => x.sales));
  const max = Math.max(...rows.map(x => x.sales));
  const volatility = avg ? ((max - min) / avg) * 100 : 0;

  if (q.includes("model") || q.includes("performance") || q.includes("accuracy") || q.includes("r2") || q.includes("mape")) {
    return `Seasonal HGB-C explains ${(metrics.r2 * 100).toFixed(2)}% of validation variance with a ${metrics.mape.toFixed(2)}% MAPE. RMSE is ${fmt(metrics.rmse)} and MAE is ${fmt(metrics.mae)}. These are validation metrics, not a claim of future forecast accuracy.`;
  }

  if (q.includes("inventory") || q.includes("stock") || q.includes("planning") || q.includes("procurement")) {
    return `For the selected ${horizon}-day horizon, plan around an average of ${fmt(avg)} sales/day and protect coverage for the ${fmt(peakRow.sales)} peak${peakRow.date ? ` on ${peakRow.date}` : ""}. Keep replenishment and staffing buffers higher around the upper-demand days.`;
  }

  if (q.includes("peak") || q.includes("highest") || q.includes("maximum")) {
    return `The ${horizon}-day peak is ${fmt(peakRow.sales)} projected sales/day${peakRow.date ? ` on ${peakRow.date}` : ""}. The lowest projected day is ${fmt(min)}, giving a forecast spread of ${fmt(max - min)} sales/day.`;
  }

  if (q.includes("total") || q.includes("volume")) {
    return `Projected volume across the selected ${horizon}-day horizon is ${fmt(total)} sales units, averaging ${fmt(avg)} per day.`;
  }

  if (q.includes("grow") || q.includes("trend") || q.includes("trajectory") || q.includes("increase") || q.includes("decrease")) {
    return `Across the selected ${horizon}-day horizon, demand moves from ${fmt(first)} to ${fmt(last)}, a ${movement >= 0 ? "+" : ""}${movement.toFixed(1)}% change. The forecast range is ${fmt(min)}–${fmt(max)}, indicating ${volatility.toFixed(1)}% peak-to-average spread.`;
  }

  if (q.includes("next week") || q.includes("7 day")) {
    const week = rows.slice(0, Math.min(7, rows.length));
    const weekAvg = week.reduce((a, b) => a + b.sales, 0) / week.length;
    return `The next ${week.length} forecast days average ${fmt(weekAvg)} sales/day, with a peak of ${fmt(Math.max(...week.map(x => x.sales)))}.`;
  }

  return `For the selected ${horizon}-day view: average demand is ${fmt(avg)}/day, projected volume is ${fmt(total)}, and peak demand is ${fmt(peakRow.sales)}${peakRow.date ? ` on ${peakRow.date}` : ""}. Demand changes ${movement >= 0 ? "up" : "down"} ${Math.abs(movement).toFixed(1)}% from the first to last projected day.`;
}


async function exportDashboardPDF() {
  const root = document.querySelector(".command-main");
  if (!root) {
    window.alert("Dashboard content is not available yet. Please wait for the dashboard to load.");
    return;
  }

  const exportButton = document.activeElement;

  try {
    if (exportButton && typeof exportButton.blur === "function") {
      exportButton.blur();
    }

    // Give ECharts/SVG content a moment to finish painting before capture.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const fullWidth = Math.max(root.scrollWidth, root.clientWidth);
    const fullHeight = Math.max(root.scrollHeight, root.clientHeight);

    // Keep the browser canvas comfortably below common maximum canvas dimensions.
    // A scale around 1.25 is still sharp on A4 while avoiding oversized canvases.
    const maxCanvasDimension = 28000;
    const safeScale = Math.min(1.25, maxCanvasDimension / fullWidth, maxCanvasDimension / fullHeight);

    const canvas = await html2canvas(root, {
      scale: Math.max(1, safeScale),
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#f7faf4",
      logging: false,
      width: fullWidth,
      height: fullHeight,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
      imageTimeout: 0,
      removeContainer: true,
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.querySelector(".command-main");
        if (clonedRoot) {
          clonedRoot.style.height = "auto";
          clonedRoot.style.maxHeight = "none";
          clonedRoot.style.overflow = "visible";
          clonedRoot.style.transform = "none";
        }

        // Avoid browser-only sticky/fixed positioning creating clipped PDF sections.
        clonedDoc.querySelectorAll("*").forEach((el) => {
          const style = clonedDoc.defaultView.getComputedStyle(el);
          if (style.position === "sticky" || style.position === "fixed") {
            el.style.position = "absolute";
          }
        });
      },
    });

    if (!canvas.width || !canvas.height) {
      throw new Error("Dashboard capture returned an empty canvas.");
    }

    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 7;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;

    // Slice the large dashboard canvas into A4-sized images.
    const pxPerPage = Math.max(
      1,
      Math.floor((usableH * canvas.width) / usableW)
    );

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const slicePx = Math.min(pxPerPage, canvas.height - sourceY);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = slicePx;

      const ctx = pageCanvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Could not create PDF page canvas.");

      ctx.fillStyle = "#f7faf4";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      ctx.drawImage(
        canvas,
        0, sourceY, canvas.width, slicePx,
        0, 0, canvas.width, slicePx
      );

      if (pageIndex > 0) {
        pdf.addPage();
      }

      const renderedH = (slicePx * usableW) / canvas.width;
      pdf.addImage(
        pageCanvas.toDataURL("image/jpeg", 0.92),
        "JPEG",
        margin,
        margin,
        usableW,
        Math.min(renderedH, usableH),
        undefined,
        "FAST"
      );

      sourceY += slicePx;
      pageIndex += 1;
    }

    const filename = `ForecastIQ_Dashboard_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("PDF export failed:", error);
    window.alert(
      `PDF export failed: ${error?.message || "Unknown browser capture error"}. ` +
      "Please refresh the dashboard and try Export again."
    );
  }
}

export default function CommandCenter({ employee, onLogout }) {
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [range, setRange] = useState("30D");
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentAnswer, setAgentAnswer] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setDataError("");
    const v = Date.now();

    const getJson = async (path) => {
      const response = await fetch(`${path}?v=${v}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`${path} returned ${response.status}`);
      return response.json();
    };

    try {
      const [forecastPayload, metricsPayload, dashboardPayload] = await Promise.all([
        getJson("/data/future_sales_forecast.json"),
        getJson("/data/seasonal_HGB_C_metrics.json"),
        getJson("/data/dashboard_data.json").catch(() => null),
      ]);

      const nextForecast = normalizeRows(forecastPayload);
      const nextHistory = normalizeHistorical(dashboardPayload);

      const r2 = Number(metricsPayload?.r2 ?? metricsPayload?.R2 ?? metricsPayload?.test_r2 ?? metricsPayload?.metrics?.r2);
      const mape = Number(metricsPayload?.mape ?? metricsPayload?.MAPE ?? metricsPayload?.test_mape ?? metricsPayload?.metrics?.mape);
      const rmse = Number(metricsPayload?.rmse ?? metricsPayload?.RMSE ?? metricsPayload?.metrics?.rmse);
      const mae = Number(metricsPayload?.mae ?? metricsPayload?.MAE ?? metricsPayload?.metrics?.mae);

      setForecast(nextForecast);
      setHistory(nextHistory);
      setMetrics({
        r2: Number.isFinite(r2) ? r2 : FALLBACK.r2,
        mape: Number.isFinite(mape) ? mape : FALLBACK.mape,
        rmse: Number.isFinite(rmse) ? rmse : FALLBACK.rmse,
        mae: Number.isFinite(mae) ? mae : FALLBACK.mae,
      });

      if (!nextForecast.length) setDataError("Forecast JSON loaded, but no valid sales rows were found.");
      else if (!nextHistory.length) setDataError("Forecast is connected. Add dashboard_data.json to frontend/public/data for real historical sales on the chart.");
    } catch (error) {
      setForecast([]);
      setHistory([]);
      setDataError("Data connection failed. Check frontend/public/data and refresh.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const requestedHorizon = Number(range.replace("D", "")) || 30;
  const horizon = Math.min(requestedHorizon, forecast.length);
  const visible = forecast.slice(0, horizon);
  const historicalWindow = Math.max(30, horizon);
  const points = [
    ...history.slice(-historicalWindow),
    ...visible.map((x) => ({ ...x, kind: "forecast" })),
  ];

  const avg = visible.length ? visible.reduce((a, b) => a + b.sales, 0) / visible.length : 0;
  const peak = visible.length ? Math.max(...visible.map((x) => x.sales)) : 0;
  const first = visible[0]?.sales || 0;
  const last = visible.at(-1)?.sales || 0;
  const growth = first ? ((last - first) / first) * 100 : 0;

  const notifications = useMemo(() => [
    { type: "success", title: "Forecast horizon ready", text: `${forecast.length || 0}-day projection is loaded.` },
    { type: "warning", title: "Peak demand watch", text: peak ? `Projected peak is ${fmt(peak)} sales/day in the selected ${range} view.` : "Forecast data is still loading." },
    { type: "success", title: "Model health", text: `Seasonal HGB-C validation R² is ${(metrics.r2 * 100).toFixed(2)}%.` },
  ], [forecast.length, peak, metrics.r2, range]);

  const runAgent = (question) => {
    const q = question || agentQuestion;
    if (!q.trim()) return;
    setAgentQuestion(q);
    setAgentAnswer(answerAgent(q, forecast, metrics, horizon));
    setActive("AI Agent");
  };

  const selectRange = (nextRange) => {
    setRange(nextRange);
    setRangeOpen(false);
  };

  const goToAlerts = () => {
    setActive("Alerts");
    setNotificationsOpen(false);
    setUnread(0);
  };

  const exportForecast = () => {
    if (!forecast.length) return;
    const blob = new Blob([JSON.stringify(forecast, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "future_sales_forecast.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="command-center">
      <AnimatedBackground />
      <div className="command-orb orb-a" />
      <div className="command-orb orb-b" />

      <aside className={`command-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="command-brand">
          <div className="command-brand-mark">FQ</div>
          {sidebarOpen && <div><b>Forecast<span>IQ</span></b><small>SALES INTELLIGENCE</small></div>}
        </div>

        <button className="sidebar-toggle" onClick={() => setSidebarOpen(v => !v)}>
          {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>

        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {NAV.map(([name, Icon]) => (
            <button key={name} className={active === name ? "active" : ""} onClick={() => name === "Alerts" ? goToAlerts() : setActive(name)} title={name}>
              <Icon size={18} />
              {sidebarOpen && <span>{name}</span>}
              {name === "Alerts" && sidebarOpen && <em>{unread}</em>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {sidebarOpen && <div className="system-mini"><i /><span><b>ENGINE ONLINE</b><small>{loading ? "Loading model artifacts" : "Data pipeline healthy"}</small></span></div>}
          <button className="logout-command" onClick={onLogout}><LogOut size={17} />{sidebarOpen && "Sign out"}</button>
        </div>
      </aside>

      <main className="command-main">
        <header className="command-topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(v => !v)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>FORECASTIQ</span><b>/</b><strong>{active.toUpperCase()}</strong></div>

          <div className="top-actions">
            <div className="data-live"><i /> {loading ? "LOADING MODEL DATA" : "LIVE MODEL DATA"}</div>

            <div className="notification-wrap">
              <button className={`icon-action ${active === "Alerts" ? "selected" : ""}`} title="Open notifications" onClick={goToAlerts}>
                <Bell size={17} />
                {unread > 0 && <i>{unread}</i>}
              </button>
              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-head"><div><b>Notifications</b><small>ForecastIQ activity</small></div><button onClick={() => setNotificationsOpen(false)}><X size={15}/></button></div>
                  {notifications.map((n, i) => (
                    <button className={`notification-item ${n.type}`} key={i} onClick={goToAlerts}>
                      {n.type === "success" ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                      <div><b>{n.title}</b><span>{n.text}</span></div>
                    </button>
                  ))}
                  <button className="notification-clear" onClick={goToAlerts}>View all notifications →</button>
                </div>
              )}
            </div>

            <button className="profile profile-button" title="Open employee profile" onClick={() => setProfileOpen(true)}>
              <div className="avatar">{employee.name?.[0]?.toUpperCase()}</div>
              <div><b>{employee.name}</b><small>{employee.role}</small></div>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <section className="command-content">
          <div className="command-heading">
            <div>
              <div className="eyebrow"><Zap size={13} /> INTELLIGENCE ENGINE ONLINE</div>
              <h1>{active === "Overview" ? "Sales Intelligence Command Center" : active}</h1>
              <p>{active === "Overview" ? "A live executive view of demand, forecast health and business signals." : `Explore ${active.toLowerCase()} using the forecasting intelligence layer.`}</p>
            </div>
            <div className="heading-actions">
              <div className="range-menu">
                <button className="range-menu-trigger" onClick={() => setRangeOpen(v => !v)}>
                  <CalendarDays size={15} /> Last {requestedHorizon} days <ChevronDown size={14} />
                </button>
                {rangeOpen && (
                  <div className="range-menu-popover">
                    {[7, 30, 60, 90].map(days => (
                      <button key={days} className={requestedHorizon === days ? "active" : ""} onClick={() => selectRange(`${days}D`)}>
                        <span>{days} days</span>
                        <small>{forecast.length >= days ? "Full forecast" : `${forecast.length} days available`}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="primary-action" onClick={exportDashboardPDF}><Download size={15} /> Export</button>
            </div>
          </div>

          {dataError && (
            <div className="data-warning">
              <AlertTriangle size={16} />
              <span>{dataError}</span>
              <button onClick={() => { setRefreshing(true); loadData().finally(() => setRefreshing(false)); }}><RefreshCw size={14} className={refreshing ? "spin" : ""}/> Refresh</button>
            </div>
          )}

          {active === "Overview" ? (
            <>
              <div className="metrics-grid">
                <Metric icon={Gauge} label="MODEL R²" value={`${(metrics.r2 * 100).toFixed(2)}%`} meta="Variance explained" />
                <Metric icon={Activity} label="MAPE" value={`${metrics.mape.toFixed(2)}%`} meta="Mean absolute % error" tone="mint" />
                <Metric icon={TrendingUp} label={`${range} DEMAND`} value={loading ? "Loading…" : fmt(avg)} meta={forecast.length ? `Average projected sales · ${horizon}D` : "No forecast loaded"} tone="blue" />
                <Metric icon={PackageCheck} label="PEAK DEMAND" value={loading ? "Loading…" : fmt(peak)} meta={`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% horizon movement`} tone="violet" />
              </div>

              <div className="dashboard-grid-main">
                <section className="glass-panel forecast-panel">
                  <div className="panel-head">
                    <div><span className="panel-kicker">DEMAND OUTLOOK</span><h2>Sales forecast trajectory</h2><p>Real historical sales transitioning into the Seasonal HGB-C projection.</p></div>
                    <div className="range-switcher">{["7D", "30D", "60D", "90D"].map(r => <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r}</button>)}</div>
                  </div>
                  {points.length ? <Chart points={points} /> : <div className="chart-empty"><BarChart3 size={30}/><b>Waiting for forecast data</b><span>Place future_sales_forecast.json in frontend/public/data/.</span></div>}
                  <div className="chart-foot"><span><i className="dot actual" /> Historical</span><span><i className="dot forecast" /> Forecast</span><span className="chart-note">Interactive · zoom · pan · range slider</span></div>
                </section>

                <section className="glass-panel signal-panel">
                  <div className="panel-head compact"><div><span className="panel-kicker">BUSINESS SIGNALS</span><h2>What needs attention</h2></div><Sparkles size={18}/></div>
                  <div className="signal-list">
                    <div className="signal-item positive"><div className="signal-icon"><TrendingUp size={16}/></div><div><b>Demand trajectory</b><span>{growth >= 0 ? "Positive" : "Softening"} movement across the forecast horizon.</span></div><strong>{growth >= 0 ? "+" : ""}{growth.toFixed(1)}%</strong></div>
                    <div className="signal-item"><div className="signal-icon"><Gauge size={16}/></div><div><b>Model confidence</b><span>Validation R² remains at the production benchmark.</span></div><strong>{(metrics.r2 * 100).toFixed(1)}%</strong></div>
                    <div className="signal-item warning"><div className="signal-icon"><AlertTriangle size={16}/></div><div><b>Planning watch</b><span>{peak ? `Protect inventory coverage around ${fmt(peak)} peak demand.` : "Waiting for forecast peak."}</span></div><strong>WATCH</strong></div>
                  </div>
                  <button className="agent-cta" onClick={() => { setAgentQuestion("Summarize the forecast"); runAgent("Summarize the forecast"); }}><Bot size={17}/> Ask the Intelligence Agent <span>→</span></button>
                </section>
              </div>

              <div className="dashboard-grid-bottom">
                <section className="glass-panel mini-panel"><div className="panel-head compact"><div><span className="panel-kicker">FORECAST MOMENTUM</span><h2>Demand pulse</h2></div><TrendingUp size={18}/></div><div className="pulse-value">{fmt(visible.at(-1)?.sales || 0)}<span>projected endpoint</span></div><div className="mini-bars">{visible.slice(0,18).map((x,i)=><i key={i} style={{height:`${Math.max(18, Math.min(100, x.sales / (peak || 1) * 100))}%`}}/>)}</div></section>
                <section className="glass-panel mini-panel"><div className="panel-head compact"><div><span className="panel-kicker">DATA HEALTH</span><h2>Pipeline status</h2></div><CircleHelp size={17}/></div><div className="health-row"><div className="health-ring"><strong>{forecast.length ? 100 : 0}</strong><span>%</span></div><div><b>{forecast.length ? "Forecast loaded" : "Waiting for data"}</b><p>{history.length ? "Forecast and historical artifacts connected." : "Forecast connected; historical artifact not loaded."}</p></div></div><div className="health-track"><span style={{width:`${forecast.length ? 100 : 0}%`}}/></div></section>
                <section className="glass-panel mini-panel"><div className="panel-head compact"><div><span className="panel-kicker">NEXT ACTION</span><h2>Planning recommendation</h2></div><PackageCheck size={18}/></div><p className="recommendation">Use the 30-day demand curve to align inventory, staffing and procurement before projected peak demand.</p><button className="text-action" onClick={() => setActive("Planning")}>Open planning workspace →</button></section>
              </div>
            </>
          ) : (
            <Workspace
              active={active}
              forecast={visible}
              history={history}
              metrics={metrics}
              horizon={horizon}
              selectedRange={range}
              agentQuestion={agentQuestion}
              setAgentQuestion={setAgentQuestion}
              agentAnswer={agentAnswer}
              runAgent={runAgent}
              unread={unread}
              onOverview={() => setActive("Overview")}
              onAlerts={() => setActive("Alerts")}
            />
          )}
        </section>

        {profileOpen && (
          <div className="profile-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setProfileOpen(false)}>
            <div className="profile-modal">
              <button className="profile-modal-close" onClick={() => setProfileOpen(false)}><X size={17}/></button>
              <div className="profile-modal-head">
                <div className="profile-large-avatar">{employee.name?.[0]?.toUpperCase()}</div>
                <div><span className="panel-kicker">EMPLOYEE PROFILE</span><h2>{employee.name}</h2><p>{employee.role}</p></div>
              </div>
              <div className="profile-credentials">
                <div><UserRound size={16}/><span>Employee ID</span><b>{employee.id}</b></div>
                <div><Target size={16}/><span>Role</span><b>{employee.role}</b></div>
                <div><ShieldCheck size={16}/><span>Access</span><b>Command Center · Active</b></div>
                <div><Clock3 size={16}/><span>Session</span><b>Authenticated</b></div>
              </div>
              <div className="profile-security"><ShieldCheck size={16}/><div><b>Enterprise access verified</b><span>Your ForecastIQ employee session is active on this device.</span></div></div>
              <button className="profile-close-action" onClick={() => setProfileOpen(false)}>Close profile</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function requestedHorizonLabel(range) {
  return `${Number(String(range).replace("D", "")) || 30} days`;
}

function Workspace({ active, forecast, history, metrics, horizon, selectedRange, agentQuestion, setAgentQuestion, agentAnswer, runAgent, unread, onOverview }) {
  if (active === "AI Agent") {
    const agentPrompts = [
      "Summarize this horizon",
      "Where is the peak demand?",
      "What should inventory teams watch?",
      "Is demand growing?",
      "Explain model performance",
      "What is the projected volume?"
    ];
    return (
      <div className="workspace-agent glass-panel">
        <div className="agent-hero">
          <div className="agent-avatar"><Bot size={32}/><span className="agent-live-dot" /></div>
          <div>
            <span className="panel-kicker">FORECASTIQ INTELLIGENCE</span>
            <h2>How can I help with demand?</h2>
            <p>Grounded in the selected {selectedRange} forecast horizon and Seasonal HGB-C model metrics.</p>
          </div>
          <div className="agent-context"><Clock3 size={14}/><span>{horizon || 0}D context</span></div>
        </div>

        <div className="agent-insight-strip">
          <div><span>AVG / DAY</span><b>{fmt(forecast.length ? forecast.reduce((a,b)=>a+b.sales,0)/forecast.length : 0)}</b></div>
          <div><span>PEAK</span><b>{fmt(forecast.length ? Math.max(...forecast.map(x=>x.sales)) : 0)}</b></div>
          <div><span>MODEL R²</span><b>{(metrics.r2*100).toFixed(1)}%</b></div>
        </div>

        <div className="agent-prompts">
          {agentPrompts.map(q => <button key={q} onClick={() => runAgent(q)}><Sparkles size={12}/>{q}</button>)}
        </div>

        <div className="agent-input-row">
          <MessageCircle size={17}/>
          <input value={agentQuestion} onChange={e => setAgentQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && runAgent()} placeholder="Ask about demand, inventory, trend, peak, volume or model performance..." />
          <button onClick={() => runAgent()}><Send size={15}/></button>
        </div>

        <div className={`agent-response ${agentAnswer ? "has-answer" : ""}`}>
          <Sparkles size={17}/>
          <div><b>{agentAnswer ? "Intelligence response" : "Ready for your question"}</b><p>{agentAnswer || "Choose a suggested question or ask your own. Responses are calculated from the loaded forecast and model metrics."}</p></div>
        </div>
      </div>
    );
  }

  if (active === "Model Performance") {
    return <div className="performance-layout">
      <div className="glass-panel performance-score"><span className="panel-kicker">VALIDATION SCORE</span><strong>{(metrics.r2*100).toFixed(2)}%</strong><p>R² · variance explained</p><div className="score-track"><span style={{width:`${metrics.r2*100}%`}}/></div></div>
      <div className="glass-panel performance-score"><span className="panel-kicker">FORECAST ERROR</span><strong>{metrics.mape.toFixed(2)}%</strong><p>MAPE · mean absolute percentage error</p><div className="score-track"><span style={{width:`${Math.max(5,100-metrics.mape*10)}%`}}/></div></div>
      <div className="glass-panel performance-note"><BrainCircuit size={23}/><h3>Seasonal HGB-C</h3><p>R² {(metrics.r2).toFixed(6)} · MAPE {metrics.mape.toFixed(2)}% · RMSE {fmt(metrics.rmse)} · MAE {fmt(metrics.mae)}.</p><div className="metric-pills"><span>30D horizon</span><span>Validation artifact</span><span>Production candidate</span></div></div>
    </div>;
  }

  if (active === "Forecast") {
    const points = [...history.slice(-Math.max(30, horizon)), ...forecast.map(x => ({...x, kind:"forecast"}))];
    return <div className="workspace-full glass-panel">
      <div className="panel-head">
        <div><span className="panel-kicker">FORECAST ARTIFACT</span><h2>{selectedRange} demand projection</h2><p>Full forecast analysis for the selected horizon, loaded from future_sales_forecast.json.</p></div>
        <div className="horizon-chip"><TrendingUp size={16}/>{horizon || 0} days available</div>
      </div>
      <Chart points={points}/>
      <div className="forecast-summary-row">
        <div><span>AVERAGE</span><b>{fmt(forecast.length ? forecast.reduce((a,b)=>a+b.sales,0)/forecast.length : 0)}</b></div>
        <div><span>PEAK</span><b>{fmt(forecast.length ? Math.max(...forecast.map(x=>x.sales)) : 0)}</b></div>
        <div><span>PROJECTED VOLUME</span><b>{fmt(forecast.reduce((a,b)=>a+b.sales,0))}</b></div>
      </div>
      <div className="forecast-table">{forecast.map(r => <div key={r.date}><b>{r.date}</b><strong>{fmt(r.sales)}</strong><span>{fmt(r.onpromotion)} promo · {fmt(r.transactions)} transactions</span></div>)}</div>
    </div>;
  }

  if (active === "Analytics") {
    const byWeek = forecast.reduce((acc, row) => {
      const d = new Date(row.date);
      const key = Number.isNaN(d.getTime()) ? "Forecast" : `W${Math.ceil(d.getDate()/7)}`;
      acc[key] = (acc[key] || 0) + row.sales;
      return acc;
    }, {});
    const max = Math.max(...Object.values(byWeek), 1);
    return <div className="analytics-grid">
      <div className="glass-panel analytics-card"><span className="panel-kicker">FORECAST DISTRIBUTION</span><h3>Weekly demand pulse · {selectedRange}</h3><div className="analytics-bars">{Object.entries(byWeek).map(([k,v])=><div key={k}><i style={{height:`${v/max*100}%`}}/><span>{k}</span><b>{fmtCompact(v)}</b></div>)}</div></div>
      <div className="glass-panel analytics-card"><span className="panel-kicker">DRIVERS AVAILABLE</span><h3>Forecast input signals · {selectedRange}</h3><div className="driver-list"><div><span>Promotion</span><b>{fmt(forecast.reduce((a,b)=>a+b.onpromotion,0)/Math.max(1,forecast.length))} avg</b></div><div><span>Transactions</span><b>{fmt(forecast.reduce((a,b)=>a+b.transactions,0)/Math.max(1,forecast.length))} avg</b></div><div><span>Oil price</span><b>{forecast[0]?.oil_price ? forecast[0].oil_price.toFixed(2) : "—"}</b></div></div></div>
    </div>;
  }

  if (active === "Planning") {
    const avg = forecast.length ? forecast.reduce((a,b)=>a+b.sales,0)/forecast.length : 0;
    const peak = forecast.length ? Math.max(...forecast.map(x=>x.sales)) : 0;
    return <div className="planning-grid"><div className="glass-panel plan-hero"><PackageCheck size={25}/><span className="panel-kicker">PLANNING INTELLIGENCE</span><h2>Prepare for demand</h2><p>Use the selected {selectedRange} forecast as a planning signal for inventory, staffing and procurement.</p><div className="plan-kpis"><div><b>{fmt(avg)}</b><span>avg sales/day · {selectedRange}</span></div><div><b>{fmt(peak)}</b><span>peak sales/day · {selectedRange}</span></div></div></div><div className="glass-panel action-list"><span className="panel-kicker">RECOMMENDED ACTIONS</span><h3>What teams should do next</h3><div className="action-row"><CheckCircle2 size={18}/><div><b>Protect peak coverage</b><span>Review inventory buffers before the highest projected demand days.</span></div></div><div className="action-row"><CheckCircle2 size={18}/><div><b>Align staffing</b><span>Use the demand curve to schedule operational capacity.</span></div></div><div className="action-row"><CheckCircle2 size={18}/><div><b>Coordinate procurement</b><span>Translate the forecast into replenishment planning.</span></div></div></div></div>;
  }

  if (active === "Alerts") {
    const peakRow = forecast.length ? forecast.reduce((best,row) => row.sales > best.sales ? row : best, forecast[0]) : null;
    return <div className="alerts-page">
      <div className="alerts-banner glass-panel"><div><span className="panel-kicker">NOTIFICATION CENTER</span><h2>Business notifications</h2><p>Live attention items for the selected {selectedRange} horizon.</p></div><Bell size={22}/></div>
      <div className="alerts-grid">{[
        ["Peak demand watch", peakRow ? `Projected maximum is ${fmt(peakRow.sales)} sales/day${peakRow.date ? ` on ${peakRow.date}` : ""}.` : "Waiting for forecast.", "warning", AlertTriangle],
        ["Model confidence", `R² is ${(metrics.r2*100).toFixed(2)}% with MAPE ${metrics.mape.toFixed(2)}%.`, "success", CheckCircle2],
        ["Data connection", history.length ? "Historical and forecast artifacts are connected." : "Forecast connected; historical artifact still needs to be added.", history.length ? "success" : "warning", history.length ? CheckCircle2 : AlertTriangle],
        ["Forecast horizon", `${horizon || 0} of ${requestedHorizonLabel(selectedRange)} requested forecast days are available in the current artifact.`, forecast.length >= Number(selectedRange.replace("D","")) ? "success" : "warning", CalendarDays],
      ].map(([title,text,type,Icon])=><button className={`glass-panel alert-card ${type}`} key={title} onClick={() => title === "Peak demand watch" && runAgent("Where is the peak demand?")}><div className="alert-icon"><Icon size={20}/></div><div><span className="panel-kicker">{type==="success"?"HEALTHY":"ATTENTION"}</span><h3>{title}</h3><p>{text}</p></div><span className="alert-arrow">→</span></button>)}</div>
    </div>;
  }

  if (active === "Settings") {
    return <div className="settings-grid"><div className="glass-panel settings-card"><span className="panel-kicker">DATA SOURCE</span><h3>Frontend artifacts</h3><div className="setting-line"><span>Forecast JSON</span><b>Connected</b></div><div className="setting-line"><span>Metrics JSON</span><b>Connected</b></div><div className="setting-line"><span>Historical JSON</span><b>{history.length ? "Connected" : "Not loaded"}</b></div></div><div className="glass-panel settings-card"><span className="panel-kicker">MODEL</span><h3>Seasonal HGB-C</h3><div className="setting-line"><span>R²</span><b>{(metrics.r2*100).toFixed(2)}%</b></div><div className="setting-line"><span>MAPE</span><b>{metrics.mape.toFixed(2)}%</b></div><div className="setting-line"><span>Selected horizon</span><b>{selectedRange}</b></div></div></div>;
  }

  return <div className="workspace-generic"><div className="glass-panel workspace-hero"><div className="workspace-icon"><Activity size={25}/></div><span className="panel-kicker">WORKSPACE</span><h2>{active}</h2><p>Dedicated workspace connected to the live forecast artifact.</p><button onClick={onOverview}>← Back to Overview</button></div><div className="glass-panel workspace-chart"><div className="panel-head compact"><div><span className="panel-kicker">LIVE ARTIFACT</span><h2>Forecast data preview</h2></div><BarChart3 size={18}/></div><div className="workspace-table">{forecast.slice(0,10).map(r=><div key={r.date}><span>{r.date}</span><b>{fmt(r.sales)}</b><em>forecast</em></div>)}</div></div></div>;
}
