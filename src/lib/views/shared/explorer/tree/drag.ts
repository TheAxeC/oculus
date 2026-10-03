// Layer 3, view partial. What the tree reads off an event: the things a drag from outside the page
// carries (each file with whether it is a folder), whether a drag carries the tree's own row types,
// and the segment of a folder chain an event landed on. The decision of what a drop does is
// state/sources/explorer/acts/drop.ts's.

import { FILE_DRAG, FOLDER_DRAG, type TreeRow } from '$lib/state/sources/fs';
import { rowAt } from '$lib/state/sources/explorer/acts/selection';
import type { OutsideItem } from '$lib/state/sources/explorer/acts/drop';

/** Whether a drag carries a row of this tree. */
export function carriesRow(event: DragEvent): boolean {
    const types = event.dataTransfer?.types ?? [];
    return types.includes(FILE_DRAG) || types.includes(FOLDER_DRAG);
}

/** Whether a drag carries files from outside the page and no row of the tree. */
export function carriesOutside(event: DragEvent): boolean {
    return !carriesRow(event) && (event.dataTransfer?.types ?? []).includes('Files');
}

/**
 * The things a drop from outside the page carries, in the order dropped: the name of each, whether
 * it is a folder (the browser's file system entry says so), and the file itself for a file.
 */
export function outsideThings(event: DragEvent): (OutsideItem & { file: File | null })[] {
    const items = [...(event.dataTransfer?.items ?? [])];
    return items.flatMap((item) => {
        if (item.kind !== 'file') return [];
        const file = item.getAsFile();
        if (file === null) return [];
        const directory = item.webkitGetAsEntry()?.isDirectory === true;
        return [{ name: file.name, directory, file: directory ? null : file }];
    });
}

/** The row, or the segment of its folder chain, an event landed on. */
export function targetOf(row: TreeRow, event: Event): TreeRow {
    if (row.chain === undefined || !(event.target instanceof Element)) return row;
    const segment = event.target.closest<HTMLElement>('[data-fs-seg]')?.dataset.fsSeg;
    return segment === undefined ? row : (rowAt([row], { root: row.root, path: segment }) ?? row);
}
