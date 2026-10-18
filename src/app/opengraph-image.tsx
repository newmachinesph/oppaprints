import { ImageResponse } from "next/og";
import { STORE_NAME, STORE_TAGLINE } from "@/lib/config";

// Static route metadata (Next reads these named exports).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Render on request, not at build: build-time prerender hits a libvips
// colourspace crash on some platforms; the runtime path (resvg) is unaffected.
export const dynamic = "force-dynamic";
export const alt = `${STORE_NAME} — ${STORE_TAGLINE}`;

// Brand kit: Oppa Yellow #E3A907, Soft Cream #FFF6E0, Bold Black #1A1A1A.
// satori supports flexbox only — no grid, no rounded-corner reset here.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFF6E0",
          color: "#1A1A1A",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#6E6A62", fontWeight: 600 }}>
          CUSTOM PRINT STUDIO
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 128, fontWeight: 800, lineHeight: 1 }}>
            <span>Oppa</span>
            <span style={{ background: "#E3A907", color: "#1A1A1A", padding: "4px 22px", marginLeft: 22 }}>
              Prints
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 600, marginTop: 30 }}>{STORE_TAGLINE}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", fontSize: 30, color: "#6E6A62" }}>
          <div style={{ display: "flex", width: 60, height: 14, background: "#E3A907", marginRight: 22 }} />
          Boxes · Stickers · Keepsakes — made yours
        </div>
      </div>
    ),
    size,
  );
}
