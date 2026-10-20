// Layer 4, server test. The commands a schedule runs are read from each repository's
// `.oculus/commands.yml`: the payload lists the plain entries of the file, an entry that names a
// command the file does not hold or a file that does not read carries its problem, and a hand
// change of the file reaches the payload through the watcher. Every case runs over a scratch world
// and a recording tmux, so nothing reaches tmux, `claude` or the home folder. What this does not
// cover: the dialog that draws the list (the state suite reads that).

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import type { SchedulePayload } from '../../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import type { SchedulesWatcher } from '../../../../../src/lib/server/machine/runs/schedules/watch.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { tmux } from '../../../../routes/sessions/terminal-fixture.ts';
import {
    entryText,
    plantCommands,
    plantSchedules,
    SYNC,
    watcherOver,
    world,
    type World
} from './schedules-fixture.ts';

const open: SchedulesWatcher[] = [];

afterEach(() => {
    for (const watcher of open.splice(0)) watcher.close();
});

/** A watcher over the world, closed after the case. */
function watch(w: World, hub: Hub): SchedulesWatcher {
    const made = watcherOver(w, hub, tmux());
    open.push(made);
    return made;
}

/** The payload the watcher published last. */
function latest(hub: Hub): SchedulePayload {
    return hub.latest('schedule')?.payload as SchedulePayload;
}

/** Wait until the published payload satisfies `holds`, for at most five seconds. */
async function until(hub: Hub, holds: (payload: SchedulePayload) => boolean): Promise<void> {
    for (let waited = 0; waited < 5_000; waited += 50) {
        if (holds(latest(hub))) return;
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

describe('the commands a schedule runs', () => {
    it('lists the plain entries of the repository commands file', () => {
        const w = world();
        plantCommands(w, `${SYNC}  - name: watch\n    type: npm\n    script: dev\n`);
        const hub = new Hub();
        watch(w, hub);
        expect(latest(hub).commands).toEqual([{ folder: w.repo, name: 'sync' }]);
    });

    it('gives an entry the problem of a command the file does not hold or a file that does not read', () => {
        const w = world();
        plantCommands(w, '  - name: build\n    run: echo built\n');
        plantSchedules(w, entryText(w, 'command'));
        const hub = new Hub();
        const watcher = watch(w, hub);
        expect(latest(hub).schedules[0]?.problem).toEqual({
            word: 'command-missing',
            names: ['sync', w.repo]
        });
        writeFileSync(join(w.repo, '.oculus', 'commands.yml'), 'commands: [\n');
        watcher.reload();
        expect(latest(hub).schedules[0]?.problem).toEqual({
            word: 'commands-unread',
            names: [w.repo]
        });
        expect(latest(hub).commands).toEqual([]);
        expect(latest(hub).unread).toEqual([]);
    });

    it('reads a hand change of the commands file into the payload', async () => {
        const w = world();
        plantSchedules(w, entryText(w, 'command'));
        const hub = new Hub();
        watch(w, hub);
        expect(latest(hub).schedules[0]?.problem).toBeNull();
        plantCommands(w, '  - name: build\n    run: echo built\n');
        await until(hub, (payload) => payload.schedules[0]?.problem !== null);
        expect(latest(hub).schedules[0]?.problem).toEqual({
            word: 'command-missing',
            names: ['sync', w.repo]
        });
        expect(latest(hub).commands).toEqual([{ folder: w.repo, name: 'build' }]);
    });
});
