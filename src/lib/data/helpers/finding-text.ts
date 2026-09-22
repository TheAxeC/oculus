// Layer 1, data. The words a finding is written in, read out of the text catalog by key. Pure, so
// the readers under sources/, the rules of validate.ts and the audit scan of
// server/content/audit.ts call it alike, and client-safe, because state/words/text.ts's t() fills a
// catalog string with the same fillPlaceholders rather than a copy of it. `words` of
// server/machine/pty/chat.ts fills the terminal text (the chat instruction, its notes, the chat and
// LaTeX terminal names) with it too.
//
// A finding's sentence is config/text/findings.yml's, never a literal of the module that raises it,
// so a sentence is reworded in that file alone. The catalog is always an argument: nothing here holds
// one, and the server formats every finding before it goes on the wire as a plain `message`.

import { byKey } from './guards.ts';

/** The flat text catalog, dotted key to sentence, as textCatalog() in sources/config.ts gives it. */
export type TextCatalog = Record<string, string>;

/**
 * A template with `{0}`, `{1}` and so on replaced by the arguments at those positions. A placeholder
 * with no argument is left as it is written, so a sentence missing an argument shows the gap rather
 * than an empty word.
 */
export function fillPlaceholders(template: string, args: readonly (string | number)[]): string {
    return template.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
        const arg = args.at(Number(index));
        return arg === undefined ? placeholder : String(arg);
    });
}

/**
 * The sentence for a finding key, with its arguments in place, or the key followed by its arguments
 * when the catalog lacks the key. It never throws: a finding is reported while the files it is
 * about are broken, config/text/findings.yml among them, and a sentence file that does not parse
 * must not cost the portfolio, a document read or a write. A key misspelt in the code is caught by
 * tests/checks/source/keys.test.ts, which holds every `findings.` literal of the source to the file
 * and every `findingText` key that is not such a literal to a documented rule.
 */
export function findingText(
    catalog: TextCatalog,
    key: string,
    ...args: (string | number)[]
): string {
    const template = byKey(catalog, key);
    if (template === undefined) return [key, ...args.map(String)].join(' ');
    return fillPlaceholders(template, args);
}
