// Layer 2, server. Fold the last seven days of Claude transcripts and Codex rollouts into
// day-and-model token rows. A day is the machine's calendar day, data/helpers/dates.ts's localDate,
// since the table answers "what did today cost".
//
// A file is read from the byte after its last complete line, with what its fold carried: the model
// and the running totals of a Codex rollout, and its rows. It is read from zero when it shrank,
// when its inode changed, and when its modification time moved with its size as it was; a file
// rewritten in place that grew is read as one that was appended to, as the sessions scan reads it.
// A last line with no newline is a record still being written and waits for the next fold. The
// fold's state is in memory, so the first fold of a process reads the week's files whole.

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { UsageAccountConfig, UsageDay, UsageTool } from '../../../data/model/index.ts';
import { localDate } from '../../../data/helpers/dates.ts';
import { foldYielding } from '../../sessions/stores/transcripts.ts';
import { claudeTranscripts, codexRollouts, type TranscriptFile } from '../../transcripts/stores.ts';
import {
    claudeUsage,
    codexUsage,
    type UsageEvent,
    type UsageTotals
} from '../../transcripts/usage.ts';

export const USAGE_DAYS = 7;

type Found = TranscriptFile & { tool: UsageTool; account: string };

/** What the fold of one file holds between two folds. */
type HeldFile = {
    ino: number;
    size: number;
    mtimeMs: number;
    /** The byte after the last complete line read. */
    offset: number;
    /** The model the last `turn_context` of a Codex rollout named. */
    model: string;
    /** The lifetime totals of a Codex rollout as last read. */
    totals: Partial<UsageTotals>;
    /** The file's rows, which carry no account: the label is put on as a fold answers. */
    rows: Map<string, UsageDay>;
};

/** One fold as its thread is asked for it (fold-worker.ts). */
export type FoldAsk = { accounts: UsageAccountConfig[]; now: number };

export type UsageFold = {
    rows: UsageDay[];
    files: number;
    bytes: number;
    readFiles: number;
    readBytes: number;
};

function dayStart(now: number): number {
    const date = new Date(now);
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - (USAGE_DAYS - 1)
    ).getTime();
}

function dayOf(value: unknown): string {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : localDate(date);
}

function add(rows: Map<string, UsageDay>, row: UsageDay): void {
    // A record with no tokens (Claude's synthetic messages carry a usage of zeros) adds nothing.
    if (row.input + row.output + row.cacheRead + row.cacheCreation === 0) return;
    const key = [row.tool, row.account, row.day, row.model].join('\u0000');
    const held = rows.get(key);
    if (held === undefined) {
        rows.set(key, row);
        return;
    }
    held.input += row.input;
    held.output += row.output;
    held.cacheRead += row.cacheRead;
    held.cacheCreation += row.cacheCreation;
}

function row(event: UsageEvent, tool: UsageTool, model: string): UsageDay | null {
    const day = dayOf(event.stamp);
    if (day === '' || model === '') return null;
    return {
        tool,
        account: '',
        day,
        model,
        input: event.input,
        output: event.output,
        cacheRead: event.cacheRead,
        cacheCreation: event.cacheCreation
    };
}

/** A `turn_context` record of a Codex rollout: the model its payload names, when it names one. */
const turnContextShape = z.object({
    payload: z
        .object({ model: z.string().optional().catch(undefined) })
        .optional()
        .catch(undefined)
});

/**
 * What a fold reads a file on from: what is held of it, itself when the file did not move and as
 * what was read of it when the file grew. Nothing is read of a file nothing is held of, and of one
 * that is another file, that shrank, or that was written in place at its size.
 */
function readOn({ ino, size, mtimeMs }: Found, held: HeldFile | undefined): HeldFile {
    if (held?.ino === ino) {
        if (size === held.size && mtimeMs === held.mtimeMs) return held;
        if (size > held.size) return { ...held, size, mtimeMs };
    }
    return { ino, size, mtimeMs, offset: 0, model: '', totals: {}, rows: new Map() };
}

/** Fold the lines of a file from the byte held of it into what is held, up to its listed size. */
async function foldFile(
    file: Found,
    held: HeldFile,
    ended: AbortSignal | undefined
): Promise<void> {
    const apply = (value: Record<string, unknown>): void => {
        if (file.tool === 'codex' && value.type === 'turn_context') {
            const named = turnContextShape.safeParse(value);
            if (named.success && named.data.payload?.model) held.model = named.data.payload.model;
        }
        const event = file.tool === 'claude' ? claudeUsage(value) : codexUsage(value, held.totals);
        if (event === null) return;
        const usageRow = row(event, file.tool, file.tool === 'claude' ? event.model : held.model);
        if (usageRow !== null) add(held.rows, usageRow);
    };
    const options = { until: file.size, signal: ended };
    held.offset += await foldYielding(file.path, held.offset, apply, options);
}

/** What joins the labels of the accounts that share one store into the label its rows carry. */
const SHARED_LABEL = ' + ';

/** One transcript store: the tool that writes it, and the accounts that name it. */
type Store = { tool: UsageTool; labels: string[] };

/**
 * The stores the accounts name, by the real path of each. Two accounts whose folders are one store,
 * a symlink and its target, are one store read once; the rows it gives carry both labels joined, so
 * a shared store is not credited to whichever account happened to be first in the configuration.
 */
function stores(accounts: UsageAccountConfig[]): Map<string, Store> {
    const held = new Map<string, Store>();
    for (const account of accounts) {
        const folder =
            account.tool === 'claude'
                ? join(account.dir, 'projects')
                : join(account.dir, 'sessions');
        let root: string;
        try {
            root = realpathSync(folder);
        } catch {
            continue;
        }
        const store = held.get(root);
        if (store === undefined) {
            held.set(root, { tool: account.tool, labels: [account.label] });
            continue;
        }
        if (!store.labels.includes(account.label)) store.labels.push(account.label);
    }
    return held;
}

function files(accounts: UsageAccountConfig[], now: number): Found[] {
    const found: Found[] = [];
    const cutoff = dayStart(now);
    for (const [root, store] of stores(accounts)) {
        const listed =
            store.tool === 'claude'
                ? claudeTranscripts(root, 0, 0, { nested: true })
                : codexRollouts(root, 0, 0);
        const account = store.labels.join(SHARED_LABEL);
        for (const file of listed) {
            if (file.mtimeMs >= cutoff) found.push({ ...file, tool: store.tool, account });
        }
    }
    return found.sort((left, right) => left.path.localeCompare(right.path));
}

/**
 * The fold of one owner's folds: what it holds of each file is read on from at the next, so a file
 * with nothing new is not opened.
 */
export class UsageTranscriptFold {
    #held = new Map<string, HeldFile>();

    /** The rows of the accounts' transcripts at `now`; `ended` ends the reads where they are. */
    async fold(
        accounts: UsageAccountConfig[],
        now: number = Date.now(),
        ended?: AbortSignal
    ): Promise<UsageFold> {
        const found = files(accounts, now);
        const current = new Set(found.map((file) => file.path));
        for (const path of this.#held.keys()) if (!current.has(path)) this.#held.delete(path);
        const rows = new Map<string, UsageDay>();
        let readFiles = 0;
        let readBytes = 0;
        for (const file of found) {
            if (ended?.aborted === true) break;
            const before = this.#held.get(file.path);
            const held = readOn(file, before);
            if (held !== before) {
                this.#held.set(file.path, held);
                readFiles += 1;
                readBytes += file.size - held.offset;
                await foldFile(file, held, ended);
            }
            for (const row of held.rows.values()) {
                if (new Date(`${row.day}T00:00:00`).getTime() >= dayStart(now))
                    add(rows, { ...row, account: file.account });
            }
        }
        return {
            rows: [...rows.values()].sort(
                (left, right) =>
                    right.day.localeCompare(left.day) ||
                    left.tool.localeCompare(right.tool) ||
                    left.account.localeCompare(right.account) ||
                    left.model.localeCompare(right.model)
            ),
            files: found.length,
            bytes: found.reduce((total, file) => total + file.size, 0),
            readFiles,
            readBytes
        };
    }
}
