// Layer 2, route tests. What the /api/write route does with a config-value write: the list written
// into the open workspace file, and the undo through the same writer.
//
// The engine is a scratch copy of the checkout's config/ folder and the workspace file is under the
// fixture's hub (write-fixture.ts `configTarget`), so no case here writes the checkout's config or
// reads the machine's own file. What this does NOT cover: the editors that send the write, which
// are state/system/config/editors's and the look's.
// @module-tag slow: its case takes about 1.2 s in a run of its own. The time is the write's own
// checks: the write and its undo each read the whole configuration of the scratch engine before
// and after they write (`loadConfig`, about 220 ms a read), and the case waits on nothing.

import { readFileSync } from 'node:fs';
import { describe, expect } from 'vitest';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    request,
    undoneBack,
    workspaceFileOf
} from './write-fixture.ts';

/** One config-value write as the page sends it. */
function send(
    into: WriteTarget,
    key: string,
    value: unknown,
    base: unknown,
    file = 'behavior.yml'
): Promise<Response> {
    return handleWrite(request({ kind: 'config-value', file, key, value, base }), TOKEN, into);
}

const ORIGINAL = ['python3', 'codex', 'claude', 'node', 'latexmk'];

describe('taking a list back', () => {
    it('puts the workspace file back byte for byte and logs the undo above the write', async () => {
        const into = configTarget(
            undefined,
            'settings:\n  processes:\n    patterns: [python3, codex, claude, node, latexmk]\n'
        );
        const file = workspaceFileOf(into);
        const before = readFileSync(file, 'utf8');
        const next = ['codex', 'python3', 'claude', 'node', 'pytest'];
        expect((await send(into, 'processes.patterns', next, ORIGINAL)).status).toBe(200);
        expect(readFileSync(file, 'utf8')).toContain(
            'patterns: [codex, python3, claude, node, pytest]'
        );
        const [change] = changesOf(into);
        const back = await undoneBack(into, change, file, before);
        expect(back).toMatchObject({
            kind: 'config-value',
            field: 'processes.patterns',
            before: next,
            after: ORIGINAL,
            undoes: change.at
        });
    });
});
