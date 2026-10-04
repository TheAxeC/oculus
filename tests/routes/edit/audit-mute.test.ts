// Layer 2, route tests. What the /api/write route does with an audit mute: one finding parked.
//
// The behavior file is a copy under the system temporary directory, asserted to be inside it before
// anything is written, so no case here writes the engine's own configuration.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no case
// pays for it.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { warmConfig } from './write-fixture.ts';
import { parse } from 'yaml';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';

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

/**
 * A target whose behavior.yml is a copy under the system temporary directory, so no case here
 * writes the engine's own config/behavior.yml.
 */
function muteTarget(body = BEHAVIOR): WriteTarget {
    const dir = scratchDir('oculus-mute-');
    const file = join(dir, 'behavior.yml');
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    writeFileSync(file, body);
    const merged = loadConfig(engineDir()).config;
    return {
        hub: dir,
        config: portfolioConfigFrom(merged, engineDir()),
        engine: engineDir(),
        career: careerRules(merged),
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

test.beforeAll(warmConfig);

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
});
