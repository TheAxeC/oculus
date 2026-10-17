// Layer 4, server test. The schedules while tmux lists no terminal (schedules/watch.ts): no due
// time is decided until a terminal list is read, and while the newest read of the list failed the
// `schedule` payload carries tmux's words as `waiting`, which the update tray says
// (state/system/machine/schedules/schedule.svelte.ts `unread`, `app.schedules.no_terminals`). A
// list read then clears it. The words are tmux's for a socket path longer than a Unix socket's
// limit. No case reaches tmux: the watcher is handed the recording tmux and a listing double.
//
// It does not cover the tray drawing the line, which the look does.

import { describe, expect } from 'vitest';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import type { SchedulePayload } from '../../../../../src/lib/data/model/index.ts';
import { it } from '../../../../fixtures/scratch.ts';
import { tmux } from '../../../../routes/sessions/terminal-fixture.ts';
import { entryText, plantSchedules, watcherOver, world } from './schedules-fixture.ts';

const TOO_LONG = 'error connecting to /a/long/tmux/folder/default (File name too long)';

/** The `waiting` of the newest `schedule` payload. */
function waitingOf(hub: Hub): string | null | undefined {
    return (hub.latest('schedule')?.payload as SchedulePayload | undefined)?.waiting;
}

describe('the schedules while no terminal list was read', () => {
    it("carry tmux's words while the list cannot be read, and none once a list is read", () => {
        const w = world();
        plantSchedules(w, entryText(w, 'task'));
        const hub = new Hub();
        let unreadable: string | null = null;
        let tell = (): void => undefined;
        const watcher = watcherOver(w, hub, tmux(), undefined, {
            unreadable: () => unreadable,
            onChange: (listener) => {
                tell = listener;
                return () => undefined;
            }
        });
        try {
            expect(waitingOf(hub)).toBeNull();
            unreadable = TOO_LONG;
            tell();
            expect(waitingOf(hub)).toBe(TOO_LONG);
            unreadable = null;
            hub.publish('sessions', { records: [], workspaces: [], terminals: [] });
            tell();
            expect(waitingOf(hub)).toBeNull();
        } finally {
            watcher.close();
        }
    });

    it('carry no words once a list was read, whatever a later read says', () => {
        const w = world();
        plantSchedules(w, entryText(w, 'task'));
        const hub = new Hub();
        hub.publish('sessions', { records: [], workspaces: [], terminals: [] });
        let tell = (): void => undefined;
        const watcher = watcherOver(w, hub, tmux(), undefined, {
            unreadable: () => TOO_LONG,
            onChange: (listener) => {
                tell = listener;
                return () => undefined;
            }
        });
        try {
            tell();
            expect(waitingOf(hub)).toBeNull();
        } finally {
            watcher.close();
        }
    });
});
