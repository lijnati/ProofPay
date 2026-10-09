import { ImageResponse } from "next/og";

export const alt = "ProofPay — Verify payment details before money moves";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f3f2ee";
const INK = "#101113";
const GRAPHITE = "#5b5d63";
const RULE = "#d6d4cd";
const COBALT = "#2140d4";
const HOLD = "#a8322a";

/** Synthetic sample: the request's account against the trusted record (same values as the landing page). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "60px 72px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, letterSpacing: -0.8 }}>
              <svg width="40" height="40" viewBox="0 0 256 256">
                <path fill={INK} d="M28 122A88 88 0 0 1 204 122Z" />
                <path fill={HOLD} d="M52 134A88 88 0 0 0 228 134Z" />
              </svg>
              ProofPay
            </div>
            <span style={{ fontSize: 20, color: GRAPHITE }}>Pre-payment checks for supplier invoices</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 58,
              fontSize: 104,
              lineHeight: 0.94,
              letterSpacing: -5.5,
            }}
          >
            <span>Verify payment details</span>
            <span>before money moves.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: 48, borderTop: `2px solid ${INK}` }}>
            <div style={{ display: "flex", alignItems: "baseline", paddingTop: 18, fontSize: 26 }}>
              <span style={{ width: 170, fontSize: 20, color: GRAPHITE }}>Request</span>
              <span style={{ letterSpacing: 1 }}>GB33 HRBR 6016 1331 9268 19</span>
              <span style={{ marginLeft: "auto", fontSize: 20, color: HOLD }}>Differs</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px solid ${RULE}`,
                fontSize: 26,
                color: GRAPHITE,
              }}
            >
              <span style={{ width: 170, fontSize: 20 }}>Record</span>
              <span style={{ letterSpacing: 1 }}>GB82 WEST 1234 5698 7654 32</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", height: 14, background: COBALT }} />
      </div>
    ),
    size,
  );
}
