import type { Config, Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { createHmac, randomUUID } from 'node:crypto';

type ParticipationRecord = {
  lat: number;
  lon: number;
  country: string;
  completed_at: string;
  visitor_hash: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

const coarseCoordinate = (value: number) => Math.round(value * 2) / 2;

async function readParticipation(store: ReturnType<typeof getStore>) {
  const { blobs } = await store.list({ prefix: 'events/' });
  const recent = blobs.slice(-2500);
  const records = (await Promise.all(recent.map(blob => store.get(blob.key, { type: 'json' }))))
    .filter((record): record is ParticipationRecord => Boolean(record));
  const cells = new Map<string, { lon: number; lat: number; count: number }>();
  const countries = new Set<string>();

  records.forEach(record => {
    if (record.country) countries.add(record.country);
    const key = `${record.lat.toFixed(1)},${record.lon.toFixed(1)}`;
    const cell = cells.get(key) || { lon: record.lon, lat: record.lat, count: 0 };
    cell.count += 1;
    cells.set(key, cell);
  });

  return {
    status: 'live',
    representative: false,
    total: blobs.length,
    countries: countries.size,
    privacy_threshold: 3,
    locations: [...cells.values()].filter(cell => cell.count >= 3),
  };
}

export default async (request: Request, context: Context) => {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
  if (Netlify.env.get('AI_CURVE_STORAGE_ENABLED') !== 'true') return json({ status: 'disabled' });

  const store = getStore({ name: 'ai-curve-participation', consistency: 'strong' });

  if (request.method === 'POST') {
    const latitude = Number(context.geo?.latitude);
    const longitude = Number(context.geo?.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const payload = await request.json().catch(() => ({})) as { visitor_id?: string };
      const visitorId = typeof payload.visitor_id === 'string' ? payload.visitor_id.slice(0, 100) : '';
      const secret = Netlify.env.get('AI_CURVE_VISITOR_SECRET');
      if (visitorId && secret) {
        const visitorHash = createHmac('sha256', secret).update(visitorId).digest('hex');
        const day = new Date().toISOString().slice(0, 10);
        const dedupeKey = `dedupe/${day}/${visitorHash}`;
        if (!(await store.get(dedupeKey))) {
          const completedAt = new Date().toISOString();
          const month = completedAt.slice(0, 7);
          await store.setJSON(`events/${month}/${randomUUID()}`, {
            lat: coarseCoordinate(latitude),
            lon: coarseCoordinate(longitude),
            country: context.geo?.country?.code || '',
            completed_at: completedAt,
            visitor_hash: visitorHash,
          } satisfies ParticipationRecord);
          await store.set(dedupeKey, '1');
        }
      }
    }
  }

  return json(await readParticipation(store));
};

export const config: Config = {
  path: '/api/participation',
  method: ['GET', 'POST'],
};
