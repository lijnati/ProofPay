import { ImageResponse } from "next/og";

export const alt = "ProofPay — catch the payment fraud hiding in plain sight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f7f5",
          padding: "72px 80px",
          color: "#17181a",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "sans-serif", fontSize: 34, fontWeight: 600, letterSpacing: -1 }}>
          <svg width="56" height="56" viewBox="0 0 256 256">
            <path fill="#17181a" d="M28 122A88 88 0 0 1 204 122Z" />
            <path fill="#a8322a" d="M52 134A88 88 0 0 0 228 134Z" />
          </svg>
          ProofPay
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 78, lineHeight: 1.04, letterSpacing: -1 }}>
          <span>Catch the payment fraud</span>
          <span>
            hiding in&nbsp;<span style={{ color: "#a8322a", fontStyle: "italic" }}>plain sight.</span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "monospace", fontSize: 28 }}>
          <span style={{ color: "#a8322a" }}>GB33 HRBR 6016 1331 9268 19 — invoice</span>
          <span style={{ color: "#64666c" }}>GB82 WEST 1234 5698 7654 32 — your verified record</span>
        </div>
      </div>
    ),
    size,
  );
}
