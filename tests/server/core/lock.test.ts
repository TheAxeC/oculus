// The lock file of lib/server/core/json.ts (`takeLock`): a lock left by a process that ended is
// taken over by one starter only when two find it at once. A second starter is run at the moment
// the first has read the left lock's process and asks whether it runs, which is the moment between
// the first starter judging the lock left and replacing it.
//
// Every file is under the system temporary directory. Nothing reads or writes ~/.oculus.

import { readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { dropLock, takeLock } from '../../../src/lib/server/core/json.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** A process id no process of this machine has: the highest free one under the system's limit. */
function endedPid(): number {
    for (let pid = 99_998; pid > 1; pid -= 1) {
        try {
            process.kill(pid, 0);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ESRCH') return pid;
        }
    }
    throw new Error('every process id is taken');
}

describe('the lock file', () => {
    it('is taken over by one of two starters that find it left by an ended process', async () => {
        const lock = join(scratchDir('oculus-lock-'), 'record.lock');
        writeFileSync(lock, `${hostname()} ${String(endedPid())}`);
        const waits = { retryMs: 5, waitMs: 20, staleMs: 60_000, tellWait: false };
        const kill = process.kill.bind(process);
        const started: { second?: ReturnType<typeof takeLock>; asked: boolean } = { asked: false };
        const spy = vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
            if (!started.asked) {
                started.asked = true;
                started.second = takeLock(lock, waits, 'second');
            }
            return kill(pid, signal);
        });
        try {
            const first = await takeLock(lock, waits, 'first');
            if (started.second === undefined) throw new Error('the second starter did not start');
            const answers = [first, await started.second].map((answer) =>
                answer.ok ? 'held' : answer.why
            );
            expect(answers.sort()).toEqual(['held', 'locked']);
            expect(readFileSync(lock, 'utf8')).toBe(`${hostname()} ${String(process.pid)}`);
        } finally {
            spy.mockRestore();
            dropLock(lock);
        }
    });
});
