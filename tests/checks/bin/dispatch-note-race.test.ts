// Layer 4, test. The launch note's lock cleared while another writer takes it, as one fixed
// interleaving rather than a race left to the scheduler.
//
// A clearer judged a dead writer's lock stale; before it acts, that lock was cleared by another and
// a live writer took a fresh one. The clearer must leave the live lock alone. A clearer that moves
// the lock aside to look at it leaves the lock path empty for a moment, and a second writer that
// takes the lock in that moment makes two holders at once. `node:fs` is wrapped so that a second
// writer takes the lock the instant anything renames it: the moment that race needs is then
// certain, and the case is red on every run under a clearer that renames.
//
// Every file is made under the temporary directory, and nothing is signalled.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

const hook = vi.hoisted(() => ({ afterRename: null as null | ((from: string) => void) }));

vi.mock('node:fs', async (original) => {
    const real = await original<typeof import('node:fs')>();
    const renameSync: typeof real.renameSync = (from, to) => {
        real.renameSync(from, to);
        hook.afterRename?.(String(from));
    };
    return { ...real, default: { ...real, renameSync }, renameSync };
});

afterAll(sweepScratch);

const SCRIPT = resolve('bin/dispatch-note.mjs');

describe('a clearer against a lock a live writer took since it was judged', () => {
    it('leaves the live lock in place, whatever a second writer does in the meantime', async () => {
        const dir = scratchDir('oculus-dispatch-race-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        const lock = join(dir, '.oculus', 'dispatches.json.lock');
        const live = `${process.pid} first-live-writer`;
        const second = `${process.pid} second-live-writer`;
        writeFileSync(lock, live);
        const renamed: string[] = [];
        // The second writer takes the lock the moment the lock path is renamed away.
        hook.afterRename = (from) => {
            renamed.push(from);
            if (from === lock) writeFileSync(lock, second, { flag: 'wx' });
        };
        const { breakStale } = (await import(SCRIPT)) as {
            breakStale: (lock: string, judged: string) => void;
        };
        try {
            // revert: bin/dispatch-note.mjs:179-195 => const aside = `${lock}.aside-${process.pid}-${Math.random()}`; try { renameSync(lock, aside); } catch { return; } if (readText(aside) !== judged) { try { linkSync(aside, lock); } catch { /* taken */ } } rmSync(aside, { force: true });
            breakStale(lock, '1 judged-dead');
        } finally {
            hook.afterRename = null;
        }
        expect(readFileSync(lock, 'utf8')).toBe(live);
        expect(renamed).toEqual([]);
        expect(existsSync(`${lock}.break`)).toBe(false);
        expect(readdirSync(join(dir, '.oculus'))).toEqual(['dispatches.json.lock']);
        rmSync(dir, { recursive: true, force: true });
    });
});
