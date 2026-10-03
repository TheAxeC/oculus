// Layer 4, server test. The chain of commands one press runs, joined into the one line the task
// terminal runs, and that line run by a real `sh -c` with the folder change taken out.
//
// What this does NOT cover: which commands a press runs
// (tests/server/machine/commands/resolve.test.ts), and running the line
// (tests/server/machine/commands/run.test.ts hands it to the tmux double, and
// tests/server/machine/pty/task.test.ts to a real tmux).

import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { chainLine } from '../../../../src/lib/server/machine/commands/chain.ts';
import type { ProjectCommand } from '../../../../src/lib/data/model/index.ts';

const REPO = '/repo';

/** The token a start would mint. */
const T = 'k1';

function command(name: string, run: string, over: Partial<ProjectCommand> = {}): ProjectCommand {
    return { name, run, cwd: REPO, depends_on: [], source: 'file', ...over };
}

describe('chainLine', () => {
    it('joins each command as cd, a printed marker and the line, so a failure stops the chain', () => {
        const chain = [
            command('build', 'make'),
            command('test', 'make test', { cwd: `${REPO}/sub`, depends_on: ['build'] })
        ];
        expect(chainLine(chain, T)).toBe(
            "cd '/repo' && printf '%s\\n' 'k1 build' && make && cd '/repo/sub' && printf '%s\\n' 'k1 test' && make test"
        );
    });

    it('quotes a name and a folder that hold shell syntax', () => {
        const odd = command("a $(x) 'b'", 'true', { cwd: "/repo/it's" });
        const line = chainLine([odd], T);
        expect(line).toBe(`cd '/repo/it'"'"'s' && printf '%s\\n' 'k1 a $(x) '"'"'b'"'"'' && true`);
    });

    it('stops a chain whose command is a list of statements ending in a failure', () => {
        const chain = [command('one', 'echo one; false'), command('two', 'echo two')];
        const ran = spawnSync('sh', ['-c', chainLine(chain, T).replaceAll("cd '/repo' && ", '')], {
            encoding: 'utf8'
        });
        expect(ran.status).not.toBe(0);
        expect(ran.stdout.split('\n').filter((one) => one !== '')).toEqual(['k1 one', 'one']);
    });

    it('does not let a comment or a background mark swallow the rest of the chain', () => {
        const chain = [
            command('a', 'echo a # note'),
            command('b', 'echo b & wait'),
            command('c', 'echo c')
        ];
        const ran = spawnSync('sh', ['-c', chainLine(chain, T).replaceAll("cd '/repo' && ", '')], {
            encoding: 'utf8'
        });
        expect(ran.status).toBe(0);
        expect(ran.stdout.split('\n').filter((one) => one !== '')).toEqual([
            'k1 a',
            'a',
            'k1 b',
            'b',
            'k1 c',
            'c'
        ]);
    });

    it('closes the group of a line that ends in a backslash, so the next command still runs', () => {
        const chain = [command('a', 'echo one \\'), command('b', 'echo two')];
        const ran = spawnSync('sh', ['-c', chainLine(chain, T).replaceAll("cd '/repo' && ", '')], {
            encoding: 'utf8'
        });
        expect(ran.stderr).toBe('');
        expect(ran.status).toBe(0);
        expect(ran.stdout.split('\n').filter((one) => one !== '')).toEqual([
            'k1 a',
            'one',
            'k1 b',
            'two'
        ]);
    });

    it('runs the command after one with a ;, a # or a trailing backslash only when it succeeded', () => {
        for (const [ok, bad] of [
            ['echo ok; true', 'echo bad; false'],
            ['echo ok # note', 'false # note'],
            ['echo ok \\', 'false \\']
        ]) {
            const run = (first: string) =>
                spawnSync(
                    'sh',
                    [
                        '-c',
                        chainLine(
                            [command('one', first), command('two', 'echo two')],
                            T
                        ).replaceAll("cd '/repo' && ", '')
                    ],
                    { encoding: 'utf8' }
                );
            const passed = run(ok);
            expect(passed.status, ok).toBe(0);
            expect(passed.stdout, ok).toContain('two');
            const failed = run(bad);
            expect(failed.stdout, bad).not.toContain('two');
        }
    });

    it('does not run the rest of a ; list or the next command when the folder cannot be entered', () => {
        const chain = [
            command('one', 'echo first; echo second', { cwd: '/oculus-no-such-folder' }),
            command('two', 'echo two', { cwd: tmpdir() })
        ];
        const ran = spawnSync('sh', ['-c', chainLine(chain, T)], { encoding: 'utf8' });
        expect(ran.status).not.toBe(0);
        expect(ran.stdout).toBe('');
    });

    it('stops the chain when a plain command fails', () => {
        const chain = [command('bad', 'false'), command('never', 'echo never')];
        const line = chainLine(chain, T).replaceAll("cd '/repo' && ", '');
        const ran = spawnSync('sh', ['-c', line], { encoding: 'utf8' });
        expect(ran.status).not.toBe(0);
        expect(ran.stdout).not.toContain('never');
    });
});
