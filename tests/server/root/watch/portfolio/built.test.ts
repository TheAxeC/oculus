// The portfolio watcher's `built` callback, over the real watcher on a synthetic hub: it is called
// once per rebuild, after the portfolio, the audit and the feeds are published, so what it reads
// from the hub is the rebuild's own result; a throw from it is logged and costs nothing else; and
// it is never called once the watcher is closed. The file system's watches are held and the clock
// is faked, so a case fires the registry folder's event itself.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import type { Snapshot } from '../../../../../src/lib/data/model/index.ts';
import { configDir } from '../../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import { watchPortfolio } from '../../../../../src/lib/server/root/watch/portfolio.ts';
import { HOST, buildEngine, buildHub, fakeClock, type HeldWatches } from '../probe.ts';
import { noop } from '../../../../fixtures/doubles.ts';
import { it } from '../../../../fixtures/scratch.ts';

const watches = vi.hoisted((): HeldWatches => ({ held: false, listeners: new Map() }));

vi.mock('node:fs', async (original) =>
    (await import('../probe.ts')).heldWatches(await original(), watches)
);

const DEBOUNCE = 20;

/** What the hub held when `built` was called, with the host the resources registry gave. */
type Seen = { portfolio: number; audit: number; feeds: number; host: string | undefined };

/** The resources registry with one cluster whose host is `host`. */
function registry(host: string): string {
    return `entries:\n  - { key: utwente, name: UTwente, kind: cluster, host: ${host} }\n`;
}

/**
 * Write the resources registry. It sits in its own folder, named by `resources_file`, since the
 * registries folder also holds the career file, whose watch replaces that path's held listener.
 */
function put(hub: string, host: string): void {
    mkdirSync(join(hub, 'places'), { recursive: true });
    writeFileSync(join(hub, 'places/resources.yml'), registry(host));
}

/** A started watcher over a hub whose resources registry names `first`, with `built` recorded. */
function begin(first: string, built?: (seen: Seen) => void) {
    watches.held = true;
    fakeClock();
    const hubDir = buildHub();
    const engine = buildEngine();
    writeFileSync(join(engine, 'config/places.yml'), 'resources_file: places/resources.yml\n');
    put(hubDir, first);
    const channels = new Hub();
    const seen: Seen[] = [];
    const watcher = watchPortfolio(
        channels,
        {
            hub: hubDir,
            engine,
            icons: { set: {} },
            host: HOST,
            roots: () => [],
            workspacesFile: join(engine, 'workspaces.json')
        },
        {
            debounce: DEBOUNCE,
            built: () => {
                const snapshot = channels.latest('portfolio')?.payload as Snapshot | undefined;
                const entry: Seen = {
                    portfolio: channels.version('portfolio'),
                    audit: channels.version('audit'),
                    feeds: channels.version('feeds'),
                    host: snapshot?.entities.resources.utwente.host
                };
                seen.push(entry);
                built?.(entry);
            }
        }
    );
    /** Fire the event the engine's config folder watch would, which also rebuilds the feeds. */
    const touchConfig = (): void => {
        watches.listeners.get(configDir(engine))?.('change', 'places.yml');
    };
    /** Write the registry and fire the event the folder's watch would. */
    const touch = (host: string): void => {
        put(hubDir, host);
        watches.listeners.get(join(hubDir, 'places'))?.('change', 'resources.yml');
    };
    const edit = async (host: string): Promise<void> => {
        touch(host);
        await vi.advanceTimersByTimeAsync(DEBOUNCE + 1);
    };
    return { watcher, channels, seen, edit, touch, touchConfig };
}

afterEach(() => {
    watches.held = false;
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('the portfolio watcher built callback', () => {
    it('is called once for the first build, after the portfolio, audit and feeds are published', () => {
        const { watcher, seen } = begin('one');
        try {
            expect(seen).toEqual([{ portfolio: 1, audit: 1, feeds: 1, host: 'one' }]);
        } finally {
            watcher.close();
        }
    });

    it('is called once per rebuild a registry edit causes, and reads the edit from the hub', async () => {
        const { watcher, seen, edit } = begin('one');
        try {
            await edit('two');
            expect(seen.map((one) => one.host)).toEqual(['one', 'two']);
            expect(seen[1]).toMatchObject({ portfolio: 2, audit: 2 });
        } finally {
            watcher.close();
        }
    });

    it('is called once for two edits inside one debounce, and sees the last', async () => {
        const { watcher, seen, edit, touch } = begin('one');
        try {
            touch('two');
            await vi.advanceTimersByTimeAsync(DEBOUNCE / 2);
            await edit('three');
            expect(seen.map((one) => one.host)).toEqual(['one', 'three']);
        } finally {
            watcher.close();
        }
    });

    it('logs a throw and goes on with the next rebuild', async () => {
        const said = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        let thrown = false;
        const { watcher, seen, edit } = begin('one', () => {
            if (thrown) return;
            thrown = true;
            throw new Error('built failed');
        });
        try {
            expect(said.mock.calls.map((call) => String(call[0]))).toContain(
                'portfolio watch: the built callback failed: built failed'
            );
            await edit('two');
            expect(seen.map((one) => one.host)).toEqual(['one', 'two']);
        } finally {
            watcher.close();
        }
    });

    it('is not called when the watcher is closed while the feeds are being published', async () => {
        const { watcher, channels, seen, touchConfig } = begin('one');
        channels.subscribe(
            {
                send: () => {
                    watcher.close();
                    return Promise.resolve();
                },
                close: noop
            },
            ['feeds'],
            false
        );
        touchConfig();
        await vi.advanceTimersByTimeAsync(DEBOUNCE + 1);
        expect(channels.version('feeds')).toBe(2);
        expect(seen).toHaveLength(1);
    });

    it('is not called after close, whatever event follows', async () => {
        const { watcher, seen, edit } = begin('one');
        watcher.close();
        await edit('two');
        await vi.advanceTimersByTimeAsync(DEBOUNCE * 10);
        expect(seen).toHaveLength(1);
    });
});
