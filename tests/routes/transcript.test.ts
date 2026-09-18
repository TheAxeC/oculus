// What GET /api/transcript answers. The route itself is one line handing the request to
// handleTranscript, which is what this calls with an options bag holding a `recordFor` the test
// owns instead of the bridge to the last published payload: no session store, no registry and no hub
// is read, and the only file any case opens is the one written under mkdtemp.

import { statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { FIRST_READ_TURNS, handleTranscript } from '../../src/lib/server/transcript-routes.ts';
import { record } from '../sessions-fixture.ts';
import type { SessionRecord } from '../../src/lib/data/model.ts';
import { sessionRecord } from '../../src/lib/server/sessions/hooks.ts';
import { contextFixture } from '../server/context-fixture.ts';
import { scratchDir, sweepScratch } from '../scratch.ts';

afterAll(sweepScratch);

const HOST = '127.0.0.1:8791';
const SESSION = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

/** One synthetic transcript: a prompt and an answer, under the system temporary root. */
function transcript(): string {
    const root = scratchDir('oculus-transcript-route-');
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const path = join(root, `${SESSION}.jsonl`);
    const lines = [
        {
            type: 'user',
            timestamp: '2026-09-11T08:00:00.000Z',
            origin: { kind: 'human' },
            message: { role: 'user', content: 'do the thing' }
        },
        {
            type: 'assistant',
            timestamp: '2026-09-11T08:00:05.000Z',
            message: { role: 'assistant', content: [{ type: 'text', text: 'Doing it.' }] }
        }
    ];
    writeFileSync(path, lines.map((one) => JSON.stringify(one) + '\n').join(''));
    return path;
}

/** A transcript of `turns` prompts, for the cap on what a first read answers with. */
function longTranscript(turns: number): string {
    const root = scratchDir('oculus-transcript-long-');
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const path = join(root, `${SESSION}.jsonl`);
    const lines: string[] = [];
    for (let i = 0; i < turns; i += 1) {
        lines.push(
            JSON.stringify({
                type: 'user',
                timestamp: '2026-09-11T08:00:00.000Z',
                origin: { kind: 'human' },
                message: { role: 'user', content: `question ${i}` }
            }) + '\n'
        );
    }
    writeFileSync(path, lines.join(''));
    return path;
}

/** The payload's records, as the endpoint reads them: one session and nothing else. */
function recordFor(path: string): (id: string) => SessionRecord | null {
    const held = record(SESSION, { path, tool: 'claude' });
    const server = contextFixture();
    server.hub.publish('sessions', { records: [held], workspaces: [], terminals: [] });
    return (id) => sessionRecord(server.hub, id);
}

function request(query: string): Request {
    return new Request(`http://${HOST}/api/transcript?${query}`, {
        headers: { 'sec-fetch-site': 'same-origin' }
    });
}

describe('GET /api/transcript', () => {
    it('answers 404 for an id the last payload does not hold', async () => {
        const response = handleTranscript(request('id=not-there'), {
            recordFor: recordFor(transcript())
        });
        expect(response.status).toBe(404);
        expect(((await response.json()) as { error: string }).error).toContain('not-there');
    });

    it('answers 400 for a from that is not a whole number', async () => {
        const response = handleTranscript(request(`id=${SESSION}&from=abc`), {
            recordFor: recordFor(transcript())
        });
        expect(response.status).toBe(400);
        expect(((await response.json()) as { error: string }).error).toContain('abc');
    });

    it('answers the turns of the session the payload holds', async () => {
        const response = handleTranscript(request(`id=${SESSION}`), {
            recordFor: recordFor(transcript())
        });
        expect(response.status).toBe(200);
        const body = (await response.json()) as {
            turns: { role: string; text: string }[];
            offset: number;
        };
        expect(body.turns.map((turn) => turn.role)).toEqual(['user', 'assistant']);
        expect(body.turns[0].text).toBe('do the thing');
        expect(body.offset).toBeGreaterThan(0);
    });

    it('answers a first read with the last turns only, and the offset of the whole file', async () => {
        const path = longTranscript(FIRST_READ_TURNS + 30);
        const size = statSync(path).size;
        const response = handleTranscript(request(`id=${SESSION}`), { recordFor: recordFor(path) });
        expect(response.status).toBe(200);
        const body = (await response.json()) as {
            turns: { role: string; text: string }[];
            offset: number;
        };
        expect(body.turns.length).toBe(FIRST_READ_TURNS);
        // The newest turn is the last one, and the offset is the end of the file, so the client's
        // next read carries what is appended after it rather than what the cap dropped.
        expect(body.turns[body.turns.length - 1].text).toBe(`question ${FIRST_READ_TURNS + 29}`);
        expect(body.turns[0].text).toBe('question 30');
        expect(body.offset).toBe(size);

        // A later read is not capped: it carries only what was appended since the offset.
        const after = handleTranscript(request(`id=${SESSION}&from=${size}`), {
            recordFor: recordFor(path)
        });
        const tail = (await after.json()) as { turns: unknown[]; offset: number };
        expect(tail.turns).toEqual([]);
        expect(tail.offset).toBe(size);
    });

    it('refuses a request from another origin', () => {
        const other = new Request(`http://${HOST}/api/transcript?id=${SESSION}`, {
            headers: { origin: 'http://elsewhere.example', 'sec-fetch-site': 'cross-site' }
        });
        const response = handleTranscript(other, { recordFor: recordFor(transcript()) });
        expect(response.status).toBe(403);
    });
});
