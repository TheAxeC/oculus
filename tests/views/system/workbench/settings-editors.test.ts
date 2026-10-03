// Layer 4, view test. What the Settings view draws for the lists and families it now edits, and for
// the groups it gained: an editor in the item of a list or a family with the fields of the file's
// value, Save and Discard only while a draft is held, the problems of a draft named under the
// editor, the draft's refusal under the row, no editor for a list holding a number or a row flagged
// mismatch, the open action of every file group (the machine's own file included, whose text is
// never read), the description under each file group's heading, and the Catalogs and Texts groups
// over a listing that differs from the tree.
//
// What this does NOT cover: a field typed in, a button pressed and the source tab a press opens,
// the table of contents shown under 700 px and Escape hiding it, which run in a browser and are
// seen on landing; the draft's state is tests/state/system/settings/editors-draft.test.ts's and the
// write's is tests/state/system/settings/editors-writer.test.ts's.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Settings from '../../../../src/lib/views/system/workbench/Settings.svelte';
import Item from '../../../../src/lib/views/system/workbench/settings/Item.svelte';
import type { FileText } from '../../../../src/lib/state/sources/fs-transport.ts';
import type { FsEntry } from '../../../../src/lib/state/sources/fs.ts';
import { applyEdit, draftOf } from '../../../../src/lib/state/system/config/editors/draft.ts';
import {
    savedDraft,
    withSavedDraft
} from '../../../../src/lib/state/system/config/editors/slots.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import { createRowWriter } from '../../../../src/lib/state/system/config/write.ts';
import { fileRows } from '../../../../src/lib/state/system/config/rows.ts';
import { settingsTyped } from '../../../../src/lib/state/system/config/typed.ts';
import { clientContext, type ClientState } from '../../../fixtures/client.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import { dir, file, shipped } from '../../../state/system/settings/fixture.ts';
import {
    buttonNamed,
    catalog,
    freshSuite,
    groupOf,
    itemOf,
    shippedTexts,
    shippedWith,
    withFiles,
    words,
    type FileLog
} from './workbench-fixture.ts';

let client: ClientState;
let log: FileLog;

beforeEach(() => {
    ({ client, log } = freshSuite());
});

const instance = { id: 'settings-one', view: 'settings', state: {} };

/** The folders of a fixture tree, which differs from the config folder's. */
const TREE: Partial<Record<string, FsEntry[]>> = {
    catalogs: [file('zeta.yml'), file('alpha.yml'), file('mid.yml')],
    text: [dir('views'), file('notes.txt'), file('app.yml')],
    'text/views': [file('b.yml'), dir('system')],
    'text/views/system': [file('deep.yml')]
};

type Listings = Partial<Record<string, { entries?: FsEntry[]; error?: string; loading?: boolean }>>;

/** The view over `files`, the file browser answering `listings` for each folder asked. */
function draw(
    files: Record<string, FileText> = shippedTexts(),
    listings: Listings = {},
    shown = instance
): string {
    const base = withFiles(client, files, log);
    const doubled: ClientState = {
        ...base,
        fs: {
            ...base.fs,
            listing: (_root: string, path: string) => ({
                entries: listings[path]?.entries ?? TREE[path] ?? [],
                error: listings[path]?.error ?? '',
                loading: listings[path]?.loading ?? false
            })
        }
    };
    return render(Settings, { context: clientContext(doubled), props: { instance: shown } }).body;
}

/** The values of the text inputs in a piece of markup, in order. */
function inputValues(markup: string): string[] {
    return [...markup.matchAll(/<input\b[^>]*\bvalue="([^"]*)"[^>]*>/g)].map(([, value]) => value);
}

describe('the editor of a list', () => {
    it('draws one field per item holding the item, with Add and a pair of moves per item', () => {
        const item = itemOf(draw(), 'behavior.yml:waiting_status');
        expect(item).toContain('data-editor="items"');
        expect(inputValues(item)).toEqual(['submitted', 'pending', 'under review', 'under-review']);
        expect(buttonNamed(item, words('settings.editor_add'))).not.toBe('');
        for (const place of [1, 2, 3, 4]) {
            expect(buttonNamed(item, words('settings.editor_up', place))).not.toBe('');
            expect(buttonNamed(item, words('settings.editor_down', place))).not.toBe('');
            expect(buttonNamed(item, words('settings.editor_remove', place))).not.toBe('');
        }
    });

    it('keeps the open link of the row and draws the list as its entries, with no count', () => {
        const item = itemOf(draw(), 'behavior.yml:waiting_status');
        expect(item).toContain(words('workbench.settings_edit_in_tip', 'behavior.yml'));
        // the list is drawn as its entries, so no summary of its length is in the control
        expect(item.replace(words('workbench.settings_default_items', 4), '')).not.toContain(
            '4 items'
        );
    });

    it('offers neither Save nor Discard while no draft is held', () => {
        const item = itemOf(draw(), 'behavior.yml:waiting_status');
        expect(buttonNamed(item, words('settings.editor_save'))).toBe('');
        expect(buttonNamed(item, words('settings.editor_discard'))).toBe('');
    });

    it('draws the draft held in the tab instead of the file, with Save and Discard offered', () => {
        const row = fileRows(
            'behavior.yml',
            shipped['behavior.yml'],
            shippedTexts()['behavior.yml']
        ).rows.find((one) => one.key === 'waiting_status');
        const draft = applyEdit(draftOf(row as never) as never, { do: 'remove', index: 0 });
        client.ui.setInstanceState(
            instance.id,
            withSavedDraft({}, 'behavior.yml', 'waiting_status', draft, row?.value)
        );
        const item = itemOf(draw(), 'behavior.yml:waiting_status');
        expect(inputValues(item)).toEqual(['pending', 'under review', 'under-review']);
        const save = buttonNamed(item, words('settings.editor_save'));
        expect(save).not.toBe('');
        // a draft with no problem and the file's own base can be saved, so the button is enabled
        expect(save).not.toContain('disabled');
        expect(buttonNamed(item, words('settings.editor_discard'))).not.toBe('');
    });

    it('names the problem of a draft under the editor and holds Save back', () => {
        const row = fileRows(
            'behavior.yml',
            shipped['behavior.yml'],
            shippedTexts()['behavior.yml']
        ).rows.find((one) => one.key === 'waiting_status');
        const draft = applyEdit(draftOf(row as never) as never, { do: 'add' });
        client.ui.setInstanceState(
            instance.id,
            withSavedDraft({}, 'behavior.yml', 'waiting_status', draft, row?.value)
        );
        const item = itemOf(draw(), 'behavior.yml:waiting_status');
        expect(item).toContain(words('workbench.settings_empty_item', 5));
        expect(buttonNamed(item, words('settings.editor_save'))).toContain('disabled');
    });

    it('names a draft started over another value than the file holds, and holds Save back', () => {
        const row = fileRows(
            'behavior.yml',
            shipped['behavior.yml'],
            shippedTexts()['behavior.yml']
        ).rows.find((one) => one.key === 'waiting_status');
        const draft = applyEdit(draftOf(row as never) as never, { do: 'remove', index: 0 });
        client.ui.setInstanceState(
            instance.id,
            withSavedDraft({}, 'behavior.yml', 'waiting_status', draft, ['submitted'])
        );
        const item = itemOf(draw(), 'behavior.yml:waiting_status');
        expect(item).toContain(words('workbench.settings_changed_since', 'behavior.yml'));
        expect(buttonNamed(item, words('settings.editor_save'))).toContain('disabled');
        // a stale draft can always be thrown away, so Discard stays enabled
        expect(buttonNamed(item, words('settings.editor_discard'))).not.toContain('disabled');
    });

    it('does not name a draft started over the value the file holds', () => {
        const row = fileRows(
            'behavior.yml',
            shipped['behavior.yml'],
            shippedTexts()['behavior.yml']
        ).rows.find((one) => one.key === 'waiting_status');
        const draft = applyEdit(draftOf(row as never) as never, { do: 'remove', index: 0 });
        client.ui.setInstanceState(
            instance.id,
            withSavedDraft({}, 'behavior.yml', 'waiting_status', draft, row?.value)
        );
        const item = itemOf(draw(), 'behavior.yml:waiting_status');
        // a draft started over the file's current value has nothing to warn about
        expect(item).not.toContain(words('workbench.settings_changed_since', 'behavior.yml'));
    });
});

describe('the editor of a family', () => {
    it('draws a key field and a value field per entry of a key/value family', () => {
        const item = itemOf(draw(), 'behavior.yml:usage_tiers');
        expect(item).toContain('data-editor="pairs"');
        const values = inputValues(item);
        expect(values).toContain('default_claude_max_20x');
        expect(values).toContain('Max 20x');
    });

    it('shows a number as a number and a list as flow text', () => {
        const limits = itemOf(draw(), 'behavior.yml:read_limits');
        expect(inputValues(limits)).toContain('220');
        const languages = itemOf(draw(), 'sources.yml:languages');
        expect(inputValues(languages)).toContain('[.sh, .bash, .zsh, .slurm]');
    });

    it('draws a card per record with a field per catalog field', () => {
        const item = itemOf(draw(), 'layout.yml:nav_groups');
        expect(item).toContain('data-editor="records"');
        expect(inputValues(item)).toContain('help');
        expect(inputValues(item)).toContain('Help');
    });

    it('draws a card per key with its records for the tab roll-up', () => {
        const item = itemOf(draw(), 'layout.yml:tab_rollup');
        expect(item).toContain('data-editor="rollup"');
    });

    it('draws a field the catalog does not name, but the file holds, as read-only text', () => {
        const item = itemOf(
            draw(
                shippedWith(
                    'layout.yml',
                    '{ label: "Research approach",',
                    '{ extra_field: extra-value, label: "Research approach",'
                )
            ),
            'layout.yml:docs'
        );
        expect(item).toContain('extra_field');
        expect(item).toContain('extra-value');
        // a field the catalog does not name is shown but cannot be edited, so it has no input
        expect(inputValues(item)).not.toContain('extra-value');
    });

    it('draws no editor in the rail row or the page reset row', () => {
        const body = draw();
        // the rail has its own editor in the rail half, so its row draws none of the generic ones
        expect(itemOf(body, 'layout.yml:rail')).not.toContain('data-editor');
        // the arrangements are reset through the pages, so their row draws no generic editor
        expect(itemOf(body, 'layout.yml:arrangements')).not.toContain('data-editor');
    });
});

describe('a row with no editor', () => {
    it('is a list holding a number: no editor, the open link kept', () => {
        const body = draw(
            shippedWith(
                'behavior.yml',
                'waiting_status: [submitted, pending, under review, under-review]',
                'waiting_status: [submitted, 5]'
            )
        );
        const item = itemOf(body, 'behavior.yml:waiting_status');
        expect(item).not.toBe('');
        // a list holding a number cannot be edited as text entries, so the row falls back to the
        // open link
        expect(item).not.toContain('data-editor');
        expect(item).toContain(words('workbench.settings_edit_in', 'behavior.yml'));
        expect(item).toContain(words('workbench.settings_edit_in_tip', 'behavior.yml'));
    });

    it('is a row flagged mismatch: no editor, the message and the open link kept', () => {
        const body = draw(
            shippedWith(
                'behavior.yml',
                'waiting_status: [submitted, pending, under review, under-review]',
                'waiting_status: submitted'
            )
        );
        const item = itemOf(body, 'behavior.yml:waiting_status');
        // a value of the wrong kind has no entries to edit, so the row says so and leaves the file
        // to the open link
        expect(item).not.toContain('data-editor');
        expect(item).toContain(words('workbench.settings_mismatch_list', 'submitted'));
        expect(item).toContain(words('workbench.settings_edit_in', 'behavior.yml'));
    });

    it('is a family the file does not hold: no editor, the row says it is not set', () => {
        const body = draw(shippedWith('behavior.yml', 'read_limits:', 'read_limits_old:'));
        const item = itemOf(body, 'behavior.yml:read_limits');
        // a family the file lacks has no entries to edit, so the row says it is not set
        expect(item).not.toContain('data-editor');
        expect(item).toContain(words('workbench.settings_missing', 'behavior.yml'));
    });
});

describe('the file groups', () => {
    it('draw the description of the file under the group heading', () => {
        const body = draw();
        expect(groupOf(body, 'behavior.yml')).toContain('Thresholds, horizons and cadences');
        expect(groupOf(body, 'layout.yml')).toContain('How things are arranged');
        expect(groupOf(body, 'local.yml')).toContain("This machine's own values");
    });

    it('draw a backticked name of the description as code', () => {
        const group = groupOf(draw(), 'behavior.yml');
        expect(group).toContain('<code');
        expect(group).toContain('refresh_stale_days');
        // the backticks mark code in the description, so they are consumed and not drawn
        expect(group).not.toContain('`refresh_stale_days`');
    });

    it('tag the machine file and no other, with the words of the settings text group', () => {
        const body = draw();
        expect(groupOf(body, 'local.yml')).toContain(words('settings.local_tag'));
        // only the machine's own file is tagged as local, so every other file group carries no tag
        expect(groupOf(body, 'behavior.yml')).not.toContain(words('settings.local_tag'));
        expect(catalog['config.local_tag']).toBeUndefined();
    });
});

describe('the refresh of the file browser', () => {
    it('audits that the view hands the config push version to refresh, so a write is read back', () => {
        const source = readFileSync(
            join(engineDir(), 'src/lib/views/system/workbench/Settings.svelte'),
            'utf8'
        );
        expect(source).toContain("message('config')?.version");
        expect(source).toContain('refresh(ENGINE_ROOT, pushed)');
    });
});

describe('the Catalogs and Texts groups', () => {
    it('list the files of the listings, nested included, in name order, each with the open action', () => {
        const body = draw();
        const catalogs = groupOf(body, 'catalogs');
        const names = [...catalogs.matchAll(/data-file="([^"]+)"/g)].map(([, name]) => name);
        expect(names).toEqual(['catalogs/alpha.yml', 'catalogs/mid.yml', 'catalogs/zeta.yml']);
        for (const name of names) {
            expect(catalogs).toContain(words('views.open_source_tip', name));
        }
        const texts = groupOf(body, 'texts');
        expect([...texts.matchAll(/data-file="([^"]+)"/g)].map(([, name]) => name)).toEqual([
            'text/app.yml',
            'text/notes.txt',
            'text/views/b.yml',
            'text/views/system/deep.yml'
        ]);
    });

    it('read the listings and not a fixed list: another listing gives other rows', () => {
        const body = draw(shippedTexts(), { catalogs: { entries: [file('only.yml')] } });
        expect(groupOf(body, 'catalogs')).toContain('data-file="catalogs/only.yml"');
        // the group lists what the folder holds now, so a file the listing lacks is not drawn
        expect(groupOf(body, 'catalogs')).not.toContain('alpha.yml');
    });

    it('say a listing is loading, and name the failure of one that failed', () => {
        const loading = groupOf(draw(shippedTexts(), { text: { loading: true } }), 'texts');
        expect(loading).toContain(words('workbench.settings_list_loading', 'text'));
        // a folder still loading has no file rows to draw, only the loading sentence
        expect(loading).not.toContain('data-file=');
        const failed = groupOf(
            draw(shippedTexts(), { catalogs: { error: 'no such folder' } }),
            'catalogs'
        );
        expect(failed).toContain(
            words('workbench.settings_list_failed', 'catalogs', 'no such folder')
        );
    });

    it('add no file the view reads: the five tracked files are all it asks for', () => {
        draw();
        expect(new Set(log.asked)).toEqual(
            new Set(['appearance.yml', 'behavior.yml', 'layout.yml', 'present.yml', 'sources.yml'])
        );
    });
});

describe('the refusal of a list write', () => {
    const REASON = 'A reader refused this exact value.';

    /** The item of the waiting_status row over a text, after a write of its list was refused. */
    async function refusedItem(body: string, press: 'save' | 'reset'): Promise<string> {
        const row = fileRows('behavior.yml', shipped['behavior.yml'], {
            text: body,
            truncated: false,
            error: '',
            loading: false
        }).rows.find((one) => one.key === 'waiting_status');
        if (row === undefined) throw new Error('no waiting_status row');
        const editors = createEditorWriter(
            () =>
                Promise.resolve({
                    ok: true,
                    changed: [],
                    refused: [{ field: 'behavior.yml:waiting_status', reason: REASON }]
                }),
            { changed: () => undefined, ended: () => undefined, held: () => false }
        );
        const draft = draftOf(row);
        if (press === 'save' && draft !== null) {
            await editors.save(row, applyEdit(draft, { do: 'remove', index: 0 }));
        } else {
            await editors.reset(row);
        }
        const writer = createRowWriter(
            () => Promise.resolve({ ok: true, changed: [], refused: [] }),
            () => undefined
        );
        return render(Item, {
            context: clientContext(client),
            props: { row, id: instance.id, writer, editors }
        }).body;
    }

    /** How often a piece of text occurs in the markup. */
    const times = (markup: string, part: string): number => markup.split(part).length - 1;

    it('is drawn once, under the editor, with one status element, when the list has an editor', async () => {
        const markup = await refusedItem('waiting_status: [one, two]\n', 'save');
        expect(times(markup, REASON)).toBe(1);
        expect(times(markup, 'role="status"')).toBe(1);
        expect(markup).toMatch(/<p class="problem[ "][^>]*role="status">[^<]*A reader refused/);
    });

    it('is drawn once, in the item, when the file holds a list the editor does not draw', async () => {
        const markup = await refusedItem('waiting_status: [1, 2]\n', 'reset');
        // a list of numbers is not a list the items editor draws, so the item is the one place left
        // to say the reader refused the reset
        expect(markup).not.toContain('data-editor');
        expect(times(markup, REASON)).toBe(1);
    });

    it('audits that the editor carries no draft attribute', async () => {
        const markup = await refusedItem('waiting_status: [one, two]\n', 'save');
        expect(markup).toContain('data-editor="items"');
        // the editor's markup is read by its form name alone; a draft slot attribute nothing reads
        // would only be dead weight in every row
        expect(markup).not.toContain('data-draft');
    });
});

describe('a draft held over a row the editor does not draw', () => {
    const REASON = 'A reader refused this exact value.';
    const FILE = 'behavior.yml';
    const KEY = 'waiting_status';

    /** The waiting_status row over a text of behavior.yml. */
    function rowOf(body: string) {
        const found = fileRows(FILE, shipped[FILE], {
            text: body,
            truncated: false,
            error: '',
            loading: false
        }).rows.find((one) => one.key === KEY);
        if (found === undefined) throw new Error('no waiting_status row');
        return found;
    }

    /** The item of a row, drawn for the tab, after the editors' write has said what it said. */
    function itemFor(
        row: ReturnType<typeof rowOf>,
        editors: ReturnType<typeof createEditorWriter>
    ) {
        const writer = createRowWriter(
            () => Promise.resolve({ ok: true, changed: [], refused: [] }),
            () => undefined
        );
        return render(Item, {
            context: clientContext(client),
            props: { row, id: instance.id, writer, editors }
        }).body;
    }

    /** How often a piece of text occurs in the markup. */
    const times = (markup: string, part: string): number => markup.split(part).length - 1;

    /** A save of the list refused by the reader, with the draft held in the tab's state. */
    async function refusedSave() {
        const before = rowOf('waiting_status: [one, two]\n');
        const draft = applyEdit(draftOf(before) as never, { do: 'remove', index: 0 });
        client.ui.setInstanceState(instance.id, withSavedDraft({}, FILE, KEY, draft, before.value));
        const editors = createEditorWriter(
            () =>
                Promise.resolve({
                    ok: true,
                    changed: [],
                    refused: [{ field: `${FILE}:${KEY}`, reason: REASON }]
                }),
            {
                changed: () => undefined,
                ended: (row) =>
                    client.ui.setInstanceState(
                        instance.id,
                        withSavedDraft(
                            client.ui.instanceState(instance.id),
                            row.file,
                            row.key,
                            null
                        )
                    ),
                held: (row) =>
                    savedDraft(client.ui.instanceState(instance.id), row.file, row.key) !==
                    undefined
            }
        );
        await editors.save(before, draft);
        return editors;
    }

    it('shows the refusal once while the draft is held and the editor is not drawn', async () => {
        const editors = await refusedSave();
        const after = rowOf('waiting_status: [one, 2]\n');
        const markup = itemFor(after, editors);
        // the list holds a number, so the item has no editor, and the refusal is drawn in the item
        expect(markup).not.toContain('data-editor');
        expect(times(markup, REASON)).toBe(1);
    });

    it('drops the draft at the push that leaves the row undrawn, and says so once', async () => {
        const editors = await refusedSave();
        expect(settingsTyped(client.ui.instanceState(instance.id))).toBe(true);
        const after = rowOf('waiting_status: [one, 2]\n');
        editors.pushed(after);
        const state = client.ui.instanceState(instance.id);
        expect(savedDraft(state, FILE, KEY)).toBeUndefined();
        expect(settingsTyped(state)).toBe(false);
        const markup = itemFor(after, editors);
        expect(times(markup, words('workbench.settings_draft_dropped'))).toBe(1);
        expect(times(markup, REASON)).toBe(0);
    });
});
