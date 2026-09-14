// Live HPC poller coverage uses injected runners only: start, success, timeout, forced refresh, and timer closure never open ssh.
import { describe, expect, it, vi } from 'vitest';
import { Hub } from '../../../src/lib/server/channels.ts';
import { SEC_RC, SEC_SACCT, SEC_SINFO } from '../../../src/lib/server/hpc/parse.ts';
import { watchHpc } from '../../../src/lib/server/hpc/poll.ts';

const options = { host: 'fixture', days: 3, pollMin: 20, quotaMin: 60, prewarm: true };
describe('watchHpc', () => {
    it('publishes starting, parsed data, refreshes, and closes timers', async () => {
        vi.useFakeTimers();
        const hub = new Hub();
        const runner = vi.fn((_h, remote: string) =>
            Promise.resolve(
                remote.startsWith('quota')
                    ? { stdout: '', stderr: '', code: 0 }
                    : {
                          stdout: `1|x|cpu|RUNNING|1|2|1|1||1G|1||n\n${SEC_RC}0@@\n${SEC_SACCT}\n${SEC_SINFO}\ncpu|up|1|idle|(null)`,
                          stderr: '',
                          code: 0
                      }
            )
        );
        const watcher = watchHpc(hub, { ...options, runner });
        expect((hub.latest('hpc')?.payload as { status: string }).status).toBe('starting');
        await Promise.resolve();
        await Promise.resolve();
        await watcher.refresh();
        expect((hub.latest('hpc')?.payload as { running: number }).running).toBe(1);
        await watcher.refresh();
        expect(runner).toHaveBeenCalled();
        watcher.close();
        vi.useRealTimers();
    });
    it('marks a timeout unreachable', async () => {
        const hub = new Hub();
        const watcher = watchHpc(hub, {
            ...options,
            runner: () => Promise.reject(new Error('timeout'))
        });
        await watcher.refresh();
        expect((hub.latest('hpc')?.payload as { status: string }).status).toBe('unreachable');
        watcher.close();
    });
});
