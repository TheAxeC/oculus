// Layer 2, client state test. What the acting apps give the editor (lib/state/system/apps/tools/
// languages.svelte.ts and data/helpers/files/apps/tools/language-kit.ts): the files an app's
// manifest names are asked of the server once each while the app acts, asked again when the app's
// files change, forgotten when it stops acting, and the kit holds the languages, grammars,
// snippets, schemas and served languages of the acting apps only. These are the language rows of
// G77 on the page's side.
//
// Svelte's client runtime runs the effect that asks. What this does NOT cover: Monaco, which takes
// the kit (tests/ui/controls/editor/).

import { flushSync } from 'svelte';
import { describe, expect, vi } from 'vitest';
import { noContributes } from '../../../../src/lib/data/helpers/files/apps/contributes.ts';
import type { AppRow, AppToolsHost } from '../../../../src/lib/data/model/index.ts';
import { createLanguages } from '../../../../src/lib/state/system/apps/tools/languages.svelte.ts';
import { fixtureApp } from '../../../fixtures/entities-fixture.ts';
import { it } from '../../../fixtures/scratch.ts';
import { cell } from '../../../ui/frame/rooted.svelte.ts';

const GRAMMAR = { scopeName: 'source.notes', patterns: [] };

/** The row of an app `name` that declares the language `notes` with its files. */
function notesRow(over: Partial<AppRow> = {}): AppRow {
    return fixtureApp({
        name: 'notes',
        contributes: {
            ...noContributes(),
            languages: [
                {
                    id: 'notes',
                    aliases: ['Notes'],
                    extensions: ['.note'],
                    filenames: [],
                    filenamePatterns: [],
                    firstLine: '',
                    configuration: 'notes.language.json',
                    icon: null
                }
            ],
            grammars: [
                {
                    language: 'notes',
                    scopeName: 'source.notes',
                    path: 'notes.tmLanguage.json',
                    embeddedLanguages: {},
                    injectTo: [],
                    tokenTypes: {}
                }
            ],
            snippets: [{ language: 'notes', path: 'notes.snippets.json' }]
        },
        ...over
    });
}

const FILES: Record<string, unknown> = {
    'notes.language.json': { comments: { lineComment: '//' } },
    'notes.tmLanguage.json': GRAMMAR,
    'notes.snippets.json': {
        hello: { prefix: ['hi', 'hello'], body: ['one', 'two'] },
        nobody: { prefix: 'x' }
    }
};

/** A store over rows a case changes, with the file requests it made and the host list it sees. */
function store(rows: Cell<AppRow[]>, hosts: Cell<AppToolsHost[]> = cell<AppToolsHost[]>([])) {
    const asked: string[] = [];
    const post = vi.fn((_path: string, body: unknown) => {
        const { app, path } = body as { app: string; path: string };
        asked.push(`${app}:${path}`);
        const value = FILES[path];
        return Promise.resolve({
            ok: value !== undefined,
            status: 200,
            body: value === undefined ? { ok: false, word: 'missing' } : { ok: true, value },
            failed: '' as const
        });
    });
    const made = createLanguages({
        rows: () => rows.get(),
        hosts: () => hosts.get(),
        map: () => new Map(),
        post
    });
    return { made, asked };
}

type Cell<T> = ReturnType<typeof cell<T>>;

const settle = async (): Promise<void> => {
    flushSync();
    for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
    flushSync();
};

describe('the files of an acting app', () => {
    it('are asked of the server once each, and the kit holds the language, grammar and snippets once they arrive', async () => {
        const rows = cell([notesRow()]);
        const { made, asked } = store(rows);
        await settle();
        await settle();
        const kit = made.kit();
        expect([
            asked.sort(),
            kit.languages.map((one) => [one.id, one.label, one.configuration]),
            kit.grammars.map((one) => one.scopeName),
            kit.snippets.map((one) => [
                one.language,
                one.snippets.map((s) => [s.name, s.prefix, s.body])
            ])
        ]).toEqual([
            [
                'app:notes:notes.language.json',
                'app:notes:notes.snippets.json',
                'app:notes:notes.tmLanguage.json'
            ],
            [['notes', 'Notes', { comments: { lineComment: '//' } }]],
            ['source.notes'],
            [['notes', [['hello', ['hi', 'hello'], 'one\ntwo']]]]
        ]);
    });

    it('are asked of the server again when the app changed, and not at all for an app that is disabled or whose files are not approved', async () => {
        const rows = cell([
            notesRow({ disabled: true }),
            notesRow({ name: 'other', hashApproved: false })
        ]);
        const { made, asked } = store(rows);
        await settle();
        const none = [asked.length, made.kit().languages.length];
        rows.set([notesRow({ hash: 'b' })]);
        await settle();
        await settle();
        expect([none, asked.length, made.kit().languages.map((one) => one.id)]).toEqual([
            [0, 0],
            3,
            ['notes']
        ]);
    });
});

describe('the languages served', () => {
    it('are the shipped ones and those the servers of acting apps select, and none of an app that stopped acting', async () => {
        const host = (app: string): AppToolsHost => ({
            app,
            servers: [
                {
                    id: 's',
                    selector: [{ language: 'notes', pattern: '' }],
                    output: '',
                    sections: []
                }
            ],
            providers: null,
            collections: [],
            debuggers: [],
            taskTypes: [],
            sources: [],
            decorations: false,
            contentSchemes: []
        });
        const rows = cell([notesRow()]);
        const hosts = cell([host('app:notes'), host('app:other')]);
        const { made } = store(rows, hosts);
        await settle();
        const served = made.kit().served;
        expect([served.includes('notes'), served.includes('python')]).toEqual([true, true]);
        rows.set([notesRow({ disabled: true })]);
        await settle();
        expect(made.kit().served.includes('notes')).toBe(false);
    });
});
