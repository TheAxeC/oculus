// Layer 2, client state tests. The rows of the Settings view and their writes over the layers: a
// row shows the value in force, is Modified when it differs from the defaults file's value, and
// names the file the user's value of it lives in (the open workspace file's `settings:`, or the
// primary hub's settings file for a key of the hub list) with the line of the key there. Reset
// sends the reset of a key that file holds, and nothing for a key it does not; a change is sent
// whatever file it lands in, and the server refuses it when there is none (the unsaved workspace).
//
// What this does NOT cover: the server's write into the workspace file or the hub's settings file
// and its refusal for the unsaved workspace (tests/server/edit/config-key.test.ts).

import { describe, expect, it, vi } from 'vitest';
import { createRowWriter } from '../../../../src/lib/state/system/config/write.ts';
import {
    fileRows,
    placeOf,
    type ConfigRow,
    type UserFiles
} from '../../../../src/lib/state/system/config/rows.ts';
import type { Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { message } from '../../../../src/lib/state/system/config/messages.ts';
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

/** What the writer sends for a Reset of a row: the writes and the resets. */
async function resetOf(row: ConfigRow): Promise<{ writes: unknown[]; resets: unknown[] }> {
    const answer = () => Promise.resolve({ ok: true, changed: [], refused: [] });
    const write = vi.fn((_file: string, _key: string, _value: unknown) => answer());
    const reset = vi.fn((_file: string, _key: string) => answer());
    const writer = createRowWriter(
        write,
        reset,
        () => undefined,
        () => ({}) as Lists
    );
    await writer.reset(row);
    return { writes: write.mock.calls, resets: reset.mock.calls };
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
        expect(placeOf(row)).toEqual({ root: 'hub', file: WORKSPACE });
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
        expect([placeOf(row), row.place.present]).toEqual([null, false]);
    });
});

describe('Reset of a Settings row', () => {
    it('sends the reset of a key the workspace file holds, and no write', async () => {
        const row = rowOf(
            'code_theme',
            { code_theme: 'vscode-dark-2026' },
            workspace('settings:\n  code_theme: vscode-dark-2026\n')
        );
        expect(await resetOf(row)).toEqual({ writes: [], resets: [[FILE, 'code_theme']] });
    });

    it('sends the reset of a key the workspace file sets to the default value', async () => {
        const row = rowOf(
            'code_theme',
            { code_theme: 'tokens' },
            workspace('settings:\n  code_theme: tokens\n')
        );
        expect(row.modified).toBe(false);
        expect(await resetOf(row)).toEqual({ writes: [], resets: [[FILE, 'code_theme']] });
    });

    it('sends nothing for a key no file of the user holds', async () => {
        const row = rowOf('code_theme', { code_theme: 'tokens' }, workspace(''));
        expect(await resetOf(row)).toEqual({ writes: [], resets: [] });
    });
});

/** Lists whose folders are being read, so a folder box's value is checked for its form alone. */
const LOADING = { folder: () => ({ state: 'loading' }) } as unknown as Lists;

describe('a Settings row with a hub chosen', () => {
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

    /** The same row with the hub `lab` chosen. */
    const labRow = (): ConfigRow => ({ ...primaryRow(), hub: 'lab', slot: 'lab' });

    it("names lab in its write and its reset, and keeps lab's answer apart from the primary's", async () => {
        let release = (): void => undefined;
        const held = new Promise<void>((done) => (release = done));
        const write = vi.fn(async (_file: string, _key: string, value: unknown) => {
            if (value === 'held') await held;
            return value === 'refused'
                ? {
                      ok: true,
                      changed: [],
                      refused: [{ field: 'sources.yml:memories_dir', reason: 'no' }]
                  }
                : { ok: true, changed: ['sources.yml:memories_dir'], refused: [] };
        });
        const reset = vi.fn((_file: string, _key: string) =>
            Promise.resolve({ ok: true, changed: ['sources.yml:memories_dir'], refused: [] })
        );
        const listed: (string | undefined)[] = [];
        const writer = createRowWriter(
            write,
            reset,
            () => undefined,
            (row) => {
                listed.push(row.hub);
                return LOADING;
            }
        );
        await writer.submit(primaryRow(), 'refused');
        expect(writer.said(primaryRow())?.key).toBe('workbench.settings_refused');
        expect(writer.said(labRow())).toBeNull();
        const out = writer.submit(primaryRow(), 'held');
        expect([writer.pending(primaryRow()), writer.pending(labRow())]).toEqual([true, false]);
        expect(writer.shown(labRow())).toBeUndefined();
        release();
        await out;
        await writer.submit(labRow(), 'other');
        await writer.reset(labRow());
        expect(write.mock.calls.at(-1)).toEqual([
            'sources.yml',
            'memories_dir',
            'other',
            false,
            'lab'
        ]);
        expect(reset.mock.calls).toEqual([['sources.yml', 'memories_dir', 'lab']]);
        expect(listed).toEqual([undefined, undefined, 'lab']);
    });

    it('sends nothing for a row that says why it writes nothing', async () => {
        const blocked = { ...labRow(), blocked: message('pickHub') };
        expect(await resetOf(blocked)).toEqual({ writes: [], resets: [] });
        const write = vi.fn(() => Promise.resolve({ ok: true, changed: [], refused: [] }));
        const writer = createRowWriter(
            write,
            write,
            () => undefined,
            () => LOADING
        );
        await writer.submit(blocked, 'other');
        expect(write).not.toHaveBeenCalled();
    });
});
