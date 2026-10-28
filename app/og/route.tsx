import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

/**
 * Dynamic social preview image, 1200x630.
 * White background, navy text, blue accent — matching the site theme.
 * Query params: title (required-ish), subtitle (optional), tag (optional).
 * Titles are truncated by layout (fixed heights + overflow hidden) so a
 * long tool/post title cannot break the image.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get("title") || "Quiet Workshop Tools";
  const title = rawTitle.length > 90 ? `${rawTitle.slice(0, 87)}…` : rawTitle;
  const subtitle = searchParams.get("subtitle") || "";
  const tag = searchParams.get("tag") || "Free online tools";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "4px",
                backgroundColor: "#0043ff",
              }}
            />
            <span
              style={{
                fontSize: "24px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#0043ff",
              }}
            >
              {tag}
            </span>
          </div>
          <div
            style={{
              marginTop: "36px",
              fontSize: "68px",
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#0f2040",
              maxHeight: "240px",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: "24px",
                fontSize: "30px",
                lineHeight: 1.4,
                color: "#4a5568",
                maxHeight: "90px",
                overflow: "hidden",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #eef3ff",
            paddingTop: "28px",
          }}
        >
          <span style={{ fontSize: "28px", fontWeight: 600, color: "#0f2040" }}>
            Quiet Workshop Tools
          </span>
          <span style={{ fontSize: "26px", color: "#4a5568" }}>
            No signup · No watermark
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
