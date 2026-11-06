import { useState, useRef, useEffect, useCallback } from "react";

// ── Static Data ──────────────────────────────────────────────────────
const CURRENCIES = {
  "United States": { code: "USD", symbol: "$", rate: 1.0, defaultTier: 1 },
  "Canada": { code: "CAD", symbol: "C$", rate: 0.98, defaultTier: 1 },
  "United Kingdom": { code: "GBP", symbol: "£", rate: 1.16, defaultTier: 2 },
  // ── Eurozone (EUR) ──
  "Austria": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Belgium": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Croatia": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Cyprus": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Estonia": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Finland": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "France": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Germany": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Greece": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Ireland": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Italy": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Latvia": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Lithuania": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Luxembourg": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Malta": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Netherlands": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Portugal": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Slovakia": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Slovenia": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  "Spain": { code: "EUR", symbol: "€", rate: 1.05, defaultTier: 2 },
  // ── Other Established ──
  "Australia": { code: "AUD", symbol: "A$", rate: 0.92, defaultTier: 2 },
  "Singapore": { code: "SGD", symbol: "S$", rate: 1.02, defaultTier: 2 },
  "Switzerland": { code: "CHF", symbol: "CHF", rate: 1.12, defaultTier: 2 },
  "Sweden": { code: "SEK", symbol: "kr", rate: 0.95, defaultTier: 2 },
  "UAE": { code: "AED", symbol: "د.إ", rate: 0.95, defaultTier: 2 },
  // ── Emerging ──
  "Japan": { code: "JPY", symbol: "¥", rate: 0.88, defaultTier: 3 },
  "Brazil": { code: "BRL", symbol: "R$", rate: 0.82, defaultTier: 3 },
  "India": { code: "INR", symbol: "₹", rate: 0.78, defaultTier: 3 },
  "Mexico": { code: "MXN", symbol: "MX$", rate: 0.85, defaultTier: 3 },
  "South Korea": { code: "KRW", symbol: "₩", rate: 0.85, defaultTier: 3 },
  "China": { code: "CNY", symbol: "¥", rate: 0.80, defaultTier: 3 },
  "South Africa": { code: "ZAR", symbol: "R", rate: 0.75, defaultTier: 3 },
};

const TIER_PRICING = {
  1: { label: "Domestic", perReimbursement: 0.95 },
  2: { label: "Established", perReimbursement: 1.16 },
  3: { label: "Emerging", perReimbursement: 1.45 },
};

const ERP_OPTIONS = ["Netsuite", "SAP", "Oracle", "Workday", "Microsoft Dynamics", "Sage Intacct", "QuickBooks", "Other"];
const CARD_TYPES = ["Visa", "Mastercard", "Amex", "Diners Club", "Other"];
const TRAVEL_PARTNERS = ["Egencia", "Concur Travel", "Navan", "TripActions", "Corporate Traveler", "BCD Travel", "Other", "None"];

const FAQ_ITEMS = [
  { q: "What is a reimbursement cycle?", a: "Cycle 1 = monthly reimbursement (1x/month). Cycle 2 = bi-weekly reimbursement (2x/month). Cycle 3 = weekly reimbursement (3x/month). Higher cycle frequencies multiply the reimbursement volume, which is reflected in monthly pricing." },
  { q: "How is per-reimbursement pricing determined?", a: "Pricing is tiered by country classification. Domestic is $0.95/reimbursement. Established markets (UK, EU, etc.) are $1.16/reimbursement. Emerging markets are $1.45/reimbursement." },
  { q: "What counts as Domestic vs. Non-Domestic?", a: "The prospect's headquarter country is considered Domestic. All other countries are Non-Domestic and classified as Established or Emerging based on market maturity and payment infrastructure." },
  { q: "How is monthly pricing calculated?", a: "Monthly Price = Users × Cycle × Per-Reimbursement Rate. For example: 50 users on bi-weekly (cycle 2) at $1.16/reimbursement = 50 × 2 × $1.16 = $116.00/month." },
  { q: "Can I change a country's tier?", a: "Yes. In Step 2, each country has a tier dropdown where you can select Domestic, Established, or Emerging." },
  { q: "What ERP integrations are supported?", a: "The Reimbursements Calculator supports integrations with Netsuite, SAP, Oracle, Workday, Microsoft Dynamics, Sage Intacct, and QuickBooks. Custom integrations are available upon request." },
  { q: "How do I attach the quote to Salesforce?", a: "On the Summary page, click 'Generate PDF' to create the pricing document. Then attach the PDF to the Salesforce.com Opportunity record directly." },
];

// ── SVG Step Icons (lightweight, modern line icons) ──────────────
const StepIcon = ({ id, color = "currentColor", size = 15 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    instructions: <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>,
    countries: <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
    users: <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    cards: <svg {...props}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
    erp: <svg {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    review: <svg {...props}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    summary: <svg {...props}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
  };
  return icons[id] || null;
};

const STEPS = [
  { id: "instructions", label: "Instructions" },
  { id: "countries", label: "Countries & Tiers" },
  { id: "users", label: "Users & Pricing" },
  { id: "cards", label: "Card Programs" },
  { id: "erp", label: "ERP & Travel" },
  { id: "review", label: "Review" },
  { id: "summary", label: "Summary" },
];

// ── Styles ────────────────────────────────────────────────────────
const colors = {
  navy: "#0B1D3A",
  navyLight: "#122B52",
  accent: "#2E8CFF",
  accentGlow: "rgba(46,140,255,0.25)",
  accentSoft: "#E8F2FF",
  teal: "#00C9A7",
  tealDark: "#00A88A",
  surface: "#F7F9FC",
  surfaceWhite: "#FFFFFF",
  border: "#E2E8F0",
  borderFocus: "#2E8CFF",
  text: "#1A2B4A",
  textMuted: "#6B7A99",
  textLight: "#94A3B8",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  successBg: "#F0FDF4",
  success: "#16A34A",
  warmBg: "#FFFBEB",
  warm: "#D97706",
};

// ── Helper Components ────────────────────────────────────────────
const FmtUSD = ({ value }) => (
  <span style={{ fontVariantNumeric: "tabular-nums" }}>
    ${(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </span>
);

const Badge = ({ children, color = colors.accent, bg }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
    color, background: bg || `${color}18`,
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style = {} }) => {
  const base = {
    padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: 14,
    cursor: disabled ? "default" : "pointer", transition: "all 0.2s",
    border: "none", display: "inline-flex", alignItems: "center", gap: 8,
    opacity: disabled ? 0.5 : 1, fontFamily: "inherit",
  };
  const variants = {
    primary: { background: colors.accent, color: "#fff" },
    secondary: { background: colors.accentSoft, color: colors.accent },
    ghost: { background: "transparent", color: colors.textMuted, border: `1px solid ${colors.border}` },
    success: { background: colors.teal, color: "#fff" },
    danger: { background: colors.danger, color: "#fff" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
    {label && <label style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${colors.border}`,
        fontSize: 14, color: colors.text, background: "#fff", outline: "none",
        transition: "border-color 0.2s", fontFamily: "inherit",
      }}
      onFocus={e => e.target.style.borderColor = colors.accent}
      onBlur={e => e.target.style.borderColor = colors.border}
    />
  </div>
);

const Select = ({ label, value, onChange, options, placeholder, style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
    {label && <label style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: "10px 14px", borderRadius: 8, border: `1.5px solid ${colors.border}`,
        fontSize: 14, color: value ? colors.text : colors.textLight, background: "#fff",
        outline: "none", cursor: "pointer", fontFamily: "inherit",
        appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7A99' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
        paddingRight: 36,
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ── Main App ─────────────────────────────────────────────────────
export default function ReimbursementsCalculatorApp() {
  const [step, setStep] = useState(0);
  const [showFAQ, setShowFAQ] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  // Instructions data
  const [prospect, setProspect] = useState({ name: "", preparedBy: "", date: new Date().toISOString().split("T")[0], sfLink: "" });

  // Approval
  const [approvedBy, setApprovedBy] = useState("");
  const [dateApproved, setDateApproved] = useState("");

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Countries
  const [countries, setCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Per-country data
  const [countryData, setCountryData] = useState({});

  const updateCountryField = (country, field, value) => {
    setCountryData(prev => ({ ...prev, [country]: { ...prev[country], [field]: value } }));
  };

  const addCountry = (name) => {
    if (!countries.includes(name)) {
      setCountries(prev => [...prev, name]);
      const info = CURRENCIES[name];
      setCountryData(prev => ({
        ...prev,
        [name]: {
          tier: info.defaultTier, tierOverride: null,
          users: "", cycle: "1", erp: "", cardProgram: "", cardType: "", travelPartner: "",
        },
      }));
    }
    setCountrySearch("");
    setShowCountryDropdown(false);
  };

  const removeCountry = (name) => {
    setCountries(prev => prev.filter(c => c !== name));
    setCountryData(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const filteredCountries = Object.keys(CURRENCIES).filter(
    c => !countries.includes(c) && c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Pricing calculations
  const calcCountryMonthly = (country) => {
    const cd = countryData[country];
    if (!cd || !cd.users) return 0;
    const tier = cd.tierOverride || cd.tier;
    const rate = TIER_PRICING[tier].perReimbursement;
    const users = parseInt(cd.users) || 0;
    const cycle = parseInt(cd.cycle) || 1;
    return users * cycle * rate;
  };

  const calcCountryReimbursements = (country) => {
    const cd = countryData[country];
    if (!cd || !cd.users) return 0;
    return (parseInt(cd.users) || 0) * (parseInt(cd.cycle) || 1);
  };

  const totalMonthly = countries.reduce((sum, c) => sum + calcCountryMonthly(c), 0);
  const totalReimbursements = countries.reduce((sum, c) => sum + calcCountryReimbursements(c), 0);
  const totalUsers = countries.reduce((sum, c) => sum + (parseInt(countryData[c]?.users) || 0), 0);

  const domesticCountries = countries.filter(c => (countryData[c]?.tierOverride || countryData[c]?.tier) === 1);
  const nonDomesticCountries = countries.filter(c => (countryData[c]?.tierOverride || countryData[c]?.tier) !== 1);
  const domesticTotal = domesticCountries.reduce((sum, c) => sum + calcCountryMonthly(c), 0);
  const nonDomesticTotal = nonDomesticCountries.reduce((sum, c) => sum + calcCountryMonthly(c), 0);

  const canProceed = (s) => {
    if (s === 0) return prospect.name && prospect.preparedBy;
    if (s === 1) return countries.length > 0;
    if (s === 2) return countries.every(c => countryData[c]?.users);
    return true;
  };

  const contentRef = useRef(null);
  useEffect(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, [step]);

  const dropdownRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCountryDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Render sections ──────────────────────────────────────────
  const renderInstructions = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>Welcome to the Reimbursements Calculator</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.7, marginBottom: 28 }}>
        This tool calculates scoping and pricing for reimbursements across multiple countries and currencies.
        Follow each step to configure your prospect's reimbursement program. Once complete, generate a PDF summary
        to attach to the Salesforce.com Opportunity record.
      </p>
      <div style={{ background: colors.accentSoft, borderRadius: 12, padding: "16px 20px", marginBottom: 32, borderLeft: `4px solid ${colors.accent}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.accent, marginBottom: 4 }}>How it works</div>
        <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.7 }}>
          <strong>Step 1</strong> — Add countries in scope and assign pricing tiers<br/>
          <strong>Step 2</strong> — Enter user counts and reimbursement cycle per country<br/>
          <strong>Step 3</strong> — Configure card programs for each country<br/>
          <strong>Step 4</strong> — Set ERP integrations and travel partners<br/>
          <strong>Step 5</strong> — Review all entries<br/>
          <strong>Summary</strong> — View totals, CPQ grid, and generate PDF
        </div>
      </div>
      <div style={{ background: colors.surfaceWhite, borderRadius: 12, padding: 24, border: `1px solid ${colors.border}` }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.navy, marginBottom: 16 }}>Account & Sales Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Prospect Name" value={prospect.name} onChange={v => setProspect(p => ({ ...p, name: v }))} placeholder="Acme Corp" />
          <Input label="Prepared By" value={prospect.preparedBy} onChange={v => setProspect(p => ({ ...p, preparedBy: v }))} placeholder="Your Name" />
          <Input label="Salesforce Opportunity Link" value={prospect.sfLink} onChange={v => setProspect(p => ({ ...p, sfLink: v }))} placeholder="https://..." />
          <Input label="Prepared Date" type="date" value={prospect.date} onChange={v => setProspect(p => ({ ...p, date: v }))} />
        </div>
      </div>
    </div>
  );

  const renderCountries = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>Countries & Pricing Tiers</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>Search and add countries in scope. Each country has a default tier — override it if needed.</p>

      <div ref={dropdownRef} style={{ position: "relative", marginBottom: 24 }}>
        <div style={{ position: "relative" }}>
          <input
            value={countrySearch}
            onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true); }}
            onFocus={() => setShowCountryDropdown(true)}
            placeholder="Search countries..."
            style={{
              width: "100%", padding: "12px 16px 12px 40px", borderRadius: 10,
              border: `1.5px solid ${showCountryDropdown ? colors.accent : colors.border}`,
              fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              background: "#fff",
            }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
        </div>
        {showCountryDropdown && filteredCountries.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
            background: "#fff", borderRadius: 10, border: `1px solid ${colors.border}`,
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto", marginTop: 4,
          }}>
            {filteredCountries.map(c => (
              <div key={c} onClick={() => addCountry(c)} style={{
                padding: "10px 16px", cursor: "pointer", fontSize: 14, display: "flex",
                justifyContent: "space-between", alignItems: "center", transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = colors.accentSoft}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span>{c}</span>
                <span style={{ fontSize: 12, color: colors.textMuted }}>{CURRENCIES[c].code} · {TIER_PRICING[CURRENCIES[c].defaultTier].label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {countries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted, fontSize: 14 }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div>
          No countries added yet. Use the search above to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {countries.map(c => {
            const cd = countryData[c];
            const info = CURRENCIES[c];
            const activeTier = cd?.tierOverride || cd?.tier;
            return (
              <div key={c} style={{
                background: "#fff", borderRadius: 12, padding: "16px 20px",
                border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: "1 1 180px", minWidth: 140 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: colors.navy }}>{c}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{info.code} · Default: {TIER_PRICING[info.defaultTier].label}</div>
                </div>
                <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: 12 }}>
                  <Select
                    label="Tier"
                    value={cd?.tierOverride || String(cd?.tier)}
                    onChange={v => updateCountryField(c, "tierOverride", parseInt(v))}
                    options={[
                      { value: "1", label: "Domestic" },
                      { value: "2", label: "Established" },
                      { value: "3", label: "Emerging" },
                    ]}
                    style={{ minWidth: 160 }}
                  />
                </div>
                <Badge color={activeTier === 1 ? colors.success : activeTier === 2 ? colors.accent : colors.warm}>${TIER_PRICING[activeTier].perReimbursement}/reimb</Badge>
                <button onClick={() => removeCountry(c)} style={{
                  background: "none", border: "none", cursor: "pointer", color: colors.textLight,
                  fontSize: 18, padding: 4, lineHeight: 1, transition: "color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = colors.danger}
                onMouseLeave={e => e.currentTarget.style.color = colors.textLight}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>Users & Reimbursement Pricing</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>Enter approximate users and reimbursement cycle per country. Pricing calculates automatically.</p>

      {countries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted }}>Add countries in Step 1 first.</div>
      ) : (
        <>
          <div style={{
            background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 1.2fr",
              padding: "12px 20px", background: colors.navy, color: "#fff", fontSize: 11,
              fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              <div>Country</div><div>Users</div><div>Cycle</div><div style={{ textAlign: "center" }}>Rate</div><div style={{ textAlign: "center" }}>Reimb/mo</div><div style={{ textAlign: "right" }}>Monthly</div>
            </div>
            {countries.map((c, i) => {
              const cd = countryData[c];
              const info = CURRENCIES[c];
              const tier = cd?.tierOverride || cd?.tier;
              const rate = TIER_PRICING[tier].perReimbursement;
              const users = parseInt(cd?.users) || 0;
              const cycle = parseInt(cd?.cycle) || 1;
              const monthly = users * cycle * rate;
              const reimb = users * cycle;
              return (
                <div key={c} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 1.2fr",
                  padding: "14px 20px", alignItems: "center",
                  borderBottom: i < countries.length - 1 ? `1px solid ${colors.border}` : "none",
                  background: i % 2 === 0 ? "#fff" : colors.surface,
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: colors.navy }}>{c}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: colors.textMuted }}>{info.code}</span>
                  </div>
                  <div>
                    <input
                      type="number" min="0" value={cd?.users || ""} onChange={e => updateCountryField(c, "users", e.target.value)}
                      placeholder="0"
                      style={{
                        width: 72, padding: "8px 10px", borderRadius: 6,
                        border: `1.5px solid ${colors.border}`, fontSize: 14, textAlign: "right",
                        outline: "none", fontFamily: "inherit",
                      }}
                      onFocus={e => e.target.style.borderColor = colors.accent}
                      onBlur={e => e.target.style.borderColor = colors.border}
                    />
                  </div>
                  <div>
                    <select
                      value={cd?.cycle || "1"} onChange={e => updateCountryField(c, "cycle", e.target.value)}
                      style={{
                        padding: "8px 10px", borderRadius: 6, border: `1.5px solid ${colors.border}`,
                        fontSize: 14, outline: "none", fontFamily: "inherit", cursor: "pointer",
                      }}
                    >
                      <option value="1">1 (Monthly)</option>
                      <option value="2">2 (Bi-weekly)</option>
                      <option value="3">3 (Weekly)</option>
                    </select>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <Badge color={tier === 1 ? colors.success : tier === 2 ? colors.accent : colors.warm}>
                      ${rate.toFixed(2)}/reimb
                    </Badge>
                  </div>
                  <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", color: colors.textMuted, fontWeight: 500 }}>
                    {reimb.toLocaleString()}
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 700, color: monthly > 0 ? colors.navy : colors.textLight, fontVariantNumeric: "tabular-nums", fontSize: 15 }}>
                    <FmtUSD value={monthly} />
                  </div>
                </div>
              );
            })}
            {/* Totals row */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr 1fr 1.2fr",
              padding: "14px 20px", alignItems: "center",
              background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyLight})`, color: "#fff",
            }}>
              <div style={{ fontWeight: 700 }}>Total</div>
              <div style={{ fontWeight: 600 }}>{totalUsers.toLocaleString()}</div>
              <div></div>
              <div></div>
              <div style={{ textAlign: "center", fontWeight: 600 }}>{totalReimbursements.toLocaleString()}</div>
              <div style={{ textAlign: "right", fontWeight: 800, fontSize: 17 }}><FmtUSD value={totalMonthly} /></div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderCards = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>Card Programs</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>Configure corporate card programs per country (optional).</p>
      {countries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted }}>Add countries in Step 1 first.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {countries.map(c => {
            const cd = countryData[c];
            return (
              <div key={c} style={{
                background: "#fff", borderRadius: 12, padding: "16px 20px",
                border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: "1 1 160px", fontWeight: 600, color: colors.navy }}>{c}</div>
                <Input label="Card Program" value={cd?.cardProgram || ""} onChange={v => updateCountryField(c, "cardProgram", v)} placeholder="e.g., U.S. Bank" style={{ flex: "1 1 160px" }} />
                <Select label="Card Type" value={cd?.cardType || ""} onChange={v => updateCountryField(c, "cardType", v)} options={CARD_TYPES} placeholder="Select..." style={{ flex: "1 1 140px" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderERP = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>ERP & Travel Partners</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>Set ERP integrations and travel booking partners per country.</p>
      {countries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: colors.textMuted }}>Add countries in Step 1 first.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {countries.map(c => {
            const cd = countryData[c];
            return (
              <div key={c} style={{
                background: "#fff", borderRadius: 12, padding: "16px 20px",
                border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: "1 1 160px", fontWeight: 600, color: colors.navy }}>{c}</div>
                <Select label="ERP" value={cd?.erp || ""} onChange={v => updateCountryField(c, "erp", v)} options={ERP_OPTIONS} placeholder="Select ERP..." style={{ flex: "1 1 160px" }} />
                <Select label="Travel Partner" value={cd?.travelPartner || ""} onChange={v => updateCountryField(c, "travelPartner", v)} options={TRAVEL_PARTNERS} placeholder="Select..." style={{ flex: "1 1 160px" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderReview = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>Review Configuration</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>Verify all details before generating the summary.</p>
      {countries.map(c => {
        const cd = countryData[c];
        const info = CURRENCIES[c];
        const tier = cd?.tierOverride || cd?.tier;
        const monthly = calcCountryMonthly(c);
        return (
          <div key={c} style={{
            background: "#fff", borderRadius: 12, padding: 20, marginBottom: 12,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 16, color: colors.navy }}>{c}</span>
                <span style={{ marginLeft: 8, fontSize: 12, color: colors.textMuted }}>{info.code}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: colors.accent }}><FmtUSD value={monthly} /><span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>/mo</span></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, fontSize: 13 }}>
              {[
                ["Tier", TIER_PRICING[tier].label],
                ["Users", cd?.users || "—"],
                ["Cycle", cd?.cycle === "3" ? "3 (Weekly)" : cd?.cycle === "2" ? "2 (Bi-weekly)" : "1 (Monthly)"],
                ["ERP", cd?.erp || "—"],
                ["Card", cd?.cardProgram ? `${cd.cardProgram} (${cd.cardType || "—"})` : "—"],
                ["Travel", cd?.travelPartner || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                  <div style={{ color: colors.text, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSummary = () => (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>Pricing Summary</h2>
      <p style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24 }}>
        {prospect.name ? `Prepared for ${prospect.name}` : "Complete pricing overview"} · {prospect.preparedBy && `By ${prospect.preparedBy}`} · {prospect.date}
      </p>

      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Monthly Total", value: <FmtUSD value={totalMonthly} />, accent: colors.accent },
          { label: "Annual Estimate", value: <FmtUSD value={totalMonthly * 12} />, accent: colors.teal },
          { label: "Total Users", value: totalUsers.toLocaleString(), accent: colors.navy },
          { label: "Reimb / Month", value: totalReimbursements.toLocaleString(), accent: colors.warm },
        ].map((s, i) => (
          <div key={i} style={{
            background: "#fff", borderRadius: 12, padding: "20px 16px", textAlign: "center",
            border: `1px solid ${colors.border}`, borderTop: `3px solid ${s.accent}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pricing breakdown table */}
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${colors.border}`, fontWeight: 700, color: colors.navy }}>Reimbursement Pricing Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr 1.5fr", padding: "10px 20px", fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${colors.border}` }}>
          <div>Country</div><div>Currency</div><div>Users</div><div>Cycle</div><div>Rate</div><div style={{ textAlign: "right" }}>Monthly Price</div>
        </div>
        {countries.map((c, i) => {
          const cd = countryData[c];
          const info = CURRENCIES[c];
          const tier = cd?.tierOverride || cd?.tier;
          const rate = TIER_PRICING[tier].perReimbursement;
          const monthly = calcCountryMonthly(c);
          return (
            <div key={c} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr 1.5fr",
              padding: "12px 20px", fontSize: 14, alignItems: "center",
              borderBottom: i < countries.length - 1 ? `1px solid ${colors.border}` : "none",
              background: i % 2 === 0 ? "#fff" : colors.surface,
            }}>
              <div style={{ fontWeight: 600, color: colors.navy }}>{c}</div>
              <div style={{ color: colors.textMuted }}>{info.code}</div>
              <div>{cd?.users || "—"}</div>
              <div>{cd?.cycle === "3" ? "3 (Wk)" : cd?.cycle === "2" ? "2 (Bi-wk)" : "1 (Mo)"}</div>
              <div>${rate.toFixed(2)}/reimb</div>
              <div style={{ textAlign: "right", fontWeight: 700, color: colors.navy }}><FmtUSD value={monthly} /></div>
            </div>
          );
        })}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.2fr 1.5fr",
          padding: "14px 20px", background: colors.navy, color: "#fff", fontWeight: 700,
        }}>
          <div>Total</div><div></div><div>{totalUsers}</div><div></div><div></div>
          <div style={{ textAlign: "right", fontSize: 17, fontWeight: 800 }}><FmtUSD value={totalMonthly} /></div>
        </div>
      </div>

      {/* Salesforce CPQ Grid */}
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: colors.navy }}>Salesforce CPQ Grid</span>
          <Badge color={colors.teal}>Mock Preview</Badge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 1.5fr 1.5fr 1.5fr", padding: "10px 20px", fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", borderBottom: `1px solid ${colors.border}` }}>
          <div>Product</div><div>Quantity</div><div style={{ textAlign: "right" }}>Monthly</div><div style={{ textAlign: "right" }}>Annual</div>
        </div>
        {[
          { product: "Reimbursements — Domestic", qty: domesticCountries.reduce((s, c) => s + calcCountryReimbursements(c), 0), monthly: domesticTotal },
          { product: "Reimbursements — Non-Domestic", qty: nonDomesticCountries.reduce((s, c) => s + calcCountryReimbursements(c), 0), monthly: nonDomesticTotal },
        ].map((row, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "3fr 1.5fr 1.5fr 1.5fr",
            padding: "14px 20px", fontSize: 14, alignItems: "center",
            borderBottom: `1px solid ${colors.border}`,
            background: i % 2 === 0 ? "#fff" : colors.surface,
          }}>
            <div style={{ fontWeight: 600, color: colors.navy }}>{row.product}</div>
            <div style={{ color: colors.textMuted }}>{row.qty.toLocaleString()} reimb/mo</div>
            <div style={{ textAlign: "right", fontWeight: 600 }}><FmtUSD value={row.monthly} /></div>
            <div style={{ textAlign: "right", fontWeight: 600 }}><FmtUSD value={row.monthly * 12} /></div>
          </div>
        ))}
        <div style={{
          display: "grid", gridTemplateColumns: "3fr 1.5fr 1.5fr 1.5fr",
          padding: "14px 20px", background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyLight})`, color: "#fff", fontWeight: 700,
        }}>
          <div>Grand Total</div>
          <div>{totalReimbursements.toLocaleString()} reimb/mo</div>
          <div style={{ textAlign: "right", fontSize: 16, fontWeight: 800 }}><FmtUSD value={totalMonthly} /></div>
          <div style={{ textAlign: "right", fontSize: 16, fontWeight: 800 }}><FmtUSD value={totalMonthly * 12} /></div>
        </div>
      </div>

      {/* Approval / Generate */}
      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.navy, marginBottom: 16 }}>Approval & Export</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Input label="Approved By" value={approvedBy} onChange={setApprovedBy} placeholder="Manager Name" />
          <Input label="Date Approved" type="date" value={dateApproved} onChange={setDateApproved} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn variant="success" onClick={() => downloadPDF()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>
            Generate PDF
          </Btn>
          <Btn variant="secondary" onClick={() => saveDraft()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Draft
          </Btn>
        </div>
      </div>
    </div>
  );

  function saveDraft() {
    const draft = { prospect, countries, countryData, approvedBy, dateApproved, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reimbursements-draft-${(prospect.name || "untitled").replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Draft saved and downloaded!");
  }

  function downloadPDF() {
    const fmtMoney = (v) => "$" + (v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const countryRows = countries.map(c => {
      const cd = countryData[c];
      const info = CURRENCIES[c];
      const tier = cd?.tierOverride || cd?.tier;
      const rate = TIER_PRICING[tier].perReimbursement;
      const users = parseInt(cd?.users) || 0;
      const cycle = parseInt(cd?.cycle) || 1;
      const monthly = users * cycle * rate;
      const reimb = users * cycle;
      const cycleLbl = cycle === 3 ? "Weekly" : cycle === 2 ? "Bi-weekly" : "Monthly";
      return `<tr>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;font-weight:600;color:#0B1D3A">${c}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#6B7A99">${info.code}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:center">${users}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:center">${cycleLbl}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:center">${TIER_PRICING[tier].label}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:center">$${rate.toFixed(2)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:center">${reimb.toLocaleString()}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:700;color:#0B1D3A">${fmtMoney(monthly)}</td>
      </tr>`;
    }).join("");

    const scopeRows = countries.map(c => {
      const cd = countryData[c];
      return `<tr>
        <td style="padding:8px 14px;border-bottom:1px solid #E2E8F0;font-weight:600">${c}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #E2E8F0">${cd?.erp || "\u2014"}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #E2E8F0">${cd?.cardProgram || "\u2014"}${cd?.cardType ? " (" + cd.cardType + ")" : ""}</td>
        <td style="padding:8px 14px;border-bottom:1px solid #E2E8F0">${cd?.travelPartner || "\u2014"}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Reimbursements Pricing - ${prospect.name || "Summary"}</title>
    <style>
      @page { size: A4; margin: 0.6in; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1A2B4A; margin: 0; padding: 40px; line-height: 1.5; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #0B1D3A; }
      .logo { font-size: 22px; font-weight: 800; }
      .logo span { color: #00C9A7; }
      .meta { text-align: right; font-size: 12px; color: #6B7A99; }
      .meta strong { color: #0B1D3A; display: block; }
      h2 { font-size: 16px; color: #0B1D3A; margin: 28px 0 12px; padding: 8px 14px; background: #F7F9FC; border-left: 4px solid #2E8CFF; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; }
      th { background: #0B1D3A; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
      .totals-row td { background: #0B1D3A; color: #fff; font-weight: 700; padding: 12px 14px; }
      .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
      .stat { text-align: center; padding: 16px; border: 1px solid #E2E8F0; border-radius: 8px; border-top: 3px solid #2E8CFF; }
      .stat .num { font-size: 22px; font-weight: 800; color: #2E8CFF; }
      .stat .lbl { font-size: 10px; text-transform: uppercase; color: #6B7A99; font-weight: 600; letter-spacing: 0.06em; }
      .cpq-domestic td:first-child { font-weight: 600; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #E2E8F0; font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; }
      .approval { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .approval-field .label { font-size: 10px; text-transform: uppercase; color: #6B7A99; font-weight: 600; letter-spacing: 0.06em; }
      .approval-field .value { font-size: 14px; font-weight: 600; color: #0B1D3A; border-bottom: 1px solid #E2E8F0; padding: 4px 0 8px; min-height: 20px; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <div class="header">
      <div><div class="logo">Reimbursements Calculator</div><div style="font-size:13px;color:#6B7A99;margin-top:4px">Pricing &amp; Scoping Summary</div></div>
      <div class="meta"><strong>${prospect.name || "\u2014"}</strong>Prepared by: ${prospect.preparedBy || "\u2014"}<br/>Date: ${prospect.date || today}${prospect.sfLink ? "<br/>SF Link: " + prospect.sfLink : ""}</div>
    </div>
    <div class="stat-grid">
      <div class="stat"><div class="lbl">Monthly Total</div><div class="num">${fmtMoney(totalMonthly)}</div></div>
      <div class="stat"><div class="lbl">Annual Estimate</div><div class="num" style="color:#00C9A7">${fmtMoney(totalMonthly * 12)}</div></div>
      <div class="stat"><div class="lbl">Total Users</div><div class="num" style="color:#0B1D3A">${totalUsers.toLocaleString()}</div></div>
      <div class="stat"><div class="lbl">Reimb / Month</div><div class="num" style="color:#D97706">${totalReimbursements.toLocaleString()}</div></div>
    </div>
    <h2>Reimbursement Pricing Breakdown</h2>
    <table>
      <thead><tr><th>Country</th><th>Currency</th><th style="text-align:center">Users</th><th style="text-align:center">Cycle</th><th style="text-align:center">Tier</th><th style="text-align:center">Rate</th><th style="text-align:center">Reimb/mo</th><th style="text-align:right">Monthly</th></tr></thead>
      <tbody>${countryRows}
        <tr class="totals-row"><td colspan="2">Total</td><td style="text-align:center">${totalUsers.toLocaleString()}</td><td></td><td></td><td></td><td style="text-align:center">${totalReimbursements.toLocaleString()}</td><td style="text-align:right;font-size:15px">${fmtMoney(totalMonthly)}</td></tr>
      </tbody>
    </table>
    <h2>Salesforce CPQ Grid</h2>
    <table>
      <thead><tr><th>Product</th><th>Quantity</th><th style="text-align:right">Monthly</th><th style="text-align:right">Annual</th></tr></thead>
      <tbody>
        <tr class="cpq-domestic"><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0">Reimbursements \u2014 Domestic</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0">${domesticCountries.reduce((s,c) => s + calcCountryReimbursements(c), 0).toLocaleString()} reimb/mo</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:600">${fmtMoney(domesticTotal)}</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:600">${fmtMoney(domesticTotal*12)}</td></tr>
        <tr class="cpq-domestic"><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0">Reimbursements \u2014 Non-Domestic</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0">${nonDomesticCountries.reduce((s,c) => s + calcCountryReimbursements(c), 0).toLocaleString()} reimb/mo</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:600">${fmtMoney(nonDomesticTotal)}</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:600">${fmtMoney(nonDomesticTotal*12)}</td></tr>
        <tr class="totals-row"><td>Grand Total</td><td>${totalReimbursements.toLocaleString()} reimb/mo</td><td style="text-align:right;font-size:15px">${fmtMoney(totalMonthly)}</td><td style="text-align:right;font-size:15px">${fmtMoney(totalMonthly*12)}</td></tr>
      </tbody>
    </table>
    ${countries.length > 0 ? `<h2>Scoping Details</h2>
    <table>
      <thead><tr><th>Country</th><th>ERP</th><th>Card Program</th><th>Travel Partner</th></tr></thead>
      <tbody>${scopeRows}</tbody>
    </table>` : ""}
    <div class="approval">
      <div class="approval-field"><div class="label">Approved By</div><div class="value">${approvedBy || ""}</div></div>
      <div class="approval-field"><div class="label">Date Approved</div><div class="value">${dateApproved || ""}</div></div>
      <div class="approval-field"><div class="label">Prepared By</div><div class="value">${prospect.preparedBy || ""}</div></div>
      <div class="approval-field"><div class="label">Prepared Date</div><div class="value">${prospect.date || ""}</div></div>
    </div>
    <div class="footer"><span>Reimbursements Pricing Calculator</span><span>Generated ${today}</span></div>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reimbursements-pricing-${(prospect.name || "summary").replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Pricing summary downloaded! Open the HTML file in your browser and use Print \u2192 Save as PDF.");
  }

  const sections = [renderInstructions, renderCountries, renderUsers, renderCards, renderERP, renderReview, renderSummary];

  // ── Layout ─────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      background: colors.surface, minHeight: "100vh", display: "flex", flexDirection: "column",
      color: colors.text,
    }}>
      {/* Top bar */}
      <div style={{
        background: colors.navy, color: "#fff",
        padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, position: "relative", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
            <span style={{ color: colors.teal }}>Reimbursements</span> Calculator
          </div>
          <div style={{ height: 20, width: 1, background: "rgba(255,255,255,0.2)" }}></div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Pricing Calculator</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Reference dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowFAQ(!showFAQ)}
              style={{
                background: showFAQ ? "rgba(255,255,255,0.15)" : "transparent",
                border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8,
                color: "#fff", padding: "6px 14px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
              }}
            >
              Reference {showFAQ ? "▴" : "▾"}
            </button>
            {showFAQ && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0, width: 440,
                background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                border: `1px solid ${colors.border}`, zIndex: 200, overflow: "hidden",
              }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, fontWeight: 700, color: colors.navy, fontSize: 15 }}>Reference & FAQ</div>
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {FAQ_ITEMS.map((item, i) => (
                    <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                      <div
                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                        style={{
                          padding: "14px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                          color: faqOpen === i ? colors.accent : colors.text,
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          background: faqOpen === i ? colors.accentSoft : "transparent",
                          transition: "all 0.15s",
                        }}
                      >
                        {item.q}
                        <span style={{ fontSize: 10, marginLeft: 8 }}>{faqOpen === i ? "▲" : "▼"}</span>
                      </div>
                      {faqOpen === i && (
                        <div style={{ padding: "0 20px 14px 20px", fontSize: 13, color: colors.textMuted, lineHeight: 1.7 }}>{item.a}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textMuted, display: "flex", gap: 16 }}>
                  <span style={{ cursor: "pointer", color: colors.accent }}>Expense Tiers</span>
                  <span style={{ cursor: "pointer", color: colors.accent }}>Country Logic</span>
                  <span style={{ cursor: "pointer", color: colors.accent }}>Input Logic</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar */}
        <div style={{
          width: 220, background: "#fff", borderRight: `1px solid ${colors.border}`,
          padding: "24px 0", display: "flex", flexDirection: "column", gap: 2, flexShrink: 0,
          overflowY: "auto",
        }}>
          {STEPS.map((s, i) => {
            const active = step === i;
            const completed = i < step;
            return (
              <div
                key={s.id}
                onClick={() => setStep(i)}
                style={{
                  padding: "12px 20px",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  background: active ? colors.accentSoft : "transparent",
                  borderLeft: `3px solid ${active ? colors.accent : "transparent"}`,
                  transition: "all 0.2s",
                  color: active ? colors.accent : completed ? colors.success : colors.textMuted,
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13,
                  background: active ? colors.accent : completed ? colors.successBg : colors.surface,
                  color: active ? "#fff" : completed ? colors.success : colors.textMuted,
                  fontWeight: 700,
                }}>
                  {completed ? "✓" : <StepIcon id={s.id} color={active ? "#fff" : colors.textMuted} size={14} />}
                </span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{s.label}</span>
              </div>
            );
          })}

          {/* Live pricing widget in sidebar */}
          {totalMonthly > 0 && (
            <div style={{
              margin: "24px 16px 0", padding: 16, background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyLight})`,
              borderRadius: 12, color: "#fff",
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7, marginBottom: 6 }}>Running Total</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}><FmtUSD value={totalMonthly} /></div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{totalUsers} users · {totalReimbursements} reimb/mo</div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.15)", fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ opacity: 0.7 }}>Domestic</span>
                  <span style={{ fontWeight: 600 }}><FmtUSD value={domesticTotal} /></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ opacity: 0.7 }}>Non-Domestic</span>
                  <span style={{ fontWeight: 600 }}><FmtUSD value={nonDomesticTotal} /></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "32px 40px 120px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {/* Step indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: i === step ? "auto" : 8, height: 8, borderRadius: 20,
                    background: i <= step ? colors.accent : colors.border,
                    padding: i === step ? "2px 10px" : 0,
                    fontSize: 10, fontWeight: 700, color: "#fff",
                    display: "flex", alignItems: "center",
                    transition: "all 0.3s",
                  }}>
                    {i === step && <span>{i + 1}/{STEPS.length}</span>}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: i < step ? colors.accent : colors.border }}></div>}
                </div>
              ))}
            </div>

            {sections[step]()}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        background: "#fff", borderTop: `1px solid ${colors.border}`,
        padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 13, color: colors.textMuted }}>
          {countries.length > 0 && (
            <span>{countries.length} {countries.length === 1 ? "country" : "countries"} · {totalUsers} users · <strong style={{ color: colors.accent }}><FmtUSD value={totalMonthly} /></strong>/mo</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && <Btn variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Btn>}
          {step < STEPS.length - 1 && (
            <Btn onClick={() => setStep(s => s + 1)} disabled={!canProceed(step)}>
              Save & Next →
            </Btn>
          )}
        </div>
      </div>

      {/* Click-outside for FAQ */}
      {showFAQ && <div onClick={() => setShowFAQ(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }}></div>}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? colors.navy : colors.danger,
          color: "#fff", padding: "12px 24px", borderRadius: 10,
          fontSize: 14, fontWeight: 600, zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "toastIn 0.3s ease-out",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(16px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>

      {/* Load font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </div>
  );
}