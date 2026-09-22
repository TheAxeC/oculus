// Live HPC action tests cover the job id gate, cached-path shape, candidate ladder, and refusal before a runner is called.
import { describe, expect, it, vi } from 'vitest';
import { cancel, log, safePath, validId } from '../../../../src/lib/server/machine/hpc/actions.ts';
describe('HPC actions', () => {
    it('accepts only the decided id shape and safe absolute paths', () => {
        expect(validId('12_3.batch')).toBe(true);
        expect(validId('12;bad')).toBe(false);
        expect(safePath('/home/a/out.log')).toBe('/home/a/out.log');
        expect(safePath("/home/a'bad")).toBe('');
    });
    it('refuses a bad cancel without calling the runner', async () => {
        const runner = vi.fn();
        expect((await cancel('host', 'bad', runner)).status).toBe('error');
        expect(runner).not.toHaveBeenCalled();
    });
    it('uses the candidate ladder and parses its path marker', async () => {
        const runner = vi.fn((_host: string, _remote: string, _timeout: number) =>
            Promise.resolve({
                stdout: '@@oculus:logpath=/work/hpc/logs/42.out\nhello\n',
                stderr: '',
                code: 0
            })
        );
        const answer = await log('host', '42', new Map(), runner);
        expect(answer).toEqual({ status: 'ok', path: '/work/hpc/logs/42.out', log: 'hello' });
        expect(runner.mock.calls[0][1]).toContain('/hpc/logs/');
        // The search inside the remote command is bounded by its own `timeout 20`, and the call is
        // given little more than that, so a cold log never holds the page for the best part of a
        // minute.
        expect(runner.mock.calls[0][1]).toContain('timeout 20 ');
        expect(runner.mock.calls[0][2]).toBeLessThanOrEqual(25000);
        expect(runner.mock.calls[0][2]).toBeGreaterThan(20000);
    });
    it('feeds the remembered path to the remote script on the first press', async () => {
        const runner = vi.fn((_host: string, _remote: string, _timeout: number) =>
            Promise.resolve({
                stdout: '@@oculus:logpath=/work/one/logs/run-9.out\nhello\n',
                stderr: '',
                code: 0
            })
        );
        // What the prewarm resolved behind the page is what the first press asks the cluster about,
        // so that press costs a tail rather than the ladder.
        const paths = new Map([['9', '/work/one/logs/run-9.out']]);
        const answer = await log('host', '9', paths, runner);
        expect(answer.path).toBe('/work/one/logs/run-9.out');
        expect(runner.mock.calls[0][1]).toContain("p='/work/one/logs/run-9.out'");
    });
});
