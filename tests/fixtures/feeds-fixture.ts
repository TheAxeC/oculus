// Layer 2, test fixture. Complete socket feed payloads with empty states for unneeded kinds.
// View tests override one feed while retaining the three-feed wire shape.

import type { FeedKind, FeedsPayload } from '../../src/lib/data/model.ts';

export function feedsFixture(kind: FeedKind, body: Partial<FeedsPayload[FeedKind]>): FeedsPayload {
    const empty = (kind: FeedKind): FeedsPayload[FeedKind] => ({
        ok: true,
        kind,
        file: `fixture/${kind}`,
        meta: {},
        entries: []
    });
    const payload: FeedsPayload = {
        radar: empty('radar'),
        leads: empty('leads'),
        linkedin: { ...empty('linkedin'), cadenceDays: 30 }
    };
    payload[kind] = { ...payload[kind], ...body };
    return payload;
}
