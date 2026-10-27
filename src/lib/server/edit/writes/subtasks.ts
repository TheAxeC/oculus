// Layer 2, server. The line half of the write path, and the career write beside it: a subtask line
// ticked, reopened, snoozed, changed or taken out, a follow-up note marked done, reopened, changed
// or taken out, the people a line of either block names set, a line of either block added to a
// host that may have no block yet, and the sections of the career file set from the career
// editor.
//
// The subtask and the follow-up writes run the same line editor (entry-edit/subtasks.ts) over
// their own block, `subtasks:` or `followup:`, and differ in the actions they take.
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
    FOLLOWUP,
    SUBTASKS,
    addSubtask,
    deleteSubtask,
    entryRange,
    peopleKeys,
    setSections,
    setSubtask,
    subtaskValues
} from '../entry-edit/index.ts';
import type { FollowupTextAction, PeopleAction, SubtaskTextAction } from './bodies.ts';
import { plain } from '../../core/changes.ts';
import { words } from '../../core/words.ts';
import { collectionSchema } from '../../../data/snapshot/normalise.ts';
import { manifestSource } from './manifest.ts';
import { identityOf, readCollection } from '../../files/fs/collections.ts';
import { saved, typeRefusals } from './entries.ts';
import type { ChangeRecord } from '../../core/changes.ts';
import type { EditResult, Refusal } from '../yaml/yaml-edit.ts';
import type { LineBlock, LineRange } from '../entry-edit/index.ts';
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
        if (value === null || held.ident === null) return null;
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
 * the file cannot disagree. An edit that leaves the block a line shorter took the line `key` out,
 * and the record's after is what that key holds now, the next line or nothing, which is what the
 * undo's check finds there while the file is unchanged; one that leaves it a line longer made the
 * line at the first key whose value changed, which is the line an add put in, at the end or in the
 * place a deleted line held.
 */
function subtaskRecord(
    host: SubtaskHost,
    edit: EditResult,
    key: string,
    target: SubtaskTarget,
    block: LineBlock
): ChangeRecord[] {
    if (edit.changed.length === 0) return [];
    const before = subtaskValues(host.source, host.range, block);
    const after = subtaskValues(edit.text, host.range, block);
    const grown = Object.keys(after).length - Object.keys(before).length;
    const moved = (one: string): boolean =>
        JSON.stringify(before[one]) !== JSON.stringify(after[one]);
    const line = key === '' ? Object.keys(after).find(moved) : key;
    if (line === undefined) return [];
    const undo: ChangeRecord['undo'] = grown > 0 ? 'create' : grown < 0 ? 'delete' : 'field';
    return [
        {
            file: host.file,
            key: target.id,
            field: line,
            before: before[line] ?? null,
            after: after[line] ?? null,
            undo
        }
    ];
}

/** What one subtask write does to its line. */
export type SubtaskAction = SubtaskTextAction | PeopleAction;

/** What one follow-up write does to its note. */
export type FollowupAction = FollowupTextAction | PeopleAction;

/**
 * The edit one action makes to one line of a block: Done and Reopen set and clear `done`, Delete
 * takes the line out and the block's key with the last, a people action sets its field to the
 * keys given (each once, no key dropping the field), and any other action sets its field to the
 * trimmed text, an empty text clearing it.
 */
function lineEdit(
    host: SubtaskHost,
    key: string,
    action: SubtaskAction | FollowupAction,
    value: string | readonly string[] | undefined,
    text: Record<string, string>,
    block: LineBlock
): EditResult {
    if (action === 'delete') return deleteSubtask(host.source, host.range, key, text, block);
    const fields =
        action === 'done' || action === 'reopen'
            ? { done: action === 'done' }
            : typeof value === 'string' || value === undefined
              ? { [action]: value?.trim() ?? null }
              : { [action]: peopleKeys(value) };
    return setSubtask(host.source, host.range, key, fields, text, block);
}

/**
 * Tick one subtask line, reopen it, snooze it until a date, change its text or its deadline, set
 * the people it names, or take the line out. An empty deadline clears it; an empty text is
 * refused, since a line is its text.
 */
export function writeSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: PeopleAction,
    value: readonly string[]
): WriteOutcome;
export function writeSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: SubtaskTextAction,
    value?: string
): WriteOutcome;
// A body read by the route's shape (writes/bodies.ts `subtaskWrite`), which pairs the action and
// its value already.
export function writeSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: SubtaskAction,
    value?: string | readonly string[]
): WriteOutcome;
export function writeSubtask(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: SubtaskAction,
    value?: string | readonly string[]
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const edit = lineEdit(host, key, action, value, config.text, SUBTASKS);
    const out = saved(host.file, host.source, edit);
    return { ...out, records: subtaskRecord(host, edit, key, target, SUBTASKS) };
}

/**
 * Mark one follow-up note done or open again, take it out, change its text or the date before
 * which it stays hidden, or set the people it names. An empty date clears it; an empty text is
 * refused, since a note is its text.
 */
export function writeFollowup(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: PeopleAction,
    value: readonly string[]
): WriteOutcome;
export function writeFollowup(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: FollowupTextAction,
    value?: string
): WriteOutcome;
// A body read by the route's shape (writes/bodies.ts `followupWrite`), as for a subtask.
export function writeFollowup(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: FollowupAction,
    value?: string | readonly string[]
): WriteOutcome;
export function writeFollowup(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    action: FollowupAction,
    value?: string | readonly string[]
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const edit = lineEdit(host, key, action, value, config.text, FOLLOWUP);
    const out = saved(host.file, host.source, edit);
    return { ...out, records: subtaskRecord(host, edit, key, target, FOLLOWUP) };
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
    before: Record<string, unknown>,
    block: LineBlock = SUBTASKS
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const now = subtaskValues(host.source, host.range, block)[key] ?? {};
    const fields: Record<string, unknown> = {};
    for (const field of new Set([...Object.keys(now), ...Object.keys(before)])) {
        fields[field] = before[field] ?? null;
    }
    const edit = setSubtask(host.source, host.range, key, fields, config.text, block);
    const out = saved(host.file, host.source, edit);
    return { ...out, records: subtaskRecord(host, edit, key, target, block) };
}

/**
 * Add one line of a block, a subtask or a follow-up note, to a manifest or a collection entry: at
 * the end, or before the line at the index `at` when the block holds one there, which is how the
 * undo of a Delete puts a line back in its place.
 */
export function writeSubtaskAdd(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    fields: Record<string, unknown>,
    block: LineBlock = SUBTASKS,
    at?: number
): WriteOutcome {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, changed: [], refused: [] };
    const edit = addSubtask(host.source, host.range, fields, config.text, block, at);
    const out = saved(host.file, host.source, edit);
    // The key the new line took is the one the edit made, which is why the record is asked for it
    // by the empty name rather than being told one this writer does not choose.
    return { ...out, records: subtaskRecord(host, edit, '', target, block) };
}

/** Where the career file is. */
export type CareerRules = { file: string };

/**
 * The career file of the merged config. A `career_file` that is not text is oculus's own path of
 * config/defaults/sources.yml.
 */
const careerRulesShape = z
    .object({ career_file: z.string().catch(() => engineDefaults().career ?? '') })
    .transform((held) => ({ file: held.career_file })) satisfies z.ZodType<CareerRules>;

/** The career file, out of the request's merged config. */
export function careerRules(merged: Record<string, unknown>): CareerRules {
    return careerRulesShape.parse(merged);
}

/**
 * The value one line of a block holds now, or null when the host or the line is no longer there.
 */
export function subtaskValue(
    hub: string,
    config: PortfolioConfig,
    target: SubtaskTarget,
    key: string,
    block: LineBlock = SUBTASKS
): { found: boolean; value: unknown } {
    const host = subtaskHost(hub, config, target);
    if (host === null) return { found: false, value: null };
    const values = subtaskValues(host.source, host.range, block);
    return { found: true, value: key in values ? values[key] : null };
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
