// Layer 2, server. One audit finding parked or brought back: the `audit_ignore:` list as the
// reader sees it, with the signature added at the end or taken out, written into the `settings:`
// map of the open workspace file.
//
// The list is a list with no `key:` field, so the workspace file holds it whole and it replaces
// oculus's list (config-value.ts writes it, `own`, since the Settings view's rule for the list,
// which only drops items, is not this write's). With no workspace file open the write is refused
// with the sentence that says so. A park is not taken back from History: the Audit view brings a
// finding back with the same write, so the outcome carries no record.
//
// The watcher follows the workspace file, so the file this writes is pushed on the `config` channel
// within a second and the audit is published again with the new muted list.

import { stringItemsShape } from '../../../../../data/shapes/shapes.ts';
import { SIGNATURE } from '../../../../content/audit/scan.ts';
import { writeConfigValue } from '../config-value.ts';
import { loadLayers, type ConfigKeyOutcome, type ConfigLayers } from '../config-place.ts';
import { mergedAt } from '../config-checks.ts';

/** The option the parked signatures are, and the defaults file it belongs to. */
export const IGNORE = 'audit_ignore';
const BEHAVIOR = 'behavior.yml';

/** What a mute write answers with: what it changed or why it was refused, or `invalid`. */
export type MuteOutcome = ConfigKeyOutcome | { error: 'invalid' };

/**
 * Every string entry of the list in force, in its order, and none for a value that is no list. A
 * line that is not a signature (a note the reader left there by hand) is kept and written back
 * where it was; server/content/audit/scan.ts's `mutedSignatures` is what decides which of them are
 * muted findings, so such a line mutes nothing and is not lost either.
 */
const ignoredShape = stringItemsShape.catch([]);

/** The list one write leaves behind: the signature added at the end, or taken out. */
function nextList(current: string[], signature: string, muted: boolean): string[] {
    const without = current.filter((one) => one !== signature);
    return muted ? [...without, signature] : without;
}

/**
 * Park one finding or bring it back over the layers. A signature that is not twelve hex characters
 * is refused without reading anything, and a write that would leave the list as it is writes
 * nothing.
 */
export function writeMute(
    engine: string,
    layers: ConfigLayers,
    signature: string,
    muted: boolean,
    hubs: readonly string[] = []
): MuteOutcome {
    if (!SIGNATURE.test(signature)) return { error: 'invalid' };
    const merged = loadLayers(engine, layers).config;
    const held = mergedAt(merged, IGNORE);
    const current: string[] = ignoredShape.parse(held);
    const outcome = writeConfigValue(
        engine,
        BEHAVIOR,
        IGNORE,
        nextList(current, signature, muted),
        held,
        layers,
        { hubs, own: true }
    );
    return { changed: outcome.changed, refused: outcome.refused };
}
