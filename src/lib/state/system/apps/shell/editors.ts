// Layer 2, client state. Which custom editor an acting app offers for a file: the editors whose
// `filenamePattern` matches the file's name, VS Code's glob (`*`, `**`, `?` and `{a,b}`) matched
// without regard to case. A pattern with no `/` is matched against the file's name alone, as VS
// Code matches it; one with a `/` against the whole path under its root.

import type { EditorOffer } from './contributions.ts';

/** The expression a glob stands for. */
function expression(glob: string): RegExp {
    let source = '';
    for (let at = 0; at < glob.length; at += 1) {
        const char = glob[at];
        if (char === '*' && glob[at + 1] === '*') {
            const slash = glob[at + 2] === '/';
            source += slash ? '(?:.*/)?' : '.*';
            at += slash ? 2 : 1;
        } else if (char === '*') source += '[^/]*';
        else if (char === '?') source += '[^/]';
        else if (char === '{') source += '(?:';
        else if (char === '}') source += ')';
        else if (char === ',' && source.includes('(?:')) source += '|';
        else source += char.replace(/[.+^$()|[\]\\]/g, '\\$&');
    }
    return new RegExp(`^${source}$`, 'i');
}

/** Whether a glob matches a path under a root. */
function globMatches(glob: string, path: string): boolean {
    const name = path.split('/').at(-1) ?? path;
    return expression(glob).test(glob.includes('/') ? path : name);
}

/** The custom editors that open a file, in the apps' order. */
export function editorsFor(offers: readonly EditorOffer[], path: string): EditorOffer[] {
    return offers.filter((one) =>
        one.editor.selector.some((pattern) => globMatches(pattern, path))
    );
}

/** The editor a file opens in without being asked: the first `default` editor that matches. */
export function defaultEditorFor(
    offers: readonly EditorOffer[],
    path: string
): EditorOffer | undefined {
    return editorsFor(offers, path).find((one) => one.editor.priority === 'default');
}
