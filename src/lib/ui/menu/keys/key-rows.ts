// Layer 3, primitive. The keyboard reference's rows: one catalog string split into labelled pairs,
// apart from the component so the shell owns only whether the modal is present and the catalog
// remains the source of words.

export type KeySheetRow = { key: string; meaning: string };

/** Split the catalog's `key | meaning;;key | meaning` shape into rows, trimming its separators. */
export function sheetRows(value: string): KeySheetRow[] {
    return value.split(';;').map((row) => {
        const [key = '', meaning = ''] = row.split('|');
        return { key: key.trim(), meaning: meaning.trim() };
    });
}
