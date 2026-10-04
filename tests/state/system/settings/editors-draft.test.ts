// Layer 2, client-state tests. The draft a list or family editor holds: how the shipped value of
// each list and family (the rail and the page reset kept apart) is read into a draft of text fields
// and read back to the same value, how one line of YAML flow text is read, the edits a press makes
// (add, set, move, remove), and the problems that hold Save back.
//
// What this does NOT cover: the write the draft is sent through (editors-writer.test.ts and the
// server's config-value tests), and the editors drawn (tests/views/system/workbench/
// settings-editors.test.ts).

import { describe, expect, it } from 'vitest';
import { PAGES_ROW, RAIL_ROW } from '../../../../src/lib/state/system/config/groups.ts';
import { SETTINGS_MESSAGES } from '../../../../src/lib/state/system/config/messages.ts';
import {
    applyEdit,
    draftOf,
    draftValue,
    isEdited,
    type Draft
} from '../../../../src/lib/state/system/config/editors/draft.ts';
import { flowText, readFlow } from '../../../../src/lib/state/system/config/editors/flow.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import { rowOf, shipped, shippedRows, text } from './fixture.ts';

/** The rows whose editors this step draws: every list and every family but the rail and pages. */
function editable(): ConfigRow[] {
    return shippedRows().filter(
        (row) =>
            (row.control === 'list' || row.control === 'family') &&
            row.id !== RAIL_ROW &&
            row.id !== PAGES_ROW
    );
}

/** The row of one key of one file over a text. */
function rowOver(file: string, key: string, body: string): ConfigRow {
    const found = fileRows(file, shipped[file], text(body)).rows.find((row) => row.key === key);
    if (found === undefined) throw new Error(`no row ${key} in ${file}`);
    return found;
}

/** The draft of a row that must have one. */
function draftFor(row: ConfigRow): Draft {
    const draft = draftOf(row);
    if (draft === null) throw new Error(`no draft for ${row.id}`);
    return draft;
}

/** The value a draft reads back as, which must be one. */
function valueOfDraft(draft: Draft): unknown {
    const made = draftValue(draft);
    if (!made.ok) throw new Error(`the draft does not read back: ${JSON.stringify(made.problems)}`);
    return made.value;
}

describe('the shipped lists and families as drafts', () => {
    it('read into a draft, each field as flow text, and back to the value the file holds', () => {
        for (const row of editable()) {
            const draft = draftFor(row);
            expect(valueOfDraft(draft), row.id).toEqual(row.value);
            // Save of an untouched draft writes nothing
            expect(isEdited(draft, row), row.id).toBe(false);
        }
    });

    it('draw no draft for the rail and the page reset, which keep their own editors', () => {
        const own = shippedRows().filter((row) => row.id === RAIL_ROW || row.id === PAGES_ROW);
        expect(own).toHaveLength(2);
        for (const row of own) expect(draftOf(row)).toBeNull();
    });
});

describe('a row with no editor', () => {
    it('is a list holding a number', () => {
        const row = rowOver('behavior.yml', 'waiting_status', 'waiting_status: [submitted, 5]\n');
        expect(row.state).toBe('set');
        expect(draftOf(row)).toBeNull();
    });

    it('is a row flagged mismatch, and a row the file does not hold', () => {
        const mismatch = rowOver('behavior.yml', 'data_domains', 'data_domains: heart\n');
        expect(mismatch.mismatch).toBe(true);
        expect(draftOf(mismatch)).toBeNull();
        const missing = rowOver('behavior.yml', 'data_domains', 'other: 1\n');
        expect(missing.state).toBe('missing');
        expect(draftOf(missing)).toBeNull();
    });

    it('is a single value, which has its control and no draft', () => {
        const row = rowOf(shippedRows(), (one) => one.control === 'number');
        expect(draftOf(row)).toBeNull();
    });
});

describe('one line of flow text', () => {
    it('shows a number, a word and a list as the file holds them', () => {
        expect(flowText(220)).toBe('220');
        expect(flowText('Max 20x')).toBe('Max 20x');
        expect(flowText(['.sh', '.bash', '.zsh', '.slurm'])).toBe('[.sh, .bash, .zsh, .slurm]');
        expect(flowText('green')).toBe('green');
        expect(flowText(['hpc', 'usage'])).toBe('[hpc, usage]');
    });

    it('shows a string that would read back as another type quoted', () => {
        expect(flowText('true')).toBe('"true"');
        expect(flowText('20')).toBe('"20"');
        expect(flowText('')).toBe('""');
        expect(flowText('null')).toBe('"null"');
    });

    it('reads back what it shows, for every kind of value and every awkward string', () => {
        const values: unknown[] = [
            220,
            -3.5,
            true,
            false,
            null,
            'Max 20x',
            'a: b',
            '#x',
            'x #y',
            'yes',
            '20',
            '',
            '[a]',
            '- x',
            '"q"',
            "it's",
            ['.sh', '.bash'],
            [],
            {},
            { a: 1, b: [2, 'c'], d: { e: 'f g' } },
            [{ label: 'One', keys: ['x', 'y'] }]
        ];
        for (const value of values) {
            expect(readFlow(flowText(value)), JSON.stringify(value)).toEqual({ ok: true, value });
        }
    });

    it('trims the text around a value', () => {
        expect(readFlow(' 8.5 ')).toEqual({ ok: true, value: 8.5 });
    });

    it('reads empty text as empty, and ~ as null', () => {
        expect(readFlow('')).toEqual({ ok: true, value: undefined });
        expect(readFlow('~')).toEqual({ ok: true, value: null });
    });

    it('keeps a bare colour as the string typed, since YAML reads it as a comment', () => {
        expect(readFlow('#123456')).toEqual({ ok: true, value: '#123456' });
    });

    it('does not read YAML that does not parse', () => {
        for (const input of ['[a, b', '*nothing']) {
            expect(readFlow(input), input).toEqual({ ok: false });
        }
    });
});

describe('the edits of a draft', () => {
    const list = (): Draft =>
        draftFor(rowOver('behavior.yml', 'waiting_status', 'waiting_status: [one, two, three]\n'));
    const items = (draft: Draft): string[] =>
        'cards' in draft ? draft.cards.map((card) => card.fields.item ?? '') : [];

    it('adds an empty item at the end, sets one, moves one up and removes one', () => {
        let draft = list();
        draft = applyEdit(draft, { do: 'add' });
        expect(items(draft)).toEqual(['one', 'two', 'three', '']);
        draft = applyEdit(draft, { do: 'set', index: 3, field: 'item', text: 'four' });
        draft = applyEdit(draft, { do: 'move', index: 3, by: -1 });
        expect(items(draft)).toEqual(['one', 'two', 'four', 'three']);
        draft = applyEdit(draft, { do: 'remove', index: 0 });
        expect(items(draft)).toEqual(['two', 'four', 'three']);
        expect(valueOfDraft(draft)).toEqual(['two', 'four', 'three']);
    });

    it('does not move the first item up or the last item down, nor touch an item that is not there', () => {
        const draft = list();
        expect(applyEdit(draft, { do: 'move', index: 0, by: -1 })).toEqual(draft);
        expect(applyEdit(draft, { do: 'move', index: 2, by: 1 })).toEqual(draft);
        expect(applyEdit(draft, { do: 'remove', index: 9 })).toEqual(draft);
        expect(applyEdit(draft, { do: 'set', index: 9, field: 'item', text: 'x' })).toEqual(draft);
        expect(applyEdit(draft, { do: 'remove', index: -1 })).toEqual(draft);
    });

    it('leaves the draft it was given as it was', () => {
        const draft = list();
        const before = structuredClone(draft);
        applyEdit(draft, { do: 'add' });
        applyEdit(draft, { do: 'remove', index: 0 });
        applyEdit(draft, { do: 'set', index: 0, field: 'item', text: 'z' });
        applyEdit(draft, { do: 'move', index: 1, by: 1 });
        expect(draft).toEqual(before);
    });

    it('knows an edited draft from the file, and a draft edited back from one that was not', () => {
        const row = rowOver(
            'behavior.yml',
            'waiting_status',
            'waiting_status: [one, two, three]\n'
        );
        let draft = draftFor(row);
        draft = applyEdit(draft, { do: 'remove', index: 0 });
        expect(isEdited(draft, row)).toBe(true);
        draft = applyEdit(draft, { do: 'add' });
        draft = applyEdit(draft, { do: 'set', index: 2, field: 'item', text: 'one' });
        draft = applyEdit(draft, { do: 'move', index: 2, by: -1 });
        draft = applyEdit(draft, { do: 'move', index: 1, by: -1 });
        expect(valueOfDraft(draft)).toEqual(['one', 'two', 'three']);
        expect(isEdited(draft, row)).toBe(false);
    });

    it('empties a list to an empty list, and a family to an empty family', () => {
        const row = rowOver('behavior.yml', 'waiting_status', 'waiting_status: [one]\n');
        const draft = applyEdit(draftFor(row), { do: 'remove', index: 0 });
        expect(valueOfDraft(draft)).toEqual([]);
        const map = rowOver('behavior.yml', 'usage_tiers', 'usage_tiers:\n    a: b\n');
        expect(valueOfDraft(applyEdit(draftFor(map), { do: 'remove', index: 0 }))).toEqual({});
        const records = rowOver('sources.yml', 'scan', 'scan:\n    - dir: x\n');
        expect(valueOfDraft(applyEdit(draftFor(records), { do: 'remove', index: 0 }))).toEqual([]);
    });
});

describe('a key/value draft', () => {
    const body = 'usage_tiers:\n    default_claude_pro: Pro\n    default_claude_max_20x: Max 20x\n';
    const row = (): ConfigRow => rowOver('behavior.yml', 'usage_tiers', body);

    it('holds a key field and a value field per entry, and reads a number as a number', () => {
        const draft = draftFor(
            rowOver('behavior.yml', 'read_limits', 'read_limits:\n    a: 220\n')
        );
        expect('cards' in draft && draft.cards[0].fields).toEqual({ key: 'a', value: '220' });
        const edited = applyEdit(draft, { do: 'set', index: 0, field: 'value', text: '221' });
        expect(valueOfDraft(edited)).toEqual({ a: 221 });
    });

    it('names a duplicate key under the editor and does not read back', () => {
        const draft = applyEdit(draftFor(row()), {
            do: 'set',
            index: 1,
            field: 'key',
            text: 'default_claude_pro'
        });
        const made = draftValue(draft);
        expect(made.ok).toBe(false);
        if (made.ok) return;
        expect(made.problems).toHaveLength(1);
        expect(made.problems[0].said.key).toBe(SETTINGS_MESSAGES.duplicateKey);
        expect(made.problems[0].said.args).toContain('default_claude_pro');
        expect(made.problems[0].index).toBe(1);
    });

    it('names an empty key, and a key added and left empty', () => {
        const added = applyEdit(draftFor(row()), { do: 'add' });
        const made = draftValue(added);
        expect(made.ok).toBe(false);
        if (made.ok) return;
        expect(made.problems.map((one) => one.said.key)).toEqual([SETTINGS_MESSAGES.emptyKey]);
        expect(made.problems[0].index).toBe(2);
        const blank = applyEdit(added, { do: 'set', index: 2, field: 'key', text: '   ' });
        expect(draftValue(blank).ok).toBe(false);
    });

    it('keeps a key as the text typed, so 1 stays the string 1', () => {
        const draft = applyEdit(applyEdit(draftFor(row()), { do: 'add' }), {
            do: 'set',
            index: 2,
            field: 'key',
            text: '1'
        });
        expect(valueOfDraft(draft)).toMatchObject({ '1': '' });
    });

    it('moves an entry, which reorders the map', () => {
        const moved = applyEdit(draftFor(row()), { do: 'move', index: 1, by: -1 });
        expect(Object.keys(valueOfDraft(moved) as object)).toEqual([
            'default_claude_max_20x',
            'default_claude_pro'
        ]);
    });
});

describe('a record draft', () => {
    const body =
        'docs:\n    - label: A\n      path: a.md\n      group: g\n    - label: B\n      path: b.md\n';
    const row = (): ConfigRow => rowOver('layout.yml', 'docs', body);

    it('holds a field per catalog field in the catalog order, and leaves an empty field out', () => {
        const draft = draftFor(row());
        expect('cards' in draft && Object.keys(draft.cards[1].fields)).toEqual(
            Object.keys(row().fields)
        );
        expect(valueOfDraft(draft)).toEqual([
            { label: 'A', path: 'a.md', group: 'g' },
            { label: 'B', path: 'b.md' }
        ]);
        const cleared = applyEdit(draft, { do: 'set', index: 0, field: 'group', text: '' });
        expect(valueOfDraft(cleared)).toEqual([
            { label: 'A', path: 'a.md' },
            { label: 'B', path: 'b.md' }
        ]);
    });

    it('names a field whose YAML does not parse, and does not read back', () => {
        const draft = applyEdit(draftFor(row()), {
            do: 'set',
            index: 1,
            field: 'label',
            text: '[a, b'
        });
        const made = draftValue(draft);
        expect(made.ok).toBe(false);
        if (made.ok) return;
        expect(made.problems).toHaveLength(1);
        expect(made.problems[0]).toMatchObject({ index: 1, field: 'label' });
        expect(made.problems[0].said.key).toBe(SETTINGS_MESSAGES.notYaml);
    });

    it('keeps a field the file holds and the catalog does not name, and sends it back unchanged', () => {
        const held = rowOver(
            'layout.yml',
            'docs',
            'docs:\n    - label: A\n      path: a.md\n      note: kept\n'
        );
        const draft = draftFor(held);
        expect('cards' in draft && draft.cards[0].kept).toEqual({ note: 'kept' });
        expect('cards' in draft && Object.keys(draft.cards[0].fields)).not.toContain('note');
        const edited = applyEdit(draft, { do: 'set', index: 0, field: 'label', text: 'AA' });
        expect(valueOfDraft(edited)).toEqual([{ label: 'AA', path: 'a.md', note: 'kept' }]);
        expect(valueOfDraft(draft)).toEqual(held.value);
    });

    it('moves a record with the field it keeps', () => {
        const held = rowOver(
            'layout.yml',
            'docs',
            'docs:\n    - label: A\n      path: a.md\n      note: kept\n    - label: B\n      path: b.md\n'
        );
        const moved = applyEdit(draftFor(held), { do: 'move', index: 0, by: 1 });
        expect(valueOfDraft(moved)).toEqual([
            { label: 'B', path: 'b.md' },
            { label: 'A', path: 'a.md', note: 'kept' }
        ]);
    });
});

describe('a map-keyed record draft', () => {
    const body =
        'nav_groups:\n    help: { label: Help, glyph: help, chord: h }\n    views: { label: Views, glyph: settings, chord: w }\n';
    const row = (): ConfigRow => rowOver('layout.yml', 'nav_groups', body);

    it('has the map key as the first field of the card', () => {
        const draft = draftFor(row());
        expect('cards' in draft && Object.keys(draft.cards[0].fields)[0]).toBe('key');
        expect('cards' in draft && draft.cards[0].fields.key).toBe('help');
        expect(valueOfDraft(draft)).toEqual(row().value);
    });

    it('adds a record, which is a map entry once it has a key', () => {
        let draft = applyEdit(draftFor(row()), { do: 'add' });
        draft = applyEdit(draft, { do: 'set', index: 2, field: 'key', text: 'extra' });
        draft = applyEdit(draft, { do: 'set', index: 2, field: 'label', text: 'Extra' });
        expect(valueOfDraft(draft)).toEqual({
            ...(row().value as object),
            extra: { label: 'Extra' }
        });
    });
});

describe('a roll-up draft', () => {
    const body =
        'tab_rollup:\n    a:\n        - { label: One, keys: [x, y], color: green }\n    b:\n        - { label: Two, keys: [z] }\n        - { label: Three, keys: [w] }\n';
    const row = (): ConfigRow => rowOver('layout.yml', 'tab_rollup', body);

    it('holds a card per key with its list of records, and reads back the map of lists', () => {
        const draft = draftFor(row());
        expect(draft.form).toBe('rollup');
        expect('groups' in draft && draft.groups.map((one) => one.key)).toEqual(['a', 'b']);
        expect('groups' in draft && draft.groups[1].cards).toHaveLength(2);
        expect(valueOfDraft(draft)).toEqual(row().value);
    });

    it('adds, sets, moves and removes the records of one key, and the keys themselves', () => {
        let draft = draftFor(row());
        draft = applyEdit(draft, { do: 'add', group: 0 });
        draft = applyEdit(draft, { do: 'set', group: 0, index: 1, field: 'label', text: 'Added' });
        draft = applyEdit(draft, { do: 'set', group: 0, index: 1, field: 'keys', text: '[q]' });
        draft = applyEdit(draft, { do: 'move', group: 1, index: 1, by: -1 });
        draft = applyEdit(draft, { do: 'remove', group: 1, index: 1 });
        draft = applyEdit(draft, { do: 'setGroup', group: 1, key: 'c' });
        draft = applyEdit(draft, { do: 'moveGroup', group: 1, by: -1 });
        expect(valueOfDraft(draft)).toEqual({
            c: [{ label: 'Three', keys: ['w'] }],
            a: [
                { label: 'One', keys: ['x', 'y'], color: 'green' },
                { label: 'Added', keys: ['q'] }
            ]
        });
        draft = applyEdit(draft, { do: 'removeGroup', group: 0 });
        expect(Object.keys(valueOfDraft(draft) as object)).toEqual(['a']);
    });

    it('is drawn for an emptied map too, because the catalog says the family holds lists', () => {
        const empty = rowOver('layout.yml', 'tab_rollup', 'tab_rollup: {}\n');
        expect(empty.holds).toBe('lists');
        const draft = draftFor(empty);
        expect(draft.form).toBe('rollup');
        expect('groups' in draft && draft.groups).toEqual([]);
        const named = applyEdit(applyEdit(draft, { do: 'addGroup' }), {
            do: 'setGroup',
            group: 0,
            key: 'projects'
        });
        expect(valueOfDraft(named)).toEqual({ projects: [] });
    });

    it('is not drawn for a family of records that holds a list, which the catalog does not allow', () => {
        const listed = rowOver(
            'layout.yml',
            'nav_groups',
            'nav_groups:\n    help: [{ label: Help }]\n'
        );
        expect(listed.holds).toBeUndefined();
        expect(draftOf(listed)).toBeNull();
    });

    it('adds a key with no records, and names a duplicate or an empty key', () => {
        const added = applyEdit(draftFor(row()), { do: 'addGroup' });
        const empty = draftValue(added);
        expect(empty.ok).toBe(false);
        if (empty.ok) return;
        expect(empty.problems[0].said.key).toBe(SETTINGS_MESSAGES.emptyKey);
        const same = applyEdit(added, { do: 'setGroup', group: 2, key: 'a' });
        const dup = draftValue(same);
        expect(dup.ok).toBe(false);
        if (dup.ok) return;
        expect(dup.problems[0].said.key).toBe(SETTINGS_MESSAGES.duplicateKey);
        const fine = applyEdit(added, { do: 'setGroup', group: 2, key: 'c' });
        expect(valueOfDraft(fine)).toMatchObject({ c: [] });
    });
});

describe('a list item left empty', () => {
    it('is named and holds Save back, rather than dropped', () => {
        const row = rowOver('behavior.yml', 'waiting_status', 'waiting_status: [one]\n');
        const made = draftValue(applyEdit(draftFor(row), { do: 'add' }));
        expect(made.ok).toBe(false);
        if (made.ok) return;
        expect(made.problems[0]).toMatchObject({ index: 1 });
        expect(made.problems[0].said.key).toBe(SETTINGS_MESSAGES.emptyItem);
    });
});
