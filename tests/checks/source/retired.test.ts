// Layer 4, tree check. The documents describe the tool as it is. A config file is edited in the
// Settings view, whose groups and file controls list every file, and the machine's own file is
// listed there by its keys. A line of HELP.md, DESIGN.md or README.md that names a Config view, a
// Config card or a card of `local.yml` names a screen the tool does not have. This reads the
// documents' text for those phrases.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const DOCS = ['HELP.md', 'DESIGN.md', 'README.md'];

/** The phrases that name a Config view and its cards. */
const RETIRED = ['Config view', 'Config card', 'config view', 'config card', 'card of `local.yml`'];

/** Every line of a document naming one of the phrases, as `file:line: text`. */
function hits(): string[] {
    return DOCS.flatMap((doc) =>
        readFileSync(doc, 'utf8')
            .split('\n')
            .flatMap((line, index) =>
                RETIRED.some((phrase) => line.includes(phrase))
                    ? [`${doc}:${index + 1}: ${line.trim().slice(0, 120)}`]
                    : []
            )
    );
}

describe('the documents', () => {
    it('name no Config view, no Config card and no local.yml card', () => {
        expect(hits()).toEqual([]);
    });
});
