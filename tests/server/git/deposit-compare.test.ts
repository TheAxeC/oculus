// Layer 4, server test. What the Deposit view shows of a mirror beside the plan: the two texts of a
// changed file of the sync plan, Fetch, how far the mirror's branch is ahead of and behind
// `origin/main` with the files that differ and the two texts of each, and the projects that have a
// deposit (a hub project of either placement, a workspace folder project of either placement).
//
// Every repository is made under the system temporary directory with the real git: a hub, a mirrors
// folder, a bare repository standing in for GitHub and a second clone that pushes to it. `gh` is
// never run; the stub answers `view` with failure so a mirror is made from the manifest's url or
// empty.
// @module-tag slow: its cases run real git against a bare remote, so npm test leaves it out.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    adopt,
    commit,
    fetchMirror,
    fileTexts,
    mirrorOf,
    projectIds,
    state,
    sync
} from '../../../src/lib/server/git/deposit/deposit.ts';
import type { Plan } from '../../../src/lib/server/git/deposit/deposit.ts';
import type { GhRun } from '../../../src/lib/server/git/deposit/deposit-git.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { depositTarget, gitIn, writeInside } from '../../fixtures/hubs/deposit-world.ts';
import { TEXT } from '../text.ts';

let dir = '';
let hub = '';
let mirrors = '';
let bare = '';
let other = '';
let folderTop = '';
let folderNested = '';
let into: WriteTarget;
const plans = new Map<string, Plan>();

/** A file under a directory inside the throwaway tree, and nowhere else. */
function write(root: string, name: string, body: string): void {
    writeInside(dir, root, name, body);
}

function manifest(id: string, url = ''): string {
    return [
        `id: ${id}`,
        'tier: projects',
        'type: active',
        `title: "The title of ${id}"`,
        'status:',
        '  line: "the line"',
        'code_availability:',
        `  url: "${url}"`,
        ''
    ].join('\n');
}

const gh: GhRun = () =>
    Promise.resolve({ ok: false, output: '', error: 'could not resolve to a Repository' });

function options(): { mirrors: string; into: WriteTarget; gh: GhRun; plans: Map<string, Plan> } {
    return { mirrors, into, gh, plans };
}

const codeOf = (): string => join(hub, 'projects', 'alpha', 'code');

test.beforeAll(() => {
    dir = scratchDir('oculus-deposit-compare-');
    hub = join(dir, 'hub');
    mirrors = join(dir, 'mirrors');
    bare = join(dir, 'remote', 'alpha.git');
    other = join(dir, 'other');
    folderTop = join(dir, 'folders', 'top');
    folderNested = join(dir, 'folders', 'nested');
    mkdirSync(mirrors, { recursive: true });

    execFileSync('git', ['init', '--bare', '-b', 'main', bare]);
    execFileSync('git', ['init', '-b', 'main', other]);
    write(other, 'README.md', '# alpha\n');
    write(other, 'a.py', 'print(1)\n');
    gitIn(other, 'add', '-A');
    gitIn(other, 'commit', '-m', 'First');
    gitIn(other, 'remote', 'add', 'origin', bare);
    gitIn(other, 'push', '-u', 'origin', 'main');

    write(hub, join('projects', 'alpha', 'project.yml'), manifest('alpha', bare));
    write(codeOf(), 'README.md', '# alpha\n');
    write(codeOf(), 'a.py', 'print(1)\n');
    write(hub, join('projects', 'beta', '.oculus', 'project.yml'), manifest('beta'));
    write(hub, join('projects', 'beta', 'code', 'README.md'), '# beta\n');
    write(folderTop, 'project.yml', manifest('top'));
    write(folderTop, join('code', 'README.md'), '# top\n');
    write(folderTop, join('code', 'top.py'), 'print("top")\n');
    write(folderNested, join('.oculus', 'project.yml'), manifest('nested'));
    write(folderNested, join('code', 'README.md'), '# nested\n');
    write(folderNested, join('code', 'nested.py'), 'print("nested")\n');
    write(folderNested, join('.oculus', 'code', 'wrong.py'), 'print("wrong")\n');

    into = depositTarget(dir, hub, {
        scan: [{ dir: 'projects' }],
        repositories: [
            { key: 'top', dir: folderTop },
            { key: 'nested', dir: folderNested }
        ]
    });
});

test.afterAll(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

describe('the diff of a changed file of the sync plan', () => {
    it('carries the mirror HEAD text and the synced text, and refuses a path the plan does not list', async () => {
        expect((await adopt('alpha', TEXT, options())).ok).toBe(true);
        write(codeOf(), 'a.py', 'print(2)\n');
        const planned = await sync('alpha', TEXT, options());
        // The first sync also writes the mirror's own .gitignore.
        expect(planned.plan?.changes.map((one) => one.path).sort()).toEqual(['.gitignore', 'a.py']);
        const texts = await fileTexts('alpha', 'plan', 'a.py', TEXT, options());
        expect(texts.texts).toEqual({ original: 'print(1)\n', modified: 'print(2)\n' });
        const unlisted = await fileTexts('alpha', 'plan', 'README.md', TEXT, options());
        expect(unlisted.ok).toBe(false);
        const outside = await fileTexts(
            'alpha',
            'plan',
            '../../../hub/projects/alpha/project.yml',
            TEXT,
            options()
        );
        expect(outside.ok).toBe(false);
        const unknown = await fileTexts('alpha', 'elsewhere', 'a.py', TEXT, options());
        expect(unknown.ok).toBe(false);
    });
});

describe('the comparison with origin/main', () => {
    it('counts a commit of the remote as behind after Fetch and leaves the checkout and branch alone', async () => {
        const mirror = mirrorOf('alpha', options());
        write(other, 'b.py', 'print("b")\n');
        gitIn(other, 'add', '-A');
        gitIn(other, 'commit', '-m', 'Second');
        gitIn(other, 'push', 'origin', 'main');

        const before = {
            head: gitIn(mirror, 'rev-parse', 'HEAD'),
            branch: gitIn(mirror, 'rev-parse', '--abbrev-ref', 'HEAD'),
            status: gitIn(mirror, 'status', '--porcelain=v1')
        };
        expect((await state('alpha', options()))?.main).toMatchObject({ behind: 0, ahead: 0 });
        const fetched = await fetchMirror('alpha', TEXT, options());
        expect(fetched.ok).toBe(true);
        expect((await state('alpha', options()))?.main).toEqual({
            known: true,
            ahead: 0,
            behind: 1,
            differ: ['b.py']
        });
        expect({
            head: gitIn(mirror, 'rev-parse', 'HEAD'),
            branch: gitIn(mirror, 'rev-parse', '--abbrev-ref', 'HEAD'),
            status: gitIn(mirror, 'status', '--porcelain=v1')
        }).toEqual(before);
    });

    it('counts a local commit as ahead beside the remote one, lists each differing file and gives both texts of each', async () => {
        const committed = await commit('alpha', 'Change a.py', TEXT, options());
        expect(committed.ok).toBe(true);
        expect((await state('alpha', options()))?.ahead).toBe(1);
        expect((await state('alpha', options()))?.main).toEqual({
            known: true,
            ahead: 1,
            behind: 1,
            differ: ['.gitignore', 'a.py', 'b.py']
        });
        expect((await fileTexts('alpha', 'main', 'a.py', TEXT, options())).texts).toEqual({
            original: 'print(1)\n',
            modified: 'print(2)\n'
        });
        expect((await fileTexts('alpha', 'main', 'b.py', TEXT, options())).texts).toEqual({
            original: 'print("b")\n',
            modified: ''
        });
        expect((await fileTexts('alpha', 'main', 'README.md', TEXT, options())).ok).toBe(false);
    });

    it('says nothing is known for a mirror that has not been made', async () => {
        expect((await state('beta', options()))?.ahead).toBe(0);
        expect((await state('beta', options()))?.main).toEqual({
            known: false,
            ahead: 0,
            behind: 0,
            differ: []
        });
    });

    it('refuses to fetch a mirror with no remote', async () => {
        expect((await adopt('beta', TEXT, options())).ok).toBe(true);
        const fetched = await fetchMirror('beta', TEXT, options());
        expect(fetched.ok).toBe(false);
        expect(fetched.error).toBe(TEXT['server.deposit.no_remote']);
    });
});

describe('the projects that have a deposit', () => {
    it('names a project of a scan folder in either placement and a workspace folder project in either', () => {
        expect(projectIds(options()).sort()).toEqual(['alpha', 'beta', 'nested', 'top']);
    });

    it('syncs the code folder of the project folder, never the one under .oculus', async () => {
        for (const [id, file] of [
            ['top', 'top.py'],
            ['nested', 'nested.py'],
            ['beta', 'README.md']
        ] as const) {
            expect((await adopt(id, TEXT, options())).ok).toBe(true);
            const planned = await sync(id, TEXT, options());
            expect(planned.plan?.files).toContain(file);
            expect(planned.plan?.files).not.toContain('wrong.py');
            expect(planned.ok).toBe(true);
        }
        expect(readFileSync(join(mirrorOf('nested', options()), 'nested.py'), 'utf8')).toBe(
            'print("nested")\n'
        );
    });
});
