// Layer 2, server. Reads and edits the three YAML feed files used by feed views.
// The feed table keeps paths, identities, and writable fields together so reads and writes cannot
// disagree about which generated file or entry they address.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { isMap } from '../data/guards.ts';
import { engineDir, loadConfig, loadLocal } from '../data/sources/config.ts';
import { portfolioConfigFrom } from '../data/index.ts';
import { sameOrigin } from './auth.ts';
import { deleteEntry, setEntryFields } from './entry-edit.ts';
import { saved } from './writes/entries.ts';
import type { FeedData, FeedKind, PortfolioConfig } from '../data/model.ts';
import type { WriteOutcome } from './writes.ts';

export type FeedRead = FeedData & { kind: FeedKind; file: string };
export type FeedTarget = { hub: string; config: PortfolioConfig };

type FeedRule = { identity: string; fields: string[]; deletable: boolean };

export const FEED_RULES: Record<FeedKind, FeedRule> = {
    radar: { identity: 'title', fields: ['dismissed'], deletable: false },
    inbox: { identity: 'id', fields: ['triaged'], deletable: false },
    leads: { identity: 'title', fields: ['status'], deletable: true }
};

export function isFeedKind(value: string): value is FeedKind {
    return value === 'radar' || value === 'leads' || value === 'inbox';
}

/** Resolve one configured feed path only when it remains inside the hub. */
export function feedFile(hub: string, config: PortfolioConfig, kind: FeedKind): string | null {
    const path = resolve(join(hub, config.feeds[kind]));
    const root = resolve(hub);
    return path === root || path.startsWith(root + sep) ? path : null;
}

/** Parse one feed, requiring its root, meta, and every entry to be maps. */
export function readFeedFile(
    hub: string,
    config: PortfolioConfig,
    kind: FeedKind
): FeedRead | null {
    const file = feedFile(hub, config, kind);
    if (file === null) throw new Error(`the ${kind} feed path is outside the hub`);
    if (!existsSync(file)) return null;
    const parsed: unknown = parse(readFileSync(file, 'utf8'));
    if (!isMap(parsed)) throw new Error(`${file}: expected a map of keys`);
    const meta = parsed.meta === undefined ? {} : parsed.meta;
    if (!isMap(meta)) throw new Error(`${file}: meta is not a map`);
    const entries = parsed.entries === undefined || parsed.entries === null ? [] : parsed.entries;
    if (!Array.isArray(entries) || !entries.every(isMap)) {
        throw new Error(`${file}: every entry must be a map`);
    }
    return { kind, file: config.feeds[kind], meta, entries };
}

/** Set or clear the one field that a feed allows on the entry named by its identity. */
export function writeFeedField(
    hub: string,
    config: PortfolioConfig,
    feed: FeedKind,
    id: string,
    field: string,
    value: unknown
): WriteOutcome {
    const rule = FEED_RULES[feed];
    if (!rule.fields.includes(field)) {
        return {
            found: true,
            changed: [],
            refused: [{ field, reason: `the ${feed} feed does not allow that field` }]
        };
    }
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    if (
        parsed === null ||
        !parsed.entries.some((entry) => String(entry[rule.identity] ?? '') === id)
    ) {
        return { found: false, changed: [], refused: [] };
    }
    return saved(full, source, setEntryFields(source, rule.identity, id, { [field]: value }));
}

/** Delete one lead; the other feed histories are append-only and return a field refusal. */
export function deleteFeedEntry(
    hub: string,
    config: PortfolioConfig,
    feed: FeedKind,
    id: string
): WriteOutcome {
    const rule = FEED_RULES[feed];
    if (!rule.deletable) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'feed', reason: `the ${feed} feed does not allow deletion` }]
        };
    }
    const full = feedFile(hub, config, feed);
    if (full === null || !existsSync(full)) return { found: false, changed: [], refused: [] };
    const source = readFileSync(full, 'utf8');
    const parsed = readFeedFile(hub, config, feed);
    if (
        parsed === null ||
        !parsed.entries.some((entry) => String(entry[rule.identity] ?? '') === id)
    ) {
        return { found: false, changed: [], refused: [] };
    }
    return saved(full, source, deleteEntry(source, rule.identity, id));
}

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

export function feedsTarget(): FeedTarget {
    const engine = engineDir();
    return {
        hub: loadLocal(engine).hub,
        config: portfolioConfigFrom(loadConfig(engine).config)
    };
}

/** Serve one known feed to a same-origin request. */
export function handleFeeds(request: Request, into: FeedTarget): Response {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    const named = new URL(request.url).searchParams.get('kind') ?? '';
    if (!isFeedKind(named)) return json(400, { error: `unknown feed kind ${named}` });
    try {
        const found = readFeedFile(into.hub, into.config, named);
        if (found === null) {
            return json(200, {
                ok: true,
                kind: named,
                file: into.config.feeds[named],
                missing: true
            });
        }
        return json(200, { ok: true, ...found });
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return json(500, { error: reason, kind: named, file: into.config.feeds[named] });
    }
}
