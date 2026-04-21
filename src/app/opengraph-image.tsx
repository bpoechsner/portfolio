import { ImageResponse } from "next/og";
import content from "@/lib/content";

export const runtime = "edge";
export const alt = `${content.meta.name} — ${content.meta.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          fontFamily: "monospace",
        }}
      >
        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "1px", background: "#f59e0b" }} />
          <span style={{ color: "#f59e0b", fontSize: "13px", letterSpacing: "0.3em" }}>
            {content.hero.subheadline.toUpperCase()}
          </span>
        </div>

        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "96px",
              fontWeight: "bold",
              color: "#f59e0b",
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
            }}
          >
            {content.meta.name}
          </div>
          <div style={{ color: "#737373", fontSize: "22px", maxWidth: "700px", lineHeight: 1.4 }}>
            {content.seo.description}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#f59e0b", fontSize: "18px", letterSpacing: "0.2em", fontWeight: "bold" }}>
            {content.nav.logo}
          </span>
          <span style={{ color: "#404040", fontSize: "13px", letterSpacing: "0.2em" }}>
            {content.meta.university.toUpperCase()} · {content.meta.location.toUpperCase()}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
