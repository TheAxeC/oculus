// Layer 4, server test. A command scheduled through POST /api/schedules runs on its due time
// without a question: the save approves the chain the dialog listed, in the approvals file the
// start checks, once the schedules file is written; a save whose listed chain is not the one the
// commands file holds, and a save refused after its checks, approve nothing; and a chain whose text
// was changed by hand after the save is refused at its due time, with the sentence that says where
// to approve it. Every case runs over a scratch world, a
// recording tmux and a fake clock set a week before the real day, so nothing reaches tmux, the
// home folder or `local.yml`. What this does not cover: the dialog that lists the chain
// (tests/shell/rail/schedule-dialog.test.ts) and the command form's own Save
// (tests/routes/machine/commands.test.ts).
// @module-tag slow: a due-time case runs over the 5 s limit on a loaded machine.

import { existsSync, writeFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import {
    chainText,
    isApproved
} from '../../../../../src/lib/server/machine/approvals/approvals.ts';
import { loadRecord } from '../../../../../src/lib/server/machine/runs/schedules/record.ts';
import { handleSchedules } from '../../../../../src/lib/server/machine/runs/schedules/routes.ts';
import type { SchedulesWatcher } from '../../../../../src/lib/server/machine/runs/schedules/watch.ts';
import { wordSentence } from '../../../../../src/lib/state/system/machine/schedules/schedule-words.ts';
import { pagePost } from '../../../../fixtures/doubles.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { tmux } from '../../../../routes/sessions/terminal-fixture.ts';
import { installRealText } from '../../../../views/shared/real-text.ts';
import {
    plantCommands,
    routeOptions,
    watcherOver,
    world,
    type World
} from './schedules-fixture.ts';

const TOKEN = 'the write token of this test';

/** The command the cases schedule, with a line the world has not approved. */
const DEPLOY = '  - name: deploy\n    run: echo deployed\n';

/** The real day, read before any test installs the fake clock. */
const TODAY = new Date();

/** A local time seven days before the real day, at the given hour, minute and second. */
function local(hour: number, minute = 0, second = 0): Date {
    const day = new Date(TODAY);
    day.setDate(day.getDate() - 7);
    day.setHours(hour, minute, second, 0);
    return day;
}

const open: SchedulesWatcher[] = [];

beforeEach(() => {
    vi.useFakeTimers({ now: local(6, 59, 50) });
    installRealText();
});

afterEach(() => {
    for (const watcher of open.splice(0)) watcher.close();
    vi.useRealTimers();
});

/** A world whose commands file holds `deploy` alone, with a watcher over it and no sessions. */
function scene(): {
    w: World;
    hub: Hub;
    driver: ReturnType<typeof tmux>;
    watcher: SchedulesWatcher;
} {
    const w = world();
    plantCommands(w, DEPLOY);
    const hub = new Hub();
    hub.publish('sessions', { records: [], workspaces: [], terminals: [] });
    const driver = tmux();
    const watcher = watcherOver(w, hub, driver);
    open.push(watcher);
    return { w, hub, driver, watcher };
}

/** The chain the dialog lists for `deploy`. */
const LISTED = [{ folder: '.', run: 'echo deployed' }];

/**
 * Save the schedule `Daily deploy`, which runs `deploy` every day at 07:00, through the route, with
 * the chain the dialog listed.
 */
async function schedule(
    w: World,
    watcher: SchedulesWatcher,
    chain: { folder: string; run: string }[] = LISTED
): Promise<Response> {
    const entry = {
        name: 'Daily deploy',
        runs: { command: 'deploy', folder: w.repo },
        when: '0 7 * * *',
        paused: false,
        unattended: false
    };
    return handleSchedules(
        pagePost(
            'http://127.0.0.1:8791/api/schedules',
            {
                action: 'save',
                at: null,
                was: null,
                entry,
                chain
            },
            TOKEN
        ),
        TOKEN,
        routeOptions(w, watcher)
    );
}

/** Let the 07:00 due time pass and every promise the watcher waits on run. */
async function pastDue(): Promise<void> {
    await vi.advanceTimersByTimeAsync(20_000);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(200);
}

/** The run record's runs of the schedule, newest first. */
function runsOf(w: World): Record<string, unknown>[] {
    const loaded = loadRecord(w.files.record);
    return loaded.ok ? (loaded.logs.get('Daily deploy')?.runs ?? []) : [];
}

function started(driver: ReturnType<typeof tmux>): string[][] {
    return driver.calls.filter((args) => args.includes('new-session'));
}

describe('the approval of a scheduled command', () => {
    it('approves the chain when a plain entry is scheduled, and the due run starts', async () => {
        const { w, driver, watcher } = scene();
        const chain = chainText(w.repo, [{ folder: '.', run: 'echo deployed' }]);
        expect(isApproved(w.approvals, chain), 'before the save').toBe(false);
        expect(existsSync(w.files.schedules), 'a schedules file before the save').toBe(false);
        const response = await schedule(w, watcher);
        expect(await response.json()).toEqual({ ok: true });
        expect(isApproved(w.approvals, chain), 'after the save').toBe(true);
        await pastDue();
        expect(started(driver)).toHaveLength(1);
        expect(runsOf(w)[0]).toMatchObject({ trigger: 'schedule', outcome: 'started' });
    });

    it('refuses a save whose listed chain is not the chain the commands file holds, approving nothing', async () => {
        const { w, watcher } = scene();
        const response = await schedule(w, watcher, [{ folder: '.', run: 'echo staged' }]);
        expect(response.status).toBe(409);
        const answer = (await response.json()) as { error: string; names: string[] };
        expect(answer).toEqual({ error: 'chain-changed', names: ['deploy'] });
        expect(wordSentence(answer.error, answer.names)).toBe(
            'The lines of the command deploy changed since the dialog listed them; read them again and save.'
        );
        for (const run of ['echo deployed', 'echo staged']) {
            const text = chainText(w.repo, [{ folder: '.', run }]);
            expect(isApproved(w.approvals, text), run).toBe(false);
        }
        expect(existsSync(w.files.schedules), 'a schedules file after the refusal').toBe(false);
    });

    it('approves nothing when the save is refused after its checks', async () => {
        const { w, watcher } = scene();
        writeFileSync(`${w.files.record}.lock`, '');
        const answered = schedule(w, watcher);
        await vi.advanceTimersByTimeAsync(2500);
        const response = await answered;
        expect(await response.json()).toEqual({ error: 'record-locked', names: [] });
        expect(isApproved(w.approvals, chainText(w.repo, LISTED))).toBe(false);
        expect(existsSync(w.files.schedules), 'a schedules file after the refusal').toBe(false);
    });

    it('refuses at its due time an entry whose line was changed by hand after it was scheduled', async () => {
        const { w, driver, watcher } = scene();
        expect(await (await schedule(w, watcher)).json()).toEqual({ ok: true });
        plantCommands(w, '  - name: deploy\n    run: echo deployed elsewhere\n');
        watcher.reload();
        await pastDue();
        expect(started(driver)).toHaveLength(0);
        const run = runsOf(w)[0];
        expect(run).toMatchObject({
            trigger: 'schedule',
            outcome: 'failed',
            why: { word: 'needs-approval', names: ['deploy'] }
        });
        const why = run.why as { word: string; names: string[] };
        expect(wordSentence(why.word, why.names)).toBe(
            "The command deploy runs lines that are not approved; open Edit or Schedule... on it in its repository's command bar and save to approve them."
        );
    });
});
