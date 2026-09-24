import { ImageResponse } from "next/og";
import { loadPublicCard, imageLocale } from "@/lib/public-sharing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const route = { username: params.get("username") ?? "", kind: params.get("kind") ?? undefined, owner: params.get("owner") ?? undefined, repo: params.get("repo") ?? undefined };
  const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex" };
  try {
    const card = await loadPublicCard(route, imageLocale(params.get("lang")));
    if (!card) return new Response("Not found", { status: 404, headers });
    return new ImageResponse(
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 64, background: "#101524", color: "#f4f6ff", fontFamily: "sans-serif", border: "12px solid #7057ed" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 25, color: "#b6a8ff" }}><span>PROOFQUEST</span><span>{card.badge}</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}><div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.15 }}>{card.title.slice(0, 100)}</div><div style={{ fontSize: 28, color: "#bcc5db" }}>{card.description.slice(0, 150)}</div></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 25 }}><span>{card.detail.slice(0, 85)}</span>{card.reward !== null ? <span style={{ color: "#7ee4bd", fontSize: 44 }}>+{card.reward} XP</span> : null}</div>
      </div>, { width: 1200, height: 630, headers },
    );
  } catch { return new Response("Unavailable", { status: 503, headers }); }
}
