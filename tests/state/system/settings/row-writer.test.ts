// Layer 2, client state tests. The rows of the Settings view and their writes over the layers: a
// row shows the value in force, is Modified when it differs from the defaults file's value, and
// names the file the user's value of it lives in (the open workspace file's `settings:`, or the
// primary hub's settings file for a key of the hub list) with the line of the key there. A change
// a control makes is held as an unsaved change of the scope on screen, a value equal to the row's
// drops it, and nothing is sent until the scope's Save; Reset holds the taking out of a key that
// file holds, and nothing for a key it does not. A row of a hub other than the primary keeps its
// change apart from the primary's row of the same key, and a row that says why it writes nothing
// holds nothing.
//
// What this does NOT cover: the Save that sends the changes of a scope and the server's write into
// the workspace file or a hub's settings file (tests/routes/edit/undo/config-save.test.ts).

import { describe, expect, it } from 'vitest';
import type {
    CatalogEntry,
    Control
} from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { answered, createRowWriter } from '../../../../src/lib/state/system/config/scopes/write.ts';
import {
    fileRows,
    type ConfigRow,
    type UserFiles
} from '../../../../src/lib/state/system/config/rows.ts';
import type { Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { message, type Message } from '../../../../src/lib/state/system/config/messages.ts';
import { memoryStage } from '../../../views/system/workbench/workbench-fixture.ts';
import { shipped } from './fixture.ts';

const FILE = 'appearance.yml';
const text = (body: string) => ({ text: body, truncated: false, error: '', loading: false });
const WORKSPACE = '.oculus/workspaces/w.yml';

/** The open workspace file's text as a row reads it, or null for the unsaved workspace. */
type WorkspaceText = UserFiles['workspace'];

/** The open workspace file holding `body`, served under the root `hub`. */
const workspace = (body: string): WorkspaceText => ({
    root: 'hub',
    path: WORKSPACE,
    text: text(body)
});

/** The row of one key of `appearance.yml` over the value in force and the user's files. */
function rowOf(
    key: string,
    config: Record<string, unknown>,
    open: WorkspaceText,
    hub?: string
): ConfigRow {
    const result = fileRows(FILE, shipped[FILE], config, {
        workspace: open,
        ...(hub === undefined ? {} : { hubFile: { text: text(hub), present: true } })
    });
    const row = result.rows.find((one) => one.key === key);
    if (row === undefined) throw new Error(`no row ${key}`);
    return row;
}

/** Lists whose folders are being read, so a folder box's value is checked for its form alone. */
const LOADING = { folder: () => ({ state: 'loading' }) } as unknown as Lists;

/** A writer over a stage in memory, and the rows the lists were asked for, by their hub. */
function writerOf() {
    const stage = memoryStage();
    const listed: (string | undefined)[] = [];
    const writer = createRowWriter(
        stage,
        () => undefined,
        (row) => {
            listed.push(row.hub);
            return LOADING;
        }
    );
    return { writer, stage, listed };
}

/** What a Reset of a row holds in the scope's changes. */
function resetOf(row: ConfigRow): unknown {
    const { writer, stage } = writerOf();
    writer.reset(row);
    return stage.held(row);
}

describe('a Settings row over the layers', () => {
    it('shows the value in force, Modified, at the line of the workspace file that sets it', () => {
        const row = rowOf(
            'code_theme',
            { code_theme: 'vscode-dark-2026' },
            workspace('folders: []\nsettings:\n  code_theme: vscode-dark-2026\n')
        );
        expect([row.value, row.default, row.modified, row.own, row.line]).toEqual([
            'vscode-dark-2026',
            'tokens',
            true,
            true,
            3
        ]);
        expect([row.place.root, row.place.path]).toEqual(['hub', WORKSPACE]);
    });

    it('is not Modified and holds no line when no file of the user sets the key', () => {
        const row = rowOf('code_theme', { code_theme: 'tokens' }, workspace('folders: []\n'));
        expect([row.modified, row.own, row.line]).toEqual([false, false, undefined]);
    });

    it('places a key of the hub list in the primary hub settings file', () => {
        const row = rowOf(
            'wallpaper.image',
            { wallpaper: { image: 'lab/x.jpg' } },
            workspace(''),
            'wallpaper:\n  image: lab/x.jpg\n'
        );
        expect([row.own, row.line, row.place.layer]).toEqual([true, 2, 'hub']);
    });

    it('has no file to open for the unsaved workspace', () => {
        const row = rowOf('code_theme', { code_theme: 'tokens' }, null);
        expect([row.place.path, row.place.present]).toEqual([null, false]);
    });
});

describe('a change of a Settings row', () => {
    it("is held as an unsaved change, shown, and dropped when the value is the row's again", () => {
        const row = rowOf('code_theme', { code_theme: 'tokens' }, workspace(''));
        const { writer, stage } = writerOf();
        writer.submit(row, 'vscode-dark-2026');
        expect(stage.held(row)).toEqual({ value: 'vscode-dark-2026' });
        expect([writer.pending(row), writer.shown(row)]).toEqual([true, 'vscode-dark-2026']);
        writer.submit(row, 'tokens');
        expect([stage.held(row), writer.pending(row)]).toEqual([undefined, false]);
    });
});

/** The `code_theme` row drawn with another control, holding a key of its scope's file or not. */
function controlRow(control: Control, own: boolean, extra: Partial<CatalogEntry> = {}): ConfigRow {
    const row = rowOf('code_theme', { code_theme: 'tokens' }, workspace(''));
    return { ...row, own, entry: { help: row.entry.help, control, ...extra } };
}

describe('a Settings row whose box is emptied', () => {
    /**
     * One control kind, whether its option takes the empty value (`empty:`), whether the scope's
     * file holds the key, and what the row then holds.
     */
    type Emptied = {
        control: Control;
        empty?: true;
        own: boolean;
        held: unknown;
        said: Message | null;
    };

    const ROWS: Emptied[] = [
        { control: 'text', own: false, held: undefined, said: null },
        { control: 'long', own: false, held: undefined, said: null },
        { control: 'path', own: false, held: undefined, said: null },
        { control: 'number', own: false, held: undefined, said: null },
        { control: 'choice', own: false, held: undefined, said: null },
        { control: 'text', own: true, held: { value: '' }, said: null },
        { control: 'long', own: true, held: { value: '' }, said: null },
        { control: 'path', own: true, held: undefined, said: message('notAPath') },
        { control: 'number', own: true, held: undefined, said: message('empty') },
        { control: 'choice', own: true, held: undefined, said: null },
        { control: 'choice', empty: true, own: false, held: { value: '' }, said: null },
        { control: 'choice', empty: true, own: true, held: { value: '' }, said: null },
        { control: 'path', empty: true, own: false, held: { value: '' }, said: null },
        { control: 'path', empty: true, own: true, held: { value: '' }, said: null }
    ];

    it('holds nothing and says nothing for a key the file does not hold, unless the empty text is a value of its option, and answers by its control for one it holds', () => {
        const outcomes = ROWS.map((one): Emptied => {
            const extra = one.empty === undefined ? {} : { empty: one.empty };
            const row = controlRow(one.control, one.own, extra);
            const { writer, stage } = writerOf();
            writer.submit(row, '');
            return { ...one, held: stage.held(row), said: writer.said(row) };
        });
        expect(outcomes).toEqual(ROWS);
    });
});

describe('a refused value of a Settings row', () => {
    it('is said until it is withdrawn: Escape, the held value typed back, or Reset', () => {
        const row = { ...controlRow('number', true, { min: 1, max: 9 }), value: 5 };
        const { writer, stage } = writerOf();
        writer.submit(row, 'abc');
        expect(writer.said(row)).toEqual(message('notNumber'));
        writer.clear(row);
        expect(writer.said(row)).toBeNull();
        writer.submit(row, 'abc');
        writer.submit(row, '5');
        expect([writer.said(row), stage.held(row)]).toEqual([null, undefined]);
        writer.submit(row, '20');
        expect(writer.said(row)).not.toBeNull();
        writer.reset(row);
        expect([writer.said(row), stage.held(row)]).toEqual([null, { reset: true }]);
    });

    it('names the reasons of a refused Save with no full stop of their own', () => {
        const answer = {
            ok: false,
            changed: [],
            refused: [
                { field: 'appearance.yml:code_theme', reason: 'The theme is not listed.' },
                { field: 'appearance.yml:theme', reason: 'The file is locked' }
            ]
        };
        expect(answered(answer, FILE)).toEqual(
            message('refused', 'The theme is not listed; The file is locked')
        );
    });
});

describe('Reset of a Settings row', () => {
    it('holds the reset of a key the workspace file holds', () => {
        const row = rowOf(
            'code_theme',
            { code_theme: 'vscode-dark-2026' },
            workspace('settings:\n  code_theme: vscode-dark-2026\n')
        );
        expect(resetOf(row)).toEqual({ reset: true });
    });

    it('holds the reset of a key the workspace file sets to the default value', () => {
        const row = rowOf(
            'code_theme',
            { code_theme: 'tokens' },
            workspace('settings:\n  code_theme: tokens\n')
        );
        expect(row.modified).toBe(false);
        expect(resetOf(row)).toEqual({ reset: true });
    });

    it('holds nothing for a key no file of the user holds', () => {
        const row = rowOf('code_theme', { code_theme: 'tokens' }, workspace(''));
        expect(resetOf(row)).toBeUndefined();
    });
});

describe('a Settings row of a hub other than the primary', () => {
    /** The `memories_dir` row of the primary's file, which sets the key, as a row reads it. */
    function primaryRow(): ConfigRow {
        const row = fileRows(
            'sources.yml',
            shipped['sources.yml'],
            { memories_dir: 'pictures' },
            {
                workspace: workspace(''),
                hubFile: { text: text('memories_dir: pictures\n'), present: true }
            }
        ).rows.find((one) => one.key === 'memories_dir');
        if (row === undefined) throw new Error('no memories_dir row');
        return row;
    }

    /** The same row in the Hub scope of `lab`. */
    const labRow = (): ConfigRow => ({ ...primaryRow(), hub: 'lab', slot: 'lab' });

    it("keeps lab's change and reset apart from the primary's, and checks lab's against lab's lists", () => {
        const { writer, stage, listed } = writerOf();
        writer.submit(primaryRow(), 'photos');
        expect([writer.pending(primaryRow()), writer.pending(labRow())]).toEqual([true, false]);
        expect(writer.shown(labRow())).toBeUndefined();
        writer.submit(labRow(), 'other');
        expect([stage.held(primaryRow()), stage.held(labRow())]).toEqual([
            { value: 'photos' },
            { value: 'other' }
        ]);
        writer.reset(labRow());
        expect([stage.held(primaryRow()), stage.held(labRow())]).toEqual([
            { value: 'photos' },
            { reset: true }
        ]);
        expect(listed).toEqual([undefined, 'lab']);
    });

    it('holds nothing for a row that says why it writes nothing', () => {
        const blocked = { ...labRow(), blocked: message('hubLoading', 'lab') };
        expect(resetOf(blocked)).toBeUndefined();
        const { writer, stage } = writerOf();
        writer.submit(blocked, 'other');
        expect(stage.held(blocked)).toBeUndefined();
    });
});
