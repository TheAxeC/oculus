// Layer 4, test helper. Line counts as GET /api/lines answers them, built from their sums, for the
// cases over the counter, its route, the page store and the Status view's table.

import type {
    FolderLines,
    LanguageLines,
    LineCount,
    LineTally
} from '../../../src/lib/data/model/index.ts';

/** Files, blank, comment, code and TODO lines, in the order the table draws them. */
export type Sums = [number, number, number, number, number];

/** A tally from its five sums. */
export function tally([files, blank, comment, code, todo]: Sums): LineTally {
    return { files, blank, comment, code, todo };
}

/** One language row. */
export function language(name: string, sums: Sums): LanguageLines {
    return { language: name, ...tally(sums) };
}

/** One folder row with its languages. */
export function folder(name: string, sums: Sums, languages: LanguageLines[]): FolderLines {
    return { folder: name, ...tally(sums), languages };
}

/** Two folders, the top level with two languages, and their total. */
export const COUNT: LineCount = {
    rows: [
        folder(
            '',
            [3, 20, 5, 1234, 1],
            [language('Markdown', [2, 18, 0, 1200, 0]), language('TypeScript', [1, 2, 5, 34, 1])]
        ),
        folder('src/lib/x', [1, 1, 0, 4, 0], [language('Svelte', [1, 1, 0, 4, 0])])
    ],
    total: tally([4, 21, 5, 1238, 1]),
    counted: '2026-09-28T10:00:00.000Z'
};
