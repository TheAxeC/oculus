// Layer 2, server tests. The words a chat terminal and a LaTeX terminal are started with, filled
// from the engine's own catalog by `words` of server/core/words.ts. The arguments are a
// project's id, title and folder and a manuscript's main file, which are text the hub decides.
// Three rows of one table give them placeholder braces, the second also `$` replacement patterns,
// and expect them in the sentence as written; the last case names a key the catalog lacks and
// expects the throw.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { words } from '../../../../src/lib/server/core/words.ts';

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
    it.each([
        [
            'a title holding {1} and {2} and a folder holding {0} in the focus note',
            'server.chat.chat_focus_note',
            ['alpha', 'Title {1} and {2}', '/hub/projects/{0}/alpha']
        ],
        [
            'an argument holding the position of another and a replacement pattern',
            'server.chat.chat_focus_note',
            ['id-{1}', "Title {2} $& $' {0}", '/hub/{1}/$$']
        ],
        [
            'the braces of a project id and a main file in a LaTeX terminal name',
            'server.latex.name',
            ['build', 'alpha-{2}', 'main-{0}.tex']
        ]
    ])('writes %s as given', (_name, key, args) => {
        expect(words(CATALOG, key, ...args)).toBe(expected(key, args));
    });

    it('throws on a key the catalog lacks, naming the key', () => {
        expect(() => words(CATALOG, 'server.chat.no_such_key', 1)).toThrow(
            'text key not in config: server.chat.no_such_key'
        );
        expect(() => words({}, 'server.chat.chat_name', 1)).toThrow(
            'text key not in config: server.chat.chat_name'
        );
    });
});
