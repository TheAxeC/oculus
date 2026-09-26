// Layer 4, test helper. What server/git/git-write.ts may run, for itself and for the modules beside
// it that reach git through its call sites. Both suites over the writing half gate on this one
// list: git-write.test.ts asserts the source holds exactly these call sites, and each suite asserts
// every command it ran is one of them.

/** Every subcommand the writing half of git runs, each at one call site of git-write.ts. */
export const ALLOWED = [
    'add',
    'apply',
    'branch',
    'check-ref-format',
    'commit',
    'diff',
    'fetch',
    'merge',
    'merge-base',
    'pull',
    'push',
    'rebase',
    'remote',
    'restore',
    'rev-parse',
    'rm',
    'stash',
    'status',
    'switch',
    'tag',
    'worktree'
];
