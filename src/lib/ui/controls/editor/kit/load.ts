// Layer 3, primitive. Loading the editor: Monaco, the Shiki grammars of the eighteen first
// languages, the bridge between them, the workers, and the keys the editor gives up. Each editor on
// a page awaits the one promise this module holds, so the load runs once per page, the first time
// an editor mounts. A code theme's file is loaded the first time it is painted, from Shiki's
// bundled themes, each in a chunk of its own.
//
// Monaco needs a DOM, so it is imported inside the promise, which only an editor's `$effect`
// starts. The page renders no component on the server (`ssr = false` in src/routes/+layout.ts);
// until Monaco has loaded, the editor draws its text as a plain block, which is also what the unit
// suite's server render draws. The dynamic import keeps Monaco and Shiki in chunks of their own,
// loaded when the first editor mounts. The list of Shiki's bundled themes (`shiki/themes`) is read
// with the page's first chunk, since the appearance store checks a saved code theme against it; the
// theme files it points at are not. Monaco finds its workers through `self.MonacoEnvironment`, the
// one hook its worker loading reads.
//
// Monaco holds one theme for the whole page, and so does this module: `paint` builds the theme from
// the tokens in force, the body's class string and the code theme chosen (`tokens`, or the id of a
// Shiki theme whose scoped syntax rules replace the tokens' rules, kit/theme/theme.ts's
// `codeRules`) and sets it on every editor, doing nothing when none of them has moved, so each
// editor may call it on every theme change. Under `tokens`, the class of a VS Code theme
// (themes/vscode.css) gives the theme that VS Code theme's own rules (`ownRules`) in place of the
// six code hues; a class with no entry leaves the hues.
// Shiki's bridge (`shikiToMonaco`) defines a Monaco theme for each theme a highlighter holds, wraps
// Monaco's `setTheme` and `create` to keep its tokens coloured by the theme set, and gives each
// language a tokens provider over that highlighter, for the languages the highlighter has loaded
// and Monaco lists at the moment of the call. Shiki caches a theme by its name inside one
// highlighter, so a changed theme under the same name would keep the old colours there: each paint
// makes a new highlighter holding the one theme `oculus` and every grammar loaded so far, bridges
// it over the calls as Monaco made them (so the wraps never stack), and disposes the highlighter
// before it. Monaco's `defineTheme` replaces the theme of that name and redraws it where it is in
// force, and each language's new provider replaces its old one, so a session of theme switches
// holds one theme and one highlighter. A paint of a code theme awaits its file, so the paints are
// queued and the last one asked is the one in force; a file that fails to load rejects that paint
// and leaves the theme before it in force.
//
// The eighteen first languages load with the first editor. Every language of grammars.ts is
// registered with Monaco at the start, so a model can be made under any of them, and the others'
// grammars load when the first model of their language is made, set or picked: `ensureLanguage`
// loads the grammar into the highlighter in force, through the queue the paints run in so that a
// load and a paint never interleave, and bridges it again, which gives the language its tokens
// provider. A second ask for a language whose load is in flight waits on the same load. Until the
// grammar has loaded, a model of c, cpp, lua, ruby, scss, java or dart draws Monaco's own colours
// and a model of the other languages draws plain, and both take Shiki's colours when the load
// ends. A grammar that fails to load leaves its files as they were, logs one line and does not
// stop the next language's load. `close` is the page's teardown: it disposes the highlighter in
// force, and a load in flight at that moment bridges and loads nothing more.
//
// Format Document is answered by one provider per language (`createFormatting`), which hands the
// model it is asked about to the formatter the model's owner gave.
//
// The languages whose blocks are braces and that Monaco has no language service for are folded by
// their braces, by the providers `registerFolding` registers (folding.ts), which leave a model to a
// language server's folding ranges while one serves it.
//
// Semantic tokens (a language server's, lsp/semantic.ts) are coloured by rules of the Monaco theme
// beside the TextMate rules (theme/semantic.ts): after each paint the theme is defined again with
// one rule per row of VS Code's default table the theme colours, since a token no rule matches
// would take the root rule's foreground over Shiki's colour. The language server clients live in
// `lsp` (lsp/hosts.ts).
//
// Monaco's own TypeScript service is switched off for the page before any model exists
// (`silenceBuiltin`), so a hover, a completion or a marker of a TypeScript or JavaScript model is
// the TypeScript language server's alone.

import type * as Monaco from 'monaco-editor';
import { FIRST_LANGUAGES, PLAINTEXT, SHIKI_LANGUAGES, shikiId } from './grammars';
import { COMMAND_PALETTE_EVENT, freedKeys } from '../chords';
import { RITE_GRAMMAR } from './rite/rite';
import { registerSettings } from './rite/settings';
import { registerFolding } from './folding';
import { createLspKit, type LspKit } from './lsp/hosts';
import { Signal } from './lsp/signal';
import { semanticRules } from './theme/semantic';
import { codeRules, editorTheme, ownRules } from './theme/theme';
import type { EditorEnding, EditorKey, KeyPress } from '../types';
import { bundledThemes, bundledThemesInfo } from 'shiki/themes';
import type { BundledLanguage, BundledTheme, LanguageRegistration, ThemeRegistration } from 'shiki';

/**
 * Paint the page's theme from a reading of the tokens, a code theme (`tokens`, the default, or a
 * Shiki theme id) and the body's class string, answering the theme's name once it is in force.
 */
export type Paint = (
    read: (token: string) => string,
    code?: string,
    classes?: string
) => Promise<string>;

/** The edits one model's owner answers a Format Document with. */
export type Format = (model: Monaco.editor.ITextModel) => Promise<Monaco.languages.TextEdit[]>;

/**
 * The page's document formatting: which models Format Document answers for, and by whom. Monaco
 * keeps a language's providers in one list and runs the first that answers for the document, and a
 * provider is told the model it is asked about, so a provider registered for each model of a
 * language would leave the others to answer `[]` for every model but their own. One provider is
 * registered when the first model of a language wants formatting and taken away when the last one
 * stops, and it hands the model it is asked about to the formatter that model's owner gave.
 */
export type Formatting = {
    /**
     * Make one model formattable by `format`; the call it answers takes that away, and the
     * language's provider with it once no model of the language is left.
     */
    add: (model: Monaco.editor.ITextModel, format: Format) => () => void;
};

/** One language's provider and the formatter of each model it answers for. */
type Language = { provider: Monaco.IDisposable; formats: Map<Monaco.editor.ITextModel, Format> };

/** The formatting of one Monaco. */
export function createFormatting(monaco: typeof Monaco): Formatting {
    const languages = new Map<string, Language>();
    return {
        add(model, format) {
            const id = model.getLanguageId();
            let held = languages.get(id);
            if (held === undefined) {
                const formats = new Map<Monaco.editor.ITextModel, Format>();
                const provider = monaco.languages.registerDocumentFormattingEditProvider(id, {
                    provideDocumentFormattingEdits: (asked) =>
                        formats.get(asked)?.(asked) ?? Promise.resolve([])
                });
                held = { provider, formats };
                languages.set(id, held);
            }
            held.formats.set(model, format);
            return () => {
                const now = languages.get(id);
                if (now?.formats.get(model) !== format) return;
                now.formats.delete(model);
                if (now.formats.size > 0) return;
                now.provider.dispose();
                languages.delete(id);
            };
        }
    };
}

/** What an editor needs of the loaded page: Monaco, and the calls that set theme and grammars. */
export type EditorKit = {
    monaco: typeof Monaco;
    /** Whether the page runs on macOS, which is what Cmd and Ctrl+K mean there. */
    mac: boolean;
    /**
     * Build the theme from a reading of the tokens and the code theme, and set it on every editor
     * of the page; the theme's name, `oculus`.
     */
    paint: Paint;
    /**
     * Load the grammar of one of oculus's language names once its first model is made, set or
     * picked; answers when the grammar is in, or at once for a language that needs none or whose
     * grammar failed to load. Never rejects.
     */
    ensureLanguage: (name: string) => Promise<void>;
    /** Which models of the page Format Document answers for, through one provider a language. */
    formatting: Formatting;
    /** The language server clients of the page, one per language a server serves. */
    lsp: LspKit;
};

/** The one load of the page, started by the first editor that mounts. */
let loading: Promise<EditorKit> | null = null;

/** Load the editor once per page and answer what every editor of the page shares. */
export function loadEditor(): Promise<EditorKit> {
    loading ??= start();
    return loading;
}

/** The URI a tab instance's model lives on, one per instance and path. */
export function modelUri(monaco: typeof Monaco, name: string, path: string): Monaco.Uri {
    const file = path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
    return monaco.Uri.from({
        scheme: 'inmemory',
        authority: 'oculus',
        path: `/${encodeURIComponent(name)}/${file}`
    });
}

/** Monaco's value for a line ending. */
export function eolOf(
    monaco: typeof Monaco,
    wanted: EditorEnding
): Monaco.editor.EndOfLineSequence {
    const { EndOfLineSequence } = monaco.editor;
    return wanted === 'CRLF' ? EndOfLineSequence.CRLF : EndOfLineSequence.LF;
}

/**
 * Whether the page runs on macOS, by the test Monaco itself reads its platform with: the one test
 * of it in oculus, which the terminal grid's find and link modifier read too. It answers no on the
 * server, where there is no navigator.
 */
export function onMac(): boolean {
    return typeof navigator !== 'undefined' && navigator.userAgent.includes('Macintosh');
}

/** A key press as Monaco's key code with its modifiers. */
export function keyCode(monaco: typeof Monaco, press: KeyPress): number {
    let code: number = monaco.KeyCode[press.code];
    if (press.cmd === true) code |= monaco.KeyMod.CtrlCmd;
    if (press.ctrl === true) code |= monaco.KeyMod.WinCtrl;
    if (press.shift === true) code |= monaco.KeyMod.Shift;
    if (press.alt === true) code |= monaco.KeyMod.Alt;
    return code;
}

/** One press, or two pressed one after the other, as Monaco's key code. */
export function keysCode(monaco: typeof Monaco, keys: EditorKey): number {
    if ('code' in keys) return keyCode(monaco, keys);
    return monaco.KeyMod.chord(keyCode(monaco, keys[0]), keyCode(monaco, keys[1]));
}

async function start(): Promise<EditorKit> {
    const [monaco, shiki, bridge, workers] = await Promise.all([
        import('monaco-editor'),
        import('shiki'),
        import('@shikijs/monaco'),
        import('./workers')
    ]);
    self.MonacoEnvironment = {
        getWorker: (_id: string, label: string) => workers.workerFor(label)
    };
    const mac = onMac();
    monaco.editor.addKeybindingRules(
        freedKeys(mac).map((press) => ({ keybinding: keyCode(monaco, press), command: null }))
    );
    // The newest command of an id is the one that runs, so the editor's Command Palette menu item
    // opens the workbench's palette in place of Monaco's own.
    monaco.editor.registerCommand('editor.action.quickCommand', () => {
        window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
    });
    const known = new Set(monaco.languages.getLanguages().map((language) => language.id));
    for (const id of SHIKI_LANGUAGES) {
        if (!known.has(id)) monaco.languages.register({ id });
    }
    registerSettings(monaco);
    // The kit asks the painting for the theme's semantic rules and for the languages' grammars, and
    // the painting is made after it, so each is read through a call made when it is needed.
    const painting: { current: Painting | null } = { current: null };
    const lsp = createLspKit(monaco, {
        ensureLanguage: (name) => painting.current?.ensureLanguage(name) ?? Promise.resolve(),
        ruled: () => painting.current?.ruled() ?? new Set(),
        onPainted: (listener) =>
            painting.current?.onPainted(listener) ?? { dispose: () => undefined }
    });
    registerFolding(monaco, lsp.served);
    silenceBuiltin(monaco);
    const made = painter({
        monaco,
        createHighlighter: shiki.createHighlighter,
        shikiToMonaco: bridge.shikiToMonaco,
        langs: FIRST_LANGUAGES,
        source: (id) => (id === 'rite' ? RITE_GRAMMAR : (id as BundledLanguage)),
        codeIds: bundledThemesInfo.map((info) => info.id),
        loadTheme: async (id) => (await bundledThemes[id as BundledTheme]()).default,
        semantic: (highlighter) => {
            const resolved = highlighter.getTheme(THEME);
            const rules = semanticRules(resolved.tokenColors ?? resolved.settings);
            const data = bridge.textmateThemeToMonacoTheme(resolved) as MonacoThemeData;
            return {
                data: { ...data, rules: [...data.rules, ...rules] },
                ruled: new Set(rules.map((rule) => rule.token))
            };
        }
    });
    painting.current = made;
    self.addEventListener('pagehide', (event) => {
        if (!event.persisted) made.close();
    });
    return {
        monaco,
        mac,
        paint: made.paint,
        ensureLanguage: made.ensureLanguage,
        formatting: createFormatting(monaco),
        lsp
    };
}

/** The features of Monaco's TypeScript service, all off. */
const NO_BUILTIN = {
    completionItems: false,
    hovers: false,
    documentSymbols: false,
    definitions: false,
    references: false,
    documentHighlights: false,
    rename: false,
    diagnostics: false,
    documentRangeFormattingEdits: false,
    signatureHelp: false,
    onTypeFormattingEdits: false,
    codeActions: false,
    inlayHints: false
};

/**
 * Switch Monaco's own TypeScript service off for the page. Monaco registers its providers once,
 * when the first TypeScript or JavaScript model is made, from the modes set at that time, and a
 * later change of the modes registers nothing and removes nothing, so the modes are set here,
 * before any model exists, and the TypeScript language server is the page's one TypeScript and
 * JavaScript service.
 */
function silenceBuiltin(monaco: typeof Monaco): void {
    for (const defaults of [
        monaco.typescript.typescriptDefaults,
        monaco.typescript.javascriptDefaults
    ]) {
        defaults.setModeConfiguration(NO_BUILTIN);
    }
}

/** The page's one theme name, in Shiki and in Monaco. */
export const THEME = 'oculus';

/** What a highlighter is loaded a grammar from: a Shiki id, or a grammar of oculus's own. */
type Grammar = BundledLanguage | LanguageRegistration;

/** A highlighter as painting holds it: something to bridge, load grammars into and dispose. */
type Held = { dispose: () => void; loadLanguage: (grammar: Grammar) => Promise<void> };

/** The data of a Monaco theme, as `defineTheme` takes it. */
type MonacoThemeData = Parameters<typeof Monaco.editor.defineTheme>[1];

/** What a paint needs: Monaco, Shiki's highlighter maker, the bridge and the grammars to load. */
export type PaintParts<H extends Held> = {
    monaco: {
        editor: Pick<typeof Monaco.editor, 'defineTheme' | 'setTheme' | 'create'>;
        languages: Pick<typeof Monaco.languages, 'getLanguages' | 'setTokensProvider'>;
    };
    createHighlighter: (options: { themes: ThemeRegistration[]; langs: Grammar[] }) => Promise<H>;
    shikiToMonaco: (highlighter: H, monaco: never) => void;
    /** The ids of the grammars every highlighter starts with. */
    langs: readonly string[];
    /** What the grammar of an id is loaded from: the id for a grammar Shiki bundles. */
    source: (id: string) => Grammar;
    /** The ids of the Shiki themes a paint may be asked for; any other paints as `tokens`. */
    codeIds: readonly string[];
    /** One Shiki theme's registration, loaded from its file. */
    loadTheme: (id: string) => Promise<ThemeRegistration>;
    /**
     * The Monaco theme a paint is defined again as once its colours are bridged, with the rules of
     * semantic tokens added, and the lookup strings those rules are for.
     */
    semantic?: (highlighter: H) => {
        data: MonacoThemeData;
        ruled: ReadonlySet<string>;
    };
};

/** What the page holds of the editor's highlighting: the theme paint and the grammar loads. */
export type Painting = {
    paint: Paint;
    ensureLanguage: (name: string) => Promise<void>;
    /** The lookup strings of the semantic tokens the theme in force colours. */
    ruled: () => ReadonlySet<string>;
    /** Hear every paint that changed the theme; the call it answers stops hearing. */
    onPainted: (listener: () => void) => { dispose(): void };
    /** End the page's highlighting: dispose the highlighter and load nothing more. */
    close: () => void;
};

/**
 * The page's paint: each call builds the theme from a reading of the tokens and the code theme
 * asked for and, when it differs from the one in force, sets it through a new highlighter holding
 * it alone, disposing the one before. The code theme's file is loaded once and kept, a load that
 * failed is asked again by the next paint, and an id the list does not hold paints as `tokens`.
 * The calls run in the order they were made, so two editors never set half a theme each and the
 * last one asked is the one in force, and a paint that failed leaves the theme before it in force
 * while the next still runs.
 *
 * `ensureLanguage` loads a language's grammar into the highlighter in force, as a job of the same
 * queue, and bridges it again; each highlighter a later paint makes holds every grammar loaded so
 * far. A language is loaded once, a second ask waits on the first, and a load asked before the
 * first paint waits for that paint.
 */
export function painter<H extends Held>(parts: PaintParts<H>): Painting {
    const editor = parts.monaco.editor;
    const made = { setTheme: editor.setTheme, create: editor.create };
    const known = new Set(parts.codeIds);
    const rules = new Map<string, ReturnType<typeof codeRules>>();
    const loads = new Map<string, Promise<void>>();
    const loaded: string[] = [];
    let painted = '';
    let ruled: ReadonlySet<string> = new Set();
    const repainted = new Signal();
    let held: H | null = null;
    let closed = false;
    /** Whether `close` has been called, read through a call so a wait does not narrow it. */
    const ended = (): boolean => closed;
    let queue: Promise<unknown> = Promise.resolve();
    let opened: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
        opened = resolve;
    });

    /** Run a job after the ones before it, whether or not they failed. */
    function enqueue<T>(job: () => Promise<T>): Promise<T> {
        const run = queue.catch(() => undefined).then(job);
        queue = run;
        return run;
    }

    /**
     * A code theme's syntax rules, from the file the first time and from the store after. Shiki
     * normalises the registration it is handed in place, adding a rule of the base colours, so
     * each paint gets a copy and the store keeps the rules as the file gave them.
     */
    async function rulesOf(id: string): Promise<ReturnType<typeof codeRules>> {
        let kept = rules.get(id);
        if (kept === undefined) {
            kept = codeRules(await parts.loadTheme(id));
            rules.set(id, kept);
        }
        return structuredClone(kept);
    }

    /** Give a highlighter's loaded languages their tokens providers, with the wraps reset. */
    function bridge(highlighter: H): void {
        Object.assign(editor, made);
        parts.shikiToMonaco(highlighter, parts.monaco as never);
    }

    async function paintNow(
        read: (token: string) => string,
        code: string,
        classes: string
    ): Promise<string> {
        if (ended()) return THEME;
        const { textmate } = editorTheme(read, THEME);
        const id = known.has(code) ? code : '';
        const tokenColors = (id === '' ? ownRules(classes) : undefined) ?? textmate.tokenColors;
        const signature = JSON.stringify([id, textmate.type, textmate.colors, tokenColors]);
        if (signature === painted) return THEME;
        const theme = { ...textmate, tokenColors: id === '' ? tokenColors : await rulesOf(id) };
        const langs = [...parts.langs, ...loaded].map(parts.source);
        const next = await parts.createHighlighter({ themes: [theme], langs });
        if (ended()) {
            next.dispose();
            return THEME;
        }
        bridge(next);
        const semantic = parts.semantic?.(next);
        if (semantic !== undefined) {
            editor.defineTheme(THEME, semantic.data);
            ruled = semantic.ruled;
        }
        held?.dispose();
        held = next;
        painted = signature;
        opened();
        repainted.fire();
        return THEME;
    }

    /** Load one grammar into the highlighter in force. A failure is logged and forgotten. */
    async function loadNow(id: string): Promise<void> {
        const target = held;
        if (ended() || target === null) return;
        try {
            await target.loadLanguage(parts.source(id));
        } catch (error) {
            loads.delete(id);
            if (!ended()) console.error(`editor: the grammar ${id} did not load`, error);
            return;
        }
        if (ended()) return;
        loaded.push(id);
        bridge(target);
    }

    function ensureLanguage(name: string): Promise<void> {
        const id = shikiId(name);
        if (ended() || id === PLAINTEXT || parts.langs.includes(id)) return Promise.resolve();
        let load = loads.get(id);
        if (load === undefined) {
            load = ready.then(() => enqueue(() => loadNow(id)));
            loads.set(id, load);
        }
        return load;
    }

    function close(): void {
        closed = true;
        held?.dispose();
        opened();
    }

    return {
        paint: (read, code = '', classes = '') => enqueue(() => paintNow(read, code, classes)),
        ensureLanguage,
        ruled: () => ruled,
        onPainted: repainted.event,
        close
    };
}
