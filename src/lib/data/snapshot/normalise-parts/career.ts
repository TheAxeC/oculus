// Layer 1, data. The career strategy as the Focus board's foot panel reads it, out of the map
// sources/documents/career.ts parsed. Pure, like normalise: the file's sections are optional, every
// list tolerates the plain-string form the file may write, and a row without its words is left out.

import { z } from 'zod';
import { str, strings } from '../../helpers/guards.ts';
import type { Career, Host } from '../../model/index.ts';
import {
    itemsShape,
    mapShape,
    optionalTextShape,
    readAs,
    readOr,
    stringItemsShape
} from '../../shapes/shapes.ts';
import { wordsWith } from '../../shapes/vocab-keys.ts';
import { compact } from '../compact.ts';
import { fieldsOf } from '../schema/field.ts';

/** The keys of a host row that are the host itself; every other string key is one of its scores. */
const HOST_KEYS = ['name', 'inst', 'tag', 'status', 'note'];

/** A text, which a row of a list may be in place of a map. */
const plainShape = z.string();

/** One numbered row of the order of work as a map: the task and its date and note, if any. */
const orderMapShape = z.object({
    task: optionalTextShape,
    when: optionalTextShape,
    note: optionalTextShape
});

/** The `rule` of the eligibility section: one text, or the texts among a list. */
const ruleShape = z.union([plainShape.transform((rule) => [rule]), stringItemsShape]);

/**
 * The prose of a host row, with the `[proposal: Strong | ...]` prefix removed. The prefix repeats
 * what the score chips already show, so leaving it in would print every score twice.
 */
function hostNote(value: unknown): string | undefined {
    const text = str(value);
    if (text === undefined) return undefined;
    const trimmed =
        text.startsWith('[') && text.includes(']')
            ? text.slice(text.indexOf(']') + 1).trimStart()
            : text;
    return trimmed.trim() === '' ? undefined : trimmed;
}

function host(value: unknown, unset: string): Host | null {
    const row = readAs(mapShape, value);
    if (row === null) return null;
    const name = str(row.name);
    if (name === undefined || name.trim() === '') return null;
    const scores: Record<string, string> = {};
    for (const [key, held] of Object.entries(row)) {
        if (HOST_KEYS.includes(key)) continue;
        const text = str(held);
        if (text !== undefined && text.trim() !== '') scores[key] = text;
    }
    return compact({
        name,
        inst: str(row.inst),
        tag: str(row.tag),
        // A row with no `status:` is at the hub's `career_host_status` word carrying `default`.
        status: str(row.status) ?? unset,
        scores,
        note: hostNote(row.note)
    });
}

/** One numbered row of the order of work, tolerating the plain-string form the file may write. */
function orderRow(value: unknown): { task: string; when?: string; note?: string } | null {
    const plain = plainShape.safeParse(value);
    if (plain.success) return plain.data.trim() === '' ? null : { task: plain.data };
    const row = readAs(orderMapShape, value);
    if (row?.task === undefined || row.task.trim() === '') return null;
    return compact({ task: row.task, when: row.when, note: row.note });
}

/** A `what`/`why` or `who`/`why` chip row, tolerating the plain-string form. */
function reasoned<K extends string>(value: unknown, key: K): Record<K | 'why', string> | null {
    const plain = plainShape.safeParse(value);
    if (plain.success) {
        return plain.data.trim() === ''
            ? null
            : ({ [key]: plain.data } as Record<K | 'why', string>);
    }
    const row = readAs(mapShape, value);
    if (row === null) return null;
    const what = str(row[key]);
    if (what === undefined || what.trim() === '') return null;
    return compact({ [key]: what, why: str(row.why) }) as Record<K | 'why', string>;
}

/** The eligibility section, whose `rule` the file may write as one string or as a list of them. */
function eligibility(value: unknown): Career['eligibility'] {
    const section = readAs(mapShape, value);
    if (section === null) return null;
    const rule = readOr(ruleShape, section.rule, []);
    const shots = strings(section.shots);
    if (rule.length === 0 && shots.length === 0 && str(section.caveat) === undefined) return null;
    return compact({ rule, shots, caveat: str(section.caveat) });
}

/** The rows of one list of the career file, and no rows for a section that is not a list. */
function rowsOf(value: unknown): unknown[] {
    return readOr(itemsShape, value, []);
}

/**
 * The career strategy as the panel reads it. Every section is optional and every list tolerates the
 * plain-string form the file is allowed to write, so a half-filled career file draws the half it
 * has rather than nothing. `config` is the hub's merged config, whose `career_host_status` word
 * carrying `default` is the status of a host row that writes none.
 */
export function career(
    raw: Record<string, unknown> | null,
    config: Record<string, unknown>
): Career | null {
    if (raw === null) return null;
    const unset = wordsWith(config, 'career_host_status', 'default').at(0) ?? '';
    const situation: { label: string; value: string }[] = [];
    const written = readAs(mapShape, raw.situation);
    if (written !== null) {
        for (const [label, held] of Object.entries(written)) {
            const text = str(held);
            if (text !== undefined) situation.push({ label, value: text });
        }
    }
    const hosts: Host[] = [];
    for (const row of rowsOf(raw.hosts)) {
        const one = host(row, unset);
        if (one !== null) hosts.push(one);
    }
    const order: { task: string; when?: string; note?: string }[] = [];
    for (const row of rowsOf(raw.order)) {
        const one = orderRow(row);
        if (one !== null) order.push(one);
    }
    const notHosts: { who: string; why?: string }[] = [];
    for (const row of rowsOf(raw.not_hosts)) {
        const one = reasoned(row, 'who');
        if (one !== null) notHosts.push(one);
    }
    const dropped: { what: string; why?: string }[] = [];
    for (const row of rowsOf(raw.dropped)) {
        const one = reasoned(row, 'what');
        if (one !== null) dropped.push(one);
    }
    return compact({
        title: str(raw.title) ?? '',
        milestone: str(raw.milestone),
        situation,
        order,
        orderNote: str(raw.order_note),
        hosts,
        hostCriteria: strings(raw.host_criteria),
        notHosts,
        eligibility: eligibility(raw.eligibility),
        dropped,
        sections: Object.fromEntries(Object.entries(raw).filter(([name]) => name !== 'schema')),
        schema: fieldsOf(raw.schema)
    });
}
