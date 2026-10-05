import { getStore } from "@netlify/blobs";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "cta_contact_click",
  "ai_curve_started",
  "ai_curve_completed",
  "video_play",
  "article_open",
  "article_read_50",
  "article_read_90",
  "linkedin_click",
  "contact_started",
  "contact_submitted",
  "contact_failed",
  "outbound_click",
]);

const clean = (value, max = 120) =>
  typeof value === "string" ? value.replace(/[^\w .:/?&=%+@-]/g, "").slice(0, max) : "";

export default async (req, context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (Number(req.headers.get("content-length") || 0) > 4096) return new Response("Payload too large", { status: 413 });

  let input;
  try {
    input = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = clean(input.event, 48);
  if (!ALLOWED_EVENTS.has(event)) return new Response("Unknown event", { status: 400 });

  const timestamp = new Date().toISOString();
  const date = timestamp.slice(0, 10);
  const record = {
    event,
    timestamp,
    path: clean(input.path, 180) || "/",
    referrerHost: clean(input.referrerHost, 100),
    campaign: {
      source: clean(input.campaign?.source, 80),
      medium: clean(input.campaign?.medium, 80),
      campaign: clean(input.campaign?.campaign, 80),
      content: clean(input.campaign?.content, 80),
    },
    detail: clean(input.detail, 100),
    geo: {
      countryCode: clean(context.geo?.country?.code, 8),
      countryName: clean(context.geo?.country?.name, 80),
      region: clean(context.geo?.subdivision?.name, 80),
    },
  };

  const key = `${date}/${event}/${timestamp}-${crypto.randomUUID()}`;
  const write = getStore({ name: "oneshotlens-analytics" }).setJSON(key, record);
  context.waitUntil(write);

  return new Response(null, {
    status: 202,
    headers: { "Cache-Control": "no-store" },
  });
};

export const config = {
  path: "/api/events",
  method: ["POST"],
};
