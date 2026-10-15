// Layer 2, server tests. classifyFailure of core/git/parse.ts reads a failed git or gh command: the
// codes in their order (Cancel, the time limit, the output limit, a signal), then git's own text,
// then an exit status with nothing written. failureLine of core/git/failure.ts says each code in
// the catalog's words, with the program first and the operation a run left unfinished after it. One
// row per input that gives a different outcome. A status read taken record by record
// (core/git/records.ts) ends with an error the same classifier reads: out of time, cancelled, an
// exit status with git's text, and a program that cannot start; a reader that ended it early is no
// failure; a record cut across the chunks the program writes in reads whole. Those rows start a
// program standing in for git, so their describe is tagged slow.

import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { readRecords } from '../../../src/lib/server/core/git/records.ts';
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

/** A program standing in for git: node running `script`, its output in pipes. */
function program(script: string): ReturnType<typeof spawn> {
    return spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
}

/** What the classifier says of how a read of `child` ended. */
async function endOf(
    child: ReturnType<typeof spawn>,
    limits: { timeout: number; signal?: AbortSignal },
    visit: (path: string) => boolean | undefined = () => undefined
): Promise<Classified | null> {
    const { error, stderr } = await readRecords(child, limits, (record) => visit(record.path));
    if (error === null) return null;
    return classifyFailure(error, '', stderr, { ...LIMITS, timeoutMs: 1000 }, 200, 'git');
}

describe('a status read taken record by record', { tags: ['slow'] }, () => {
    const HANGS = "process.stdout.write('?? a.txt\\0'); setTimeout(() => {}, 20000);";

    it('says the limit when the read runs out of time', async () => {
        expect(await endOf(program(HANGS), { timeout: 300 })).toEqual(coded('timed-out', '1'));
    });

    it('says Cancel when the run is cancelled', async () => {
        const stop = new AbortController();
        const said = await endOf(program(HANGS), { timeout: 0, signal: stop.signal }, () => {
            stop.abort();
            return undefined;
        });
        expect(said?.failure?.code).toBe('cancelled');
    });

    it('reads a record cut across the chunks the program writes it in', async () => {
        const whole = '?? caf\u00e9 one.txt\0R  new name.txt\0old name.txt\0 M b\u00e9.txt\0';
        const writes = [
            "const all = Buffer.from(process.argv[1], 'hex');",
            'let at = 0;',
            'const next = () => {',
            '    if (at >= all.length) return;',
            '    process.stdout.write(all.subarray(at, at + 3));',
            '    at += 3;',
            '    setTimeout(next, 5);',
            '};',
            'next();'
        ].join('\n');
        const child = spawn(process.execPath, ['-e', writes, Buffer.from(whole).toString('hex')], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        const seen: unknown[] = [];
        const { error } = await readRecords(child, { timeout: 0 }, (record) => {
            seen.push(record);
        });
        expect(error).toBeNull();
        expect(seen).toEqual([
            { code: '??', path: 'caf\u00e9 one.txt', from: null },
            { code: 'R ', path: 'new name.txt', from: 'old name.txt' },
            { code: ' M', path: 'b\u00e9.txt', from: null }
        ]);
    });

    it("says git's own text for an exit status, and the start's error when it cannot start", async () => {
        const refused = program(
            "process.stderr.write('fatal: not a git repository\\n'); process.exit(128);"
        );
        expect(await endOf(refused, { timeout: 0 })).toEqual({
            reason: 'not a git repository'
        });
        const missing = spawn('/nonexistent/git', [], { stdio: ['ignore', 'pipe', 'pipe'] });
        expect(await endOf(missing, { timeout: 0 })).toEqual({
            reason: 'spawn /nonexistent/git ENOENT'
        });
    });

    it('is no failure when the reader ends it at its answer', async () => {
        const seen: string[] = [];
        const said = await endOf(program(HANGS), { timeout: 10000 }, (path) => {
            seen.push(path);
            return false;
        });
        expect(said).toBeNull();
        expect(seen).toEqual(['a.txt']);
    });
});
