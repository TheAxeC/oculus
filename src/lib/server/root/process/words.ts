// Layer 2, server. The text catalog for a process that speaks outside a request: the lines the
// server prints at start and the dialogs and menus of the desktop host. It reads the engine's
// config once, on the first line asked for, so a start that never says anything reads nothing.
//
// A caller binds the reader to `t` and writes each key as a literal at its call, which is what
// tests/checks/source/keys.test.ts reads; this module passes the key on and is not a call site.

import { loadConfig, textCatalog } from '../../../data/sources/config.ts';
import { words as filled } from '../../core/words.ts';

/** The reader of one engine's catalog: a key's sentence with its placeholders filled. */
export type Words = (key: string, ...args: (string | number)[]) => string;

/** The catalog of `engine`'s config folder, read when the first line is asked for. */
export function wordsOf(engine: string): Words {
    let catalog: Record<string, string> | undefined;
    return (key, ...args) => {
        catalog ??= textCatalog(loadConfig(engine).config);
        return filled(catalog, key, ...args);
    };
}
