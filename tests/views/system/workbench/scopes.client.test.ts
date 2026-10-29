// Layer 4, test. The Save of one file of a Settings view's scopes
// (views/system/workbench/settings/scopes/scopes.svelte.ts): a change and a `downloads` secret
// typed while the Save of their file was out are the reader's newer word, so they are held after
// the answer for the next Save, and what the Save sent is dropped. The secrets are made up.
//
// What this does NOT cover: the server's write of the Save, which
// tests/routes/edit/undo/config-save.test.ts holds.

import { describe, expect, it } from 'vitest';
import { keyName, type SaveBody } from '../../../../src/lib/state/system/config/scopes/changes.ts';
import type { ScopeGround } from '../../../../src/lib/state/system/config/scopes/scope.ts';
import type { WriteAnswer } from '../../../../src/lib/state/shared/stores/shapes.ts';
import { createScopes } from '../../../../src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts';

const GROUND: ScopeGround = {
    folders: [{ key: 'hub', dir: '/w/hub', hub: true }],
    primary: 'hub',
    workspaceFile: '.oculus/workspaces/w.yml'
};

/** The name the This machine scope of `hub` keeps its changes under. */
const LOCAL = 'local:hub';

const PORT = keyName('local.yml', 'port');

const WRITTEN: WriteAnswer = { ok: true, changed: ['local.yml'], refused: [] };

/** The scopes of a view on the This machine scope of `hub`, each Save held until it is answered. */
function scopesOnLocal() {
    const sent: SaveBody[] = [];
    const answers: ((answer: WriteAnswer) => void)[] = [];
    const settles: (() => void)[] = [];
    /** Settles once the Save has been sent, so what is typed next is typed while it is out. */
    const out = new Promise<void>((settle) => settles.push(settle));
    const scopes = createScopes({
        scope: () => ({ kind: 'local', hub: 'hub' }),
        ground: () => GROUND,
        read: () => ({ name: 'local.yml', present: true, blocked: null, digest: 'digest' }),
        downloads: () => [{ service: 'ieee', user: 'me', secret: true }],
        send: (body) => {
            sent.push(body);
            const answered = new Promise<WriteAnswer>((answer) => answers.push(answer));
            for (const settle of settles) settle();
            return answered;
        },
        saveWorkspace: () => Promise.resolve(WRITTEN)
    });
    return { scopes, sent, out, answer: () => answers.shift()?.(WRITTEN) };
}

describe('a change and a secret typed while the Save of their file is out', () => {
    it('holds a port changed again while the Save was out, and drops the port it sent', async () => {
        const { scopes, sent, out, answer } = scopesOnLocal();
        scopes.changes.stage(LOCAL, PORT, { file: 'local.yml', key: 'port', value: 8799 });
        const saving = scopes.save();
        await out;
        scopes.changes.stage(LOCAL, PORT, { file: 'local.yml', key: 'port', value: 8800 });
        answer();
        expect(await saving).toBe(true);
        expect(sent.map((body) => body.changes)).toEqual([
            [{ file: 'local.yml', key: 'port', value: 8799 }]
        ]);
        expect(scopes.changes.of(LOCAL)).toEqual([{ file: 'local.yml', key: 'port', value: 8800 }]);
    });

    it('holds a secret typed again and one typed for another row while the Save was out, and drops the secret it sent', async () => {
        const { scopes, sent, out, answer } = scopesOnLocal();
        scopes.changes.stageSecret(LOCAL, 'ieee', 'the first made-up secret');
        const saving = scopes.save();
        await out;
        scopes.changes.stageSecret(LOCAL, 'ieee', 'the second made-up secret');
        scopes.changes.stageSecret(LOCAL, 'acm', null);
        answer();
        expect(await saving).toBe(true);
        expect(sent).toHaveLength(1);
        expect([...scopes.changes.secretsOf(LOCAL)]).toEqual([
            ['ieee', 'the second made-up secret'],
            ['acm', null]
        ]);
    });

    it('drops a secret the Save sent when nothing was typed while it was out', async () => {
        const { scopes, out, answer } = scopesOnLocal();
        scopes.changes.stageSecret(LOCAL, 'ieee', 'the first made-up secret');
        const saving = scopes.save();
        await out;
        answer();
        expect(await saving).toBe(true);
        expect(scopes.changes.count(LOCAL)).toBe(0);
    });
});
