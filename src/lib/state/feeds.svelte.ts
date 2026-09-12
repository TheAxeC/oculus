// Layer 2, client state. The last requested feed by kind, fetched outside the portfolio snapshot.
// A portfolio version change schedules another request for every kind the page has fetched.

import { message, subscribePortfolio } from './entities.svelte.ts';
import type { FeedEntry, FeedKind, SchemaField } from '../data/model.ts';

export type FeedState = {
    ok: true;
    kind: FeedKind;
    file: string;
    meta: Record<string, unknown>;
    entries: FeedEntry[];
    cadenceDays?: number;
    schema?: SchemaField[];
    missing?: boolean;
    error?: string;
};

const held: Partial<Record<FeedKind, FeedState>> = $state({});
const versions: Partial<Record<FeedKind, number>> = {};
const fetched = new Set<FeedKind>();
const inflight = new Set<FeedKind>();
const pendingVersions: Partial<Record<FeedKind, number>> = {};

subscribePortfolio((at) => {
    for (const kind of fetched) schedule(kind, at);
});

function version(): number {
    return message('portfolio')?.version ?? 0;
}

/** The last answer for a kind, or null until its first request completes. */
export function feed(kind: FeedKind): FeedState | null {
    const at = version();
    if (!fetched.has(kind) || versions[kind] !== at) schedule(kind, at);
    return held[kind] ?? null;
}

/** Fetch a kind now and replace its held answer. */
export async function refetch(kind: FeedKind): Promise<FeedState | null> {
    const at = version();
    if (inflight.has(kind)) return held[kind] ?? null;
    inflight.add(kind);
    fetched.add(kind);
    versions[kind] = at;
    try {
        const response = await fetch(`/api/feeds?kind=${encodeURIComponent(kind)}`);
        const body = (await response.json()) as Record<string, unknown>;
        if (!response.ok) {
            held[kind] = {
                ok: true,
                kind,
                file: typeof body.file === 'string' ? body.file : (held[kind]?.file ?? ''),
                meta: {},
                entries: [],
                error: typeof body.error === 'string' ? body.error : String(response.status)
            };
            return held[kind] ?? null;
        }
        const entries = Array.isArray(body.entries)
            ? body.entries.filter(
                  (entry): entry is FeedEntry =>
                      typeof entry === 'object' && entry !== null && !Array.isArray(entry)
              )
            : [];
        const meta =
            typeof body.meta === 'object' && body.meta !== null && !Array.isArray(body.meta)
                ? (body.meta as Record<string, unknown>)
                : {};
        held[kind] = {
            ok: true,
            kind,
            file: typeof body.file === 'string' ? body.file : '',
            meta,
            entries,
            cadenceDays: typeof body.cadenceDays === 'number' ? body.cadenceDays : undefined,
            schema: Array.isArray(body.schema) ? (body.schema as SchemaField[]) : undefined,
            missing: body.missing === true
        };
        return held[kind] ?? null;
    } catch (error) {
        held[kind] = {
            ok: true,
            kind,
            file: '',
            meta: {},
            entries: [],
            error: error instanceof Error ? error.message : String(error)
        };
        return held[kind] ?? null;
    } finally {
        inflight.delete(kind);
        const pending = pendingVersions[kind];
        delete pendingVersions[kind];
        if (pending !== undefined && pending !== versions[kind]) schedule(kind, pending);
    }
}

function schedule(kind: FeedKind, at: number): void {
    if (inflight.has(kind)) {
        pendingVersions[kind] = at;
        return;
    }
    versions[kind] = at;
    queueMicrotask(() => void refetch(kind));
}
