// Layer 2, server. Host-status updates live here because the registries/career.yml host shape
// changes independently of collection entries and subtasks.
//
// `isMap` names data/helpers/guards.ts's test of a parsed value in every file, so the yaml
// library's own node test is imported as `isYamlMap`.

import { isMap as isYamlMap, isScalar, isSeq } from 'yaml';
import type { Node, Pair, Scalar, YAMLMap } from 'yaml';
import { sameValue } from '../yaml-edit.ts';
import type { EditResult } from '../yaml-edit.ts';
import {
    document,
    fail,
    flowScalar,
    pairEnd,
    pairOf,
    refuseAll,
    replaceIn,
    splice,
    verified,
    type Change,
    type Written
} from './lines.ts';

/**
 * Set the `status` of one host of registries/career.yml, whose hosts are one-line flow maps
 * under `hosts:`.
 * The status is written in the bytes of the old one, or added to the flow map when the line has no
 * status yet; the vocabulary it is checked against is the caller's, not this module's.
 */
export function setHostStatus(source: string, name: string, status: string): EditResult {
    const doc = document(source);
    if (doc === null) return refuseAll(source, ['status'], 'the file does not parse');
    const pair = pairOf(doc.contents as YAMLMap, 'hosts');
    const seq = pair?.value ?? null;
    if (pair === undefined || seq === null || !isSeq(seq)) {
        return refuseAll(source, ['status'], 'the file has no hosts list');
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
                    ? fail('the host line has no field to write after')
                    : { text: splice(source, end, end, `, status: ${flowScalar(status)}`) };
        } else if (held.value === null) {
            out = fail('the host has no status value');
        } else {
            if (sameValue(status, (held.value as Scalar).value)) {
                return { text: source, changed: [], refused: [] };
            }
            out = replaceIn(source, held.value, status);
        }
        if ('reason' in out) return refuseAll(source, ['status'], out.reason);
        const change: Change = { path: ['hosts', at, 'status'], value: status };
        if (!verified(source, out.text, [change])) {
            return refuseAll(source, ['status'], 'the edit did not verify; nothing was written');
        }
        return { text: out.text, changed: ['status'], refused: [] };
    }
    return refuseAll(source, ['status'], `no host named ${name}`);
}
