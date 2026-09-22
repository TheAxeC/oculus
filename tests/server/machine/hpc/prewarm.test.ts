// Layer 4, test. The finished-job log-path prewarm over injected runners: the listing parse, the
// rung-by-rung pick, the shape of the batched script, and the two ways the cluster gives nothing.
import { describe, expect, it, vi } from 'vitest';
import {
    isFinished,
    listingCommand,
    parseListing,
    pickFromListing,
    prewarmLogs,
    PREWARM_DIRS,
    PREWARM_RUNGS
} from '../../../../src/lib/server/machine/hpc/prewarm.ts';
import type { RunResult, Runner } from '../../../../src/lib/server/machine/hpc/ssh.ts';

/** Two working directories in one listing, the first with a rung that matched nothing. */
const LISTING = [
    '@@oculus:wd=/work/one@@',
    '@@oculus:rung@@',
    '/work/one/hpc/logs/*',
    '@@oculus:rung@@',
    '/work/one/logs/run-9.out',
    '/work/one/logs/run-11.out',
    '@@oculus:rung@@',
    '/work/one/slurm-*.out',
    '@@oculus:rung@@',
    '/work/one/*.out',
    '@@oculus:rung@@',
    '/work/one/*/logs/*',
    '@@oculus:wd=/work/two@@',
    '@@oculus:rung@@',
    '/work/two/hpc/logs/12.out',
    '@@oculus:rung@@',
    '/work/two/logs/*',
    '@@oculus:rung@@',
    '/work/two/slurm-*.out',
    '@@oculus:rung@@',
    '/work/two/*.out',
    '@@oculus:rung@@',
    '/work/two/*/logs/*'
].join('\n');

/** The accounting answer for the ids a case asks about, in the two fields the query reads. */
const SACCT = "9|/work/one\n11|/work/one\n12|/work/two\n13|/work/'three";

function runnerFor(sacct: RunResult, listing: RunResult): ReturnType<typeof vi.fn<Runner>> {
    return vi.fn<Runner>((_host, remote) =>
        remote.startsWith('sacct') ? Promise.resolve(sacct) : Promise.resolve(listing)
    );
}
const ok = (stdout: string): RunResult => ({ stdout, stderr: '', code: 0 });

describe('the log-path prewarm', () => {
    it('reads one file list per rung out of a two-directory listing', () => {
        const perDir = parseListing(LISTING);
        expect([...perDir.keys()]).toEqual(['/work/one', '/work/two']);
        // A rung whose glob matched nothing prints the pattern back, and a line with a `*` in it is
        // a path that does not exist rather than a file.
        expect(perDir.get('/work/one')).toEqual([
            [],
            ['/work/one/logs/run-9.out', '/work/one/logs/run-11.out'],
            [],
            [],
            []
        ]);
        expect(perDir.get('/work/two')?.[0]).toEqual(['/work/two/hpc/logs/12.out']);
        expect(perDir.get('/work/two')).toHaveLength(PREWARM_RUNGS.length);
    });
    it('takes the first rung that matches and refuses to guess inside one', () => {
        const rungs = [
            ['/w/hpc/logs/532076_1.out', '/w/hpc/logs/532076_2.out'],
            ['/w/logs/532076.out'],
            [],
            [],
            []
        ];
        // Two files carry the id on the first rung and a listing has no modification times, so the
        // ladder's newest-wins tiebreak cannot be reproduced and the job is left to the press.
        expect(pickFromListing('532076', rungs)).toBe('');
        expect(pickFromListing('532076_2', rungs)).toBe('/w/hpc/logs/532076_2.out');
        // The literal rung takes the job's own file and not another job's whose name carries the
        // id.
        expect(pickFromListing('7', [[], [], ['/w/slurm-7.out', '/w/slurm-17.out'], [], []])).toBe(
            '/w/slurm-7.out'
        );
        expect(pickFromListing('7', [[], [], [], ['/w/7.log', '/w/7.out'], []])).toBe('/w/7.out');
    });
    it('names every working directory once and times each rung on the cluster', () => {
        const command = listingCommand(['/work/one', '/work/two']);
        expect(command.match(/@@oculus:wd=/g)).toHaveLength(2);
        expect(command.match(/@@oculus:rung@@/g)).toHaveLength(2 * PREWARM_RUNGS.length);
        for (const rung of PREWARM_RUNGS) {
            expect(command).toContain(
                `timeout 15 sh -c 'printf "%s\\n" "$1"/${rung}' _ '/work/one'`
            );
        }
    });
    it('hands the directory to the remote shell as text, on the marker as on the rungs', () => {
        const command = listingCommand(['/work/$USER/x']);
        expect(command).toContain("echo '@@oculus:wd=/work/$USER/x@@'");
        for (const rung of PREWARM_RUNGS) {
            expect(command).toContain(
                `timeout 15 sh -c 'printf "%s\\n" "$1"/${rung}' _ '/work/$USER/x'`
            );
        }
        // What that marker prints is the directory itself, which is what the parse reads back.
        expect([...parseListing('@@oculus:wd=/work/$USER/x@@\n@@oculus:rung@@').keys()]).toEqual([
            '/work/$USER/x'
        ]);
    });
    it('lists no more directories than one cycle is given, most jobs first', async () => {
        const five = ['/work/e', '/work/d', '/work/c', '/work/b', '/work/a'];
        const sacct = five.map((dir, at) => `${at + 1}|${dir}`).join('\n');
        const runner = runnerFor(ok(sacct), ok(''));
        await prewarmLogs('host', ['1', '2', '3', '4', '5'], 3, runner);
        const listed = runner.mock.calls[1][1];
        // One job each, so the tie is settled by name and the fifth waits for the next cycle.
        for (const dir of ['/work/a', '/work/b', '/work/c', '/work/d']) {
            expect(listed).toContain(`echo '@@oculus:wd=${dir}@@'`);
        }
        expect(listed).not.toContain('/work/e');
        expect(runner.mock.calls[1][2]).toBe(PREWARM_DIRS * PREWARM_RUNGS.length * 15000 + 15000);
        // The id whose directory was left out is not held, so the next cycle asks about it alone.
        const next = runnerFor(ok('1|/work/e'), ok(''));
        await prewarmLogs('host', ['1'], 3, next);
        expect(next.mock.calls[1][1]).toContain("echo '@@oculus:wd=/work/e@@'");
        expect(next.mock.calls[1][2]).toBe(PREWARM_RUNGS.length * 15000 + 15000);
    });
    it('puts the directory holding the most jobs first', async () => {
        const sacct = ['1|/work/z', '2|/work/z', '3|/work/a', '4|/work/z', '5|/work/a'].join('\n');
        const runner = runnerFor(ok(sacct), ok(''));
        await prewarmLogs('host', ['1', '2', '3', '4', '5'], 3, runner);
        const listed = runner.mock.calls[1][1];
        expect(listed.indexOf('/work/z')).toBeLessThan(listed.indexOf('/work/a'));
    });
    it('takes the deepest rung when the ones above it are empty', () => {
        expect(pickFromListing('9', [[], [], [], [], ['/w/run/logs/9.txt']])).toBe(
            '/w/run/logs/9.txt'
        );
    });
    it('resolves the jobs it can and omits the rest', async () => {
        const runner = runnerFor(ok(SACCT), ok(LISTING));
        const found = await prewarmLogs('host', ['9', '11', '12', '13', 'bad;id'], 3, runner);
        expect([...found]).toEqual([
            ['9', '/work/one/logs/run-9.out'],
            ['11', '/work/one/logs/run-11.out'],
            ['12', '/work/two/hpc/logs/12.out']
        ]);
        expect(runner).toHaveBeenCalledTimes(2);
        expect(runner.mock.calls[0][1]).toContain('-o JobID,WorkDir%600 -Pn');
        // A working directory a quoted shell word could break out of is dropped, so 13 is never
        // listed.
        expect(runner.mock.calls[1][1]).not.toContain('three');
    });
    it('omits a job whose directory answered nothing', async () => {
        const runner = runnerFor(ok('9|/work/one'), ok('@@oculus:wd=/work/one@@\n@@oculus:rung@@'));
        expect([...(await prewarmLogs('host', ['9'], 3, runner))]).toEqual([]);
    });
    it('gives nothing when the accounting query fails, and asks for no listing', async () => {
        const failed = runnerFor({ stdout: '', stderr: 'sacct: error', code: 1 }, ok(LISTING));
        expect((await prewarmLogs('host', ['9'], 3, failed)).size).toBe(0);
        expect(failed).toHaveBeenCalledTimes(1);
        const refused = vi.fn<Runner>(() => Promise.reject(new Error('timeout')));
        expect((await prewarmLogs('host', ['9'], 3, refused)).size).toBe(0);
    });
    it('counts an end state as finished and a job still finishing as not', () => {
        for (const state of ['COMPLETED', 'FAILED', 'TIMEOUT', 'OUT_OF_MEMORY', 'NODE_FAIL']) {
            expect(isFinished(state)).toBe(true);
        }
        expect(isFinished('CANCELLED by 12345')).toBe(true);
        expect(isFinished('COMPLETING')).toBe(false);
        expect(isFinished('RUNNING')).toBe(false);
    });
    it('asks the cluster nothing when no id is worth asking about', async () => {
        const runner = runnerFor(ok(SACCT), ok(LISTING));
        expect((await prewarmLogs('host', ['bad;id'], 3, runner)).size).toBe(0);
        expect(runner).not.toHaveBeenCalled();
    });
});

describe('parseListing over a directory ending in an @ sign', () => {
    it('reads the directory whole, since only the marker closes with two', () => {
        const out = [
            '@@oculus:wd=/work/box@@@',
            '@@oculus:rung@@',
            '/work/box@/hpc/logs/9.out'
        ].join('\n');
        const perDir = parseListing(out);
        expect([...perDir.keys()]).toEqual(['/work/box@']);
        expect(perDir.get('/work/box@')).toEqual([['/work/box@/hpc/logs/9.out']]);
    });
});
