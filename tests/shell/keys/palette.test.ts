// The shell palette rendered closed, as search results, and as its command list. The test installs
// the same state stores and view registry production reads, without a socket or browser.

import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Palette from '../../../src/lib/shell/keys/Palette.svelte';
import UpdateTray from '../../../src/lib/shell/rail/UpdateTray.svelte';
import Status from '../../../src/lib/views/system/status/Status.svelte';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphMode, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { fakeStorage } from '../../state/workbench/layout/layout-fixture.ts';
import { editorItems, ranked } from '../../../src/lib/state/workbench/palette.ts';
import { changeActions } from '../../../src/lib/ui/controls/editor/gutter.ts';
import type { EditorStatus } from '../../../src/lib/state/workbench/navigation/editor-status.svelte.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];
let registerView: ClientState['registry']['registerView'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
    ({ registerView } = client.registry);
    installFixture();
});

const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

/** What every case here starts from, installed into the case's own client. */
function installFixture(): void {
    receive({ channel: 'config', version: 8001, payload: { config, text: catalog, findings: [] } });
    registerView({
        id: 'focus',
        label: 'views.focus',
        glyph: 'views.focus_glyph',
        component: Status,
        group: 'probe',
        order: 0
    });
    registerView({
        id: 'status',
        label: 'views.status',
        glyph: 'views.status_glyph',
        component: Status,
        group: 'probe',
        order: 1
    });
    receive({
        channel: 'portfolio',
        version: 8001,
        payload: {
            entities: {
                projects: {},
                venues: {},
                datasets: {},
                pillars: {},
                domains: {},
                funding: {},
                collections: {},
                career: null,
                feeds: {
                    radar: { lastRun: '2026-09-01' },
                    scout: { lastRun: '2026-09-02' },
                    linkedin: { lastPost: '2026-09-03' },
                    leads: null
                }
            }
        }
    });
}

const props = { onclose: noop, onupdate: noop };

describe('Palette', () => {
    it('renders nothing while closed', () => {
        expect(
            render(Palette, { context: clientContext(client), props: { ...props, open: false } })
                .body
        ).not.toContain('role="dialog"');
    });

    it('renders open with the view matches and configured placeholder', () => {
        const body = render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true }
        }).body;
        expect(body).toContain(catalog['app.palette.cmdk_placeholder']);
        expect(body).toContain('Focus');
        expect(body).toContain('Status');
    });

    it('renders command names, argument hints and unavailable labels in command mode', () => {
        const body = render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true, prefill: ':' }
        }).body;
        expect(body).toContain('theme');
        expect(body).toContain('accent');
        expect(body).toContain('view id');
        expect(body).toContain(catalog['app.palette_unavailable']);
    });

    it('draws the command-specific unknown line when no command matches', () => {
        const body = render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true, prefill: ':nonesuch' }
        }).body;
        expect(body).toContain(catalog['app.palette.cmd_unknown']);
        expect(body).not.toContain(catalog['app.palette_empty']);
    });
});

describe('the palette on the Command list', () => {
    /** The palette open on a query, with the renderer's block markers taken out. */
    function opened(prefill: string): string {
        return render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true, prefill }
        }).body.replace(/<!--[^>]*-->/g, '');
    }

    // Red when a result draws its title as plain text, without the matched letters marked.
    it('marks the letters of a title the query matched, and leaves the rest unmarked', () => {
        const body = opened('fcs');
        expect(body).toMatch(/<mark[^>]*>F<\/mark>o<mark[^>]*>c<\/mark>u<mark[^>]*>s<\/mark>/);
        expect(body).not.toMatch(/<mark[^>]*>[^<]*t[^<]*<\/mark>/);
    });

    // Red when the list goes back to hand-drawn rows: the input is then no combobox and a row no
    // option with an id the Command can name as the active descendant, which it sets in the page.
    it('draws the input as a combobox, the list as a listbox, and each result row as an option with an id', () => {
        const body = opened('');
        expect(body).toMatch(/<input[^>]*role="combobox"/);
        expect(body).toMatch(/role="listbox"/);
        const rows = [...body.matchAll(/<[a-z]+ [^>]*role="option"[^>]*>/g)].map(
            (match) => match[0]
        );
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) expect(row).toMatch(/\bid="[^"]+"/);
    });

    // Red when the palette goes back to a hand-drawn dialog box.
    it('is a bits-ui dialog, modal', () => {
        const body = opened('');
        expect(body).toMatch(/<[^>]*data-dialog-content[^>]*>/);
        const content = /<[^>]*data-dialog-content[^>]*>/.exec(body)?.[0] ?? '';
        expect(content).toContain('role="dialog"');
        expect(content).toContain('aria-modal="true"');
    });

    // Red when the tray goes back to a hand-drawn dialog box.
    it('draws the update tray as a bits-ui dialog, modal', () => {
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        const content = /<[^>]*data-dialog-content[^>]*>/.exec(body)?.[0] ?? '';
        expect(content).toContain('role="dialog"');
        expect(content).toContain('aria-modal="true"');
    });
});

/** A writable source tab's status, with the editor actions its editor labelled. */
const EDITING: EditorStatus = {
    caret: { line: 1, column: 1, selected: 0 },
    lines: 3,
    indent: { tabs: false, size: 4 },
    ending: 'LF',
    language: 'python',
    writable: true,
    blame: '',
    actions: [
        { id: 'editor.action.addCommentLine', label: 'Add Line Comment', hint: 'Cmd+K Cmd+C' },
        {
            id: 'editor.action.removeCommentLine',
            label: 'Remove Line Comment',
            hint: 'Cmd+K Cmd+U'
        },
        { id: 'editor.foldAll', label: 'Fold All', hint: 'Cmd+K Cmd+0' }
    ]
};

describe("the editor's Cmd+K actions in the palette", () => {
    /** Put a source tab on screen that has said what it holds, and answer its instance. */
    function sourceTab(said: EditorStatus = EDITING): string {
        client.layout.loadLayout(fakeStorage());
        const id = client.layout.openView('source', { root: 'hub', path: 'run.py' });
        client.editorStatus.publish(id, said);
        return id;
    }

    function opened(prefill: string): string {
        return render(Palette, {
            context: clientContext(client),
            props: { ...props, open: true, prefill }
        }).body.replace(/<!--[^>]*-->/g, '');
    }

    // Red when editorItems lists nothing, or the index is built without the source tab's actions.
    it('ranks the two line comment actions among the editor items for the query comment', () => {
        const instance = sourceTab();
        const items = editorItems({ instance, status: EDITING });
        expect(items.every((item) => item.kind === 'editor')).toBe(true);
        const found = ranked(items, 'comment').map((match) => match.item.label);
        expect(found).toContain('Add Line Comment');
        expect(found).toContain('Remove Line Comment');
        const body = opened('comment');
        expect(body).toContain('Add Line Comment');
        expect(body).toContain('Remove Line Comment');
        expect(body).toContain(`>${catalog['app.palette.kind_editor']}<`);
        expect(body).toContain('Cmd+K Cmd+C');
    });

    // Red when the actions over the marks are left out of the palette, lose their keys, or an
    // action without keys is drawn with an empty hint.
    it("lists the actions over the marks under the view's words, with their keys", () => {
        const words = {
            next: catalog['source.next_change'] ?? '',
            previous: catalog['source.previous_change'] ?? '',
            open: catalog['source.open_change'] ?? ''
        };
        expect(Object.values(words)).toEqual([
            'Go to Next Change',
            'Go to Previous Change',
            'Open Change'
        ]);
        const said = changeActions(words, true, true).map(({ id, label, hint }) => ({
            id,
            label,
            hint
        }));
        const status = { ...EDITING, actions: [...said, ...EDITING.actions] };
        const instance = sourceTab(status);
        const items = editorItems({ instance, status });
        const hint = (label: string) => items.find((item) => item.label === label)?.hint;
        expect(hint('Go to Next Change')).toBe('Alt+F5');
        expect(hint('Go to Previous Change')).toBe('Shift+Alt+F5');
        expect(items.find((item) => item.label === 'Open Change')?.hint).toBe(undefined);
        const body = opened('change');
        for (const shown of [...Object.values(words), 'Alt+F5', 'Shift+Alt+F5']) {
            expect(body).toContain(shown);
        }
    });

    // Red when the editor items are listed whatever tab is on screen.
    it('lists no editor item with no source tab on screen', () => {
        client.layout.loadLayout(fakeStorage());
        expect(editorItems(null)).toEqual([]);
        const body = opened('comment');
        // the tab on screen is no source tab, so there is no editor whose actions could be run
        expect(body).not.toContain('Add Line Comment');
    });
});

describe('UpdateTray', () => {
    it('draws the four tasks, the portfolio Chat row, their last runs and the inbox note', () => {
        // The inbox task's last run is the triage notes file's, which the `inbox` channel carries.
        receive({
            channel: 'inbox',
            version: 8002,
            payload: {
                status: 'ok',
                accounts: [],
                threads: [],
                updated: '2026-09-04T10:00:00.000Z',
                pollMin: 10,
                retryMin: 2,
                notesRun: '2026-09-04'
            }
        });
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            expect(body).toContain(`data-task="${kind}"`);
        }
        for (const date of ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04']) {
            expect(body).toContain(date);
        }
        expect(body).toContain(catalog['app.tasks.inbox_note']);
        expect(body).toContain('data-task="chat"');
        expect(body).toContain(`>${catalog['app.chat']}</span>`);
    });

    it('draws the inbox note with the info glyph beside its words and no character in them', () => {
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        const row = body.slice(body.indexOf('data-task="inbox"'));
        const from = row.indexOf('class="note');
        const note = row.slice(
            from,
            row.indexOf('</span>', row.indexOf(catalog['app.tasks.inbox_note'], from))
        );
        expect(note).toContain('data-glyph="info"');
        expect(note.indexOf('data-glyph="info"')).toBeLessThan(
            note.indexOf(catalog['app.tasks.inbox_note'])
        );
        expect(note).not.toMatch(/[^\t\n\r\x20-\x7E]/);
    });

    it('renders the Chat glyph through ASCII mode', () => {
        setGlyphMode('ascii');
        try {
            const body = render(UpdateTray, {
                context: clientContext(client),
                props: { open: true, onclose: noop }
            }).body;
            const row = body.slice(body.indexOf('data-task="chat"'));
            expect(row).toContain(`>${glyphCatalog(config).chat}</span>`);
            expect(row).not.toContain('<svg');
            expect(row).toContain(`>${catalog['app.chat']}</span>`);
        } finally {
            setGlyphMode('icon');
        }
    });

    it('opens on a full-window ground with a dialog inside it', () => {
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        expect(body).toMatch(/<div class="ground tray\b[^"]*"/);
        const tray = /<div[^>]*class="tray\b[^"]*"[^>]*>/.exec(body)?.[0] ?? '';
        expect(tray).toContain('role="dialog"');
    });

    it('marks no task row as confirming while tasks.skip_permissions is off', () => {
        expect((config as { tasks?: Record<string, unknown> }).tasks?.skip_permissions).toBe(false);
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        expect(body).toContain('data-task="litwatch"');
        expect(body).not.toContain('data-confirms');
        expect(body).not.toContain(catalog['app.tasks.skip_confirm_ok']);
    });

    it('marks every task row as confirming while tasks.skip_permissions is on', () => {
        // The setting travels in the merged config the `config` channel carries, so the case turns
        // it on the way the server would: by pushing a config that holds it. A server render cannot
        // press, so what is asserted here is the path a press takes; the press itself is not run
        // here.
        const skipping = { ...config, tasks: { skip_permissions: true } };
        receive({
            channel: 'config',
            version: 8002,
            payload: { config: skipping, text: catalog, findings: [] }
        });
        const body = render(UpdateTray, {
            context: clientContext(client),
            props: { open: true, onclose: noop }
        }).body;
        for (const kind of ['litwatch', 'scout', 'linkedin', 'inbox']) {
            expect(body).toMatch(new RegExp(`data-task="${kind}"[^>]*data-confirms="true"`));
        }
        // The dialog itself is drawn by a press, so the closed tray carries its words nowhere.
        expect(body).not.toContain(catalog['app.tasks.skip_confirm_ok']);
    });
});
