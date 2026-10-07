// Layer 4, server test. The run record of the schedules: a file that does not read is never
// written over, and a lock that stays taken is waited on under a fake clock and then refused, by
// the record and through the route, with neither file written. Every case runs over a scratch
// folder, so nothing reaches ~/.oculus. What this does not cover: the shape of a record that reads
// (the watcher suite writes and reads those), and a lock that goes stale.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    appendRun,
    claimDue,
    moveRecord,
    readPattern,
    settleRun
} from '../../../../../src/lib/server/machine/runs/schedules/record.ts';
import type { ScheduleRun } from '../../../../../src/lib/data/model/index.ts';
import { handleSchedules } from '../../../../../src/lib/server/machine/runs/schedules/routes.ts';
import type { SchedulesWatcher } from '../../../../../src/lib/server/machine/runs/schedules/watch.ts';
import { pagePost } from '../../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { entryText, plantSchedules, routeOptions, world } from './schedules-fixture.ts';

const RUN: ScheduleRun = {
    trigger: 'schedule',
    due: '2026-10-06T05:00:00.000Z',
    at: '2026-10-06T05:00:00.412Z',
    outcome: 'started',
    terminal: null
};

/** Longer than the record's lock wait, so a lock that stays taken is given up on. */
const PAST_THE_WAIT_MS = 2500;

const TOKEN = 'the write token of this test';

describe('the run record', () => {
    it('refuses a write over a schedule record it cannot read, leaving it', async () => {
        const dir = scratchDir('oculus-record-');
        const commit = vi.fn(() => true);
        for (const held of ['{', '{"Weekly radar": 5}', '[]']) {
            const file = join(dir, 'schedule.json');
            writeFileSync(file, held);
            const changes = [
                await readPattern(file, 'Weekly radar', '0 7 * * *'),
                await claimDue(file, 'Weekly radar', '0 7 * * *', RUN),
                await appendRun(file, 'Weekly radar', RUN),
                await settleRun(file, 'Weekly radar', RUN, { terminal: 'aabbcc-claude' }),
                await moveRecord(
                    file,
                    { rename: { from: 'Weekly radar', to: 'Daily radar' } },
                    commit
                ),
                await moveRecord(file, { drop: 'Weekly radar' }, commit)
            ];
            for (const change of changes)
                expect(change, held).toMatchObject({ ok: false, why: 'unread' });
            expect(readFileSync(file, 'utf8'), held).toBe(held);
            expect(existsSync(`${file}.lock`), held).toBe(false);
        }
        expect(commit).not.toHaveBeenCalled();
    });

    it('refuses a rename or a drop while the lock stays taken, committing nothing', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
        try {
            const w = world();
            plantSchedules(w, entryText(w, 'task'));
            const schedulesHeld = readFileSync(w.files.schedules, 'utf8');
            const held = JSON.stringify({
                'Weekly radar': { pattern: '0 7 * * *', since: RUN.at, handled: RUN.due, runs: [] }
            });
            writeFileSync(w.files.record, held);
            writeFileSync(`${w.files.record}.lock`, '');
            const commit = vi.fn(() => true);
            const moves = [
                { rename: { from: 'Weekly radar', to: 'Daily radar' } },
                { drop: 'Weekly radar' }
            ];
            for (const move of moves) {
                const moved = moveRecord(w.files.record, move, commit);
                await vi.advanceTimersByTimeAsync(PAST_THE_WAIT_MS);
                expect(await moved, JSON.stringify(move)).toMatchObject({
                    ok: false,
                    why: 'locked'
                });
            }
            expect(commit).not.toHaveBeenCalled();
            const reload = vi.fn();
            const schedules: SchedulesWatcher = { reload, runNow: vi.fn(), close: vi.fn() };
            const answered = handleSchedules(
                pagePost(
                    'http://127.0.0.1:8791/api/schedules',
                    { action: 'delete', at: 0, name: 'Weekly radar' },
                    TOKEN
                ),
                TOKEN,
                routeOptions(w, schedules)
            );
            await vi.advanceTimersByTimeAsync(PAST_THE_WAIT_MS);
            const response = await answered;
            expect(response.status).toBe(409);
            expect(await response.json()).toEqual({ error: 'record-locked', names: [] });
            expect(reload).not.toHaveBeenCalled();
            expect(readFileSync(w.files.schedules, 'utf8')).toBe(schedulesHeld);
            expect(readFileSync(w.files.record, 'utf8')).toBe(held);
            expect(existsSync(`${w.files.record}.lock`)).toBe(true);
        } finally {
            vi.useRealTimers();
        }
    });
});
