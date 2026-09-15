// What the deposit does to a mirror, and what it refuses to do.
//
// Every repository here is made under the system temporary directory with the real git: a hub with
// two projects, a mirrors folder, and a bare repository standing in for GitHub. `gh` is never run:
// server/deposit.ts takes it as an option, and the stub below answers the three shapes and does with
// the bare repository what the real one would do with GitHub. Nothing reaches the hub's own
// checkout, ~/.oculus, or the network.
//
// The last describe is the module's gate, the mirror image of the one over git-write.ts: every
// argument vector the suite ran is either `-C <path under tmpdir> <enumerated subcommand>` or one of
// the three `gh` shapes, and the force option appears exactly once in the source of deposit-git.ts.

import { execFileSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
    adopt,
    branches,
    commit,
    createBranch,
    mirrorOf,
    projectIds,
    push,
    snapshot,
    state,
    switchBranch,
    sync
} from '../../src/lib/server/deposit.ts';
import {
    SUBCOMMANDS,
    lsFiles,
    type GhRun,
    type GitRunner,
    type Outcome
} from '../../src/lib/server/deposit-git.ts';
import { portfolioConfigFrom } from '../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import type { WriteTarget } from '../../src/lib/server/writes.ts';

const MODULE = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'src',
    'lib',
    'server',
    'deposit-git.ts'
);

/** Every argument vector the suite ran, git's through the recorder and `gh`'s through the stub. */
const ran = vi.hoisted(() => [] as string[][]);
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('node:child_process')>();
    // Only what a module under src/lib/server runs is recorded; a test's own setup command is not.
    const fromServer = (): boolean => (new Error().stack ?? '').includes('/src/lib/server/');
    return {
        ...actual,
        spawnSync: ((file: string, args: string[], options: unknown) => {
            if (fromServer()) ran.push(file === 'git' ? args : [file, ...args]);
            return (actual.spawnSync as (...held: unknown[]) => unknown)(file, args, options);
        }) as typeof actual.spawnSync,
        execFile: ((file: string, args: string[], ...rest: unknown[]) => {
            if (fromServer()) ran.push(file === 'git' ? args : [file, ...args]);
            return (actual.execFile as (...held: unknown[]) => unknown)(file, args, ...rest);
        }) as typeof actual.execFile
    };
});

/** The `gh repo edit` vectors, so a case can read what the About was set to. */
const edits: string[][] = [];

/** The repositories the stub knows, by name. A name it does not know does not exist on GitHub. */
const known = new Map<string, string>();

/** The default branch the stub reports per repository; `main` for one it was told nothing about. */
const defaults = new Map<string, string>();

let dir = '';
let hub = '';
let mirrors = '';
let outside = '';
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

function manifestOf(id: string): string {
    return join(hub, 'projects', 'manuscripts', id, 'project.yml');
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
    ran.push(['gh', ...args]);
    const action = args[1];
    const name = args[2];
    if (action === 'view') {
        const url = known.get(name);
        if (url === undefined) return answer(false, '', 'could not resolve to a Repository');
        const branch = defaults.get(name) ?? 'main';
        return answer(true, JSON.stringify({ url, defaultBranchRef: { name: branch } }), '');
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
    if (action === 'edit') {
        edits.push(args);
        return answer(true, '', '');
    }
    return answer(false, '', `no gh shape named ${action}`);
};

function answer(ok: boolean, output: string, error: string): Promise<Outcome> {
    return Promise.resolve({ ok, output, error });
}

function options(): { mirrors: string; into: WriteTarget; gh: GhRun } {
    return { mirrors, into, gh };
}

/** The commits on the bare repository's `main`, newest first. */
function remoteCommits(repo: string): string[] {
    const bare = known.get(repo) ?? '';
    return git(bare, 'log', '--format=%s', 'main')
        .split('\n')
        .filter((one) => one !== '');
}

beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'oculus-deposit-test-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    hub = join(dir, 'hub');
    mirrors = join(dir, 'mirrors');
    outside = join(dir, 'outside');
    mkdirSync(mirrors, { recursive: true });
    mkdirSync(outside, { recursive: true });

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
        hub,
        join('projects', 'manuscripts', 'beta', 'project.yml'),
        manifest('beta', 'beta-code')
    );
    write(codeOf('beta'), 'README.md', '# beta\n');

    // The bare repository beta-code already has a history, which is the project that is also a
    // public repository: `adopt` clones it rather than starting an empty mirror.
    const bare = join(dir, 'remote', 'beta-code.git');
    execFileSync('git', ['init', '--bare', '-b', 'main', bare]);
    const seed = join(dir, 'seed');
    mkdirSync(seed, { recursive: true });
    execFileSync('git', ['init', '-q', '-b', 'main', seed]);
    write(seed, 'README.md', '# beta, as GitHub has it\n');
    git(seed, 'add', '-A');
    git(seed, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'The first commit');
    git(seed, 'push', '-q', bare, 'main');
    known.set('beta-code', bare);

    // gamma names its repository the way the hub's deposited manuscripts do: by the url of a deposit
    // already made, with no `repo` key. The stub does not know the name, so only the url can find it.
    const history = join(dir, 'remote', 'gamma-history.git');
    execFileSync('git', ['init', '--bare', '-b', 'main', history]);
    git(seed, 'push', '-q', history, 'main');
    write(
        hub,
        join('projects', 'manuscripts', 'gamma', 'project.yml'),
        manifest('gamma', '', history)
    );
    write(codeOf('gamma'), 'README.md', '# gamma\n');

    const real = portfolioConfigFrom(loadConfig(engineDir()).config);
    into = {
        hub,
        config: { ...real, scan: [{ dir: 'projects/manuscripts', type: 'manuscript' }] },
        overrides: join(dir, 'sessions.json'),
        projects: () => []
    };
});

afterAll(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
});

describe('the mirror', () => {
    it('knows the projects and puts each mirror under the mirrors folder', () => {
        expect(projectIds(options()).sort()).toEqual(['alpha', 'beta', 'gamma']);
        expect(mirrorOf('alpha', options())).toBe(join(mirrors, 'alpha-code'));
        // Named by its url alone: the mirror takes the repository's own name, not the project id.
        expect(mirrorOf('gamma', options())).toBe(join(mirrors, 'gamma-history'));
        expect(mirrorOf('nothing', options())).toBe('');
    });

    it('clones the url a manifest names without asking gh for the name', async () => {
        const before = ran.filter((args) => args[0] === 'gh').length;
        const made = await adopt('gamma', options());
        expect(made.ok).toBe(true);
        expect(ran.filter((args) => args[0] === 'gh').length).toBe(before);
        const log = git(join(mirrors, 'gamma-history'), 'log', '--format=%s');
        expect(log).toContain('The first commit');
    });

    it('makes an empty mirror on main for a name gh does not know', async () => {
        const made = await adopt('alpha', options());
        expect(made.ok).toBe(true);
        expect(existsSync(join(mirrors, 'alpha-code', '.git'))).toBe(true);
        const now = await state('alpha', options());
        expect(now?.branch).toBe('main');
        expect(now?.remote).toBe('');
        expect(now?.exists).toBe(true);
    });

    it('clones the repository for a name gh knows, and keeps its commits', async () => {
        const made = await adopt('beta', options());
        expect(made.ok).toBe(true);
        const log = git(join(mirrors, 'beta-code'), 'log', '--format=%s');
        expect(log).toContain('The first commit');
    });
});

describe('the plan', () => {
    it('ships the code and not results, figures, attic or __pycache__', async () => {
        const planned = await sync('alpha', options());
        expect(planned.ok).toBe(true);
        expect(planned.plan?.files).toEqual(['.gitignore', 'README.md', 'run.py']);
        expect(planned.plan?.findings).toEqual([]);
        expect(planned.plan?.remote).toBe('');
        expect(readFileSync(join(mirrors, 'alpha-code', '.gitignore'), 'utf8')).toContain(
            'results/'
        );
        // The mirror holds what ships and nothing else, so a project's results/ and figures/ are
        // not kept a second time under the mirrors folder.
        expect(existsSync(join(mirrors, 'alpha-code', 'results'))).toBe(false);
        expect(existsSync(join(mirrors, 'alpha-code', 'attic'))).toBe(false);
    });

    it('finds a secret and refuses the commit while it stands', async () => {
        write(codeOf('alpha'), '.env', 'TOKEN=shhh\n');
        const planned = await sync('alpha', options());
        expect(planned.plan?.findings).toEqual([{ kind: 'secret', path: '.env', mb: 0 }]);
        const written = await commit('alpha', 'Add the first files', options());
        expect(written.ok).toBe(false);
        expect(written.error).toContain('the scan found something');
        rmSync(join(codeOf('alpha'), '.env'));
    });

    it('refuses a commit with no message, and commits one with a message', async () => {
        const empty = await commit('alpha', '   ', options());
        expect(empty.ok).toBe(false);
        expect(empty.error).toContain('a commit needs a message');
        const written = await commit('alpha', 'Add the first files', options());
        expect(written.ok).toBe(true);
        expect(git(join(mirrors, 'alpha-code'), 'log', '--format=%s')).toContain(
            'Add the first files'
        );
    });
});

describe('the push', () => {
    it('creates the repository and writes the manifest, leaving every other byte alone', async () => {
        const before = readFileSync(manifestOf('alpha'), 'utf8');
        const sent = await push('alpha', options());
        expect(sent.ok).toBe(true);
        const after = readFileSync(manifestOf('alpha'), 'utf8');
        expect(after).toContain('status: deposited');
        expect(after).toContain(known.get('alpha-code') ?? 'no url');
        expect(after).toMatch(/date: "\d{4}-\d\d-\d\d"/);
        const untouched = (text: string): string[] =>
            text.split('\n').filter((line) => !/^\s+(status|url|date):/.test(line));
        expect(untouched(after)).toEqual(untouched(before));
        expect(edits.at(-1)?.slice(0, 2)).toEqual(['repo', 'edit']);
        expect(edits.at(-1)).toContain('--add-topic');
    });

    it('makes a second commit on the remote for a second deposit', async () => {
        write(codeOf('alpha'), 'run.py', 'print(2)\n');
        const planned = await sync('alpha', options());
        expect(planned.plan?.changes).toEqual([{ letters: 'M ', path: 'run.py' }]);
        const written = await commit('alpha', 'Change the run', options());
        expect(written.ok).toBe(true);
        const sent = await push('alpha', options());
        expect(sent.ok).toBe(true);
        expect(remoteCommits('alpha-code')).toEqual(['Change the run', 'Add the first files']);
    });
});

describe('the snapshot', () => {
    it('leaves one commit on the remote', async () => {
        const taken = await snapshot('alpha', 'Code deposit', options());
        expect(taken.ok).toBe(true);
        expect(remoteCommits('alpha-code')).toEqual(['Code deposit']);
        expect(git(join(mirrors, 'alpha-code'), 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe(
            'main'
        );
    });

    it('moves the repository default to main when the snapshot replaced it', async () => {
        defaults.set('alpha-code', 'master');
        try {
            const taken = await snapshot('alpha', 'Code deposit, again', options());
            expect(taken.ok).toBe(true);
            expect(remoteCommits('alpha-code')).toEqual(['Code deposit, again']);
            expect(edits.at(-1)?.slice(0, 2)).toEqual(['repo', 'edit']);
            expect(edits.at(-1)?.slice(-2)).toEqual(['--default-branch', 'main']);
        } finally {
            defaults.delete('alpha-code');
        }
    });

    it('leaves the default alone when it is already main', async () => {
        const before = edits.length;
        const taken = await snapshot('alpha', 'Code deposit, once more', options());
        expect(taken.ok).toBe(true);
        expect(edits.length).toBe(before);
    });
});

describe('what one gh answer makes the deposit do', () => {
    it('writes the url the view answered with, not the remote it pushed to', async () => {
        const calls: string[][] = [];
        const url = 'https://github.com/someone/beta-code';
        const played: GhRun = (args) => {
            ran.push(['gh', ...args]);
            calls.push([...args]);
            if (args[1] === 'view') {
                return answer(
                    true,
                    JSON.stringify({ url, defaultBranchRef: { name: 'main' } }),
                    ''
                );
            }
            if (args[1] === 'edit') {
                edits.push(args);
                return answer(true, '', '');
            }
            return answer(false, '', `no gh shape named ${args[1]}`);
        };

        const sent = await push('beta', { mirrors, into, gh: played });
        expect(sent.ok).toBe(true);
        // The mirror was cloned, so it has a remote: `gh repo create` is not one of the shapes here.
        expect(calls.map((one) => one[1])).toEqual(['view', 'edit']);
        expect(sent.output).toBe(url);
        expect(readFileSync(manifestOf('beta'), 'utf8')).toContain(url);
        // The About came off the manifest and went out on the edit vector.
        expect(calls[1]).toContain('--description');
        expect(calls[1]).toContain('One line about the repository.');
        expect(calls[1]).toContain('tensors');
    });

    it('creates the repository for a mirror with no remote, on the answers played back to it', async () => {
        write(
            hub,
            join('projects', 'manuscripts', 'delta', 'project.yml'),
            manifest('delta', 'delta-code')
        );
        write(codeOf('delta'), 'README.md', '# delta\n');
        const calls: string[][] = [];
        const url = 'https://github.com/someone/delta-code';
        let made = false;
        const played: GhRun = (args) => {
            ran.push(['gh', ...args]);
            calls.push([...args]);
            if (args[1] === 'view') {
                return made
                    ? answer(true, JSON.stringify({ url, defaultBranchRef: { name: 'main' } }), '')
                    : answer(false, '', 'could not resolve to a Repository');
            }
            if (args[1] === 'create') {
                made = true;
                return answer(true, '', '');
            }
            if (args[1] === 'edit') {
                edits.push(args);
                return answer(true, '', '');
            }
            return answer(false, '', `no gh shape named ${args[1]}`);
        };

        const held = { mirrors, into, gh: played };
        expect((await adopt('delta', held)).ok).toBe(true);
        expect((await commit('delta', 'Add the first files', held)).ok).toBe(true);
        const sent = await push('delta', held);
        expect(sent.ok).toBe(true);

        // The view that found nothing is what made the mirror empty; the push then created the
        // repository from it, asked again for the url, and set the About on the url it was told.
        expect(calls.map((one) => one[1])).toEqual(['view', 'create', 'view', 'edit']);
        const create = calls[1];
        expect(create.slice(0, 3)).toEqual(['repo', 'create', 'delta-code']);
        expect(create[create.indexOf('--source') + 1]).toBe(join(mirrors, 'delta-code'));
        expect(create).toContain('--push');
        expect(sent.output).toBe(url);
        expect(readFileSync(manifestOf('delta'), 'utf8')).toContain(url);
        expect(calls[3].slice(0, 3)).toEqual(['repo', 'edit', 'someone/delta-code']);
    });
});

describe('the branches', () => {
    it('makes a branch in the mirror', async () => {
        const made = await createBranch('alpha', 'review', options());
        expect(made.ok).toBe(true);
        const listed = await branches('alpha', options());
        expect(listed.branches.map((one) => one.name).sort()).toEqual(['main', 'review']);
        expect(listed.branches.find((one) => one.current)?.name).toBe('review');
    });

    it('refuses a switch while the mirror is dirty', async () => {
        write(join(mirrors, 'alpha-code'), 'loose.txt', 'in the way\n');
        const switched = await switchBranch('alpha', 'main', options());
        expect(switched.ok).toBe(false);
        expect(switched.error).toContain('dirty');
        rmSync(join(mirrors, 'alpha-code', 'loose.txt'));
    });

    it('copies the branch back into code/ and leaves results/ alone', async () => {
        write(join(mirrors, 'alpha-code'), 'run.py', 'print(3)\n');
        git(join(mirrors, 'alpha-code'), 'add', '-A');
        git(
            join(mirrors, 'alpha-code'),
            '-c',
            'user.email=t@t',
            '-c',
            'user.name=t',
            'commit',
            '-qm',
            'On the branch'
        );
        const switched = await switchBranch('alpha', 'main', options());
        expect(switched.ok).toBe(true);
        expect(readFileSync(join(codeOf('alpha'), 'run.py'), 'utf8')).toBe('print(2)\n');
        const back = await switchBranch('alpha', 'review', options());
        expect(back.ok).toBe(true);
        expect(readFileSync(join(codeOf('alpha'), 'run.py'), 'utf8')).toBe('print(3)\n');
        expect(existsSync(join(codeOf('alpha'), 'results', 'out.csv'))).toBe(true);
        expect(readdirSync(codeOf('alpha'))).toContain('attic');
    });

    it('deletes from code/ a file the branch it left had and the new one lacks', async () => {
        const mirror = join(mirrors, 'alpha-code');
        write(mirror, join('sub', 'only-on-review.py'), 'print(4)\n');
        git(mirror, 'add', '-A');
        git(
            mirror,
            '-c',
            'user.email=t@t',
            '-c',
            'user.name=t',
            'commit',
            '-qm',
            'A file only review has'
        );
        const onto = await switchBranch('alpha', 'review', options());
        expect(onto.ok).toBe(true);
        expect(existsSync(join(codeOf('alpha'), 'sub', 'only-on-review.py'))).toBe(true);

        const back = await switchBranch('alpha', 'main', options());
        expect(back.ok).toBe(true);
        expect(existsSync(join(codeOf('alpha'), 'sub', 'only-on-review.py'))).toBe(false);
        // The emptied folder goes with it, and what the mirror never held is left alone.
        expect(existsSync(join(codeOf('alpha'), 'sub'))).toBe(false);
        expect(existsSync(join(codeOf('alpha'), 'results', 'out.csv'))).toBe(true);
    });
});

describe('what is refused before any command', () => {
    it('refuses a directory outside the mirrors folder', async () => {
        const before = ran.length;
        const listed = await lsFiles({ dir: outside, mirrors });
        expect(listed.ok).toBe(false);
        expect(listed.error).toContain('not a deposit mirror');
        expect(ran.length).toBe(before);
    });

    it('refuses an id the hub does not hold', async () => {
        const planned = await sync('nothing', options());
        expect(planned.ok).toBe(false);
        expect(planned.error).toContain('no project with the id nothing');
    });
});

describe('the git runner the deposit is given', () => {
    it('answers a failed switch before the branch moves, when the listing fails', async () => {
        const mirror = join(mirrors, 'alpha-code');
        const branch = git(mirror, 'rev-parse', '--abbrev-ref', 'HEAD').trim();
        expect(branch).toBe('main');
        const held = readFileSync(join(codeOf('alpha'), 'run.py'), 'utf8');
        const listed = git(mirror, 'ls-files').split('\n').filter(Boolean);
        expect(listed.length).toBeGreaterThan(0);

        // Every command but the listing is run here, by this file, exactly as the module would have
        // run it, so the mirror is clean and `review` is a branch the switch could take; the
        // listing alone fails, which is what the guard is for.
        const passthrough: GitRunner = (args) => {
            try {
                return answer(true, execFileSync('git', args, { encoding: 'utf8' }), '');
            } catch (error) {
                return answer(false, '', error instanceof Error ? error.message : String(error));
            }
        };
        const failing: GitRunner = (args, timeout) =>
            args.includes('ls-files')
                ? answer(false, '', 'fatal: ls-files failed')
                : passthrough(args, timeout);
        const switched = await switchBranch('alpha', 'review', { ...options(), git: failing });
        expect(switched.ok).toBe(false);
        expect(switched.error).toBe('fatal: ls-files failed');
        // The branch never moved and nothing was copied back: the switch stopped at the listing.
        expect(git(mirror, 'rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('main');
        expect(git(mirror, 'ls-files').split('\n').filter(Boolean)).toEqual(listed);
        expect(readFileSync(join(codeOf('alpha'), 'run.py'), 'utf8')).toBe(held);
    });
});

describe('the gate over what this module can run', () => {
    it('names the force option exactly once', () => {
        const source = readFileSync(MODULE, 'utf8');
        expect((source.match(/--force/g) ?? []).length).toBe(1);
    });

    it('names only enumerated subcommands at its call sites', () => {
        const source = readFileSync(MODULE, 'utf8');
        const calls = [...source.matchAll(/\brun\(\s*at\s*,\s*\[\s*'([a-z-]+)'/g)].map(
            (call) => call[1]
        );
        expect(calls.length).toBeGreaterThan(0);
        expect(calls.every((one) => SUBCOMMANDS.includes(one))).toBe(true);
    });

    it('ran nothing but those subcommands and the three gh shapes', () => {
        expect(ran.length).toBeGreaterThan(0);
        for (const args of ran) {
            if (args[0] === 'gh') {
                expect(args[1]).toBe('repo');
                expect(['view', 'create', 'edit']).toContain(args[2]);
                continue;
            }
            // Every git vector is `-C <dir> <subcommand> ...`, and no directory leaves the tree.
            expect(args[0]).toBe('-C');
            expect(resolve(args[1]).startsWith(resolve(tmpdir()) + sep)).toBe(true);
            expect(SUBCOMMANDS).toContain(args[2]);
        }
    });
});
