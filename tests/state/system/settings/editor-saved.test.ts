// Layer 2, client state tests. The family editor's writes (state/system/config/editors/writer.ts):
// an edit whose draft reads back is held as an unsaved change of the scope on screen, the editor
// showing the value held, and nothing is written until the scope's Save; a draft equal to the
// row's value drops the change; once the Save has left the file holding the value and no change is
// held, the push of the row ends the draft, and a push that brings another value while the change
// is held keeps it. The emptied `read_limits` family is the case, and the scope's changes are a
// stage held in memory. Reset of a family the workspace file sets holds the taking out and shows
// the default. A draft held for a hub other than the primary is kept under that hub, and while
// the hub's settings are being read the row's item (settings/Item.svelte, rendered on the server)
// draws neither the draft nor the primary's value, so the draft is not drawn stale.
//
// It does not cover the line the editor draws, nor the empty family's line, which the look does,
// nor the server's write of the emptied family into the workspace file as every one of oculus's
// keys set to null (tests/server/edit/config-value.test.ts).

import { describe, expect, it, vi } from 'vitest';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    applyEdit,
    draftOf,
    type Draft
} from '../../../../src/lib/state/system/config/editors/draft.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import type { Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import {
    savedBase,
    savedDraft,
    slotOf,
    withSavedDraft
} from '../../../../src/lib/state/system/config/editors/slots.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import type { HubRead } from '../../../../src/lib/state/system/config/view/hub-settings.svelte.ts';
import { emptyClient } from '../../../fixtures/client.ts';
import { drawnItem, memoryStage } from '../../../views/system/workbench/workbench-fixture.ts';
import { LAB_READ, STAGES, hubRowOf, shipped, text } from './fixture.ts';

const FILE = 'behavior.yml';

/** The Settings tab the items are drawn in. */
const TAB = 'settings-1';

/** The sentence of a draft started over a value the file no longer holds. */
const STALE = t('workbench.settings_changed_since');

/** The `read_limits` row with `value` in force and a workspace file holding `settings`. */
function limits(value: unknown, settings = ''): ConfigRow {
    const row = fileRows(
        FILE,
        shipped[FILE],
        { read_limits: value },
        { workspace: { root: 'hub', path: '.oculus/workspaces/w.yml', text: text(settings) } }
    ).rows.find((one) => one.key === 'read_limits');
    if (row === undefined) throw new Error('no read_limits row');
    return row;
}

/**
 * A writer over a stage in memory, the tab holding `held` as the row's draft (the draft of
 * `{ next: 300 }` unless given), the file moved under the draft when `stale` says so.
 */
function writerOf(stale = false, held?: Draft) {
    const stage = memoryStage();
    const ended = vi.fn();
    const writer = createEditorWriter({
        stage,
        changed: () => undefined,
        ended,
        held: () => held ?? draftOf(limits({ next: 300 })) ?? undefined,
        stale: () => stale,
        lists: () => ({}) as Lists
    });
    return { writer, stage, ended };
}

/** The `read_limits` draft with its one entry removed. */
function emptiedOf(row: ConfigRow) {
    const draft = draftOf(row);
    if (draft === null) throw new Error('no draft');
    return { draft, emptied: applyEdit(draft, { do: 'remove', index: 0 }) };
}

describe('a family whose last entry is removed', () => {
    it('is held as an unsaved change of the scope, shown, and written by nothing', () => {
        const row = limits({ next: 300 });
        const { emptied } = emptiedOf(row);
        const { writer, stage, ended } = writerOf();
        writer.save(row, emptied);
        expect(stage.held(row)).toEqual({ value: {} });
        expect([writer.unsaved(row), writer.shown(row)]).toEqual([true, {}]);
        expect(ended).not.toHaveBeenCalled();
    });

    it("drops the change when the draft is the row's value again", () => {
        const row = limits({ next: 300 });
        const { draft, emptied } = emptiedOf(row);
        const { writer, stage } = writerOf();
        writer.save(row, emptied);
        writer.save(row, draft);
        expect([stage.held(row), writer.unsaved(row)]).toEqual([undefined, false]);
    });

    it('holds no change for a family no layer gives a value, an entry added and removed again', () => {
        const row = limits(undefined);
        const empty = draftOf(row);
        if (empty === null) throw new Error('no draft');
        const added = applyEdit(empty, { do: 'add' });
        const { writer, stage } = writerOf();
        writer.save(row, applyEdit(added, { do: 'remove', index: 0 }));
        expect([row.state, stage.held(row)]).toEqual(['missing', undefined]);
    });

    it("ends the draft at the push once the scope's Save left the file holding it", () => {
        const row = limits({ next: 300 });
        const { emptied } = emptiedOf(row);
        const { writer, stage, ended } = writerOf(false, emptied);
        writer.save(row, emptied);
        stage.drop(row);
        writer.pushed({ ...limits({}), value: {} });
        expect(ended).toHaveBeenCalledTimes(1);
    });

    it('keeps the change held when a push brings another value', () => {
        const row = limits({ next: 300 });
        const { emptied } = emptiedOf(row);
        const { writer, stage, ended } = writerOf();
        writer.save(row, emptied);
        writer.pushed(limits({ next: 500 }));
        expect([stage.held(row), ended.mock.calls]).toEqual([{ value: {} }, []]);
    });

    it('holds a kept draft again at a push, unless the file moved from the value it was started over', () => {
        const kept = writerOf();
        kept.writer.pushed(limits({ next: 500 }));
        expect(kept.stage.held(limits({ next: 500 }))).toEqual({ value: { next: 300 } });
        const moved = writerOf(true);
        moved.writer.pushed(limits({ next: 500 }));
        expect(moved.stage.held(limits({ next: 500 }))).toBeUndefined();
    });
});

describe('a draft made in the Hub scope of a hub other than the primary', () => {
    /** The `read_limits` row with `value` in force, in the Hub scope of `lab`. */
    const lab = (value: unknown): ConfigRow => ({ ...limits(value), hub: 'lab', slot: 'lab' });

    it("is kept under lab, drawn again in lab's scope, and never shown on the primary's row", () => {
        const row = lab({ next: 300 });
        const { draft, emptied } = emptiedOf(row);
        const state = withSavedDraft({}, slotOf(row), emptied, row.value);
        expect(savedDraft(state, row)).toEqual(emptied);
        expect(savedDraft(state, limits({ next: 300 }))).toBeUndefined();
        const both = withSavedDraft(state, slotOf(limits({ next: 300 })), draft, { next: 300 });
        expect([savedDraft(both, row), savedDraft(both, limits({ next: 300 }))]).toEqual([
            emptied,
            draft
        ]);
        expect(savedBase(both, slotOf(row))).toEqual({ next: 300 });
    });

    it("holds its change under lab, apart from the primary's row of the same key", () => {
        const row = lab({ next: 300 });
        const { emptied } = emptiedOf(row);
        const { writer, stage } = writerOf();
        writer.save(row, emptied);
        expect([stage.held(row), stage.held(limits({ next: 300 }))]).toEqual([
            { value: {} },
            undefined
        ]);
        expect(writer.unsaved(limits({ next: 300 }))).toBe(false);
    });
});

describe("a draft held for lab while lab's settings are being read", () => {
    /**
     * The stages row of lab's Hub scope, as the Settings view draws it with lab's settings `read`.
     */
    const lab = (read: HubRead): ConfigRow => hubRowOf(STAGES, { hub: 'lab', read });

    it('is kept, not drawn stale nor offered for discard, and drawn again once they are read', () => {
        const ready = lab(LAB_READ);
        const draft = draftOf(ready);
        if (draft === null) throw new Error('no draft');
        const edited = applyEdit(draft, { do: 'remove', index: 0 });
        const client = emptyClient();
        client.ui.setInstanceState(TAB, withSavedDraft({}, slotOf(ready), edited, ready.value));
        const reading = drawnItem(lab({ state: 'loading' }), client, TAB);
        expect(reading).toContain(t('workbench.settings_hub_loading', 'lab'));
        for (const absent of [STALE, t('settings.editor_discard'), 'data-editor=']) {
            expect(reading).not.toContain(absent);
        }
        expect(savedDraft(client.ui.instanceState(TAB), ready)).toEqual(edited);
        const read = drawnItem(ready, client, TAB);
        expect(read).toContain(t('settings.editor_discard'));
        expect(read).not.toContain(STALE);
    });
});

describe('Reset on a family', () => {
    it('holds the reset of a family the workspace file sets and shows the default', () => {
        const row = limits({ next: 300 }, 'settings:\n  read_limits: { next: 300 }\n');
        expect([row.own, row.line, row.modified]).toEqual([true, 2, true]);
        const { writer, stage, ended } = writerOf();
        writer.reset(row);
        expect(stage.held(row)).toEqual({ reset: true });
        expect(writer.shown(row)).toEqual(row.default);
        expect(ended).toHaveBeenCalledWith(row);
    });

    it('holds nothing for a family the workspace file does not set', () => {
        const row = limits(shipped[FILE].read_limits.default);
        expect([row.own, row.modified]).toEqual([false, false]);
        const { writer, stage } = writerOf();
        writer.reset(row);
        expect(stage.held(row)).toBeUndefined();
    });
});
