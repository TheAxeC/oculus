// The palette's language list as VS Code's picker draws it: the three entries above the languages,
// the write that associates a file's ending with a language in config/sources.yml and what the
// list does with its answer, the rows `LanguageRows.svelte` hands the palette and what pressing
// Auto Detect and the file association does, and the Settings view opened on the language
// settings.
//
// What this does NOT cover: the palette drawing the second list and its title, the press on
// Configure language settings, and the write of a language chosen in the second list reaching the
// server, which the look does.

import { render } from 'svelte/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setAppearance } from '../../../src/lib/state/shared/words/appearance.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import {
    associateEnding,
    associationOutcome,
    languageActions
} from '../../../src/lib/state/workbench/navigation/status.ts';
import { settingsQuery, settingsReveal } from '../../../src/lib/state/system/config/typed.ts';
import { createPaletteSource } from '../../../src/lib/state/workbench/palette-source.svelte.ts';
import { SETTINGS_VIEW } from '../../../src/lib/state/workbench/navigation/rail.ts';
import { findView } from '../../../src/lib/state/workbench/layout/index.ts';
import { fakeStorage } from '../../state/workbench/layout/layout-fixture.ts';
import LanguageRows from '../../../src/lib/shell/keys/LanguageRows.svelte';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

/** The rows `PaletteRow` was drawn with, which the row list below is read from. */
const rows = vi.hoisted(() => [] as { value: string; label: string; pick: () => void }[]);

vi.mock('../../../src/lib/shell/keys/PaletteRow.svelte', () => ({
    default: (
        _payload: unknown,
        props: { row: { value: string; label: string; pick: () => void } }
    ) => {
        rows.push(props.row);
    }
}));

const { config } = loadConfig(engineDir());
setAppearance(config);
setCatalog(textCatalog(config));

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.layout.loadLayout(fakeStorage());
    client.ui.loadUi(fakeStorage());
});

describe('the entries above the languages', () => {
    // Red when the list opens with the languages alone, or names the wrong ending.
    it.each([
        ['init.lua', 'lua', '.lua'],
        ['Makefile', 'makefile', 'makefile'],
        ['notes.v2.txt', 'plaintext', '.txt']
    ])(
        'are Auto Detect, the association of the ending and the settings, for %s',
        (name, language, ending) => {
            const actions = languageActions(name, language);
            expect(actions.map((one) => one.kind)).toEqual(['auto', 'associate', 'configure']);
            expect(actions[1]).toMatchObject({ ending });
        }
    );
});

/** The rows `LanguageRows` hands the palette, as they are drawn for a Lua tab. */
function rowsFor(over: Record<string, unknown> = {}): {
    rows: { value: string; label: string; pick: () => void }[];
    closed: number[];
    associated: { ending: string; title: string }[];
} {
    rows.length = 0;
    const closed: number[] = [];
    const associated: { ending: string; title: string }[] = [];
    // the body is read, since the component is drawn when it is
    const { body } = render(LanguageRows, {
        context: clientContext(client),
        props: {
            source: { instance: 'tab', status: { language: 'lua' } },
            actions: languageActions('init.lua', 'lua'),
            languages: [],
            associating: null,
            onassociate: (one: { ending: string; title: string }) => associated.push(one),
            onclose: () => closed.push(closed.length),
            onsaid: () => undefined,
            ...over
        }
    });
    expect(body).toBeTypeOf('string');
    return { rows: [...rows], closed, associated };
}

describe('the rows of the language list', () => {
    // Red when the list has no Auto Detect row, or the row asks for the file's language by name.
    it('asks the tab to clear its chosen language when Auto Detect is pressed, and closes the palette', () => {
        client.editorStatus.publish('tab', {
            caret: null,
            lines: 1,
            indent: { tabs: false, size: 4 },
            ending: 'LF',
            language: 'lua',
            writable: true,
            blame: '',
            actions: [],
            file: '',
            selection: ''
        });
        const drawn = rowsFor();
        const auto = drawn.rows.find((row) => row.value === 'language-action:auto');
        expect(auto?.label).toBe('Auto Detect');
        auto?.pick();
        expect(client.editorStatus.asked('tab')).toMatchObject({ kind: 'language', language: '' });
        expect(drawn.closed).toHaveLength(1);
    });

    it('turns the list into the association list, with its title, when the file association is pressed', () => {
        const drawn = rowsFor();
        drawn.rows.find((row) => row.value === 'language-action:associate')?.pick();
        expect(drawn.associated).toEqual([
            { ending: '.lua', title: "Select Language Mode to Associate with '.lua'" }
        ]);
        expect(drawn.closed).toEqual([]);
    });

    it('lists the three entries above the languages and none of them in the association list', () => {
        expect(rowsFor().rows.map((row) => row.value)).toEqual([
            'language-action:auto',
            'language-action:associate',
            'language-action:configure'
        ]);
        expect(rowsFor({ associating: { ending: '.lua', title: 't' } }).rows).toEqual([]);
    });
});

describe('the answer to an association write', () => {
    const REFUSED = { ok: false, changed: [], refused: [{ field: 'languages', reason: 'locked' }] };
    const FAILED = { ok: false, changed: [], refused: [], error: 'timed out' };
    const ACCEPTED = { ok: true, changed: ['languages'], refused: [] };

    // Red when an answer closes the palette or says its refusal after the rows are gone, or when an
    // answer to rows still drawn neither closes nor says.
    it.each([
        ['accepted, rows drawn', ACCEPTED, true, { kind: 'close' }],
        ['nothing to write, rows drawn', null, true, { kind: 'close' }],
        [
            'refused, rows drawn',
            REFUSED,
            true,
            { kind: 'say', words: 'The file association was not saved: locked' }
        ],
        [
            'failed, rows drawn',
            FAILED,
            true,
            { kind: 'say', words: 'The file association was not saved: timed out' }
        ],
        ['accepted, rows gone', ACCEPTED, false, { kind: 'none' }],
        ['refused, rows gone', REFUSED, false, { kind: 'none' }]
    ])('%s', (_name, answer, drawn, outcome) => {
        expect(associationOutcome(answer, drawn)).toEqual(outcome);
    });
});

describe('the file association', () => {
    const LANGUAGES = {
        markdown: ['.md', '.markdown'],
        plaintext: ['.txt', '.text'],
        python: ['.py']
    };

    // Red when the ending stays with the language that held it, or a write goes out for nothing.
    it.each([
        [
            'moves an ending to the chosen language',
            LANGUAGES,
            '.txt',
            'markdown',
            { markdown: ['.md', '.markdown', '.txt'], plaintext: ['.text'], python: ['.py'] }
        ],
        [
            'adds an ending no language held',
            LANGUAGES,
            '.log',
            'python',
            {
                markdown: ['.md', '.markdown'],
                plaintext: ['.txt', '.text'],
                python: ['.py', '.log']
            }
        ],
        [
            'creates the list of a language with no entry',
            LANGUAGES,
            '.lua',
            'lua',
            { ...LANGUAGES, lua: ['.lua'] }
        ],
        ['writes nothing when the language holds the ending', LANGUAGES, '.md', 'markdown', null],
        ['writes nothing with no languages map', undefined, '.md', 'markdown', null]
    ])('%s', async (_name, languages, ending, language, written) => {
        const sent: unknown[][] = [];
        const answer = await associateEnding(
            (...args) => {
                sent.push(args);
                return Promise.resolve({ ok: true } as never);
            },
            languages,
            ending,
            language
        );
        if (written === null) {
            expect(sent).toEqual([]);
            expect(answer).toBeNull();
        } else {
            expect(sent).toEqual([['sources.yml', 'languages', written, languages]]);
        }
    });
});

describe('the language settings', () => {
    // Red when the Settings view is opened on a page other than the one on screen, or asked to
    // reveal its rail list, which clears the query the entry sets.
    it('are opened on the page on screen, with no rail list to reveal', () => {
        const opened: unknown[][] = [];
        const stored: unknown[][] = [];
        const store = createPaletteSource({ config: () => null } as never, {} as never, {
            writeConfigValue: () => Promise.reject(new Error('no write')),
            layout: {
                openView: (...args: unknown[]) => {
                    opened.push(args);
                    return 'settings-1';
                },
                currentPage: () => ({ id: 'page-2' }) as never
            },
            ui: {
                instanceState: () => ({ keep: 1 }),
                setInstanceState: (...args: unknown[]) => stored.push(args)
            }
        });

        expect(store.openLanguageSettings()).toBe('settings-1');
        expect(opened).toEqual([[SETTINGS_VIEW, undefined, 'page-2']]);
        expect(stored).toEqual([['settings-1', { keep: 1, query: '@id:editor.languages' }]]);
    });

    // Red when the configure entry is not wired to the Settings view, or leaves the palette open.
    it('are what the configure entry opens, and it closes the palette', () => {
        const drawn = rowsFor();
        drawn.rows.find((row) => row.value === 'language-action:configure')?.pick();
        const opened = findView(client.layout.layout(), 'settings');
        expect(opened).toBeDefined();
        expect(settingsQuery(client.ui.instanceState(opened?.id ?? ''))).toBe(
            '@id:editor.languages'
        );
        expect(settingsReveal(client.layout.instanceLayoutState(opened?.id ?? ''))).toBeUndefined();
        expect(drawn.closed).toHaveLength(1);
    });
});
