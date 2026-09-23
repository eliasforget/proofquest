export async function GET() {
  return Response.json({ ok: true, service: "proofquest-web", phase: "evidence-engine-v0.4" });
}
