// Layer 4, test. The server's seed of a page's `config` channel: the newest hub version the page's
// own read is at least as new as, and the read itself only when the hub holds an older
// configuration than it.

import { describe, expect, it } from 'vitest';
import type { ConfigPayload } from '../../src/lib/data/model/index.ts';
import { Hub } from '../../src/lib/server/core/channels.ts';
import { configSeed } from '../../src/lib/server/root/config-seed.ts';

const HOST = { name: 'test-machine', address: 'http://127.0.0.1:8799' };

/**
 * The read a page request made: how long a write waits, which is the value a stale push gets
 * wrong.
 */
function read(seconds: number) {
    return { config: { writes: { timeout_seconds: seconds } }, findings: [] };
}

/** What the watcher published: the same shape, with the parts only its read carries. */
function pushed(seconds: number): ConfigPayload {
    return { ...read(seconds), text: {}, icons: {}, host: HOST };
}
const PARTS = { text: {}, icons: {}, host: HOST };

describe("the server's seed", () => {
    it('is at least as new as the held push when that push is another configuration, and carries the read', () => {
        // revert: src/lib/server/root/config-seed.ts:40 => return { payload, through: held.version - 1 };
        const hub = new Hub();
        hub.publish('config', pushed(30));
        hub.publish('config', pushed(30));
        const seed = configSeed(hub, read(1), PARTS);
        expect(seed.through).toBe(2);
        expect(seed.payload).toEqual(pushed(1));
    });

    it('lets the held push in when it is the same configuration, and carries no read', () => {
        // revert: src/lib/server/root/config-seed.ts:38 => if (same) return { payload: { config: read.config, findings: read.findings, ...parts }, through: held.version };
        const hub = new Hub();
        hub.publish('config', pushed(1));
        const seed = configSeed(hub, read(1), PARTS);
        expect(seed.through).toBe(0);
        // The socket's replay brings these values a moment later, so the page data does not.
        expect(seed.payload).toBeUndefined();
    });

    it('takes every push on a hub that holds none yet, and carries no read', () => {
        // revert: src/lib/server/root/config-seed.ts:35 => if (held === undefined) return { payload: { config: read.config, findings: read.findings, ...parts }, through: 1 };
        const seed = configSeed(new Hub(), read(1), PARTS);
        expect(seed.through).toBe(0);
        // The first push the watcher makes is what the page takes.
        expect(seed.payload).toBeUndefined();
    });
});
