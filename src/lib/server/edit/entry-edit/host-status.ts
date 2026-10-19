// Layer 2, server. Host-status updates live here because the career file's host shape
// changes independently of collection entries and subtasks.
//
// `isMap` names data/helpers/guards.ts's test of a parsed value in every file, so the yaml
// library's own node test is imported as `isYamlMap`.

import { isMap as isYamlMap, isScalar, isSeq } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { sameValue } from '../yaml/yaml-edit.ts';
import type { EditResult } from '../yaml/yaml-edit.ts';
import { REFUSALS, why } from '../yaml/why.ts';
import { pairEnd, pairOf } from '../../../data/helpers/files/yaml/yaml-ranges.ts';
import {
    document,
    fail,
    flowScalar,
    refuseAll,
    replaceIn,
    splice,
    verified,
    type Change,
    type Written
} from './lines.ts';

/** The one field a host write sets, which a refusal names. */
const STATUS = ['status'];

/**
 * Set the `status` of one host of the career file, whose hosts are one-line flow maps
 * under `hosts:`.
 * The status is written in the bytes of the old one, or added to the flow map when the line has no
 * status yet; the vocabulary it is checked against is the caller's, not this module's.
 */
export function setHostStatus(
    source: string,
    name: string,
    status: string,
    catalog: Record<string, string>
): EditResult {
    const doc = document(source);
    if (doc === null) return refuseAll(source, STATUS, why(REFUSALS.fileNoParse), catalog);
    const pair = pairOf(doc.contents as YAMLMap, 'hosts');
    const seq = pair?.value ?? null;
    if (pair === undefined || seq === null || !isSeq(seq)) {
        return refuseAll(source, STATUS, why(REFUSALS.noHosts), catalog);
    }
    for (let at = 0; at < seq.items.length; at += 1) {
        const node = seq.items[at] as Node;
        if (!isYamlMap(node)) continue;
        const named = pairOf(node, 'name');
        if (named?.value == null || !isScalar(named.value)) continue;
        if (String(named.value.value) !== name) continue;

        const held = pairOf(node, 'status');
        let out: Written;
        if (held === undefined) {
            const end =
                node.items.length === 0
                    ? null
                    : pairEnd(node.items[node.items.length - 1] as Pair<Scalar, Node>);
            out =
                end === null
                    ? fail(REFUSALS.hostNoField)
                    : { text: splice(source, end, end, `, status: ${flowScalar(status)}`) };
        } else if (held.value === null) {
            out = fail(REFUSALS.hostNoStatus);
        } else {
            if (sameValue(status, (held.value as Scalar).value)) {
                return { text: source, changed: [], refused: [] };
            }
            out = replaceIn(source, held.value, status);
        }
        if ('why' in out) return refuseAll(source, STATUS, out.why, catalog);
        const change: Change = { path: ['hosts', at, 'status'], value: status };
        if (!verified(source, out.text, [change])) {
            return refuseAll(source, STATUS, why(REFUSALS.unverified), catalog);
        }
        return { text: out.text, changed: ['status'], refused: [] };
    }
    return refuseAll(source, STATUS, why(REFUSALS.noHost, name), catalog);
}
