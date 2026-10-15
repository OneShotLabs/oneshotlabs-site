import { getStore } from "@netlify/blobs";

const LEAD_EVENTS = new Set(["cta_contact_click", "contact_started", "contact_submitted"]);
const ENGAGEMENT_EVENTS = new Set(["video_play", "article_open", "article_read_50", "article_read_90", "ai_curve_completed"]);
const SEARCH_HOSTS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia)\./i;
const SOCIAL_HOSTS = /(^|\.)(linkedin|instagram|facebook|threads|x|twitter|tiktok|youtube)\./i;
const SOCIAL_SOURCES = /linkedin|instagram|facebook|threads|twitter|tiktok|youtube|social/i;

const increment = (target, key, amount = 1) => {
  target[key] = (target[key] || 0) + amount;
};

const channelFor = (record) => {
  const source = record.campaign?.source || "";
  const medium = record.campaign?.medium || "";
  const referrer = record.referrerHost || "";
  if (/cpc|ppc|paid|display|sponsored/i.test(medium)) return "Paid media";
  if (/email|newsletter/i.test(medium) || /email|newsletter/i.test(source)) return "Email";
  if (/social/i.test(medium) || SOCIAL_SOURCES.test(source)) return "Social";
  if (/referral|partner/i.test(medium)) return "Referral";
  if (SEARCH_HOSTS.test(referrer)) return "Organic search";
  if (SOCIAL_HOSTS.test(referrer)) return "Organic social";
  if (referrer) return "Referral";
  return "Direct / unknown";
};

const campaignKey = (record) => {
  const campaign = record.campaign || {};
  if (!campaign.source && !campaign.medium && !campaign.campaign && !campaign.content) return "";
  return [campaign.source || "(none)", campaign.medium || "(none)", campaign.campaign || "(unnamed)", campaign.content || ""].join("|");
};

const blankBucket = () => ({ totals: {}, byDay: {}, pages: {}, referrers: {}, channels: {}, campaigns: {}, geography: {}, recent: [] });

const addRecord = (bucket, record) => {
  if (!record?.event || !record?.timestamp) return;
  const date = record.timestamp.slice(0, 10);
  const path = record.path || "/";
  const channel = channelFor(record);
  const campaign = campaignKey(record);
  const country = record.geo?.countryName || record.geo?.countryCode || "Unknown";
  const region = record.geo?.region || "";
  const geographyKey = region && country !== "Unknown" ? `${region}, ${country}` : country;

  increment(bucket.totals, record.event);
  bucket.byDay[date] ||= {};
  increment(bucket.byDay[date], record.event);

  bucket.pages[path] ||= { path, pageViews: 0, leadSignals: 0, contacts: 0, engagement: 0 };
  if (record.event === "page_view") bucket.pages[path].pageViews += 1;
  if (LEAD_EVENTS.has(record.event)) bucket.pages[path].leadSignals += 1;
  if (record.event === "contact_submitted") bucket.pages[path].contacts += 1;
  if (ENGAGEMENT_EVENTS.has(record.event)) bucket.pages[path].engagement += 1;

  bucket.channels[channel] ||= { channel, pageViews: 0, leadSignals: 0, contacts: 0 };
  if (record.event === "page_view") bucket.channels[channel].pageViews += 1;
  if (LEAD_EVENTS.has(record.event)) bucket.channels[channel].leadSignals += 1;
  if (record.event === "contact_submitted") bucket.channels[channel].contacts += 1;

  if (record.referrerHost && record.event === "page_view") increment(bucket.referrers, record.referrerHost);

  if (campaign) {
    const [source, medium, name, content] = campaign.split("|");
    bucket.campaigns[campaign] ||= { source, medium, campaign: name, content, pageViews: 0, leadSignals: 0, contacts: 0 };
    if (record.event === "page_view") bucket.campaigns[campaign].pageViews += 1;
    if (LEAD_EVENTS.has(record.event)) bucket.campaigns[campaign].leadSignals += 1;
    if (record.event === "contact_submitted") bucket.campaigns[campaign].contacts += 1;
  }

  if (record.event === "page_view") increment(bucket.geography, geographyKey);
  bucket.recent.push({ event: record.event, timestamp: record.timestamp, path, channel, detail: record.detail || "" });
};

const toRows = (value, keyName, limit = 20) => Object.entries(value)
  .map(([key, count]) => ({ [keyName]: key, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, limit);

const finalize = (bucket) => ({
  totals: bucket.totals,
  byDay: bucket.byDay,
  pages: Object.values(bucket.pages).sort((a, b) => b.pageViews - a.pageViews || b.leadSignals - a.leadSignals),
  referrers: toRows(bucket.referrers, "host"),
  channels: Object.values(bucket.channels).sort((a, b) => b.pageViews - a.pageViews),
  campaigns: Object.values(bucket.campaigns).sort((a, b) => b.pageViews - a.pageViews || b.leadSignals - a.leadSignals),
  geography: toRows(bucket.geography, "location"),
  recent: bucket.recent.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 18),
});

const listForDate = async (store, date) => {
  const blobs = [];
  for await (const page of store.list({ prefix: `${date}/`, paginate: true })) blobs.push(...page.blobs);
  const records = [];
  for (let index = 0; index < blobs.length; index += 50) {
    const values = await Promise.all(blobs.slice(index, index + 50).map((blob) => store.get(blob.key, { type: "json" })));
    records.push(...values.filter(Boolean));
  }
  return records;
};

export default async (req) => {
  if (req.method !== "GET") return new Response("Method not allowed", { status: 405 });

  const token = Netlify.env.get("ANALYTICS_REPORT_TOKEN");
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Analytics reporting is not configured", { status: 503 });
  if (supplied !== token) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));
  const store = getStore({ name: "oneshotlens-analytics" });
  const current = blankBucket();
  const previous = blankBucket();

  for (let offset = 0; offset < days * 2; offset += 1) {
    const date = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
    const records = await listForDate(store, date);
    const bucket = offset < days ? current : previous;
    records.forEach((record) => addRecord(bucket, record));
  }

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      days,
      current: finalize(current),
      previous: finalize(previous),
      definitions: {
        leadSignalEvents: [...LEAD_EVENTS],
        engagementEvents: [...ENGAGEMENT_EVENTS],
        privacy: "Cookie-free. No IP addresses, user agents, form contents or persistent visitor identifiers are stored.",
      },
    },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } },
  );
};

export const config = { path: "/api/analytics-report", method: ["GET"] };
