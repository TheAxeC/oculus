// Layer 3, view test. How the Markdown document draws a table in a narrow pane, read from the
// component's stylesheet: a table cell breaks at spaces and not inside a word, so a column keeps at
// least its longest word on one line, and the table scrolls sideways inside its own box.
//
// What this does NOT cover: the layout itself, which needs a browser and is seen at the look (a
// table in a 340px pane keeps its first column's longest word whole and scrolls sideways).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FILE = join(process.cwd(), 'src', 'lib', 'views', 'shared', 'prose', 'Markdown.svelte');
const MARKUP = readFileSync(FILE, 'utf8');

/** The component's stylesheet with its comments cut out. */
const SOURCE = MARKUP.slice(MARKUP.indexOf('<style>') + '<style>'.length).replace(
    /\/\*[\s\S]*?\*\//g,
    ''
);

/** The declarations of the rule whose selector list is exactly `selector`. */
function ruleOf(selector: string): string {
    const found = [...SOURCE.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
        (match) => match[1].replace(/\s+/g, ' ').trim() === selector
    );
    return found === undefined ? '' : found[2];
}

describe('a table in the Markdown document', () => {
    // Revert: drop `overflow-wrap: normal` from the cells' rule.
    it('audits that a cell breaks at spaces and not inside a word', () => {
        const cells = ruleOf('.doc :global(th), .doc :global(td)');
        expect(cells).toMatch(/overflow-wrap:\s*normal/);
    });

    // Revert: lay the table out as an ordinary block that widens the document.
    it('audits that the table scrolls sideways inside its own box', () => {
        const table = ruleOf('.doc :global(table)');
        expect(table).toMatch(/display:\s*block/);
        expect(table).toMatch(/overflow-x:\s*auto/);
    });
});
