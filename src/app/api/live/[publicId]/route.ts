import { getLiveSnapshot } from "@/lib/data";

/**
 * Live schedule JSON, polled every few seconds by every phone at the gig.
 * Polling (instead of websockets) works on any host and recovers by itself
 * when venue Wi-Fi drops out.
 */
export async function GET(_req: Request, ctx: RouteContext<"/api/live/[publicId]">) {
  const { publicId } = await ctx.params;
  const snapshot = await getLiveSnapshot(publicId);
  if (!snapshot) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
