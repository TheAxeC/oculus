// The palette's workspace commands rendered on the server: `:` lists the three new commands,
// `:workspace` lists the default workspace and the saved ones with the one in force marked,
// `:workspace-save` names the workspace it would save, and `:folder` is a command like the others.
// The refusals are the words of the endpoint's codes, and a pick switches or saves through the file
// store with no page navigation.
//
// What this does NOT cover: the press itself, which no server render fires (the commands a press
// runs are called directly in the last block), and the folder panel
// (tests/state/sources/explorer/acts/store.test.ts).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Palette from '../../../src/lib/shell/keys/Palette.svelte';
import {
    folderCommand,
    pickerLine,
    refusalLine,
    workspaceChoicesOf,
    workspaceCommand
} from '../../../src/lib/state/workbench/palette.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const WORKSPACES = {
    current: 'thesis',
    workspaces: [
        { name: '', roots: [{ key: 'hub', dir: '/r/hub', fixed: true }] },
        { name: 'thesis', roots: [{ key: 'hub', dir: '/r/hub', fixed: true }] },
        { name: 'grant', roots: [] }
    ],
    dropped: []
};

let client: ClientState;
let posted: Record<string, unknown>[] = [];

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
    vi.stubGlobal('window', {});
    posted = [];
    const answer = (init?: RequestInit): Response => {
        if (init?.method === 'POST') {
            posted.push(
                JSON.parse(typeof init.body === 'string' ? init.body : '{}') as Record<
                    string,
                    unknown
                >
            );
            return json({ ok: true, changed: [], refused: [] });
        }
        return json(WORKSPACES);
    };
    vi.stubGlobal('fetch', (_url: string, init?: RequestInit) => Promise.resolve(answer(init)));
    client = createClientState();
    client.writes.setToken('token');
    client.fs.workspaces();
});

afterEach(() => vi.unstubAllGlobals());

/** The palette open on a query, with the renderer's block markers taken out. */
function opened(prefill: string): string {
    return render(Palette, {
        context: clientContext(client),
        props: { onclose: noop, onupdate: noop, open: true, prefill }
    }).body.replace(/<!--[^>]*-->/g, '');
}

describe('the command list', () => {
    // Revert: drop the three entries from commands() in state/workbench/palette.ts.
    it('lists workspace, workspace-save and folder with their hints', () => {
        const body = opened(':');

        expect(body).toContain('>workspace &lt;workspace></span>');
        expect(body).toContain('>workspace-save &lt;name></span>');
        expect(body).toContain('data-value="command:folder"');
    });
});

describe(':workspace', () => {
    /** The rows of the workspace list: each row's value, its words and whether it is marked. */
    function listed(body: string): { value: string; label: string; marked: boolean }[] {
        return [
            ...body.matchAll(
                /data-value="(workspace:[^"]*)"[^>]*role="option".*?<button([^>]*)>.*?class="label">([^<]*)</g
            )
        ].map((one) => ({
            value: one[1],
            label: one[3],
            marked: one[2].includes('active')
        }));
    }

    // Revert: leave the default workspace out of workspaceMatches.
    it('lists the default workspace and the saved ones, the one in force marked', async () => {
        await settle();
        const rows = listed(opened(':workspace '));

        expect(rows.map((row) => [row.value, row.label, row.marked])).toEqual([
            ['workspace:', catalog['files.workspace_default'], false],
            ['workspace:thesis', 'thesis', true],
            ['workspace:grant', 'grant', false]
        ]);
    });

    // Revert: ignore the words after the command in workspaceChoicesOf.
    it('narrows the list by the words after the command', async () => {
        await settle();

        expect(listed(opened(':workspace gra')).map((row) => row.label)).toEqual(['grant']);
    });

    // Revert: read the current workspace from the first one in the list.
    it('marks the workspace in force and the default one by the file store, as pure choices', () => {
        const saved = { ...WORKSPACES, error: '', loading: false };
        const choices = workspaceChoicesOf('', saved);

        expect(choices.map((one) => [one.name, one.current])).toEqual([
            ['', false],
            ['thesis', true],
            ['grant', false]
        ]);
        expect(workspaceChoicesOf('', { ...saved, current: '' })[0]?.current).toBe(true);
    });
});

describe(':workspace-save', () => {
    // Revert: draw the name typed after the command as the empty prompt.
    it('says what it would save under the name typed, and asks for a name when there is none', () => {
        expect(opened(':workspace-save thesis2')).toContain(
            'Save the folders in force as the workspace thesis2'
        );
        expect(opened(':workspace-save ')).toContain(catalog['app.palette.workspace_save_name']);
    });

    // Revert: send the save without the name.
    it('saves the folders in force through the file store under the name', async () => {
        await client.fs.saveWorkspace('thesis2');

        expect(posted).toEqual([{ action: 'save-workspace', name: 'thesis2' }]);
    });
});

describe('what a switch and a save change', () => {
    // Revert: navigate the page on a switch.
    it('switches in place: one request, the workspaces read again, no navigation', async () => {
        await settle();
        const before = client.fs.workspaces();
        const answer = await client.fs.selectWorkspace('grant');

        expect(answer.ok).toBe(true);
        expect(posted).toEqual([{ action: 'select-workspace', name: 'grant' }]);
        expect(before.current).toBe('thesis');
        expect((globalThis as { window: { location?: unknown } }).window.location).toBeUndefined();
    });
});

describe('the refusals', () => {
    // Revert: say every code in the generic words.
    it('says an empty and a taken name in the words of the workspace form', () => {
        expect(refusalLine('no-name')).toBe(catalog['files.refused_no_name']);
        expect(refusalLine('name-held')).toBe(catalog['files.refused_name_held']);
        expect(refusalLine('surprise')).toBe('The server refused that: surprise');
    });

    // Revert: use one sentence for every picker refusal.
    it('says why the folder panel did not open', () => {
        expect(pickerLine('unsupported')).toBe(catalog['files.picker_unsupported']);
        expect(pickerLine('busy')).toBe(catalog['files.picker_busy']);
    });
});

describe('the workspace commands through the palette', () => {
    /** The server's refusal of a workspace write: a 400 naming the code. */
    function refusing(code: string): void {
        vi.stubGlobal('fetch', (_url: string, init?: RequestInit) => {
            if (init?.method !== 'POST') return Promise.resolve(json(WORKSPACES));
            posted.push(
                JSON.parse(typeof init.body === 'string' ? init.body : '{}') as Record<
                    string,
                    unknown
                >
            );
            return Promise.resolve(json({ error: code }, 400));
        });
    }

    // Revert: leave the refusal out of the outcome (`said: ''`) in workspaceCommand.
    it.each([
        ['an empty name', '', 'no-name', 'files.refused_no_name'],
        ['a taken name', 'grant', 'name-held', 'files.refused_name_held']
    ])('keeps the palette open saying why %s was refused', async (_what, name, code, key) => {
        refusing(code);
        const before = client.fs.workspaces();
        const outcome = await workspaceCommand(client.fs.saveWorkspace, name);

        expect(outcome).toEqual({ closed: false, said: catalog[key] });
        expect(posted).toEqual([{ action: 'save-workspace', name }]);
        expect(client.fs.workspaces()).toEqual(before);
    });

    // Revert: close the palette whatever the answer was.
    it('closes the palette when the save went through', async () => {
        const outcome = await workspaceCommand(client.fs.saveWorkspace, 'fresh');

        expect(outcome).toEqual({ closed: true });
    });

    // Revert: say nothing when the folder panel did not open.
    it('keeps the palette open saying why the folder panel did not open', async () => {
        const outcome = await folderCommand(() =>
            Promise.resolve({ ok: false as const, picker: 'busy' as const })
        );

        expect(outcome).toEqual({ closed: false, said: catalog['files.picker_busy'] });
        expect(await folderCommand(() => Promise.resolve({ ok: true as const }))).toEqual({
            closed: true
        });
    });
});
