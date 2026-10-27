// Layer 2, route tests. Taking back a write of the user's key, `self` of the primary hub's
// `.oculus/local.yml`: the undo puts the file back byte for byte, refuses a file another hand
// changed since as moved, and answers gone once the primary is another hub. The undo of every
// other kind of change is tests/routes/edit/undo/undo.test.ts's.
//
// The hub and the change log are the fixture of tests/routes/edit/write-fixture.ts
// (`configTarget`), all under the system temporary directory, so no case here reaches ~/.oculus,
// the checkout or a real `local.yml`.
// @module-tag slow: each case merges the whole config folder several times and takes over 100 ms.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { Change } from '../../../../src/lib/server/core/changes.ts';
import { handleWrite, type PrimaryTarget } from '../../../../src/lib/server/edit/writes.ts';
import { scratchDir, it, test } from '../../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    request,
    undone,
    undoneBack,
    warmConfig
} from '../write-fixture.ts';

test.beforeAll(warmConfig);

/** The primary's `local.yml` a case starts from: comments, other keys and `self: ada`. */
const LOCAL_HELD = '# this machine\nport: 8791  # the port\nself: ada  # me\nclaude_bin: claude\n';

/** A target whose primary's `local.yml` holds `text`, or none, with that file's path. */
function held(text: string | null): { into: PrimaryTarget; file: string } {
    const into = configTarget();
    const file = join(into.hub, '.oculus', 'local.yml');
    if (text !== null) writeFileSync(file, text);
    return { into, file };
}

/** Send one write of the key, or its reset, and answer the change the log records. */
async function sent(into: PrimaryTarget, body: Record<string, unknown>): Promise<Change> {
    const response = await handleWrite(
        request({ file: 'local.yml', key: 'self', ...body }),
        TOKEN,
        into
    );
    expect(response.status).toBe(200);
    const [change] = changesOf(into);
    return change;
}

describe("taking back a write of the user's key", () => {
    it('puts self: ada back byte for byte after a write of bob (case 11)', async () => {
        const { into, file } = held(LOCAL_HELD);
        const change = await sent(into, { kind: 'config-key', value: 'bob' });
        expect(readFileSync(file, 'utf8')).toBe(LOCAL_HELD.replace('ada', 'bob'));
        await undoneBack(into, change, file, LOCAL_HELD);
    });

    it('takes out the key a write added, every other byte kept (case 12)', async () => {
        const text = '# this machine\nport: 8791\n';
        const { into, file } = held(text);
        const change = await sent(into, { kind: 'config-key', value: 'bob' });
        await undoneBack(into, change, file, text);
    });

    it('puts the line a reset took out back where it stood (case 13)', async () => {
        const { into, file } = held(LOCAL_HELD);
        const change = await sent(into, { kind: 'config-reset' });
        expect(readFileSync(file, 'utf8')).toBe(LOCAL_HELD.replace('self: ada  # me\n', ''));
        await undoneBack(into, change, file, LOCAL_HELD);
    });

    it('refuses as moved a write whose value another hand changed since, and writes nothing (case 18)', async () => {
        const { into, file } = held(LOCAL_HELD);
        const change = await sent(into, { kind: 'config-key', value: 'bob' });
        const hand = LOCAL_HELD.replace('ada', 'carol');
        writeFileSync(file, hand);
        const moved = await undone(into, change);
        expect(moved.status).toBe(409);
        expect(await moved.json()).toEqual({ error: 'moved' });
        expect(readFileSync(file, 'utf8')).toBe(hand);
    });

    it('answers gone once the primary is another hub, and writes nothing (case 30)', async () => {
        const { into, file } = held(LOCAL_HELD);
        const change = await sent(into, { kind: 'config-key', value: 'bob' });
        const lab = scratchDir('oculus-lab-');
        const moved: PrimaryTarget = {
            ...into,
            hub: lab,
            primary: 'lab',
            hubs: [{ key: 'hub', hub: into.hub, config: into.config }]
        };
        const gone = await undone(moved, change);
        expect(gone.status).toBe(404);
        expect(await gone.json()).toEqual({ error: 'gone' });
        expect(readFileSync(file, 'utf8')).toBe(LOCAL_HELD.replace('ada', 'bob'));
        expect(existsSync(join(lab, '.oculus', 'local.yml'))).toBe(false);
    });
});
