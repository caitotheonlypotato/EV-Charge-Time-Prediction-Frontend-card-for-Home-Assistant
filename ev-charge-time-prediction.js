// =====================================================================
// EV Charge Time Prediction
// Card element:    ev-charge-time-prediction
// Editor element:  ev-charge-time-prediction-editor
// Picker entry:    window.customCards type "ev-charge-time-prediction"
// =====================================================================

const EVCTP_TYPE = "ev-charge-time-prediction";
const EVCTP_REDRAW_MIN_MS = 30000;      // rate-triggered redraw cooldown
const EVCTP_RATE_MIN_CHANGE_KW = 0.5;   // rate change needed to trigger a redraw
const EVCTP_NOW_TICK_MS = 30000;        // "now" marker refresh
const EVCTP_RETRY_MAX_MS = 5 * 60000;   // history retry backoff ceiling
const EVCTP_DAY_MS = 86400000;

const EVCTP_DEFAULTS = {
  // Entities
  soc_entity: "",
  target_entity: "",
  target_use_fixed: false,    // true = use target_percent instead of target_entity
  target_percent: 80,         // fixed charge target (0 to 101). 101 = include BMS overhead
  rate_first_entity: "",
  rate_second_entity: "",
  rate_preference: "first",   // "first" = use first, then second. "second" = the reverse
  sun_entity: "sun.sun",

  // Battery and prediction
  battery_kwh: 60,
  bms_overhead_min: 30,

  // Window
  window_before: 30,          // minutes shown before now
  window_after: 60,           // minutes shown after the predicted 100% time
  history_hours: 1,           // SOC history loaded
  history_refresh_min: 5,     // full history reload interval

  // Layout
  height: 360,
  height_factor: 1,
  time_24h: true,

  // Title
  title: "EV Charge Time Prediction",
  title_show: true,
  title_align: "center",
  title_size: 18,
  title_color: "#ffffff",
  title_opacity: 1,

  // Readouts
  readouts_show: true,
  readout_style: "pills",     // plain, pills, filled, boxed, stacked, ticker
  readout_align: "left",      // left, center, right, spread
  readout_size: 13,
  readout_color: "#ffffff",
  readout_opacity: 1,

  // Background
  background_type: "",            // "solid" or "picture". Blank = picture if an image path is set, otherwise solid
  background_color: "#1c1c1c",
  background_transparent: false,  // solid mode only: card background is see-through
  background_image: "",
  background_image_opacity: 0.7,
  background_fit: "cover",
  background_scale: 1,
  background_repeat: "no-repeat",
  background_top: 50,
  background_left: 50,

  // Text
  font_family: "",
  axis_size: 12,
  axis_color: "#cccccc",
  axis_opacity: 1,
  readout_bold: false,
  readout_bar_bg: "#2a2a2a",
  readout_bar_bg_none: true,
  title_bold: false,
  title_bg: "#000000",
  title_bg_none: true,
  axis_bold: false,
  legend_bold: false,
  legend_bg: "#000000",
  legend_bg_none: true,

  // Label styles. Each element has its own size, text colour, background, opacity and bold.
  // Vertical = the time labels on the lines. Horizontal = the Target value pill.
  target_v_size: 12, target_v_text: "#000000", target_v_bg: "#ffb703", target_v_bg_none: false, target_v_opacity: 1, target_v_bold: false,
  target_h_size: 12, target_h_text: "#000000", target_h_bg: "#ffb703", target_h_bg_none: false, target_h_opacity: 1, target_h_bold: false,
  full_size: 12, full_text: "#000000", full_bg: "#2ec4b6", full_bg_none: false, full_opacity: 1, full_bold: false,
  now_size: 12, now_text: "#ffffff", now_bg: "#1e90ff", now_bg_none: false, now_opacity: 1, now_bold: false,
  sunrise_size: 12, sunrise_text: "#000000", sunrise_bg: "#ffb703", sunrise_bg_none: false, sunrise_opacity: 1, sunrise_bold: false,
  sunset_size: 12, sunset_text: "#ffffff", sunset_bg: "#e71d36", sunset_bg_none: false, sunset_opacity: 1, sunset_bold: false,
  legend_show: true,
  legend_size: 12,
  legend_color: "#cccccc",
  legend_opacity: 1,

  // Grid
  grid_color: "#ffffff",
  grid_opacity: 0.2,

  // Lines
  actual_color: "#2ec4b6",
  actual_width: 2,
  actual_dash: "solid",
  actual_opacity: 1,
  projected_color: "#e71d36",
  projected_width: 2,
  projected_dash: "solid",
  projected_opacity: 1,
  target_color: "#ffb703",
  target_width: 2,
  target_dash: "solid",
  target_opacity: 1,

  // Markers and labels
  target_marker_opacity: 1,
  target_pill_show: true,
  show_full: true,
  full_color: "#2ec4b6",
  full_marker_opacity: 1,
  show_now: true,
  now_color: "#1e90ff",
  now_marker_opacity: 1,
  show_sun_markers: true,
  sunrise_color: "#ffb703",
  sunset_color: "#e71d36",
  sun_marker_opacity: 1,
  label_max_shift: 40,

  // Day and night shading (each independent, drawn wherever day or night falls in the window)
  show_daylight: true,
  sun_color: "#ffb703",
  sun_opacity: 0.3,
  show_night: false,
  night_color: "#0b1220",
  night_opacity: 1
};

const EVCTP_FONT_OPTIONS = [
  ["", "Home Assistant theme"],
  ["system-ui, sans-serif", "System UI"],
  ["Roboto, sans-serif", "Roboto"],
  ["monospace", "Monospace"],
  ["serif", "Serif"]
];

const EVCTP_RATE_PREFERENCE_OPTIONS = [
  ["first", "First, then second"],
  ["second", "Second, then first"]
];

const EVCTP_BG_TYPE_OPTIONS = [
  ["solid", "Solid colour"],
  ["picture", "Picture"]
];

const EVCTP_READOUT_STYLE_OPTIONS = [
  ["plain", "Plain text"],
  ["pills", "Pills"],
  ["filled", "Filled chips"],
  ["boxed", "Boxed"],
  ["stacked", "Stacked"],
  ["ticker", "Ticker"]
];

const EVCTP_READOUT_ALIGN_OPTIONS = [
  ["left", "Left"],
  ["center", "Centre"],
  ["right", "Right"],
  ["spread", "Spread"]
];

const EVCTP_DASH = { solid: [], dashed: [8, 4], dotted: [2, 3] };

const EVCTP_BG_PRESETS = {
  "top-left": [0, 0],
  "top-center": [0, 50],
  "top-right": [0, 100],
  "center-left": [50, 0],
  center: [50, 50],
  "center-right": [50, 100],
  "bottom-left": [100, 0],
  "bottom-center": [100, 50],
  "bottom-right": [100, 100]
};

// =====================================================================
// Pure helpers (no DOM, no hass)
// =====================================================================

function evctpBuildConfig(config) {
  return { ...EVCTP_DEFAULTS, ...(config || {}) };
}

// Solid or picture. A card saved before the selector existed has no type,
// so it opens in picture mode if it already has an image path.
function evctpBgMode(cfg) {
  if (cfg.background_type === "solid" || cfg.background_type === "picture") return cfg.background_type;
  return cfg.background_image ? "picture" : "solid";
}

function evctpNum(value, fallback, min, max) {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function evctpEsc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Colour inputs only accept #rrggbb
function evctpColor(hex) {
  return /^#[0-9a-f]{6}$/i.test(String(hex ?? "")) ? String(hex) : "#000000";
}

function evctpFormatTime(ms, time24) {
  return new Date(ms).toLocaleTimeString(
    [],
    time24
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : { hour: "numeric", minute: "2-digit", hour12: true }
  );
}

// The charge target. The fixed percentage when "use fixed" is ticked, otherwise the target entity.
function evctpTargetValue(cfg, hass) {
  if (cfg.target_use_fixed) return evctpNum(cfg.target_percent, 80, 0, 101);
  return evctpTargetFromState(hass.states[cfg.target_entity]);
}

// Target percentage from a number, a select option such as "80%", or a max-type word.
// Returns null if there is no usable target.
function evctpTargetFromState(stateObj) {
  if (!stateObj) return null;
  const s = String(stateObj.state ?? "");
  const m = s.match(/-?\d+(\.\d+)?/);
  if (m) return parseFloat(m[0]);
  if (/max|full|no\s*limit/i.test(s)) return 100;
  return null;
}

// Converts a charge rate to kW. Uses the unit when it is W or kW.
// Otherwise infers from the size: above 25 is watts, 25 or below is kW.
function evctpToKw(value, unit) {
  const u = String(unit ?? "").trim().toLowerCase();
  if (u === "w") return value / 1000;
  if (u === "kw") return value;
  return value > 25 ? value / 1000 : value;
}

// Charge rate in kW. The preferred source is used if it reads above zero,
// otherwise the other source is used. Zero if neither reads above zero.
function evctpRateKw(hass, cfg) {
  const read = (id) => {
    if (!id) return null;
    // Some sensors report charging as negative, so use the magnitude
    const st = hass?.states?.[id];
    const v = Math.abs(parseFloat(st?.state));
    return Number.isFinite(v) ? evctpToKw(v, st?.attributes?.unit_of_measurement) : null;
  };
  const order =
    cfg.rate_preference === "second"
      ? [cfg.rate_second_entity, cfg.rate_first_entity]
      : [cfg.rate_first_entity, cfg.rate_second_entity];
  for (const id of order) {
    const v = read(id);
    if (v !== null && v > 0) return v;
  }
  return 0;
}

// Projection: all times in epoch ms. Percent per ms = kW / battery kWh * 100 / 1h
function evctpProject({ soc, anchorMs, kw, batteryKwh, target, overheadMin }) {
  const result = { charging: false, tFull: null, tFullBms: null, tTarget: null };
  if (!(kw > 0) || !(batteryKwh > 0) || soc >= 100) return result;

  const perMs = ((kw / batteryKwh) * 100) / 3600000;
  const tFull = anchorMs + (100 - soc) / perMs;
  const overheadMs = (Number(overheadMin) || 0) * 60000;
  const tFullBms = target !== null && target > 100 ? tFull + overheadMs : tFull;

  let tTarget = null;
  if (target !== null && target > soc) {
    tTarget = target > 100 ? tFullBms : anchorMs + (target - soc) / perMs;
  }
  return { charging: true, tFull, tFullBms, tTarget };
}

// Points for the projected line, starting at the estimated SOC at Now
function evctpProjectedPoints(p, nowMs, socNow, endMs) {
  if (!p.charging) return [[nowMs, socNow], [endMs, socNow]];
  const pts = [[nowMs, socNow]];
  if (p.tFull > nowMs) pts.push([p.tFull, 100]);
  if (p.tFullBms > nowMs) pts.push([p.tFullBms, 100]);
  pts.push([Math.max(endMs, p.tFullBms), 100]);
  return pts;
}

// Value on a polyline of [t, v] points at time t. Clamps outside the ends.
function evctpValueAt(pts, t) {
  if (!pts.length) return null;
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [t1, v1] = pts[i - 1];
    const [t2, v2] = pts[i];
    if (t <= t2) return t2 === t1 ? v2 : v1 + ((v2 - v1) * (t - t1)) / (t2 - t1);
  }
  return pts[pts.length - 1][1];
}

// Chooses a tick step so the x axis has at most about 7 labels
function evctpTimeStep(spanMs) {
  const steps = [5, 10, 15, 30, 60, 120, 180, 240, 360].map((m) => m * 60000);
  return steps.find((s) => spanMs / s <= 7) ?? steps[steps.length - 1];
}

// Parses a minimal-response history array. Full state comes first with last_changed,
// later rows carry s (state) and lu (epoch seconds).
function evctpParseHistory(rows) {
  const out = [];
  (rows || []).forEach((row) => {
    const v = parseFloat(row.s ?? row.state);
    const t = row.lu ? Number(row.lu) * 1000 : Date.parse(row.last_changed ?? row.last_updated);
    if (Number.isFinite(v) && Number.isFinite(t)) out.push([t, v]);
  });
  return out.sort((a, b) => a[0] - b[0]);
}

// Relative luminance of a #rrggbb colour (WCAG). Null if the colour is not #rrggbb.
function evctpLuminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex ?? ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function evctpContrast(l1, l2) {
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// Keeps the chosen text colour only when it reads well (5:1 contrast). Otherwise
// uses white if white reaches 4.5:1 on the background, and black if it doesn't.
// White is preferred on mid and dark reds even where black has slightly more contrast.


// Places vertical labels so they don't overlap. Tries the bottom of the plot first,
// shifting sideways up to maxShift, then the top. Higher priority is placed first.
function evctpPlaceLabels(ctx, items, box, fontPx, maxShift) {
  const gap = 2;
  const boxW = fontPx + 8;
  const shifts = [0];
  for (let s = boxW; s <= maxShift; s += boxW) shifts.push(s, -s);

  const overlaps = (a, b) =>
    !(a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x || a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y);
  const fits = (r) => r.x >= box.L && r.x + r.w <= box.R;

  const placed = [];
  return [...items]
    .sort((a, b) => a.prio - b.prio)
    .map((it) => {
      ctx.font = it.font;
      const bw = it.px + 8;
      const h = ctx.measureText(it.text).width + 8;
      const attempts = [];
      [box.B - h - 2, box.T + 2].forEach((y) => {
        shifts.forEach((sh) => attempts.push({ x: it.x - bw / 2 + sh, y, w: bw, h }));
      });
      let rect = attempts.find((r) => fits(r) && !placed.some((q) => overlaps(q, r)));
      if (!rect) {
        // Nothing free: keep it at the bottom, inside the plot
        rect = {
          x: Math.min(Math.max(it.x - bw / 2, box.L), box.R - bw),
          y: box.B - h - 2,
          w: bw,
          h
        };
      }
      placed.push(rect);
      return { ...it, rect };
    });
}

// =====================================================================
// Card
// =====================================================================

class EvChargeTimePrediction extends HTMLElement {
  static getConfigElement() {
    return document.createElement(`${EVCTP_TYPE}-editor`);
  }

  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = evctpBuildConfig({});
    this._hass = null;
    this._connected = false;

    // Series and history state. _gen invalidates in-flight history responses.
    this._gen = 0;
    this._series = [];
    this._seriesFor = null;
    this._historyFor = null;
    this._fetching = false;
    this._failures = 0;

    // Change tracking for hass updates
    this._lastSocChanged = null;
    this._lastTarget = null;
    this._lastSunState = null;
    this._lastRateKw = null;
    this._lastDrawAt = 0;

    // Timers
    this._tickTimer = null;
    this._refreshTimer = null;
    this._retryTimer = null;
    this._rateTimer = null;

    // Background image
    this._bgSrc = null;
    this._bgNatural = null;

    this._buildDom();
    this._resizeObserver = new ResizeObserver(() => this._draw());

    // Pause when scrolled out of view. On return, refresh the history and redraw.
    this._visible = true;
    this._visibilityObserver = new IntersectionObserver((entries) => {
      const nowVisible = entries[entries.length - 1].isIntersecting;
      if (nowVisible === this._visible) return;
      this._visible = nowVisible;
      if (nowVisible) {
        this._startTimers();
        this._loadHistory();
        this._draw();
      } else {
        this._stopTimers();
      }
    });
  }

  getCardSize() {
    return Math.ceil(((Number(this._config.height) || 360) * (Number(this._config.height_factor) || 1)) / 50) + 1;
  }

  setConfig(config) {
    if (!config) throw new Error(`Invalid configuration for ${EVCTP_TYPE}`);
    const previous = this._config;
    this._config = evctpBuildConfig(config);
    this._applyStyle();
    if (this._connected) {
      if (previous.history_refresh_min !== this._config.history_refresh_min) this._startTimers();
      this._ensureHistory();
    }
    this._draw();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._connected) return;
    this._ensureHistory();

    const cfg = this._config;
    let dirty = false;

    // SOC change: append a live point to the series
    const socState = hass.states[cfg.soc_entity];
    if (socState && socState.last_changed !== this._lastSocChanged) {
      this._lastSocChanged = socState.last_changed;
      const t = Date.parse(socState.last_changed);
      const v = parseFloat(socState.state);
      if (Number.isFinite(t) && Number.isFinite(v) && this._seriesFor === cfg.soc_entity) {
        this._series.push([t, v]);
        this._prune();
      }
      dirty = true;
    }

    // Target change
    const targetKey = cfg.target_use_fixed
      ? `fixed:${cfg.target_percent}`
      : (hass.states[cfg.target_entity]?.state ?? null);
    if (targetKey !== this._lastTarget) {
      this._lastTarget = targetKey;
      dirty = true;
    }

    // Sun change: only the day or night state and the next rise and set times matter
    const sunState = hass.states[cfg.sun_entity];
    const sunKey = sunState
      ? `${sunState.state}|${sunState.attributes?.next_rising}|${sunState.attributes?.next_setting}`
      : "";
    if (sunKey !== this._lastSunKey) {
      this._lastSunKey = sunKey;
      dirty = true;
    }

    // Charge rate: redraw only if 0.5 kW or more has changed, and at most every 30 seconds
    const kw = evctpRateKw(hass, cfg);
    if (this._lastRateKw === null) {
      dirty = true;
    } else if (Math.abs(kw - this._lastRateKw) >= EVCTP_RATE_MIN_CHANGE_KW) {
      const wait = EVCTP_REDRAW_MIN_MS - (Date.now() - this._lastDrawAt);
      if (wait <= 0) dirty = true;
      else this._scheduleRateDraw(wait);
    }

    if (dirty) this._draw();
  }

  connectedCallback() {
    this._connected = true;
    this._historyFor = null; // reload on reattach, the data may be stale
    this._resizeObserver.observe(this._canvasWrap);
    this._visibilityObserver.observe(this);
    this._startTimers();
    this._ensureHistory();
    this._draw();
  }

  disconnectedCallback() {
    this._connected = false;
    this._gen++;
    this._fetching = false;
    this._historyFor = null;
    this._resizeObserver.disconnect();
    this._visibilityObserver.disconnect();
    this._stopTimers();
  }

  // -------------------------------------------------------------------
  // DOM
  // -------------------------------------------------------------------

  _buildDom() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          position: relative;
          overflow: hidden;
          background: transparent;
          box-shadow: none;
          border: none;
          padding: 0;
        }
        .bg-color, .bg-img {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: var(--ha-card-border-radius, 12px);
        }
        .bg-img {
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
        }
        .wrap {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px;
          box-sizing: border-box;
        }
        .title { margin: 0; font-weight: 600; line-height: 1.2; }
        .readouts { line-height: 1.3; display: flex; flex-wrap: nowrap; gap: 6px; align-items: center; min-width: 0; overflow: hidden; }
        .readouts[data-align="center"] { justify-content: center; }
        .readouts[data-align="right"] { justify-content: flex-end; }
        .readouts[data-align="spread"] { justify-content: space-between; }
        .readouts[data-style="plain"] { gap: 0; }
        .readouts[data-style="plain"] .stat { border: none; background: none; padding: 0 2px; border-radius: 0; }
        .readouts[data-style="plain"] .stat + .stat::before { content: "·"; opacity: 0.5; margin: 0 6px; }
        .readouts[data-style="filled"] .stat {
          border: none;
          background: color-mix(in srgb, currentColor 16%, transparent);
        }
        .box {
          display: inline-flex;
          border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
          border-radius: 6px;
          overflow: hidden;
        }
        .readouts[data-style="boxed"] .stat { border: none; border-radius: 0; background: none; padding: 4px 12px; }
        .readouts[data-style="boxed"] .stat + .stat { border-left: 1px solid color-mix(in srgb, currentColor 22%, transparent); }
        .readouts[data-style="stacked"] { gap: 18px; }
        .readouts[data-style="stacked"] .stat {
          flex-direction: column;
          align-items: center;
          gap: 0;
          border: none;
          background: none;
          padding: 0;
          border-radius: 0;
        }
        .readouts[data-style="stacked"] .stat .k { font-size: 11px; }
        .readouts[data-style="stacked"] .stat b { font-size: 1.15em; }
        .readouts[data-style="ticker"] { font-family: ui-monospace, Menlo, Consolas, monospace; gap: 0; }
        .readouts[data-style="ticker"] .stat { border: none; background: none; padding: 0 10px; border-radius: 0; }
        .readouts[data-style="ticker"] .stat + .stat { border-left: 1px solid color-mix(in srgb, currentColor 30%, transparent); }
        .stat {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
          background: color-mix(in srgb, currentColor 6%, transparent);
          white-space: nowrap;
        }
        .stat .k {
          opacity: 0.6;
          font-size: 0.8em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat b { font-weight: var(--ro-weight, 600); font-variant-numeric: tabular-nums; }
        .canvas-wrap { position: relative; width: 100%; }
        canvas { display: block; width: 100%; }
        .msg { display: none; padding: 24px 8px; text-align: center; opacity: 0.8; }
      </style>
      <ha-card>
        <div class="bg-color"></div>
        <div class="bg-img"></div>
        <div class="wrap">
          <div class="title"></div>
          <div class="readouts"></div>
          <div class="canvas-wrap">
            <canvas></canvas>
            <div class="msg"></div>
          </div>
        </div>
      </ha-card>
    `;
    this._canvas = this.shadowRoot.querySelector("canvas");
    this._ctx = this._canvas.getContext("2d");
    this._canvasWrap = this.shadowRoot.querySelector(".canvas-wrap");
  }

  // Title, readouts, background and font. Runs on config change only.
  _applyStyle() {
    const root = this.shadowRoot;
    const cfg = this._config;

    root.querySelector(".wrap").style.fontFamily = cfg.font_family || "";
    this._fontFamily = null; // read again on the next draw

    const title = root.querySelector(".title");
    title.style.display = cfg.title_show ? "" : "none";
    title.textContent = cfg.title;
    title.style.textAlign = cfg.title_align;
    title.style.fontSize = `${evctpNum(cfg.title_size, 18, 8, 48)}px`;
    title.style.color = cfg.title_color;
    title.style.opacity = evctpNum(cfg.title_opacity, 1, 0, 1);
    title.style.fontWeight = cfg.title_bold ? "700" : "400";
    title.style.background = cfg.title_bg_none ? "transparent" : cfg.title_bg;
    title.style.padding = cfg.title_bg_none ? "0" : "2px 8px";
    title.style.borderRadius = "6px";

    const readouts = root.querySelector(".readouts");
    readouts.style.display = cfg.readouts_show ? "" : "none";
    readouts.style.fontSize = `${evctpNum(cfg.readout_size, 13, 8, 48)}px`;
    readouts.style.color = cfg.readout_color;
    readouts.style.opacity = evctpNum(cfg.readout_opacity, 1, 0, 1);
    readouts.style.setProperty("--ro-weight", cfg.readout_bold ? "700" : "400");
    readouts.style.background = cfg.readout_bar_bg_none ? "transparent" : cfg.readout_bar_bg;
    readouts.style.padding = cfg.readout_bar_bg_none ? "0" : "6px 10px";
    readouts.style.borderRadius = "8px";

    this._applyBackground();
  }

  // Solid mode shows the colour layer (or nothing, if transparent).
  // Picture mode hides the colour layer and shows the image.
  _applyBackground() {
    const cfg = this._config;
    const colorLayer = this.shadowRoot.querySelector(".bg-color");
    const layer = this.shadowRoot.querySelector(".bg-img");
    const picture = evctpBgMode(cfg) === "picture";

    colorLayer.style.backgroundColor =
      !picture && !cfg.background_transparent ? cfg.background_color : "transparent";

    const src = picture ? cfg.background_image || "" : "";
    this._loadBackground(src);
    layer.style.backgroundImage = src ? `url("${src}")` : "none";
    layer.style.backgroundRepeat = cfg.background_repeat || "no-repeat";
    layer.style.backgroundSize = this._backgroundSize(cfg);
    const top = evctpNum(cfg.background_top, 50, 0, 100);
    const left = evctpNum(cfg.background_left, 50, 0, 100);
    layer.style.backgroundPosition = `${left}% ${top}%`;
    layer.style.opacity = evctpNum(cfg.background_image_opacity, 0.7, 0, 1);
  }

  _loadBackground(src) {
    if (src === this._bgSrc) return;
    this._bgSrc = src;
    this._bgNatural = null;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      if (this._bgSrc !== src) return;
      this._bgNatural = { w: img.naturalWidth, h: img.naturalHeight };
      this._applyBackground();
    };
    img.src = src;
  }

  _backgroundSize(cfg) {
    switch (cfg.background_fit) {
      case "contain":
        return "contain";
      case "stretch":
        return "100% 100%";
      case "original":
        return "auto";
      case "scale": {
        if (!this._bgNatural) return "auto";
        const s = evctpNum(cfg.background_scale, 1, 0.1, 5);
        return `${this._bgNatural.w * s}px ${this._bgNatural.h * s}px`;
      }
      default:
        return "cover";
    }
  }

  // -------------------------------------------------------------------
  // Timers
  // -------------------------------------------------------------------

  _startTimers() {
    this._stopTimers();
    this._tickTimer = setInterval(() => this._draw(), EVCTP_NOW_TICK_MS);
    const refreshMs = evctpNum(this._config.history_refresh_min, 5, 1, 60) * 60000;
    this._refreshTimer = setInterval(() => this._loadHistory(), refreshMs);
  }

  _stopTimers() {
    clearInterval(this._tickTimer);
    clearInterval(this._refreshTimer);
    clearTimeout(this._retryTimer);
    clearTimeout(this._rateTimer);
    this._tickTimer = null;
    this._refreshTimer = null;
    this._retryTimer = null;
    this._rateTimer = null;
  }

  _scheduleRateDraw(waitMs) {
    if (this._rateTimer) return;
    this._rateTimer = setTimeout(() => {
      this._rateTimer = null;
      this._draw();
    }, waitMs);
  }

  // -------------------------------------------------------------------
  // History
  // -------------------------------------------------------------------

  // Loads history when the SOC entity changes, or on first connect
  _ensureHistory() {
    const id = this._config.soc_entity;
    if (!this._connected || !this._hass || !id) return;
    if (this._historyFor === id || this._fetching || this._retryTimer) return;
    if (this._seriesFor !== id) {
      this._gen++;
      this._series = [];
      this._lastSocChanged = null;
      this._seriesFor = id;
    }
    this._loadHistory();
  }

  async _loadHistory() {
    const cfg = this._config;
    const id = cfg.soc_entity;
    if (!this._connected || !this._hass || !id || this._fetching) return;

    this._fetching = true;
    const gen = this._gen;
    const end = new Date();
    const start = new Date(end.getTime() - evctpNum(cfg.history_hours, 1, 0.25, 24) * 3600000);

    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        entity_ids: [id],
        minimal_response: true,
        no_attributes: true,
        significant_changes_only: true
      });

      // Discard the response if the card was disconnected or the entity changed
      if (gen !== this._gen || id !== this._config.soc_entity) return;

      const hist = evctpParseHistory(res?.[id]);
      const lastHist = hist.length ? hist[hist.length - 1][0] : -Infinity;
      const live = this._series.filter((p) => p[0] > lastHist);
      this._series = [...hist, ...live];
      this._historyFor = id;
      this._failures = 0;
    } catch (err) {
      if (gen === this._gen) {
        this._failures++;
        const delay = Math.min(EVCTP_RETRY_MAX_MS, 30000 * 2 ** (this._failures - 1));
        this._retryTimer = setTimeout(() => {
          this._retryTimer = null;
          this._loadHistory();
        }, delay);
      }
    } finally {
      this._fetching = false;
    }
    this._draw();
  }

  // Keeps only what the chart can show
  _prune() {
    const keepMs = Math.max(
      evctpNum(this._config.history_hours, 1, 0.25, 24) * 3600000,
      evctpNum(this._config.window_before, 30, 0, 240) * 60000
    );
    const cutoff = Date.now() - keepMs - 60000;
    const lastOld = this._series.filter((p) => p[0] < cutoff).pop();
    const recent = this._series.filter((p) => p[0] >= cutoff);
    this._series = lastOld ? [lastOld, ...recent] : recent;
  }

  // -------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------

  _draw() {
    if (!this._connected || !this._visible || !this._config) return;

    const root = this.shadowRoot;
    const cfg = this._config;
    const hass = this._hass;
    const msg = root.querySelector(".msg");
    const readouts = root.querySelector(".readouts");
    const socState = hass?.states?.[cfg.soc_entity];
    const soc = parseFloat(socState?.state);

    if (!hass || !socState || !Number.isFinite(soc)) {
      this._canvas.style.display = "none";
      msg.style.display = "block";
      msg.textContent = cfg.soc_entity
        ? `Waiting for ${cfg.soc_entity}`
        : "Select the SOC entity in the card settings";
      readouts.textContent = "";
      return;
    }
    this._canvas.style.display = "block";
    msg.style.display = "none";

    // --- Data ----------------------------------------------------------
    const now = Date.now();
    const anchor = Date.parse(socState.last_changed) || now;
    // The target as entered may be 101 to keep the charger on. It is shown and drawn at most 100.
    const targetRaw = evctpTargetValue(cfg, hass);
    const target = targetRaw === null ? null : Math.min(100, targetRaw);
    const kw = evctpRateKw(hass, cfg);
    const batteryKwh = evctpNum(cfg.battery_kwh, 60, 20, 250);
    // Project from the reported SOC at now, not extrapolated from the last change,
    // so the remaining charge is calculated from the current moment
    const socNow = soc;

    // Full and target times are projected from now, so they always fall in the future
    const p = evctpProject({
      soc: socNow,
      anchorMs: now,
      kw,
      batteryKwh,
      target: targetRaw,
      overheadMin: evctpNum(cfg.bms_overhead_min, 30, 0, 240)
    });

    const sun = hass.states[cfg.sun_entity];
    const isDay = sun?.state === "above_horizon";
    const sunRise = Date.parse(sun?.attributes?.next_rising) || null;
    const sunSet = Date.parse(sun?.attributes?.next_setting) || null;

    // --- Time range: from before now, to predicted finish plus window_after
    const finish = p.tFullBms ?? now;
    const xStart = now - evctpNum(cfg.window_before, 30, 0, 240) * 60000;
    const xEnd = Math.max(finish, now) + evctpNum(cfg.window_after, 60, 0, 480) * 60000;
    const yMax = Math.max(100, target ?? 0);

    // --- Geometry ------------------------------------------------------
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(this._canvasWrap.clientWidth);
    const height = Math.max(120, Math.round(evctpNum(cfg.height, 360, 120, 1000) * evctpNum(cfg.height_factor, 1, 0.5, 2)));
    this._canvas.style.height = `${height}px`;
    const bmpW = Math.round(width * dpr);
    const bmpH = Math.round(height * dpr);
    if (this._canvas.width !== bmpW || this._canvas.height !== bmpH) {
      this._canvas.width = bmpW;
      this._canvas.height = bmpH;
    }

    const ctx = this._ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!this._fontFamily) {
      this._fontFamily = getComputedStyle(root.querySelector(".wrap")).fontFamily || "sans-serif";
    }
    const family = this._fontFamily;
    const font = (px) => `${px}px ${family}`;
    const axisPx = evctpNum(cfg.axis_size, 12, 8, 48);
    const annPx = evctpNum(cfg.target_v_size, 12, 8, 48); // base step for label placement
    const legendPx = evctpNum(cfg.legend_size, 12, 8, 48);
    const showPill = cfg.target_pill_show && target !== null;

    const L = 46;
    const R = width - 14;
    const T = showPill ? evctpNum(cfg.target_h_size, 12, 8, 48) + 22 : 12;
    const legendH = cfg.legend_show ? 20 : 0;
    const B = height - (18 + legendH + 6);

    const stats = [
      ["SOC", `${soc.toFixed(1)}%`],
      ["Rate", kw > 0 ? `${kw.toFixed(1)} kW` : "Not charging"]
    ];
    const targetItem =
      p.tTarget && target !== null ? [`Target ${Math.round(target)}%`, evctpFormatTime(p.tTarget, cfg.time_24h)] : null;
    const fullItem = p.tFull ? ["Full", evctpFormatTime(p.tFull, cfg.time_24h)] : null;
    // Target normally comes first. Above 100% (BMS overhead) its time falls after Full, so Full comes first.
    const timeItems = targetRaw !== null && targetRaw > 100 ? [fullItem, targetItem] : [targetItem, fullItem];
    timeItems.forEach((item) => {
      if (item) stats.push(item);
    });
    const styleKey = EVCTP_READOUT_STYLE_OPTIONS.some(([v]) => v === cfg.readout_style) ? cfg.readout_style : "pills";
    const alignKey = EVCTP_READOUT_ALIGN_OPTIONS.some(([v]) => v === cfg.readout_align) ? cfg.readout_align : "left";
    const statItems = stats
      .map(([k, v]) => `<span class="stat"><span class="k">${evctpEsc(k)}</span><b>${evctpEsc(v)}</b></span>`)
      .join("");
    const readoutHtml = styleKey === "boxed" ? `<span class="box">${statItems}</span>` : statItems;
    readouts.dataset.style = styleKey;
    readouts.dataset.align = alignKey;
    if (readouts._html !== readoutHtml) {
      readouts._html = readoutHtml;
      readouts.innerHTML = readoutHtml;
    }

    // Start at the chosen size and step down until the row fits on one line
    const baseReadoutPx = evctpNum(cfg.readout_size, 13, 8, 48);
    let readoutPx = baseReadoutPx;
    readouts.style.fontSize = `${readoutPx}px`;
    if (readouts.clientWidth > 0) {
      while (readouts.scrollWidth > readouts.clientWidth + 1 && readoutPx > 9) {
        readoutPx -= 1;
        readouts.style.fontSize = `${readoutPx}px`;
      }
    }
    this._lastRateKw = kw;
    this._lastDrawAt = now;

    if (R - L < 60 || B - T < 60) return;

    const xOf = (t) => L + ((t - xStart) / (xEnd - xStart)) * (R - L);
    const yOf = (v) => B - (v / yMax) * (B - T);

    // --- Grid and axes (not clipped) -----------------------------------
    ctx.font = (cfg.axis_bold ? "bold " : "") + font(axisPx);
    ctx.textBaseline = "middle";
    ctx.strokeStyle = cfg.grid_color;
    ctx.globalAlpha = evctpNum(cfg.grid_opacity, 0.2, 0, 1);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let v = 0; v <= yMax; v += 20) {
      ctx.beginPath();
      ctx.moveTo(L, yOf(v));
      ctx.lineTo(R, yOf(v));
      ctx.stroke();
    }
    const step = evctpTimeStep(xEnd - xStart);
    const firstTick = Math.ceil(xStart / step) * step;
    for (let t = firstTick; t <= xEnd; t += step) {
      ctx.beginPath();
      ctx.moveTo(xOf(t), T);
      ctx.lineTo(xOf(t), B);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.globalAlpha = evctpNum(cfg.axis_opacity, 1, 0, 1);
    ctx.fillStyle = cfg.axis_color;
    ctx.textAlign = "right";
    for (let v = 0; v <= yMax; v += 20) ctx.fillText(v.toFixed(1), L - 6, yOf(v));
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let t = firstTick; t <= xEnd; t += step) {
      ctx.fillText(evctpFormatTime(t, cfg.time_24h), xOf(t), B + 6);
    }
    ctx.textBaseline = "middle";

    // --- Plot content (clipped to the plot area) ----------------------
    ctx.save();
    ctx.beginPath();
    ctx.rect(L, T, R - L, B - T);
    ctx.clip();

    const band = (t1, t2, color, alpha) => {
      if (!t1 || !t2) return;
      const a = Math.max(t1, xStart);
      const b = Math.min(t2, xEnd);
      if (b <= a) return;
      ctx.globalAlpha = evctpNum(alpha, 1, 0, 1);
      ctx.fillStyle = color;
      ctx.fillRect(xOf(a), T, xOf(b) - xOf(a), B - T);
    };

    // Day and night shading. Built from every sunrise and sunset around the window,
    // so each segment is day or night regardless of the current sun state.
    if (sunRise && sunSet && (cfg.show_daylight || cfg.show_night)) {
      const events = [];
      for (let k = -2; k <= 2; k++) {
        events.push([sunRise + k * EVCTP_DAY_MS, "rise"], [sunSet + k * EVCTP_DAY_MS, "set"]);
      }
      events.sort((a, b) => a[0] - b[0]);

      // Sun state at the start of the window: the last event at or before it decides
      const before = events.filter((e) => e[0] <= xStart);
      let dayNow = before.length ? before[before.length - 1][1] === "rise" : isDay;

      const paint = (a, b, day) => {
        if (day && cfg.show_daylight) band(a, b, cfg.sun_color, cfg.sun_opacity);
        if (!day && cfg.show_night) band(a, b, cfg.night_color, cfg.night_opacity);
      };

      let cursor = xStart;
      for (const [t, type] of events) {
        if (t <= xStart) continue;
        if (t >= xEnd) break;
        paint(cursor, t, dayNow);
        cursor = t;
        dayNow = type === "rise";
      }
      paint(cursor, xEnd, dayNow);
    }

    const path = (pts, style) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      pts.forEach(([t, v], i) => (i ? ctx.lineTo(xOf(t), yOf(v)) : ctx.moveTo(xOf(t), yOf(v))));
      ctx.setLineDash(EVCTP_DASH[style.dash] || []);
      ctx.lineWidth = evctpNum(style.width, 2, 1, 10);
      ctx.strokeStyle = style.color;
      ctx.globalAlpha = evctpNum(style.alpha, 1, 0, 1);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Actual history, with one point before the window so the line enters from the edge.
    // It ends at the estimated SOC at Now, so the colour change sits on the Now line.
    const visible = [];
    let before = null;
    for (const pt of this._series) {
      if (pt[0] < xStart) {
        before = pt;
        continue;
      }
      if (before) {
        visible.push(before);
        before = null;
      }
      visible.push(pt);
    }
    // Hold the first known value back to the window start, so the line always reaches the left edge
    if (visible.length && visible[0][0] > xStart) {
      visible.unshift([xStart, visible[0][1]]);
    } else if (before && !visible.length) {
      visible.push([xStart, before[1]]);
    }
    visible.push([now, socNow]);
    path(visible, {
      color: cfg.actual_color, width: cfg.actual_width, dash: cfg.actual_dash, alpha: cfg.actual_opacity
    });

    // Projected line, starting at the same point
    path(evctpProjectedPoints(p, now, socNow, xEnd), {
      color: cfg.projected_color, width: cfg.projected_width, dash: cfg.projected_dash, alpha: cfg.projected_opacity
    });

    // Target horizontal line
    if (target !== null) {
      path([[xStart, target], [xEnd, target]], {
        color: cfg.target_color, width: cfg.target_width, dash: cfg.target_dash, alpha: cfg.target_opacity
      });
    }

    // Vertical markers, with label candidates collected for placement
    const items = [];
    // Each label element's own style. bg is null when "no background" is ticked.
    const labelOf = (k) => {
      const px = evctpNum(cfg[`${k}_size`], 12, 8, 48);
      return {
        px,
        font: (cfg[`${k}_bold`] ? "bold " : "") + font(px),
        fg: cfg[`${k}_text`],
        bg: cfg[`${k}_bg_none`] ? null : cfg[`${k}_bg`],
        alpha: evctpNum(cfg[`${k}_opacity`], 1, 0, 1)
      };
    };
    const vline = (t, color, alpha, text, prio, lbl) => {
      if (t === null || t === undefined || t < xStart || t > xEnd) return;
      const x = xOf(t);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = color;
      ctx.globalAlpha = evctpNum(alpha, 1, 0, 1);
      ctx.beginPath();
      ctx.moveTo(x, T);
      ctx.lineTo(x, B);
      ctx.stroke();
      ctx.setLineDash([]);
      items.push({ x, text, prio, ...lbl });
    };

    if (target !== null && p.tTarget) {
      vline(
        p.tTarget,
        cfg.target_color,
        cfg.target_marker_opacity,
        `Target ${Math.round(target)}% ${evctpFormatTime(p.tTarget, cfg.time_24h)}`,
        0,
        labelOf("target_v")
      );
    }
    if (cfg.show_full && p.tFull && soc < 100) {
      vline(p.tFull, cfg.full_color, cfg.full_marker_opacity, `100% (Full) ${evctpFormatTime(p.tFull, cfg.time_24h)}`, 1, labelOf("full"));
    }
    if (cfg.show_now) {
      vline(now, cfg.now_color, cfg.now_marker_opacity, "Now", 2, labelOf("now"));
    }
    // SOC at any time on the chart: history before Now, projection after it
    const socHistPts = this._series
      .filter((pt) => pt[0] <= now)
      .slice()
      .sort((a, b) => a[0] - b[0])
      .concat([[now, socNow]]);
    const socProjPts = evctpProjectedPoints(p, now, socNow, xEnd);
    const socTag = (t) => {
      const v = evctpValueAt(t <= now ? socHistPts : socProjPts, t);
      return v === null ? "" : ` · SOC ${v.toFixed(1)}%`;
    };

    if (cfg.show_sun_markers) {
      for (let k = -2; k <= 2; k++) {
        if (sunRise) {
          const t = sunRise + k * EVCTP_DAY_MS;
          vline(t, cfg.sunrise_color, cfg.sun_marker_opacity, `Sunrise ${evctpFormatTime(t, cfg.time_24h)}${socTag(t)}`, 3, labelOf("sunrise"));
        }
        if (sunSet) {
          const t = sunSet + k * EVCTP_DAY_MS;
          vline(t, cfg.sunset_color, cfg.sun_marker_opacity, `Sunset ${evctpFormatTime(t, cfg.time_24h)}${socTag(t)}`, 3, labelOf("sunset"));
        }
      }
    }

    ctx.restore();

    // --- Labels (not clipped, placed to avoid overlap) ----------------
    ctx.font = font(annPx);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const placed = evctpPlaceLabels(ctx, items, { L, R, T, B }, annPx, evctpNum(cfg.label_max_shift, 40, 0, 200));
    placed.forEach((it) => {
      const r = it.rect;
      if (it.bg) {
        ctx.globalAlpha = it.alpha;
        ctx.fillStyle = it.bg;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h - 4);
      ctx.rotate(-Math.PI / 2);
      ctx.font = it.font;
      ctx.globalAlpha = it.alpha;
      ctx.fillStyle = it.fg;
      ctx.fillText(it.text, 0, 0);
      ctx.restore();
    });

    // Target value pill, horizontal, at the right-hand end of its level, sitting above the line
    if (showPill) {
      const hl = labelOf("target_h");
      const txt = `Target ${Math.round(target)}%`;
      ctx.font = hl.font;
      const w = ctx.measureText(txt).width + 12;
      const h = hl.px + 8;
      const x = R - w;
      const y = yOf(target) - h - 2;
      if (hl.bg) {
        ctx.globalAlpha = hl.alpha;
        ctx.fillStyle = hl.bg;
        ctx.fillRect(x, y, w, h);
      }
      ctx.globalAlpha = hl.alpha;
      ctx.fillStyle = hl.fg;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, x + w / 2, y + h / 2);
    }

    // --- Legend ---------------------------------------------------------
    if (cfg.legend_show) {
      ctx.font = (cfg.legend_bold ? "bold " : "") + font(legendPx);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const entries = [
        ["Actual", cfg.actual_color, cfg.actual_opacity],
        ["Projected", cfg.projected_color, cfg.projected_opacity],
        [target !== null ? `Target: ${Math.round(target)} %` : "Target", cfg.target_color, cfg.target_opacity]
      ];
      const dot = 5;
      const gap = 18;
      const widths = entries.map(([label]) => ctx.measureText(label).width + dot * 2 + 6);
      const total = widths.reduce((a, b) => a + b, 0) + gap * (entries.length - 1);
      let x = (width - total) / 2;
      const y = height - 10;
      if (!cfg.legend_bg_none) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = cfg.legend_bg;
        ctx.fillRect(x - 8, y - 11, total + 16, 22);
      }
      entries.forEach(([label, color, alpha], i) => {
        ctx.globalAlpha = evctpNum(alpha, 1, 0, 1);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + dot, y, dot, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = evctpNum(cfg.legend_opacity, 1, 0, 1);
        ctx.fillStyle = cfg.legend_color;
        ctx.fillText(label, x + dot * 2 + 6, y);
        x += widths[i] + gap;
      });
    }

    ctx.globalAlpha = 1;
  }
}

// =====================================================================
// Editor
// =====================================================================

class EvChargeTimePredictionEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = evctpBuildConfig({});
    this._hass = null;
    this._built = false;
    this._lastFired = null;
    this._openSet = null; // which sections are open, kept across re-renders
    this.shadowRoot.addEventListener("change", (e) => this._onChange(e));
  }

  setConfig(config) {
    const incoming = evctpBuildConfig(config);
    // Skip our own echoed changes so the form isn't rebuilt while typing
    if (this._built && JSON.stringify(this._strip(incoming)) === this._lastFired) return;
    this._config = incoming;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      this._render();
    } else {
      this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((p) => (p.hass = hass));
    }
  }

  connectedCallback() {
    if (!this._built) this._render();
  }

  // Only values that differ from the defaults
  _strip(cfg) {
    const changed = {};
    Object.keys(cfg).forEach((key) => {
      if (JSON.stringify(cfg[key]) !== JSON.stringify(EVCTP_DEFAULTS[key])) changed[key] = cfg[key];
    });
    return changed;
  }

  _fire() {
    const changed = this._strip(this._config);
    this._lastFired = JSON.stringify(changed);
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: changed },
        bubbles: true,
        composed: true
      })
    );
  }

  _onChange(e) {
    const el = e.target;

    if (el?.dataset?.bgPreset !== undefined) {
      const pos = EVCTP_BG_PRESETS[el.value];
      if (!pos) return;
      this._config = { ...this._config, background_top: pos[0], background_left: pos[1] };
      this._fire();
      this._render();
      return;
    }

    const path = el?.dataset?.path;
    if (!path) return;

    let value;
    if (el.type === "checkbox") value = el.checked;
    else if (el.type === "number") value = el.value === "" ? "" : Math.round(Number(el.value) * 1000) / 1000;
    else value = el.value;

    this._config = { ...this._config, [path]: value };
    this._fire();
    // Some options reveal or hide other fields
    if (["background_fit", "background_type", "rate_preference", "target_use_fixed"].includes(path)) this._render();
  }

  // ---- Field helpers ------------------------------------------------

  _field(label, inner) {
    return `<div class="field"><label>${evctpEsc(label)}</label>${inner}</div>`;
  }

  _num(label, path, min, max, step) {
    return this._field(
      label,
      `<input type="number" data-path="${path}" min="${min}" max="${max}" step="${step}" value="${evctpEsc(this._config[path])}" />`
    );
  }

  _opacity(label, path) {
    return this._num(label, path, 0, 1, 0.05);
  }

  _text(label, path) {
    return this._field(label, `<input type="text" data-path="${path}" value="${evctpEsc(this._config[path])}" />`);
  }

  _color(label, path) {
    return this._field(label, `<input type="color" data-path="${path}" value="${evctpColor(this._config[path])}" />`);
  }

  _check(label, path) {
    return `
      <div class="check">
        <input type="checkbox" data-path="${path}" ${this._config[path] ? "checked" : ""} />
        <label>${evctpEsc(label)}</label>
      </div>`;
  }

  _select(label, path, options, current = this._config[path]) {
    const cur = String(current ?? "");
    const opts = options
      .map(([v, l]) => `<option value="${evctpEsc(v)}" ${cur === String(v) ? "selected" : ""}>${evctpEsc(l)}</option>`)
      .join("");
    return this._field(label, `<select data-path="${path}">${opts}</select>`);
  }

  _picker(label, key, domains) {
    return this._field(label, `<div data-picker="${key}" data-domains="${domains.join(",")}"></div>`);
  }

  _row(...items) {
    return `<div class="row">${items.map((i) => `<div class="cell">${i}</div>`).join("")}</div>`;
  }

  _hint(text) {
    return `<p class="hint">${evctpEsc(text)}</p>`;
  }

  // Sections keep their open or closed state across re-renders
  _section(title, body, defaultOpen = false) {
    const isOpen = this._openSet ? this._openSet.has(title) : defaultOpen;
    return `
      <details class="section" data-sec="${evctpEsc(title)}" ${isOpen ? "open" : ""}>
        <summary>${evctpEsc(title)}</summary>
        <div class="section-body">${body}</div>
      </details>`;
  }

  _captureOpen() {
    const details = this.shadowRoot.querySelectorAll("details[data-sec]");
    if (!details.length) return;
    this._openSet = new Set([...details].filter((d) => d.open).map((d) => d.dataset.sec));
  }

  _lineGroup(label, key) {
    return `
      <strong class="sub">${label}</strong>
      ${this._row(
        this._color("Colour", `${key}_color`),
        this._num("Width", `${key}_width`, 1, 10, 1),
        this._select("Dash", `${key}_dash`, [["solid", "Solid"], ["dashed", "Dashed"], ["dotted", "Dotted"]]),
        this._opacity("Opacity", `${key}_opacity`)
      )}`;
  }

  // Background fields for the chosen type only
  _backgroundBody() {
    const cfg = this._config;
    const mode = evctpBgMode(cfg);

    const typeSelect = this._select("Background type", "background_type", EVCTP_BG_TYPE_OPTIONS, mode);

    if (mode === "solid") {
      return [
        typeSelect,
        this._color("Background colour", "background_color"),
        this._check("Transparent (show the dashboard behind the card)", "background_transparent")
      ].join("");
    }

    const bgPresetOptions = [
      ["top-left", "Top left"], ["top-center", "Top centre"], ["top-right", "Top right"],
      ["center-left", "Centre left"], ["center", "Centre"], ["center-right", "Centre right"],
      ["bottom-left", "Bottom left"], ["bottom-center", "Bottom centre"], ["bottom-right", "Bottom right"]
    ];

    return [
      typeSelect,
      this._text("Image path (e.g. /local/Car/ev.jpg)", "background_image"),
      this._opacity("Image opacity (0-1)", "background_image_opacity"),
      this._select("Image fit", "background_fit", [
        ["cover", "Cover"], ["contain", "Contain"], ["stretch", "Stretch"],
        ["original", "Original size"], ["scale", "Scale (factor of original)"]
      ]),
      cfg.background_fit === "scale"
        ? this._num("Scale (1 = original size)", "background_scale", 0.1, 5, 0.05)
        : "",
      this._select("Repeat", "background_repeat", [
        ["no-repeat", "No repeat"], ["repeat", "Repeat"], ["repeat-x", "Repeat horizontally"],
        ["repeat-y", "Repeat vertically"], ["space", "Space"], ["round", "Round"]
      ]),
      this._field(
        "Position preset (fills Top and Left)",
        `<select data-bg-preset><option value="">Choose a preset...</option>${bgPresetOptions
          .map(([v, l]) => `<option value="${v}">${l}</option>`)
          .join("")}</select>`
      ),
      this._row(
        this._num("Top (%)", "background_top", 0, 100, 1),
        this._num("Left (%)", "background_left", 0, 100, 1)
      )
    ].join("");
  }

  // ---- Text and label styles ------------------------------------------

  _styleCell(kind, path) {
    const v = this._config[path];
    if (kind === "size") {
      return `<input type="number" data-path="${path}" min="8" max="48" step="1" value="${evctpEsc(v)}" />`;
    }
    if (kind === "opacity") {
      return `<input type="number" data-path="${path}" min="0" max="1" step="0.05" value="${evctpEsc(v)}" />`;
    }
    if (kind === "color") {
      return `<input type="color" data-path="${path}" value="${evctpColor(v)}" />`;
    }
    return `<input type="checkbox" data-path="${path}" ${v ? "checked" : ""} />`;
  }

  _stylesSection() {
    const labelKeys = (k) => ({
      size: `${k}_size`,
      text: `${k}_text`,
      bg: `${k}_bg`,
      bgNone: `${k}_bg_none`,
      opacity: `${k}_opacity`,
      bold: `${k}_bold`
    });
    // Column order and the control each column uses
    const cols = [
      ["size", "Size", "size"],
      ["text", "Text", "color"],
      ["bg", "Background", "color"],
      ["bgNone", "No bg", "check"],
      ["opacity", "Opacity", "opacity"],
      ["bold", "Bold", "check"]
    ];
    const rows = [
      ["Title", { size: "title_size", text: "title_color", bg: "title_bg", bgNone: "title_bg_none", opacity: "title_opacity", bold: "title_bold" }],
      ["Info bar (readouts)", { size: "readout_size", text: "readout_color", bg: "readout_bar_bg", bgNone: "readout_bar_bg_none", opacity: "readout_opacity", bold: "readout_bold" }],
      ["Axis numbers and times", { size: "axis_size", text: "axis_color", opacity: "axis_opacity", bold: "axis_bold" }],
      ["Legend", { size: "legend_size", text: "legend_color", bg: "legend_bg", bgNone: "legend_bg_none", opacity: "legend_opacity", bold: "legend_bold" }],
      ["Target (vertical)", labelKeys("target_v")],
      ["Target (horizontal)", labelKeys("target_h")],
      ["100% (vertical)", labelKeys("full")],
      ["Now (vertical)", labelKeys("now")],
      ["Sunrise (vertical)", labelKeys("sunrise")],
      ["Sunset (vertical)", labelKeys("sunset")]
    ];
    const head = `<div class="g-head">Element</div>${cols.map(([, label]) => `<div class="g-head">${label}</div>`).join("")}`;
    const body = rows
      .map(
        ([name, keys]) =>
          `<div class="g-name">${evctpEsc(name)}</div>` +
          cols.map(([k, , kind]) => `<div class="g-cell">${keys[k] ? this._styleCell(kind, keys[k]) : ""}</div>`).join("")
      )
      .join("");
    return this._section(
      "Text and label styles",
      `<p class="hint">Each element has its own size, text colour, background, opacity and bold. Vertical and horizontal show where the label sits on the graph.</p>
       <div class="style-grid">${head}${body}</div>`,
      true
    );
  }

  // ---- Render -------------------------------------------------------

  _render() {
    this._captureOpen();
    const cfg = this._config;

    // Second charge rate source and preference only appear once the first is chosen
    // Preference only matters with two sources, so it appears once the second is set
    const preferenceBlock = cfg.rate_second_entity
      ? `${this._select("Rate preference", "rate_preference", EVCTP_RATE_PREFERENCE_OPTIONS)}
         ${this._hint("The preferred source is used when it reads above zero. Otherwise the other source is used. Set the first to your home charger and the second to the calculated rate, so public charging still works.")}`
      : "";
    const rateSecondBlock = cfg.rate_first_entity
      ? `${this._picker("Second charge rate entity", "rate_second_entity", ["sensor", "input_number"])}
         ${preferenceBlock}`
      : "";

    const sections = [
      this._section("Layout", [
        this._row(
          this._num("Height (px)", "height", 120, 1000, 10),
          this._num("Height factor", "height_factor", 0.5, 2, 0.05)
        ),
        this._check("24-hour time", "time_24h")
      ].join(""), true),

      this._section("Title", [
        this._check("Show title", "title_show"),
        this._text("Title text", "title"),
        this._select("Alignment", "title_align", [["left", "Left"], ["center", "Centre"], ["right", "Right"]])
      ].join("")),

      this._section("Background", this._backgroundBody()),

      this._section("Text", [
        this._select("Font family", "font_family", EVCTP_FONT_OPTIONS),
        this._check("Show readouts", "readouts_show"),
        this._select("Readout style", "readout_style", EVCTP_READOUT_STYLE_OPTIONS),
        this._select("Readout placement", "readout_align", EVCTP_READOUT_ALIGN_OPTIONS),
        this._check("Show legend", "legend_show")
      ].join("")),

      this._stylesSection(),

      this._section("Lines", [
        this._lineGroup("Actual (history)", "actual"),
        this._lineGroup("Projected", "projected"),
        this._lineGroup("Target", "target")
      ].join("")),

      this._section("Markers and labels", [
        this._check("Show target value pill", "target_pill_show"),
        this._opacity("Target marker opacity", "target_marker_opacity"),
        this._check("Show 100% marker", "show_full"),
        this._row(
          this._color("100% colour", "full_color"),
          this._opacity("Opacity", "full_marker_opacity")
        ),
        this._check("Show now marker", "show_now"),
        this._row(
          this._color("Now colour", "now_color"),
          this._opacity("Opacity", "now_marker_opacity")
        ),
        this._num("Max label shift (px)", "label_max_shift", 0, 200, 5),
        this._color("Grid colour", "grid_color"),
        this._opacity("Grid opacity", "grid_opacity")
      ].join("")),

      this._section("Sun", [
        this._check("Show sunrise and sunset markers", "show_sun_markers"),
        this._row(
          this._color("Sunrise colour", "sunrise_color"),
          this._color("Sunset colour", "sunset_color"),
          this._opacity("Marker opacity", "sun_marker_opacity")
        ),
        this._check("Show daylight shading", "show_daylight"),
        this._row(
          this._color("Daylight colour", "sun_color"),
          this._opacity("Daylight opacity", "sun_opacity")
        ),
        this._check("Show night shading", "show_night"),
        this._row(
          this._color("Night colour", "night_color"),
          this._opacity("Night opacity", "night_opacity")
        )
      ].join("")),

      this._section("Window and prediction", [
        this._num("Battery size (kWh)", "battery_kwh", 20, 250, 0.5),
        this._num("BMS overhead for 101% target (min)", "bms_overhead_min", 0, 120, 5),
        this._num("Minutes shown before now", "window_before", 0, 240, 5),
        this._num("Minutes shown after 100%", "window_after", 0, 480, 5),
        this._num("History loaded (hours)", "history_hours", 0.25, 24, 0.25),
        this._num("History refresh (minutes)", "history_refresh_min", 1, 60, 1)
      ].join("")),

      this._section("Entities", [
        this._picker("SOC entity", "soc_entity", ["input_number", "sensor"]),
        this._check("Use a fixed target percentage instead of a target entity", "target_use_fixed"),
        cfg.target_use_fixed
          ? this._num("Target (%)", "target_percent", 0, 101, 1) +
            this._hint("Set to 101% to calculate the full-charge time with BMS balancing overhead.")
          : this._picker("Target entity", "target_entity", ["input_number", "input_select", "sensor"]),
        this._picker("First charge rate entity", "rate_first_entity", ["sensor", "input_number"]),
        rateSecondBlock,
        this._picker("Sun entity", "sun_entity", ["sun"])
      ].join(""), true)
    ];

    this.shadowRoot.innerHTML = `
      <style>
        .field { display: flex; flex-direction: column; margin-bottom: 10px; }
        .row { display: flex; gap: 8px; align-items: flex-end; margin-bottom: 10px; }
        .cell { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .cell .field { margin-bottom: 0; }
        .check { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .check label { margin: 0; }
        label { font-size: 12px; margin-bottom: 4px; opacity: 0.8; }
        .sub { display: block; margin: 6px 0 4px; font-size: 13px; }
        .hint { font-size: 12px; opacity: 0.7; margin: -4px 0 10px; }
        input[type="text"], input[type="number"], select {
          box-sizing: border-box;
          width: 100%;
          padding: 6px;
          border-radius: 6px;
          border: 1px solid var(--divider-color, #444);
          background: var(--card-background-color, #1c1c1c);
          color: var(--primary-text-color, #fff);
        }
        input[type="color"] {
          width: 56px;
          height: 34px;
          padding: 2px;
          border: none;
          background: none;
          cursor: pointer;
        }
        .section { margin-bottom: 8px; border-bottom: 1px solid var(--divider-color, #333); padding-bottom: 6px; }
        summary { cursor: pointer; font-weight: 600; padding: 6px 0; }
        .section-body { padding-top: 6px; }
        .style-grid {
          display: grid;
          grid-template-columns: 1.6fr 0.7fr 0.7fr 0.8fr 0.6fr 0.8fr 0.5fr;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }
        .g-head { font-size: 11px; opacity: 0.7; }
        .g-name { font-size: 13px; }
        .g-cell { display: flex; justify-content: center; }
        .style-grid input[type="number"] { width: 100%; box-sizing: border-box; min-width: 0; }
      </style>
      ${sections.join("")}
    `;

    this._built = true;
    this._mountPickers();
  }

  _mountPickers() {
    const hasPicker = !!customElements.get("ha-entity-picker");

    this.shadowRoot.querySelectorAll("[data-picker]").forEach((slot) => {
      const key = slot.dataset.picker;
      const domains = (slot.dataset.domains || "").split(",").filter(Boolean);
      slot.innerHTML = "";

      if (hasPicker) {
        const picker = document.createElement("ha-entity-picker");
        picker.hass = this._hass;
        picker.value = this._config[key] || "";
        picker.includeDomains = domains;
        picker.setAttribute("allow-custom-entity", "");
        picker.addEventListener("value-changed", (e) => {
          const val = e.detail?.value ?? "";
          if (val === (this._config[key] || "")) return;

          const patch = { [key]: val };
          // Clearing the first source also clears the second
          if (key === "rate_first_entity" && !val) patch.rate_second_entity = "";
          this._config = { ...this._config, ...patch };
          this._fire();
          // The second source and preference appear or disappear with the first
          if (key === "rate_first_entity" || key === "rate_second_entity") this._render();
        });
        slot.appendChild(picker);
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = this._config[key] || "";
        input.dataset.path = key;
        slot.appendChild(input);
      }
    });
  }
}

// =====================================================================
// Registration
// =====================================================================

if (!customElements.get(EVCTP_TYPE)) {
  customElements.define(EVCTP_TYPE, EvChargeTimePrediction);
}
if (!customElements.get(`${EVCTP_TYPE}-editor`)) {
  customElements.define(`${EVCTP_TYPE}-editor`, EvChargeTimePredictionEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === EVCTP_TYPE)) {
  window.customCards.push({
    type: EVCTP_TYPE,
    name: "EV Charge Time Prediction",
    description: "SOC history with a projected charge curve, target and full-charge times."
  });
}
