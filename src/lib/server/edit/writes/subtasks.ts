// Layer 2, server. The subtask half of the write path, and the one career write beside it: a line
// ticked, reopened, snoozed or taken out, a line added to a host that may have no block yet, and
// one host of registries/career.yml moved along its pipeline.
//
// A subtask hangs under one of two hosts, which is the whole of the difference between the two
// views that draw the block: one manifest by its id, or one entry of one collection. subtaskHost
// resolves either into the file, its text and, for an entry, the lines of that entry inside it.
//
// server/edit/writes.ts is the route and re-exports everything here.

import { readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { isMap } from '../../../data/helpers/guards.ts';
import { loadConfig } from '../../../data/sources/config.ts';
import { readManifests } from '../../../data/sources/manifests.ts';
import {
    addSubtask,
    deleteSubtask,
    entryRange,
    setHostStatus,
    setSubtask,
    subtaskValues
} from '../entry-edit/index.ts';
import { plain } from '../../core/changes.ts';
import { insideHub } from './manifest.ts';
import { identityOf, readCollection, saved } from './entries.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { EditResult } from '../yaml-edit.ts';
import type { LineRange } from '../entry-edit/index.ts';
import type { PortfolioConfig } from '../../../data/model/index.ts';
import type { WriteOutcome } from '../writes.ts';

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
    const { manifests } = readManifests(hub, config.scan, config.text);
    const manifest = manifests.find((one) => one.id === target.id);
    if (manifest === undefined || !insideHub(hub, config, manifest.file)) return null;
    try {
        return { file: manifest.file, source: readFileSync(manifest.file, 'utf8'), range: null };
    } catch {
        return null;
    }
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
            ? deleteSubtask(host.source, host.range, key)
            : action === 'snooze'
              ? setSubtask(host.source, host.range, key, { snooze: value ?? null })
              : setSubtask(host.source, host.range, key, { done: action === 'done' });
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
    const edit = setSubtask(host.source, host.range, key, fields);
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
    const edit = addSubtask(host.source, host.range, fields);
    const out = saved(host.file, host.source, edit);
    // The key the new line took is the one the edit added, which is why the record is asked for it
    // by the empty name rather than being told one this writer does not choose.
    return { ...out, records: subtaskRecord(host, edit, '', target) };
}

/** The career file and the host statuses, read out of the same merged config every reader reads. */
export function careerRules(engine: string): { file: string; statuses: string[] } {
    const merged = loadConfig(engine).config;
    const file =
        typeof merged.career_file === 'string' ? merged.career_file : 'registries/career.yml';
    const held = merged.career_host_status;
    return { file, statuses: isMap(held) ? Object.keys(held) : [] };
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

/** The status one career host holds now, or nothing when registries/career.yml names it no more. */
export function hostStatus(
    hub: string,
    name: string,
    engine: string
): { found: boolean; value: unknown } {
    const file = resolve(join(hub, careerRules(engine).file));
    if (!file.startsWith(resolve(hub) + sep)) return { found: false, value: null };
    let data: unknown;
    try {
        data = parse(readFileSync(file, 'utf8'));
    } catch {
        return { found: false, value: null };
    }
    const hosts: unknown[] = isMap(data) && Array.isArray(data.hosts) ? data.hosts : [];
    const host = hosts.find((one) => isMap(one) && one.name === name);
    if (!isMap(host)) return { found: false, value: null };
    return { found: true, value: plain(host.status) };
}

/**
 * Set one host's status in registries/career.yml. A status outside the vocabulary is refused,
 * never written.
 */
export function writeHost(hub: string, name: string, status: string, engine: string): WriteOutcome {
    const rules = careerRules(engine);
    const file = resolve(join(hub, rules.file));
    if (!file.startsWith(resolve(hub) + sep)) return { found: false, changed: [], refused: [] };
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
            refused: [{ field: '', reason: 'the file does not parse' }]
        };
    }
    const hosts = isMap(data) && Array.isArray(data.hosts) ? data.hosts : [];
    if (!hosts.some((one) => isMap(one) && one.name === name)) {
        return { found: false, changed: [], refused: [] };
    }
    if (!rules.statuses.includes(status)) {
        return {
            found: true,
            changed: [],
            refused: [{ field: 'status', reason: `${status} is not a career host status` }]
        };
    }
    const host: unknown = hosts.find((one) => isMap(one) && one.name === name);
    const out = saved(file, source, setHostStatus(source, name, status));
    if (out.changed.length === 0) return out;
    return {
        ...out,
        records: [
            {
                file,
                key: name,
                field: 'status',
                before: plain(isMap(host) ? host.status : null),
                after: status,
                undo: 'field'
            }
        ]
    };
}
