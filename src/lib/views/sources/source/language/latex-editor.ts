// Layer 3, view partial of Source.svelte. What a LaTeX source tab adds to its editor: the problems
// of the latest build of this file as markers, the preview of math and pictures, Format Document
// through the server's formatter (state/sessions/latex/latex.svelte.ts), the sectioning commands as
// document symbols for sticky scroll (symbols.ts), and the editing commands (environments,
// sectioning, formatting shortcuts, `@` suggestions, smart selection), the Unicode math symbols
// after a backslash while `latex.unimath_symbols` is on (kit/latex/latex-unimath.ts) and the
// picture beside a file suggested inside `\includegraphics` while `latex.includegraphics_preview`
// is on (kit/latex/latex-pictures.ts). The editor draws them
// (ui/controls/editor/kit/latex/latex-widget.ts and latex-editing.ts); this module is what the page
// hands it.
//
// A picture path in the text is resolved from the folder of the main file the tab builds through
// (`rootOf`), else from the file's own folder, and a file exists when the folder's listing, which
// the file browser reads too, names it.

import type { ClientState } from '$lib/state/client/context';
import { nameOf } from '$lib/state/sources/fs';
import { LATEX_OWNER } from '$lib/state/system/problem-sources';
import { latexOutline } from '$lib/state/sources/explorer/sections/outline';
import type { EditorExtension } from '$lib/ui/controls/editor/types';
import { latexExtension } from '$lib/ui/controls/editor/kit/latex/latex-widget';
import { latexEditing, type LatexCommands } from '$lib/ui/controls/editor/kit/latex/latex-editing';
import { fileBytesUrl } from '$lib/state/sources/fs.svelte';
import { latexSuggest } from '$lib/ui/controls/editor/kit/latex/latex-suggest';
import { latexPictures } from '$lib/ui/controls/editor/kit/latex/latex-pictures';
import { latexUnimath } from '$lib/ui/controls/editor/kit/latex/latex-unimath';
import { blockOf } from '$lib/ui/controls/editor/kit/latex/references';
import { readText } from '$lib/state/sources/fs-transport';
import { t } from '$lib/state/shared/words/text';
import { symbolsExtension } from './symbols';

/** The folder part of a path against a root, the empty string for a file in the root itself. */
function folderOf(path: string): string {
    const at = path.lastIndexOf('/');
    return at < 0 ? '' : path.slice(0, at);
}

/** How long a label read waits for the outline of the root, in milliseconds. */
const OUTLINE_WAIT_MS = 3000;

/** The label of a root's outline, and the root's main file, once the outline has been read. */
async function labelOf(
    client: ClientState,
    file: { root: string; path: string },
    name: string
): Promise<{ root: string; file: string; line: number; number: string } | null> {
    const found = await client.latex.rootOf(file.root, file.path);
    if (found === null) return null;
    const target = { root: found.root, path: found.path };
    let outline = client.latex.outline(target, found.main);
    for (let waited = 0; outline.loading && waited < OUTLINE_WAIT_MS; waited += 150) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        outline = client.latex.outline(target, found.main);
    }
    const label = outline.labels.find((one) => one.name === name);
    return label === undefined
        ? null
        : { root: found.root, file: label.file, line: label.line, number: label.number };
}

/**
 * The editor extension of one LaTeX file of a root. It reads the diagnostics of the latex store
 * when it is made, so a derived value over it is made again whenever a build lands.
 */
export function latexEditor(
    client: ClientState,
    file: { root: string; path: string },
    instance: () => string,
    say: (words: string) => void,
    ready: (commands: LatexCommands | null) => void
): EditorExtension {
    const { root, path } = file;
    const problems = client.latex
        .latexDiagnostics()
        .filter((one) => one.root === root && one.file === path)
        .map((one) => ({ line: one.line ?? 1, severity: one.severity, message: one.message }));
    let folder: Promise<string> | null = null;
    const pictureFolder = (): Promise<string> => {
        folder ??= client.latex
            .rootOf(root, path)
            .then((found) => (found === null ? folderOf(path) : found.path));
        return folder;
    };
    const exists = async (target: string): Promise<boolean> => {
        const listing = await client.fs.readListing(root, folderOf(target));
        return listing.entries.some((one) => one.kind === 'file' && one.name === nameOf(target));
    };
    const address = (target: string): string => fileBytesUrl(root, target);
    const widgets = latexExtension({
        problems,
        owner: LATEX_OWNER,
        folder: pictureFolder,
        exists,
        address,
        format: (text) => client.latex.format(text, path),
        say,
        label: async (name) => {
            const label = await labelOf(client, file, name);
            if (label === null) return null;
            const read = await readText(label.root, label.file);
            if (read.error !== '') return null;
            return { number: label.number, ...blockOf(read.text, label.line) };
        },
        viewOnPdf: (name) => {
            void labelOf(client, file, name).then((label) => {
                if (label === null) return;
                void client.latexActions.forward(label.root, label.file, label.line, 0, instance());
            });
        },
        texdoc: (name) => void client.latexActions.texdoc(name)
    });
    const suggest = latexSuggest({
        environments: client.latex.editing().environments,
        detail: t('latex.suggest_environment')
    });
    const unimath = latexUnimath({
        symbols: () => client.latex.unimath(),
        enabled: () => client.latex.settings()?.unimathSymbols === true
    });
    const pictures = latexPictures({
        enabled: () => client.latex.settings()?.includegraphicsPreview === true,
        folder: pictureFolder,
        exists,
        address,
        origin: () => window.location.origin
    });
    const symbols = symbolsExtension((text) => latexOutline(client.latexReader, text));
    const editing = latexEditing({
        at: client.latex.editing().at,
        parse: (text) => client.latexReader.tree(text),
        ready
    });
    return (kit, editor, model) => {
        const stops = [
            widgets(kit, editor, model),
            suggest(kit, editor, model),
            unimath(kit, editor, model),
            pictures(kit, editor, model),
            symbols(kit, editor, model),
            editing(kit, editor, model)
        ];
        return () => {
            for (const stop of stops) stop();
        };
    };
}
