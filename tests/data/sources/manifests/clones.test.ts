// Layer 1, data tests. The repositories a project is cloned in (placeClones), read from the folders
// the git watcher lists against a synthetic hub and synthetic repositories in a temporary
// directory, with the two readers they rest on: the address two remotes share (sameAddress) and the
// origin a folder's repository names (originOf). A linked worktree and the main checkout it was
// made from share one git folder and are one clone; nothing outside the temporary directory is
// read or written.

import { realpathSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import { buildOneHub } from '../../../fixtures/hubs/hub-build.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { findingText } from '../../../../src/lib/data/helpers/finding-text.ts';
import type { Snapshot } from '../../../../src/lib/data/model/index.ts';
import { placeClones } from '../../../../src/lib/data/sources/clones.ts';
import { originOf, sameAddress } from '../../../../src/lib/data/sources/origin.ts';
import { it, plantFile, plantScratch, scratchDir, test } from '../../../fixtures/scratch.ts';
import { plantHub } from '../../../fixtures/hubs/workspace.ts';

const MERGED = loadConfig(engineDir()).config;

/** The address of the project `x` of the hub every clone row is read over. */
const X = 'https://github.com/theaxec/x';

/** The finding a project cloned in two folders raises, with its placeholders filled. */
function clonedTwice(...dirs: string[]): string {
    return findingText(textCatalog(MERGED), 'findings.manifests.cloned_twice', X, dirs.join(', '));
}

/** The messages of the findings a snapshot holds on a project's `repository.url`. */
function urlFindings(snapshot: Snapshot): string[] {
    return snapshot.findings
        .filter((one) => one.key === 'repository.url')
        .map((one) => one.message);
}

describe('the address of a repository', () => {
    const SAME = [
        ['https://github.com/TheAxeC/x', 'https://github.com/theaxec/x.git'],
        ['https://github.com/theaxec/x', 'git@github.com:TheAxeC/x.git'],
        ['git@github.com:theaxec/x.git', 'ssh://git@github.com/theaxec/x'],
        ['https://GitLab.example.org/o/r.git', 'git@gitlab.example.org:o/r'],
        ['https://example.org/o/r/', 'https://example.org/o/r'],
        ['ssh://git@Example.org:22/o/r.git', 'https://example.org/o/r'],
        ['git@GitHub.com:TheAxeC/X.git', 'https://github.com/theaxec/x']
    ];
    test.for(SAME)('%s and %s are one repository', ([a, b]) => {
        expect(sameAddress(a, b)).toBe(true);
    });

    const DIFFERENT = [
        ['https://example.org/o/R', 'https://example.org/o/r'],
        ['https://example.org/o/r', 'https://other.example.org/o/r'],
        ['https://github.com/o/r', 'https://github.com/o/s'],
        ['/some/folder', 'https://github.com/o/r'],
        ['not an address', 'not an address']
    ];
    test.for(DIFFERENT)('%s and %s are two', ([a, b]) => {
        expect(sameAddress(a, b)).toBe(false);
    });
});

describe('the origin of a folder', () => {
    const CONFIG =
        '[core]\n\tbare = false\n[remote "upstream"]\n\turl = https://example.org/u\n[remote "origin"]\n\turl = https://example.org/o\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n';

    test("is the url of the origin remote of the folder's .git", () => {
        const dir = plantScratch('oculus-origin-', { '.git/config': CONFIG });
        expect(originOf(dir)).toBe('https://example.org/o');
    });

    test('is read from the common folder of a worktree whose .git is a file', () => {
        const dir = plantScratch('oculus-origin-tree-', {
            'main/.git/config': CONFIG,
            'main/.git/worktrees/w/commondir': '../..\n',
            'w/.git': 'gitdir: ../main/.git/worktrees/w\n'
        });
        expect(originOf(join(dir, 'w'))).toBe('https://example.org/o');
    });

    const NONE: { name: string; files: Record<string, string> }[] = [
        { name: 'a folder with no .git', files: { 'a.txt': 'a\n' } },
        {
            name: 'a repository with no origin',
            files: { '.git/config': '[core]\n\tbare = false\n' }
        },
        {
            name: 'a repository whose only remote is not origin',
            files: { '.git/config': '[remote "upstream"]\n\turl = https://example.org/u\n' }
        },
        { name: 'a .git file that names no folder', files: { '.git': 'nothing\n' } }
    ];
    test.for(NONE)('is none for $name', ({ files }) => {
        expect(originOf(plantScratch('oculus-origin-none-', files))).toBeNull();
    });
});

/** A repository's config whose `origin` is this address. */
function config(url: string): string {
    return `[remote "origin"]\n\turl = ${url}\n`;
}

/** A main checkout at `dir` whose `origin` is this address: its `.git` folder with the config. */
function mainCheckout(dir: string, url: string): string {
    plantFile(dir, '.git/config', config(url));
    return dir;
}

/**
 * A linked worktree at `dir` of the main checkout at `main`, as `git worktree add` writes one: a
 * `.git` file naming the worktree's own folder under the main's `.git/worktrees` by its absolute
 * path, and in that folder a `commondir` of `../..`, which leads back to the main's `.git`.
 */
function linkedWorktree(main: string, dir: string, name: string): string {
    plantFile(main, `.git/worktrees/${name}/commondir`, '../..\n');
    plantFile(dir, '.git', `gitdir: ${join(main, '.git', 'worktrees', name)}\n`);
    return dir;
}

describe('the clones of a project', () => {
    /**
     * A built snapshot over a hub holding the projects `x` (a url) and `y` (none), and the repos.
     */
    function placed(origins: Record<string, string>) {
        const folders = Object.fromEntries(
            Object.entries(origins).map(([name, url]) => [`${name}/.git/config`, config(url)])
        );
        const repos = plantScratch('oculus-clones-repos-', folders);
        const dirs = Object.keys(origins).map((name) => join(repos, name));
        return { snapshot: clonesOf(dirs), dirs };
    }

    /** The snapshot of that hub with the clones of its projects placed from these folders. */
    function clonesOf(dirs: readonly string[]): Snapshot {
        const hub = plantScratch('oculus-clones-hub-', {
            'projects/ideas/x/project.yml': `title: X\ntier: projects\ntype: idea\nrepository:\n  url: ${X}\n`,
            'projects/ideas/y/project.yml': 'title: Y\ntier: projects\ntype: idea\n'
        });
        plantHub(hub);
        const { snapshot } = buildOneHub(hub, portfolioConfigFrom(MERGED), 0, []);
        placeClones(snapshot, dirs, textCatalog(MERGED));
        return snapshot;
    }

    it('is the repository whose origin is the url however it is written, and none for a project with no url', () => {
        const { snapshot, dirs } = placed({
            a: 'git@github.com:TheAxeC/x.git',
            b: 'https://github.com/theaxec/other'
        });
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([dirs[0]]);
        expect(snapshot.entities.projects.y.repository).toBeUndefined();
        expect(snapshot.findings.filter((one) => one.key === 'repository.url')).toEqual([]);
    });

    it('is empty for a project no repository has the url of', () => {
        const { snapshot } = placed({ a: 'https://github.com/theaxec/other' });
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([]);
    });

    it('lists two clones in the order the repositories are listed, with one finding on the project naming both', () => {
        const { snapshot, dirs } = placed({
            a: 'git@github.com:TheAxeC/x.git',
            b: 'https://github.com/theaxec/x'
        });
        expect(snapshot.entities.projects.x.repository?.clones).toEqual(dirs);
        expect(urlFindings(snapshot)).toEqual([clonedTwice(...dirs)]);
    });

    it('is the main checkout alone for a hub listed with two linked worktrees of its own, with no finding', () => {
        const repos = scratchDir('oculus-clones-hub-trees-');
        const hub = mainCheckout(join(repos, 'hub'), X);
        const gate = linkedWorktree(hub, join(hub, '.agents/worktrees/gate'), 'gate');
        const step = linkedWorktree(hub, join(hub, '.agents/worktrees/step'), 'step');
        const snapshot = clonesOf([hub, gate, step]);
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([hub]);
        expect(urlFindings(snapshot)).toEqual([]);
    });

    it('is the two folders a project is cloned in when one of them has a linked worktree listed too, with the finding naming those two', () => {
        const repos = scratchDir('oculus-clones-two-trees-');
        const one = mainCheckout(join(repos, 'one'), X);
        const two = mainCheckout(join(repos, 'two'), 'git@github.com:TheAxeC/x.git');
        const tree = linkedWorktree(two, join(repos, 'two-tree'), 'two-tree');
        const snapshot = clonesOf([one, two, tree]);
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([one, two]);
        expect(urlFindings(snapshot)).toEqual([clonedTwice(one, two)]);
    });

    it('is the main checkout listed after its own worktree, at the place of the worktree among the clones', () => {
        const repos = scratchDir('oculus-clones-tree-first-');
        const main = mainCheckout(join(repos, 'main'), X);
        const tree = linkedWorktree(main, join(repos, 'tree'), 'tree');
        const other = mainCheckout(join(repos, 'other'), X);
        const snapshot = clonesOf([tree, other, main]);
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([main, other]);
        expect(urlFindings(snapshot)).toEqual([clonedTwice(main, other)]);
    });

    it('is one clone for a worktree whose .git names the main checkout by another spelling of its path', () => {
        // The folders are listed through a link, and the worktree's .git names the main checkout
        // by its real path, as a folder under $TMPDIR is named through /private on macOS.
        const real = realpathSync(scratchDir('oculus-clones-spelled-'));
        const link = join(real, 'link');
        symlinkSync(real, link);
        linkedWorktree(mainCheckout(join(real, 'main'), X), join(real, 'tree'), 'tree');
        const snapshot = clonesOf([join(link, 'main'), join(link, 'tree')]);
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([join(link, 'main')]);
        expect(urlFindings(snapshot)).toEqual([]);
    });

    it('is the first of two linked worktrees listed when no listed folder holds their main checkout', () => {
        const repos = scratchDir('oculus-clones-trees-only-');
        const main = mainCheckout(join(repos, 'main'), X);
        const first = linkedWorktree(main, join(repos, 'first'), 'first');
        const second = linkedWorktree(main, join(repos, 'second'), 'second');
        const snapshot = clonesOf([first, second]);
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([first]);
        expect(urlFindings(snapshot)).toEqual([]);
    });

    it('is the one linked worktree listed when no listed folder holds its main checkout', () => {
        const repos = scratchDir('oculus-clones-tree-only-');
        const main = mainCheckout(join(repos, 'main'), X);
        const tree = linkedWorktree(main, join(repos, 'tree'), 'tree');
        expect(clonesOf([tree]).entities.projects.x.repository?.clones).toEqual([tree]);
    });

    it('is a submodule listed beside its parent as a clone of its own, and no folder whose .git names a git folder that is gone', () => {
        const repos = scratchDir('oculus-clones-submodule-');
        const parent = mainCheckout(join(repos, 'parent'), 'https://github.com/theaxec/parent');
        plantFile(parent, '.git/modules/x/config', config(X));
        const sub = join(parent, 'x');
        plantFile(sub, '.git', 'gitdir: ../.git/modules/x\n');
        const gone = join(repos, 'gone');
        plantFile(gone, '.git', `gitdir: ${join(repos, 'nowhere', '.git', 'worktrees', 'gone')}\n`);
        const snapshot = clonesOf([parent, sub, gone]);
        expect(snapshot.entities.projects.x.repository?.clones).toEqual([sub]);
        expect(urlFindings(snapshot)).toEqual([]);
    });
});
