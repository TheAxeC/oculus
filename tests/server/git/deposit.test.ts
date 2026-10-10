// What the deposit does to a mirror, and what it refuses to do.
//
// Every repository here is made under the system temporary directory with the real git: a hub, a
// mirrors folder, and a bare repository standing in for GitHub. `gh` is never run:
// server/git/deposit.ts takes it as an option, and the stub below answers the three shapes and does
// with the bare repository what the real one would do with GitHub. Nothing reaches the hub's own
// checkout, ~/.oculus, or the network.
// @module-tag slow: its cases run real git against a bare remote, so npm test leaves it out.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { adopt, commit, push, sync } from '../../../src/lib/server/git/deposit.ts';
import { type GhRun, type Outcome } from '../../../src/lib/server/git/deposit-git.ts';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import { TEXT } from '../text.ts';

/** The repositories the stub knows, by name. A name it does not know does not exist on GitHub. */
const known = new Map<string, string>();

let dir = '';
let hub = '';
let lab = '';
let mirrors = '';
let into: WriteTarget;

function git(root: string, ...args: string[]): string {
    return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' });
}

/** A file under a directory inside the throwaway tree, and nowhere else. */
function write(root: string, name: string, body: string): void {
    const full = join(root, name);
    expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
}

function codeOf(id: string): string {
    return join(hub, 'projects', 'manuscripts', id, 'code');
}

/** A manifest naming its repository by `repo`, by `url`, or by neither. */
function manifest(id: string, repo: string, url = ''): string {
    return [
        `id: ${id}`,
        'type: manuscript',
        `title: "The title of ${id}"`,
        'status:',
        '  line: "the line"',
        'code_availability:',
        `  status: ${url === '' ? 'none' : 'deposited'}`,
        `  url: "${url}"`,
        '  date: ""',
        ...(repo === '' ? [] : [`  repo: ${repo}`]),
        '  description: "One line about the repository."',
        '  topics: [tensors]',
        ''
    ].join('\n');
}

/** The three `gh` shapes, answered from the bare repositories under the throwaway tree. */
const gh: GhRun = (args) => {
    const action = args[1];
    const name = args[2];
    if (action === 'view') {
        const url = known.get(name);
        if (url === undefined) return answer(false, '', 'could not resolve to a Repository');
        return answer(true, JSON.stringify({ url, defaultBranchRef: { name: 'main' } }), '');
    }
    if (action === 'create') {
        const source = args[args.indexOf('--source') + 1];
        const bare = join(dir, 'remote', `${name}.git`);
        execFileSync('git', ['init', '--bare', '-b', 'main', bare]);
        git(source, 'remote', 'add', 'origin', bare);
        git(source, 'push', '-u', 'origin', 'HEAD:main');
        known.set(name, bare);
        return answer(true, '', '');
    }
    if (action === 'edit') return answer(true, '', '');
    return answer(false, '', `no gh shape named ${action}`);
};

function answer(ok: boolean, output: string, error: string): Promise<Outcome> {
    return Promise.resolve({ ok, output, error });
}

function options(): { mirrors: string; into: WriteTarget; gh: GhRun } {
    return { mirrors, into, gh };
}

test.beforeAll(() => {
    dir = scratchDir('oculus-deposit-test-');
    hub = join(dir, 'hub');
    lab = join(dir, 'lab');
    mirrors = join(dir, 'mirrors');
    mkdirSync(mirrors, { recursive: true });

    write(
        hub,
        join('projects', 'manuscripts', 'alpha', 'project.yml'),
        manifest('alpha', 'alpha-code')
    );
    write(codeOf('alpha'), 'README.md', '# alpha\n');
    write(codeOf('alpha'), 'run.py', 'print(1)\n');
    write(codeOf('alpha'), join('results', 'out.csv'), 'a,b\n');
    write(codeOf('alpha'), join('figures', 'one.png'), 'not really a png\n');
    write(codeOf('alpha'), join('attic', 'old.py'), 'print(0)\n');
    write(codeOf('alpha'), join('__pycache__', 'run.pyc'), 'bytes\n');
    write(codeOf('alpha'), '.depositignore', '# the hub keeps these\nresults/\nfigures/\nattic/\n');

    write(
        lab,
        join('projects', 'manuscripts', 'alpha', 'project.yml'),
        manifest('alpha', 'alpha-lab-code')
    );
    write(join(lab, 'projects', 'manuscripts', 'alpha', 'code'), 'README.md', '# alpha of lab\n');

    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    into = {
        hub,
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] },
        engine: engineDir(),
        career: careerRules(loadConfig(engineDir()).config),
        overrides: join(dir, 'sessions.json'),
        projects: () => [],
        sideProjects: () => [],
        bookmarks: join(dir, 'bookmarks.yml'),
        behaviorFile: join(dir, 'behavior.yml'),
        layoutFile: join(dir, 'layout.yml'),
        glyphs: []
    };
});

test.afterAll(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

describe('the plan', () => {
    it('finds a secret and refuses the commit while it stands', async () => {
        expect((await adopt('alpha', TEXT, options())).ok).toBe(true);
        write(codeOf('alpha'), '.env', 'TOKEN=shhh\n');
        const planned = await sync('alpha', TEXT, options());
        expect(planned.plan?.findings).toEqual([{ kind: 'secret', path: '.env', mb: 0 }]);
        const written = await commit('alpha', 'Add the first files', TEXT, options());
        expect(written.ok).toBe(false);
        expect(written.error).toContain('The scan found something');
        rmSync(join(codeOf('alpha'), '.env'));
    });
});

describe('a deposit of a project of the second hub', () => {
    it('writes code_availability into the manifest of the second hub and no byte of the first', async () => {
        const manifestOf = (root: string): string =>
            join(root, 'projects', 'manuscripts', 'alpha', 'project.yml');
        const published = 'https://github.com/someone/alpha-lab-code';
        let created = false;
        const sent: GhRun = (args) => {
            if (args[1] === 'create') created = true;
            if (args[1] !== 'view') return answer(true, '', '');
            return created
                ? answer(true, JSON.stringify({ url: published, defaultBranchRef: null }), '')
                : answer(false, '', 'could not resolve to a Repository');
        };
        const hubs = [{ key: 'lab', hub: lab, config: into.config }];
        const both = { mirrors, into: { ...into, hubs }, gh: sent };
        const firstBefore = readFileSync(manifestOf(hub), 'utf8');
        expect((await adopt('lab:alpha', TEXT, both)).ok).toBe(true);
        const pushed = await push('lab:alpha', TEXT, both);
        expect(pushed.ok).toBe(true);
        const block = (
            parse(readFileSync(manifestOf(lab), 'utf8')) as {
                code_availability: { status: string; url: string };
            }
        ).code_availability;
        expect(block.status).toBe('deposited');
        expect(block.url).toBe(published);
        expect(readFileSync(manifestOf(hub), 'utf8')).toBe(firstBefore);
    });
});
