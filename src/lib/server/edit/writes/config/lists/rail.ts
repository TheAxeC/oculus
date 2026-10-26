// Layer 2, server. The rail's list of pages, as the rail's drag and Hide and the Settings view's
// rail list save it: written into the `settings:` map of the open workspace file.
//
// The list is checked by the rule the page and the Settings view read it with,
// data/sources/config/rail.ts, against the arrangements and the glyph names of the merged config,
// so a list the page would draw with a button missing is refused whole. The list the reader sees is
// then written through the value write (config-value.ts), which lays it over oculus's rail by each
// entry's `page`: every entry of the list in its order, then `{ page: x, removed: true }` for each
// of oculus's pages the list does not hold, so a hidden button stays hidden and the order of a drag
// stays as it was dragged. With no workspace file open the write is refused with the sentence that
// says so.
//
// The watcher follows the workspace file, so the file this writes is pushed on the `config` channel
// within a second and the rail redraws from it.

import {
    arrangementKeys,
    readRail,
    type RailEntry
} from '../../../../../data/sources/config/rail.ts';
import { writeConfigValue } from '../config-value.ts';
import { loadLayers, type ConfigKeyOutcome, type ConfigLayers } from '../config-place.ts';
import { mergedAt } from '../config-checks.ts';

/** The option the rail's list is, and the defaults file it belongs to. */
export const RAIL = 'rail';
const LAYOUT = 'layout.yml';

/** What a rail write answers with: what it changed or why it was refused, or `invalid`. */
export type RailOutcome = ConfigKeyOutcome | { error: 'invalid' };

/**
 * One entry as the file holds it: its chord and group glyph only when it has them, and its
 * `unplaced_collections` and `project_boards` only when it carries each.
 */
function written(entry: RailEntry): Record<string, string | boolean> {
    return {
        label: entry.label,
        glyph: entry.glyph,
        page: entry.page,
        ...(entry.chord === '' ? {} : { chord: entry.chord }),
        ...(entry.group_glyph === '' ? {} : { group_glyph: entry.group_glyph }),
        ...(entry.unplaced_collections ? { unplaced_collections: true } : {}),
        ...(entry.project_boards ? { project_boards: true } : {})
    };
}

/**
 * Write the rail's list over the layers. Every entry must be one the rule keeps, against the
 * arrangements and the glyph names of the merged config, or nothing is written (`invalid`); a list
 * equal to the rail in force writes nothing and answers so.
 */
export function writeRail(
    engine: string,
    layers: ConfigLayers,
    rail: RailEntry[],
    glyphs: string[],
    hubs: readonly string[] = []
): RailOutcome {
    const merged = loadLayers(engine, layers).config;
    const read = readRail(rail, arrangementKeys(merged.arrangements), glyphs);
    if (read.problems.length > 0) return { error: 'invalid' };
    return writeConfigValue(
        engine,
        LAYOUT,
        RAIL,
        read.entries.map(written),
        mergedAt(merged, RAIL),
        layers,
        { hubs, own: true }
    );
}
