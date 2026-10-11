// Layer 2, client state. The folder the new-project form starts with: the `new_project_dir` entry
// of the board's tier, when it is a folder inside a scan folder. An entry that is not (the hub
// reports it as a finding) is not used, and the form starts with an empty folder.

import { byKey, fields, text as str } from '../../../data/helpers/guards.ts';
import { folderOf, inScan } from '../../../data/helpers/hub-names.ts';
import { readAs, rowsShape, wordShape } from '../../../data/shapes/shapes.ts';
import { z } from 'zod';

/** One `scan:` entry: its folder. */
const scanDirShape = z.object({ dir: wordShape });

/** The folders of the `scan:` list of the merged config. */
const scanDirsShape = rowsShape(scanDirShape);

/**
 * The folder the form of one tier starts with, or the empty text when the tier has no usable
 * `new_project_dir` entry.
 */
export function newProjectFolder(config: Record<string, unknown>, tier: string): string {
    const folder = folderOf(str(byKey(fields(config.new_project_dir), tier)));
    if (folder === '') return '';
    const dirs = (readAs(scanDirsShape, config.scan) ?? []).map((row) => row.dir);
    return inScan(folder, dirs) ? folder : '';
}
