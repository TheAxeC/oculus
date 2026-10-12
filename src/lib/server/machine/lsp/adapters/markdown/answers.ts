// Layer 2, server. What the Markdown entry answers itself: Go to Definition on a backticked path
// (backticks.ts), and the resolve of a link to a file that is not there. The Markdown server knows
// links and not backticks, so the path under a press with Cmd is opened here, at the line a `:<n>`
// or `:<n>-<m>` suffix names and at line 1 without one. A path that is a folder, or is not there,
// answers nothing; a position outside every counted span goes on to the server. A link to a file
// that is not there is given back as it is, with no target, so a press on it opens nothing.

import { existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { inside } from '../../../../core/paths.ts';
import type { PageAnswer, PageRequest, PageView } from '../../servers.ts';
import { normal, pageUri, parsePageUri } from '../../uris.ts';
import { resolvedPaths, spanAt } from './backticks.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The page's address of a real path: its open tab's, else its address under its innermost root. */
function addressOf(real: string, view: PageView): string | null {
    const open = view.documents.find((one) => normal(one.real) === normal(real));
    if (open !== undefined) return open.pageUri;
    let best: (typeof view.roots)[number] | null = null;
    for (const root of view.roots) {
        if (inside(real, root.real) && (best === null || root.real.length > best.real.length)) {
            best = root;
        }
    }
    return best === null ? null : pageUri(best.key, relative(best.real, real).split(sep).join('/'));
}

/** A link to a file that is not there, given back with no target; else undefined. */
function answerMissing(params: unknown, view: PageView): PageAnswer | undefined {
    const data = isRecord(params) ? params.data : null;
    const href = isRecord(data) ? data.href : null;
    const path = isRecord(href) && isRecord(href.path) ? href.path.external : null;
    const named = parsePageUri(path);
    const root = named === null ? undefined : view.roots.find((one) => one.key === named.root);
    if (named === null || root === undefined) return undefined;
    return existsSync(join(root.real, ...named.path.split('/'))) ? undefined : { result: params };
}

/** The Markdown entry's own answers, or undefined for a request that is the server's. */
export function answerMarkdown(request: PageRequest, view: PageView): PageAnswer | undefined {
    if (request.method === 'documentLink/resolve') return answerMissing(request.params, view);
    return answerBackticked(request, view);
}

/** Go to Definition on a backticked path, or undefined for a request that is the server's. */
function answerBackticked(request: PageRequest, view: PageView): PageAnswer | undefined {
    const { method, params } = request;
    if (method !== 'textDocument/definition' || !isRecord(params)) return undefined;
    if (!isRecord(params.textDocument) || !isRecord(params.position)) return undefined;
    const document = view.document(params.textDocument.uri);
    const { line, character } = params.position;
    if (document === undefined || typeof line !== 'number' || typeof character !== 'number') {
        return undefined;
    }
    let root: (typeof view.roots)[number] | null = null;
    for (const one of view.roots) {
        if (
            inside(document.real, one.real) &&
            (root === null || one.real.length > root.real.length)
        ) {
            root = one;
        }
    }
    if (root === null) return undefined;
    const span = spanAt(
        resolvedPaths(document.text, document.real, {
            root,
            roots: view.roots
        }),
        line,
        character
    );
    if (span === undefined) return undefined;
    const uri = span.kind === 'file' && span.real !== null ? addressOf(span.real, view) : null;
    if (uri === null) return { result: null };
    const at = { line: span.target - 1, character: 0 };
    return { result: [{ uri, range: { start: at, end: at } }] };
}
