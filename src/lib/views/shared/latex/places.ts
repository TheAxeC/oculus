// Layer 3, shared view partial. Where the LaTeX rows put a file, apart from the markup so the
// choice can be read without a rendering: a name in the folder of a main file, against its root.

import { normalisePath } from '$lib/state/sources/fs';

/** A name in the folder `dir` of a root, both against the root; the root's own folder is empty. */
export function inFolder(dir: string, name: string): string {
    return normalisePath(`${dir}/${name}`);
}
