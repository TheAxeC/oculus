// Layer 4, test. What the page's socket costs per frame: 50,000 frames of the channels the page
// hears (config, sessions, portfolio at the size of the hub's snapshot, and a `pty:` channel a
// terminal listens on), handed to the socket as text, after one pass that is not timed. The time of
// the timed pass goes to the output, and a count of what the listeners heard is the one thing
// asserted: the case measures and does not judge, so the same file runs against two copies of the
// source and the times are compared by whoever reads them.
//
// @module-tag slow: it feeds 50,000 frames and its time depends on the machine, so npm test leaves
// it out and npm run test:slow runs it.

import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import type { ConfigPayload, Snapshot } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../fixtures/client.ts';
import { stubSocket } from './socket-stub.ts';

afterEach(() => {
    vi.unstubAllGlobals();
});

const FRAMES = 50_000;
const SNAPSHOT_BYTES = 600_000;
const TERMINAL = 't1';

/** The demo hub's snapshot with projects added until its JSON is as long as a real hub's. */
function snapshotOfRealSize(): Snapshot {
    const engine = engineDir();
    const config = portfolioConfigFrom(loadConfig(engine).config, engine);
    const snapshot = buildPortfolio(join(engine, 'demo'), config);
    const projects = Object.values(snapshot.entities.projects);
    const each = JSON.stringify(projects[0]).length;
    const missing = Math.ceil((SNAPSHOT_BYTES - JSON.stringify(snapshot).length) / each);
    for (let n = 0; n < missing; n += 1) {
        const source = projects[n % projects.length];
        snapshot.entities.projects[`${source.id}-${n}`] = { ...source, id: `${source.id}-${n}` };
    }
    return snapshot;
}

/** One frame as the server writes it. */
function frame(channel: string, version: number, payload: unknown): string {
    return JSON.stringify({ channel, version, payload });
}

/** The frames of one pass: mostly terminal output, a push of each other channel now and then. */
function frames(): string[] {
    const engine = engineDir();
    const config = loadConfig(engine).config;
    const configPayload: ConfigPayload = {
        config,
        text: textCatalog(config),
        icons: {},
        host: { name: 'test-machine', address: 'http://127.0.0.1:8799' },
        findings: []
    };
    const sessions = {
        records: Array.from({ length: 120 }, (_, n) => ({ id: `s${n}`, title: `session ${n}` })),
        workspaces: [],
        terminals: [{ id: TERMINAL }]
    };
    const portfolio = frame('portfolio', 1, snapshotOfRealSize());
    const out: string[] = [];
    for (let n = 0; n < FRAMES; n += 1) {
        if (n % 2000 === 0) out.push(portfolio);
        else if (n % 400 === 0) out.push(frame('config', n + 1, configPayload));
        else if (n % 20 === 0) out.push(frame('sessions', n + 1, sessions));
        else out.push(frame(`pty:${TERMINAL}`, n + 1, { bytes: 'aGVsbG8gd29ybGQ=' }));
    }
    return out;
}

describe("the page's socket under load", () => {
    it('hands 50,000 frames to its listeners', () => {
        const { deliverText, open } = stubSocket();
        const client = createClientState();
        let heard = 0;
        const off = client.terminals.subscribePty(
            TERMINAL,
            () => ({ cols: 80, rows: 24 }),
            () => {
                heard += 1;
            }
        );
        client.socket.connect(['config', 'sessions', 'portfolio']);
        open();
        const texts = frames();
        for (const text of texts) deliverText(text);
        heard = 0;
        const start = performance.now();
        for (const text of texts) deliverText(text);
        const elapsed = performance.now() - start;
        console.log(`socket-timing: ${texts.length} frames in ${elapsed.toFixed(1)} ms`);
        off();
        client.socket.disconnect();
        expect(heard).toBeGreaterThan(0);
    });
});
