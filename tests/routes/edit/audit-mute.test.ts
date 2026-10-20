// Layer 2, route tests. What the /api/write route does with an audit mute: one finding parked, the
// `audit_ignore:` list the reader sees written whole into the `settings:` map of the open workspace
// file, since the list has no `key:` field and replaces oculus's list whole.
//
// The engine is a scratch copy of the checkout's config/ folder and the workspace file is under the
// fixture's hub (write-fixture.ts `configTarget`), so no case here writes the engine's own
// configuration.
// @module-tag slow: its case takes 500 ms or more in a run of its own. The time is the write's own
// checks: the write reads the whole configuration of the scratch engine before and after it writes
// (`loadConfig`, about 220 ms a read), and no case waits.

import { readFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import { loadLayers, layersOf } from '../../../src/lib/server/edit/writes/config/config-place.ts';
import { it } from '../../fixtures/scratch.ts';
import { TOKEN, configTarget, defaultsFile, request, workspaceFileOf } from './write-fixture.ts';

const SIGNATURE = '0123456789ab';

describe('the audit mute write', { tags: ['slow'] }, () => {
    it('parks one signature in the workspace file, keeps its other bytes and leaves the defaults file', async () => {
        const into = configTarget(undefined, 'settings:\n  # mine\n  code_theme: nord\n');
        const file = workspaceFileOf(into);
        const before = readFileSync(file, 'utf8');
        const defaults = readFileSync(defaultsFile(into.engine, 'behavior.yml'), 'utf8');
        const response = await handleWrite(
            request({ kind: 'audit-mute', signature: SIGNATURE, muted: true }),
            TOKEN,
            into
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['behavior.yml:audit_ignore'],
            refused: []
        });
        const written = readFileSync(file, 'utf8');
        expect(written.startsWith(before)).toBe(true);
        const parsed = parse(written) as { settings: Record<string, unknown> };
        expect(parsed.settings).toEqual({ code_theme: 'nord', audit_ignore: [SIGNATURE] });
        expect(loadLayers(into.engine, layersOf(into)).config.audit_ignore).toEqual([SIGNATURE]);
        expect(readFileSync(defaultsFile(into.engine, 'behavior.yml'), 'utf8')).toBe(defaults);
    });
});
