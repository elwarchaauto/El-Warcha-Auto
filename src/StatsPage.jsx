// ============================================================
// STATS PAGE — El Warcha Auto (Enhanced v2)
// Drop this component into App.jsx:
//   1. Import: add StatsPage to your imports
//   2. Nav: add {id:"stats", icon:"📊", l:"Statistiques"} to NAV_ITEMS
//   3. renderPage: add case "stats": return <StatsPage cars={cars} dealers={dealers} settings={settings} setPage={setPage} setSelectedCar={setSelectedCar} setSelectedDealer={setSelectedDealer}/>
// ============================================================

import React, { useState, useMemo, useRef, useEffect } from "react";

// ── helpers ──────────────────────────────────────────────────
const fmt = n => n != null ? new Intl.NumberFormat("fr-DZ").format(Math.round(n)) : "—";

const calcDZD = (cny, s, usd = null, currency = "CNY") => {
  if (!s?.usd_dzd_rate) return null;
  let priceUSD;
  if (currency === "USD" && usd) priceUSD = parseFloat(usd);
  else if (cny && s?.cny_usd_rate) priceUSD = parseFloat(cny) * parseFloat(s.cny_usd_rate);
  else return null;
  if (!priceUSD) return null;
  const margin = parseFloat(s.margin_dzd) || 0;
  return Math.round(
    (priceUSD + (parseFloat(s.shipment_fee_usd) || 0)) * parseFloat(s.usd_dzd_rate) + margin
  );
};

// Count how many equipment options a car has
const equipScore = (car) => {
  const eq = car.car_equipment?.[0];
  if (!eq) return 0;
  return Object.values(eq).filter(v => v === true).length;
};

// How many days since a date string
const daysAgo = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const stockAgeBadge = (days) => {
  if (days === null) return null;
  if (days <= 14)  return { label: `${days}j`, bg: "#d1fae5", color: "#065f46" };
  if (days <= 30)  return { label: `${days}j`, bg: "#fef9c3", color: "#713f12" };
  if (days <= 60)  return { label: `${days}j`, bg: "#fee2e2", color: "#991b1b" };
  return { label: `${days}j ⚠️`, bg: "#fce7f3", color: "#831843" };
};

const COLOR_HEX = {
  Noir: "#111", Blanc: "#fff", Gris: "#888", Argent: "#C0C0C0",
  Bleu: "#2563eb", Rouge: "#dc2626", Vert: "#16a34a", Orange: "#ea580c",
  Beige: "#d4b896", Marron: "#78350f", Or: "#ca8a04", Rose: "#ec4899",
  Violet: "#7c3aed", Autre: "#6b7280",
};

const BRAND_COLORS = [
  "#d36135","#2563eb","#16a34a","#9333ea","#ca8a04","#0891b2",
  "#dc2626","#65a30d","#7c3aed","#db2777","#0284c7","#059669",
  "#d97706","#6366f1","#e11d48","#0d9488","#4f46e5","#b45309",
];

const EQUIP_LABELS = {
  sun_roof: "☀️ Sun Roof", leather_seat: "🪑 Cuir", power_seat: "⚡ Siège élec.",
  seat_heating: "🌡️ Chauf. siège", seat_ventilation: "💨 Ventil. siège",
  alloy_wheel: "🔘 Jantes alu", led_lights: "💡 LED Lights", camera_360: "📷 360° Caméra",
  adaptive_cruise: "🚗 Cruise Control", auto_ac: "❄️ Clim Auto", abs: "🛑 ABS",
  driver_airbag: "💺 Airbag", power_window: "🔲 Vitres élec.", gps: "🗺️ GPS",
  bluetooth: "📶 Bluetooth", keyless_entry: "🔑 Keyless Entry",
  parking_sensors: "📡 Capteurs park.", start_stop: "🔄 Start/Stop",
  cd_dvd: "📀 CD/DVD", tv: "📺 Écran TV",
};
const TOTAL_EQUIP = Object.keys(EQUIP_LABELS).length;

const STag = ({ status }) => {
  const m = {
    available: { bg: "#d1fae5", color: "#065f46", label: "Disponible" },
    sold:      { bg: "#fee2e2", color: "#991b1b", label: "Vendu" },
    reserved:  { bg: "#fef3c7", color: "#92400e", label: "Réservé" },
  };
  const s = m[status] || m.available;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

// ── KPI Card ─────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, accent }) => (
  <div style={{
    background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12,
    padding: "16px 18px", borderLeft: `4px solid ${accent || "#d36135"}`,
  }}>
    <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: "#1c1c1c", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#9a9a9a", marginTop: 4 }}>{sub}</div>}
  </div>
);

// ── Mini bar chart (pure SVG) ─────────────────────────────────
const BarChart = ({ data, height = 180, color = "#d36135", onClickBar }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(14, Math.min(40, (560 / data.length) - 6));
  const chartW = data.length * (barW + 6);
  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <svg width={Math.max(chartW, 300)} height={height + 36} style={{ display: "block" }}>
        {data.map((d, i) => {
          const barH = Math.max(4, Math.round((d.value / max) * height));
          const x = i * (barW + 6);
          const y = height - barH;
          return (
            <g key={d.label} onClick={() => onClickBar && onClickBar(d)} style={{ cursor: onClickBar ? "pointer" : "default" }}>
              <rect x={x} y={y} width={barW} height={barH} rx={3} fill={d.color || color}
                onMouseEnter={e => e.target.setAttribute("opacity", ".75")}
                onMouseLeave={e => e.target.setAttribute("opacity", "1")} />
              <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill="#9a9a9a" style={{ fontFamily: "Barlow, sans-serif" }}>
                {d.label.length > 6 ? d.label.slice(0, 5) + "…" : d.label}
              </text>
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize={9} fontWeight={700} fill={d.color || color} style={{ fontFamily: "Barlow, sans-serif" }}>
                  {d.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Range bar chart for min/max/avg per brand ─────────────────
const RangeBarChart = ({ data, height = 200 }) => {
  const allVals = data.flatMap(d => [d.min, d.max]);
  const maxVal = Math.max(...allVals, 1);
  const barH = 18;
  const labelW = 90;
  const chartW = 420;
  const totalH = data.length * (barH + 10) + 30;

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: height + 40 }}>
      <svg width={labelW + chartW + 80} height={totalH} style={{ display: "block", fontFamily: "Barlow, sans-serif" }}>
        {data.map((d, i) => {
          const y = i * (barH + 10);
          const xMin = (d.min / maxVal) * chartW;
          const xMax = (d.max / maxVal) * chartW;
          const xAvg = (d.avg / maxVal) * chartW;
          const rangeW = Math.max(xMax - xMin, 4);
          return (
            <g key={d.label}>
              <text x={labelW - 6} y={y + barH - 4} textAnchor="end" fontSize={11} fontWeight={700} fill="#555">
                {d.label.length > 9 ? d.label.slice(0, 8) + "…" : d.label}
              </text>
              {/* Track */}
              <rect x={labelW} y={y + 4} width={chartW} height={barH - 8} rx={3} fill="#f0f0f0" />
              {/* Range */}
              <rect x={labelW + xMin} y={y + 2} width={rangeW} height={barH - 4} rx={3} fill={d.color || "#d36135"} opacity={0.3} />
              {/* Avg marker */}
              <rect x={labelW + xAvg - 2} y={y} width={4} height={barH} rx={2} fill={d.color || "#d36135"} />
              {/* Labels */}
              <text x={labelW + xMin} y={y + barH + 8} fontSize={8} fill="#9a9a9a" textAnchor="middle">${Math.round(d.min / 1000)}k</text>
              <text x={labelW + xMax} y={y + barH + 8} fontSize={8} fill="#9a9a9a" textAnchor="middle">${Math.round(d.max / 1000)}k</text>
              <text x={labelW + xAvg} y={y - 2} fontSize={8} fontWeight={700} fill={d.color || "#d36135"} textAnchor="middle">⌀${Math.round(d.avg / 1000)}k</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── Donut chart ───────────────────────────────────────────────
const DonutChart = ({ slices, size = 130 }) => {
  const r = 50, cx = 65, cy = 65;
  const total = slices.reduce((s, x) => s + x.value, 0);
  let angle = -Math.PI / 2;
  const paths = slices.map(sl => {
    const frac = sl.value / total;
    const start = angle;
    angle += frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = frac > 0.5 ? 1 : 0;
    return { ...sl, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z` };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 130 130">
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} stroke="#fff" strokeWidth={1.5} />)}
      <circle cx={cx} cy={cy} r={32} fill="#fff" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={14} fontWeight={900} fill="#1c1c1c" fontFamily="Barlow Condensed, sans-serif">{total}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize={8} fontWeight={700} fill="#9a9a9a" fontFamily="Barlow, sans-serif">TOTAL</text>
    </svg>
  );
};

// ── Section header ────────────────────────────────────────────
const SecHead = ({ title }) => (
  <div style={{ background: "#1c1c1c", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{ color: "#d36135", fontSize: 18, fontWeight: 900 }}>|</span>
    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 16, color: "#fff", letterSpacing: ".03em" }}>{title}</span>
  </div>
);

// ── Equipment score bar ───────────────────────────────────────
const EquipBar = ({ score, total = TOTAL_EQUIP, compact = false }) => {
  const pct = Math.round((score / total) * 100);
  const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#9a9a9a";
  if (compact) return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ flex: 1, height: 5, background: "#e5e5e5", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, color, minWidth: 28 }}>{score}/{total}</span>
    </div>
  );
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#9a9a9a" }}>ÉQUIP.</span>
        <span style={{ fontSize: 10, fontWeight: 800, color }}>{score}/{total} ({pct}%)</span>
      </div>
      <div style={{ height: 6, background: "#e5e5e5", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
};

// ── Price Comparison Panel (Enhanced) ────────────────────────
const PriceComparison = ({ cars, settings, setPage, setSelectedCar }) => {
  const brands = [...new Set(cars.map(c => c.brand).filter(Boolean))].sort();
  const [selBrand, setSelBrand] = useState("");
  const [selModel, setSelModel] = useState("");
  const [showAvailOnly, setShowAvailOnly] = useState(false);

  const models = selBrand
    ? [...new Set(cars.filter(c => c.brand === selBrand).map(c => c.model).filter(Boolean))].sort()
    : [];

  const matchingCars = useMemo(() => {
    if (!selBrand || !selModel) return [];
    return cars
      .filter(c => {
        if (c.brand !== selBrand || c.model !== selModel) return false;
        if (showAvailOnly && c.status !== "available") return false;
        return true;
      })
      .map(c => {
        const fob = parseFloat(c.price_fob) || 0;
        const ship = parseFloat(settings?.shipment_fee_usd) || 0;
        const totalUSD = fob > 0 ? fob + ship : 0;
        const dzd = calcDZD(c.price_cny, settings, fob || c.price_usd, "USD");
        const eq = equipScore(c);
        const days = daysAgo(c.created_at || c.inserted_at);
        return { ...c, _totalUSD: totalUSD, _dzd: dzd, _equip: eq, _days: days };
      })
      .sort((a, b) => (a._totalUSD || 0) - (b._totalUSD || 0));
  }, [selBrand, selModel, cars, settings, showAvailOnly]);

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <SecHead title="COMPARAISON DE PRIX PAR MODÈLE" />
      <div style={{ padding: 16 }}>
        {/* Filters row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 14, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Marque</label>
            <select style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, outline: "none" }}
              value={selBrand} onChange={e => { setSelBrand(e.target.value); setSelModel(""); }}>
              <option value="">Toutes les marques</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Modèle</label>
            <select style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, outline: "none" }}
              value={selModel} onChange={e => setSelModel(e.target.value)} disabled={!selBrand}>
              <option value="">{selBrand ? "Tous les modèles" : "— Choisir marque d'abord"}</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {/* Status filter toggle */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 4 }}>Statut</label>
            <button
              onClick={() => setShowAvailOnly(v => !v)}
              style={{
                padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${showAvailOnly ? "#16a34a" : "#ddd"}`,
                background: showAvailOnly ? "#d1fae5" : "#fff",
                color: showAvailOnly ? "#065f46" : "#555",
                whiteSpace: "nowrap",
              }}>
              {showAvailOnly ? "✅ Dispo seul." : "🔘 Tous"}
            </button>
          </div>
        </div>

        {!selBrand && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#ccc" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Sélectionnez une marque et un modèle</p>
          </div>
        )}

        {selBrand && selModel && matchingCars.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#ccc" }}>
            <p style={{ fontSize: 13 }}>Aucune voiture trouvée pour ce modèle{showAvailOnly ? " (disponibles)" : ""}</p>
          </div>
        )}

        {matchingCars.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
              {matchingCars.length} résultat{matchingCars.length > 1 ? "s" : ""} — du moins cher au plus cher
            </div>

            {matchingCars.map((car, i) => {
              const isLowest  = i === 0 && matchingCars.length > 1;
              const isHighest = i === matchingCars.length - 1 && matchingCars.length > 1;
              const fob = parseFloat(car.price_fob) || 0;
              const ship = parseFloat(settings?.shipment_fee_usd) || 0;
              const ageBadge = stockAgeBadge(car._days);

              return (
                <div key={car.id} onClick={() => { setSelectedCar(car); setPage("car-detail"); }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 14px",
                    borderRadius: 9, border: `1.5px solid ${isLowest ? "#a7f3d0" : isHighest ? "#fecaca" : "#e5e5e5"}`,
                    background: isLowest ? "#f0fdf4" : isHighest ? "#fff5f5" : "#fafafa",
                    marginBottom: 8, cursor: "pointer", transition: "box-shadow .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: isLowest ? "#16a34a" : isHighest ? "#dc2626" : "#e5e5e5",
                    color: isLowest || isHighest ? "#fff" : "#555",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13,
                  }}>
                    {isLowest ? "↓" : isHighest ? "↑" : i + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3 }}>
                      {car.year} {car.brand} {car.model} {car.trim || ""}
                      {car.color && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 6, fontSize: 11, fontWeight: 600, color: "#777" }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLOR_HEX[car.color] || "#ccc", border: "1px solid rgba(0,0,0,.15)", display: "inline-block", flexShrink: 0 }} />
                          {car.color}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#9a9a9a", display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      {car.dealers?.name && <span>🏢 {car.dealers.name}</span>}
                      {car.transmission && <span>{car.transmission}</span>}
                      {car.fuel_type && <span>{car.fuel_type}</span>}
                    </div>
                    {/* Equipment score bar — NEW */}
                    <EquipBar score={car._equip} compact />
                  </div>

                  {/* Right: Price + badges */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    {/* FOB breakdown — NEW */}
                    {fob > 0 && (
                      <div style={{ fontSize: 9, color: "#0369a1", fontWeight: 700 }}>
                        FOB ${fmt(fob)} + Ship ${fmt(ship)}
                      </div>
                    )}
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: isLowest ? "#16a34a" : isHighest ? "#dc2626" : "#d36135", lineHeight: 1 }}>
                      {car._totalUSD > 0 ? `$${fmt(Math.round(car._totalUSD))}` : "—"}
                    </div>
                    {/* DZD price — NEW */}
                    {car._dzd && (
                      <div style={{ fontSize: 12, color: "#b45309", fontWeight: 800, background: "#fef3c7", padding: "2px 7px", borderRadius: 5 }}>
                        ≈ {fmt(car._dzd)} DZD
                      </div>
                    )}
                    <STag status={car.status} />
                    {/* Age of listing — NEW */}
                    {ageBadge && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: ageBadge.bg, color: ageBadge.color }}>
                        🕒 {ageBadge.label}
                      </span>
                    )}
                    {isLowest && (
                      <span style={{ background: "#16a34a", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>MEILLEUR PRIX</span>
                    )}
                    {isHighest && matchingCars.length > 1 && (
                      <span style={{ background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>PLUS CHER</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Price spread */}
            {matchingCars.length > 1 && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8f8f8", borderRadius: 8, border: "1px solid #e5e5e5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#9a9a9a", fontWeight: 600 }}>Écart de prix</span>
                  <span style={{ fontWeight: 800, color: "#d36135" }}>
                    ${fmt(Math.round(matchingCars[matchingCars.length - 1]._totalUSD - matchingCars[0]._totalUSD))}
                  </span>
                </div>
                <div style={{ marginTop: 8, position: "relative", height: 6, background: "#e5e5e5", borderRadius: 3 }}>
                  {matchingCars.map((car, i) => {
                    const min = matchingCars[0]._totalUSD;
                    const max = matchingCars[matchingCars.length - 1]._totalUSD;
                    const range = max - min || 1;
                    const pct = ((car._totalUSD - min) / range) * 100;
                    return (
                      <div key={car.id} title={`${car.dealers?.name}: $${Math.round(car._totalUSD)}`} style={{
                        position: "absolute", left: `${pct}%`, top: -3,
                        width: 12, height: 12, borderRadius: "50%",
                        background: i === 0 ? "#16a34a" : i === matchingCars.length - 1 ? "#dc2626" : "#d36135",
                        border: "2px solid #fff", transform: "translateX(-50%)", cursor: "pointer",
                        boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                      }} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Car Comparator (Enhanced) ─────────────────────────────────
const COMPARE_ROWS = [
  { label: "Concessionnaire", key: c => c.dealers?.name || "—" },
  { label: "Année",           key: c => c.year || "—" },
  { label: "Version",         key: c => c.trim || "—" },
  { label: "Carrosserie",     key: c => c.body_type || "—" },
  { label: "Condition",       key: c => c.condition === "new" ? "Neuf" : "Occasion" },
  { label: "Statut",          key: c => ({ available: "Disponible", sold: "Vendu", reserved: "Réservé" }[c.status] || "—") },
  { label: "Kilométrage",     key: c => c.mileage ? fmt(c.mileage) + " km" : "—" },
  { label: "Carburant",       key: c => c.fuel_type || "—" },
  { label: "Transmission",    key: c => c.transmission || "—" },
  { label: "Moteur",          key: c => c.engine_size || "—" },
  { label: "Portes",          key: c => c.doors || "—" },
  { label: "Couleur",         key: c => c.color || "—" },
  { label: "Origine",         key: c => c.origin === "imported" ? "Importé" : "Local" },
  { label: "Négociable",      key: c => c.negotiable ? "Oui" : "Non" },
];

const CarComparator = ({ cars, settings, setPage, setSelectedCar }) => {
  const [slots, setSlots] = useState([null, null, null, null]);
  const [search, setSearch] = useState("");
  const [activeSlot, setActiveSlot] = useState(null);

  const filtered = search.trim()
    ? cars.filter(c =>
        (c.brand + " " + c.model + " " + (c.year || "") + " " + (c.trim || "") + " " + (c.dealers?.name || ""))
          .toLowerCase().includes(search.toLowerCase())
      )
    : cars;

  const addToSlot = (slotIdx, car) => { setSlots(prev => prev.map((s, i) => i === slotIdx ? car : s)); setActiveSlot(null); setSearch(""); };
  const removeSlot = idx => setSlots(prev => prev.map((s, i) => i === idx ? null : s));
  const filled = slots.filter(Boolean);

  // Price comparison for coloring
  const prices = slots.map(s => {
    if (!s) return null;
    const fob = parseFloat(s.price_fob) || 0;
    const ship = parseFloat(settings?.shipment_fee_usd) || 0;
    return fob > 0 ? fob + ship : null;
  });
  const validPrices = prices.filter(p => p != null);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;

  // Equipment counts per slot — NEW
  const equipCounts = slots.map(s => s ? equipScore(s) : null);
  const maxEquip = Math.max(...equipCounts.filter(e => e !== null), 0);

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <SecHead title="COMPARATEUR — JUSQU'À 4 VOITURES" />

      {activeSlot !== null && (
        <div style={{ padding: "12px 16px", background: "#f8f8f8", borderBottom: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Marque, modèle, version, dealer..."
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 13, outline: "none" }} />
            <button onClick={() => { setActiveSlot(null); setSearch(""); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #ddd", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Annuler
            </button>
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.slice(0, 30).map(car => {
              const isAlready = slots.some(s => s?.id === car.id);
              return (
                <div key={car.id} onClick={() => !isAlready && addToSlot(activeSlot, car)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: 7, cursor: isAlready ? "not-allowed" : "pointer", background: isAlready ? "#f0f0f0" : "#fff", border: "1px solid #e5e5e5", opacity: isAlready ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!isAlready) e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { if (!isAlready) e.currentTarget.style.background = "#fff"; }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{car.year} {car.brand} {car.model} {car.trim || ""}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {car.dealers?.name && <span style={{ fontSize: 11, color: "#9a9a9a" }}>{car.dealers.name}</span>}
                    {car.price_fob && <span style={{ fontSize: 12, fontWeight: 800, color: "#d36135" }}>FOB ${fmt(car.price_fob)}</span>}
                    {isAlready && <span style={{ fontSize: 10, color: "#9a9a9a", fontWeight: 700 }}>Déjà ajouté</span>}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "#9a9a9a", fontSize: 13 }}>Aucun résultat</div>}
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ width: 140, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", background: "#fafafa", borderBottom: "2px solid #e5e5e5" }}>
                Critère
              </th>
              {slots.map((slot, i) => (
                <th key={i} style={{ padding: "12px 12px", background: "#fafafa", borderBottom: "2px solid #e5e5e5", borderLeft: "1px solid #e5e5e5", minWidth: 200 }}>
                  {slot ? (
                    <div>
                      {/* Photo — bigger now */}
                      <div style={{ width: "100%", height: 120, background: "#f0f0f0", borderRadius: 7, overflow: "hidden", marginBottom: 8, position: "relative" }}>
                        {slot.photos?.[0]
                          ? <img src={slot.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🚗</div>}
                      </div>

                      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2, lineHeight: 1.2 }}>
                        {slot.year} {slot.brand} {slot.model}
                      </div>
                      {slot.trim && <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 6 }}>{slot.trim}</div>}

                      {/* ── Price block — more prominent — NEW ── */}
                      <div style={{ background: prices[i] === minPrice && validPrices.length > 1 ? "#d1fae5" : prices[i] === maxPrice && validPrices.length > 1 ? "#fee2e2" : "#f4f4f4", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                        {/* FOB + Shipping breakdown — NEW */}
                        {slot.price_fob && (
                          <div style={{ fontSize: 10, color: "#666", marginBottom: 2 }}>
                            FOB <strong>${fmt(slot.price_fob)}</strong>
                            {settings?.shipment_fee_usd && <> + Ship <strong>${fmt(settings.shipment_fee_usd)}</strong></>}
                          </div>
                        )}
                        <div style={{
                          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22,
                          color: prices[i] === minPrice && validPrices.length > 1 ? "#065f46" : prices[i] === maxPrice && validPrices.length > 1 ? "#991b1b" : "#d36135",
                          lineHeight: 1,
                        }}>
                          {prices[i] != null ? `$${fmt(Math.round(prices[i]))}` : "—"}
                          {prices[i] === minPrice && validPrices.length > 1 && <span style={{ fontSize: 12, marginLeft: 4 }}>✓</span>}
                          {prices[i] === maxPrice && validPrices.length > 1 && <span style={{ fontSize: 12, marginLeft: 4 }}>↑</span>}
                        </div>
                        {/* DZD price — NEW */}
                        {(() => {
                          const dzd = calcDZD(slot.price_cny, settings, slot.price_fob || slot.price_usd, "USD");
                          return dzd ? (
                            <div style={{ fontSize: 11, fontWeight: 800, color: "#b45309", marginTop: 2 }}>≈ {fmt(dzd)} DZD</div>
                          ) : null;
                        })()}
                      </div>

                      {/* Equipment count — NEW */}
                      <div style={{ marginBottom: 8 }}>
                        <EquipBar score={equipCounts[i] || 0} />
                        {equipCounts[i] === maxEquip && filled.length > 1 && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", marginTop: 3 }}>⭐ MIEUX ÉQUIPÉ</div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => { setSelectedCar(slot); setPage("car-detail"); }}
                          style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          Voir fiche
                        </button>
                        <button onClick={() => removeSlot(i)}
                          style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff0f0", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setActiveSlot(i)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, height: 120, border: "2px dashed #ddd", borderRadius: 8, cursor: "pointer", transition: "all .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#d36135"; e.currentTarget.style.background = "#fef2f2"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ fontSize: 22, color: "#ccc" }}>+</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#ccc" }}>Ajouter</span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, ri) => (
              <tr key={row.label} style={{ background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#555", borderBottom: "1px solid #f0f0f0", borderRight: "2px solid #e5e5e5", whiteSpace: "nowrap" }}>{row.label}</td>
                {slots.map((slot, si) => {
                  const val = slot ? row.key(slot) : null;
                  const allVals = slots.filter(Boolean).map(s => row.key(s));
                  const isDiff = filled.length > 1 && allVals.some(v => v !== allVals[0]);
                  return (
                    <td key={si} style={{ padding: "8px 12px", fontSize: 12, borderBottom: "1px solid #f0f0f0", borderLeft: "1px solid #e5e5e5", textAlign: "center", background: isDiff && val && val !== "—" ? "rgba(211,97,53,.06)" : "inherit" }}>
                      {slot ? <span style={{ fontWeight: isDiff ? 700 : 400 }}>{val}</span> : <span style={{ color: "#ddd" }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Equipment count row — NEW */}
            <tr style={{ background: "#fff7ed" }}>
              <td style={{ padding: "8px 16px", fontSize: 12, fontWeight: 800, color: "#d36135", borderBottom: "1px solid #f0f0f0", borderRight: "2px solid #e5e5e5", whiteSpace: "nowrap" }}>
                Nb. équipements
              </td>
              {slots.map((slot, si) => (
                <td key={si} style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", borderLeft: "1px solid #e5e5e5", textAlign: "center" }}>
                  {slot ? (
                    <div>
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: equipCounts[si] === maxEquip && filled.length > 1 ? "#16a34a" : "#1c1c1c" }}>
                        {equipCounts[si]}/{TOTAL_EQUIP}
                      </span>
                      {equipCounts[si] === maxEquip && filled.length > 1 && <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>⭐ BEST</div>}
                    </div>
                  ) : <span style={{ color: "#ddd" }}>—</span>}
                </td>
              ))}
            </tr>

            {/* Equipment checkboxes */}
            <tr>
              <td colSpan={5} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", background: "#f2f2f2", borderTop: "2px solid #e5e5e5" }}>
                Équipements
              </td>
            </tr>
            {Object.entries(EQUIP_LABELS).map(([key, label], ri) => {
              const vals = slots.map(s => s ? !!s.car_equipment?.[0]?.[key] : null);
              return (
                <tr key={key} style={{ background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "7px 16px", fontSize: 11, color: "#555", borderBottom: "1px solid #f0f0f0", borderRight: "2px solid #e5e5e5" }}>{label}</td>
                  {vals.map((v, si) => (
                    <td key={si} style={{ padding: "7px 12px", borderBottom: "1px solid #f0f0f0", borderLeft: "1px solid #e5e5e5", textAlign: "center", fontSize: 14 }}>
                      {v === null ? <span style={{ color: "#ddd" }}>—</span> : v ? "✅" : "⬜"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filled.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚖️</div>
          <p style={{ fontWeight: 700, fontSize: 14 }}>Ajoutez jusqu'à 4 voitures pour les comparer</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Cliquez sur un slot "+" pour choisir une voiture</p>
        </div>
      )}
    </div>
  );
};

// ── Dealer Ranking ────────────────────────────────────────────
const DealerRanking = ({ cars, dealers, setPage, setSelectedDealer }) => {
  const ranked = useMemo(() => {
    return dealers.map(d => {
      const dc = cars.filter(c => c.dealer_id === d.id);
      const avail = dc.filter(c => c.status === "available").length;
      const sold  = dc.filter(c => c.status === "sold").length;
      const prices = dc.map(c => parseFloat(c.price_fob) || 0).filter(p => p > 0);
      const avgFOB = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const totalFOB = prices.reduce((a, b) => a + b, 0);
      return { ...d, _total: dc.length, _avail: avail, _sold: sold, _avgFOB: avgFOB, _totalFOB: totalFOB };
    }).sort((a, b) => b._total - a._total);
  }, [cars, dealers]);

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <SecHead title="CLASSEMENT CONCESSIONNAIRES" />
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 7 }}>
        {ranked.map((d, i) => (
          <div key={d.id}
            onClick={() => { setSelectedDealer && setSelectedDealer(d); setPage("dealer-detail"); }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e5e5", cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = "#e5e5e5"; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", background: i === 0 ? "#d36135" : i === 1 ? "#9a9a9a" : i === 2 ? "#c97a20" : "#e5e5e5", color: i < 3 ? "#fff" : "#555" }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
              {d.mobile && <div style={{ fontSize: 11, color: "#9a9a9a" }}>{d.mobile}</div>}
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: "#1c1c1c", lineHeight: 1 }}>{d._total}</div><div style={{ fontSize: 9, color: "#9a9a9a", fontWeight: 700 }}>TOTAL</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: "#16a34a", lineHeight: 1 }}>{d._avail}</div><div style={{ fontSize: 9, color: "#9a9a9a", fontWeight: 700 }}>DISPO</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: "#dc2626", lineHeight: 1 }}>{d._sold}</div><div style={{ fontSize: 9, color: "#9a9a9a", fontWeight: 700 }}>VENDUS</div></div>
              {d._avgFOB > 0 && (
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 14, color: "#d36135", lineHeight: 1 }}>${fmt(Math.round(d._avgFOB))}</div><div style={{ fontSize: 9, color: "#9a9a9a", fontWeight: 700 }}>MOY. FOB</div></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── NEW: Top 5 Best Value Cars ────────────────────────────────
const BestValuePanel = ({ cars, settings, setPage, setSelectedCar }) => {
  const top5 = useMemo(() => {
    return cars
      .filter(c => c.status === "available")
      .map(c => {
        const fob = parseFloat(c.price_fob) || 0;
        const ship = parseFloat(settings?.shipment_fee_usd) || 0;
        const totalUSD = fob + ship;
        const eq = equipScore(c);
        // Value score: higher equip + lower price = better
        // Normalise: we want high equip per dollar
        const score = totalUSD > 0 ? (eq / totalUSD) * 10000 : 0;
        return { ...c, _totalUSD: totalUSD, _equip: eq, _score: score };
      })
      .filter(c => c._totalUSD > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 5);
  }, [cars, settings]);

  if (top5.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <SecHead title="⭐ TOP 5 MEILLEUR RAPPORT QUALITÉ/PRIX" />
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 7 }}>
        {top5.map((car, i) => {
          const dzd = calcDZD(car.price_cny, settings, car.price_fob || car.price_usd, "USD");
          return (
            <div key={car.id} onClick={() => { setSelectedCar(car); setPage("car-detail"); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 9, border: "1.5px solid #e5e5e5", background: i === 0 ? "#fffbeb" : "#fafafa", cursor: "pointer", transition: "box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; }}
            >
              <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", background: ["#d36135","#9a9a9a","#c97a20","#e5e5e5","#e5e5e5"][i], color: i < 3 ? "#fff" : "#555" }}>
                {["🥇","🥈","🥉","4","5"][i]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{car.year} {car.brand} {car.model} {car.trim || ""}</div>
                <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 4 }}>{car.dealers?.name} · {car.fuel_type} · {car.transmission}</div>
                <EquipBar score={car._equip} compact />
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 18, color: "#d36135" }}>${fmt(Math.round(car._totalUSD))}</div>
                {dzd && <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309" }}>{fmt(dzd)} DZD</div>}
                <div style={{ fontSize: 10, color: "#9a9a9a", marginTop: 2 }}>Score: {car._score.toFixed(1)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 14px 12px", fontSize: 11, color: "#bbb" }}>
        * Score = équipements ÷ prix total. Plus le score est élevé, meilleur le rapport qualité/prix.
      </div>
    </div>
  );
};

// ── NEW: Stock Age Analysis ───────────────────────────────────
const StockAgePanel = ({ cars }) => {
  const aged = useMemo(() => {
    return cars
      .filter(c => c.status === "available")
      .map(c => ({ ...c, _days: daysAgo(c.created_at || c.inserted_at) }))
      .filter(c => c._days !== null)
      .sort((a, b) => b._days - a._days);
  }, [cars]);

  const buckets = useMemo(() => {
    const b = { "< 14j": 0, "14–30j": 0, "31–60j": 0, "> 60j": 0 };
    aged.forEach(c => {
      if (c._days <= 14) b["< 14j"]++;
      else if (c._days <= 30) b["14–30j"]++;
      else if (c._days <= 60) b["31–60j"]++;
      else b["> 60j"]++;
    });
    return b;
  }, [aged]);

  const bucketColors = { "< 14j": "#16a34a", "14–30j": "#ca8a04", "31–60j": "#ea580c", "> 60j": "#dc2626" };
  const bucketData = Object.entries(buckets).map(([label, value]) => ({ label, value, color: bucketColors[label] }));
  const old = aged.slice(0, 5); // top 5 oldest

  if (aged.length === 0) return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <SecHead title="🕒 ANCIENNETÉ DU STOCK" />
      <div style={{ padding: 24, textAlign: "center", color: "#ccc", fontSize: 13 }}>Pas de données de date disponibles</div>
    </div>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <SecHead title="🕒 ANCIENNETÉ DU STOCK" />
      <div style={{ padding: 16 }}>
        {/* Buckets */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {bucketData.map(b => (
            <div key={b.label} style={{ flex: 1, minWidth: 80, textAlign: "center", padding: "10px 8px", borderRadius: 8, border: `1.5px solid ${b.color}20`, background: `${b.color}10` }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, color: b.color, lineHeight: 1 }}>{b.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginTop: 2 }}>{b.label}</div>
            </div>
          ))}
        </div>

        {/* Oldest cars */}
        {old.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>⚠️ Voitures les plus longues en stock</div>
            {old.map(car => {
              const badge = stockAgeBadge(car._days);
              return (
                <div key={car.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 7, border: "1px solid #fee2e2", background: "#fff5f5", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{car.year} {car.brand} {car.model} {car.trim || ""}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {car.dealers?.name && <span style={{ fontSize: 11, color: "#9a9a9a" }}>{car.dealers.name}</span>}
                    {badge && <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: badge.bg, color: badge.color }}>{badge.label}</span>}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

// ── NEW: Average Price + Range per Brand ─────────────────────
const BrandPricePanel = ({ cars }) => {
  const data = useMemo(() => {
    const map = {};
    cars.forEach(c => {
      const fob = parseFloat(c.price_fob) || 0;
      if (!c.brand || fob === 0) return;
      if (!map[c.brand]) map[c.brand] = { prices: [], color: BRAND_COLORS[Object.keys(map).length % BRAND_COLORS.length] };
      map[c.brand].prices.push(fob);
    });
    return Object.entries(map)
      .map(([label, d]) => ({
        label,
        color: d.color,
        min: Math.min(...d.prices),
        max: Math.max(...d.prices),
        avg: d.prices.reduce((a, b) => a + b, 0) / d.prices.length,
        count: d.prices.length,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 14);
  }, [cars]);

  if (data.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
      <SecHead title="💰 PRIX MOYEN + FOURCHETTE PAR MARQUE (FOB USD)" />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: "#9a9a9a", marginBottom: 12 }}>
          Barre = fourchette min→max · Trait = prix moyen
        </div>
        <RangeBarChart data={data} height={220} />
        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {data.map(d => (
            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />
              <span style={{ fontWeight: 700, color: "#555" }}>{d.label}</span>
              <span style={{ color: "#9a9a9a" }}>{d.count} car{d.count > 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── MAIN STATS PAGE ───────────────────────────────────────────
export const StatsPage = ({ cars, dealers, settings, setPage, setSelectedCar, setSelectedDealer }) => {
  const available = cars.filter(c => c.status === "available");
  const sold      = cars.filter(c => c.status === "sold");
  const reserved  = cars.filter(c => c.status === "reserved");
  const newCars   = cars.filter(c => c.condition === "new");

  const totalFOB = cars.reduce((sum, c) => sum + (parseFloat(c.price_fob) || 0), 0);
  const availFOB = available.reduce((sum, c) => sum + (parseFloat(c.price_fob) || 0), 0);

  const brandCounts = useMemo(() => {
    const map = {};
    cars.forEach(c => { if (c.brand) map[c.brand] = (map[c.brand] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 18)
      .map(([label, value], i) => ({ label, value, color: BRAND_COLORS[i % BRAND_COLORS.length] }));
  }, [cars]);

  const donutSlices = [
    { label: "Disponible", value: available.length, color: "#16a34a" },
    { label: "Vendu",      value: sold.length,      color: "#dc2626" },
    { label: "Réservé",    value: reserved.length,  color: "#d97706" },
  ].filter(s => s.value > 0);

  const fuelCounts = useMemo(() => {
    const map = {};
    cars.forEach(c => { if (c.fuel_type) map[c.fuel_type] = (map[c.fuel_type] || 0) + 1; });
    const colors = { Essence: "#ea580c", Diesel: "#1c1c1c", Hybride: "#16a34a", Électrique: "#2563eb", GPL: "#9333ea" };
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: colors[label] || "#9a9a9a" }));
  }, [cars]);

  const soldRate = cars.length > 0 ? Math.round((sold.length / cars.length) * 100) : 0;

  return (
    <div style={{ padding: "86px 20px 60px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
          📊 Statistiques <span style={{ color: "#d36135" }}>El Warcha Auto</span>
        </h1>
        <p style={{ color: "#9a9a9a", fontSize: 13 }}>{cars.length} véhicule{cars.length !== 1 ? "s" : ""} · {dealers.length} concessionnaire{dealers.length !== 1 ? "s" : ""}</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
        <KpiCard icon="🚗" label="Total véhicules"  value={cars.length}      accent="#1c1c1c" />
        <KpiCard icon="✅" label="Disponibles"       value={available.length} accent="#16a34a" sub={`${Math.round((available.length / (cars.length || 1)) * 100)}% du stock`} />
        <KpiCard icon="🔴" label="Vendus"            value={sold.length}      accent="#dc2626" sub={`Taux: ${soldRate}%`} />
        <KpiCard icon="🟡" label="Réservés"          value={reserved.length}  accent="#d97706" />
        <KpiCard icon="✨" label="Neufs"             value={newCars.length}   accent="#2563eb" sub={`${Math.round((newCars.length / (cars.length || 1)) * 100)}% du stock`} />
        <KpiCard icon="🏢" label="Concessionnaires"  value={dealers.length}   accent="#9333ea" />
        <KpiCard icon="💰" label="Val. stock dispo"  value={availFOB > 0 ? "$" + fmt(Math.round(availFOB)) : "—"} accent="#ca8a04" sub="Somme FOB" />
        <KpiCard icon="📦" label="Val. inventaire"   value={totalFOB  > 0 ? "$" + fmt(Math.round(totalFOB))  : "—"} accent="#0891b2" sub="Tous véhicules" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, overflow: "hidden" }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 15, background: "#d36135", borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
            VOITURES PAR MARQUE
          </div>
          <BarChart data={brandCounts} height={160} />
        </div>
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 15, background: "#d36135", borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
            STATUTS
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <DonutChart slices={donutSlices} size={130} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
              {donutSlices.map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontWeight: 600, color: "#555" }}>{s.label}</span>
                  </div>
                  <span style={{ fontWeight: 800 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fuel */}
      {fuelCounts.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 3, height: 15, background: "#d36135", borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
            CARBURANTS
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
            {fuelCounts.map(f => (
              <div key={f.label} style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: f.color, lineHeight: 1 }}>{f.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginTop: 2 }}>{f.label}</div>
                <div style={{ height: 4, background: f.color, borderRadius: 2, marginTop: 4, width: "100%", opacity: .6 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW: Brand price range chart */}
      <div style={{ marginBottom: 20 }}>
        <BrandPricePanel cars={cars} />
      </div>

      {/* NEW: Best value + Stock age — side by side on wide screens */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <BestValuePanel cars={cars} settings={settings} setPage={setPage} setSelectedCar={setSelectedCar} />
        <StockAgePanel cars={cars} />
      </div>

      {/* Price comparison */}
      <div style={{ marginBottom: 20 }}>
        <PriceComparison cars={cars} settings={settings} setPage={setPage} setSelectedCar={setSelectedCar} />
      </div>

      {/* Dealer ranking */}
      <div style={{ marginBottom: 20 }}>
        <DealerRanking cars={cars} dealers={dealers} settings={settings} setPage={setPage} setSelectedDealer={setSelectedDealer} />
      </div>

      {/* Comparator */}
      <CarComparator cars={cars} settings={settings} setPage={setPage} setSelectedCar={setSelectedCar} />
    </div>
  );
};

export default StatsPage;
