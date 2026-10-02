// Layer 4, test helper. What the git folder (src/lib/server/core/git/) may run, as data: the
// subcommands it is allowed, the call sites it holds, the exact vectors of the subcommands that
// have writing forms, the way those vectors are written in its sources, and the writing
// subcommands no source may name. tests/server/core/git/git.test.ts holds the folder to them.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFS_FORMAT } from '../../../../src/lib/server/core/git/parse.ts';

const FOLDER = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../src/lib/server/core/git'
);

/** The text of every source file of the git folder, joined, for the scans over what it names. */
export function gitSources(): string {
    return readdirSync(FOLDER)
        .filter((name) => name.endsWith('.ts'))
        .sort()
        .map((name) => readFileSync(join(FOLDER, name), 'utf8'))
        .join('\n');
}

/** Everything the git folder is allowed to run. The source scan below asserts it holds no other. */
export const ALLOWED = [
    'blame',
    'check-attr',
    'check-ignore',
    'config',
    'diff',
    'for-each-ref',
    'log',
    'ls-files',
    'merge-base',
    'remote',
    'rev-list',
    'rev-parse',
    'show',
    'status',
    'symbolic-ref',
    'worktree'
];

/**
 * Every call the module makes, by subcommand, one entry per call site: `rev-parse` is run twice,
 * once to tell a repository from a folder and once for the branch; `diff` twice, the channel's
 * line counts and the on-demand diffs; `log` five times, the channel's log, the stashes' reflog, a
 * page of the graph, the range either side of the upstream and the commits of one file.
 */
export const CALLS = [...ALLOWED, 'config', 'rev-parse', 'diff', 'log', 'log', 'log', 'log'].sort();

/**
 * The exact vectors nine subcommands may run as. `symbolic-ref HEAD <ref>` moves HEAD, `worktree
 * add` makes a checkout and `remote add` adds a remote, so each of those is held to its one reading
 * vector; `rev-parse` has no writing form and is held to the module's two reads so a third use is a
 * change this gate sees, `check-ignore` to the one form the file browser reads its ignored entries
 * by, `for-each-ref` to the one ref listing over the branches, the tags and the stash ref,
 * `ls-files` to the one listing of the tracked paths the Status view's line counts read, `config`
 * (which has writing forms) to its two reads, `core.autocrlf` and `core.sshCommand`, and
 * `check-attr` to the five attributes the diff pane reads, over the one path this file asks for.
 */
export const PINNED: Partial<Record<string, string[][]>> = {
    'check-attr': [
        ['check-attr', 'filter', 'text', 'eol', 'working-tree-encoding', 'ident', '--', 'kept.txt']
    ],
    'check-ignore': [['check-ignore', '--stdin', '-z']],
    config: [
        ['config', '--get', '--default=', 'core.autocrlf'],
        ['config', '--get', '--default=', 'core.sshCommand']
    ],
    'for-each-ref': [['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash']],
    'ls-files': [['ls-files', '-z']],
    remote: [['remote']],
    'rev-parse': [
        ['rev-parse', '--git-dir'],
        ['rev-parse', '--abbrev-ref', 'HEAD']
    ],
    'symbolic-ref': [['symbolic-ref', '--short', 'HEAD']],
    worktree: [['worktree', 'list', '--porcelain']]
};

/** The same vectors as the module's source writes them, one list literal per call. */
export const PINNED_SOURCE = [
    "['check-attr', 'filter', 'text', 'eol', 'working-tree-encoding', 'ident', '--', path]",
    "['check-ignore', '--stdin', '-z']",
    "['config', '--get', '--default=', 'core.autocrlf']",
    "['config', '--get', '--default=', 'core.sshCommand']",
    "['for-each-ref', REFS_FORMAT, 'refs/heads', 'refs/tags', 'refs/stash']",
    "['ls-files', '-z']",
    "['remote']",
    "['rev-parse', '--git-dir']",
    "['rev-parse', '--abbrev-ref', 'HEAD']",
    "['symbolic-ref', '--short', 'HEAD']",
    "['worktree', 'list', '--porcelain']"
];

/** No writing subcommand may be named in the module at all, quoted as an argument would be. */
export const FORBIDDEN = [
    'add',
    'am',
    'apply',
    'branch -',
    'checkout',
    'cherry-pick',
    'clean',
    'commit',
    'fetch',
    'gc',
    'merge',
    'mv',
    'prune',
    'pull',
    'push',
    'rebase',
    'reset',
    'restore',
    'revert',
    'rm',
    'stash',
    'switch',
    'tag'
];
