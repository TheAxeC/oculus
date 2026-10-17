// Layer 2, client state tests. The lines the update tray's Schedules section draws first
// (state/system/machine/schedules/schedule.svelte.ts `unread`, drawn by
// shell/rail/ScheduleList.svelte): while the `schedule` payload carries tmux's words as `waiting`,
// a line says that no schedule runs because tmux lists no terminal, with those words; with none,
// no such line is drawn.
//
// It does not cover the line's place in the tray, which the look does.

import { describe, expect, it } from 'vitest';
import { createSchedule } from '../../../src/lib/state/system/machine/schedules/schedule.svelte.ts';
import type { EntitiesStore, WritesStore } from '../../../src/lib/state/shared/stores/shapes.ts';
import type { SchedulePayload } from '../../../src/lib/data/model/index.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { TEXT } from '../../server/text.ts';

setCatalog(TEXT);

const TOO_LONG = 'error connecting to /a/long/tmux/folder/default (File name too long)';

/** The tray's first lines over a payload with no schedule and the given `waiting`. */
function linesOver(waiting: string | null): string[] {
    const payload: SchedulePayload = {
        schedules: [],
        commands: [],
        folders: [],
        tasks: null,
        unread: [],
        waiting
    };
    const entities = { schedule: () => payload } as unknown as EntitiesStore;
    return createSchedule(entities, {
        terminalById: () => null,
        writes: {} as WritesStore
    }).unread();
}

describe('the Schedules section of the tray', () => {
    it("says that no schedule runs while tmux lists no terminal, with tmux's words", () => {
        const lines = linesOver(TOO_LONG);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('tmux lists no terminal');
        expect(lines[0]).toContain(TOO_LONG);
    });

    it('says nothing of the terminals while the list reads', () => {
        expect(linesOver(null)).toEqual([]);
    });
});
