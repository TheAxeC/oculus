// Layer 2, server. Stream the last seven days of Claude transcripts and Codex rollouts into day-and-model token rows.

import { createReadStream, readdirSync, realpathSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';
import type { UsageAccountConfig, UsageDay, UsageTool } from '../../data/model.ts';
import { isMap } from '../../data/guards.ts';

export const USAGE_DAYS = 7;

type Found = { path: string; size: number; mtimeMs: number; tool: UsageTool; account: string };
type Cached = { size: number; mtimeMs: number; rows: UsageDay[] };
export type UsageFold = {
    rows: UsageDay[];
    files: number;
    bytes: number;
    readFiles: number;
    readBytes: number;
};

function walk(folder: string, tool: UsageTool, account: string, found: Found[]): void {
    let entries;
    try {
        entries = readdirSync(folder, { withFileTypes: true });
    } catch {
        return;
    }
    for (const entry of entries) {
        const path = join(folder, entry.name);
        if (entry.isDirectory()) {
            walk(path, tool, account, found);
            continue;
        }
        if (!entry.name.endsWith('.jsonl')) continue;
        try {
            const stat = statSync(path);
            found.push({ path, size: stat.size, mtimeMs: stat.mtimeMs, tool, account });
        } catch {
            continue;
        }
    }
}

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

function count(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
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

function claudeRow(record: Record<string, unknown>, account: string): UsageDay | null {
    if (record.type !== 'assistant') return null;
    const message = isMap(record.message) ? record.message : {};
    const usage = isMap(message.usage) ? message.usage : null;
    const day = dayOf(record.timestamp);
    const model = typeof message.model === 'string' ? message.model : '';
    if (usage === null || day === '' || model === '') return null;
    return {
        tool: 'claude',
        account,
        day,
        model,
        input: count(usage.input_tokens),
        output: count(usage.output_tokens),
        cacheRead: count(usage.cache_read_input_tokens),
        cacheCreation: count(usage.cache_creation_input_tokens)
    };
}

function codexRow(
    record: Record<string, unknown>,
    account: string,
    model: string,
    previous: Record<string, number>
): UsageDay | null {
    if (record.type !== 'event_msg') return null;
    const payload = isMap(record.payload) ? record.payload : {};
    if (payload.type !== 'token_count') return null;
    const info = isMap(payload.info) ? payload.info : {};
    const usage = isMap(info.total_token_usage) ? info.total_token_usage : null;
    const day = dayOf(record.timestamp);
    if (usage === null) return null;
    // Totals span requests between events. Keep the baseline per file across days and models.
    const delta = (key: string): number => {
        const total = count(usage[key]);
        const difference = total - (previous[key] ?? 0);
        previous[key] = total;
        return difference < 0 ? total : difference;
    };
    const tokens = {
        input: delta('input_tokens'),
        output: delta('output_tokens'),
        cacheRead: delta('cached_input_tokens'),
        cacheCreation: delta('cache_write_input_tokens')
    };
    if (day === '' || model === '') return null;
    return {
        tool: 'codex',
        account,
        day,
        model,
        ...tokens
    };
}

async function foldFile(file: Found): Promise<UsageDay[]> {
    const rows = new Map<string, UsageDay>();
    let model = '';
    const previous: Record<string, number> = {};
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
            const row =
                file.tool === 'claude'
                    ? claudeRow(value, file.account)
                    : codexRow(value, file.account, model, previous);
            if (row !== null) add(rows, row);
        }
    } catch {
        return [];
    }
    return [...rows.values()];
}

function files(accounts: UsageAccountConfig[], now: number): Found[] {
    const found: Found[] = [];
    const roots = new Set<string>();
    const cutoff = dayStart(now);
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
        if (roots.has(root)) continue;
        roots.add(root);
        const before = found.length;
        walk(root, account.tool, account.label, found);
        for (let at = found.length - 1; at >= before; at -= 1) {
            if (found[at].mtimeMs < cutoff) found.splice(at, 1);
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
            if (held === undefined || held.size !== file.size || held.mtimeMs !== file.mtimeMs) {
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
