// Layer 3, primitive. Monaco's web workers, built by Vite from `?worker` imports. Monaco's own way
// of starting a worker (a URL beside its module) does not resolve under Vite, so each worker is
// a Vite worker module and `load.ts` hands Monaco the one a label asks for. This module is reached
// only by load.ts's dynamic import, so no server bundle and no page that never opens an editor
// carries it.
//
// The labels are Monaco's: its JSON, CSS, HTML and TypeScript language services each ask for
// their own worker, under every language they serve, and anything else asks for the editor's.

import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/languages/features/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/languages/features/html/html.worker?worker';
import JsonWorker from 'monaco-editor/languages/features/json/json.worker?worker';
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker';

/** The labels each language service's worker answers. */
const BY_LABEL: [readonly string[], new () => Worker][] = [
    [['json'], JsonWorker],
    [['css', 'scss', 'less'], CssWorker],
    [['html', 'handlebars', 'razor'], HtmlWorker],
    [['typescript', 'javascript'], TsWorker]
];

/** A new worker for the label Monaco asks with. */
export function workerFor(label: string): Worker {
    const found = BY_LABEL.find(([labels]) => labels.includes(label));
    const Made = found === undefined ? EditorWorker : found[1];
    return new Made();
}
