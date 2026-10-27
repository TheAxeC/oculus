// Layer 1, data, pure. The one shape of a list's column as its Columns menu lists it. A board's
// list and a collection's list build their columns in client state
// (state/boards/board/filter-menu.ts `listCells`, state/boards/collection/ `entryColumns`), and
// the table primitive draws them in the list's width (ui/display/table/table-rows.ts
// `fittedColumns`), so the three read one declaration.

/** One column a list's Columns menu lists: its key, its heading, and whether it is drawn. */
export type ListedColumn = { key: string; label: string; shown: boolean };
