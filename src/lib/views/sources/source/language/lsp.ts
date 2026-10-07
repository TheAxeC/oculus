// Layer 3, view partial of Source.svelte. What a Python, C or C++ source tab adds to its editor
// when a language server serves it: the registration of its model with the editor's language
// server client (ui/controls/editor/kit/lsp/), the services that client is handed (the page's
// channel, the reads and opens it needs, the stores it reports to), and the actions the tab lists
// while a server serves it.
//
// A tab over a library file (status/library-tab.svelte.ts) registers its model under the library
// address, so hover, definitions and diagnostics are answered by the server that named the file.
// Its searches and the locations they name carry the address in place of a root and a path.
//
// The services are made once per tab. The registration is made by the editor extension of a
// language, a new function whenever the language, the root or the path changes, so the editor ends
// the old registration and makes the new one (a language changed from the status bar, a file
// renamed inside oculus). A language no server serves has no extension, and a model drawn in
// another language than the tab's (a file over `editor.paint_limit_kb` is drawn as plaintext) is
// never registered, since the kit registers a model under the language it is drawn in.
//
// The actions are the tab's own (`EditorOwnAction`), joined to the tab's list in the order
// Restart Language Server, Show Language Server Output, Select Interpreter or Select Compile
// Database, Switch Between Source/Header, Find All References, Find All Implementations, Show AST
// and Show Memory Usage, each while it applies. Restart and Show Output apply while any server of
// the language is asked for; the rest apply while the server of the tab's root answers. A search
// of the References view and clangd's two extensions hand their answers to the page's stores
// (state/system/machine/lsp/), which the Explorer's and the Files view's sections draw.

import type * as Monaco from 'monaco-editor';
import type { ClientState } from '$lib/state/client/context';
import type { EditorExtension, EditorOwnAction, KeyPress } from '$lib/ui/controls/editor/types';
import type { FormatOutcome, LspHandle } from '$lib/ui/controls/editor/kit/lsp/client';
import type { LspServices } from '$lib/ui/controls/editor/kit/lsp/services';
import { SERVED_LANGUAGES } from '$lib/ui/controls/editor/kit/lsp/hosts';
import { isLibrary, libraryOf, placeOf, type Target } from '$lib/ui/controls/editor/kit/lsp/uris';
import { readText } from '$lib/state/sources/fs-transport';
import { languageOf } from '$lib/state/sources/explorer/file-type';
import {
    openLibraryFile,
    openReference,
    openSourceFile
} from '$lib/views/shared/links/source-file';
import type { RefFile, RefLine, RefSearch } from '$lib/state/system/machine/lsp/references';
import type { AstNode, MemoryTree } from '$lib/state/system/machine/lsp/clangd';
import { t } from '$lib/state/shared/words/text';

/** The milliseconds a save waits for the language server's formatting (VS Code's participant). */
const FORMAT_TIMEOUT_MS = 60_000;

/** The view that lists the answers of a search, and the one that draws a server's log. */
const REFERENCES_VIEW = 'references';
const OUTPUT_VIEW = 'lsp-output';

/** What a tab's language server wiring reads of the tab, each as a function. */
export type LspTabInput = {
    client: ClientState;
    instance: () => string;
    /** Says a sentence in the tab, as its other notices are said. */
    say: (words: string) => void;
};

/** The file a tab's model shows: a file of a served root, or a library file by its address. */
type LspFile = { root: string; path: string; library?: string };

/** What a tab does with a server. */
export type LspTab = {
    /**
     * The extension that registers the model of a file under a language, or undefined for a
     * language no server serves, a tab with no file and a version of a file at a commit. A library
     * file's root is the one it was named under and its path the file's name.
     */
    extension: (language: string, file: LspFile, version: boolean) => EditorExtension | undefined;
    /**
     * The actions that apply now to a tab of this language, in the order the palette lists them.
     */
    actions: (language: string, file: { root: string; path: string }) => EditorOwnAction[];
    /** The root and language a server serves this tab by, or null when none does. */
    served: (
        language: string,
        file: { root: string; path: string },
        drawn: boolean
    ) => { root: string; language: string } | null;
    /** Format the document with the server before a save; says why when it did not. */
    formatForSave: () => Promise<void>;
    /**
     * Select a range of the text, as a press on an AST node does; the editor takes the keyboard
     * only when `focus` is set, as the Outline's press sets it.
     */
    select: (range: AstNode['range'], focus: boolean) => void;
};

/** The shortcut of an action, with VS Code's keys. */
const KEYS: Record<string, KeyPress> = {
    references: { code: 'F12', shift: true, alt: true },
    header: { code: 'KeyO', alt: true },
    next: { code: 'F4' },
    previous: { code: 'F4', shift: true }
};

/** A notice of the editor extension, by its name, in the catalog's words. */
function noticeWords(key: string, words: string[]): string {
    if (key === 'lsp_other_files') return t('source.lsp_other_files');
    if (key === 'format_failed') return t('source.format_failed', ...words);
    if (key === 'format_timeout') return t('source.format_timeout');
    return key;
}

/** The label of an action of a language: the title of the VS Code command it is. */
function labels(language: string): {
    restart: string;
    output: string;
} {
    return language === 'python'
        ? { restart: t('source.cmd_python_restart'), output: t('source.cmd_python_output') }
        : { restart: t('source.cmd_clangd_restart'), output: t('source.cmd_clangd_output') };
}

/** Whether a language is one a server serves. */
function servedLanguage(language: string): boolean {
    return SERVED_LANGUAGES.includes(language);
}

/** The lines of a text, each as the text a location is shown with. */
function linesOf(text: string): string[] {
    return text.split(/\r\n|\r|\n/);
}

/** A range of the protocol as the answers hold it. */
type Range = {
    start: { line: number; character: number };
    end: { line: number; character: number };
};

/**
 * The location a `Location` or a `LocationLink` of an answer names, or null for a malformed one.
 */
function locationOf(item: unknown): { uri: string; range: Range } | null {
    if (typeof item !== 'object' || item === null) return null;
    const one = item as Record<string, unknown>;
    const uri = typeof one.uri === 'string' ? one.uri : one.targetUri;
    const range = one.range ?? one.targetSelectionRange;
    return typeof uri === 'string' && typeof range === 'object' && range !== null
        ? { uri, range: range as Range }
        : null;
}

/** Make the language server wiring of one source tab. */
export function createLspTab(input: LspTabInput): LspTab {
    const { client } = input;
    const { lsp, documents, references, clangd } = client;

    /** What the registered model gave back, while the extension holds one. */
    const held: {
        handle: LspHandle | null;
        model: Monaco.editor.ITextModel | null;
        editor: Monaco.editor.IStandaloneCodeEditor | null;
        place: LspFile | null;
    } = { handle: null, model: null, editor: null, place: null };

    /** The place in a search or a result a file has: a library file has an address for a path. */
    const refPlace = (file: LspFile): { root: string; path: string; library?: string } =>
        file.library === undefined
            ? { root: file.root, path: file.path }
            : { root: '', path: file.library, library: file.path };

    const services: LspServices = {
        port: (language) => lsp.link(language),
        readFile: async (target) => {
            if (isLibrary(target)) {
                const read = await lsp.readLibrary(target.library);
                const language = lsp.library(target.library)?.language;
                if (language === undefined) return null;
                // A refused read leaves the location in the answer with no text: opening it opens
                // the library tab, which says why the file cannot be shown.
                return { text: 'text' in read ? read.text : '', language };
            }
            const read = await readText(target.root, target.path);
            if (read.error !== '' || read.truncated) return null;
            return {
                text: read.text,
                language: languageOf(target.path, client.selectors.languages())
            };
        },
        open: (target, line, column) => {
            if (isLibrary(target)) {
                openLibraryFile(client, {
                    library: target.library,
                    name: target.name,
                    line,
                    column
                });
            } else {
                openSourceFile(client, { root: target.root, path: target.path, line, column });
            }
        },
        library: lsp.named,
        diagnostics: documents.setDiagnostics,
        symbols: documents.setSymbols,
        notice: (key, ...words) => input.say(noticeWords(key, words)),
        words: (key) => key
    };

    /** The files of an answer's locations, each with the text of its lines. */
    async function filesOf(answer: unknown, own: RefSearch) {
        const locations = (Array.isArray(answer) ? answer : [])
            .map(locationOf)
            .filter((one) => one !== null);
        const texts = new Map<string, string[] | null>();
        const files = new Map<string, RefFile>();
        for (const location of locations) {
            const target: Target | null = libraryOf(location.uri) ?? placeOf(location.uri);
            if (target === null) continue;
            const place = isLibrary(target)
                ? { root: '', path: target.library, library: target.name }
                : { root: target.root, path: target.path };
            const key = JSON.stringify([place.root, place.path]);
            if (!texts.has(key)) {
                const same = place.root === own.root && place.path === own.path;
                const text = same
                    ? held.model?.getValue()
                    : (await services.readFile(target))?.text;
                texts.set(key, text === undefined ? null : linesOf(text));
            }
            const lines = texts.get(key) ?? null;
            if (lines === null) continue;
            const row = location.range.start.line;
            const text = lines[row] ?? '';
            const sameLine = location.range.end.line === row;
            const line: RefLine = {
                line: row + 1,
                start: location.range.start.character,
                end: sameLine ? location.range.end.character : text.length,
                text
            };
            const file = files.get(key) ?? { ...place, lines: [] };
            file.lines.push(line);
            files.set(key, file);
        }
        return [...files.values()]
            .map((file) => ({ ...file, lines: file.lines.sort((a, b) => a.line - b.line) }))
            .sort((a, b) => (a.library ?? a.path).localeCompare(b.library ?? b.path));
    }

    /** Ask the server for a search's locations, grouped by file; null when it could not answer. */
    async function ask(search: RefSearch): Promise<RefFile[] | null> {
        const handle = held.handle;
        if (handle === null) return null;
        const params = {
            position: { line: search.line - 1, character: search.column - 1 },
            ...(search.kind === 'references' ? { context: { includeDeclaration: true } } : {})
        };
        try {
            const answer = await handle.ask(
                search.kind === 'references'
                    ? 'textDocument/references'
                    : 'textDocument/implementation',
                params
            );
            return await filesOf(answer, search);
        } catch {
            return null;
        }
    }

    /** Find All References or Find All Implementations from the caret, shown in the view. */
    async function find(kind: RefSearch['kind']): Promise<void> {
        const at = held.editor?.getPosition() ?? null;
        const place = held.place;
        if (at === null || place === null) return;
        const search: RefSearch = {
            kind,
            word: held.model?.getWordAtPosition(at)?.word ?? '',
            ...refPlace(place),
            line: at.lineNumber,
            column: at.column
        };
        const files = await ask(search);
        if (files === null) return;
        const id = client.layout.openView(REFERENCES_VIEW);
        references.setResult(id, search, files);
    }

    async function showAst(): Promise<void> {
        const handle = held.handle;
        const selection = held.editor?.getSelection() ?? null;
        if (handle === null || selection === null) return;
        const range = {
            start: { line: selection.startLineNumber - 1, character: selection.startColumn - 1 },
            end: { line: selection.endLineNumber - 1, character: selection.endColumn - 1 }
        };
        try {
            const node = (await handle.ask('textDocument/ast', { range })) as AstNode | null;
            clangd.setAst(input.instance(), { node, message: '' });
        } catch {
            clangd.setAst(input.instance(), { node: null, message: '' });
        }
    }

    async function showMemory(): Promise<void> {
        const handle = held.handle;
        if (handle === null) return;
        try {
            const tree = (await handle.ask('$/memoryUsage')) as MemoryTree | null;
            if (tree !== null) clangd.setMemory(input.instance(), { tree });
        } catch {
            // The server answered no memory usage: the section keeps what it had.
        }
    }

    async function switchHeader(): Promise<void> {
        const handle = held.handle;
        if (handle === null) return;
        try {
            const answer = await handle.ask('textDocument/switchSourceHeader');
            const place = typeof answer === 'string' ? placeOf(answer) : null;
            if (place !== null) openSourceFile(client, { root: place.root, path: place.path });
        } catch {
            // No other file of the pair is known.
        }
    }

    function extension(
        language: string,
        file: LspFile,
        version: boolean
    ): EditorExtension | undefined {
        if (!servedLanguage(language) || file.root === '' || file.path === '' || version) {
            return undefined;
        }
        return (kit, editor, model) => {
            const handle = kit.lsp.register(services, model, {
                instance: input.instance(),
                place: { root: file.root, path: file.path },
                ...(file.library === undefined ? {} : { library: file.library }),
                editor
            });
            if (handle === null) return () => undefined;
            held.handle = handle;
            held.model = model;
            held.editor = editor;
            held.place = file;
            const at = refPlace(file);
            const asker = references.registerAsker(at.root, at.path, ask);
            return () => {
                asker();
                handle.dispose();
                held.handle = null;
                held.model = null;
                held.editor = null;
                held.place = null;
                documents.forgetSymbols(input.instance());
                clangd.closeAst(input.instance());
                clangd.closeMemory(input.instance());
            };
        };
    }

    function served(
        language: string,
        file: { root: string; path: string },
        drawn: boolean
    ): { root: string; language: string } | null {
        return drawn && servedLanguage(language) && file.root !== '' && file.path !== ''
            ? { root: file.root, language }
            : null;
    }

    function actions(language: string, file: { root: string; path: string }): EditorOwnAction[] {
        if (!servedLanguage(language) || file.root === '' || file.path === '') return [];
        const { root } = file;
        const state = lsp.server(root, language)?.state;
        const answering = state === 'ready' || state === 'indexing';
        const words = labels(language);
        const python = language === 'python';
        const listed: EditorOwnAction[] = [
            {
                id: 'oculus.lsp.restart',
                label: words.restart,
                run: () => void lsp.restart(root, language)
            },
            {
                id: 'oculus.lsp.output',
                label: words.output,
                run: () => {
                    client.layout.openView(OUTPUT_VIEW, {
                        root,
                        language,
                        label: t('output.tab', python ? 'pyright' : 'clangd', root)
                    });
                }
            },
            python
                ? {
                      id: 'oculus.lsp.interpreter',
                      label: t('source.cmd_python_interpreter'),
                      run: () => client.ui.requestPalette(':interpreter ')
                  }
                : {
                      id: 'oculus.lsp.database',
                      label: t('source.cmd_clangd_database'),
                      run: () => client.ui.requestPalette(':compile-database ')
                  }
        ];
        if (!python && answering) {
            listed.push({
                id: 'oculus.lsp.header',
                label: t('source.cmd_clangd_header'),
                key: KEYS.header,
                run: () => void switchHeader()
            });
        }
        if (answering) {
            listed.push({
                id: 'oculus.lsp.references',
                label: t('source.cmd_find_references'),
                key: KEYS.references,
                run: () => void find('references')
            });
            if (held.handle?.provides('implementationProvider') === true) {
                listed.push({
                    id: 'oculus.lsp.implementations',
                    label: t('source.cmd_find_implementations'),
                    run: () => void find('implementations')
                });
            }
        }
        if (!python && answering) {
            listed.push(
                {
                    id: 'oculus.lsp.ast',
                    label: t('source.cmd_clangd_ast'),
                    menu: 'navigation',
                    run: () => void showAst()
                },
                {
                    id: 'oculus.lsp.memory',
                    label: t('source.cmd_clangd_memory'),
                    run: () => void showMemory()
                }
            );
        }
        if (references.hasResult()) {
            listed.push(
                {
                    id: 'oculus.lsp.next',
                    label: t('source.cmd_next_reference'),
                    key: KEYS.next,
                    run: () => walk(1)
                },
                {
                    id: 'oculus.lsp.previous',
                    label: t('source.cmd_previous_reference'),
                    key: KEYS.previous,
                    run: () => walk(-1)
                }
            );
        }
        return listed;
    }

    /** Go to the next or previous location of the latest References result. */
    function walk(delta: 1 | -1): void {
        const pick = references.step(delta);
        if (pick !== null) openReference(client, pick, pick.line, pick.column);
    }

    async function formatForSave(): Promise<void> {
        const handle = held.handle;
        if (handle === null) return;
        const outcome: FormatOutcome = await handle.format(FORMAT_TIMEOUT_MS);
        if (outcome.kind === 'timeout') input.say(t('source.format_timeout'));
        else if (outcome.kind === 'error') input.say(t('source.format_failed', outcome.message));
    }

    function select(range: AstNode['range'], focus: boolean): void {
        const editor = held.editor;
        if (editor === null || range === undefined) return;
        const selected = {
            startLineNumber: range.start.line + 1,
            startColumn: range.start.character + 1,
            endLineNumber: range.end.line + 1,
            endColumn: range.end.character + 1
        };
        editor.setSelection(selected);
        editor.revealRangeInCenterIfOutsideViewport(selected);
        if (focus) editor.focus();
    }

    return { extension, actions, served, formatForSave, select };
}
