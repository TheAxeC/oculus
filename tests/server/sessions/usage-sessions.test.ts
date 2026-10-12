// Layer 2, server tests. A transcript whose `agent-name` record begins with the usage prefix was
// started by the usage refresher: the sessions payload (its records and the tree they group into)
// leaves it out, and the usage fold still counts its tokens. The account folder is made under the
// system temporary directory; nothing outside it is read.

import { readFileSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { sessions } from '../../../src/lib/server/sessions/index.ts';
import { UsageTranscriptFold } from '../../../src/lib/server/machine/usage/transcripts.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';

const STAMP = new Date().toISOString();

/** A transcript of one question and one answer that spent `tokens` input tokens, named or not. */
function transcript(tokens: number, name: string | null): string {
    const records: unknown[] = [];
    if (name !== null) records.push({ type: 'agent-name', agentName: name, sessionId: 'x' });
    records.push(
        {
            type: 'user',
            timestamp: STAMP,
            cwd: '/ws/project',
            origin: { kind: 'human' },
            message: { role: 'user', content: 'hello' }
        },
        {
            type: 'assistant',
            timestamp: STAMP,
            message: {
                role: 'assistant',
                model: 'claude-test',
                content: [{ type: 'text', text: 'hi' }],
                usage: { input_tokens: tokens, output_tokens: 1 }
            }
        }
    );
    return records.map((one) => JSON.stringify(one)).join('\n') + '\n';
}

/** An account folder holding three transcripts: a usage one, a named one and an unnamed one. */
function account(): { dir: string; state: string } {
    const dir = plantScratch('oculus-usage-sessions-', {
        'projects/hub/usage-run.jsonl': transcript(10, 'oculus-usage-gmail'),
        'projects/hub/my-run.jsonl': transcript(20, 'my-run'),
        'projects/hub/plain-run.jsonl': transcript(40, null)
    });
    return { dir, state: plantScratch('oculus-usage-sessions-state-', {}) };
}

describe('the transcripts a usage refresh leaves', () => {
    it('are in no list of sessions, and their tokens are in the usage spend', async () => {
        const { dir, state } = account();
        const payload = sessions({
            stores: [join(dir, 'projects')],
            codexStores: [],
            registries: [],
            cachePath: join(state, 'cache.json'),
            overridesPath: join(state, 'overrides.json'),
            probe: { running: () => false, starts: () => new Map() },
            windowDays: 0
        });
        const grouped = payload.workspaces.flatMap((one) =>
            one.areas.flatMap((area) => area.sessions.map((session) => session.id))
        );
        expect(payload.records.map((one) => one.id).sort()).toEqual(['my-run', 'plain-run']);
        expect(grouped.sort()).toEqual(['my-run', 'plain-run']);

        const spent = await new UsageTranscriptFold().fold([
            { tool: 'claude', dir, label: 'gmail' }
        ]);
        expect(spent.files).toBe(3);
        expect(spent.rows.reduce((total, row) => total + row.input, 0)).toBe(70);
    });

    it('do not count towards the cap, and the scan folds no more files than the cap needs', () => {
        const names = ['usage-run', 'run-a', 'run-b', 'run-c', 'run-d'];
        const files: Record<string, string> = {};
        for (const name of names) {
            files[`projects/hub/${name}.jsonl`] = transcript(
                1,
                name === 'usage-run' ? 'oculus-usage-gmail' : null
            );
        }
        const dir = plantScratch('oculus-usage-cap-', files);
        const state = plantScratch('oculus-usage-cap-state-', {});
        const now = Date.now() / 1000;
        names.forEach((name, index) => {
            utimesSync(join(dir, 'projects/hub', `${name}.jsonl`), now - index, now - index);
        });
        const cachePath = join(state, 'cache.json');
        const payload = sessions({
            stores: [join(dir, 'projects')],
            codexStores: [],
            registries: [],
            cachePath,
            overridesPath: join(state, 'overrides.json'),
            probe: { running: () => false, starts: () => new Map() },
            windowDays: 0,
            maxSessions: 2
        });
        expect(payload.records.map((one) => one.id)).toEqual(['run-a', 'run-b']);
        const held = JSON.parse(readFileSync(cachePath, 'utf8')) as {
            entries: Record<string, unknown>;
        };
        const cached = Object.keys(held.entries).map((path) =>
            path.slice(path.lastIndexOf('/') + 1)
        );
        expect(cached.sort()).toEqual(['run-a.jsonl', 'run-b.jsonl', 'usage-run.jsonl']);
    });
});
