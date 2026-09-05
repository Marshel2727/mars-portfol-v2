import { ImageResponse } from "next/og";

export const alt = "Marshel — Full-Stack, IoT & Systems Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#F3F0E8", color: "#17201E", padding: 80 }}>
      <div style={{ display: "flex", fontSize: 26, color: "#0E5655", marginBottom: 32 }}>PORTFOLIO / ENGINEERING</div>
      <div style={{ display: "flex", fontSize: 100 }}>Marshel</div>
      <div style={{ display: "flex", fontSize: 36, marginTop: 24 }}>Full-Stack, IoT &amp; Systems Engineer</div>
      <div style={{ display: "flex", width: 160, height: 8, marginTop: 48, background: "#D95836" }} />
    </div>, size,
  );
}
