export function GoogleG360Mark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="34" height="34" rx="10" fill="#1A73E8" fillOpacity="0.1" stroke="#1A73E8" strokeOpacity="0.25" />
      {/* 4-color Google ring arcs */}
      <path d="M18 7 A11 11 0 0 1 28.4 14.2" stroke="#4285F4" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M28.4 21.8 A11 11 0 0 1 18 29" stroke="#34A853" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M18 29 A11 11 0 0 1 7.6 21.8" stroke="#FBBC04" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M7.6 14.2 A11 11 0 0 1 18 7" stroke="#EA4335" strokeWidth="3.2" strokeLinecap="round" />
      {/* Center Location Pin */}
      <path
        d="M18 12.2c-2.65 0-4.8 2.15-4.8 4.8 0 3.45 4.8 7.8 4.8 7.8s4.8-4.35 4.8-7.8c0-2.65-2.15-4.8-4.8-4.8Zm0 6.6a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z"
        fill="#1A73E8"
      />
    </svg>
  );
}

export function LogoMark({ size = 30 }) {
  return <GoogleG360Mark size={size} />;
}

export function Logo({ light = false, mode = "g360" }) {
  const isDark = Boolean(light);
  if (mode === "site-express") {
    return (
      <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap" data-testid="studio-logo">
        <GoogleG360Mark size={30} />
        <span
          className="font-bold text-[16px] tracking-tight whitespace-nowrap"
          style={{ color: isDark ? "#E8EAED" : "#202124", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Site Express
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap" data-testid="studio-logo">
      <GoogleG360Mark size={32} />
      <span
        className="font-bold text-[17px] tracking-tight whitespace-nowrap"
        style={{ color: isDark ? "#E8EAED" : "#202124", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        G360 <span style={{ color: isDark ? "#8AB4F8" : "#1A73E8", fontWeight: 600 }}>Business</span>
      </span>
    </div>
  );
}
