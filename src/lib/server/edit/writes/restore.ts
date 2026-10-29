// Layer 2, server. Putting back the text a manifest write took out: the text a cleared field
// removed, at the first place where the document is what the earlier value says it was.
//
// setFields (../yaml/yaml-edit.ts) reports the characters each clear removed, the index they stood
// at in the text the write left and the rest of that line. insertRemoved tries the places of that
// line in order and keeps the first at which the text parses to the source with the field set to
// its earlier value, which is the check setFields makes of its own result. For whole lines, when no
// place of that line passes, every other line start is tried, nearest first; text taken from inside
// a line tries only the places of that line. That is how an undo gives a cleared field back as it
// was written, comments, quoting and block style included.
//
// Nothing is thrown. A field that cannot be written, a manifest that does not parse and text that
// fits nowhere are refusals with a reason.

import { isDeepStrictEqual } from 'node:util';
import type { RemovedText } from '../../core/changes.ts';
import {
    expect,
    lineFrom,
    safeParse,
    settable,
    splice,
    type EditResult
} from '../../core/files/yaml/yaml-edit.ts';
import { REFUSALS, said, why } from '../../core/files/yaml/why.ts';
import type { Why } from '../../core/files/yaml/why.ts';
import type { FieldValue } from '../../core/files/yaml/yaml-values.ts';

/** Whether an index falls between the two halves of a surrogate pair. */
function splitsPair(text: string, at: number): boolean {
    const before = text.charCodeAt(at - 1);
    const here = text.charCodeAt(at);
    return before >= 0xd800 && before <= 0xdbff && here >= 0xdc00 && here <= 0xdfff;
}

/**
 * The indexes removed text may go back at, in the order they are tried. First the indexes where the
 * rest of the line stood: the text from there to the end of its line is `next`, and for whole lines
 * the index is also a line start. Then, for whole lines only, every line start the first group did
 * not hold. Each group is ordered by its distance from the recorded index, the earlier index first
 * at equal distance.
 */
function placesOf(text: string, removed: RemovedText): number[] {
    const whole = removed.text.endsWith('\n');
    const starts: number[] = [];
    for (let at = 0; ;) {
        starts.push(at);
        const end = text.indexOf('\n', at);
        if (end < 0) break;
        at = end + 1;
    }
    const followed: number[] = [];
    for (const start of starts) {
        const end = start + lineFrom(text, start).length;
        const at = end - removed.next.length;
        if (at < start || text.slice(at, end) !== removed.next) continue;
        if ((whole && at !== start) || splitsPair(text, at)) continue;
        followed.push(at);
    }
    const nearest = (one: number, other: number): number =>
        Math.abs(one - removed.offset) - Math.abs(other - removed.offset) || one - other;
    const elsewhere = whole ? starts.filter((start) => !followed.includes(start)) : [];
    return [...followed.sort(nearest), ...elsewhere.sort(nearest)];
}

/**
 * Put text that a clear removed back into a manifest, as the value the field held. It goes at the
 * first place (`placesOf`) where the new text parses to the source with the field set to `before`,
 * which is the check `setFields` makes of its own result. When no place passes, the source comes
 * back unchanged with the field refused.
 */
export function insertRemoved(
    source: string,
    field: string,
    before: unknown,
    removed: RemovedText,
    catalog: Record<string, string>
): EditResult {
    const refusal = (found: Why): EditResult => ({
        text: source,
        changed: [],
        refused: [{ field, reason: said(catalog, found) }]
    });
    const allowed = settable(field);
    if ('why' in allowed) return refusal(allowed.why);
    const wanted = safeParse(source);
    if (wanted === null) return refusal(why(REFUSALS.manifestNoParse));
    expect(wanted, allowed.path, before as FieldValue);
    for (const at of placesOf(source, removed)) {
        const text = splice(source, at, at, removed.text);
        if (isDeepStrictEqual(safeParse(text), wanted)) {
            return { text, changed: [field], refused: [] };
        }
    }
    return refusal(why(REFUSALS.removedNoFit));
}
