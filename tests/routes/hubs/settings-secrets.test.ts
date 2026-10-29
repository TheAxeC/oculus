// Layer 2, route tests. A `downloads` secret of a hub's `.oculus/local.yml` set through the This
// machine scope of Settings is held by no route answer, change record or answer of the machine's
// values (G76): the Settings write route answers the Save with no secret in its body, a row sent
// with no secret keeps the one the file holds, the change log records the save with no secret, its
// undo puts every other value back and leaves the secret as the file holds it, and the machine's
// answer of each hub's file gives the secret as set.
//
// The hub is the synthetic primary of `configTarget` (a scratch engine and a scratch hub), and the
// secrets are made-up values; the test reads no real `local.yml`.
// @module-tag slow: every case takes 700 ms or more in a run of its own. The time is the scratch
// engine copied for each case and the configuration the Save reads its catalog from (`loadConfig`,
// about 220 ms a read); no case waits.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { textDigest } from '../../../src/lib/data/shapes/config-save.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { localFiles } from '../../../src/lib/server/root/process/context/machine-values.ts';
import { it } from '../../fixtures/scratch.ts';
import { TOKEN, changesOf, configTarget, request, undone } from '../edit/write-fixture.ts';

/** The made-up secret a case saves, and the one a second case replaces it with. */
const SECRET = 'made-up-token-4711';
const OTHER = 'made-up-token-0815';

/** The hub's `local.yml`. */
function localOf(into: PrimaryTarget): string {
    return join(into.hub, '.oculus', 'local.yml');
}

/** The text of a file, or null when it is not there. */
function textOf(path: string): string | null {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return null;
    }
}

/** One Save of the This machine scope of the primary, with the `downloads` rows given. */
function save(into: PrimaryTarget, rows: unknown[]): Promise<Response> {
    return handleWrite(
        request({
            kind: 'config-save',
            scope: 'local',
            root: into.primary,
            digest: textDigest(textOf(localOf(into))),
            changes: [{ file: 'local.yml', key: 'downloads', value: rows }]
        }),
        TOKEN,
        into
    );
}

describe('a downloads secret saved through Settings is held by no answer or record', () => {
    it.each([
        { row: 'a new secret', sent: { service: 'ieee', secret: OTHER }, held: OTHER },
        { row: 'a row sent with no secret', sent: { service: 'ieee', user: 'me' }, held: SECRET }
    ])('the Settings write route answers $row with no secret', async ({ sent, held }) => {
        const into = configTarget();
        expect((await save(into, [{ service: 'ieee', secret: SECRET }])).status).toBe(200);
        const answer = await save(into, [sent]);
        const body = await answer.text();
        expect(answer.status).toBe(200);
        expect(body).not.toContain(SECRET);
        expect(body).not.toContain(OTHER);
        expect(textOf(localOf(into))).toContain(held);
    });

    it('the History record holds no secret', async () => {
        const into = configTarget();
        expect((await save(into, [{ service: 'ieee', secret: SECRET }])).status).toBe(200);
        const [change] = changesOf(into);
        expect(change.kind).toBe('config-save');
        expect(change.after).toEqual({ downloads: [{ service: 'ieee', secret: true }] });
        const log = readFileSync(into.changes?.file ?? '', 'utf8');
        expect(log).not.toContain(SECRET);
    });

    it("the undo of a save of the port and a secret puts the port and the row's user back and keeps the secret", async () => {
        const into = configTarget();
        expect((await save(into, [{ service: 'ieee', user: 'me', secret: SECRET }])).status).toBe(
            200
        );
        const before = textOf(localOf(into)) ?? '';
        const answer = await handleWrite(
            request({
                kind: 'config-save',
                scope: 'local',
                root: into.primary,
                digest: textDigest(before),
                changes: [
                    { file: 'local.yml', key: 'port', value: 8799 },
                    {
                        file: 'local.yml',
                        key: 'downloads',
                        value: [{ service: 'ieee', user: 'them', secret: OTHER }]
                    }
                ]
            }),
            TOKEN,
            into
        );
        expect(answer.status).toBe(200);
        expect((await undone(into, changesOf(into)[0])).status).toBe(200);
        expect(textOf(localOf(into))).toBe(before.replace(SECRET, OTHER));
        const log = readFileSync(into.changes?.file ?? '', 'utf8');
        expect([log.includes(SECRET), log.includes(OTHER)]).toEqual([false, false]);
    });

    it("the machine values' answer of each hub's file gives the secret as set", async () => {
        const into = configTarget();
        expect((await save(into, [{ service: 'ieee', secret: SECRET }])).status).toBe(200);
        const files = localFiles([{ name: into.primary, dir: into.hub }]);
        expect(JSON.stringify(files)).not.toContain(SECRET);
        expect(files[into.primary].values).toEqual({
            downloads: [{ service: 'ieee', secret: true }]
        });
    });
});
