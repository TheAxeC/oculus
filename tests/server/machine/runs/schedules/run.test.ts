// Layer 4, server test. What a schedule runs, started through the real `runEntry` with the
// recording tmux double, a stub path as the Claude program, scratch folders and a scratch
// repository whose `.oculus/commands.yml` holds the command a row runs: the argument vector of
// each of the three things a schedule runs, and the words a start that cannot happen is refused
// with. No case reaches tmux or `claude`, reads `local.yml` or the home folder; the paths are the
// ones the scratch world holds. What this does not cover: the session a real `claude` starts.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { ScheduleEntry } from '../../../../../src/lib/data/model/index.ts';
import { runEntry } from '../../../../../src/lib/server/machine/runs/schedules/run.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { lineOf, tmux } from '../../../../routes/sessions/terminal-fixture.ts';
import { TEXT } from '../../../text.ts';
import { CLAUDE, plantCommands, world, type World } from './schedules-fixture.ts';

const SIZE = { cols: 80, rows: 24 };

/** The sentence the Lit Watch task starts with, read through the catalog rather than typed. */
const LITWATCH = TEXT['server.task.update_task'].replace('{0}', '.oculus/tasks/litwatch.md');

const PROMPT = 'Summarise what is blocked';

/** An entry that runs `runs`, with the other fields at their defaults. */
function entry(runs: ScheduleEntry['runs'], unattended = false): ScheduleEntry {
    return { name: 'Weekly radar', runs, when: '0 7 * * 1', paused: false, unattended };
}

type Row = {
    name: string;
    /** The entry to run, from the scratch world. */
    entry: (w: World) => ScheduleEntry;
    /**
     * The entries of the repository's `.oculus/commands.yml` as YAML lines, when the row needs
     * others than the world's approved `sync`.
     */
    commands?: string;
    /** The roots the file browser serves at the start; the world's repository when absent. */
    roots?: (w: World) => string[];
    /** The answer and, for a start, what tmux was told. */
    expected:
        | { refused: (w: World) => { refused: string; names: string[] } }
        | { cwd: (w: World) => string; words: string[]; terminalName: string };
};

const ROWS: Row[] = [
    {
        name: 'an update task starts as a press does',
        entry: () => entry({ task: 'litwatch' }),
        expected: {
            cwd: (w) => w.hub,
            words: [`'${CLAUDE}' '${LITWATCH}'`],
            terminalName: 'task litwatch'
        }
    },
    {
        name: 'an unattended update task carries the flag before the sentence',
        entry: () => entry({ task: 'litwatch' }, true),
        expected: {
            cwd: (w) => w.hub,
            words: [`'${CLAUDE}' '--dangerously-skip-permissions' '${LITWATCH}'`],
            terminalName: 'task litwatch'
        }
    },
    {
        name: 'a prompt is one argument after --',
        entry: () => entry({ prompt: PROMPT, folder: 'hub' }),
        expected: {
            cwd: (w) => w.hub,
            words: [CLAUDE, '--', PROMPT],
            terminalName: 'Weekly radar'
        }
    },
    {
        name: 'an unattended prompt carries the flag before --',
        entry: () => entry({ prompt: PROMPT, folder: 'hub' }, true),
        expected: {
            cwd: (w) => w.hub,
            words: [CLAUDE, '--dangerously-skip-permissions', '--', PROMPT],
            terminalName: 'Weekly radar'
        }
    },
    {
        name: 'a prompt that is shell text and starts with a dash stays one argument',
        entry: () => entry({ prompt: '-p $(rm -rf /); echo "x"', folder: 'hub' }),
        expected: {
            cwd: (w) => w.hub,
            words: [CLAUDE, '--', '-p $(rm -rf /); echo "x"'],
            terminalName: 'Weekly radar'
        }
    },
    {
        name: 'a command of the commands file starts one task terminal named after it, in its repository',
        entry: (w) => entry({ command: 'sync', folder: w.repo }),
        expected: { cwd: (w) => w.repo, words: [], terminalName: 'sync' }
    },
    {
        name: 'a command chain that needs approval starts nothing',
        entry: (w) => entry({ command: 'sync', folder: w.repo }),
        commands:
            '  - name: build\n    run: echo built\n' +
            '  - name: sync\n    run: echo synced\n    depends_on: [build]\n',
        expected: { refused: () => ({ refused: 'needs-approval', names: ['sync'] }) }
    },
    {
        name: 'a command the commands file no longer holds is refused with command-unknown',
        entry: (w) => entry({ command: 'sync', folder: w.repo }),
        commands: '  - name: build\n    run: echo built\n',
        expected: { refused: () => ({ refused: 'command-unknown', names: ['sync'] }) }
    },
    {
        name: 'a prompt whose folder does not exist is refused with folder-missing',
        entry: (w) => entry({ prompt: PROMPT, folder: join(w.hub, 'nowhere') }),
        expected: {
            refused: (w) => ({ refused: 'folder-missing', names: [join(w.hub, 'nowhere')] })
        }
    },
    {
        name: 'a prompt whose folder is no longer a served root is refused with folder-not-served',
        entry: (w) => entry({ prompt: PROMPT, folder: join(w.repo, '..') }),
        roots: () => [],
        expected: {
            refused: (w) => ({ refused: 'folder-not-served', names: [join(w.repo, '..')] })
        }
    },
    {
        name: 'a prompt holding a control character is refused with prompt-control',
        entry: () => entry({ prompt: 'a\u0007b', folder: 'hub' }),
        expected: { refused: () => ({ refused: 'prompt-control', names: [] }) }
    }
];

describe('runEntry', () => {
    it('starts what a schedule runs, or refuses it with its word', async () => {
        for (const row of ROWS) {
            const w = world();
            if (row.commands !== undefined) plantCommands(w, row.commands);
            const driver = tmux();
            const roots = row.roots === undefined ? [w.repo] : row.roots(w);
            const answer = await runEntry(row.entry(w), SIZE, {
                run: driver.run,
                hub: w.hub,
                claudeBin: CLAUDE,
                text: TEXT,
                rootsFor: () => roots,
                approvalsFor: () => w.approvals
            });
            const created = driver.calls.filter((args) => args.includes('new-session'));
            if ('refused' in row.expected) {
                expect(answer, row.name).toEqual(row.expected.refused(w));
                expect(created, row.name).toHaveLength(0);
                continue;
            }
            expect(answer, row.name).toMatchObject({
                terminal: { name: row.expected.terminalName }
            });
            expect(created, row.name).toHaveLength(1);
            const [start] = created;
            expect(start[start.indexOf('-c') + 1], row.name).toBe(row.expected.cwd(w));
            if (row.expected.words.length > 0) {
                expect(lineOf(start), row.name).toEqual(row.expected.words);
            }
        }
    });
});
