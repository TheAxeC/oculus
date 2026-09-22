// Layer 4, test. Direct coverage of the shared Claude transcript and Codex rollout finders.

import { chmodSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { claudeTranscripts, codexRollouts } from '../../../src/lib/server/transcripts/stores.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const DAY = 86400 * 1000;
const made: string[] = [];

function scratch(): string {
    const root = scratchDir('oculus-transcript-stores-');
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    made.push(root);
    return root;
}

function write(path: string, mtimeMs: number): void {
    expect(made.some((root) => resolve(path).startsWith(resolve(root) + sep))).toBe(true);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '{}\n');
    const time = new Date(mtimeMs);
    utimesSync(path, time, time);
}

afterEach(() => {
    for (const root of made.splice(0)) {
        chmodSync(root, 0o700);
        rmSync(root, { recursive: true, force: true });
    }
});

describe('claudeTranscripts', () => {
    it('sorts, filters, caps and includes nested transcripts only when asked', () => {
        const store = scratch();
        const now = Date.now();
        const newest = join(store, 'p', 'newest.jsonl');
        const nested = join(store, 'p', 'session', 'subagents', 'agent-one.jsonl');
        const older = join(store, 'p', 'older.jsonl');
        const stale = join(store, 'p', 'stale.jsonl');
        write(newest, now - 1000);
        write(nested, now - 1500);
        write(older, now - 2000);
        write(stale, now - 3 * DAY);

        expect(claudeTranscripts(store, 0, 0).map((file) => basename(file.path))).toEqual([
            'newest.jsonl',
            'older.jsonl',
            'stale.jsonl'
        ]);
        expect(claudeTranscripts(store, 1, 0).map((file) => basename(file.path))).toEqual([
            'newest.jsonl',
            'older.jsonl'
        ]);
        expect(claudeTranscripts(store, 0, 1).map((file) => basename(file.path))).toEqual([
            'newest.jsonl'
        ]);
        expect(
            claudeTranscripts(store, 0, 0, { nested: true }).map((file) => basename(file.path))
        ).toEqual(['newest.jsonl', 'agent-one.jsonl', 'older.jsonl', 'stale.jsonl']);
    });
});

describe('codexRollouts', () => {
    it('sorts, filters and caps rollout files while leaving another jsonl file out', () => {
        const store = scratch();
        const now = Date.now();
        const newest = join(store, '2026', '09', '13', 'rollout-newest.jsonl');
        const stale = join(store, '2026', '09', '10', 'rollout-stale.jsonl');
        write(newest, now - 1000);
        write(stale, now - 3 * DAY);
        write(join(store, '2026', '09', '13', 'notes.jsonl'), now);

        expect(codexRollouts(store, 0, 0).map((file) => basename(file.path))).toEqual([
            'rollout-newest.jsonl',
            'rollout-stale.jsonl'
        ]);
        expect(codexRollouts(store, 1, 0).map((file) => basename(file.path))).toEqual([
            'rollout-newest.jsonl'
        ]);
        expect(codexRollouts(store, 0, 1).map((file) => basename(file.path))).toEqual([
            'rollout-newest.jsonl'
        ]);
    });

    it('returns an empty list for an unreadable folder', () => {
        const folder = scratch();
        chmodSync(folder, 0o000);
        expect(claudeTranscripts(folder, 0, 0)).toEqual([]);
        expect(codexRollouts(folder, 0, 0)).toEqual([]);
    });
});
