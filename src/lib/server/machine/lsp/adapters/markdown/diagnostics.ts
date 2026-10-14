// Layer 2, server. The diagnostics of a Markdown file as the page is shown them: the server's
// marks for links to files that are not there, with the path inside the root in place of the
// absolute path the server writes, and with every mark dropped whose path lies outside the root or
// in a folder the server is never given; plus the entry's own mark for a backticked path that is
// not there (own/backticks.ts). Both are worded by one catalog sentence, `source.md_no_such_path`.

import { relative, sep } from 'node:path';
import { words } from '../../../../core/words.ts';
import type { DiagnosticView } from '../../servers.ts';
import { resolvedPaths } from './own/backticks.ts';
import { served } from './places.ts';

/** The code of the server's mark for a link to a file that is not there. */
const NO_SUCH_FILE = 'link.no-such-file';

/** The code of the entry's mark for a backticked path that is not there. */
const NO_SUCH_PATH = 'oculus.no-such-path';

/** How the server's message starts; the absolute path follows. */
const SERVER_PREFIX = 'File does not exist at path: ';

/** The warning's severity in the protocol. */
const WARNING = 2;

/** The sentence for a path that is not there, or null when the catalog lacks it. */
function noSuchPath(catalog: Record<string, string>, path: string): string | null {
    return Object.hasOwn(catalog, 'source.md_no_such_path')
        ? words(catalog, 'source.md_no_such_path', path)
        : null;
}

/** The server's diagnostics of a file after the page's rules, and the entry's own. */
export function markdownDiagnostics(
    params: Record<string, unknown>,
    view: DiagnosticView
): Record<string, unknown> {
    const reach = { root: view.root, roots: view.roots };
    const given: unknown[] = Array.isArray(params.diagnostics) ? params.diagnostics : [];
    const kept = given.flatMap((one) => {
        const mark = one as { code?: unknown; message?: unknown };
        if (mark.code !== NO_SUCH_FILE) return [one];
        const message = typeof mark.message === 'string' ? mark.message : '';
        const path = message.startsWith(SERVER_PREFIX) ? message.slice(SERVER_PREFIX.length) : '';
        if (path === '' || !served(path, reach)) return [];
        const shown = noSuchPath(view.catalog, relative(view.root.real, path).split(sep).join('/'));
        if (shown === null) return [];
        // The server's note on the mark holds the absolute path of the file, which nothing uses.
        const { data: _note, ...rest } = one as Record<string, unknown>;
        return [{ ...rest, message: shown }];
    });
    const own = resolvedPaths(view.text, view.real, reach).flatMap((span) => {
        const message = span.kind === 'none' ? noSuchPath(view.catalog, span.path) : null;
        if (message === null) return [];
        return [
            {
                range: {
                    start: { line: span.line, character: span.start },
                    end: { line: span.line, character: span.end }
                },
                severity: WARNING,
                code: NO_SUCH_PATH,
                source: 'oculus',
                message
            }
        ];
    });
    return { ...params, diagnostics: [...kept, ...own] };
}
