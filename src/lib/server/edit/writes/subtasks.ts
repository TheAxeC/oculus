// Layer 2, server. The subtask half of the write path, and the two career writes beside it: a line
// ticked, reopened, snoozed or taken out, a line added to a host that may have no block yet, one
// host of the career file moved along its pipeline, and the sections of that file set from
// the career editor.
//
// A subtask hangs under one of two hosts, which is the whole of the difference between the two
// views that draw the block: one manifest by its id, or one entry of one collection. subtaskHost
// resolves either into the file, its text and, for an entry, the lines of that entry inside it. A
// manifest's id is any project's (writes/manifest.ts finds it).
//
// server/edit/writes.ts is the route and re-exports everything here.
//
// Whether a path lies in a folder is read from server/core/paths.ts (`below`).

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { isMap } from '../../../data/helpers/guards.ts';
import { engineDefaults } from '../../../data/sources/collections.ts';
import {
    addSubtask,
    deleteSubtask,
    entryRange,
    setHostStatus,
    setSections,
    setSubtask,
    subtaskValues
} from '../entry-edit/index.ts';
import { plain } from '../../core/changes.ts';
import { words } from '../../core/words.ts';
import { collectionSchema } from '../../../data/snapshot/normalise.ts';
import { mapShape } from '../../../data/shapes/shapes.ts';
import { manifestSource } from './manifest.ts';
import { identityOf, readCollection } from '../../files/fs/collections.ts';
import { saved, typeRefusals } from './entries.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { EditResult, Refusal } from '../yaml/yaml-edit.ts';
import type { LineRange } from '../entry-edit/index.ts';
import type { PortfolioConfig } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';
import { below } from '../../core/paths.ts';

/** What a subtask write hangs under: one manifest, or one entry of one collection. */
export type SubtaskTarget = { id: string; collection?: string };

/** The file a subtask write edits, and the lines of the entry inside it when it is an entry's. */
type SubtaskHost = { file: string; source: string; range: LineRange | null };

export function subtaskHost(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget
): SubtaskHost | null {
    if (target.collection !== undefined) {
        const held = readCollection(hub, config, target.collection);
        if (held === null) return null;
        const value = identityOf(held, target.id);
        if (value === null) return null;
        const range = entryRange(held.source, held.ident, value);
        if (range === null) return null;
        return { file: held.file, source: held.source, range };
    }
    const manifest = manifestSource(hub, config, target.id);
    return manifest === null ? null : { ...manifest, range: null };
}

/**
 * What one subtask edit changed, read from the text the writer holds on either side of it: the line
 * as the file had it and the line as the edit leaves it, through the one reader, so the record and
 * the file cannot disagree.
 */
function subtaskRecord(
    host: SubtaskHost,
    edit: EditResult,
    key: string,
    target: SubtaskTarget
): ChangeRecord[] {
    if (edit.changed.length === 0) return [];
    const before = subtaskValues(host.source, host.range);
    const after = subtaskValues(edit.text, host.range);
    const line = key === '' ? Object.keys(after).find((one) => !(one in before)) : key;
    if (line === undefined) return [];
    const had = line in before;
    const has = line in after;
    const undo: ChangeRecord['undo'] = !had ? 'create' : !has ? 'delete' : 'field';
    return [
        {
            file: host.file,
            key: target.id,
            field: line,
            before: had ? before[line] : null,
            after: has ? after[line] : null,
            undo
        }
    ];
}

/** What one subtask button does to its line. */
export type SubtaskAction = 'done' | 'reopen' | 'snooze' | 'delete';

/** Tick one subtask line, reopen it, snooze it until a date, or take the line out. */
export function writeSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: SubtaskAction,
    value?: string
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const edit =
        action === 'delete'
            ? deleteSubtask(host.source, host.range, key, config.text)
            : action === 'snooze'
              ? setSubtask(host.source, host.range, key, { snooze: value ?? null }, config.text)
              : setSubtask(host.source, host.range, key, { done: action === 'done' }, config.text);
    const out = saved(host.file, host.source, edit);
    return { ...out, records: subtaskRecord(host, edit, key, target) };
}

/**
 * Put one subtask line back as a change recorded it: every field the line carries now and every
 * field the earlier value carried is set to the earlier value, and a field the earlier value did
 * not carry is cleared. It is what an undo of a tick, a reopen or a snooze goes through.
 */
export function restoreSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    before: Record<string, unknown>
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const now = subtaskValues(host.source, host.range)[key] ?? {};
    const fields: Record<string, unknown> = {};
    for (const field of new Set([...Object.keys(now), ...Object.keys(before)])) {
        fields[field] = before[field] ?? null;
    }
    const edit = setSubtask(host.source, host.range, key, fields, config.text);
    const out = saved(host.file, host.source, edit);
    return { ...out, records: subtaskRecord(host, edit, key, target) };
}

/** Add one subtask line to a manifest or to a collection entry. */
export function writeSubtaskAdd(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    fields: Record<string, unknown>
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const edit = addSubtask(host.source, host.range, fields, config.text);
    const out = saved(host.file, host.source, edit);
    // The key the new line took is the one the edit added, which is why the record is asked for it
    // by the empty name rather than being told one this writer does not choose.
    return { ...out, records: subtaskRecord(host, edit, '', target) };
}

/** Where the career hosts are, and the statuses one may hold. */
export type CareerRules = { file: string; statuses: string[] };

/**
 * The career file and the host statuses of the merged config. A `career_file` that is not text is
 * oculus's own path of config/defaults/sources.yml, and the statuses are the own keys of a
 * `career_host_status` map in the order written, none for anything else.
 */
const careerRulesShape = z
    .object({
        career_file: z.string().catch(() => engineDefaults().career ?? ''),
        career_host_status: z
            .pipe(
                mapShape,
                z.transform((held) => Object.keys(held))
            )
            .catch([])
    })
    .transform((held) => ({
        file: held.career_file,
        statuses: held.career_host_status
    })) satisfies z.ZodType<CareerRules>;

/** The career file and the host statuses, out of the request's merged config. */
export function careerRules(merged: Record<string, unknown>): CareerRules {
    return careerRulesShape.parse(merged);
}

/** The hosts of the career file that are maps, and none for a file that holds no list. */
const careerHostsShape = z
    .looseObject({ hosts: z.array(z.unknown()).transform((all) => all.filter(isMap)) })
    .transform((file) => file.hosts)
    .catch([]);

/** The host the file names, as the file holds it, or undefined. */
function careerHost(data: unknown, name: string): Record<string, unknown> | undefined {
    return careerHostsShape.parse(data).find((one) => one.name === name);
}

/** The value one subtask line holds now, or null when the host or the line is no longer there. */
export function subtaskValue(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string
): { found: boolean; value: unknown } {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, value: null };
    const values = subtaskValues(host.source, host.range);
    return { found: true, value: key in values ? values[key] : null };
}

/** The status one career host holds now, or nothing when the career file names it no more. */
export function hostStatus(
    hub: string,
    name: string,
    rules: CareerRules
): { found: boolean; value: unknown } {
    const file = resolve(join(hub, rules.file));
    if (!below(file, hub)) return { found: false, value: null };
    let data: unknown;
    try {
        data = parse(readFileSync(file, 'utf8'));
    } catch {
        return { found: false, value: null };
    }
    const host = careerHost(data, name);
    if (host === undefined) return { found: false, value: null };
    return { found: true, value: plain(host.status) };
}

/**
 * Set one host's status in the career file. A status outside the vocabulary is refused,
 * never written.
 */
export function writeHost(
    hub: string,
    name: string,
    status: string,
    rules: CareerRules,
    text: Record<string, string>
): WriteOutcome {
    const file = resolve(join(hub, rules.file));
    if (!below(file, hub)) return { found: false, changed: [], refused: [] };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { found: false, changed: [], refused: [] };
    }
    let data: unknown;
    try {
        data = parse(source);
    } catch {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: words(text, 'server.career.no_parse') }]
        };
    }
    const host = careerHost(data, name);
    if (host === undefined) return { found: false, changed: [], refused: [] };
    if (!rules.statuses.includes(status)) {
        return {
            found: true,
            changed: [],
            refused: [
                { field: 'status', reason: words(text, 'server.career.not_a_status', status) }
            ]
        };
    }
    const out = saved(file, source, setHostStatus(source, name, status, text));
    if (out.changed.length === 0) return out;
    return {
        ...out,
        records: [
            {
                file,
                key: name,
                field: 'status',
                before: plain(host.status),
                after: status,
                undo: 'field'
            }
        ]
    };
}

/** What a read answers for an address that is not there. */
const ABSENT = { found: false, value: null } as const;

/** The section of the career file the file holds now, or nothing when the file is gone. */
export function careerSection(
    hub: string,
    section: string,
    rules: CareerRules
): { found: boolean; value: unknown } {
    const file = resolve(join(hub, rules.file));
    if (!below(file, hub)) return { found: false, value: null };
    try {
        const data: unknown = parse(readFileSync(file, 'utf8'));
        return isMap(data) ? { found: true, value: plain(data[section]) } : ABSENT;
    } catch {
        return ABSENT;
    }
}

/**
 * The refusals of the keys no career write may set: `schema`, a blank key, and a key the file's own
 * `schema:` does not name; a file with no `schema:` refuses every key with one sentence.
 */
function careerKeyRefusals(
    schema: unknown,
    fields: Record<string, unknown>,
    text: Record<string, string>
): Refusal[] {
    const declared = collectionSchema(schema);
    const names = new Set((declared ?? []).map((one) => one.field));
    return Object.keys(fields).flatMap((key): Refusal[] => {
        if (declared === undefined || declared.length === 0)
            return [{ field: key, reason: words(text, 'server.career.no_schema') }];
        if (key.trim() === '')
            return [{ field: key, reason: words(text, 'server.career.blank_key') }];
        if (key === 'schema')
            return [{ field: key, reason: words(text, 'server.career.schema_key') }];
        if (!names.has(key))
            return [{ field: key, reason: words(text, 'server.career.not_field', key) }];
        return [];
    });
}

/**
 * Set sections of the career file, each to the value given: the changed sections are written
 * in the bytes of their own values and every other line and comment of the file stays. A key that
 * is no field of the file's own `schema:` is refused with nothing written for it, and a value is
 * held to the type its section has there.
 */
export function writeCareer(
    hub: string,
    fields: Record<string, unknown>,
    rules: CareerRules,
    text: Record<string, string>
): WriteOutcome {
    const file = resolve(join(hub, rules.file));
    if (!below(file, hub)) return { found: false, changed: [], refused: [] };
    let source: string;
    try {
        source = readFileSync(file, 'utf8');
    } catch {
        return { found: false, changed: [], refused: [] };
    }
    let data: unknown;
    try {
        data = parse(source);
    } catch {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: words(text, 'server.career.no_parse') }]
        };
    }
    if (!isMap(data)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: '', reason: words(text, 'server.career.no_map') }]
        };
    }
    const keyed = careerKeyRefusals(data.schema, fields, text);
    const typed = [...keyed, ...typeRefusals(data.schema, fields, text)];
    const names = new Set(typed.map((one) => one.field));
    const wanted = Object.fromEntries(Object.entries(fields).filter(([name]) => !names.has(name)));
    const out = saved(file, source, setSections(source, wanted, text));
    const records: ChangeRecord[] = out.changed.map((section) => ({
        file,
        key: 'career',
        field: section,
        before: plain(data[section]),
        after: plain(wanted[section]),
        undo: 'field'
    }));
    return { ...out, refused: [...typed, ...out.refused], records };
}
