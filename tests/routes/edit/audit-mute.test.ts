// What the /api/write route does with an audit mute: one finding parked, one brought back, and the
// refusals that leave config/behavior.yml exactly as it was.
//
// It is its own file rather than a block of tests/routes/edit/write.test.ts, which is at the tree's
// thousand-line limit. The behavior file is a copy under the system temporary directory, asserted
// to be inside it before anything is written, so no case here writes the engine's own
// configuration.

import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { mutedSignatures } from '../../../src/lib/server/content/audit.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';

afterAll(sweepScratch);

const TOKEN = mintToken();
const HOST = '127.0.0.1:8791';
const URL_ = `http://${HOST}/api/write`;

/** One POST of this application's own page, carrying the process token. */
function request(body: unknown): Request {
    return new Request(URL_, {
        method: 'POST',
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/json',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify(body)
    });
}

/** A behavior.yml of the same shape as the engine's, with comments the edit must keep. */
const BEHAVIOR = `# The thresholds and horizons.
read_limits: { status.line: 220, next: 300 }


# The parked audit findings, by signature.
audit_ignore: []


stale_lag_days: 1
`;

const SIGNATURE = '0123456789ab';
const OTHER = 'fedcba987654';

/**
 * A target whose behavior.yml is a copy under the system temporary directory, so no case here
 * writes the engine's own config/behavior.yml.
 */
function muteTarget(body = BEHAVIOR): WriteTarget {
    const dir = scratchDir('oculus-mute-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const file = join(dir, 'behavior.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, body);
    const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
    return {
        hub: dir,
        config: real,
        engine: engineDir(),
        career: careerRules(loadConfig(engineDir()).config),
        projects: () => [],
        bookmarks: join(dir, 'bookmarks.yml'),
        behaviorFile: file,
        layoutFile: join(dir, 'layout.yml'),
        glyphs: []
    };
}

/** What the behavior file of a target holds now. */
function behaviorOf(into: WriteTarget): string {
    return readFileSync(into.behaviorFile, 'utf8');
}

/** The parked signatures the file holds now. */
function parked(into: WriteTarget): unknown {
    return (parse(behaviorOf(into)) as { audit_ignore: unknown }).audit_ignore;
}

describe('the audit mute write', () => {
    it('parks one signature and keeps every other byte of the file', async () => {
        const into = muteTarget();
        const response = await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: true }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['audit_ignore'],
            refused: []
        });
        const written = behaviorOf(into);
        expect(parked(into)).toEqual([SIGNATURE]);
        expect(written).toContain('# The thresholds and horizons.\n');
        expect(written).toContain('# The parked audit findings, by signature.\n');
        expect(written).toContain('stale_lag_days: 1\n');
        expect((parse(written) as { read_limits: unknown }).read_limits).toEqual({
            'status.line': 220,
            next: 300
        });
    });

    it('brings one back, leaving the others where they were', async () => {
        const into = muteTarget(
            BEHAVIOR.replace(
                'audit_ignore: []',
                `audit_ignore:\n    - ${SIGNATURE}\n    - ${OTHER}`
            )
        );
        const response = await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: false }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(parked(into)).toEqual([OTHER]);
    });

    it('parks a signature at most once', async () => {
        const into = muteTarget();
        const body = { kind: 'audit-mute', signature: SIGNATURE, muted: true };
        await handleWrite(request(body), TOKEN, into);
        const written = behaviorOf(into);
        const again = await handleWrite(request(body), TOKEN, into);
        expect(await again.json()).toEqual({ ok: true, changed: [], refused: [] });
        expect(behaviorOf(into)).toBe(written);
    });

    it('writes nothing when a signature that is not parked is brought back', async () => {
        const into = muteTarget();
        const before = behaviorOf(into);
        const response = await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: false }),
            TOKEN,
            into
        );
        expect(await response.json()).toEqual({ ok: true, changed: [], refused: [] });
        expect(behaviorOf(into)).toBe(before);
    });

    it('keeps a line of the list that is not a signature, and mutes nothing by it', async () => {
        const into = muteTarget(
            BEHAVIOR.replace(
                'audit_ignore: []',
                `audit_ignore:\n    - a-note-to-self\n    - ${OTHER}`
            )
        );
        await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: true }),
            TOKEN,
            into
        );
        expect(parked(into)).toEqual(['a-note-to-self', OTHER, SIGNATURE]);
        // The scan reads only the signatures out of that list, so the note parks no finding.
        expect(mutedSignatures(parse(behaviorOf(into)) as Record<string, unknown>)).toEqual([
            OTHER,
            SIGNATURE
        ]);

        await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: false }),
            TOKEN,
            into
        );
        expect(parked(into)).toEqual(['a-note-to-self', OTHER]);
    });

    it('refuses a signature that is not twelve hex characters, and the file is byte-identical', async () => {
        for (const signature of ['nonsense', '0123456789AB', '0123456789abc']) {
            const into = muteTarget();
            const before = behaviorOf(into);
            const response = await handleWrite(
                request({ kind: 'audit-mute', signature, muted: true }),
                TOKEN,
                into
            );
            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'invalid' });
            expect(behaviorOf(into)).toBe(before);
        }
    });

    it('refuses a file whose shape the line edit cannot keep, and the file is byte-identical', async () => {
        const flow = '{ read_limits: { next: 300 }, audit_ignore: [] }\n';
        const into = muteTarget(flow);
        const response = await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: true }),
            TOKEN,
            into
        );
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'invalid' });
        expect(behaviorOf(into)).toBe(flow);
    });

    it('refuses a behavior file that is not there, and says which refusal it was', async () => {
        const into = muteTarget();
        rmSync(into.behaviorFile);
        const response = await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: true }),
            TOKEN,
            into
        );
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: 'unwritable' });
    });

    it('adds the key to a file that does not hold it yet', async () => {
        const into = muteTarget('read_limits: { next: 300 }\n');
        await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: true }),
            TOKEN,
            into
        );
        expect(parked(into)).toEqual([SIGNATURE]);
        expect(behaviorOf(into)).toContain('read_limits: { next: 300 }\n');
    });

    it('does not know a body whose signature or flag is of the wrong shape', async () => {
        for (const body of [
            { kind: 'audit-mute', signature: SIGNATURE },
            { kind: 'audit-mute', signature: '', muted: true },
            { kind: 'audit-mute', muted: true },
            { kind: 'audit-mute', signature: SIGNATURE, muted: 'yes' }
        ]) {
            const response = await handleWrite(request(body), TOKEN, muteTarget());
            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: 'the body is not a write this route knows'
            });
        }
    });
});
