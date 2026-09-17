// Layer 2, server tests. The words a chat terminal and a LaTeX terminal are started with, filled from
// the engine's own catalog by `words` of server/pty/chat.ts. The arguments are a project's id, title
// and folder and a manuscript's main file, which are text the hub decides. Three cases give them
// placeholder braces, the second also `$` replacement patterns, and expect them in the sentence as
// written; the fourth names a key the catalog lacks and expects the throw.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { words } from '../../../src/lib/server/pty/chat.ts';

const CATALOG = textCatalog(loadConfig(engineDir()).config);

/**
 * The sentence a template makes when its placeholders, written once each and in the order `{0}`,
 * `{1}`, `{2}`, are replaced by `args` and nothing else is touched. The order is asserted, so a
 * reworded template that moves a placeholder fails here rather than building a wrong expectation.
 */
function expected(key: string, args: string[]): string {
    const template = CATALOG[key];
    expect(template).toBeTypeOf('string');
    expect([...template.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]))).toEqual(
        args.map((_, at) => at)
    );
    const pieces = template.split(/\{\d+\}/);
    return pieces.map((piece, at) => (at < args.length ? piece + args[at] : piece)).join('');
}

describe('words', () => {
    // Revert: fill with one `replaceAll` per argument in `words` of server/pty/chat.ts.
    it('keeps a title holding {1} and {2} and a folder holding {0} in the focus note as written', () => {
        const args = ['alpha', 'Title {1} and {2}', '/hub/projects/{0}/alpha'];
        const note = words(CATALOG, 'server.chat.chat_focus_note', ...args);
        expect(note).toBe(expected('server.chat.chat_focus_note', args));
    });

    // Revert: fill with one `replaceAll` per argument in `words` of server/pty/chat.ts.
    it('fills no argument into another argument, and reads no replacement pattern in one', () => {
        const args = ['id-{1}', "Title {2} $& $' {0}", '/hub/{1}/$$'];
        const note = words(CATALOG, 'server.chat.chat_focus_note', ...args);
        expect(note).toBe(expected('server.chat.chat_focus_note', args));
    });

    // Revert: fill with one `replaceAll` per argument in `words` of server/pty/chat.ts.
    it('keeps the braces of a project id and a main file in a LaTeX terminal name', () => {
        const args = ['build', 'alpha-{2}', 'main-{0}.tex'];
        expect(words(CATALOG, 'server.latex.name', ...args)).toBe(
            expected('server.latex.name', args)
        );
    });

    // Revert: return the key instead of throwing when `byKey` finds no template in `words`.
    it('throws on a key the catalog lacks, naming the key', () => {
        expect(() => words(CATALOG, 'server.chat.no_such_key', 1)).toThrow(
            'text key not in config: server.chat.no_such_key'
        );
        expect(() => words({}, 'server.chat.chat_name', 1)).toThrow(
            'text key not in config: server.chat.chat_name'
        );
    });
});
