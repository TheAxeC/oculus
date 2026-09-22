// Layer 2, server. Stream the last seven days of Claude transcripts and Codex rollouts into day-and-model token rows.

import { createReadStream, realpathSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';
import type { UsageAccountConfig, UsageDay, UsageTool } from '../../../data/model.ts';
import { isMap } from '../../../data/helpers/guards.ts';
import { claudeTranscripts, codexRollouts, type TranscriptFile } from '../../transcripts/stores.ts';
import {
    claudeUsage,
    codexUsage,
    type UsageEvent,
    type UsageTotals
} from '../../transcripts/usage.ts';

export const USAGE_DAYS = 7;

type Found = TranscriptFile & { tool: UsageTool; account: string };
type Cached = { size: number; mtimeMs: number; rows: UsageDay[] };
export type UsageFold = {
    rows: UsageDay[];
    files: number;
    bytes: number;
    readFiles: number;
    readBytes: number;
};

/** Days are the machine's calendar days, since the table answers "what did today cost". */
function localDay(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

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
    return Number.isNaN(date.getTime()) ? '' : localDay(date);
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

function row(event: UsageEvent, tool: UsageTool, account: string, model: string): UsageDay | null {
    const day = dayOf(event.stamp);
    if (day === '' || model === '') return null;
    return {
        tool,
        account,
        day,
        model,
        input: event.input,
        output: event.output,
        cacheRead: event.cacheRead,
        cacheCreation: event.cacheCreation
    };
}

async function foldFile(file: Found): Promise<UsageDay[]> {
    const rows = new Map<string, UsageDay>();
    let model = '';
    const previous: Partial<UsageTotals> = {};
    const input = createReadStream(file.path, { encoding: 'utf8' });
    const lines = createInterface({ input, crlfDelay: Infinity });
    try {
        for await (const line of lines) {
            if (line.trim() === '') continue;
            let value: unknown;
            try {
                value = JSON.parse(line) as unknown;
            } catch {
                continue;
            }
            if (!isMap(value)) continue;
            if (file.tool === 'codex' && value.type === 'turn_context') {
                const payload = isMap(value.payload) ? value.payload : {};
                if (typeof payload.model === 'string' && payload.model) model = payload.model;
            }
            const event = file.tool === 'claude' ? claudeUsage(value) : codexUsage(value, previous);
            if (event === null) continue;
            const usageRow = row(
                event,
                file.tool,
                file.account,
                file.tool === 'claude' ? event.model : model
            );
            if (usageRow !== null) add(rows, usageRow);
        }
    } catch {
        return [];
    }
    return [...rows.values()];
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

/** One reusable in-memory size-and-mtime cache. Unchanged files are never opened again. */
export class UsageTranscriptFold {
    #cache = new Map<string, Cached>();

    async fold(accounts: UsageAccountConfig[], now: number = Date.now()): Promise<UsageFold> {
        const found = files(accounts, now);
        const current = new Set(found.map((file) => file.path));
        for (const path of this.#cache.keys()) if (!current.has(path)) this.#cache.delete(path);
        const rows = new Map<string, UsageDay>();
        let readFiles = 0;
        let readBytes = 0;
        for (const file of found) {
            let held = this.#cache.get(file.path);
            if (held?.size !== file.size || held.mtimeMs !== file.mtimeMs) {
                held = { size: file.size, mtimeMs: file.mtimeMs, rows: await foldFile(file) };
                this.#cache.set(file.path, held);
                readFiles += 1;
                readBytes += file.size;
            }
            for (const row of held.rows) {
                if (new Date(`${row.day}T00:00:00`).getTime() >= dayStart(now))
                    add(rows, { ...row });
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
