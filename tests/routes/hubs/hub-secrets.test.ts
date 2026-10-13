// Layer 2, route tests. The `secrets` folder of every hub of the open workspace (a folder holding
// `.oculus/config.yml`) is withheld through every caller of `privateFolders` (G3): the page's
// `isPrivateFile`, the language server relay's, the library rules, the folder Fix All plan, the
// write of `lsp-edit` and `writing-fix`, and the names search.
//
// The hubs `hub` and `lab` are two scratch folders under the system temporary directory, each
// holding a file inside `secrets/` and one outside it, and the roots are those the open workspace
// of a scratch state folder lists. The cases of another letter case (`SECRETS`, `Secrets`) run only
// where the system temporary directory's file system folds letter case, the macOS default, since on
// another file system `SECRETS` is a folder of its own name. The roots are given to each caller as
// that caller takes them; the library rules are given what the server's wiring gives them, the hubs
// among the roots of the open workspace.

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { hubDirs } from '../../../src/lib/data/helpers/files/private-folders.ts';
import { configDir, engineDir } from '../../../src/lib/data/sources/config.ts';
import { readAs } from '../../../src/lib/data/shapes/shapes.ts';
import { workspacesAnswer } from '../../../src/lib/server/files/fs.ts';
import { openWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import { workspacesShape } from '../../../src/lib/state/sources/fs-transport.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { foldsCase, under } from '../../../src/lib/server/core/paths.ts';
import type { Root } from '../../../src/lib/server/files/workspace/folders.ts';
import { handleSearch } from '../../../src/lib/server/files/search/search-routes.ts';
import { withheldFolders } from '../../../src/lib/server/machine/lsp/library/rules.ts';
import { isPrivateFile as isPrivateForServer } from '../../../src/lib/server/machine/lsp/adapters/yaml/private-file.ts';
import { isPrivateFile as isPrivateForPage } from '../../../src/lib/state/system/config/config-files.ts';
import { it, plantScratch } from '../../fixtures/scratch.ts';
import { plantHub, plantState } from '../../fixtures/hubs/workspace.ts';
import {
    replaceWorld,
    lspEdit,
    lspEditPost,
    lspFile,
    writingFixPost
} from '../replace/replace-fixture.ts';
import { plant, route, settingsOf } from '../../server/machine/runs/lint/lint-fixture.ts';

const TOKEN = mintToken();
const NO_MACHINE = { set: [], defaults: {}, values: {}, hubs: {} };
const HOST = '127.0.0.1:8791';
const TEXT = 'foo\n';

/** The mark the writing rules fix, so a file holding it is one the plan lists. */
const ELLIPSIS = '\u2026';

/** Whether the scratch folders' file system reads a path in another letter case as the same. */
const FOLDS = foldsCase(tmpdir());

/**
 * Two hubs, each with a file inside `secrets/` and one outside it, the state folder of an unsaved
 * workspace listing them, and the roots that workspace serves.
 */
function hubs(): { base: string; hub: string; lab: string; roots: Root[]; state: string } {
    const base = realpathSync(
        plantScratch('oculus-hub-secrets-', {
            'hub/open.yml': TEXT,
            'hub/secrets/s.yml': TEXT,
            'lab/open.yml': TEXT,
            'lab/secrets/s.yml': TEXT,
            'lab/secrets/deep/d.yml': TEXT
        })
    );
    const hub = plantHub(join(base, 'hub'));
    const lab = plantHub(join(base, 'lab'));
    const state = plantState([
        { name: 'hub', dir: hub },
        { name: 'lab', dir: lab }
    ]);
    return { base, hub, lab, roots: openWorkspace(state).roots, state };
}

describe('the secrets folder of a hub', () => {
    it('is private to the page for a file in it and for no other file of the hub', () => {
        const { roots } = hubs();
        const home = '/home/me';
        expect(isPrivateForPage({ root: 'lab', path: 'secrets/s.yml' }, roots, home)).toBe(true);
        expect(isPrivateForPage({ root: 'lab', path: 'secrets/deep/d.yml' }, roots, home)).toBe(
            true
        );
        expect(isPrivateForPage({ root: 'hub', path: 'secrets/s.yml' }, roots, home)).toBe(true);
        expect(isPrivateForPage({ root: 'lab', path: 'open.yml' }, roots, home)).toBe(false);
    });

    it('is no private folder in a folder that holds .oculus/config/ and no .oculus/config.yml', () => {
        const base = realpathSync(
            plantScratch('oculus-hub-secrets-plain-', {
                'plain/.oculus/config/sources.yml': 'scan: []\n',
                'plain/secrets/s.yml': TEXT
            })
        );
        const state = plantState([{ name: 'plain', dir: join(base, 'plain') }]);
        const { roots } = openWorkspace(state);
        expect(roots.map((one) => one.hub === true)).toEqual([false]);
        expect(isPrivateForPage({ root: 'plain', path: 'secrets/s.yml' }, roots, '/home/me')).toBe(
            false
        );
    });

    it('is learned by the page from the workspaces answer, which marks the hubs', () => {
        const { state } = hubs();
        const answer = workspacesAnswer(openWorkspace(state), engineDir(), NO_MACHINE);
        const read = readAs(workspacesShape, JSON.parse(JSON.stringify(answer)));
        const held = read?.folders ?? [];
        expect(held.map((one) => [one.key, one.hub])).toEqual([
            ['hub', true],
            ['lab', true]
        ]);
        expect(isPrivateForPage({ root: 'lab', path: 'secrets/s.yml' }, held, '/home/me')).toBe(
            true
        );
    });

    it('is private to the language server relay', () => {
        const { hub, lab, roots } = hubs();
        const served = roots.map((one) => ({ ...one, real: one.dir, hub: one.hub }));
        expect(isPrivateForServer(join(lab, 'secrets', 's.yml'), served)).toBe(true);
        expect(isPrivateForServer(join(lab, 'secrets', 'deep', 'd.yml'), served)).toBe(true);
        expect(isPrivateForServer(join(hub, 'secrets', 's.yml'), served)).toBe(true);
        expect(isPrivateForServer(join(lab, 'open.yml'), served)).toBe(false);
    });

    it.skipIf(!FOLDS)(
        'is private to the relay in another letter case the file system folds',
        () => {
            const { lab, roots } = hubs();
            const served = roots.map((one) => ({ ...one, real: one.dir, hub: one.hub }));
            expect(existsSync(join(lab, 'SECRETS', 's.yml'))).toBe(true);
            expect(isPrivateForServer(join(lab, 'SECRETS', 's.yml'), served)).toBe(true);
            expect(isPrivateForServer(join(lab, 'Secrets', 'deep', 'd.yml'), served)).toBe(true);
        }
    );

    it('is withheld from the library rules the server builds from the roots of the workspace', () => {
        const { hub, lab, roots } = hubs();
        const withheld = withheldFolders(configDir(engineDir()), hubDirs(roots));
        expect(withheld).toContain(`${hub}/secrets`);
        expect(withheld).toContain(`${lab}/secrets`);
        expect(withheld).toContain(configDir(engineDir()));
        expect(under(join(lab, 'secrets', 'deep', 'd.yml'), withheld)).toBe(true);
        expect(under(join(lab, 'open.yml'), withheld)).toBe(false);
        expect(withheld).toContain(`${homedir()}/.oculus`);
    });

    it('is refused as a start folder of the folder Fix All plan', async () => {
        const { roots, lab } = hubs();
        plant(join(lab, 'secrets', 'note.md'), `x${ELLIPSIS}\n`);
        plant(join(lab, 'open.md'), `x${ELLIPSIS}\n`);
        const lint = route(
            () => roots,
            () => settingsOf()
        );
        for (const path of ['secrets', 'secrets/deep']) {
            const answer = await lint.post({ action: 'folder', root: 'lab', path });
            expect({ path, body: answer.body }).toEqual({
                path,
                body: { ok: false, reason: 'The writing rules do not read a private folder' }
            });
        }
        const open = await lint.post({ action: 'folder', root: 'lab', path: '' });
        const listed = (open.body as { files?: { path: string }[] }).files ?? [];
        expect(listed.map((one) => one.path)).toEqual(['open.md']);
    });

    it('is refused as outside by an lsp-edit and a writing-fix, which write nothing', async () => {
        const w = replaceWorld({ 'plain.yml': TEXT });
        const { lab, roots } = hubs();
        const world = { ...w, ops: { ...w.ops, roots: [...w.ops.roots, roots[1]] } };
        const edits = [lspEdit([0, 0], [0, 3], 'bar')];
        const files = [
            lspFile('plain.yml', TEXT, edits),
            lspFile('secrets/s.yml', TEXT, edits, 'lab')
        ];
        for (const post of [lspEditPost, writingFixPost]) {
            expect(await post(world, files), post.name).toEqual({
                status: 400,
                body: { ok: false, error: 'outside', done: [], failed: 'lab/secrets/s.yml' }
            });
        }
        const bytes = (path: string): string => readFileSync(path, 'utf8');
        expect(bytes(join(lab, 'secrets', 's.yml'))).toBe(TEXT);
        expect(bytes(join(w.hub, 'plain.yml'))).toBe(TEXT);
    });

    it.skipIf(!FOLDS)(
        'is withheld in any letter case from the names a search lists and from the page (G3)',
        async () => {
            const base = realpathSync(
                plantScratch('oculus-hub-secrets-case-', {
                    'hub/open.yml': TEXT,
                    'hub/SECRETS/h.yml': TEXT,
                    'lab/open.yml': TEXT,
                    'lab/Secrets/x.yml': TEXT,
                    'lab/Secrets/deep/d.yml': TEXT
                })
            );
            const hub = plantHub(join(base, 'hub'));
            const lab = plantHub(join(base, 'lab'));
            expect(existsSync(join(lab, 'secrets', 'x.yml'))).toBe(true);
            const state = plantState([
                { name: 'hub', dir: hub },
                { name: 'lab', dir: lab }
            ]);
            const roots = openWorkspace(state).roots;
            const listed = async (root: string): Promise<string[]> => {
                const response = await handleSearch(
                    new Request(`http://${HOST}/api/search?list=names&root=${root}`, {
                        headers: {
                            host: HOST,
                            origin: `http://${HOST}`,
                            'sec-fetch-site': 'same-origin',
                            'x-oculus-token': TOKEN
                        }
                    }),
                    TOKEN,
                    { roots, cap: 500, maxNames: 100, timeout: 10000, now: () => 0 }
                );
                expect(response.status).toBe(200);
                const answer = (await response.json()) as { roots: { paths: string[] }[] };
                return answer.roots.flatMap((one) => one.paths).sort();
            };
            expect(await listed('lab')).toEqual(['.oculus/config.yml', 'open.yml']);
            expect(await listed('hub')).toEqual(['.oculus/config.yml', 'open.yml']);

            const answer = workspacesAnswer(openWorkspace(state), engineDir(), NO_MACHINE);
            const held = readAs(workspacesShape, JSON.parse(JSON.stringify(answer)))?.folders;
            expect(held?.map((one) => one.folds)).toEqual([true, true]);
            expect(
                isPrivateForPage({ root: 'lab', path: 'Secrets/x.yml' }, held ?? [], '/home/me')
            ).toBe(true);
            expect(
                isPrivateForPage(
                    { root: 'lab', path: 'secrets/deep/d.yml' },
                    held ?? [],
                    '/home/me'
                )
            ).toBe(true);
            expect(
                isPrivateForPage({ root: 'hub', path: 'secrets/h.yml' }, held ?? [], '/home/me')
            ).toBe(true);
            expect(
                isPrivateForPage({ root: 'lab', path: 'open.yml' }, held ?? [], '/home/me')
            ).toBe(false);
        }
    );

    it('is left out of the names a search lists for the hub root', async () => {
        const { roots } = hubs();
        const ran: string[][] = [];
        const response = await handleSearch(
            new Request(`http://${HOST}/api/search?list=names&root=lab`, {
                headers: {
                    host: HOST,
                    origin: `http://${HOST}`,
                    'sec-fetch-site': 'same-origin',
                    'x-oculus-token': TOKEN
                }
            }),
            TOKEN,
            {
                roots,
                cap: 500,
                maxNames: 100,
                timeout: 10000,
                now: () => 0,
                run: (_dir, args) => {
                    ran.push(args);
                    return Promise.resolve({
                        code: 0,
                        stderr: '',
                        timedOut: false,
                        stopped: false
                    });
                }
            }
        );
        expect(response.status).toBe(200);
        expect(ran).toHaveLength(1);
        expect(ran[0]).toContain('!/secrets');
    });
});
