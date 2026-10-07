// Layer 2, server tests. classifyFailure of core/git/parse.ts reads a failed git or gh command: the
// codes in their order (Cancel, the time limit, the output limit, a signal), then git's own text,
// then an exit status with nothing written. failureLine of core/git/failure.ts says each code in
// the catalog's words, with the program first and the operation a run left unfinished after it. One
// row per input that gives a different outcome.

import { describe, expect, it } from 'vitest';
import {
    classifyFailure,
    type Classified,
    type CommandFailure
} from '../../../src/lib/server/core/git/parse.ts';
import { failureLine } from '../../../src/lib/server/core/git/failure.ts';
import { TEXT } from '../text.ts';

const LIMITS = { timeoutMs: 10000, maxBytes: 8 * 1024 * 1024 };

/** An `execFile` failure carrying the fields the classifier reads. */
function failure(fields: Record<string, unknown>): Error {
    return Object.assign(new Error('Command failed: git -C /r commit'), fields);
}

function coded(code: string, detail: string): Classified {
    return { reason: code, failure: { code, detail, program: 'git' } } as Classified;
}

const ROWS: [string, Error, string, string, Classified][] = [
    [
        'a run that timed out says the limit and never its partial error text',
        failure({ killed: true, signal: 'SIGTERM', code: null }),
        '',
        'fatal: partial output of a run that was stopped',
        coded('timed-out', '10')
    ],
    [
        'a signal nothing here sent names the signal',
        failure({ killed: false, signal: 'SIGKILL', code: null }),
        '',
        '',
        coded('signal', 'SIGKILL')
    ],
    [
        'an exit status with both streams empty names the status',
        failure({ code: 1, killed: false, signal: null }),
        '',
        '',
        coded('exit-status', '1')
    ],
    [
        'a run that wrote more than the limit names the limit in MB',
        failure({ code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' }),
        'x',
        '',
        coded('too-much-output', '8')
    ],
    [
        'a run Cancel ended says Cancel',
        failure({ name: 'AbortError', code: 'ABORT_ERR' }),
        '',
        '',
        coded('cancelled', '')
    ],
    [
        'Cancel comes before the time limit',
        failure({ name: 'AbortError', code: 'ABORT_ERR', killed: true }),
        '',
        '',
        coded('cancelled', '')
    ],
    [
        'the time limit comes before the output limit and a signal',
        failure({ killed: true, signal: 'SIGTERM', code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' }),
        '',
        '',
        coded('timed-out', '10')
    ],
    [
        'the output limit comes before a signal',
        failure({ code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER', signal: 'SIGTERM' }),
        '',
        '',
        coded('too-much-output', '8')
    ],
    [
        'a signal comes before git text on the error stream',
        failure({ signal: 'SIGKILL', code: null }),
        '',
        'fatal: not a git repository',
        coded('signal', 'SIGKILL')
    ],
    [
        "git's own fatal line is its reason with the prefix dropped",
        failure({ code: 128 }),
        '',
        'fatal: not a git repository',
        { reason: 'not a git repository' }
    ],
    [
        'the last fatal line wins over the progress lines before it',
        failure({ code: 128 }),
        '',
        "Preparing worktree (new branch 'x')\nfatal: a branch named 'x' already exists",
        { reason: "a branch named 'x' already exists" }
    ],
    [
        'an error stream with no fatal line gives its first line',
        failure({ code: 1 }),
        '',
        'error: pathspec did not match\nhint: something',
        { reason: 'error: pathspec did not match' }
    ],
    [
        'an empty error stream gives the last non-empty line of the output stream',
        failure({ code: 1 }),
        'On branch main\nnothing to commit, working tree clean\n',
        '',
        { reason: 'nothing to commit, working tree clean' }
    ],
    [
        'git text comes before an exit status',
        failure({ code: 1 }),
        '',
        'hook failed',
        { reason: 'hook failed' }
    ]
];

describe('classifyFailure', () => {
    it.each(ROWS)('%s', (_title, error, stdout, stderr, expected) => {
        expect(classifyFailure(error, stdout, stderr, LIMITS, 200, 'git')).toEqual(expected);
    });
});

const SENTENCES: [CommandFailure, string][] = [
    [{ code: 'cancelled', detail: '', program: 'git' }, 'Git was stopped by Cancel'],
    [
        { code: 'timed-out', detail: '10', program: 'git' },
        'Git did not finish within 10 seconds, so it was stopped'
    ],
    [
        { code: 'too-much-output', detail: '8', program: 'git' },
        'Git wrote more than 8 MB of output, so it was stopped'
    ],
    [{ code: 'signal', detail: 'SIGKILL', program: 'git' }, 'Git was ended by the signal SIGKILL'],
    [
        { code: 'exit-status', detail: '1', program: 'git' },
        'Git stopped with exit status 1 and gave no reason'
    ],
    [
        { code: 'timed-out', detail: '30', program: 'gh' },
        'The gh command did not finish within 30 seconds, so it was stopped'
    ],
    [
        { code: 'cancelled', detail: '', program: 'git', left: 'merge' },
        'Git was stopped by Cancel; the merge is left in progress'
    ],
    [
        { code: 'signal', detail: 'SIGTERM', program: 'git', left: 'rebase' },
        'Git was ended by the signal SIGTERM; the rebase is left in progress'
    ],
    [
        { code: 'cancelled', detail: '', program: 'git', left: 'cherry-pick' },
        'Git was stopped by Cancel; the cherry-pick is left in progress'
    ]
];

describe('failureLine', () => {
    it.each(SENTENCES)('says %j as its sentence', (failure, sentence) => {
        expect(failureLine(failure, TEXT)).toBe(sentence);
    });
});
