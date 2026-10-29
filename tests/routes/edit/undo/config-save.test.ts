// Layer 2, route tests. What the /api/write route does with the Save of a Settings scope
// (`config-save`): every change of the scope written into its one file as one record of the change
// log, the save refused with nothing written when the file changed since it was read or when one
// change is refused, and the undo of the record putting the file's values back (G9).
//
// The engine is a scratch copy of the checkout's config/ folder and the workspace file is under the
// fixture's hub (write-fixture.ts `configTarget`), so no case writes the checkout's config or reads
// the machine's own file.
// @module-tag slow: every case takes 700 ms or more in a run of its own. The time is the scratch
// engine copied for each case and the configuration each write reads before and after it writes
// (`loadConfig`, about 220 ms a read); no case waits.

import { chmodSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { HUB_FILE } from '../../../../src/lib/data/helpers/hub-names.ts';
import { textDigest } from '../../../../src/lib/data/shapes/config-save.ts';
import { handleWrite } from '../../../../src/lib/server/edit/writes.ts';
import type { PrimaryTarget } from '../../../../src/lib/server/edit/writes.ts';
import { it } from '../../../fixtures/scratch.ts';
import {
    TOKEN,
    changesOf,
    configTarget,
    request,
    undone,
    workspaceFileOf
} from '../write-fixture.ts';

/** The workspace file's `settings:` block a case starts from. */
const HELD = 'settings:\n  changes:\n    # how long the log is\n    keep: 200  # how many\n';

/** The text of a file, or null when it is not there. */
function textOf(path: string): string | null {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return null;
    }
}

/** One Save as the page sends it, over the file's text as it is now unless `digest` is given. */
async function save(
    into: PrimaryTarget,
    body: { scope: string; root?: string; changes: unknown[] },
    file: string,
    digest = textDigest(textOf(file))
): Promise<{ status: number; body: { refused?: { reason: string }[] } }> {
    const answer = await handleWrite(
        request({ kind: 'config-save', digest, ...body }),
        TOKEN,
        into
    );
    const sent = (await answer.json()) as { refused?: { reason: string }[] };
    return { status: answer.status, body: sent };
}

describe('the Save of a Settings scope, one write of its file and one record', () => {
    it.each([
        {
            row: 'two options of the workspace file',
            file: workspaceFileOf,
            scope: {
                scope: 'settings',
                changes: [
                    { file: 'behavior.yml', key: 'changes.keep', value: 300 },
                    { file: 'behavior.yml', key: 'literature.timeout_s', value: 9 }
                ]
            },
            holds: ['keep: 300  # how many', 'timeout_s: 9']
        },
        {
            row: "an option of the primary's settings file",
            file: (into: PrimaryTarget) => join(into.hub, HUB_FILE),
            scope: {
                scope: 'settings',
                changes: [{ file: 'behavior.yml', key: 'clusters.key_type', value: 'rsa' }]
            },
            holds: ['key_type: rsa']
        },
        {
            row: "the machine's port in the primary's local.yml",
            file: (into: PrimaryTarget) => join(into.hub, '.oculus', 'local.yml'),
            local: true,
            scope: { scope: 'local', changes: [{ file: 'local.yml', key: 'port', value: 8799 }] },
            holds: ['port: 8799']
        }
    ])('writes $row in one record, and the undo puts it back', async (one) => {
        const into = configTarget(undefined, HELD);
        const path = one.file(into);
        const before = textOf(path);
        const body = { ...one.scope, ...(one.local === true ? { root: into.primary } : {}) };
        expect((await save(into, body, path)).status).toBe(200);
        const after = textOf(path) ?? '';
        for (const line of one.holds) expect(after).toContain(line);
        const log = changesOf(into);
        expect(log.length).toBe(1);
        expect(log[0].kind).toBe('config-save');
        expect((await undone(into, log[0])).status).toBe(200);
        expect(textOf(path)).toBe(before);
    });

    it('refuses a save over a file changed since it was read, naming it, and writes nothing', async () => {
        const into = configTarget(undefined, HELD);
        const path = workspaceFileOf(into);
        const read = textDigest(textOf(path));
        writeFileSync(path, `${textOf(path) ?? ''}# a hand edit\n`);
        const held = textOf(path);
        const changes = [{ file: 'behavior.yml', key: 'changes.keep', value: 300 }];
        const answer = await save(into, { scope: 'settings', changes }, path, read);
        expect(answer.body.refused?.[0]?.reason).toContain(path);
        expect(textOf(path)).toBe(held);
        expect(changesOf(into)).toEqual([]);
    });

    it.each([
        { row: 'an existing local.yml at mode 644 keeps 644', held: 'port: 8790\n', mode: 0o644 },
        {
            row: 'a local.yml the save makes at mode 600, named in .gitignore',
            held: null,
            mode: 0o600
        }
    ])('writes $row', async (one) => {
        const into = configTarget(undefined, HELD);
        const path = join(into.hub, '.oculus', 'local.yml');
        if (one.held !== null) {
            writeFileSync(path, one.held);
            chmodSync(path, 0o644);
        }
        const changes = [{ file: 'local.yml', key: 'port', value: 8799 }];
        const answer = await save(into, { scope: 'local', root: into.primary, changes }, path);
        expect(answer.status).toBe(200);
        expect(statSync(path).mode & 0o777).toBe(one.mode);
        if (one.held === null) {
            expect(textOf(join(into.hub, '.oculus', '.gitignore'))).toContain('local.yml');
        }
    });

    it('puts the file back when a later change of the save is refused', async () => {
        const into = configTarget(undefined, HELD);
        const path = workspaceFileOf(into);
        const held = textOf(path);
        const changes = [
            { file: 'behavior.yml', key: 'changes.keep', value: 300 },
            { file: 'behavior.yml', key: 'changes.keep_not_an_option', value: 1 }
        ];
        const answer = await save(into, { scope: 'settings', changes }, path);
        expect(answer.body.refused?.length).toBe(1);
        expect(textOf(path)).toBe(held);
        expect(changesOf(into)).toEqual([]);
    });
});

describe('every byte of a scope file that a save does not change is kept', () => {
    it.each([
        {
            row: "a local.yml's port and the row of a flow list, the block row with its comment kept",
            scope: 'local',
            file: (into: PrimaryTarget) => join(into.hub, '.oculus', 'local.yml'),
            text: [
                '# this machine',
                'port: 8790  # the page',
                'downloads:',
                '    - service: ieee   # the library',
                '      user: me',
                '      secret: made-up-token-4711',
                '    - { service: acm, secret: made-up-token-0815 }',
                ''
            ],
            changes: [
                { file: 'local.yml', key: 'port', value: 8799 },
                {
                    file: 'local.yml',
                    key: 'downloads',
                    value: [
                        { service: 'ieee', user: 'me' },
                        { service: 'acm', user: 'them' }
                    ]
                }
            ],
            written: [
                '# this machine',
                'port: 8799  # the page',
                'downloads:',
                '    - service: ieee   # the library',
                '      user: me',
                '      secret: made-up-token-4711',
                '    - { service: acm, secret: made-up-token-0815, user: them }',
                ''
            ]
        },
        {
            row: "a repository's languages, a flow entry changed and a block one kept",
            scope: 'repo',
            file: (into: PrimaryTarget) => join(into.hub, '.oculus', 'settings.yml'),
            text: [
                '# this repository',
                'languages:',
                '    yaml: { tab_size: 4 }   # the hub indents by four',
                '    makefile:',
                '        insert_spaces: false # tabs',
                ''
            ],
            changes: [
                {
                    file: 'behavior.yml',
                    key: 'editor.languages',
                    value: {
                        yaml: { tab_size: 2 },
                        makefile: { insert_spaces: false },
                        markdown: { tab_size: 2 }
                    }
                }
            ],
            written: [
                '# this repository',
                'languages:',
                '    yaml: { tab_size: 2 }   # the hub indents by four',
                '    makefile:',
                '        insert_spaces: false # tabs',
                '    markdown:',
                '        tab_size: 2',
                ''
            ]
        }
    ])('writes $row, and the undo puts back the text it was', async (one) => {
        const into = configTarget(undefined, HELD);
        const path = one.file(into);
        const before = one.text.join('\n');
        writeFileSync(path, before);
        const root = one.scope === 'local' ? into.primary : 'hub';
        const answer = await save(into, { scope: one.scope, root, changes: one.changes }, path);
        expect([answer.status, textOf(path)]).toEqual([200, one.written.join('\n')]);
        expect((await undone(into, changesOf(into)[0])).status).toBe(200);
        expect(textOf(path)).toBe(before);
    });
});

describe("a folder's name and the primary set in the Workspace scope", () => {
    it.each([
        { row: 'a new name, which the primary follows', name: 'home', primary: 'home' },
        { row: 'an empty name', name: '', refused: 'hub' },
        { row: 'a name with a slash', name: 'a/b', refused: 'a/b' },
        { row: 'a name another folder holds', name: 'notes', refused: 'notes' }
    ])('renames the primary folder to $row', async (one) => {
        const into = configTarget();
        const path = workspaceFileOf(into);
        const listed = `folders:\n  - { name: hub, path: ${into.hub} }\n  - { name: notes, path: ${into.hub}/n }\nprimary: hub\n`;
        writeFileSync(path, listed);
        const changes = [{ folder: 'hub', name: one.name }];
        const answer = await save(into, { scope: 'settings', changes }, path);
        if (one.refused !== undefined) {
            expect(answer.body.refused?.[0]?.reason).toContain(one.refused);
            expect(textOf(path)).toBe(listed);
            return;
        }
        expect(textOf(path)).toContain(`name: ${one.name}`);
        expect(textOf(path)).toContain(`primary: ${one.primary}`);
        expect((await undone(into, changesOf(into)[0])).status).toBe(200);
        expect(textOf(path)).toContain('primary: hub');
    });
});
