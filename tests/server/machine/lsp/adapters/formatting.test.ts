// Layer 4, server test. The formatting options the TypeScript server is answered for a document
// (`workspace/configuration`, section `formattingOptions`): the indentation the editor's options
// give the document's language in its root, in the order a tab with no choice of its own takes it:
// the root's `.oculus/settings.yml` record, `editor.languages`, the acting apps' defaults, then
// `editor.tab_size` and `editor.insert_spaces`. The language is the one of the channel the page
// opened the document the request's `scopeUri` names on. A change of the configuration that would
// change an answer the server was given asks for a start again (`settingsChange`), since the
// server keeps each document's answer for as long as it runs.
//
// The configuration is the shipped one, with the editor keys a row changes; the roots are scratch
// folders. What this does NOT cover: the real TypeScript server, and the relay's restart of it.

import { pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import type { DefaultsRow } from '../../../../../src/lib/data/helpers/files/apps/tools/editor-defaults.ts';
import type { Formatting } from '../../../../../src/lib/server/machine/lsp/adapters/entry.ts';
import { heldIndent } from '../../../../../src/lib/server/machine/lsp/adapters/web/formatting.ts';
import {
    configurationAnswers,
    settingsChange,
    type AnsweredMap
} from '../../../../../src/lib/server/machine/lsp/held/requests/configuration.ts';
import { docKey } from '../../../../../src/lib/server/machine/lsp/held/doc-key.ts';
import { createServers } from '../../../../../src/lib/server/machine/lsp/servers.ts';
import { it, plantScratch } from '../../../../fixtures/scratch.ts';
import { shippedLatex } from '../lsp-fixture.ts';

/** The shipped configuration with the editor's keys a row sets. */
function configWith(editor: Record<string, unknown> = {}): Record<string, unknown> {
    const config = loadConfig(engineDir()).config;
    return { ...config, editor: { ...(config.editor as Record<string, unknown>), ...editor } };
}

/** A root whose `.oculus/settings.yml` holds the text given, its real path. */
function rootWith(settings: string | null): string {
    const files: Record<string, string> =
        settings === null ? {} : { '.oculus/settings.yml': settings };
    return realpathSync(plantScratch('oculus-formatting-', files));
}

/** An acting app's row whose `configurationDefaults` holds the blocks given. */
function appRow(defaults: Record<string, unknown>): DefaultsRow {
    return {
        disabled: false,
        hashApproved: true,
        contributes: { configurationDefaults: defaults }
    };
}

/** The relay's `indent` answer under the configuration and the acting apps' rows given. */
function formattingOptions(
    config: Record<string, unknown>,
    rows: readonly DefaultsRow[],
    language: string | null,
    root: string
): Formatting | null {
    const apps = rows.map((row) => ({ row }));
    return heldIndent({ quiet: () => ({ config }) }, () => apps)(language, root);
}

/** The answer of a step of the width given, in spaces. */
const SPACES = (tabSize: number) => ({ tabSize, insertSpaces: true });

describe("the TypeScript server's formatting options, from the editor's options", () => {
    it('takes the global keys, then the apps, editor.languages and the root record over them (G13)', () => {
        const plain = rootWith(null);
        expect(formattingOptions(configWith(), [], 'typescript', plain)).toEqual(SPACES(4));
        const global = configWith({ tab_size: 3, insert_spaces: false });
        expect(formattingOptions(global, [], null, plain)).toEqual({
            tabSize: 3,
            insertSpaces: false
        });
        const rows = [appRow({ '[javascript]': { 'editor.tabSize': 8 } })];
        expect(formattingOptions(global, rows, 'javascript', plain)?.tabSize).toBe(8);
        const languages = configWith({ languages: { javascript: { tab_size: 6 } } });
        expect(formattingOptions(languages, rows, 'javascript', plain)?.tabSize).toBe(6);
        const repo = rootWith(
            'languages:\n  javascript:\n    tab_size: 2\n    insert_spaces: false\n'
        );
        expect(formattingOptions(languages, rows, 'javascript', repo)).toEqual({
            tabSize: 2,
            insertSpaces: false
        });
        expect(formattingOptions(languages, rows, 'typescript', repo)).toEqual(SPACES(4));
    });

    it("answers each item for the language of the document its scopeUri names, through the entry's indent (G13)", () => {
        const root = rootWith(null);
        const asked: (string | null)[] = [];
        const entry = createServers({
            oculus: '/oculus',
            node: '/node',
            exists: () => true,
            latex: () => shippedLatex(),
            markdown: () => ['md'],
            hiddenFolders: () => ['node_modules'],
            indent: (language, at) => {
                asked.push(language);
                return formattingOptions(configWith({ tab_size: 2 }), [], language, at);
            }
        }).forId('typescript');
        const file = pathToFileURL(join(root, 'b.js')).href;
        const docs = new Map([[docKey(file), { channel: 'lsp:javascript' }]]);
        const setup = {
            root,
            interpreter: null,
            interpreterPrefixes: [],
            databaseFolder: null,
            fallbackFlags: []
        };
        const answered: AnsweredMap = new Map();
        const items = [
            { section: 'formattingOptions', scopeUri: file },
            { section: 'formattingOptions' },
            { section: 'typescript' },
            'not an item'
        ];
        expect(configurationAnswers(items, entry, setup, docs, answered)).toEqual([
            SPACES(2),
            SPACES(2),
            null,
            null
        ]);
        expect(asked).toEqual(['javascript', null]);
        expect(answered.get('formattingOptions\njavascript')).toEqual({
            section: 'formattingOptions',
            language: 'javascript',
            text: JSON.stringify(SPACES(2))
        });
        const early = configurationAnswers(items, entry, null, docs, answered);
        expect(early).toEqual([null, null, null, null]);
    });

    it('asks for a start again when an answer the server keeps would change, once (G13)', () => {
        const root = rootWith(null);
        let config = configWith({ tab_size: 2 });
        const entry = createServers({
            oculus: '/oculus',
            node: '/node',
            exists: () => true,
            latex: () => shippedLatex(),
            markdown: () => ['md'],
            hiddenFolders: () => ['node_modules'],
            indent: (language, at) => formattingOptions(config, [], language, at)
        }).forId('typescript');
        const file = pathToFileURL(join(root, 'b.js')).href;
        const docs = new Map([[docKey(file), { channel: 'lsp:javascript' }]]);
        const setup = {
            root,
            interpreter: null,
            interpreterPrefixes: [],
            databaseFolder: null,
            fallbackFlags: []
        };
        const answered: AnsweredMap = new Map();
        expect(settingsChange(entry, setup, answered)).toBe(null);
        configurationAnswers(
            [{ section: 'formattingOptions', scopeUri: file }],
            entry,
            setup,
            docs,
            answered
        );
        expect(settingsChange(entry, setup, answered)).toBe(null);
        config = configWith({ tab_size: 2, languages: { javascript: { tab_size: 8 } } });
        expect(settingsChange(entry, setup, answered)).toBe('restart');
        expect(settingsChange(entry, setup, answered)).toBe(null);
    });

    it('asks a server that follows a section to ask again, never to start again (G13)', () => {
        let outDir = 'build';
        const entry = createServers({
            oculus: '/oculus',
            node: '/node',
            exists: () => true,
            latex: () => ({ ...shippedLatex(), outDir }),
            markdown: () => ['md'],
            hiddenFolders: () => ['node_modules'],
            indent: () => null
        }).forId('texlab');
        const setup = {
            root: rootWith(null),
            interpreter: null,
            interpreterPrefixes: [],
            databaseFolder: null,
            fallbackFlags: []
        };
        const answered: AnsweredMap = new Map();
        configurationAnswers([{ section: 'texlab' }], entry, setup, new Map(), answered);
        expect(settingsChange(entry, setup, answered)).toBe(null);
        outDir = 'out';
        expect(settingsChange(entry, setup, answered)).toBe('ask');
        expect(settingsChange(entry, setup, answered)).toBe(null);
    });
});
