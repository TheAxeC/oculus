// The reader of one line of `ps` output into a table row. The sample lines are in the form `ps`
// prints for the columns pid, ppid, user, pcpu, rss, lstart and command with the headers off:
// `lstart` is the start in the machine's local wall-clock time as `Thu Oct  2 11:53:00 2026`, and
// the command is the rest of the line. Nothing here runs `ps` or reads the machine. A start is
// turned into an instant by the zone of the process that reads it, so each case over a zone runs
// the reader in a child node process of its own with `TZ` set, and the suite's own zone is never
// changed.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { entryOf } from '../../../../src/lib/server/machine/processes/table.ts';

const TABLE = fileURLToPath(
    new URL('../../../../src/lib/server/machine/processes/table.ts', import.meta.url)
);

/** The `started` of each line, read by a child node process whose zone is `zone`. */
function startedIn(zone: string, lines: string[]): (string | undefined)[] {
    const script = `
        const { entryOf } = await import(${JSON.stringify(TABLE)});
        const lines = ${JSON.stringify(lines)};
        console.log(JSON.stringify(lines.map((text) => entryOf(text)?.started)));
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
        env: { ...process.env, TZ: zone },
        encoding: 'utf8'
    });
    expect(run.status, run.stderr).toBe(0);
    return JSON.parse(run.stdout) as (string | undefined)[];
}

/** One `ps` line, every column, with the columns a case changes. */
function line(fields: Partial<Record<'head' | 'start' | 'command', string>> = {}): string {
    const {
        head = '  100     1 axel       1.5  2048',
        start,
        command = 'zsh -c source x'
    } = fields;
    return `${head} ${start ?? 'Wed Sep 30 08:15:42 2026'} ${command}`;
}

describe('entryOf', () => {
    it('reads the columns of one line into one row, the memory in bytes', () => {
        const row = entryOf(line());
        expect(row).toMatchObject({
            pid: 100,
            ppid: 1,
            user: 'axel',
            cpu: 1.5,
            memory: 2048 * 1024,
            command: 'zsh -c source x'
        });
        expect(Number.isNaN(Date.parse(row?.started ?? ''))).toBe(false);
    });

    it('reads a start with a one-digit day written with the space `ps` pads it with', () => {
        expect(startedIn('UTC', [line({ start: 'Thu Oct  2 11:53:00 2026' })])).toEqual([
            '2026-10-02T11:53:00.000Z'
        ]);
    });

    it.each([
        ['America/New_York', '2026-09-30T12:15:42.000Z'],
        ['Pacific/Auckland', '2026-09-29T19:15:42.000Z'],
        ['UTC', '2026-09-30T08:15:42.000Z']
    ])('writes started as the UTC instant of the local time in %s', (zoneName, instant) => {
        expect(startedIn(zoneName, [line()])).toEqual([instant]);
    });

    it('turns each start into an instant with the offset in force on its own date, whatever the offset now', () => {
        const before = line({ start: 'Sat Mar  7 12:00:00 2026' });
        const after = line({ start: 'Sun Mar  8 12:00:00 2026' });
        expect(startedIn('America/New_York', [before, after])).toEqual([
            '2026-03-07T17:00:00.000Z',
            '2026-03-08T16:00:00.000Z'
        ]);
        expect(
            startedIn('Europe/Amsterdam', [
                line({ start: 'Sat Oct 24 12:00:00 2026' }),
                line({ start: 'Sun Oct 25 12:00:00 2026' })
            ])
        ).toEqual(['2026-10-24T10:00:00.000Z', '2026-10-25T11:00:00.000Z']);
    });

    it('keeps the whole command line, its spaces and its arguments', () => {
        const rows = [
            line({ command: 'claude --resume x' }),
            line({ command: '/Applications/X.app/ChatGPT for Chrome chrome-extension://a' }),
            line({ command: 'node /usr/local/bin/codex' }),
            line({ command: 'python3 -c "print(1)"   two  spaces' })
        ].map((text) => entryOf(text)?.command);
        expect(rows).toEqual([
            'claude --resume x',
            '/Applications/X.app/ChatGPT for Chrome chrome-extension://a',
            'node /usr/local/bin/codex',
            'python3 -c "print(1)"   two  spaces'
        ]);
    });

    it('keeps the arguments of command lines with a colon, a quote and a path in them', () => {
        const commands = [
            'node /usr/local/bin/codex --model gpt:5',
            'codex exec "fix: the bug"',
            'claude --resume x --add-dir http://a',
            'python3 -m http.server --bind 127.0.0.1:8000'
        ];
        expect(commands.map((command) => entryOf(line({ command }))?.command)).toEqual(commands);
    });

    it('cuts a command line at 1000 characters with an ellipsis', () => {
        const long = entryOf(line({ command: `zsh ${'x'.repeat(2000)}` }))?.command ?? '';
        expect(long).toHaveLength(1000);
        expect(long.endsWith('...')).toBe(true);
        expect(long.startsWith('zsh xxx')).toBe(true);
        const exact = entryOf(line({ command: 'y'.repeat(1000) }))?.command ?? '';
        expect(exact).toHaveLength(1000);
        expect(exact.endsWith('...')).toBe(false);
    });

    it.each([
        ['an empty line', ''],
        ['a header', '  PID  PPID USER  %CPU   RSS STARTED COMMAND'],
        ['a line with no command', '  100     1 axel 1.5 2048 Wed Sep 30 08:15:42 2026'],
        ['a pid that is no number', line({ head: '  abc     1 axel 1.5 2048' })],
        ['a pid of 0', line({ head: '  0     1 axel 1.5 2048' })],
        ['a month that is no month', line({ start: 'Wed Foo 30 08:15:42 2026' })],
        ['a start that is no date', line({ start: 'Wed Feb 31 08:15:42 2026' })],
        ['a start with an hour of 25', line({ start: 'Wed Sep 30 25:15:42 2026' })],
        ['a cpu that is no number', line({ head: '  100     1 axel x 2048' })],
        ['a resident size that is no number', line({ head: '  100     1 axel 1.5 -4' })]
    ])('leaves out %s', (_name, text) => {
        expect(entryOf(text)).toBeNull();
    });

    it('reads a pid of the largest size a number holds and leaves out one past it', () => {
        expect(entryOf(line({ head: '  9007199254740991     1 axel 1.5 2048' }))?.pid).toBe(
            9007199254740991
        );
        expect(entryOf(line({ head: '  9007199254740993     1 axel 1.5 2048' }))).toBeNull();
    });
});
