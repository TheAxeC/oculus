// Layer 2, client-state tests. What a list or family editor sends and keeps: the one config-value
// write a Save makes with the row's value as its base, the draft being held in the tab's instance
// state under a key of its own, what each answer does to the draft, the watcher's push ending it, a
// second Save waiting, a closed tab being left alone, the gear's entries for each kind of row, and
// Reset Setting on a Modified list.
//
// What this does NOT cover: a press at the look, and the server's side of the write
// (tests/server/edit/config-value.test.ts).

import { describe, expect, it } from 'vitest';
import type { WriteAnswer } from '../../../../src/lib/state/shared/stores/shapes.ts';
import { gearEntries } from '../../../../src/lib/state/system/config/view/gear.ts';
import {
    applyEdit,
    draftOf,
    type Draft
} from '../../../../src/lib/state/system/config/editors/draft.ts';
import {
    savedDraft,
    withSavedDraft
} from '../../../../src/lib/state/system/config/editors/slots.ts';
import {
    createEditorWriter,
    type WriteConfigValue
} from '../../../../src/lib/state/system/config/editors/writer.ts';
import { SETTINGS_MESSAGES } from '../../../../src/lib/state/system/config/messages.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import {
    settingsTyped,
    typedText,
    withTypedText
} from '../../../../src/lib/state/system/config/typed.ts';
import { settle } from '../../../fixtures/client.ts';
import { rowOf, shipped, shippedRows, text } from './fixture.ts';

const BODY = 'waiting_status: [one, two, three]\n';

/** The waiting_status row over a text. */
function waiting(body = BODY): ConfigRow {
    const found = fileRows('behavior.yml', shipped['behavior.yml'], text(body)).rows.find(
        (row) => row.key === 'waiting_status'
    );
    if (found === undefined) throw new Error('no waiting_status row');
    return found;
}

function draftFor(row: ConfigRow): Draft {
    const draft = draftOf(row);
    if (draft === null) throw new Error('no draft');
    return draft;
}

/** A write that records its calls and answers when the test lets it. */
function recorder() {
    const calls: unknown[][] = [];
    const answers: ((answer: WriteAnswer) => void)[] = [];
    const write: WriteConfigValue = (file, key, value, base) => {
        calls.push([file, key, value, base]);
        return new Promise((resolve) => answers.push(resolve));
    };
    return {
        calls,
        write,
        answer: (one: WriteAnswer, at = answers.length - 1) => answers[at](one)
    };
}

const WROTE: WriteAnswer = { ok: true, changed: ['behavior.yml:waiting_status'], refused: [] };
const NOTHING: WriteAnswer = { ok: true, changed: [], refused: [] };

/** A writer over a recorder, with the draft slot the view would hold in the tab's state. */
function setup(holds = false) {
    const sent = recorder();
    const ended: string[] = [];
    let moves = 0;
    const writer = createEditorWriter(sent.write, {
        changed: () => {
            moves += 1;
        },
        ended: (row) => {
            ended.push(row.id);
        },
        held: () => holds
    });
    return { sent, ended, writer, moves: () => moves };
}

describe('a Save', () => {
    it('sends one config-value with the whole value and the row value as its base', () => {
        const { sent, writer } = setup();
        const row = waiting();
        let draft = draftFor(row);
        draft = applyEdit(draft, { do: 'add' });
        draft = applyEdit(draft, { do: 'set', index: 3, field: 'item', text: 'four' });
        draft = applyEdit(draft, { do: 'move', index: 3, by: -1 });
        draft = applyEdit(draft, { do: 'remove', index: 0 });
        void writer.save(row, draft);
        expect(sent.calls).toEqual([
            ['behavior.yml', 'waiting_status', ['two', 'four', 'three'], ['one', 'two', 'three']]
        ]);
    });

    it('sends nothing for a draft equal to the file', async () => {
        const { sent, writer } = setup();
        const row = waiting();
        await writer.save(row, draftFor(row));
        expect(sent.calls).toEqual([]);
    });

    it('sends nothing for a draft that does not read back', async () => {
        const { sent, writer } = setup();
        const row = waiting();
        await writer.save(row, applyEdit(draftFor(row), { do: 'add' }));
        expect(sent.calls).toEqual([]);
        expect(writer.sending(row)).toBe(false);
    });

    it('waits while the write is out: a second Save is not sent', () => {
        const { sent, writer } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        void writer.save(row, draft);
        expect(writer.sending(row)).toBe(true);
        void writer.save(row, draft);
        void writer.save(row, applyEdit(draft, { do: 'remove', index: 0 }));
        expect(sent.calls).toHaveLength(1);
    });

    it('is sendable again once the write is refused', async () => {
        const { sent, writer } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const first = writer.save(row, draft);
        sent.answer({
            ok: true,
            changed: [],
            refused: [{ field: 'behavior.yml:waiting_status', reason: 'No.' }]
        });
        await first;
        expect(writer.sending(row)).toBe(false);
        void writer.save(row, draft);
        expect(sent.calls).toHaveLength(2);
    });
});

describe('an answer', () => {
    it('keeps the draft and draws the refusal under the row', async () => {
        const { sent, writer, ended } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        sent.answer({
            ok: true,
            changed: [],
            refused: [{ field: 'behavior.yml:waiting_status', reason: 'Not that.' }]
        });
        await done;
        expect(writer.said(row)).toEqual({ key: SETTINGS_MESSAGES.refused, args: ['Not that.'] });
        expect(ended).toEqual([]);
        expect(writer.sending(row)).toBe(false);
    });

    it('reads a failure the way a single value row reads it', async () => {
        const { sent, writer } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        sent.answer({ ok: false, changed: [], refused: [], error: 'unwritable' });
        await done;
        expect(writer.said(row)).toEqual({
            key: SETTINGS_MESSAGES.unwritable,
            args: ['behavior.yml']
        });
        const again = writer.save(row, draft);
        sent.answer({ ok: false, changed: [], refused: [], error: 'x', network: true });
        await again;
        expect(writer.said(row)?.key).toBe(SETTINGS_MESSAGES.network);
    });

    it('takes the sentence away when the next Save is sent', async () => {
        const { sent, writer } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const first = writer.save(row, draft);
        sent.answer({ ok: false, changed: [], refused: [], error: 'unwritable' });
        await first;
        void writer.save(row, draft);
        expect(writer.said(row)).toBeNull();
    });
});

describe('the push of the file', () => {
    it('ends the draft when the file now holds the value that was sent', async () => {
        const { sent, writer, ended } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        sent.answer(WROTE);
        await done;
        // the answer alone does not end it: the draft is shown until the file holds the value
        expect(ended).toEqual([]);
        expect(writer.sending(row)).toBe(true);
        writer.pushed(waiting('waiting_status: [two, three]\n'));
        expect(ended).toEqual([row.id]);
        expect(writer.sending(row)).toBe(false);
        expect(writer.said(row)).toBeNull();
    });

    it('ends the draft with the file-changed sentence when the file holds another value', async () => {
        const { sent, writer, ended } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        sent.answer(WROTE);
        await done;
        writer.pushed(waiting('waiting_status: [elsewhere]\n'));
        expect(ended).toEqual([row.id]);
        expect(writer.said(row)?.key).toBe(SETTINGS_MESSAGES.changedSince);
        expect(writer.sending(row)).toBe(false);
    });

    it('ends a held draft with the dropped sentence when the push leaves the row undrawn', () => {
        const { writer, ended } = setup(true);
        const row = waiting();
        writer.pushed(waiting('waiting_status: [one, 2]\n'));
        expect(ended).toEqual([row.id]);
        expect(writer.said(row)?.key).toBe(SETTINGS_MESSAGES.draftDropped);
    });

    it('leaves a held draft alone when the push leaves the row drawn, and ends none held', () => {
        const held = setup(true);
        held.writer.pushed(waiting('waiting_status: [one, two]\n'));
        expect(held.ended).toEqual([]);
        const none = setup(false);
        none.writer.pushed(waiting('waiting_status: [one, 2]\n'));
        expect(none.ended).toEqual([]);
    });

    it('ends the draft when the push lands before the answer', async () => {
        const { sent, writer, ended } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        writer.pushed(waiting('waiting_status: [two, three]\n'));
        expect(ended).toEqual([row.id]);
        sent.answer(WROTE);
        await done;
        expect(ended).toEqual([row.id]);
        expect(writer.said(row)).toBeNull();
    });

    it('does nothing for a push that leaves the file as it was read', async () => {
        const { sent, writer, ended } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        sent.answer(WROTE);
        await done;
        writer.pushed(waiting());
        expect(ended).toEqual([]);
        expect(writer.sending(row)).toBe(true);
    });

    it('ends the draft at once when the write changed nothing', async () => {
        const { sent, writer, ended } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        sent.answer(NOTHING);
        await done;
        expect(ended).toEqual([row.id]);
        expect(writer.sending(row)).toBe(false);
    });
});

describe('a tab closed', () => {
    it('is left alone by an answer that arrives after it: no state written, nothing said', async () => {
        const { sent, writer, ended, moves } = setup();
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const done = writer.save(row, draft);
        const before = moves();
        writer.close();
        sent.answer(WROTE);
        await done;
        await settle();
        expect(moves()).toBe(before);
        expect(ended).toEqual([]);
        expect(writer.said(row)).toBeNull();
        writer.pushed(waiting('waiting_status: [two, three]\n'));
        expect(ended).toEqual([]);
    });

    it('is left alone by the answer of an older write when a newer one is out', async () => {
        const { sent, writer } = setup();
        const row = waiting();
        const first = writer.save(row, applyEdit(draftFor(row), { do: 'remove', index: 0 }));
        // the file takes another value, which ends the first write's draft
        const moved = waiting('waiting_status: [two]\n');
        writer.pushed(moved);
        writer.clear(moved);
        const second = writer.save(moved, applyEdit(draftFor(moved), { do: 'remove', index: 0 }));
        expect(writer.sending(moved)).toBe(true);
        sent.answer(
            {
                ok: true,
                changed: [],
                refused: [{ field: 'behavior.yml:waiting_status', reason: 'Old.' }]
            },
            0
        );
        await first;
        expect(writer.sending(moved)).toBe(true);
        expect(writer.said(moved)).toBeNull();
        sent.answer(WROTE, 1);
        await second;
    });

    it('sends nothing once closed', async () => {
        const { sent, writer } = setup();
        const row = waiting();
        writer.close();
        await writer.save(row, applyEdit(draftFor(row), { do: 'remove', index: 0 }));
        await writer.reset(row);
        expect(sent.calls).toEqual([]);
    });
});

describe('the draft held in the tab', () => {
    it('is there again from the tab state, and gone once discarded', () => {
        const row = waiting();
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        const held = withSavedDraft({}, row.file, row.key, draft);
        // a remount reads the state back through a copy, as a reload would
        const remounted = JSON.parse(JSON.stringify(held)) as typeof held;
        expect(savedDraft(remounted, row.file, row.key)).toEqual(draft);
        const discarded = withSavedDraft(held, row.file, row.key, null);
        expect(savedDraft(discarded, row.file, row.key)).toBeUndefined();
        expect(settingsTyped(discarded)).toBe(false);
    });

    it('counts as unsaved text while it is held', () => {
        const row = waiting();
        const held = withSavedDraft({}, row.file, row.key, draftFor(row));
        expect(settingsTyped(held)).toBe(true);
    });

    it('is taken as no draft when what the state holds is not one', () => {
        for (const bad of [null, 5, 'x', [], { editors: 3 }, { editors: [{ file: 1 }] }]) {
            expect(savedDraft(bad, 'behavior.yml', 'waiting_status')).toBeUndefined();
        }
        const spoiled = {
            editors: [{ file: 'behavior.yml', key: 'waiting_status', draft: { form: 'nonsense' } }]
        };
        expect(savedDraft(spoiled, 'behavior.yml', 'waiting_status')).toBeUndefined();
    });

    it('keeps the drafts of two keys apart, and never meets the typed text of the same file and key', () => {
        const row = waiting();
        const draft = draftFor(row);
        let state: Record<string, unknown> = withTypedText({}, row.file, row.key, 'typed');
        state = withSavedDraft(state, row.file, row.key, draft);
        state = withSavedDraft(state, row.file, 'data_domains', draft);
        expect(typedText(state, row.file, row.key)).toBe('typed');
        expect(savedDraft(state, row.file, row.key)).toEqual(draft);
        state = withSavedDraft(state, row.file, row.key, null);
        expect(typedText(state, row.file, row.key)).toBe('typed');
        expect(savedDraft(state, row.file, 'data_domains')).toEqual(draft);
        state = withTypedText(state, row.file, row.key, null);
        expect(savedDraft(state, row.file, 'data_domains')).toEqual(draft);
    });
});

describe('the gear', () => {
    const rows = (): ConfigRow[] => shippedRows();

    it('offers Reset Setting on a Modified list, which is the only row with a default to write', () => {
        const row = waiting('waiting_status: [one]\n');
        expect(row.modified).toBe(true);
        expect(gearEntries(row)).toEqual(['reset', 'copy']);
    });

    it('offers Copy Setting ID alone on a list at its default', () => {
        const row = rowOf(rows(), (one) => one.id === 'behavior.yml:waiting_status');
        expect(row.modified).toBe(false);
        expect(gearEntries(row)).toEqual(['copy']);
    });

    it('offers no Reset on a family, whatever its flag', () => {
        const family = rowOf(rows(), (one) => one.id === 'behavior.yml:usage_tiers');
        expect(gearEntries(family)).toEqual(['copy']);
        expect(gearEntries({ ...family, modified: true })).toEqual(['copy']);
    });

    it('offers no Reset on a row the file does not hold', () => {
        const row = rowOf(
            fileRows('behavior.yml', shipped['behavior.yml'], text('other: 1\n')).rows,
            (one) => one.key === 'waiting_status'
        );
        expect(row.state).toBe('missing');
        expect(gearEntries(row)).toEqual(['copy']);
    });

    it('keeps what a single value row and a This browser row were offered', () => {
        const single = rowOf(
            fileRows('behavior.yml', shipped['behavior.yml'], text('slurm:\n    poll_min: 99\n'))
                .rows,
            (one) => one.control === 'number' && one.state === 'set'
        );
        expect(single.modified).toBe(true);
        expect(gearEntries(single)).toEqual(['reset', 'copy']);
        const browser = {
            kind: 'browser',
            id: 'this-browser:x',
            modified: true
        } as unknown as Parameters<typeof gearEntries>[0];
        expect(gearEntries(browser)).toEqual(['reset']);
        expect(gearEntries({ ...browser, modified: false })).toEqual([]);
    });
});

describe('Reset Setting on a list', () => {
    it('writes the catalog default through config-value with the file value as its base', () => {
        const { sent, writer } = setup();
        const row = waiting('waiting_status: [one]\n');
        void writer.reset(row);
        expect(sent.calls).toEqual([['behavior.yml', 'waiting_status', row.default, ['one']]]);
    });

    it('writes nothing for a row at its default, and nothing for a family', async () => {
        const { sent, writer } = setup();
        const row = rowOf(shippedRows(), (one) => one.id === 'behavior.yml:waiting_status');
        await writer.reset(row);
        const family = rowOf(shippedRows(), (one) => one.id === 'behavior.yml:usage_tiers');
        await writer.reset({ ...family, modified: true });
        expect(sent.calls).toEqual([]);
    });
});
