// Layer 2, client-state tests. The problem matchers an app declares, read against the output of a
// task terminal (state/sessions/terminal/pty/matchers.ts, wired by commands.svelte.ts): a pattern
// of several lines completes one problem, a looping last pattern completes one per following line,
// a background matcher forgets the problems of the round before when a new round begins, a hit that
// names a file outside the repository is dropped, and a command that names no matcher is read for
// the `file:line: error` shape. These are the matcher rows of G77 for the problemMatchers point.
//
// The store is real; the terminals, the entities and the workspaces are stubs. What this does NOT
// cover: the server that lists the tasks and starts them (tests/server/machine/apps/tools).

import { describe, expect, it } from 'vitest';
import type {
    AppProblemMatcher,
    AppProblemPattern,
    CommandDiagnostic
} from '../../../../src/lib/data/model/index.ts';
import { createQueries } from '../../../../src/lib/state/client/queries/queries.svelte.ts';
import { stubbedCommands } from './commands-fixture.ts';
import {
    matchersFor,
    stepMatcher,
    FRESH
} from '../../../../src/lib/state/sessions/terminal/pty/matchers.ts';

const NONE: AppProblemPattern = {
    regexp: '',
    file: 0,
    location: 0,
    line: 0,
    column: 0,
    endLine: 0,
    endColumn: 0,
    severity: 0,
    code: 0,
    message: 0,
    loop: false
};

/** A matcher of an app with the patterns given. */
function matcher(
    name: string,
    patterns: Partial<AppProblemPattern>[],
    over: Partial<AppProblemMatcher> = {}
): AppProblemMatcher {
    return {
        name,
        owner: name,
        source: '',
        fileLocation: 'relative',
        patterns: patterns.map((one) => ({ ...NONE, ...one })),
        severity: 'error',
        background: null,
        ...over
    };
}

const SINGLE = matcher('single', [
    {
        regexp: '^(\\S+)\\((\\d+),(\\d+)\\): (warning|error) (\\w+): (.*)$',
        file: 1,
        line: 2,
        column: 3,
        severity: 4,
        code: 5,
        message: 6
    }
]);

const BLOCK = matcher('block', [
    { regexp: '^==> (\\S+)$', file: 1 },
    {
        regexp: '^\\s+(\\d+):(\\d+) (warning|error) (.*)$',
        line: 1,
        column: 2,
        severity: 3,
        message: 4,
        loop: true
    }
]);

const WATCH = matcher(
    'watch',
    [{ regexp: '^(\\S+):(\\d+): (.*)$', file: 1, line: 2, message: 3 }],
    {
        background: { activeOnStart: true, beginsPattern: '^compiling', endsPattern: '^done' }
    }
);

/** A commands store whose terminal `t1` runs a command of the repository `/w/a` naming matchers. */
function make(matchers: AppProblemMatcher[]) {
    let listed: unknown[] = [];
    const { commands } = stubbedCommands(
        () => listed,
        () => matchers
    );
    createQueries();
    listed = [
        {
            id: 't1',
            task: true,
            exit: null,
            pid: 1,
            job: { repo: '/w/a', name: 'build', source: 'app' }
        }
    ];
    const rows = (): string[] =>
        commands
            .commandDiagnostics()
            .map(
                (one: CommandDiagnostic) =>
                    `${one.file}:${one.line}${one.column === undefined ? '' : `:${one.column}`} ${one.severity} ${one.message}`
            );
    return { commands, rows };
}

describe('the lines a matcher reads', () => {
    it('completes a problem from one line, with its file, place, severity and message', () => {
        const env = make([SINGLE]);
        env.commands.note('t1', 'src/a.ts(3,7): warning TS1: unused value\n', false);
        expect(env.rows()).toEqual(['src/a.ts:3:7 warning unused value']);
    });

    it('completes a problem from several lines, and one more for every line a looping pattern reads', () => {
        const env = make([BLOCK]);
        env.commands.note(
            't1',
            '==> src/b.ts\n  1:2 error first\n  4:5 warning second\nplain line\n',
            false
        );
        expect(env.rows()).toEqual(['src/b.ts:1:2 error first', 'src/b.ts:4:5 warning second']);
    });

    it('drops what the lines before held when a line does not match the pattern it waits for', () => {
        const run = stepMatcher(BLOCK, FRESH, '==> src/b.ts');
        const broken = stepMatcher(BLOCK, run.run, 'unrelated');
        const again = stepMatcher(BLOCK, broken.run, '  1:2 error orphan');
        expect([run.run.next, broken.run.next, again.hit]).toEqual([1, 0, null]);
    });

    it('forgets the problems of the round before when a background matcher reads the line that begins a round', () => {
        const env = make([WATCH]);
        env.commands.note('t1', 'compiling\nsrc/c.ts:1: first round\n', false);
        const first = env.rows();
        env.commands.note('t1', 'done\ncompiling\nsrc/c.ts:9: second round\n', false);
        expect([first, env.rows()]).toEqual([
            ['src/c.ts:1 error first round'],
            ['src/c.ts:9 error second round']
        ]);
    });

    it('drops a hit that names a file outside the repository, and keeps one inside it', () => {
        const env = make([WATCH]);
        env.commands.note(
            't1',
            '../other/x.ts:2: above\n/etc/passwd:1: absolute\nsrc/in.ts:4: inside\n',
            false
        );
        expect(env.rows()).toEqual(['src/in.ts:4 error inside']);
    });

    it('reads the file:line: error shape when the command names no matcher', () => {
        const env = make([]);
        env.commands.note('t1', 'src/d.ts:5:2: error: broken\n', false);
        expect(env.rows()).toEqual(['src/d.ts:5:2 error broken']);
    });

    it('reads a pattern whose expression does not compile as one that never matches', () => {
        const broken = matcher('broken', [{ regexp: '(', file: 1 }]);
        expect(stepMatcher(broken, FRESH, 'anything').hit).toBeNull();
    });
});

describe('the matchers a command names', () => {
    const declaring = [
        {
            name: 'notes',
            root: '',
            contributes: { problemMatchers: [matcher('shared', [{ regexp: 'a' }])] }
        },
        {
            name: 'other',
            root: '',
            contributes: {
                problemMatchers: [
                    matcher('shared', [{ regexp: 'b' }]),
                    matcher('only', [{ regexp: 'c' }])
                ]
            }
        }
    ];

    it('are looked up in the app that runs the command first, then in the others, and a name no app declares is left out', () => {
        const found = matchersFor(['$shared', '$only', '$absent'], 'app:other', declaring);
        const first = matchersFor(['$shared'], 'app:notes', declaring);
        expect([found.map((one) => one.patterns[0].regexp), first[0].patterns[0].regexp]).toEqual([
            ['b', 'c'],
            'a'
        ]);
    });
});
