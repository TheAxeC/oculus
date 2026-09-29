// Layer 3, primitive. Loading the editor: Monaco, the Shiki grammars of the eighteen coloured
// languages, the bridge between them, the workers, and the keys the editor gives up. Each editor on
// a page awaits the one promise this module holds, so the load runs once per page, the first time
// an editor mounts.
//
// Monaco needs a DOM, so it is imported inside the promise, which only an editor's `$effect`
// starts. The page renders no component on the server (`ssr = false` in src/routes/+layout.ts);
// until Monaco has loaded, the editor draws its text as a plain block, which is also what the unit
// suite's server render draws. The dynamic import keeps Monaco and Shiki in chunks of their own,
// loaded when the first editor mounts. Monaco finds its workers through `self.MonacoEnvironment`,
// the one hook its worker loading reads.
//
// Monaco holds one theme for the whole page, and so does this module: `paint` builds the theme
// from the tokens in force and sets it on every editor, doing nothing when the tokens have not
// moved, so each editor may call it on every theme change. Shiki's bridge (`shikiToMonaco`)
// defines a Monaco theme for each theme a highlighter holds, wraps Monaco's `setTheme` and `create`
// to keep its tokens coloured by the theme set, and gives each language a tokens provider over that
// highlighter. Shiki caches a theme by its name inside one highlighter, so a changed theme under
// the same name would keep the old colours there: each paint makes a new highlighter holding the
// one theme `oculus` and the grammars, bridges it over the calls as Monaco made them (so the wraps
// never stack), and disposes the highlighter before it. Monaco's `defineTheme` replaces the theme
// of that name and redraws it where it is in force, and each language's new provider replaces its
// old one, so a session of theme switches holds one theme and one highlighter.
//
// Monaco's TypeScript service checks a file against the files of its project, which an editor
// holding one file has none of, so its semantic check is off and its syntax check stays on.

import type * as Monaco from 'monaco-editor';
import { SHIKI_LANGUAGES } from './grammars';
import { freedKeys, type KeyPress } from '../chords';
import { editorTheme } from './theme';
import type { EditorEnding } from '../types';
import type { ThemeRegistration } from 'shiki';

/** What an editor needs of the loaded page: Monaco, and the one call that sets its theme. */
export type EditorKit = {
    monaco: typeof Monaco;
    /** Whether the page runs on macOS, which is what Cmd and Ctrl+K mean there. */
    mac: boolean;
    /**
     * Build the theme from a reading of the tokens and set it on every editor of the page; the
     * theme's name, `oculus`.
     */
    paint: (read: (token: string) => string) => Promise<string>;
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
    const quiet = { noSemanticValidation: true, noSyntaxValidation: false };
    monaco.typescript.typescriptDefaults.setDiagnosticsOptions(quiet);
    monaco.typescript.javascriptDefaults.setDiagnosticsOptions(quiet);
    const known = new Set(monaco.languages.getLanguages().map((language) => language.id));
    for (const id of SHIKI_LANGUAGES) {
        if (!known.has(id)) monaco.languages.register({ id });
    }
    const paint = painter({
        monaco,
        createHighlighter: shiki.createHighlighter,
        shikiToMonaco: bridge.shikiToMonaco,
        langs: SHIKI_LANGUAGES
    });
    return { monaco, mac, paint };
}

/** The page's one theme name, in Shiki and in Monaco. */
export const THEME = 'oculus';

/** A highlighter as painting holds it: something to bridge and, once replaced, to dispose. */
type Held = { dispose: () => void };

/** What a paint needs: Monaco, Shiki's highlighter maker, the bridge and the grammars to load. */
export type PaintParts<H extends Held> = {
    monaco: {
        editor: Pick<typeof Monaco.editor, 'defineTheme' | 'setTheme' | 'create'>;
        languages: Pick<typeof Monaco.languages, 'getLanguages' | 'setTokensProvider'>;
    };
    createHighlighter: (options: { themes: ThemeRegistration[]; langs: string[] }) => Promise<H>;
    shikiToMonaco: (highlighter: H, monaco: never) => void;
    langs: readonly string[];
};

/**
 * The page's paint: each call builds the theme from a reading of the tokens and, when it differs
 * from the one in force, sets it through a new highlighter holding it alone, disposing the one
 * before. The calls run in the order they were made, so two editors never set half a theme each,
 * and a paint that failed leaves the theme before it in force while the next still runs.
 */
export function painter<H extends Held>(
    parts: PaintParts<H>
): (read: (token: string) => string) => Promise<string> {
    const editor = parts.monaco.editor;
    const made = { setTheme: editor.setTheme, create: editor.create };
    let painted = '';
    let held: H | null = null;
    let queue: Promise<string> = Promise.resolve(THEME);

    async function paintNow(read: (token: string) => string): Promise<string> {
        const { textmate } = editorTheme(read, THEME);
        const signature = JSON.stringify([textmate.type, textmate.colors, textmate.tokenColors]);
        if (signature === painted) return THEME;
        const next = await parts.createHighlighter({ themes: [textmate], langs: [...parts.langs] });
        Object.assign(editor, made);
        parts.shikiToMonaco(next, parts.monaco as never);
        held?.dispose();
        held = next;
        painted = signature;
        return THEME;
    }

    return (read) => {
        queue = queue.catch(() => THEME).then(() => paintNow(read));
        return queue;
    };
}
