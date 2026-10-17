// Layer 3, primitive helper of diff/DiffEditor.svelte. The two models of a diff, each on its own
// URI under the editor's name, and git's line changes handed to the page's diff provider for them
// (diff/git-provider.ts), which draws those changes while the models hold the two texts.

import type * as Monaco from 'monaco-editor';
import { modelUri, type EditorKit } from '../kit/load';
import { shikiId } from '../kit/languages/grammars';
import type { DiffLineChange } from '../types';

/**
 * One side's model, on its own URI under the editor's name, holding its text. A model left on that
 * URI is disposed first.
 */
export function sideModel(
    loaded: EditorKit,
    name: string,
    language: string,
    file: string,
    side: 'original' | 'modified',
    text: string
): Monaco.editor.ITextModel {
    const uri = modelUri(loaded.monaco, `${name}:${side}`, file);
    loaded.monaco.editor.getModel(uri)?.dispose();
    return loaded.monaco.editor.createModel(text, shikiId(language), uri);
}

/** Hand the page's diff provider git's changes of the two texts, or drop them for none. */
export function holdChanges(
    loaded: EditorKit,
    on: Monaco.editor.ITextModel,
    held: { original: string; modified: string; changes?: DiffLineChange[] }
): void {
    const given =
        held.changes === undefined
            ? null
            : { ...held, changes: held.changes.map((change) => ({ ...change })) };
    loaded.gitDiffs.hold(on.uri.toString(), given);
}
